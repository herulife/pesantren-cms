package logger

import (
	"darussunnah-api/internal/platform/database"
	"log"
)

// RecordActivity saves an administrative action to the activity_logs table
func RecordActivity(userID *int, action string, details string, ip string, userAgent string) {
	query := `
		INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
		VALUES (?, ?, ?, ?, ?)
	`
	_, err := database.DB.Exec(query, userID, action, details, ip, userAgent)
	if err != nil {
		log.Printf("[Logger] Error recording activity: %v", err)
	}
}
