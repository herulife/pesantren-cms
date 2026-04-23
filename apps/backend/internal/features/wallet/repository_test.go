package wallet

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newWalletTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	schema := `
	CREATE TABLE user_wallets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL UNIQUE,
		balance REAL DEFAULT 0,
		pin_hash TEXT,
		is_active BOOLEAN DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE wallet_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		wallet_id INTEGER NOT NULL,
		type TEXT NOT NULL,
		amount REAL NOT NULL,
		reference_id TEXT,
		description TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return db
}

func TestSetPINCreatesWalletIfMissing(t *testing.T) {
	repo := NewRepository(newWalletTestDB(t))

	if err := repo.SetPIN(10, "1234"); err != nil {
		t.Fatalf("SetPIN returned error: %v", err)
	}

	match, err := repo.VerifyPIN(10, "1234")
	if err != nil {
		t.Fatalf("VerifyPIN returned error: %v", err)
	}
	if !match {
		t.Fatal("expected stored PIN to match")
	}
}

func TestProcessTransactionCreatesWalletForFirstTopUp(t *testing.T) {
	repo := NewRepository(newWalletTestDB(t))

	err := repo.ProcessTransaction(22, &Transaction{
		Type:        "deposit",
		Amount:      5000,
		ReferenceID: "ADMIN_TOPUP_22",
		Description: "Top up awal",
	})
	if err != nil {
		t.Fatalf("ProcessTransaction returned error: %v", err)
	}

	wallet, err := repo.GetOrCreateByUserID(22)
	if err != nil {
		t.Fatalf("GetOrCreateByUserID returned error: %v", err)
	}
	if wallet.Balance != 5000 {
		t.Fatalf("expected balance 5000, got %v", wallet.Balance)
	}

	history, err := repo.GetHistory(22, 10)
	if err != nil {
		t.Fatalf("GetHistory returned error: %v", err)
	}
	if len(history) != 1 {
		t.Fatalf("expected 1 transaction, got %d", len(history))
	}
}
