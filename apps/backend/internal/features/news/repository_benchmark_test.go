package news

import (
	"database/sql"
	"fmt"
	"testing"

	_ "modernc.org/sqlite"
)

func setupNewsBenchmarkDB(b *testing.B) *sql.DB {
	b.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		b.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL
	);
	CREATE TABLE news (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		content TEXT NOT NULL,
		excerpt TEXT,
		category_id INTEGER,
		image_url TEXT,
		status TEXT DEFAULT 'draft',
		author_id INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX idx_news_status_created_at ON news(status, created_at DESC);
	CREATE INDEX idx_news_category_created_at ON news(category_id, created_at DESC);
	CREATE INDEX idx_news_author_created_at ON news(author_id, created_at DESC);
	`
	if _, err := db.Exec(schema); err != nil {
		b.Fatalf("create schema: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO categories (name, slug) VALUES ('Berita', 'berita'), ('Akademik', 'akademik')`); err != nil {
		b.Fatalf("seed categories: %v", err)
	}

	tx, err := db.Begin()
	if err != nil {
		b.Fatalf("begin tx: %v", err)
	}
	stmt, err := tx.Prepare(`
		INSERT INTO news (title, slug, content, excerpt, category_id, image_url, status, author_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
	`)
	if err != nil {
		b.Fatalf("prepare insert: %v", err)
	}
	defer stmt.Close()

	for i := 0; i < 5000; i++ {
		categoryID := 1
		if i%3 == 0 {
			categoryID = 2
		}
		status := "published"
		if i%7 == 0 {
			status = "draft"
		}
		if _, err := stmt.Exec(
			fmt.Sprintf("Judul Berita %d", i),
			fmt.Sprintf("judul-berita-%d", i),
			fmt.Sprintf("Konten berita panjang %d lorem ipsum dolor sit amet", i),
			fmt.Sprintf("Excerpt %d", i),
			categoryID,
			fmt.Sprintf("https://example.com/image-%d.jpg", i),
			status,
			(i%25)+1,
			fmt.Sprintf("-%d minutes", i),
			fmt.Sprintf("-%d minutes", i),
		); err != nil {
			b.Fatalf("insert news: %v", err)
		}
	}
	if err := tx.Commit(); err != nil {
		b.Fatalf("commit seed: %v", err)
	}

	b.Cleanup(func() { _ = db.Close() })
	return db
}

func BenchmarkNewsRepositoryFindAll(b *testing.B) {
	db := setupNewsBenchmarkDB(b)
	repo := NewRepository(db)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, _, err := repo.FindAll("published", "berita", "Berita", 20, 0); err != nil {
			b.Fatalf("find all: %v", err)
		}
	}
}
