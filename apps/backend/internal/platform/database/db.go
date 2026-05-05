package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

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
		dbPath = "./darussunnah.db"
	}

	absPath, absErr := filepath.Abs(dbPath)
	if absErr == nil {
		dbPath = absPath
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
		CHECK (role IN ('superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'admin', 'user'))
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
		final_score REAL DEFAULT 0,
		grade_letter TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id),
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
		kk_url TEXT,
		ijazah_url TEXT,
		pasfoto_url TEXT,
		payment_proof_url TEXT DEFAULT '',
		payment_amount INTEGER DEFAULT 0,
		payment_date TEXT DEFAULT '',
		payment_status TEXT DEFAULT 'unpaid',
		payment_note TEXT DEFAULT '',
		status TEXT DEFAULT 'pending',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

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
	`

	_, err := DB.Exec(query)
	if err != nil {
		log.Fatalf("Error auto-migrating tables: %v", err)
	}

	addColumnIfNotExists("users", "whatsapp", "TEXT DEFAULT ''")
	addColumnIfNotExists("users", "last_login_at", "DATETIME")
	addColumnIfNotExists("gallery", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("gallery", "album_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "album_slug", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "event_date", "TEXT DEFAULT ''")
	addColumnIfNotExists("gallery", "is_album_cover", "BOOLEAN DEFAULT 0")
	addColumnIfNotExists("videos", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
	addColumnIfNotExists("videos", "series_name", "TEXT DEFAULT ''")
	addColumnIfNotExists("videos", "series_slug", "TEXT DEFAULT ''")
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
	addColumnIfNotExists("registrations", "updated_at", "DATETIME")
	addColumnIfNotExists("settings", "value", "TEXT")
	addColumnIfNotExists("settings", "description", "TEXT")
	addColumnIfNotExists("settings", "updated_at", "DATETIME")
	addColumnIfNotExists("teachers", "email", "TEXT DEFAULT ''")
	addColumnIfNotExists("teachers", "whatsapp", "TEXT DEFAULT ''")
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
	}

	for _, migration := range migrations {
		if _, err := DB.Exec(migration.sql); err != nil {
			log.Printf("[DB] Migration %s skipped: %v", migration.name, err)
			continue
		}
		_, _ = DB.Exec("INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)", migration.name)
	}
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
