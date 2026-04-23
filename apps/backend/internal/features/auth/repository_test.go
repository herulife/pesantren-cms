package auth

import (
	"database/sql"
	"testing"
)

func setupAuthTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login_at DATETIME
	);`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("failed to create schema: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})
	return db
}

func TestCreateUserAndFindByEmail(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "user@example.com",
		PasswordHash: "12345678",
		Name:         "User Test",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if u.ID == 0 {
		t.Fatal("expected generated user ID")
	}
	if u.PasswordHash != "" {
		t.Fatal("expected password hash to be cleared after create")
	}

	found, err := repo.FindByEmail("user@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}
	if found.Email != "user@example.com" {
		t.Fatalf("unexpected email: %s", found.Email)
	}
	if found.PasswordHash == "12345678" || found.PasswordHash == "" {
		t.Fatal("expected hashed password in database")
	}
}

func TestCheckPassword(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "check@example.com",
		PasswordHash: "12345678",
		Name:         "Check User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	found, err := repo.FindByEmail("check@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}

	if err := repo.CheckPassword(found.PasswordHash, "12345678"); err != nil {
		t.Fatalf("expected password check to pass, got: %v", err)
	}
	if err := repo.CheckPassword(found.PasswordHash, "wrongpass"); err == nil {
		t.Fatal("expected password check to fail for wrong password")
	}
}

func TestUpdateRoleValidation(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "role@example.com",
		PasswordHash: "12345678",
		Name:         "Role User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if err := repo.UpdateRole(u.ID, "superadmin"); err != nil {
		t.Fatalf("expected valid role update to pass, got: %v", err)
	}
	if err := repo.UpdateRole(u.ID, "invalid_role"); err == nil {
		t.Fatal("expected invalid role update to fail")
	}
}

func TestUpdatePassword(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "password@example.com",
		PasswordHash: "12345678",
		Name:         "Password User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if err := repo.UpdatePassword(u.ID, "newpassword123"); err != nil {
		t.Fatalf("UpdatePassword failed: %v", err)
	}

	found, err := repo.FindByEmail("password@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}
	if err := repo.CheckPassword(found.PasswordHash, "newpassword123"); err != nil {
		t.Fatalf("expected new password to match, got: %v", err)
	}
}
