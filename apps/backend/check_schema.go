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
		log.Fatalf("Error opening db: %v", err)
	}
	defer db.Close()

	rows, err := db.Query("PRAGMA table_info(news)")
	if err != nil {
		log.Fatalf("Error querying pragma: %v", err)
	}
	defer rows.Close()

	fmt.Println("Columns in 'news' table:")
	for rows.Next() {
		var cid int
		var name, dtype string
		var notnull, pk int
		var dflt_value interface{}
		err := rows.Scan(&cid, &name, &dtype, &notnull, &dflt_value, &pk)
		if err != nil {
			log.Fatalf("Error scanning info: %v", err)
		}
		fmt.Printf("- %s (%s)\n", name, dtype)
	}
}
