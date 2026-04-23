package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"darussunnah-api/internal/platform/database"
)

type paymentSeed struct {
	UserID      int64
	Amount      int
	Description string
	Status      string
	Method      string
	PaymentDate string
}

func main() {
	dbPath := strings.TrimSpace(os.Getenv("DB_PATH"))
	if dbPath == "" {
		dbPath = "./darussunnah.db"
	}

	database.Connect(dbPath)
	db := database.DB
	defer db.Close()

	paymentCount := getEnvInt("DUMMY_PAYMENTS", 18)

	if err := seedPayments(db, paymentCount); err != nil {
		log.Fatalf("seed payments failed: %v", err)
	}

	fmt.Printf("Payment dummy created successfully: %d payments.\n", paymentCount)
}

func seedPayments(db *sql.DB, paymentCount int) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	userIDs, err := getDummyStudentIDs(tx)
	if err != nil {
		return err
	}
	if len(userIDs) == 0 {
		return fmt.Errorf("dummy student belum ada, jalankan seed akademik dulu")
	}

	if _, err = tx.Exec(`DELETE FROM payments WHERE description LIKE 'Dummy SPP %' OR description LIKE 'Dummy Daftar Ulang %' OR description LIKE 'Dummy Uang Kegiatan %'`); err != nil {
		return err
	}

	seeds := buildPaymentSeeds(userIDs, paymentCount)
	for _, item := range seeds {
		if _, err := tx.Exec(
			`INSERT INTO payments (user_id, amount, description, status, method, payment_date, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			item.UserID,
			item.Amount,
			item.Description,
			item.Status,
			item.Method,
			item.PaymentDate,
			item.PaymentDate,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func buildPaymentSeeds(userIDs []int64, count int) []paymentSeed {
	if count <= 0 || len(userIDs) == 0 {
		return nil
	}

	descriptions := []struct {
		label  string
		amount int
		method string
		status string
	}{
		{label: "Dummy SPP Juli 2026", amount: 650000, method: "transfer", status: "success"},
		{label: "Dummy SPP Agustus 2026", amount: 650000, method: "transfer", status: "success"},
		{label: "Dummy SPP September 2026", amount: 650000, method: "cash", status: "pending"},
		{label: "Dummy Uang Kegiatan Muharram", amount: 250000, method: "transfer", status: "success"},
		{label: "Dummy Daftar Ulang Semester Ganjil", amount: 900000, method: "manual", status: "pending"},
		{label: "Dummy SPP Oktober 2026", amount: 650000, method: "transfer", status: "failed"},
	}

	var seeds []paymentSeed
	for index := 0; index < count; index++ {
		userID := userIDs[index%len(userIDs)]
		template := descriptions[index%len(descriptions)]
		paymentDate := time.Now().AddDate(0, 0, -index).Format("2006-01-02 15:04:05")

		seeds = append(seeds, paymentSeed{
			UserID:      userID,
			Amount:      template.amount + (index%3)*25000,
			Description: template.label,
			Status:      template.status,
			Method:      template.method,
			PaymentDate: paymentDate,
		})
	}

	return seeds
}

func getDummyStudentIDs(tx *sql.Tx) ([]int64, error) {
	rows, err := tx.Query(`SELECT id FROM users WHERE email LIKE 'dummy.student.%@example.test' ORDER BY id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, nil
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	var result int
	if _, err := fmt.Sscanf(value, "%d", &result); err != nil || result < 0 {
		return fallback
	}

	return result
}
