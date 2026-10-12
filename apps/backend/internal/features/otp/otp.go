// Package otp menyediakan one-time passcode via kanal WhatsApp mandiri.
//
// Spesifikasi (PRD 6-7,37 / TAGIHAN_OPMODE): kode 6 digit, TTL 10 menit,
// cooldown request 60 detik per nomor+tujuan, maksimal 5x percobaan per kode.
// Hanya hash SHA-256 kode yang disimpan di database, bukan plaintext.
package otp

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"
)

const (
	// CodeTTL masa berlaku satu kode sejak dibuat.
	CodeTTL = 10 * time.Minute
	// RequestCooldown jeda minimal antar permintaan kode untuk nomor+tujuan sama.
	RequestCooldown = 60 * time.Second
	// MaxAttempts batas percobaan verifikasi per kode.
	MaxAttempts = 5
)

var (
	ErrCooldown = errors.New("terlalu cepat, tunggu sebentar sebelum meminta kode baru")
	ErrNotFound = errors.New("tidak ada kode OTP aktif untuk nomor ini")
	ErrExpired  = errors.New("kode OTP kedaluwarsa, minta kode baru")
	ErrLocked   = errors.New("terlalu banyak percobaan, minta kode baru")
	ErrMismatch = errors.New("kode OTP salah")
)

// Repository akses tabel otp_codes (dibuat otomatis di database.createTables).
type Repository struct {
	db *sql.DB
}

// NewRepository membuat repository OTP.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func hashCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

// GenerateCode membuat kode 6 digit dari crypto/rand.
func GenerateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()+100000), nil
}

// Request membuat kode baru untuk pasangan phone+purpose bila cooldown lewat.
// Mengembalikan kode plaintext untuk dikirim via WhatsApp oleh handler.
func (r *Repository) Request(ctx context.Context, phone, purpose string) (string, error) {
	now := time.Now().UTC()
	var lastCreated string
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(created_at, '') FROM otp_codes
		WHERE phone = ? AND purpose = ? AND consumed_at IS NULL
		ORDER BY id DESC LIMIT 1
	`, phone, purpose).Scan(&lastCreated)
	if err != nil && err != sql.ErrNoRows {
		return "", err
	}
	if err == nil {
		if ts, perr := time.Parse(time.DateTime, lastCreated); perr == nil {
			if now.Sub(ts) < RequestCooldown {
				return "", ErrCooldown
			}
		}
	}

	code, err := GenerateCode()
	if err != nil {
		return "", err
	}
	expires := now.Add(CodeTTL).Format(time.DateTime)
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO otp_codes (phone, purpose, code_hash, attempts, max_attempts, expires_at, created_at)
		VALUES (?, ?, ?, 0, ?, ?, ?)
	`, phone, purpose, hashCode(code), MaxAttempts, expires, now.Format(time.DateTime))
	if err != nil {
		return "", err
	}
	return code, nil
}

// Verify memeriksa kode untuk pasangan phone+purpose. Sukses menandai consumed
// sehingga kode tidak bisa dipakai ulang; gagal menambah attempts.
func (r *Repository) Verify(ctx context.Context, phone, purpose, code string) error {
	var id, attempts, maxAttempts int
	var storedHash, expiresAt string
	err := r.db.QueryRowContext(ctx, `
		SELECT id, code_hash, attempts, max_attempts, COALESCE(expires_at, '')
		FROM otp_codes
		WHERE phone = ? AND purpose = ? AND consumed_at IS NULL
		ORDER BY id DESC LIMIT 1
	`, phone, purpose).Scan(&id, &storedHash, &attempts, &maxAttempts, &expiresAt)
	if err == sql.ErrNoRows {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if maxAttempts <= 0 {
		maxAttempts = MaxAttempts
	}
	if exp, perr := time.Parse(time.DateTime, expiresAt); perr != nil || time.Now().UTC().After(exp) {
		_, _ = r.db.ExecContext(ctx, `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?`, id)
		return ErrExpired
	}
	if attempts >= maxAttempts {
		return ErrLocked
	}
	if subtle.ConstantTimeCompare([]byte(storedHash), []byte(hashCode(code))) != 1 {
		_, _ = r.db.ExecContext(ctx, `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`, id)
		return ErrMismatch
	}
	_, err = r.db.ExecContext(ctx, `UPDATE otp_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?`, id)
	return err
}
