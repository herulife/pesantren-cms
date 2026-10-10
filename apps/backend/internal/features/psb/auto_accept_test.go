package psb

// Test auto-accept: pendaftar accepted+lunas otomatis menjadi santri
// (jilid 18). Lihat task UNIFIKASI DATA SANTRI §14.

import (
	"context"
	"database/sql"
	"testing"

	"almaparung-api/internal/platform/audit"

	_ "modernc.org/sqlite"
)

func newAutoAcceptTestDB(t *testing.T) *sql.DB {
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
		nisn TEXT DEFAULT '',
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
		akta_url TEXT DEFAULT '',
		ktp_ortu_url TEXT DEFAULT '',
		surat_kelulusan_url TEXT DEFAULT '',
		foto_pendaftaran_url TEXT DEFAULT '',
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
		category TEXT DEFAULT 'reguler',
		parent_name TEXT,
		parent_phone TEXT,
		nik TEXT DEFAULT '',
		nisn TEXT DEFAULT '',
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
	CREATE TABLE settings (
		key TEXT PRIMARY KEY,
		value TEXT DEFAULT '',
		description TEXT DEFAULT ''
	);
	CREATE TABLE audit_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		request_id TEXT,
		actor_id INTEGER,
		actor_role TEXT,
		action TEXT NOT NULL,
		entity_type TEXT,
		entity_id TEXT,
		before_json TEXT,
		after_json TEXT,
		ip_address TEXT,
		user_agent TEXT,
		result TEXT DEFAULT 'ok',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("schema: %v", err)
	}
	audit.Configure(db)
	return db
}

func seedPaidReviewReg(t *testing.T, db *sql.DB, userID int) int64 {
	t.Helper()
	res, err := db.Exec(`INSERT INTO registrations
		(user_id, full_name, gender, nik, program_choice, jenjang, payment_status, status)
		VALUES (?, 'Anak Uji', 'L', '1234567890123456', 'tahfidz', 'smp', 'paid', 'accepted')`, userID)
	if err != nil {
		t.Fatalf("seed: %v", err)
	}
	id, _ := res.LastInsertId()
	return id
}

func santriCount(t *testing.T, db *sql.DB) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM santri`).Scan(&n); err != nil {
		t.Fatalf("count: %v", err)
	}
	return n
}

// UpdateStatus ke accepted saat sudah lunas -> santri otomatis terbentuk.
func TestAutoAcceptOnAcceptedPaid(t *testing.T) {
	db := newAutoAcceptTestDB(t)
	defer db.Close()
	repo := NewRepository(db)

	id := seedPaidReviewReg(t, db, 77)
	if err := repo.UpdateStatus(context.Background(), int(id), "accepted", "", nil); err != nil {
		t.Fatalf("UpdateStatus: %v", err)
	}
	if got := santriCount(t, db); got != 1 {
		t.Fatalf("santri = %d, harap 1", got)
	}
	var regID, uid int
	var nik, status string
	err := db.QueryRow(`SELECT registration_id, user_id, nik, status FROM santri LIMIT 1`).
		Scan(&regID, &uid, &nik, &status)
	if err != nil {
		t.Fatalf("read santri: %v", err)
	}
	if regID != int(id) || uid != 77 || nik != "1234567890123456" || status != "aktif" {
		t.Fatalf("santri salah taut: reg=%d user=%d nik=%q status=%q", regID, uid, nik, status)
	}
	var regStatus string
	if err := db.QueryRow(`SELECT status FROM registrations WHERE id = ?`, id).Scan(&regStatus); err != nil {
		t.Fatalf("read reg: %v", err)
	}
	if regStatus != "santri" {
		t.Fatalf("status registrasi = %q, harap santri", regStatus)
	}
}

// Belum lunas -> tidak terbentuk santri (diam, tanpa error).
func TestAutoAcceptSkippedWhenUnpaid(t *testing.T) {
	db := newAutoAcceptTestDB(t)
	defer db.Close()
	repo := NewRepository(db)

	id := seedPaidReviewReg(t, db, 78)
	if _, err := db.Exec(`UPDATE registrations SET payment_status='unpaid' WHERE id = ?`, id); err != nil {
		t.Fatalf("unpaid: %v", err)
	}
	if err := repo.UpdateStatus(context.Background(), int(id), "accepted", "", nil); err != nil {
		t.Fatalf("UpdateStatus: %v", err)
	}
	if got := santriCount(t, db); got != 0 {
		t.Fatalf("santri = %d, harap 0", got)
	}
}

// AcceptToSantri dua kali -> tetap satu santri (idempoten).
func TestAutoAcceptDuplicateGuard(t *testing.T) {
	db := newAutoAcceptTestDB(t)
	defer db.Close()
	repo := NewRepository(db)

	id := seedPaidReviewReg(t, db, 79)
	if _, err := repo.AcceptToSantri(context.Background(), int(id)); err != nil {
		t.Fatalf("accept 1: %v", err)
	}
	if _, err := repo.AcceptToSantri(context.Background(), int(id)); err == nil {
		t.Fatalf("accept 2 harus gagal")
	}
	if got := santriCount(t, db); got != 1 {
		t.Fatalf("santri = %d, harap 1", got)
	}
}

// seedPaidRegWithCategory membuat registrasi lunas+accepted dengan kategori
// tertentu. yatim/dhuafa wajib menyertakan dokumen pendukungnya, jadi seed ini
// ikut mengisinya kalau ada (kategori tanpa dokumen ditolak AcceptToSantri).
func seedPaidRegWithCategory(t *testing.T, db *sql.DB, userID int, category string) int64 {
	t.Helper()
	yatimDoc, sktmDoc := "", ""
	if category == "yatim" || category == "Yatim" {
		yatimDoc = "/uploads/kematian.jpg"
	}
	if category == "dhuafa" || category == "Dhuafa" {
		sktmDoc = "/uploads/sktm.jpg"
	}
	res, err := db.Exec(`INSERT INTO registrations
		(user_id, full_name, gender, nik, program_choice, jenjang, payment_status, status, category, yatim_doc_url, sktm_doc_url)
		VALUES (?, 'Anak Kategori', 'L', '1234567890123456', 'tahfidz', 'smp', 'paid', 'accepted', ?, ?, ?)`, userID, category, yatimDoc, sktmDoc)
	if err != nil {
		t.Fatalf("seed: %v", err)
	}
	id, _ := res.LastInsertId()
	return id
}

func readSantriCategory(t *testing.T, db *sql.DB) string {
	t.Helper()
	var got string
	if err := db.QueryRow(`SELECT COALESCE(category,'') FROM santri LIMIT 1`).Scan(&got); err != nil {
		t.Fatalf("read category: %v", err)
	}
	return got
}

// Kategori pendaftar harus ikut tersimpan ke Santri supaya
// registrations.category dan polypropylene.category tidak jadi dua sumber nilai
// yang berbeda. Ejaan juga dinormalkan supaya keduanya identik.
func TestAutoAcceptCarriesCategoryToSantri(t *testing.T) {
	for _, tc := range []struct{ reg, want string }{
		{"reguler", "reguler"},
		{"yatim", "yatim"},
		{"dhuafa", "dhuafa"},
		{"Yatim", "yatim"},
		{"Dhuafa", "dhuafa"},
	} {
		t.Run(tc.reg, func(t *testing.T) {
			db := newAutoAcceptTestDB(t)
			defer db.Close()
			repo := NewRepository(db)

			id := seedPaidRegWithCategory(t, db, 91, tc.reg)
			if err := repo.UpdateStatus(context.Background(), int(id), "accepted", "", nil); err != nil {
				t.Fatalf("UpdateStatus: %v", err)
			}
			if got := santriCount(t, db); got != 1 {
				t.Fatalf("santri = %d, harap 1", got)
			}
			if got := readSantriCategory(t, db); got != tc.want {
				t.Fatalf("santri.category = %q, harap %q", got, tc.want)
			}
		})
	}
}

// Registrasi tanpa kategori -> Santri dapat default "reguler".
func TestAutoAcceptCategoryDefaultsToReguler(t *testing.T) {
	db := newAutoAcceptTestDB(t)
	defer db.Close()
	repo := NewRepository(db)

	id := seedPaidRegWithCategory(t, db, 92, "")
	if err := repo.UpdateStatus(context.Background(), int(id), "accepted", "", nil); err != nil {
		t.Fatalf("UpdateStatus: %v", err)
	}
	if got := readSantriCategory(t, db); got != "reguler" {
		t.Fatalf("santri.category = %q, harap reguler", got)
	}
}

// Ejaan "duafa" (yang sempat dipakai di sheet & UI lama) diterima lalu disimpan
// sebagai "dhuafa" supaya tidak ada dua nilai untuk hal yang sama.
func TestAutoAcceptCategoryAliasDuafa(t *testing.T) {
	db := newAutoAcceptTestDB(t)
	defer db.Close()
	repo := NewRepository(db)

	id := seedPaidRegWithCategory(t, db, 93, "duafa")
	if err := repo.UpdateStatus(context.Background(), int(id), "accepted", "", nil); err != nil {
		t.Fatalf("UpdateStatus: %v", err)
	}
	if got := readSantriCategory(t, db); got != "dhuafa" {
		t.Fatalf("santri.category = %q, harap dhuafa", got)
	}
}
