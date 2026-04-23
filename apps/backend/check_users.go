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

	rows, err := db.Query("PRAGMA table_info(users)")
	if err != nil {
		log.Fatalf("Error checking users: %v", err)
	}
	defer rows.Close()

	fmt.Println("Users Table Schema:")
	for rows.Next() {
		var cid int
		var name, dtype string
		var notnull, pk int
		var dflt_value interface{}
		rows.Scan(&cid, &name, &dtype, &notnull, &dflt_value, &pk)
		fmt.Printf("- %s (%s)\n", name, dtype)
	}
}
