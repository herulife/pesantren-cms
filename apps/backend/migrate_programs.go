//go:build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "./darussunnah.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	query := `
	CREATE TABLE IF NOT EXISTS programs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		category TEXT NOT NULL CHECK(category IN ('program', 'ekskul')),
		excerpt TEXT,
		content TEXT,
		image_url TEXT,
		is_featured BOOLEAN DEFAULT 0,
		order_index INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(query)
	if err != nil {
		log.Fatal("Failed to create table:", err)
	}

	fmt.Println("Table 'programs' successfully ensured!")
}
