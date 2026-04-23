package main

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "modernc.org/sqlite"
)

func main() {
	dbPath := strings.TrimSpace(os.Getenv("DB_PATH"))
	if dbPath == "" {
		dbPath = "./darussunnah.db"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Printf("Gagal membuka database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	if _, err := db.Exec("DROP TABLE IF EXISTS testimonials"); err != nil {
		fmt.Printf("Gagal menghapus tabel testimonials: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Tabel testimonials berhasil dihapus.")
}
