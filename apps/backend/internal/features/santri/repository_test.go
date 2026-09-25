package santri

import (
	"database/sql"
	"errors"
	"testing"

	_ "modernc.org/sqlite"
)

func setupSantriRepositoryTestDB(t *testing.T) *sql.DB {
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
		name TEXT NOT NULL,
		role TEXT NOT NULL
	);
	CREATE TABLE santri (
		id INTEGER PRIMARY KEY,
		user_id INTEGER,
		updated_at DATETIME
	);`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("failed to create schema: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})
	return db
}

func TestFindPortalUsersReturnsOnlyPortalAccounts(t *testing.T) {
	db := setupSantriRepositoryTestDB(t)
	repo := NewRepository(db)

	if _, err := db.Exec("INSERT INTO users (email, name, role) VALUES (?, ?, ?)", "staff@example.com", "Staff", "bendahara"); err != nil {
		t.Fatalf("failed to insert staff: %v", err)
	}
	if _, err := db.Exec("INSERT INTO users (email, name, role) VALUES (?, ?, ?)", "wali@example.com", "Wali", "user"); err != nil {
		t.Fatalf("failed to insert portal user: %v", err)
	}

	users, err := repo.FindPortalUsers("")
	if err != nil {
		t.Fatalf("FindPortalUsers failed: %v", err)
	}
	if len(users) != 1 {
		t.Fatalf("expected one portal user, got %d", len(users))
	}
	if users[0].Email != "wali@example.com" || users[0].Role != "user" {
		t.Fatalf("unexpected portal user: %+v", users[0])
	}

	users, err = repo.FindPortalUsers("staff")
	if err != nil {
		t.Fatalf("FindPortalUsers search failed: %v", err)
	}
	if len(users) != 0 {
		t.Fatalf("expected staff search to return no portal users, got %d", len(users))
	}
}

func TestLinkUserRejectsNonPortalAccount(t *testing.T) {
	db := setupSantriRepositoryTestDB(t)
	repo := NewRepository(db)

	staffResult, err := db.Exec("INSERT INTO users (email, name, role) VALUES (?, ?, ?)", "staff@example.com", "Staff", "bendahara")
	if err != nil {
		t.Fatalf("failed to insert staff: %v", err)
	}
	staffID, err := staffResult.LastInsertId()
	if err != nil {
		t.Fatalf("failed to read staff id: %v", err)
	}
	portalResult, err := db.Exec("INSERT INTO users (email, name, role) VALUES (?, ?, ?)", "wali@example.com", "Wali", "user")
	if err != nil {
		t.Fatalf("failed to insert portal user: %v", err)
	}
	portalID, err := portalResult.LastInsertId()
	if err != nil {
		t.Fatalf("failed to read portal id: %v", err)
	}
	if _, err := db.Exec("INSERT INTO santri (id) VALUES (?)", 1); err != nil {
		t.Fatalf("failed to insert santri: %v", err)
	}

	if err := repo.LinkUser(1, int(portalID)); err != nil {
		t.Fatalf("expected portal user link to pass: %v", err)
	}
	if err := repo.LinkUser(1, int(staffID)); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected non-portal link to fail with sql.ErrNoRows, got %v", err)
	}
}
