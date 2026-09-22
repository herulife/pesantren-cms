// Package wanotif menyimpan log pengiriman WhatsApp (outbox) dan menjalankan
// kirim-ulang otomatis untuk notifikasi yang gagal (mis. gateway sempat
// terputus atau nomor tidak resmi). Baris dibuat saat notifikasi akan dikirim;
// status per baris dipakai panel admin untuk menunjukkan hasil kirim.
package wanotif

import (
	"context"
	"errors"
	"log"
	"strings"
	"sync"
	"time"

	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/whatsapp"
)

const (
	StatusPending = "pending"
	StatusSent    = "sent"
	StatusFailed  = "failed"
	StatusDead    = "dead"
)

// Record adalah satu baris log pengiriman WhatsApp.
type Record struct {
	ID             int64  `json:"id"`
	RegistrationID *int64 `json:"registration_id"`
	Kind           string `json:"kind"`
	Phone          string `json:"phone"`
	Message        string `json:"message"`
	Status         string `json:"status"`
	Error          string `json:"error,omitempty"`
	Attempts       int    `json:"attempts"`
	MaxAttempts    int    `json:"max_attempts"`
	NextRetryAt    string `json:"next_retry_at,omitempty"`
	SentAt         string `json:"sent_at,omitempty"`
	LastAttemptAt  string `json:"last_attempt_at,omitempty"`
	CreatedAt      string `json:"created_at"`
}

const defaultMaxAttempts = 3

// backoffSeconds adalah jeda sebelum retry berikutnya (attempt ke-1, -2, -3).
var backoffSeconds = []int{60, 300, 1800}

var (
	tableOnce sync.Once
	stopRetry = make(chan struct{})
)

func ensureTable() {
	tableOnce.Do(func() {
		if _, err := database.DB.Exec(`
			CREATE TABLE IF NOT EXISTS wa_notifications (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				registration_id INTEGER,
				kind TEXT NOT NULL DEFAULT 'psb',
				phone TEXT NOT NULL,
				message TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending',
				error TEXT,
				attempts INTEGER NOT NULL DEFAULT 0,
				max_attempts INTEGER NOT NULL DEFAULT 3,
				next_retry_at TEXT,
				sent_at TEXT,
				last_attempt_at TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_wa_notif_reg ON wa_notifications(registration_id);
			CREATE INDEX IF NOT EXISTS idx_wa_notif_status ON wa_notifications(status);
		`); err != nil {
			log.Printf("[wanotif] gagal membuat tabel: %v", err)
		}
	})
}

// Enqueue mencatat notifikasi lalu langsung mencoba kirim. Berguna bagi
// pemanggil agar kegagalan kirim tidak menggagalkan operasi inti (status dll.).
func Enqueue(ctx context.Context, registrationID *int64, kind, phone, message string) (*Record, error) {
	ensureTable()
	if phone == "" {
		return nil, errors.New("nomor tujuan kosong")
	}
	if strings.TrimSpace(message) == "" {
		return nil, errors.New("pesan kosong")
	}
	res, err := database.DB.ExecContext(ctx,
		`INSERT INTO wa_notifications (registration_id, kind, phone, message, status, max_attempts)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		registrationID, kind, phone, message, StatusPending, defaultMaxAttempts,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	rec, err := getByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return attempt(ctx, rec)
}

// Retry mengirim ulang satu baris secara manual (dari panel admin). Aman jika
// terpanggil saat baris sudah terkirim (no-op).
func Retry(ctx context.Context, id int64) (*Record, error) {
	ensureTable()
	rec, err := getByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rec.Status == StatusSent {
		return rec, nil
	}
	return attempt(ctx, rec)
}

// ListByRegistration mengembalikan log pengiriman untuk satu registrasi PSB,
// terbaru di atas.
func ListByRegistration(ctx context.Context, registrationID int64) ([]Record, error) {
	ensureTable()
	rows, err := database.DB.QueryContext(ctx,
		`SELECT id, registration_id, kind, phone, message, status,
		        COALESCE(error, ''), attempts, max_attempts,
		        COALESCE(next_retry_at, ''), COALESCE(sent_at, ''),
		        COALESCE(last_attempt_at, ''), COALESCE(created_at, '')
		   FROM wa_notifications WHERE registration_id = ? ORDER BY id DESC`,
		registrationID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Record
	for rows.Next() {
		var it Record
		if err := rows.Scan(
			&it.ID, &it.RegistrationID, &it.Kind, &it.Phone, &it.Message, &it.Status,
			&it.Error, &it.Attempts, &it.MaxAttempts,
			&it.NextRetryAt, &it.SentAt, &it.LastAttemptAt, &it.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

// StartRetrier menjalankan pengirim ulang berkala (failed/pending) dengan
// jeda sesuai next_retry_at. Dipanggil sekali saat aplikasi mulai.
func StartRetrier() {
	ensureTable()
	go func() {
		log.Printf("[wanotif] retrier WA aktif (interval 45s)")
		ticker := time.NewTicker(45 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-stopRetry:
				return
			case <-ticker.C:
				runPendingRetries()
			}
		}
	}()
}

func runPendingRetries() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	rows, err := database.DB.QueryContext(ctx,
		`SELECT id FROM wa_notifications
		  WHERE status IN ('pending', 'failed')
		    AND attempts < max_attempts
		    AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
		  ORDER BY id LIMIT 20`)
	if err != nil {
		log.Printf("[wanotif] retrier gagal query: %v", err)
		return
	}
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		log.Printf("[wanotif] retrier scan gagal: %v", err)
		return
	}

	for _, id := range ids {
		rec, err := getByID(ctx, id)
		if err != nil {
			continue
		}
		if rec.Status == StatusSent {
			continue
		}
		if _, err := attempt(ctx, rec); err != nil {
			log.Printf("[wanotif] retry %d gagal diproses: %v", id, err)
		}
	}
}

func attempt(ctx context.Context, rec *Record) (*Record, error) {
	if rec.Status == StatusSent {
		return rec, nil
	}
	sendErr := whatsapp.SendMessage(rec.Phone, rec.Message)
	attempts := rec.Attempts + 1

	if sendErr == nil {
		_, err := database.DB.ExecContext(ctx,
			`UPDATE wa_notifications
			    SET status = ?, error = NULL, attempts = ?, max_attempts = ?,
			        sent_at = CURRENT_TIMESTAMP, last_attempt_at = CURRENT_TIMESTAMP,
			        next_retry_at = NULL, updated_at = CURRENT_TIMESTAMP
			  WHERE id = ?`,
			StatusSent, attempts, rec.MaxAttempts, rec.ID,
		)
		if err != nil {
			return nil, err
		}
		log.Printf("[wanotif] %d terkirim ke %s", rec.ID, rec.Phone)
		return getByID(ctx, rec.ID)
	}

	status := StatusFailed
	next := ""
	if attempts >= rec.MaxAttempts {
		status = StatusDead
	} else {
		idx := attempts - 1
		if idx >= len(backoffSeconds) {
			idx = len(backoffSeconds) - 1
		}
		next = time.Now().Add(time.Duration(backoffSeconds[idx]) * time.Second).
			UTC().Format("2006-01-02 15:04:05")
	}

	_, err := database.DB.ExecContext(ctx,
		`UPDATE wa_notifications
		    SET status = ?, error = ?, attempts = ?, max_attempts = ?,
		        last_attempt_at = CURRENT_TIMESTAMP, next_retry_at = ?, updated_at = CURRENT_TIMESTAMP
		  WHERE id = ?`,
		status, truncate(sendErr.Error(), 500), attempts, rec.MaxAttempts, next, rec.ID,
	)
	if err != nil {
		return nil, err
	}
	log.Printf("[wanotif] %d gagal kirim (%s): %s", rec.ID, status, sendErr.Error())
	return getByID(ctx, rec.ID)
}

func getByID(ctx context.Context, id int64) (*Record, error) {
	var it Record
	err := database.DB.QueryRowContext(ctx,
		`SELECT id, registration_id, kind, phone, message, status,
		        COALESCE(error, ''), attempts, max_attempts,
		        COALESCE(next_retry_at, ''), COALESCE(sent_at, ''),
		        COALESCE(last_attempt_at, ''), COALESCE(created_at, '')
		   FROM wa_notifications WHERE id = ?`,
		id,
	).Scan(
		&it.ID, &it.RegistrationID, &it.Kind, &it.Phone, &it.Message, &it.Status,
		&it.Error, &it.Attempts, &it.MaxAttempts,
		&it.NextRetryAt, &it.SentAt, &it.LastAttemptAt, &it.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &it, nil
}

func truncate(s string, n int) string {
	runes := []rune(s)
	if len(runes) <= n {
		return s
	}
	return string(runes[:n])
}