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

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM gallery").Scan(&count)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Total Gallery Items: %d\n", count)
	}

	rows, err := db.Query("SELECT id, title, category, image_url, created_at FROM gallery LIMIT 5")
	if err == nil {
		fmt.Println("Recent Items:")
		for rows.Next() {
			var id int
			var title, category, imageUrl, createdAt string
			rows.Scan(&id, &title, &category, &imageUrl, &createdAt)
			fmt.Printf("- [%d] %s (%s) @ %s\n", id, title, category, createdAt)
		}
		rows.Close()
	}
}
