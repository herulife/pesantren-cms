package payments

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newPaymentsTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	schema := `
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL
	);

	CREATE TABLE payments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		amount INTEGER NOT NULL,
		description TEXT NOT NULL,
		payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		status TEXT DEFAULT 'success',
		method TEXT DEFAULT 'admin',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO users (email, name, role) VALUES 
		('santri@example.com', 'Santri A', 'user'),
		('staff@example.com', 'Staff B', 'bendahara')`); err != nil {
		t.Fatalf("seed users: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return db
}

func TestCreateSetsPaymentDateWhenMissing(t *testing.T) {
	repo := NewRepository(newPaymentsTestDB(t))
	payment := &Payment{
		UserID:      1,
		Amount:      150000,
		Description: "SPP April",
		Status:      "success",
		Method:      "admin",
	}

	if err := repo.Create(payment); err != nil {
		t.Fatalf("Create returned error: %v", err)
	}
	if payment.PaymentDate == "" {
		t.Fatal("expected payment date to be filled automatically")
	}

	all, err := repo.GetAll()
	if err != nil {
		t.Fatalf("GetAll returned error: %v", err)
	}
	if len(all) != 1 {
		t.Fatalf("expected 1 payment, got %d", len(all))
	}
	if all[0].UserName != "Santri A" {
		t.Fatalf("expected joined user name, got %q", all[0].UserName)
	}
}

func TestGetUsersReturnsOnlyUserRole(t *testing.T) {
	repo := NewRepository(newPaymentsTestDB(t))

	users, err := repo.GetUsers()
	if err != nil {
		t.Fatalf("GetUsers returned error: %v", err)
	}
	if len(users) != 1 {
		t.Fatalf("expected 1 user with role=user, got %d", len(users))
	}
	if users[0].Email != "santri@example.com" {
		t.Fatalf("unexpected user returned: %+v", users[0])
	}
}
