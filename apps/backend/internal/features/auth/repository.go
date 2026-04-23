package auth

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	CreatedAt    time.Time  `json:"created_at"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByEmail(email string) (*User, error) {
	var u User
	var createdAt string
	var lastLoginAt sql.NullString
	err := r.db.QueryRow("SELECT id, email, password_hash, name, role, created_at, last_login_at FROM users WHERE email = ?", email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &createdAt, &lastLoginAt)

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
	return &u, nil
}

func (r *Repository) CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func (r *Repository) UpdatePassword(id int, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(hash), id)
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
		// DUMMY hash for OAuth users
		hash, _ = bcrypt.GenerateFromPassword([]byte("oauth_dummy_secret"), bcrypt.DefaultCost)
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
	query := `SELECT id, email, COALESCE(password_hash,''), name, role, created_at, last_login_at FROM users`
	var args []interface{}

	if search != "" {
		query += " WHERE email LIKE ? OR name LIKE ?"
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
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &createdAt, &lastLoginAt); err != nil {
			return nil, err
		}
		u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		if lastLoginAt.Valid && lastLoginAt.String != "" {
			if parsed, parseErr := time.Parse("2006-01-02 15:04:05", lastLoginAt.String); parseErr == nil {
				u.LastLoginAt = &parsed
			}
		}
		u.PasswordHash = "" // never expose
		users = append(users, u)
	}
	return users, nil
}

func (r *Repository) UpdateLastLogin(id int) error {
	_, err := r.db.Exec("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", id)
	return err
}

func (r *Repository) DeleteUser(id int) error {
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
		{query: "DELETE FROM grades WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM attendance WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM tahfidz_progress WHERE student_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM payments WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM registrations WHERE user_id = ?", args: []interface{}{id}},
		{query: "DELETE FROM activity_logs WHERE user_id = ?", args: []interface{}{id}},
	}

	for _, stmt := range statements {
		if _, err = tx.Exec(stmt.query, stmt.args...); err != nil {
			return err
		}
	}

	result, err := tx.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	err = tx.Commit()
	return err
}

func (r *Repository) UpdateRole(userID int, role string) error {
	validRoles := map[string]bool{
		"superadmin": true, "bendahara": true, "panitia_psb": true, "tim_media": true, "admin": true, "user": true,
	}
	if !validRoles[role] {
		return errors.New("invalid role: " + role)
	}
	_, err := r.db.Exec("UPDATE users SET role = ? WHERE id = ?", role, userID)
	return err
}
