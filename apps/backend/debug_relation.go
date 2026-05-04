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

	fmt.Println("--- SUBJECTS ---")
	rows, _ := db.Query("SELECT id, name, code FROM subjects")
	for rows.Next() {
		var id int
		var name, code string
		rows.Scan(&id, &name, &code)
		fmt.Printf("[%d] %s (%s)\n", id, name, code)
	}

	fmt.Println("\n--- EXAMS WITH SUBJECT ---")
	rows, _ = db.Query("SELECT e.id, e.title, e.subject_id FROM exams e")
	for rows.Next() {
		var id, sid int
		var title string
		rows.Scan(&id, &title, &sid)
		fmt.Printf("[%d] %s (SubjectID: %d)\n", id, title, sid)
	}
}
