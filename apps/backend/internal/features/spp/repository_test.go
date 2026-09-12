package spp

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newSppTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE santri (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nis TEXT NOT NULL,
		name TEXT NOT NULL,
		class TEXT NOT NULL,
		status TEXT DEFAULT 'aktif'
	);

	CREATE TABLE spp_bills (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER NOT NULL,
		period TEXT NOT NULL,
		amount INTEGER NOT NULL,
		paid_amount INTEGER NOT NULL DEFAULT 0,
		status TEXT NOT NULL DEFAULT 'unpaid',
		due_date TEXT DEFAULT '',
		paid_method TEXT DEFAULT '',
		paid_at DATETIME,
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (santri_id) REFERENCES santri(id),
		UNIQUE(santri_id, period)
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO santri (nis, name, class, status) VALUES
		('1001', 'Santri A', 'VII Putra', 'aktif'),
		('1002', 'Santri B', 'VII Putri', 'aktif')`); err != nil {
		t.Fatalf("seed santri: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return db
}

func TestGenerateIsIdempotent(t *testing.T) {
	repo := NewRepository(newSppTestDB(t))

	created, skipped, err := repo.GenerateBills("2026-09", "", 150000, "2026-09-10", "", nil)
	if err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}
	if created != 2 || skipped != 0 {
		t.Fatalf("expected created=2 skipped=0, got %d/%d", created, skipped)
	}

	created, skipped, err = repo.GenerateBills("2026-09", "", 150000, "2026-09-10", "", nil)
	if err != nil {
		t.Fatalf("second GenerateBills returned error: %v", err)
	}
	if created != 0 || skipped != 2 {
		t.Fatalf("expected created=0 skipped=2, got %d/%d", created, skipped)
	}
}

func TestPayPartialThenFull(t *testing.T) {
	repo := NewRepository(newSppTestDB(t))

	if _, _, err := repo.GenerateBills("2026-09", "", 150000, "", "", nil); err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}

	bills, err := repo.ListBills("2026-09", "", 0)
	if err != nil || len(bills) == 0 {
		t.Fatalf("ListBills returned %d bills, err=%v", len(bills), err)
	}
	id := bills[0].ID

	if err := repo.PayBill(id, 50000, "manual", "", "cicilan 1", 0); err != nil {
		t.Fatalf("partial PayBill returned error: %v", err)
	}
	b, err := repo.GetBill(id)
	if err != nil {
		t.Fatalf("GetBill returned error: %v", err)
	}
	if b.Status != "partial" || b.PaidAmount != 50000 {
		t.Fatalf("expected partial/50000, got %s/%d", b.Status, b.PaidAmount)
	}

	if err := repo.PayBill(id, 200000, "manual", "", "", 0); err != errBillOverpay {
		t.Fatalf("expected overpay error, got %v", err)
	}

	if err := repo.PayBill(id, 100000, "transfer", "", "pelunasan", 0); err != nil {
		t.Fatalf("final PayBill returned error: %v", err)
	}
	b, err = repo.GetBill(id)
	if err != nil {
		t.Fatalf("GetBill returned error: %v", err)
	}
	if b.Status != "paid" || b.PaidAmount != 150000 {
		t.Fatalf("expected paid/150000, got %s/%d", b.Status, b.PaidAmount)
	}
}

func TestDeletePaidIsRejected(t *testing.T) {
	repo := NewRepository(newSppTestDB(t))

	if _, _, err := repo.GenerateBills("2026-09", "", 150000, "", "", nil); err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}
	bills, _ := repo.ListBills("2026-09", "", 0)
	id := bills[0].ID

	if err := repo.PayBill(id, 150000, "manual", "", "", 0); err != nil {
		t.Fatalf("PayBill returned error: %v", err)
	}
	if err := repo.DeleteBill(id); err != errBillHasPayments {
		t.Fatalf("expected has-payments error, got %v", err)
	}
}

func TestSummaryTotals(t *testing.T) {
	repo := NewRepository(newSppTestDB(t))

	if _, _, err := repo.GenerateBills("2026-09", "", 100000, "", "", nil); err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}
	bills, _ := repo.ListBills("2026-09", "", 0)
	if err := repo.PayBill(bills[0].ID, 100000, "manual", "", "", 0); err != nil {
		t.Fatalf("PayBill returned error: %v", err)
	}

	s, err := repo.Summary("2026-09")
	if err != nil {
		t.Fatalf("Summary returned error: %v", err)
	}
	if s.Billed != 200000 || s.Collected != 100000 || s.Outstanding != 100000 {
		t.Fatalf("unexpected totals: %+v", s)
	}
	if s.CountTotal != 2 || s.CountPaid != 1 || s.CountUnpaid != 1 {
		t.Fatalf("unexpected counts: %+v", s)
	}
}

func TestReportPerSantri(t *testing.T) {
	repo := NewRepository(newSppTestDB(t))

	if _, _, err := repo.GenerateBills("2026-09", "", 100000, "", "", nil); err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}
	if _, _, err := repo.GenerateBills("2026-10", 100000, ""); err != nil {
		t.Fatalf("GenerateBills returned error: %v", err)
	}
	bills, _ := repo.ListBills("2026-09", "", 0)
	if err := repo.PayBill(bills[0].ID, 100000, "manual", "", "", 0); err != nil {
		t.Fatalf("PayBill returned error: %v", err)
	}

	rows, err := repo.Report("2026-09", "2026-10", "", 0)
	if err != nil {
		t.Fatalf("Report returned error: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 santri rows, got %d", len(rows))
	}
	for _, r := range rows {
		if r.Billed != 200000 {
			t.Fatalf("expected billed 200000 for %s, got %d", r.Name, r.Billed)
		}
	}
	if rows[0].Collected != 100000 || rows[0].Status != "partial" {
		t.Fatalf("expected first santri partial/100000, got %+v", rows[0])
	}
	if rows[1].Collected != 0 || rows[1].Status != "unpaid" {
		t.Fatalf("expected second santri unpaid/0, got %+v", rows[1])
	}
	if rows[0].Outstanding != 100000 {
		t.Fatalf("expected outstanding 100000, got %d", rows[0].Outstanding)
	}

	filtered, err := repo.Report("2026-09", "2026-10", "VII Putri", 0)
	if err != nil {
		t.Fatalf("Report class filter returned error: %v", err)
	}
	if len(filtered) != 1 || filtered[0].Name != "Santri B" {
		t.Fatalf("expected only Santri B, got %+v", filtered)
	}
}
