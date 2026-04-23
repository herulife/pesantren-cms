package attendance

import (
	"crypto/rand"
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
	// 1. Generate 32 bytes of random data for the token
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)

	// 2. Set expiry to 5 minutes from now
	expiresAt := time.Now().Add(5 * time.Minute)

	// Refined strategy: Delete expired tokens for this user first
	_, _ = r.db.Exec("DELETE FROM user_qr_tokens WHERE user_id = ? OR expires_at < ?", userID, time.Now())

	_, err := r.db.Exec("INSERT INTO user_qr_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
		userID, token, expiresAt)
	if err != nil {
		return "", err
	}

	return token, nil
}

// ValidateAndRecordAttendance checks if the token is valid and records attendance
func (r *Repository) ValidateAndRecordAttendance(token string) (int, string, error) {
	var userID int
	var studentName, studentPhone string
	var expiresAtStr string

	query := `
		SELECT q.user_id, u.name, COALESCE(u.whatsapp, ''), q.expires_at
		FROM user_qr_tokens q
		JOIN users u ON q.user_id = u.id
		WHERE q.token_hash = ?
	`
	err := r.db.QueryRow(query, token).Scan(&userID, &studentName, &studentPhone, &expiresAtStr)
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

	// Token is valid! Now record attendance.
	today := time.Now().Format("2006-01-02")

	// Check if already present today
	var existingID int
	err = r.db.QueryRow("SELECT id FROM attendance WHERE student_id = ? AND date = ?", userID, today).Scan(&existingID)
	if err == nil {
		return userID, studentName, errors.New("santri sudah terabsen hari ini")
	}

	_, err = r.db.Exec("INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, 'hadir', 'Absen via QR Scan')", userID, today)
	if err != nil {
		return 0, "", err
	}

	// Clean up the token used
	_, _ = r.db.Exec("DELETE FROM user_qr_tokens WHERE token_hash = ?", token)

	return userID, studentName, nil
}

func (r *Repository) GetStudentInfo(userID int) (string, string, error) {
	var name, phone string
	err := r.db.QueryRow("SELECT name, COALESCE(whatsapp, '') FROM users WHERE id = ?", userID).Scan(&name, &phone)
	return name, phone, err
}
