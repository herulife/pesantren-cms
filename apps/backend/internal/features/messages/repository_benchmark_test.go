package messages

import (
	"database/sql"
	"fmt"
	"testing"

	_ "modernc.org/sqlite"
)

func setupMessagesBenchmarkDB(b *testing.B) *sql.DB {
	b.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		b.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT,
		whatsapp TEXT,
		message TEXT NOT NULL,
		is_read BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX idx_messages_is_read_created_at ON messages(is_read, created_at DESC);
	`
	if _, err := db.Exec(schema); err != nil {
		b.Fatalf("create schema: %v", err)
	}

	tx, err := db.Begin()
	if err != nil {
		b.Fatalf("begin tx: %v", err)
	}
	stmt, err := tx.Prepare(`
		INSERT INTO messages (name, email, whatsapp, message, is_read, created_at)
		VALUES (?, ?, ?, ?, ?, datetime('now', ?))
	`)
	if err != nil {
		b.Fatalf("prepare insert: %v", err)
	}
	defer stmt.Close()

	for i := 0; i < 10000; i++ {
		if _, err := stmt.Exec(
			fmt.Sprintf("Pengirim %d", i),
			fmt.Sprintf("pengirim%d@example.com", i),
			fmt.Sprintf("08123%06d", i),
			fmt.Sprintf("Isi pesan benchmark %d", i),
			i%2 == 0,
			fmt.Sprintf("-%d seconds", i),
		); err != nil {
			b.Fatalf("insert messages: %v", err)
		}
	}
	if err := tx.Commit(); err != nil {
		b.Fatalf("commit seed: %v", err)
	}

	b.Cleanup(func() { _ = db.Close() })
	return db
}

func BenchmarkMessagesRepositoryFindAllUnread(b *testing.B) {
	db := setupMessagesBenchmarkDB(b)
	repo := NewRepository(db)
	isRead := false

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := repo.FindAll(&isRead, "pesan", 100, 0); err != nil {
			b.Fatalf("find unread: %v", err)
		}
	}
}

func BenchmarkMessagesRepositoryFindAllNoFilter(b *testing.B) {
	db := setupMessagesBenchmarkDB(b)
	repo := NewRepository(db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := repo.FindAll(nil, "", 100, 0); err != nil {
			b.Fatalf("find no filter: %v", err)
		}
	}
}
