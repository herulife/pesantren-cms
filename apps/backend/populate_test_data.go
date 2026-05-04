//go:build ignore

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

	// 1. Ensure Subject exists
	_, _ = db.Exec("INSERT INTO subjects (name, code) VALUES ('Uji Coba CBT', 'TEST01')")
	var subjectID int
	db.QueryRow("SELECT id FROM subjects WHERE code = 'TEST01'").Scan(&subjectID)

	// 2. Create Exam (Start 1 hour ago to ensure availability)
	now := time.Now().UTC()
	startTime := now.Add(-1 * time.Hour)
	endTime := now.Add(24 * time.Hour)
	_, _ = db.Exec("DELETE FROM exams WHERE title = 'Simulasi Ujian Akhir Ganjil'")
	_, err = db.Exec(`
		INSERT INTO exams (subject_id, title, academic_year, semester, duration_minutes, start_time, end_time) 
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		subjectID, "Simulasi Ujian Akhir Ganjil", "2023/2024", "Ganjil", 60, startTime, endTime)
	
	var examID int
	db.QueryRow("SELECT id FROM exams WHERE title = 'Simulasi Ujian Akhir Ganjil'").Scan(&examID)

	// 3. Add Questions
	_, _ = db.Exec("DELETE FROM exam_questions WHERE exam_id = ?", examID)
	questions := []struct {
		Text    string
		Opts    string
		Correct int
	}{
		{"Siapakah pendiri Darussunnah?", "[\"Kyai A\", \"Kyai B\", \"Kyai C\", \"Kyai D\"]", 0},
		{"Berapa rukun Islam?", "[\"4\", \"5\", \"6\", \"7\"]", 1},
		{"Apa ibu kota Indonesia?", "[\"Bandung\", \"Jakarta\", \"Surabaya\", \"Medan\"]", 1},
	}

	for _, q := range questions {
		_, _ = db.Exec(`
			INSERT INTO exam_questions (exam_id, question_text, options_json, correct_answer_key, points) 
			VALUES (?, ?, ?, ?, ?)`,
			examID, q.Text, q.Opts, q.Correct, 20)
	}

	// 4. Initialize Wallet for ID 42
	_, _ = db.Exec("DELETE FROM user_wallets WHERE user_id = 42")
	res, _ := db.Exec("INSERT INTO user_wallets (user_id, balance, is_active) VALUES (42, 250000, 1)")
	walletID, _ := res.LastInsertId()

	// 5. Add Transaction Log (So history is not empty)
	_, _ = db.Exec("DELETE FROM wallet_transactions WHERE wallet_id = ?", walletID)
	_, _ = db.Exec(`
		INSERT INTO wallet_transactions (wallet_id, type, amount, description) 
		VALUES (?, 'deposit', 250000, 'Saldo Awal Uji Coba')`, walletID)

	fmt.Println("Test data populated successfully!")
}
