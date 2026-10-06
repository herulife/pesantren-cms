//go:build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("usage: go run j82_makeadmin.go <dbpath> [insert]")
	}
	db, err := sql.Open("sqlite", os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	rows, err := db.Query("PRAGMA table_info(users)")
	if err != nil {
		log.Fatal(err)
	}
	var cols []string
	type cinfo struct {
		name, typ string
	}
	var infos []cinfo
	var cid, pk int
	var name, typ, notnull string
	var dflt sql.NullString
	for rows.Next() {
		if err := rows.Scan(&cid, &name, &typ, &notnull, &dflt, &pk); err != nil {
			log.Fatal(err)
		}
		infos = append(infos, cinfo{name: name, typ: typ})
		cols = append(cols, name)
	}
	rows.Close()
	fmt.Println("columns:", strings.Join(cols, ","))

	if len(os.Args) < 3 || os.Args[2] != "insert" {
		return
	}

	email := "admin.j82uji@local.test"
	pass := "UjiJ82!2026"
	hash, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)

	var existing int
	_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", email).Scan(&existing)
	if existing > 0 {
		fmt.Println("user already exists, skipping")
		return
	}

	insCols, insVals, args := []string{}, []string{}, []interface{}{}
	for _, c := range infos {
		switch c.name {
		case "email":
			insCols = append(insCols, c.name)
			insVals = append(insVals, "?")
			args = append(args, email)
		case "password_hash":
			insCols = append(insCols, c.name)
			insVals = append(insVals, "?")
			args = append(args, string(hash))
		case "name":
			insCols = append(insCols, c.name)
			insVals = append(insVals, "?")
			args = append(args, "Uji Jilid 82")
		case "role", "user_role":
			insCols = append(insCols, c.name)
			insVals = append(insVals, "?")
			args = append(args, "bendahara")
		case "created_at", "updated_at":
			insCols = append(insCols, c.name)
			insVals = append(insVals, "?")
			args = append(args, "2026-10-06T08:00:00Z")
		}
	}
	q := fmt.Sprintf("INSERT INTO users (%s) VALUES (%s)", strings.Join(insCols, ","), strings.Join(insVals, ","))
	res, err := db.Exec(q, args...)
	if err != nil {
		log.Fatal("insert failed: ", err)
	}
	id, _ := res.LastInsertId()
	fmt.Printf("inserted user id=%d email=%s role=bendahara pass=%s\n", id, email, pass)
}