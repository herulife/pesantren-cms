package logs

import (
	"database/sql"
	"fmt"
	"testing"

	_ "modernc.org/sqlite"
)

func setupLogsBenchmarkDB(b *testing.B) *sql.DB {
	b.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		b.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL
	);
	CREATE TABLE activity_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		action TEXT NOT NULL,
		details TEXT,
		ip_address TEXT,
		user_agent TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX idx_activity_logs_user_created_at ON activity_logs(user_id, created_at DESC);
	`
	if _, err := db.Exec(schema); err != nil {
		b.Fatalf("create schema: %v", err)
	}

	tx, err := db.Begin()
	if err != nil {
		b.Fatalf("begin tx: %v", err)
	}
	userStmt, err := tx.Prepare(`INSERT INTO users (name) VALUES (?)`)
	if err != nil {
		b.Fatalf("prepare user: %v", err)
	}
	defer userStmt.Close()
	for i := 0; i < 200; i++ {
		if _, err := userStmt.Exec(fmt.Sprintf("User %d", i)); err != nil {
			b.Fatalf("insert user: %v", err)
		}
	}

	logStmt, err := tx.Prepare(`
		INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at)
		VALUES (?, ?, ?, ?, ?, datetime('now', ?))
	`)
	if err != nil {
		b.Fatalf("prepare logs: %v", err)
	}
	defer logStmt.Close()

	for i := 0; i < 7000; i++ {
		if _, err := logStmt.Exec(
			(i%200)+1,
			fmt.Sprintf("ACTION_%d", i%20),
			fmt.Sprintf("detail log %d", i),
			"127.0.0.1",
			"benchmark-agent",
			fmt.Sprintf("-%d seconds", i),
		); err != nil {
			b.Fatalf("insert log: %v", err)
		}
	}
	if err := tx.Commit(); err != nil {
		b.Fatalf("commit seed: %v", err)
	}

	b.Cleanup(func() { _ = db.Close() })
	return db
}

func BenchmarkLogsRepositoryGetAllNoSearch(b *testing.B) {
	db := setupLogsBenchmarkDB(b)
	repo := NewRepository(db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, _, err := repo.GetAll(50, 0, ""); err != nil {
			b.Fatalf("get all no search: %v", err)
		}
	}
}

func BenchmarkLogsRepositoryGetAllWithSearch(b *testing.B) {
	db := setupLogsBenchmarkDB(b)
	repo := NewRepository(db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, _, err := repo.GetAll(50, 0, "ACTION_1"); err != nil {
			b.Fatalf("get all with search: %v", err)
		}
	}
}
