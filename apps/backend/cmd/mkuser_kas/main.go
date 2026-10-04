package main

import (
	"database/sql"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func main() {
	db, _ := sql.Open("sqlite", "/data/alma-parung.db")
	hash, _ := bcrypt.GenerateFromPassword([]byte("UjiKasJilid75"), bcrypt.DefaultCost)
	res, err := db.Exec(`INSERT INTO users (email,password_hash,name,role) VALUES (?,?,?,'superadmin')`,
		"kas.audit.uji@almaparung.local", string(hash), "Uji Audit Kas")
	if err != nil {
		panic(err)
	}
	id, _ := res.LastInsertId()
	fmt.Println("user uji id:", id)
}
