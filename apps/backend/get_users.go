//go:build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./darussunnah.db"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	defer db.Close()

	if err := printRecentUsers(db); err != nil {
		log.Fatalf("Application error: %v", err)
	}
}

// printRecentUsers queries the database and prints the first 10 users
func printRecentUsers(db *sql.DB) error {
	rows, err := db.Query("SELECT * FROM users LIMIT 10")
	if err != nil {
		return fmt.Errorf("error query: %w", err)
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return fmt.Errorf("error getting columns: %w", err)
	}
	fmt.Printf("Columns: %v\n", cols)

	for rows.Next() {
		values := make([]interface{}, len(cols))
		pointers := make([]interface{}, len(cols))
		for i := range values {
			pointers[i] = &values[i]
		}

		if err := rows.Scan(pointers...); err != nil {
			return fmt.Errorf("error scanning row: %w", err)
		}

		for i, v := range values {
			// Convert bytes to string
			if b, ok := v.([]byte); ok {
				fmt.Printf("%s: %s | ", cols[i], string(b))
			} else {
				fmt.Printf("%s: %v | ", cols[i], v)
			}
		}
		fmt.Println()
	}

	if err = rows.Err(); err != nil {
		return fmt.Errorf("error during iteration: %w", err)
	}

	return nil
}
