package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "./darussunnah.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("--- DEBUGGING DATA UJI COBA ---")

	// 1. Check User
	var userID int
	var email string
	err = db.QueryRow("SELECT id, email FROM users WHERE email = 'dummy.student.01@example.test'").Scan(&userID, &email)
	if err != nil {
		fmt.Printf("User not found: %v\n", err)
	} else {
		fmt.Printf("User: %s (ID: %d)\n", email, userID)
	}

	// 2. Check Wallet
	var balance float64
	var hasPin bool
	var pinHash sql.NullString
	err = db.QueryRow("SELECT balance, pin_hash FROM user_wallets WHERE user_id = ?", userID).Scan(&balance, &pinHash)
	if err != nil {
		fmt.Printf("Wallet not found for ID %d: %v\n", userID, err)
	} else {
		hasPin = pinHash.Valid && pinHash.String != ""
		fmt.Printf("Wallet Balance: %.2f | Has PIN: %v\n", balance, hasPin)
	}

	// 3. Check Exams
	rows, _ := db.Query("SELECT id, title, start_time, end_time FROM exams")
	fmt.Println("\n--- EXAMS LIST ---")
	for rows.Next() {
		var id int
		var title string
		var start, end sql.NullString
		rows.Scan(&id, &title, &start, &end)
		fmt.Printf("[%d] %s (S: %s, E: %s)\n", id, title, start.String, end.String)
		
		// Check Questions inside
		var qCount int
		db.QueryRow("SELECT COUNT(*) FROM exam_questions WHERE exam_id = ?", id).Scan(&qCount)
		fmt.Printf("    -> Questions count: %d\n", qCount)
	}
	
	now := time.Now()
	fmt.Printf("\nCurrent Server Time: %v\n", now)
}
