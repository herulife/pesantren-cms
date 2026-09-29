package main

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "file:/home/heru/alma-parung/data/alma-parung.db?mode=ro")
	if err != nil { fmt.Println("ERR", err); return }
	defer db.Close()
	rows, err := db.Query("SELECT id, kind, status, attempts, created_at FROM wa_notifications ORDER BY id DESC LIMIT 5")
	if err != nil { fmt.Println("ERR", err); return }
	defer rows.Close()
	fmt.Println("--- 5 notifikasi terakhir ---")
	for rows.Next() {
		var id, attempts int; var kind, status, created string
		_ = rows.Scan(&id, &kind, &status, &attempts, &created)
		fmt.Printf("  #%d %-32s %-8s attempts=%d %s\n", id, kind, status, attempts, created)
	}
	var n int
	_ = db.QueryRow("SELECT COUNT(*) FROM wa_notifications").Scan(&n)
	fmt.Println("total notifikasi:", n)
}
