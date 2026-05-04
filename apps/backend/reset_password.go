//go:build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "./darussunnah.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	password := "password123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	_, err = db.Exec("UPDATE users SET password_hash = ? WHERE email = ?", string(hash), "dummy.student.01@example.test")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Password reset for dummy.student.01@example.test to 'password123'")
}
