package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"almaparung-api/internal/validators"
	"golang.org/x/crypto/bcrypt"
)

// AUDIT FIX [6.1]: OAuth/p registered users must not share one guessable
// password hash. Each gets a unique random 256-bit dummy so password-login
// into SSO accounts is infeasible without a real password set.
func randomDummyPasswordHash() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(raw)), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	TokenVersion int        `json:"-"`
	CreatedAt    time.Time  `json:"created_at"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	// PhotoURL path relatif hasil upload avatar sendiri (Jilid 69). NULL = belum
	// pasang foto, frontend harus fallback ke inisial. Sengaja TIDAK di-json
	// sebagai omitempty supaya frontend bisa bedakan "" (kosong) vs tidak ada.
	PhotoURL *string `json:"photo_url"`
}

type Repository struct {
	db *sql.DB
}

var ErrLastSuperadmin = errors.New("cannot remove the last superadmin")

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByEmail(email string) (*User, error) {
	var u User
	var createdAt string
	var lastLoginAt sql.NullString
	var photoURL sql.NullString
	err := r.db.QueryRow("SELECT id, email, password_hash, name, role, created_at, last_login_at, photo_url FROM users WHERE email = ?", email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &createdAt, &lastLoginAt, &photoURL)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}

	u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	if lastLoginAt.Valid && lastLoginAt.String != "" {
		if parsed, parseErr := time.Parse("2006-01-02 15:04:05", lastLoginAt.String); parseErr == nil {
			u.LastLoginAt = &parsed
		}
	}
	if photoURL.Valid && photoURL.String != "" {
		u.PhotoURL = &photoURL.String
	}
	return &u, nil
}

func (r *Repository) CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// FindByID mengambil user by ID beserta token_version (untuk validasi sesi).
func (r *Repository) FindByID(id int) (*User, error) {
	var u User
	var createdAt string
	var lastLoginAt sql.NullString
	var photoURL sql.NullString
	err := r.db.QueryRow("SELECT id, email, password_hash, name, role, COALESCE(token_version,0), created_at, last_login_at, photo_url FROM users WHERE id = ?", id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.TokenVersion, &createdAt, &lastLoginAt, &photoURL)
	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}
	u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	if lastLoginAt.Valid && lastLoginAt.String != "" {
		if parsed, parseErr := time.Parse("2006-01-02 15:04:05", lastLoginAt.String); parseErr == nil {
			u.LastLoginAt = &parsed
		}
	}
	if photoURL.Valid && photoURL.String != "" {
		u.PhotoURL = &photoURL.String
	}
	return &u, nil
}

// GetTokenVersion mengambil versi sesi user (0 bila kolom belum ada/error).
func (r *Repository) GetTokenVersion(id int) int {
	var tv int
	if err := r.db.QueryRow("SELECT COALESCE(token_version,0) FROM users WHERE id = ?", id).Scan(&tv); err != nil {
		return 0
	}
	return tv
}

// BumpTokenVersion menaikkan versi sesi sehingga SEMUA token lama user
// tersebut invalid (dipakai saat logout, reset password, ganti role).
func (r *Repository) BumpTokenVersion(id int) error {
	_, err := r.db.Exec("UPDATE users SET token_version = COALESCE(token_version,0) + 1 WHERE id = ?", id)
	return err
}

func (r *Repository) UpdatePassword(id int, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(hash), id)
	return err
}

// SetPhotoURL menyimpan/menghapus path avatar user. photoURL == nil berarti
// lepaskan avatar (kembali ke inisial).
func (r *Repository) SetPhotoURL(id int, photoURL *string) error {
	if photoURL == nil {
		_, err := r.db.Exec("UPDATE users SET photo_url = NULL WHERE id = ?", id)
		return err
	}
	_, err := r.db.Exec("UPDATE users SET photo_url = ? WHERE id = ?", *photoURL, id)
	return err
}

func (r *Repository) CreateUser(user *User) error {
	var hash []byte
	var err error
	if user.PasswordHash != "" {
		hash, err = bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
	} else {
		// AUDIT FIX [6.1]: unique random dummy — see randomDummyPasswordHash.
		var dummy string
		dummy, err = randomDummyPasswordHash()
		if err != nil {
			return err
		}
		hash = []byte(dummy)
	}

	res, err := r.db.Exec("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
		user.Email, string(hash), user.Name, user.Role)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	user.CreatedAt = time.Now()
	// user.PasswordHash is cleared for safety after insert
	user.PasswordHash = ""
	return nil
}

func (r *Repository) GetAllUsers(search string) ([]User, error) {
	query := `SELECT id, email, COALESCE(password_hash,''), name, role, created_at, last_login_at, photo_url FROM users WHERE role IN (?, ?, ?, ?, ?, ?, ?, ?)`
	args := []interface{}{"superadmin", "bendahara", "panitia_psb", "tim_media", "pimpinan", "wali_kelas", "guru", "ustadz"}

	if search != "" {
		query += " AND (email LIKE ? OR name LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	query += " ORDER BY id ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		var createdAt string
		var lastLoginAt sql.NullString
		var photoURL sql.NullString
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &createdAt, &lastLoginAt, &photoURL); err != nil {
			return nil, err
		}
		u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		if lastLoginAt.Valid && lastLoginAt.String != "" {
			if parsed, parseErr := time.Parse("2006-01-02 15:04:05", lastLoginAt.String); parseErr == nil {
				u.LastLoginAt = &parsed
			}
		}
		if photoURL.Valid && photoURL.String != "" {
			u.PhotoURL = &photoURL.String
		}
		u.PasswordHash = ""
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *Repository) UpdateLastLogin(id int) error {
	_, err := r.db.Exec("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	return err
}

func (r *Repository) DeleteUser(id int) (err error) {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	statements := []struct {
		query string
		args  []interface{}
	}{
		{query: "UPDATE subjects SET teacher_id = NULL WHERE teacher_id = ?", args: []interface{}{id}},
		{query: "UPDATE news SET author_id = NULL WHERE author_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM exam_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE student_id = ?)", args: []interface{}{id}},
		{query: "DELETE FROM exam_sessions WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM user_wallets WHERE user_id = ?)", args: []interface{}{id}},
		{query: "DELETE FROM user_wallets WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM user_qr_tokens WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM student_points WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM violation_logs WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM grades WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM attendance WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM tahfidz_progress WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM payments WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM registrations WHERE user_id = ?", args: []interface{}{id}},
		// PHASE 2/7: audit history TIDAK dihapus saat user dihapus (retensi forensik).
		{query: "UPDATE activity_logs SET user_id = NULL WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM kesantrian_aspek WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM raports WHERE student_id = ?", args: []interface{}{id}},
	}

	for _, stmt := range statements {
		if _, err = tx.Exec(stmt.query, stmt.args...); err != nil {
			if isMissingTableError(err) {
				err = nil
				continue
			}
			return err
		}
	}

	result, err := tx.Exec(`DELETE FROM users
		WHERE id = ?
		  AND (role <> 'superadmin' OR EXISTS (
			SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?
		))`, id, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		var role string
		lookupErr := tx.QueryRow("SELECT role FROM users WHERE id = ?", id).Scan(&role)
		if lookupErr == nil && role == "superadmin" {
			return ErrLastSuperadmin
		}
		return sql.ErrNoRows
	}

	err = tx.Commit()
	return err
}

func isMissingTableError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "no such table")
}

func (r *Repository) UpdateRole(userID int, role string) error {
	if !validators.IsManageableRole(role) {
		return errors.New("invalid role: " + role)
	}
	if role == "superadmin" {
		_, err := r.db.Exec("UPDATE users SET role = ? WHERE id = ?", role, userID)
		return err
	}
	result, err := r.db.Exec(`UPDATE users SET role = ?
		WHERE id = ?
		  AND (role <> 'superadmin' OR EXISTS (
			SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?
		))`, role, userID, userID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		var currentRole string
		lookupErr := r.db.QueryRow("SELECT role FROM users WHERE id = ?", userID).Scan(&currentRole)
		if lookupErr == nil && currentRole == "superadmin" {
			return ErrLastSuperadmin
		}
		return sql.ErrNoRows
	}
	return nil
}
