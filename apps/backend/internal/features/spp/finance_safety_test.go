package spp

// PHASE 6/71: uji concurrent untuk double-pay + idempotency + cancel reversal.
// Expected: 1 transaksi bisnis sukses, sisanya konflik/idempoten yang aman.
// TIDAK boleh ada ledger/receipt ganda.

import (
	"almaparung-api/internal/platform/finance"
	"database/sql"
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	_ "modernc.org/sqlite"
)

func newFinanceTestDB(t *testing.T) *sql.DB {
	t.Helper()
	path := t.TempDir() + "/fin_test.db"
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(8)
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;`); err != nil {
		t.Fatalf("pragma: %v", err)
	}
	schema := `
	CREATE TABLE santri (id INTEGER PRIMARY KEY AUTOINCREMENT, nis TEXT, name TEXT, class TEXT, status TEXT DEFAULT 'aktif', user_id INTEGER);
	CREATE TABLE spp_bills (id INTEGER PRIMARY KEY AUTOINCREMENT, santri_id INTEGER NOT NULL, period TEXT NOT NULL, amount INTEGER NOT NULL, paid_amount INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'unpaid', due_date TEXT DEFAULT '', paid_method TEXT DEFAULT '', paid_at DATETIME, notes TEXT DEFAULT '', payment_proof TEXT DEFAULT '', pending_amount INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(santri_id, period));
	CREATE TABLE payment_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT DEFAULT '', date TEXT DEFAULT '', santri_id INTEGER, bill_type TEXT, bill_id INTEGER, bill_period TEXT DEFAULT '', description TEXT DEFAULT '', amount INTEGER, method TEXT DEFAULT '', created_by INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, idempotency_key TEXT);
	CREATE TABLE receipts (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_no TEXT, santri_id INTEGER, period TEXT, description TEXT, total INTEGER, method TEXT, created_by INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO santri (nis, name, class, status) VALUES ('9001','Uji Konkurensi','VII Putra','aktif')`); err != nil {
		t.Fatalf("seed santri: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

func seedBill(t *testing.T, db *sql.DB, period string, amount int) int {
	t.Helper()
	res, err := db.Exec(`INSERT INTO spp_bills (santri_id, period, amount, due_date) VALUES (1, ?, ?, '2026-01-10')`, period, amount)
	if err != nil {
		t.Fatalf("seed bill: %v", err)
	}
	id, _ := res.LastInsertId()
	return int(id)
}

func ledgerCount(t *testing.T, db *sql.DB, billID int) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM payment_transactions WHERE bill_type='SPP' AND bill_id=? AND amount > 0`, billID).Scan(&n); err != nil {
		t.Fatalf("count ledger: %v", err)
	}
	return n
}

func TestConcurrentPaySingleWinner(t *testing.T) {
	db := newFinanceTestDB(t)
	repo := NewRepository(db)
	billID := seedBill(t, db, "2026-01", 100000)

	const workers = 100
	var okCount, paidCount, otherCount int64
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			switch err := repo.PayBill(billID, 100000, "transfer", "", "", 1); {
			case err == nil:
				atomic.AddInt64(&okCount, 1)
			case errors.Is(err, errBillAlreadyPaid):
				atomic.AddInt64(&paidCount, 1)
			default:
				atomic.AddInt64(&otherCount, 1)
				t.Errorf("unexpected error: %v", err)
			}
		}()
	}
	wg.Wait()

	if okCount != 1 {
		t.Fatalf("expected exactly 1 winner, got %d (paid=%d other=%d)", okCount, paidCount, otherCount)
	}
	if paidCount != workers-1 {
		t.Fatalf("expected %d conflicts, got %d", workers-1, paidCount)
	}
	if n := ledgerCount(t, db, billID); n != 1 {
		t.Fatalf("expected 1 ledger row, got %d", n)
	}
	var receipts int
	if err := db.QueryRow(`SELECT COUNT(*) FROM receipts`).Scan(&receipts); err != nil || receipts != 1 {
		t.Fatalf("expected 1 receipt, got %d (err=%v)", receipts, err)
	}
	var paid, status string
	var paidAmt int
	if err := db.QueryRow(`SELECT paid_amount, status FROM spp_bills WHERE id=?`, billID).Scan(&paidAmt, &status); err != nil {
		t.Fatal(err)
	}
	_ = paid
	if paidAmt != 100000 || status != "paid" {
		t.Fatalf("bill state corrupt: paid=%d status=%s", paidAmt, status)
	}
}

func TestIdempotentReplay(t *testing.T) {
	db := newFinanceTestDB(t)
	repo := NewRepository(db)
	billID := seedBill(t, db, "2026-02", 50000)

	if err := repo.PayBillWithKey(billID, 50000, "transfer", "", "", 1, "test-key-1"); err != nil {
		t.Fatalf("first pay: %v", err)
	}
	if err := repo.PayBillWithKey(billID, 50000, "transfer", "", "", 1, "test-key-1"); !errors.Is(err, finance.ErrIdempotentReplay) {
		t.Fatalf("expected ErrIdempotentReplay, got %v", err)
	}
	if n := ledgerCount(t, db, billID); n != 1 {
		t.Fatalf("expected 1 ledger row after replay, got %d", n)
	}
}

func TestCancelReversal(t *testing.T) {
	db := newFinanceTestDB(t)
	repo := NewRepository(db)
	billID := seedBill(t, db, "2026-03", 75000)

	if err := repo.PayBill(billID, 75000, "tunai", "", "", 1); err != nil {
		t.Fatalf("pay: %v", err)
	}
	if err := repo.CancelBill(billID); err != nil {
		t.Fatalf("cancel: %v", err)
	}
	var paid int
	var status string
	if err := db.QueryRow(`SELECT paid_amount, status FROM spp_bills WHERE id=?`, billID).Scan(&paid, &status); err != nil {
		t.Fatal(err)
	}
	if paid != 0 || status != "unpaid" {
		t.Fatalf("bill not reset: paid=%d status=%s", paid, status)
	}
	var rev int
	if err := db.QueryRow(`SELECT COUNT(*) FROM payment_transactions WHERE bill_id=? AND amount < 0`, billID).Scan(&rev); err != nil || rev != 1 {
		t.Fatalf("expected 1 reversal row, got %d (err=%v)", rev, err)
	}
	var total int
	if err := db.QueryRow(`SELECT COALESCE(SUM(total),0) FROM receipts`).Scan(&total); err != nil || total != 0 {
		t.Fatalf("expected receipt total 0 after cancel, got %d (err=%v)", total, err)
	}
	// Cancel kedua: sudah unpaid -> not found (bukan error ganda).
	if err := repo.CancelBill(billID); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected ErrNoRows on second cancel, got %v", err)
	}
}
