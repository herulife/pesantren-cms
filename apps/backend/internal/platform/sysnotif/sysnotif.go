package sysnotif

import (
	"context"
	"database/sql"
	"time"
)

// Item adalah satu notifikasi sistem (broadcast untuk semua admin).
type Item struct {
	ID        int    `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Link      string `json:"link"`
	CreatedAt string `json:"created_at"`
	Read      bool   `json:"read"`
}

// Emit mencatat notifikasi sistem baru yang akan dilihat semua admin.
// Dipanggil dari titik event (pendaftar PSB, donasi, pesan kontak,
// pembayaran, user baru). Gagal logging tidak pernah menggagalkan
// request utama — pemanggil cukup mencatat warning.
func Emit(ctx context.Context, db *sql.DB, typ, title, message, link string) error {
	if db == nil {
		return sql.ErrConnDone
	}
	_, err := db.ExecContext(ctx,
		`INSERT INTO sys_notifications (type, title, message, link) VALUES (?, ?, ?, ?)`,
		typ, title, message, link)
	return err
}

// List mengembalikan 50 notifikasi terbaru + jumlah yang belum dibaca user.
func List(ctx context.Context, db *sql.DB, userID int) ([]Item, int, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT n.id, n.type, n.title, n.message, n.link, n.created_at,
		       EXISTS(SELECT 1 FROM sys_notification_reads rd
		              WHERE rd.notification_id = n.id AND rd.user_id = ?) AS is_read
		FROM sys_notifications n
		ORDER BY n.id DESC
		LIMIT 50
	`, userID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []Item{}
	for rows.Next() {
		var it Item
		var createdAt string
		var isRead int
		if err := rows.Scan(&it.ID, &it.Type, &it.Title, &it.Message, &it.Link, &createdAt, &isRead); err != nil {
			return nil, 0, err
		}
		it.CreatedAt = parseSQLiteTime(createdAt)
		it.Read = isRead == 1
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	unread, err := UnreadCount(ctx, db, userID)
	if err != nil {
		return nil, 0, err
	}
	return items, unread, nil
}

// UnreadCount menghitung notifikasi yang belum dibaca user.
func UnreadCount(ctx context.Context, db *sql.DB, userID int) (int, error) {
	var n int
	err := db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM sys_notifications n
		WHERE NOT EXISTS (SELECT 1 FROM sys_notification_reads rd
		                  WHERE rd.notification_id = n.id AND rd.user_id = ?)
	`, userID).Scan(&n)
	return n, err
}

// MarkRead menandai satu notifikasi sebagai telah dibaca (idempoten).
func MarkRead(ctx context.Context, db *sql.DB, userID, notifID int) error {
	_, err := db.ExecContext(ctx,
		`INSERT OR IGNORE INTO sys_notification_reads (user_id, notification_id) VALUES (?, ?)`,
		userID, notifID)
	return err
}

// MarkAllRead menandai semua notifikasi sebagai telah dibaca (idempoten).
func MarkAllRead(ctx context.Context, db *sql.DB, userID int) error {
	_, err := db.ExecContext(ctx,
		`INSERT OR IGNORE INTO sys_notification_reads (user_id, notification_id)
		 SELECT ?, id FROM sys_notifications`,
		userID)
	return err
}

// parseSQLiteTime mengubah "2026-10-06 09:10:00" (CURRENT_TIMESTAMP = UTC)
// menjadi RFC3339 agar mudah diparsing frontend.
func parseSQLiteTime(raw string) string {
	t, err := time.Parse("2006-01-02 15:04:05", raw)
	if err != nil {
		return raw
	}
	return t.UTC().Format(time.RFC3339)
}
