package database

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

// DB represents the database connection
var DB *sql.DB

// Connect initializes the connection to the SQLite database
func Connect(dbPath string) {
	var err error
	if strings.TrimSpace(dbPath) == "" {
		dbPath = os.Getenv("DB_PATH")
	}
	if strings.TrimSpace(dbPath) == "" {
		dbPath = "./alma.db"
	}

	absPath, absErr := filepath.Abs(dbPath)
	if absErr == nil {
		dbPath = absPath
	}

	if !strings.Contains(dbPath, "?") {
		dbPath += "?_txlock=immediate"
	}
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	// Verify the connection
	err = DB.Ping()
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	configureSQLite()
	createTables()
	runMigrations()
	if cwd, cwdErr := os.Getwd(); cwdErr == nil {
		fmt.Printf("Database working directory: %s\n", cwd)
	}
	fmt.Printf("Successfully connected to %s\n", dbPath)
}

func configureSQLite() {
	// Improve read/write concurrency and reduce lock contention on SQLite.
	pragmas := []string{
		"PRAGMA journal_mode=WAL;",
		"PRAGMA synchronous=NORMAL;",
		"PRAGMA foreign_keys=ON;",
		"PRAGMA busy_timeout=5000;",
	}

	for _, statement := range pragmas {
		if _, err := DB.Exec(statement); err != nil {
			log.Printf("[DB] PRAGMA skipped (%s): %v", statement, err)
		}
	}

	// SQLite works best with a small pool.
	DB.SetMaxOpenConns(1)
	DB.SetMaxIdleConns(1)
}

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'user',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		whatsapp TEXT DEFAULT '',
		CHECK (role IN ('superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'admin', 'user', 'pimpinan', 'wali_kelas', 'guru', 'ustadz'))
	);

	CREATE TABLE IF NOT EXISTS faqs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		question TEXT NOT NULL,
		answer TEXT NOT NULL,
		order_num INTEGER DEFAULT 0,
		is_active BOOLEAN DEFAULT 1
	);

	CREATE TABLE IF NOT EXISTS facilities (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT NOT NULL,
		image_url TEXT NOT NULL,
		category TEXT,
		is_highlight BOOLEAN DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS agendas (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		start_date TEXT NOT NULL,
		end_date TEXT,
		time_info TEXT,
		location TEXT,
		description TEXT,
		category TEXT
	);

	CREATE TABLE IF NOT EXISTS payments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		amount INTEGER NOT NULL,
		description TEXT NOT NULL,
		payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		status TEXT DEFAULT 'success',
		method TEXT DEFAULT 'admin',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS spp_bills (
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

	CREATE INDEX IF NOT EXISTS idx_spp_bills_period ON spp_bills(period);

	CREATE TABLE IF NOT EXISTS iuran_bills (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		santri_id INTEGER NOT NULL,
		name TEXT NOT NULL DEFAULT '',
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
		UNIQUE(santri_id, name, period)
	);

	CREATE INDEX IF NOT EXISTS idx_iuran_bills_period ON iuran_bills(period);
	CREATE INDEX IF NOT EXISTS idx_iuran_bills_name ON iuran_bills(name);

	CREATE TABLE IF NOT EXISTS classes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL UNIQUE,
		jenjang TEXT DEFAULT '',
		wali_name TEXT DEFAULT '',
		academic_year TEXT DEFAULT '',
		is_active INTEGER NOT NULL DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS kas_categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL,
		kind TEXT NOT NULL DEFAULT 'masuk',
		created_by INTEGER NOT NULL DEFAULT 0,
		updated_by INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		is_auto_source INTEGER NOT NULL DEFAULT 0,
		UNIQUE(name, kind)
	);

	CREATE TABLE IF NOT EXISTS receipts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		receipt_no TEXT NOT NULL DEFAULT '',
		santri_id INTEGER NOT NULL,
		period TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		total INTEGER NOT NULL DEFAULT 0,
		method TEXT NOT NULL DEFAULT '',
		created_by INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (santri_id) REFERENCES santri(id),
		UNIQUE(santri_id, period)
	);

	CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_no ON receipts(receipt_no);

	CREATE TABLE IF NOT EXISTS payment_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		date TEXT NOT NULL,
		santri_id INTEGER NOT NULL,
		bill_type TEXT NOT NULL DEFAULT 'SPP',
		bill_id INTEGER NOT NULL DEFAULT 0,
		bill_period TEXT NOT NULL DEFAULT '',
		description TEXT NOT NULL DEFAULT '',
		amount INTEGER NOT NULL,
		method TEXT NOT NULL DEFAULT 'Tunai',
		created_by INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (santri_id) REFERENCES santri(id)
	);

	CREATE UNIQUE INDEX IF NOT EXISTS idx_paytx_code ON payment_transactions(code);
	CREATE INDEX IF NOT EXISTS idx_paytx_santri ON payment_transactions(santri_id);
	CREATE INDEX IF NOT EXISTS idx_paytx_date ON payment_transactions(date DESC);

	CREATE TABLE IF NOT EXISTS kas_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT NOT NULL DEFAULT '',
		date TEXT NOT NULL,
		kind TEXT NOT NULL DEFAULT 'masuk',
		category_id INTEGER NOT NULL DEFAULT 0,
		amount INTEGER NOT NULL,
		method TEXT DEFAULT 'manual',
		notes TEXT DEFAULT '',
		created_by INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_kas_tx_date ON kas_transactions(date DESC);
	CREATE INDEX IF NOT EXISTS idx_kas_tx_kind ON kas_transactions(kind);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_kas_tx_code ON kas_transactions(code);

	CREATE TABLE IF NOT EXISTS employees (
		code TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		gender TEXT DEFAULT '',
		birth_place TEXT DEFAULT '',
		birth_date TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		email TEXT DEFAULT '',
		kind TEXT NOT NULL DEFAULT 'Guru',
		photo_url TEXT DEFAULT '',
		is_active INTEGER NOT NULL DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS raw_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		fp_id TEXT NOT NULL,
		date TEXT NOT NULL,
		time TEXT NOT NULL DEFAULT '',
		verify TEXT DEFAULT '',
		machine TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(fp_id, date, time)
	);

	CREATE INDEX IF NOT EXISTS idx_rawlogs_date ON raw_logs(date DESC);

	CREATE TABLE IF NOT EXISTS teacher_attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		employee_code TEXT NOT NULL,
		date TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'Masuk',
		notes TEXT DEFAULT '',
		time_in TEXT DEFAULT '',
		time_out TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (employee_code) REFERENCES employees(code),
		UNIQUE(employee_code, date)
	);

	CREATE INDEX IF NOT EXISTS idx_teacher_att_date ON teacher_attendance(date DESC);

	CREATE TABLE IF NOT EXISTS academic_years (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		start_date TEXT DEFAULT '',
		end_date TEXT DEFAULT '',
		is_active INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS activity_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		action TEXT NOT NULL,
		details TEXT,
		ip_address TEXT,
		user_agent TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS subjects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		category TEXT DEFAULT 'umum',
		teacher_id INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (teacher_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS grades (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		subject_id INTEGER NOT NULL,
		semester TEXT NOT NULL,
		academic_year TEXT NOT NULL,
		uts_score REAL DEFAULT 0,
		uas_score REAL DEFAULT 0,
		task_score REAL DEFAULT 0,
		uh_score REAL DEFAULT 0,
		final_score REAL DEFAULT 0,
		grade_letter TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id),
		FOREIGN KEY (subject_id) REFERENCES subjects(id)
	);

	CREATE TABLE IF NOT EXISTS subject_grade_weights (
		subject_id INTEGER PRIMARY KEY,
		uts_weight REAL DEFAULT 25,
		uas_weight REAL DEFAULT 30,
		task_weight REAL DEFAULT 25,
		uh_weight REAL DEFAULT 20,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (subject_id) REFERENCES subjects(id)
	);

	CREATE TABLE IF NOT EXISTS attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'hadir',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS tahfidz_progress (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		surah_name TEXT NOT NULL,
		juz INTEGER DEFAULT 0,
		start_ayat INTEGER DEFAULT 1,
		end_ayat INTEGER DEFAULT 1,
		status TEXT DEFAULT 'proses',
		musyrif_notes TEXT DEFAULT '',
		evaluation_date TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS arbain_progress (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		hadith_number INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'proses',
		nilai INTEGER DEFAULT 0,
		notes TEXT DEFAULT '',
		evaluation_date TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);

	CREATE UNIQUE INDEX IF NOT EXISTS idx_arbain_student_hadith
		ON arbain_progress(student_id, hadith_number);

	CREATE TABLE IF NOT EXISTS gallery (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		category TEXT DEFAULT 'Umum',
		album_name TEXT DEFAULT '',
		album_slug TEXT DEFAULT '',
		event_date TEXT DEFAULT '',
		is_album_cover BOOLEAN DEFAULT 0,
		image_url TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS videos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		series_name TEXT DEFAULT '',
		series_slug TEXT DEFAULT '',
		event_date TEXT DEFAULT '',
		is_featured BOOLEAN DEFAULT 0,
		url TEXT NOT NULL,
		thumbnail TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS news (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		content TEXT NOT NULL,
		excerpt TEXT,
		category_id INTEGER,
		image_url TEXT,
		status TEXT DEFAULT 'draft',
		is_pinned INTEGER NOT NULL DEFAULT 0,
		author_id INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS categories (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		description TEXT
	);

	CREATE TABLE IF NOT EXISTS teachers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		subject TEXT NOT NULL,
		bio TEXT,
		image_url TEXT,
		email TEXT DEFAULT '',
		whatsapp TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS programs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		slug TEXT UNIQUE NOT NULL,
		category TEXT,
		excerpt TEXT,
		content TEXT,
		image_url TEXT,
		is_featured BOOLEAN DEFAULT 0,
		order_index INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT,
		whatsapp TEXT,
		message TEXT NOT NULL,
		is_read BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS registrations (
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
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS psb_payments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		registration_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		code TEXT NOT NULL UNIQUE,
		amount INTEGER NOT NULL,
		paid_at TEXT DEFAULT '',
		method TEXT NOT NULL DEFAULT 'transfer',
		proof_url TEXT DEFAULT '',
		status TEXT NOT NULL DEFAULT 'paid',
		notes TEXT DEFAULT '',
		created_by INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (registration_id) REFERENCES registrations(id)
	);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_psb_payments_reg ON psb_payments(registration_id);
	CREATE INDEX IF NOT EXISTS idx_psb_payments_user ON psb_payments(user_id);
	CREATE INDEX IF NOT EXISTS idx_psb_payments_date ON psb_payments(paid_at);

	CREATE TABLE IF NOT EXISTS otp_codes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		phone TEXT NOT NULL,
		purpose TEXT NOT NULL DEFAULT 'psb',
		code_hash TEXT NOT NULL,
		attempts INTEGER NOT NULL DEFAULT 0,
		max_attempts INTEGER NOT NULL DEFAULT 5,
		expires_at DATETIME NOT NULL,
		consumed_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone, purpose, created_at DESC);

	CREATE TABLE IF NOT EXISTS invoices (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		registration_id INTEGER NOT NULL DEFAULT 0,
		code TEXT NOT NULL UNIQUE,
		amount INTEGER NOT NULL DEFAULT 0,
		method TEXT NOT NULL DEFAULT 'transfer',
		status TEXT NOT NULL DEFAULT 'pending',
		gateway_tx_id TEXT NOT NULL DEFAULT '',
		webhook_received_at TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_code ON invoices(code);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_gateway_tx ON invoices(gateway_tx_id) WHERE gateway_tx_id <> '';
	CREATE INDEX IF NOT EXISTS idx_invoices_reg ON invoices(registration_id);


	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT,
		description TEXT,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS student_points (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL UNIQUE,
		current_points INTEGER DEFAULT 100,
		academic_year TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS violation_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		reporter_name TEXT NOT NULL,
		violation_category TEXT NOT NULL,
		violation_detail TEXT NOT NULL,
		points_deducted INTEGER NOT NULL,
		action_taken TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);
	CREATE TABLE IF NOT EXISTS user_qr_tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		token_hash TEXT UNIQUE NOT NULL,
		expires_at DATETIME NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS exams (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		subject_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		academic_year TEXT NOT NULL,
		semester TEXT NOT NULL,
		duration_minutes INTEGER NOT NULL,
		start_time DATETIME,
		end_time DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (subject_id) REFERENCES subjects(id)
	);

	CREATE TABLE IF NOT EXISTS exam_questions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		exam_id INTEGER NOT NULL,
		question_text TEXT NOT NULL,
		options_json TEXT NOT NULL,
		correct_answer_key INTEGER NOT NULL,
		points INTEGER DEFAULT 1,
		FOREIGN KEY (exam_id) REFERENCES exams(id)
	);

	CREATE TABLE IF NOT EXISTS exam_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		exam_id INTEGER NOT NULL,
		status TEXT DEFAULT 'ongoing',
		score REAL DEFAULT 0,
		started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		finished_at DATETIME,
		FOREIGN KEY (student_id) REFERENCES users(id),
		FOREIGN KEY (exam_id) REFERENCES exams(id)
	);

	CREATE TABLE IF NOT EXISTS exam_answers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		session_id INTEGER NOT NULL,
		question_id INTEGER NOT NULL,
		selected_answer INTEGER,
		is_correct BOOLEAN,
		FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
		FOREIGN KEY (question_id) REFERENCES exam_questions(id)
	);

	CREATE TABLE IF NOT EXISTS user_wallets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL UNIQUE,
		balance REAL DEFAULT 0,
		pin_hash TEXT,
		is_active BOOLEAN DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS wallet_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		wallet_id INTEGER NOT NULL,
		type TEXT NOT NULL, -- deposit, withdrawal, purchase, transfer
		amount REAL NOT NULL,
		reference_id TEXT, -- to link with payment_id or external ref
		description TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (wallet_id) REFERENCES user_wallets(id)
	);

	CREATE TABLE IF NOT EXISTS santri (
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
		father_name TEXT DEFAULT '',
		father_phone TEXT DEFAULT '',
		mother_name TEXT DEFAULT '',
		mother_phone TEXT DEFAULT '',
		father_occupation TEXT DEFAULT '',
		mother_occupation TEXT DEFAULT '',
		registration_id INTEGER DEFAULT 0,
		photo_url TEXT,
		user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS project_subprojects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		code TEXT UNIQUE,
		description TEXT,
		weight REAL NOT NULL,
		order_index INTEGER DEFAULT 0,
		is_active INTEGER DEFAULT 1,
		is_demo INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS project_activities (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sub_project_id INTEGER NOT NULL REFERENCES project_subprojects(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		code TEXT,
		description TEXT,
		tujuan TEXT,
		indikator TEXT,
		weight REAL NOT NULL,
		order_index INTEGER DEFAULT 0,
		is_active INTEGER DEFAULT 1,
		periode TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS project_indicators (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		activity_id INTEGER NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		weight REAL NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS kesantrian_aspek (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		aspek TEXT NOT NULL,
		semester TEXT NOT NULL,
		academic_year TEXT NOT NULL,
		score REAL NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id),
		UNIQUE(student_id, aspek, semester, academic_year)
	);

	CREATE TABLE IF NOT EXISTS raports (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		semester TEXT NOT NULL,
		academic_year TEXT NOT NULL,
		mapel_score REAL NOT NULL DEFAULT 0,
		project_score REAL NOT NULL DEFAULT 0,
		kesantrian_score REAL NOT NULL DEFAULT 0,
		final_score REAL NOT NULL DEFAULT 0,
		predikat TEXT DEFAULT '',
		status TEXT DEFAULT 'draft',
		notes TEXT DEFAULT '',
		generated_by INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id),
		UNIQUE(student_id, semester, academic_year)
	);

	CREATE TABLE IF NOT EXISTS donation_campaigns (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		target_amount REAL DEFAULT 0,
		collected_amount REAL DEFAULT 0,
		image_url TEXT DEFAULT '',
		is_active INTEGER DEFAULT 1,
		end_date DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS donations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		campaign_id INTEGER,
		donor_name TEXT NOT NULL,
		donor_phone TEXT DEFAULT '',
		amount REAL NOT NULL,
		payment_method TEXT DEFAULT 'transfer',
		proof_url TEXT DEFAULT '',
		status TEXT DEFAULT 'pending',
		verified_at DATETIME,
		verified_by INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(campaign_id) REFERENCES donation_campaigns(id) ON DELETE SET NULL
	);

	CREATE TABLE IF NOT EXISTS donors (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		address TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name);

	CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);
	CREATE INDEX IF NOT EXISTS idx_santri_class ON santri(class);
	CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);
	CREATE INDEX IF NOT EXISTS idx_santri_name ON santri(name);

	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		url_id TEXT NOT NULL,
		title TEXT NOT NULL DEFAULT '',
		content TEXT NOT NULL,
		delete_token TEXT NOT NULL DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		expires_at DATETIME
	);

	`

	_, err := DB.Exec(query)
	if err != nil {
		log.Fatalf("Error auto-migrating tables: %v", err)
	}

	addColumnIfNotExists("users", "whatsapp", "TEXT DEFAULT ''")
	addColumnIfNotExists("news", "is_pinned", "INTEGER DEFAULT 0")
	addColumnIfNotExists("users", "last_login_at", "DATETIME")
	addColumnIfNotExists("users", "token_version", "INTEGER NOT NULL DEFAULT 0")
	addColumnIfNotExists("users", "photo_url", "TEXT")
	addColumnIfNotExists("payment_transactions", "idempotency_key", "TEXT")
	addColumnIfNotExists("receipts", "idempotency_key", "TEXT")
	addColumnIfNotExists("kas_transactions", "idempotency_key", "TEXT")
	addColumnIfNotExists("donations", "idempotency_key", "TEXT")
	addColumnIfNotExists("kas_transactions", "voided", "INTEGER NOT NULL DEFAULT 0")
	addColumnIfNotExists("kas_transactions", "void_reason", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("gallery", "album_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "album_slug", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "event_date", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "is_album_cover", "BOOLEAN DEFAULT 0")
	addColumnIfNotExists("videos", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("videos", "series_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("videos", "series_slug", "TEXT DEFAULT ''")
	addColumnIfNotExists("iuran_bills", "name", "TEXT DEFAULT ''")
	addColumnIfNotExists("kas_transactions", "code", "TEXT DEFAULT ''")
	addColumnIfNotExists("kas_categories", "updated_by", "INTEGER DEFAULT 0")
	addColumnIfNotExists("kas_categories", "created_by", "INTEGER DEFAULT 0")
	addColumnIfNotExists("kas_categories", "code", "TEXT DEFAULT ''")
	addColumnIfNotExists("kas_categories", "is_auto_source", "INTEGER NOT NULL DEFAULT 0")

	// Jilid 75: kategori kas bernama SPP / Iuran / Donasi adalah SUMBER OTOMATIS
	// ringkasan kas (spp_bills / iuran_bills / donations). Kalau uang yang sama
	// ikut dicatat manual lewat kategori itu, totalnya terhitung 2x karena
	// Income = Spp + Iuran + Donasi + Kas. Tandai supaya Summary bisa
	// mengecualikannya. Transaksi yang dikecualikan tetap ditampilkan di Papan Kas
	// sebagai "sudah termasuk hitungan sumber", bukan dianggap hilang.
	if _, err := DB.Exec(`UPDATE kas_categories SET is_auto_source = 1
		WHERE kind = 'masuk' AND is_auto_source = 0
		  AND LOWER(TRIM(name)) IN ('spp', 'iuran', 'donasi', 'donation', 'pembayaran spp')`); err != nil {
		log.Printf("WARN: gagal menandai kategori kas auto-source: %v", err)
	}
	addColumnIfNotExists("spp_bills", "payment_proof", "TEXT DEFAULT ''")
	addColumnIfNotExists("spp_bills", "pending_amount", "INTEGER DEFAULT 0")
	addColumnIfNotExists("iuran_bills", "payment_proof", "TEXT DEFAULT ''")
	addColumnIfNotExists("iuran_bills", "pending_amount", "INTEGER DEFAULT 0")
	addColumnIfNotExists("receipts", "updated_at", "DATETIME")
	addColumnIfNotExists("payment_transactions", "bill_period", "TEXT DEFAULT ''")
	addColumnIfNotExists("classes", "code", "TEXT DEFAULT ''")
	addColumnIfNotExists("classes", "wali_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")
	addColumnIfNotExists("teachers", "user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")
	addColumnIfNotExists("classes", "wali_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("classes", "academic_year", "TEXT DEFAULT ''")
	addColumnIfNotExists("videos", "event_date", "TEXT DEFAULT ''")
	addColumnIfNotExists("videos", "is_featured", "BOOLEAN DEFAULT 0")
	addColumnIfNotExists("facilities", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("news", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("programs", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("messages", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("registrations", "user_id", "INTEGER")
	addColumnIfNotExists("registrations", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("registrations", "nik", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "father_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "father_job", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "father_phone", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "mother_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "mother_job", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "mother_phone", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "kk_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "ijazah_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "pasfoto_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "payment_proof_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "payment_amount", "INTEGER DEFAULT 0")
	addColumnIfNotExists("registrations", "payment_date", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "payment_status", "TEXT DEFAULT 'unpaid'")
	addColumnIfNotExists("registrations", "payment_note", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "rejection_note", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "test_date", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "test_location", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "test_score", "INTEGER")
	addColumnIfNotExists("registrations", "test_note", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "re_registration_deadline", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "updated_at", "DATETIME")
	addColumnIfNotExists("settings", "value", "TEXT")
	addColumnIfNotExists("settings", "description", "TEXT")
	addColumnIfNotExists("settings", "updated_at", "DATETIME")
	addColumnIfNotExists("teachers", "email", "TEXT DEFAULT ''")
	addColumnIfNotExists("teachers", "whatsapp", "TEXT DEFAULT ''")
	addColumnIfNotExists("subjects", "weight", "REAL DEFAULT 100")
	addColumnIfNotExists("subjects", "kkm", "REAL DEFAULT 75")
	addColumnIfNotExists("subjects", "sort_order", "INTEGER DEFAULT 0")
	addColumnIfNotExists("subjects", "is_active", "INTEGER DEFAULT 1")
	addColumnIfNotExists("donations", "donor_id", "INTEGER")
	addColumnIfNotExists("donations", "type", "TEXT DEFAULT ''")
	addColumnIfNotExists("donations", "notes", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "category", "TEXT DEFAULT 'reguler'")
	addColumnIfNotExists("registrations", "jenjang", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "jenjang", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "yatim_doc_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("notes", "owner_key", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "sktm_doc_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "akta_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "ktp_ortu_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "surat_kelulusan_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("registrations", "foto_pendaftaran_url", "TEXT DEFAULT ''")
	_, _ = DB.Exec("UPDATE registrations SET program_choice='tahfidz' WHERE lower(program_choice)='tahfidz'")
	addColumnIfNotExists("employees", "photo_url", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "registration_id", "INTEGER DEFAULT 0")
	addColumnIfNotExists("santri", "mother_phone", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "mother_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "father_phone", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "father_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "nik", "TEXT DEFAULT ''")
	// Kategori Santri: reguler | yatim | dhuafa. Kolom ini disinkronkan dari
	// registrations.category saat pendaftar PSB naik menjadi Santri
	// (lihat psb.AcceptToSantri), jadi ejaan nilainya harus sama dengan PSB.
	addColumnIfNotExists("santri", "category", "TEXT DEFAULT 'reguler'")
	// Dua kolom ini sudah dipakai query di features/santri tapi belum pernah
	// terdaftar di db.go (pernah ditambahkan manual ke DB prod saja), sehingga
	// DB fresh akan gagal saat SELECT. Ditambahkan di sini agar parity.
	addColumnIfNotExists("santri", "father_occupation", "TEXT DEFAULT ''")
	addColumnIfNotExists("santri", "mother_occupation", "TEXT DEFAULT ''")
	_, _ = DB.Exec("UPDATE registrations SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL OR updated_at = ''")
	_, _ = DB.Exec("UPDATE settings SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL OR updated_at = ''")

	// Auto-migrate: upgrade "admin" role to "superadmin" for RBAC
	res, _ := DB.Exec("UPDATE users SET role = 'superadmin' WHERE role = 'admin'")
	if affected, _ := res.RowsAffected(); affected > 0 {
		log.Printf("[DB] RBAC Migration: %d 'admin' users upgraded to 'superadmin'", affected)
	}
}

func runMigrations() {
	migrations := []struct {
		name string
		sql  string
	}{
		{
			name: "create_schema_migrations",
			sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
				name TEXT PRIMARY KEY,
				applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);`,
		},
		{
			name: "users_email_unique_index",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);`,
		},
		{
			name: "users_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`,
		},
		{
			name: "news_status_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_news_status_created_at ON news(status, created_at DESC);`,
		},
		{
			name: "messages_is_read_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_messages_is_read_created_at ON messages(is_read, created_at DESC);`,
		},
		{
			name: "registrations_status_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_registrations_status_created_at ON registrations(status, created_at DESC);`,
		},
		{
			name: "registrations_user_id_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);`,
		},
		{
			name: "payments_status_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_payments_status_created_at ON payments(status, created_at DESC);`,
		},
		{
			name: "videos_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);`,
		},
		{
			name: "videos_series_slug_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_videos_series_slug_created_at ON videos(series_slug, created_at DESC);`,
		},
		{
			name: "gallery_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);`,
		},
		{
			name: "gallery_album_slug_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_gallery_album_slug_created_at ON gallery(album_slug, created_at DESC);`,
		},
		{
			name: "programs_order_index_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_programs_order_index_created_at ON programs(order_index, created_at DESC);`,
		},
		{
			name: "teachers_name_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);`,
		},
		{
			name: "news_category_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_news_category_created_at ON news(category_id, created_at DESC);`,
		},
		{
			name: "news_author_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_news_author_created_at ON news(author_id, created_at DESC);`,
		},
		{
			name: "activity_logs_user_created_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created_at ON activity_logs(user_id, created_at DESC);`,
		},
		{
			name: "payments_user_payment_date_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_payments_user_payment_date ON payments(user_id, payment_date DESC);`,
		},
		{
			name: "attendance_student_date_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date DESC);`,
		},
		{
			name: "grades_student_subject_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON grades(student_id, subject_id);`,
		},
		{
			name: "tahfidz_student_eval_date_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_tahfidz_student_eval_date ON tahfidz_progress(student_id, evaluation_date DESC);`,
		},
		{
			name: "kas_default_categories",
			sql:  `INSERT OR IGNORE INTO kas_categories (name, kind) VALUES ('SPP','masuk'),('Iuran','masuk'),('Donasi','masuk'),('Operasional','keluar'),('Gaji','keluar');`,
		},
		{
			name: "school_classes_backfill",
			sql:  `INSERT OR IGNORE INTO classes (name) SELECT DISTINCT TRIM(class) FROM santri WHERE TRIM(COALESCE(class,''))<>'';`,
		},
		{
			name: "spp_bills_santri_status_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_spp_bills_santri_status ON spp_bills(santri_id, status);`,
		},
		{
			name: "spp_bills_paid_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_spp_bills_paid_at ON spp_bills(paid_at);`,
		},
		{
			name: "iuran_bills_santri_status_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_iuran_bills_santri_status ON iuran_bills(santri_id, status);`,
		},
		{
			name: "iuran_bills_paid_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_iuran_bills_paid_at ON iuran_bills(paid_at);`,
		},
		{
			name: "paytx_bill_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_paytx_bill ON payment_transactions(bill_type, bill_id);`,
		},
		{
			name: "paytx_bill_period_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_paytx_bill_period ON payment_transactions(bill_period);`,
		},
		{
			name: "kas_tx_category_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_kas_tx_category ON kas_transactions(category_id);`,
		},
		{
			name: "santri_user_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_santri_user ON santri(user_id);`,
		},
		{
			name: "receipts_no_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_no_unique ON receipts(receipt_no);`,
		},
		{
			name: "paytx_idempotency_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_paytx_idem_unique ON payment_transactions(idempotency_key);`,
		},
		{
			name: "receipts_idempotency_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_idem_unique ON receipts(idempotency_key);`,
		},
		{
			name: "kas_idempotency_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_kas_idem_unique ON kas_transactions(idempotency_key);`,
		},
		{
			name: "donations_idempotency_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_idem_unique ON donations(idempotency_key);`,
		},
		{
			name: "audit_logs_table",
			sql: `CREATE TABLE IF NOT EXISTS audit_logs (
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
	);`,
		},
		{
			name: "audit_logs_actor_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id, created_at DESC);`,
		},
		{
			name: "audit_logs_entity_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);`,
		},
		{
			name: "grades_cbt_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_unique ON grades(student_id, subject_id, semester, academic_year);`,
		},
		{
			name: "exam_answers_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_answers_unique ON exam_answers(session_id, question_id);`,
		},
		{
			name: "notes_url_id_index",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_url_id ON notes(url_id);`,
		},
		{
			name: "notes_owner_key_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_notes_owner_key ON notes(owner_key);`,
		},
		{
			name: "notes_expires_at_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON notes(expires_at);`,
		},
		{
			name: "wa_notifications_table",
			sql: `CREATE TABLE IF NOT EXISTS wa_notifications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			registration_id INTEGER,
			kind TEXT NOT NULL DEFAULT 'psb',
			phone TEXT NOT NULL,
			message TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			error TEXT,
			attempts INTEGER NOT NULL DEFAULT 0,
			max_attempts INTEGER NOT NULL DEFAULT 3,
			next_retry_at TEXT,
			sent_at TEXT,
			last_attempt_at TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`,
		},
		{
			name: "wa_notifications_registration_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_wa_notif_reg ON wa_notifications(registration_id);`,
		},
		{
			name: "wa_notifications_status_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_wa_notif_status ON wa_notifications(status);`,
		},
		{
			name: "santri_user_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_santri_user_unique ON santri(user_id);`,
		},
		{
			name: "normalize_semester_1",
			sql:  `UPDATE grades SET semester='1' WHERE LOWER(TRIM(semester)) IN ('ganjil','semester 1','satu');`,
		},
		{
			name: "normalize_semester_2",
			sql:  `UPDATE grades SET semester='2' WHERE LOWER(TRIM(semester)) IN ('genap','semester 2','dua');`,
		},
		{
			name: "normalize_semester_exams_1",
			sql:  `UPDATE exams SET semester='1' WHERE LOWER(TRIM(semester)) IN ('ganjil','semester 1','satu');`,
		},
		{
			name: "normalize_semester_exams_2",
			sql:  `UPDATE exams SET semester='2' WHERE LOWER(TRIM(semester)) IN ('genap','semester 2','dua');`,
		},
		{
			name: "normalize_semester_raports_1",
			sql:  `UPDATE raports SET semester='1' WHERE LOWER(TRIM(semester)) IN ('ganjil','semester 1','satu');`,
		},
		{
			name: "normalize_semester_raports_2",
			sql:  `UPDATE raports SET semester='2' WHERE LOWER(TRIM(semester)) IN ('genap','semester 2','dua');`,
		},
		{
			name: "normalize_semester_kesantrian_1",
			sql:  `UPDATE kesantrian_aspek SET semester='1' WHERE LOWER(TRIM(semester)) IN ('ganjil','semester 1','satu');`,
		},
		{
			name: "normalize_semester_kesantrian_2",
			sql:  `UPDATE kesantrian_aspek SET semester='2' WHERE LOWER(TRIM(semester)) IN ('genap','semester 2','dua');`,
		},
		{
			name: "project_assessments_table",
			sql: `CREATE TABLE IF NOT EXISTS project_assessments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				activity_id INTEGER NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
				semester TEXT NOT NULL,
				academic_year TEXT NOT NULL,
				score REAL NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(student_id, activity_id, semester, academic_year)
			);`,
		},
		{
			name: "project_assessments_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_proj_assess_student ON project_assessments(student_id, semester, academic_year);`,
		},
		{
			name: "teachers_user_unique",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_user_unique ON teachers(user_id);`,
		},
		{
			name: "classes_wali_user_index",
			sql:  `CREATE INDEX IF NOT EXISTS idx_classes_wali_user ON classes(wali_user_id);`,
		},
		{
			name: "subject_grade_weights_table",
			sql: `CREATE TABLE IF NOT EXISTS subject_grade_weights (
				subject_id INTEGER PRIMARY KEY,
				uts_weight REAL DEFAULT 25,
				uas_weight REAL DEFAULT 30,
				task_weight REAL DEFAULT 25,
				uh_weight REAL DEFAULT 20,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (subject_id) REFERENCES subjects(id)
			);`,
		},
		{
			name: "arbain_progress_table",
			sql: `CREATE TABLE IF NOT EXISTS arbain_progress (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				student_id INTEGER NOT NULL,
				hadith_number INTEGER NOT NULL,
				status TEXT NOT NULL DEFAULT 'proses',
				nilai INTEGER DEFAULT 0,
				notes TEXT DEFAULT '',
				evaluation_date TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (student_id) REFERENCES users(id)
			);`,
		},
		{
			name: "arbain_progress_student_hadith_index",
			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_arbain_student_hadith ON arbain_progress(student_id, hadith_number);`,
		},
	}

	for _, migration := range migrations {
		if _, err := DB.Exec(migration.sql); err != nil {
			log.Printf("[DB] Migration %s skipped: %v", migration.name, err)
			continue
		}
		_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)", migration.name)
	}

	migrateGradesUhScore()
	migrateDropBgnArtifacts()
	backfillSantriUserAccounts()
	migrateUsersRoleCheck()
}

// migrateGradesUhScore menambahkan kolom uh_score pada tabel grades bila
// belum ada (idempoten, dicatat di schema_migrations).
func migrateGradesUhScore() {
	var done int
	if err := DB.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE name='grades_uh_score_column'`).Scan(&done); err != nil {
		return
	}
	if done > 0 {
		return
	}
	rows, err := DB.Query(`PRAGMA table_info(grades)`)
	if err != nil {
		return
	}
	var found bool
	for rows.Next() {
		var cid, notnull, pk int
		var name, ctype string
		var dflt interface{}
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err == nil && name == "uh_score" {
			found = true
		}
	}
	rows.Close()
	if !found {
		if _, err := DB.Exec(`ALTER TABLE grades ADD COLUMN uh_score REAL DEFAULT 0`); err != nil {
			return
		}
	}
	_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES ('grades_uh_score_column')")
}

// migrateDropBgnArtifacts membersihkan sisa artefak BGN (Beras Bergizi
// Nasional) yang sudah tidak dipakai: tabel bgn_recipients /
// bgn_recipients_archive beserta indexnya, dan kolom penanda BGN pada tabel
// Santri. Fitur BGN dihapus permanen per order user 30 Sep 2026; data BGN
// sudah dipindahkan ke tabel Santri lalu diim ulang dari master Google Sheet.
// Idempoten (dicatat di schema_migrations).
func migrateDropBgnArtifacts() {
	const name = "bgn_artifacts_dropped"
	var done int
	if err := DB.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE name=?`, name).Scan(&done); err != nil {
		return
	}
	if done > 0 {
		return
	}
	for _, t := range []string{"bgn_recipients_archive", "bgn_recipients"} {
		if _, err := DB.Exec(`DROP TABLE IF EXISTS ` + t); err != nil {
			log.Printf("[DB] Migration %s: gagal drop tabel %s: %v", name, t, err)
			return
		}
	}
	rows, err := DB.Query(`PRAGMA table_info(santri)`)
	if err != nil {
		return
	}
	existing := map[string]bool{}
	for rows.Next() {
		var cid, notnull, pk int
		var col, ctype string
		var dflt interface{}
		if err := rows.Scan(&cid, &col, &ctype, &notnull, &dflt, &pk); err == nil {
			existing[col] = true
		}
	}
	rows.Close()
	for _, col := range []string{"bgn_identity", "bgn_recipient"} {
		if !existing[col] {
			continue
		}
		if _, err := DB.Exec(`ALTER TABLE santri DROP COLUMN ` + col); err != nil {
			log.Printf("[DB] Migration %s: gagal drop kolom %s: %v", name, col, err)
			return
		}
	}
	_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES ('" + name + "')")
}

// migrateUsersRoleCheck melebarkan CHECK role users agar menerima peran
// akademik baru (pimpinan, wali_kelas, guru, ustadz) via rebuild tabel.
// Idempoten (dicatat di schema_migrations).
func migrateUsersRoleCheck() {
	var done int
	if err := DB.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE name='users_role_check_v2'`).Scan(&done); err != nil {
		return
	}
	if done > 0 {
		return
	}
	// Susun ulang definisi kolom dari tabel berjalan (tahan terhadap kolom
	// tambahan di masa depan), kecuali CHECK role yang diganti.
	rows, err := DB.Query(`PRAGMA table_info(users)`)
	if err != nil {
		return
	}
	type colDef struct {
		name    string
		ctype   string
		notnull bool
		dflt    sql.NullString
		pk      bool
	}
	var cols []colDef
	var names []string
	for rows.Next() {
		var cid int
		var c colDef
		if err := rows.Scan(&cid, &c.name, &c.ctype, &c.notnull, &c.dflt, &c.pk); err != nil {
			rows.Close()
			return
		}
		cols = append(cols, c)
		names = append(names, `"`+c.name+`"`)
	}
	rows.Close()
	if len(cols) == 0 {
		return
	}
	var defs []string
	for _, c := range cols {
		if c.pk {
			defs = append(defs, `"id" INTEGER PRIMARY KEY AUTOINCREMENT`)
			continue
		}
		d := `"` + c.name + `" ` + c.ctype
		if c.notnull {
			d += " NOT NULL"
		}
		if c.dflt.Valid {
			d += " DEFAULT " + c.dflt.String
		}
		defs = append(defs, d)
	}
	defs = append(defs, `CHECK (role IN ('superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'admin', 'user', 'pimpinan', 'wali_kelas', 'guru', 'ustadz'))`)
	colList := strings.Join(names, ", ")

	// PRAGMA foreign_keys hanya bisa diubah di luar transaksi + sebelum serve.
	_, _ = DB.Exec(`PRAGMA foreign_keys=OFF`)
	tx, err := DB.Begin()
	if err != nil {
		_, _ = DB.Exec(`PRAGMA foreign_keys=ON`)
		return
	}
	committed := false
	rollback := func() {
		if !committed {
			_ = tx.Rollback()
			_, _ = DB.Exec(`PRAGMA foreign_keys=ON`)
		}
	}
	defer rollback()
	if _, err := tx.Exec(`CREATE TABLE users_new (` + strings.Join(defs, ", ") + `)`); err != nil {
		log.Printf("[DB] users_role_check_v2 create failed: %v", err)
		return
	}
	if _, err := tx.Exec(`INSERT INTO users_new (` + colList + `) SELECT ` + colList + ` FROM users`); err != nil {
		log.Printf("[DB] users_role_check_v2 copy failed: %v", err)
		return
	}
	if _, err := tx.Exec(`DROP TABLE users`); err != nil {
		return
	}
	if _, err := tx.Exec(`ALTER TABLE users_new RENAME TO users`); err != nil {
		return
	}
	if _, err := tx.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)`); err != nil {
		return
	}
	if _, err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`); err != nil {
		return
	}
	if err := tx.Commit(); err != nil {
		return
	}
	committed = true
	_, _ = DB.Exec(`PRAGMA foreign_keys=ON`)
	if rows, err := DB.Query(`PRAGMA foreign_key_check`); err == nil {
		bad := 0
		for rows.Next() {
			bad++
		}
		rows.Close()
		if bad > 0 {
			log.Printf("[DB] users_role_check_v2: %d pelanggaran FK terdeteksi", bad)
		}
	}
	_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES ('users_role_check_v2')")
	log.Printf("[DB] users_role_check_v2 applied: peran akademik baru aktif")
}

// backfillSantriUserAccounts menghubungkan santri yang diinput manual (tanpa
// akun users) ke akun portal sintetis role='user', supaya sinkron dengan
// e-raport (raports/grades/kesantrian semua berkunci users.id). Idempoten.
func backfillSantriUserAccounts() {
	var done int
	if err := DB.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE name='santri_user_backfill'`).Scan(&done); err != nil {
		return
	}
	if done > 0 {
		return
	}

	// Kumpulkan semua santri yatim dulu ke memori lalu tutup rows, karena
	// menulis (INSERT/UPDATE users/santri) saat rows masih terbuka akan
	// deadlock pada koneksi SQLite tunggal.
	type orphan struct {
		id    int
		nis   string
		name  string
		regID int
	}
	var orphans []orphan
	rows, err := DB.Query(`SELECT id, nis, name, COALESCE(registration_id,0) FROM santri WHERE user_id IS NULL`)
	if err == nil {
		for rows.Next() {
			var o orphan
			_ = rows.Scan(&o.id, &o.nis, &o.name, &o.regID)
			orphans = append(orphans, o)
		}
		rows.Close()
	}

	linked := 0
	for _, o := range orphans {
		uid, ok := backfillResolveUserID(o.id, o.nis, o.name, o.regID)
		if !ok {
			continue
		}
		if _, err := DB.Exec(`UPDATE santri SET user_id=? WHERE id=?`, uid, o.id); err == nil {
			linked++
		}
	}
	_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES ('santri_user_backfill')")
	log.Printf("[DB] Backfill sambungan dashboard-dan-santri: %d santri manual ditautkan ke akun users", linked)
}

func backfillResolveUserID(santriID int, nis, name string, regID int) (int, bool) {
	if regID > 0 {
		var uid sql.NullInt64
		if err := DB.QueryRow(`SELECT user_id FROM registrations WHERE id=?`, regID).Scan(&uid); err == nil && uid.Valid && uid.Int64 > 0 {
			return int(uid.Int64), true
		}
	}
	base := strings.TrimSpace(nis)
	if base == "" {
		base = fmt.Sprintf("santri-%d", santriID)
	}
	email := base + "@almaparung.local"

	var existing sql.NullInt64
	err := DB.QueryRow(`SELECT id FROM users WHERE email=?`, email).Scan(&existing)
	if err == nil && existing.Valid {
		return int(existing.Int64), true
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return 0, false
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(raw)), bcrypt.DefaultCost)
	if err != nil {
		return 0, false
	}
	res, err := DB.Exec(`INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?, 'user')`,
		email, string(hash), name)
	if err != nil {
		return 0, false
	}
	uid, _ := res.LastInsertId()
	return int(uid), true
}

func addColumnIfNotExists(table, column, colType string) {
	rows, err := DB.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return
	}
	defer rows.Close()

	exists := false
	for rows.Next() {
		var cid int
		var name, typ string
		var notnull int
		var dflt sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &typ, &notnull, &dflt, &pk); err != nil {
			continue
		}
		if name == column {
			exists = true
			break
		}
	}
	if !exists {
		if _, err := DB.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", table, column, colType)); err != nil {
			log.Printf("[DB] Failed adding column %s.%s: %v", table, column, err)
			return
		}
		log.Printf("[DB] Added column %s.%s", table, column)
	}
}
