package kas

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

// newKasTestDB membuat schema minimal yang dipakai Repository.Audit.
// Tabel yang tidak Auditor pakai sengaja TIDAK dibuat, supaya test ini gagal
// kalau ada query baru yang diam-diam butuh tabel lain.
func newKasTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE kas_categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL,
		kind TEXT NOT NULL,
		is_auto_source INTEGER DEFAULT 0
	);

	CREATE TABLE kas_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		date DATE NOT NULL,
		kind TEXT NOT NULL,
		category_id INTEGER,
		amount INTEGER NOT NULL,
		method TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_by INTEGER,
		voided INTEGER DEFAULT 0
	);

	CREATE TABLE spp_bills (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER,
		period TEXT DEFAULT '',
		amount INTEGER DEFAULT 0,
		paid_amount INTEGER DEFAULT 0,
		status TEXT DEFAULT '',
		paid_at DATETIME
	);
	CREATE TABLE iuran_bills (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER,
		name TEXT DEFAULT '',
		period TEXT DEFAULT '',
		paid_amount INTEGER DEFAULT 0,
		paid_at DATETIME
	);
	CREATE TABLE donations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		campaign_id INTEGER,
		donor_name TEXT DEFAULT '',
		amount REAL DEFAULT 0,
		status TEXT DEFAULT 'pending',
		proof_url TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE donation_campaigns (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT DEFAULT '',
		collected_amount REAL DEFAULT 0
	);
	CREATE TABLE psb_payments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		amount REAL DEFAULT 0
	);
	CREATE TABLE santri (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT DEFAULT ''
	);
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT DEFAULT ''
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	return db
}

func kasSeed(t *testing.T, db *sql.DB) {
	t.Helper()
	// Kategori 1 = Operasional (biasa), 2 = ATK (biasa), 3 = SPP (auto_source).
	mustExec := func(q string, args ...interface{}) {
		t.Helper()
		if _, err := db.Exec(q, args...); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}
	mustExec(`INSERT INTO kas_categories (id, code, name, kind, is_auto_source) VALUES
		(1, 'OPR', 'Operasional', 'keluar', 0),
		(2, 'ATK', 'ATK', 'keluar', 0),
		(3, 'SPP', 'SPP', 'masuk', 1)`)
	mustExec(`INSERT INTO kas_transactions (date, kind, category_id, amount) VALUES
		('2026-10-01', 'keluar', 1, 100000),
		('2026-10-02', 'keluar', 1, 50000),
		('2026-10-03', 'keluar', 2, 250000),
		('2026-10-04', 'keluar', 2, 20000),
		('2026-10-05', 'keluar', NULL, 50000),
		('2026-10-06', 'masuk', 1, 999999)`)
	// Voided harus diabaikan total maupun groups.
	mustExec(`INSERT INTO kas_transactions (date, kind, category_id, amount, voided) VALUES
		('2026-10-07', 'keluar', 1, 777777, 1)`)
	// Di luar periode filter.
	mustExec(`INSERT INTO kas_transactions (date, kind, category_id, amount) VALUES
		('2026-09-30', 'keluar', 1, 444444)`)
	// Transaksi masuk di kategori auto_source ->-Excluded, bukan pemasukan.
	mustExec(`INSERT INTO kas_transactions (date, kind, category_id, amount) VALUES
		('2026-10-05', 'masuk', 3, 3000000)`)
}

func TestAuditExpenseGroupsJumlahHarusCocokDenganTotal(t *testing.T) {
	db := newKasTestDB(t)
	defer db.Close()
	kasSeed(t, db)
	repo := &Repository{db: db}

	a, err := repo.Audit("", "")
	if err != nil {
		t.Fatalf("Audit: %v", err)
	}

	// Tanpa periode semua tanggal ikut: 100000+50000+250000+20000+50000+444444
	// (2026-09-30). Yang voided (777777) TIDAK ikut.
	if a.Expense != 914444 {
		t.Fatalf("Expense = %d, want 914444", a.Expense)
	}

	total := 0
	for _, g := range a.ExpenseGroups {
		total += g.Amount
	}
	if total != a.Expense {
		t.Fatalf("jumlah ExpenseGroups = %d, harus sama dengan Expense %d", total, a.Expense)
	}

	// Urut nominal descending.
	if len(a.ExpenseGroups) != 3 {
		t.Fatalf("jumlah group = %d, want 3 (Operasional, ATK, Tanpa kategori)", len(a.ExpenseGroups))
	}
	if a.ExpenseGroups[0].Label != "Operasional" || a.ExpenseGroups[0].Amount != 594444 || a.ExpenseGroups[0].Count != 3 {
		t.Errorf("group[0] = %+v, want Operasional/594444/3", a.ExpenseGroups[0])
	}
	if a.ExpenseGroups[1].Label != "ATK" || a.ExpenseGroups[1].Amount != 270000 || a.ExpenseGroups[1].Count != 2 {
		t.Errorf("group[1] = %+v, want ATK/270000/2", a.ExpenseGroups[1])
	}
	if a.ExpenseGroups[2].Label != "Tanpa kategori" || a.ExpenseGroups[2].Amount != 50000 || a.ExpenseGroups[2].CategoryID != 0 {
		t.Errorf("group[2] = %+v, want Tanpa kategori/50000/id0", a.ExpenseGroups[2])
	}
}

func TestAuditExpenseGroupsIkutiFilterPeriode(t *testing.T) {
	db := newKasTestDB(t)
	defer db.Close()
	kasSeed(t, db)
	repo := &Repository{db: db}

	a, err := repo.Audit("2026-10-03", "2026-10-05")
	if err != nil {
		t.Fatalf("Audit: %v", err)
	}

	// 250000 (03) + 20000 (04) + 50000 (05) = 320000.
	if a.Expense != 320000 {
		t.Fatalf("Expense = %d, want 320000", a.Expense)
	}
	total := 0
	for _, g := range a.ExpenseGroups {
		total += g.Amount
	}
	if total != a.Expense {
		t.Fatalf("jumlah ExpenseGroups = %d, harus sama dengan Expense %d", total, a.Expense)
	}
	if len(a.ExpenseGroups) != 2 {
		t.Fatalf("jumlah group = %d, want 2", len(a.ExpenseGroups))
	}
}

func TestAuditExpenseGroupsKosongBukanNil(t *testing.T) {
	db := newKasTestDB(t)
	defer db.Close()
	repo := &Repository{db: db}

	a, err := repo.Audit("", "")
	if err != nil {
		t.Fatalf("Audit: %v", err)
	}
	// Frontend wajib meng-loop tanpa cek null.
	if a.ExpenseGroups == nil {
		t.Fatal("ExpenseGroups = nil, harus [] supaya JSON tidak null")
	}
	if len(a.ExpenseGroups) != 0 {
		t.Fatalf("ExpenseGroups = %d group, want 0", len(a.ExpenseGroups))
	}
	if a.Expense != 0 || a.Balance != 0 {
		t.Fatalf("Expense/Balance = %d/%d, want 0/0", a.Expense, a.Balance)
	}
}
