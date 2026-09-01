package attendance

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
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

	// Token is valid! Now record attendance with transaction to avoid race
	today := time.Now().Format("2006-01-02")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, "", err
	}
	defer tx.Rollback()
	var existingID int
	err = tx.QueryRow("SELECT id FROM attendance WHERE student_id = ? AND date = ?", userID, today).Scan(&existingID)
	if err == nil {
		return userID, studentName, errors.New("santri sudah terabsen hari ini")
	}
	_, err = tx.Exec("INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, 'hadir', 'Absen via QR Scan')", userID, today)
	if err != nil {
		if err.Error() == "UNIQUE constraint failed: attendance.student_id, attendance.date" || err.Error() == "UNIQUE constraint failed: attendance.student_id" {
			return userID, studentName, errors.New("santri sudah terabsen hari ini")
		}
		return 0, "", err
	}
	_, _ = tx.Exec("DELETE FROM user_qr_tokens WHERE token_hash = ? OR token_hash = ?", hashStr, token)
	if err := tx.Commit(); err != nil {
		return 0, "", err
	}

	return userID, studentName, nil
}

func (r *Repository) GetStudentInfo(userID int) (string, string, error) {
	var name, phone string
	err := r.db.QueryRow("SELECT name, COALESCE(whatsapp, '') FROM users WHERE id = ?", userID).Scan(&name, &phone)
	return name, phone, err
}
