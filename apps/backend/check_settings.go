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

	rows, err := db.Query("SELECT key, value, description FROM settings")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var key, value, desc string
		if err := rows.Scan(&key, &value, &desc); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("KEY: %s | VALUE: %s | DESC: %s\n", key, value, desc)
	}
}
