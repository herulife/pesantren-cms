package psb

// Test kategori + kuota yatim + program (jilid 19).

import (
	"context"
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newCategoryTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE registrations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		full_name TEXT NOT NULL,
		nickname TEXT,
		gender TEXT,
		nik TEXT,
		birth_place TEXT,
		birth_date TEXT,
		address TEXT,
		parent_name TEXT,
		parent_phone TEXT,
		father_name TEXT,
		father_job TEXT,
		father_phone TEXT,
		mother_name TEXT,
		mother_job TEXT,
		mother_phone TEXT,
		school_origin TEXT,
		program_choice TEXT,
		jenjang TEXT DEFAULT '',
		category TEXT DEFAULT 'reguler',
		yatim_doc_url TEXT DEFAULT '',
		sktm_doc_url TEXT DEFAULT '',
		kk_url TEXT,
		ijazah_url TEXT,
		pasfoto_url TEXT,
		payment_proof_url TEXT DEFAULT '',
		payment_amount INTEGER DEFAULT 0,
		payment_date TEXT DEFAULT '',
		payment_status TEXT DEFAULT 'unpaid',
		payment_note TEXT DEFAULT '',
		status TEXT DEFAULT 'pending',
		rejection_note TEXT DEFAULT '',
		test_date TEXT DEFAULT '',
		test_location TEXT DEFAULT '',
		test_score INTEGER DEFAULT 0,
		test_note TEXT DEFAULT '',
		re_registration_deadline TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE santri (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nis TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		nickname TEXT,
		gender TEXT,
		birth_place TEXT,
		birth_date TEXT,
		address TEXT,
		class TEXT NOT NULL,
		angkatan TEXT,
		status TEXT DEFAULT 'aktif',
		parent_name TEXT,
		parent_phone TEXT,
		nik TEXT DEFAULT '',
		father_name TEXT DEFAULT '',
		father_phone TEXT DEFAULT '',
		mother_name TEXT DEFAULT '',
		mother_phone TEXT DEFAULT '',
		registration_id INTEGER DEFAULT 0,
		photo_url TEXT,
		user_id INTEGER,
		jenjang TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("schema: %v", err)
	}
	return db
}

func seedReg(t *testing.T, db *sql.DB, userID int, category, status, payStatus, program string) int64 {
	t.Helper()
	res, err := db.Exec(`INSERT INTO registrations
		(user_id, full_name, gender, nik, school_origin, program_choice, jenjang, category, payment_status, status)
		VALUES (?, 'Anak Uji', 'L', '1234567890123456', 'SMP X', ?, 'smp', ?, 'paid', 'pending')`,
		userID, program, category)
	_ = payStatus
	if err != nil {
		t.Fatalf("seed: %v", err)
	}
	id, _ := res.LastInsertId()
	if _, err := db.Exec(`UPDATE registrations SET payment_status = ?, status = ? WHERE id = ?`, payStatus, status, id); err != nil {
		t.Fatalf("seed status: %v", err)
	}
	return id
}

// Kuota: 5 yatim aktif boleh, yang ke-6 ditolak.
func TestYatimQuotaFull(t *testing.T) {
	db := newCategoryTestDB(t)
	defer db.Close()
	repo := NewRepository(db)
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		_, err := repo.SaveByUserID(ctx, 100+i, Registration{
			FullName: "Yatim", Gender: "L", ProgramChoice: "tahfidz", Jenjang: "smp",
			SchoolOrigin: "SMP", Category: "yatim",
		})
		if err != nil {
			t.Fatalf("seed yatim %d: %v", i, err)
		}
	}
	_, err := repo.SaveByUserID(ctx, 200, Registration{
		FullName: "Yatim6", Gender: "L", ProgramChoice: "tahfidz", Jenjang: "smp",
		SchoolOrigin: "SMP", Category: "yatim",
	})
	if err != ErrYatimQuotaFull {
		t.Fatalf("harap ErrYatimQuotaFull, dapat %v", err)
	}
	// Reguler tidak terpengaruh kuota.
	if _, err := repo.SaveByUserID(ctx, 201, Registration{
		FullName: "Reg", Gender: "L", ProgramChoice: "bahasa", Jenjang: "smk",
		SchoolOrigin: "SMP", Category: "reguler",
	}); err != nil {
		t.Fatalf("reguler harus lolos: %v", err)
	}
}

// Kategori & program invalid ditolak; program dinormalisasi.
func TestCategoryProgramValidation(t *testing.T) {
	db := newCategoryTestDB(t)
	defer db.Close()
	repo := NewRepository(db)
	ctx := context.Background()

	if _, err := repo.SaveByUserID(ctx, 300, Registration{
		FullName: "A", ProgramChoice: "tahfidz", Jenjang: "smp", SchoolOrigin: "S",
		Category: "sultan",
	}); err != ErrInvalidCategory {
		t.Fatalf("harap ErrInvalidCategory, dapat %v", err)
	}
	if _, err := repo.SaveByUserID(ctx, 301, Registration{
		FullName: "B", ProgramChoice: "memasak", Jenjang: "smp", SchoolOrigin: "S",
	}); err != ErrInvalidProgram {
		t.Fatalf("harap ErrInvalidProgram, dapat %v", err)
	}
	saved, err := repo.SaveByUserID(ctx, 302, Registration{
		FullName: "C", ProgramChoice: "TAHFIDZ ", Jenjang: "SMP", SchoolOrigin: "S",
	})
	if err != nil {
		t.Fatalf("save: %v", err)
	}
	if saved.ProgramChoice != "tahfidz" || saved.Category != "reguler" {
		t.Fatalf("normalisasi gagal: %+v", saved)
	}
}

// Yatim tanpa surat kematian tidak bisa dipindahkan; lengkap bisa.
func TestAcceptRequiresYatimDoc(t *testing.T) {
	db := newCategoryTestDB(t)
	defer db.Close()
	repo := NewRepository(db)
	ctx := context.Background()

	id := seedReg(t, db, 400, "yatim", "accepted", "paid", "tahfidz")
	if _, err := repo.AcceptToSantri(ctx, int(id)); err != ErrYatimDocMissing {
		t.Fatalf("harap ErrYatimDocMissing, dapat %v", err)
	}
	if _, err := db.Exec(`UPDATE registrations SET yatim_doc_url='/uploads/x.jpg' WHERE id = ?`, id); err != nil {
		t.Fatalf("set doc: %v", err)
	}
	res, err := repo.AcceptToSantri(ctx, int(id))
	if err != nil {
		t.Fatalf("accept: %v", err)
	}
	var regID int
	if err := db.QueryRow(`SELECT registration_id FROM santri WHERE id = ?`, res.ID).Scan(&regID); err != nil {
		t.Fatalf("read santri: %v", err)
	}
	if regID != int(id) {
		t.Fatalf("tautan registrasi = %d, harap %d", regID, id)
	}
}
