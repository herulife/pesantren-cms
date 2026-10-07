package walisantri

import (
	"database/sql"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var ErrDuplicateEmail = errors.New("email sudah dipakai akun lain")

var ErrNotWali = errors.New("akun ini bukan akun wali")

// Santri adalah anak yang tertaut ke satu akun wali.
type Santri struct {
	SantriID int    `json:"santri_id"`
	NIS      string `json:"nis"`
	Name     string `json:"name"`
	Class    string `json:"class"`
}

// Account adalah satu akun wali + semua Santri yang terlihat oleh wali itu.
// SeveralSantri = saudara, satu login cukup untuk semua anaknya.
type Account struct {
	UserID   int    `json:"user_id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Whatsapp string `json:"whatsapp"`
	Role     string `json:"role"`
	// IsPlaceholder = email masih @almaparung.local hasil import.
	IsPlaceholder bool `json:"is_placeholder"`
	// NamePlaceholder = nama masih karangan "Wali <nama Santri>".
	NamePlaceholder bool     `json:"name_placeholder"`
	NeedsNote       string   `json:"needs_note,omitempty"`
	LastLoginAt     string   `json:"last_login_at,omitempty"`
	Santri          []Santri `json:"santri"`
}

// Orphan adalah akun role=user yang tidak tertaut ke Santri mana pun.
// Tidak dihapus otomatis, tapi ditampilkan agar terlihat.
type Orphan struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

type Stats struct {
	TotalAccounts int `json:"total_accounts"`
	TotalSantri   int `json:"total_santri"`
	Placeholder   int `json:"placeholder"`
	Orphan        int `json:"orphan"`
	MultiSantri   int `json:"multi_santri"`
}

type List struct {
	Accounts []Account `json:"accounts"`
	Orphans  []Orphan  `json:"orphans"`
	Stats    Stats     `json:"stats"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

// placeholderPrefix adalah penanda email/nama karangan. Dipakai supaya admin
// bisa langsung melihat mana data yang masih perlu diganti data asli.
const placeholderPrefix = "wali"

// isPlaceholderName menandai nama karangan hasil import. Import wali membuat
// nama "Wali <nama Santri>" kalau nama wali asli tidak tersedia di DB. Ini
// hanya sinyal untuk tampilan; kolom name tetap sumber kebenaran.
func isPlaceholderName(name string) bool {
	return strings.HasPrefix(strings.TrimSpace(name), "Wali ")
}

func isPlaceholderEmail(email string) bool {
	e := strings.ToLower(strings.TrimSpace(email))
	return strings.HasPrefix(e, placeholderPrefix+"") && strings.HasSuffix(e, "@almaparung.local")
}

// ListAll menyatukan akun wali dengan Santri-nya. Query sengaja dipisah dua
// tahap: SELECT akun lebih dulu, lalu SELECT Santri per akun. Menghindari N+1
// dan tidak bisa salah jumlah karena satu baris = satu anak.
func (r *Repository) ListAll() (*List, error) {
	rows, err := r.db.Query(`SELECT u.id, u.name, u.email, COALESCE(u.whatsapp,''), u.role,
		COALESCE(u.last_login_at,'')
		FROM users u
		WHERE u.role='user'
		  AND EXISTS (SELECT 1 FROM santri s WHERE s.user_id=u.id)
		ORDER BY u.name COLLATE NOCASE`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := &List{Accounts: []Account{}, Orphans: []Orphan{}}
	index := map[int]int{}
	for rows.Next() {
		var a Account
		if err := rows.Scan(&a.UserID, &a.Name, &a.Email, &a.Whatsapp, &a.Role, &a.LastLoginAt); err != nil {
			return nil, err
		}
		a.Santri = []Santri{}
		a.IsPlaceholder = isPlaceholderEmail(a.Email)
		a.NamePlaceholder = isPlaceholderName(a.Name)
		index[a.UserID] = len(out.Accounts)
		out.Accounts = append(out.Accounts, a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Tahapan 2: semua Santri yang tertaut, dikelompokkan lewat map.
	srows, err := r.db.Query(`SELECT s.user_id, s.id, s.nis, s.name, COALESCE(s.class,'')
		FROM santri s WHERE s.user_id IS NOT NULL ORDER BY s.name COLLATE NOCASE`)
	if err != nil {
		return nil, err
	}
	defer srows.Close()
	for srows.Next() {
		var uid int
		var s Santri
		if err := srows.Scan(&uid, &s.SantriID, &s.NIS, &s.Name, &s.Class); err != nil {
			return nil, err
		}
		if i, ok := index[uid]; ok {
			out.Accounts[i].Santri = append(out.Accounts[i].Santri, s)
		}
	}
	if err := srows.Err(); err != nil {
		return nil, err
	}

	// Tahap 3: akun yatim + statistik.
	orows, err := r.db.Query(`SELECT u.id, u.name, u.email FROM users u
		WHERE u.role='user'
		  AND NOT EXISTS (SELECT 1 FROM santri s WHERE s.user_id=u.id)
		ORDER BY u.id`)
	if err != nil {
		return nil, err
	}
	defer orows.Close()
	for orows.Next() {
		var o Orphan
		if err := orows.Scan(&o.UserID, &o.Name, &o.Email); err != nil {
			return nil, err
		}
		out.Orphans = append(out.Orphans, o)
	}
	if err := orows.Err(); err != nil {
		return nil, err
	}

	for _, a := range out.Accounts {
		out.Stats.TotalAccounts++
		out.Stats.TotalSantri += len(a.Santri)
		if len(a.Santri) > 1 {
			out.Stats.MultiSantri++
		}
		if a.NamePlaceholder || strings.TrimSpace(a.Name) == "" {
			out.Stats.Placeholder++
			a.NeedsNote = "Nama wali masih karangan - ganti dengan nama asli"
		} else if a.IsPlaceholder {
			a.NeedsNote = "Email masih @almaparung.local - ganti dengan email asli"
		}
	}
	out.Stats.Orphan = len(out.Orphans)
	return out, nil
}

type UpdateInput struct {
	Name     string
	Email    string
	Whatsapp string
}

// Update mengubah nama + email + nomor WhatsApp akun wali. Ini yang membuat
// data karangan bisa diganti admin kapan saja tanpa membuat akun baru.
func (r *Repository) Update(userID int, in UpdateInput) error {
	var emailTaken bool
	err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email=? AND id<>?)`, in.Email, userID).Scan(&emailTaken)
	if err != nil {
		return err
	}
	if emailTaken {
		return ErrDuplicateEmail
	}
	var role string
	if err := r.db.QueryRow(`SELECT role FROM users WHERE id=?`, userID).Scan(&role); err != nil {
		return err
	}
	if role != "user" {
		return ErrNotWali
	}
	_, err = r.db.Exec(`UPDATE users SET name=?, email=?, whatsapp=? WHERE id=?`, in.Name, in.Email, in.Whatsapp, userID)
	return err
}

// CreateInput untuk membuat akun wali baru (superadmin/bendahara). Password
// diwajibkan: admin menentukan password awal dan menyampaikannya ke wali.
// SantriIDs opsional: santri yang langsung ditautkan (satu keluarga berbagi 1 login).
type CreateInput struct {
	Name      string
	Email     string
	Whatsapp  string
	Password  string
	SantriIDs []int
}

// Create membuat akun role 'user' + menautkan Santri yang dipilih. Ditulis
// dalam satu transaksi supaya kalau ada Santri yang dipilih tapi tidak ada,
// akun tidak jadi terlanjur dibuat.
func (r *Repository) Create(in CreateInput) (int, error) {
	var taken bool
	if err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email=?)`, in.Email).Scan(&taken); err != nil {
		return 0, err
	}
	if taken {
		return 0, ErrDuplicateEmail
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}

	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(`INSERT INTO users (email, password_hash, name, role, whatsapp, created_at)
		VALUES (?, ?, ?, 'user', ?, datetime('now'))`,
		in.Email, string(hash), in.Name, in.Whatsapp)
	if err != nil {
		return 0, err
	}
	uid, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	for _, sid := range in.SantriIDs {
		if sid <= 0 {
			continue
		}
		var exists int
		if err := tx.QueryRow(`SELECT COUNT(*) FROM santri WHERE id=?`, sid).Scan(&exists); err != nil {
			return 0, err
		}
		if exists == 0 {
			return 0, sql.ErrNoRows
		}
		if _, err := tx.Exec(`UPDATE santri SET user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
			uid, sid); err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return int(uid), nil
}

// ResetPassword mengganti password akun wali dan memutar token_version supaya
// semua sesi lama otomatis tidak berlaku (wali wajib login ulang).
func (r *Repository) ResetPassword(userID int, newPassword string) error {
	var role string
	if err := r.db.QueryRow(`SELECT role FROM users WHERE id=?`, userID).Scan(&role); err != nil {
		return err
	}
	if role != "user" {
		return ErrNotWali
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(`UPDATE users SET password_hash=?, token_version=token_version+1 WHERE id=?`,
		string(hash), userID)
	return err
}
