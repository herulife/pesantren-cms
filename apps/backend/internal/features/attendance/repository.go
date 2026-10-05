package attendance

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)

type QRToken struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	TokenHash string    `json:"token_hash"`
	ExpiresAt time.Time `json:"expires_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GenerateToken creates a new random token for a student that expires in 5 minutes
func (r *Repository) GenerateToken(userID int) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)
	expiresAt := time.Now().Add(5 * time.Minute)

	// Use transaction to avoid race with concurrent generates
	tx, err := r.db.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()
	_, _ = tx.Exec("DELETE FROM user_qr_tokens WHERE user_id = ? OR expires_at < ?", userID, time.Now())
	// Store hash for security (compare hash on validate)
	h := sha256.Sum256([]byte(token))
	hashStr := hex.EncodeToString(h[:])
	_, err = tx.Exec("INSERT INTO user_qr_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
		userID, hashStr, expiresAt)
	if err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", err
	}
	return token, nil
}

// ValidateAndRecordAttendance checks if the token is valid and records attendance
func (r *Repository) ValidateAndRecordAttendance(token string) (int, string, error) {
	var userID int
	var studentName, studentPhone string
	var expiresAtStr string

	// Hash incoming token for comparison (supports both legacy plaintext and new hash)
	h := sha256.Sum256([]byte(token))
	hashStr := hex.EncodeToString(h[:])

	query := `
		SELECT q.user_id, u.name, COALESCE(u.whatsapp, ''), q.expires_at
		FROM user_qr_tokens q
		JOIN users u ON q.user_id = u.id
		WHERE q.token_hash = ? OR q.token_hash = ?
	`
	err := r.db.QueryRow(query, hashStr, token).Scan(&userID, &studentName, &studentPhone, &expiresAtStr)
	_ = context.Background()
	if err == sql.ErrNoRows {
		return 0, "", errors.New("token tidak valid atau tidak ditemukan")
	}
	if err != nil {
		return 0, "", err
	}

	expiresAt, _ := time.Parse("2006-01-02 15:04:05", expiresAtStr)
	// Some DBs store DATETIME differently, let's be safe.
	if expiresAt.IsZero() {
		// Try alternative parsing or just take the raw string if SQLite returns it in a different format
		// SQLite standard is "YYYY-MM-DD HH:MM:SS"
		// If it's 2026-04-20T08:46:13Z format:
		expiresAt, _ = time.Parse(time.RFC3339, expiresAtStr)
	}

	if time.Now().After(expiresAt) {
		return 0, "", errors.New("token sudah kedaluwarsa, silakan refresh QR code")
	}

	// Token valid. Presensi disimpan per Santri, jadi akun yang dipindai
	// harus diterjemahkan ke Santri-nya terlebih dahulu.
	students, err := r.resolveStudents(userID)
	if err != nil {
		return 0, "", err
	}

	today := time.Now().Format("2006-01-02")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, "", err
	}
	defer tx.Rollback()

	var names []string
	recorded := 0
	already := 0
	for _, stu := range students {
		names = append(names, stu.name)
		var existingID int
		if err := tx.QueryRow("SELECT id FROM attendance WHERE student_id = ? AND date = ?", stu.id, today).Scan(&existingID); err == nil {
			already++
			continue
		}
		if _, err := tx.Exec(
			"INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, 'hadir', 'Absen via QR Scan')",
			stu.id, today,
		); err != nil {
			if strings.Contains(err.Error(), "UNIQUE constraint failed: attendance") {
				already++
				continue
			}
			return 0, "", err
		}
		recorded++
	}
	if recorded == 0 {
		return 0, "", errors.New("santri sudah terabsen hari ini")
	}
	_, _ = tx.Exec("DELETE FROM user_qr_tokens WHERE token_hash = ? OR token_hash = ?", hashStr, token)
	if err := tx.Commit(); err != nil {
		return 0, "", err
	}
	studentName = strings.Join(names, ", ")
	if already > 0 && recorded == 0 {
		return 0, "", errors.New("santri sudah terabsen hari ini")
	}
	return userID, studentName, nil
}

type qrStudent struct {
	id   int
	name string
}

// resolveStudents memetakan akun portal ke Santri yang Dimiliki akun itu.
// Akun wali dengan beberapa anak akan menampilkan seluruh anaknya, sebab satu
// pindai QR mewakili kehadiran keluarga tersebut.
func (r *Repository) resolveStudents(userID int) ([]qrStudent, error) {
	rows, err := r.db.Query(
		"SELECT id, name FROM santri WHERE user_id = ? ORDER BY id" ,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []qrStudent{}
	for rows.Next() {
		var s qrStudent
		if err := rows.Scan(&s.id, &s.name); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	if len(out) == 0 {
		return nil, errors.New("akun ini belum terhubung ke data Santri")
	}
	return out, nil
}

// GetStudentInfo mengembalikan nama + nomor wali dari tabel Santri agar
// notifikasi WhatsApp tetap terkirim walaupun akun portal tidak punya nomor.
func (r *Repository) GetStudentInfo(userID int) (string, string, error) {
	var name, phone string
	err := r.db.QueryRow(
		`SELECT u.name, COALESCE(NULLIF(s.parent_phone, ''), NULLIF(s.father_phone, ''), NULLIF(s.mother_phone, ''), u.whatsapp, '')
		 FROM users u LEFT JOIN santri s ON s.user_id = u.id
		 WHERE u.id = ?` ,
		userID,
	).Scan(&name, &phone)
	return name, phone, err
}
