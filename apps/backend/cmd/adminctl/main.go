package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "reset-password":
		if err := runResetPassword(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	default:
		usage()
		os.Exit(1)
	}
}

func usage() {
	fmt.Println("adminctl - Al-Maa admin utility")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  adminctl reset-password --db ./alma.db --email admin@almaparung.com --password \"NewStrongPassword!\"")
}

func runResetPassword(args []string) error {
	fs := flag.NewFlagSet("reset-password", flag.ContinueOnError)
	dbPath := fs.String("db", "./alma.db", "path to SQLite database")
	email := fs.String("email", "", "user email to update")
	password := fs.String("password", "", "new plain-text password")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if strings.TrimSpace(*email) == "" {
		return fmt.Errorf("--email is required")
	}
	if len(*password) < 8 {
		return fmt.Errorf("--password must be at least 8 characters")
	}

	db, err := sql.Open("sqlite", *dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	hash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	res, err := db.Exec("UPDATE users SET password_hash = ? WHERE lower(email) = lower(?)", string(hash), *email)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("user not found: %s", *email)
	}

	fmt.Printf("Password updated for %s\n", *email)
	return nil
}
