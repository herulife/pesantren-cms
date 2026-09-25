package auth

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	_ "modernc.org/sqlite"
)

func setupAuthTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL,
		token_version INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login_at DATETIME
	);`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("failed to create schema: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})
	return db
}

func TestCreateUserAndFindByEmail(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "user@example.com",
		PasswordHash: "12345678",
		Name:         "User Test",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if u.ID == 0 {
		t.Fatal("expected generated user ID")
	}
	if u.PasswordHash != "" {
		t.Fatal("expected password hash to be cleared after create")
	}

	found, err := repo.FindByEmail("user@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}
	if found.Email != "user@example.com" {
		t.Fatalf("unexpected email: %s", found.Email)
	}
	if found.PasswordHash == "12345678" || found.PasswordHash == "" {
		t.Fatal("expected hashed password in database")
	}
}

func TestCheckPassword(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "check@example.com",
		PasswordHash: "12345678",
		Name:         "Check User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	found, err := repo.FindByEmail("check@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}

	if err := repo.CheckPassword(found.PasswordHash, "12345678"); err != nil {
		t.Fatalf("expected password check to pass, got: %v", err)
	}
	if err := repo.CheckPassword(found.PasswordHash, "wrongpass"); err == nil {
		t.Fatal("expected password check to fail for wrong password")
	}
}

func TestGetAllUsersReturnsOnlyStaff(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	users := []User{
		{Email: "superadmin@example.com", PasswordHash: "12345678", Name: "Super Admin", Role: "superadmin"},
		{Email: "finance@example.com", PasswordHash: "12345678", Name: "Finance Staff", Role: "bendahara"},
		{Email: "psb@example.com", PasswordHash: "12345678", Name: "PSB Staff", Role: "panitia_psb"},
		{Email: "media@example.com", PasswordHash: "12345678", Name: "Media Staff", Role: "tim_media"},
		{Email: "wali@example.com", PasswordHash: "12345678", Name: "Portal Wali", Role: "user"},
		{Email: "legacy-admin@example.com", PasswordHash: "12345678", Name: "Legacy Admin", Role: "admin"},
	}
	for i := range users {
		if err := repo.CreateUser(&users[i]); err != nil {
			t.Fatalf("CreateUser failed for %s: %v", users[i].Role, err)
		}
	}

	listed, err := repo.GetAllUsers("")
	if err != nil {
		t.Fatalf("GetAllUsers failed: %v", err)
	}
	if len(listed) != 4 {
		t.Fatalf("expected 4 manageable users, got %d", len(listed))
	}
	for _, user := range listed {
		if user.Role == "user" || user.Role == "admin" {
			t.Fatalf("unmanageable role returned: %s", user.Role)
		}
	}

	searched, err := repo.GetAllUsers("finance")
	if err != nil {
		t.Fatalf("GetAllUsers search failed: %v", err)
	}
	if len(searched) != 1 || searched[0].Role != "bendahara" {
		t.Fatalf("unexpected staff search result: %+v", searched)
	}

	searched, err = repo.GetAllUsers("wali")
	if err != nil {
		t.Fatalf("GetAllUsers portal search failed: %v", err)
	}
	if len(searched) != 0 {
		t.Fatalf("expected portal user to be excluded, got %d", len(searched))
	}
}

func TestUpdateRoleValidation(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "role@example.com",
		PasswordHash: "12345678",
		Name:         "Role User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if err := repo.UpdateRole(u.ID, "superadmin"); err != nil {
		t.Fatalf("expected valid role update to pass, got: %v", err)
	}
	if err := repo.UpdateRole(u.ID, "invalid_role"); err == nil {
		t.Fatal("expected invalid role update to fail")
	}
	if err := repo.UpdateRole(u.ID, "user"); err == nil {
		t.Fatal("expected portal role update to fail")
	}
	if err := repo.UpdateRole(u.ID, "admin"); err == nil {
		t.Fatal("expected legacy admin role update to fail")
	}
}

func TestUpdateRoleProtectsLastSuperadmin(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)
	first := &User{Email: "first-role@example.com", PasswordHash: "12345678", Name: "First Admin", Role: "superadmin"}
	if err := repo.CreateUser(first); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := repo.CreateUser(&User{Email: "staff-role@example.com", PasswordHash: "12345678", Name: "Staff", Role: "bendahara"}); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if err := repo.UpdateRole(first.ID, "bendahara"); !errors.Is(err, ErrLastSuperadmin) {
		t.Fatalf("expected last-superadmin error, got %v", err)
	}
	current, err := repo.FindByID(first.ID)
	if err != nil || current.Role != "superadmin" {
		t.Fatalf("expected superadmin to remain, got user=%+v err=%v", current, err)
	}

	second := &User{Email: "second-role@example.com", PasswordHash: "12345678", Name: "Second Admin", Role: "superadmin"}
	if err := repo.CreateUser(second); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := repo.UpdateRole(first.ID, "bendahara"); err != nil {
		t.Fatalf("expected role update to succeed with another superadmin: %v", err)
	}
}

func TestDeleteUserProtectsLastSuperadmin(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)
	first := &User{Email: "first-delete@example.com", PasswordHash: "12345678", Name: "First Admin", Role: "superadmin"}
	if err := repo.CreateUser(first); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := repo.DeleteUser(first.ID); !errors.Is(err, ErrLastSuperadmin) {
		t.Fatalf("expected last-superadmin error, got %v", err)
	}
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM users WHERE id = ?", first.ID).Scan(&count); err != nil {
		t.Fatalf("failed to count user: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected protected user to remain, got count %d", count)
	}

	second := &User{Email: "second-delete@example.com", PasswordHash: "12345678", Name: "Second Admin", Role: "superadmin"}
	if err := repo.CreateUser(second); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := repo.DeleteUser(first.ID); err != nil {
		t.Fatalf("expected delete to succeed with another superadmin: %v", err)
	}
}

func TestUpdatePassword(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	u := &User{
		Email:        "password@example.com",
		PasswordHash: "12345678",
		Name:         "Password User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if err := repo.UpdatePassword(u.ID, "newpassword123"); err != nil {
		t.Fatalf("UpdatePassword failed: %v", err)
	}

	found, err := repo.FindByEmail("password@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}
	if err := repo.CheckPassword(found.PasswordHash, "newpassword123"); err != nil {
		t.Fatalf("expected new password to match, got: %v", err)
	}
}

func TestDeleteUserCleansDependentPortalData(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatalf("failed to enable foreign keys: %v", err)
	}

	schema := `
	CREATE TABLE user_wallets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL UNIQUE,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);
	CREATE TABLE wallet_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		wallet_id INTEGER NOT NULL,
		FOREIGN KEY (wallet_id) REFERENCES user_wallets(id)
	);
	CREATE TABLE user_qr_tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);
	CREATE TABLE exam_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);
	CREATE TABLE exam_answers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		session_id INTEGER NOT NULL,
		FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
	);
	CREATE TABLE student_points (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL UNIQUE,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);
	CREATE TABLE violation_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);
	CREATE TABLE news (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		author_id INTEGER,
		FOREIGN KEY (author_id) REFERENCES users(id)
	);`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("failed to create dependent schema: %v", err)
	}

	u := &User{
		Email:        "delete@example.com",
		PasswordHash: "12345678",
		Name:         "Delete User",
		Role:         "user",
	}
	if err := repo.CreateUser(u); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	walletResult, err := db.Exec("INSERT INTO user_wallets (user_id) VALUES (?)", u.ID)
	if err != nil {
		t.Fatalf("failed to insert wallet: %v", err)
	}
	walletID, err := walletResult.LastInsertId()
	if err != nil {
		t.Fatalf("failed to read wallet id: %v", err)
	}
	if _, err := db.Exec("INSERT INTO wallet_transactions (wallet_id) VALUES (?)", walletID); err != nil {
		t.Fatalf("failed to insert wallet transaction: %v", err)
	}
	sessionResult, err := db.Exec("INSERT INTO exam_sessions (student_id) VALUES (?)", u.ID)
	if err != nil {
		t.Fatalf("failed to insert exam session: %v", err)
	}
	sessionID, err := sessionResult.LastInsertId()
	if err != nil {
		t.Fatalf("failed to read session id: %v", err)
	}
	if _, err := db.Exec("INSERT INTO exam_answers (session_id) VALUES (?)", sessionID); err != nil {
		t.Fatalf("failed to insert exam answer: %v", err)
	}
	if _, err := db.Exec("INSERT INTO user_qr_tokens (user_id) VALUES (?)", u.ID); err != nil {
		t.Fatalf("failed to insert QR token: %v", err)
	}
	if _, err := db.Exec("INSERT INTO student_points (student_id) VALUES (?)", u.ID); err != nil {
		t.Fatalf("failed to insert student points: %v", err)
	}
	if _, err := db.Exec("INSERT INTO violation_logs (student_id) VALUES (?)", u.ID); err != nil {
		t.Fatalf("failed to insert violation log: %v", err)
	}
	if _, err := db.Exec("INSERT INTO news (author_id) VALUES (?)", u.ID); err != nil {
		t.Fatalf("failed to insert news: %v", err)
	}

	if err := repo.DeleteUser(u.ID); err != nil {
		t.Fatalf("DeleteUser failed: %v", err)
	}

	assertCount(t, db, "users", 0)
	assertCount(t, db, "user_wallets", 0)
	assertCount(t, db, "wallet_transactions", 0)
	assertCount(t, db, "user_qr_tokens", 0)
	assertCount(t, db, "exam_sessions", 0)
	assertCount(t, db, "exam_answers", 0)
	assertCount(t, db, "student_points", 0)
	assertCount(t, db, "violation_logs", 0)
	assertNullCount(t, db, "news", "author_id", 1)
}

func TestRejectSelfUserAction(t *testing.T) {
	req := httptest.NewRequest(http.MethodPut, "/api/users/7/password", nil)
	ctx := context.WithValue(req.Context(), UserContextKey, jwt.MapClaims{
		"id":    7,
		"role":  "superadmin",
		"email": "admin@example.com",
	})
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	if !rejectSelfUserAction(rr, req, 7) {
		t.Fatal("expected self user action to be rejected")
	}
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestRejectLastSuperadmin(t *testing.T) {
	db := setupAuthTestDB(t)
	repo := NewRepository(db)
	first := &User{Email: "first-admin@example.com", PasswordHash: "12345678", Name: "First Admin", Role: "superadmin"}
	if err := repo.CreateUser(first); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := repo.CreateUser(&User{Email: "staff@example.com", PasswordHash: "12345678", Name: "Staff", Role: "bendahara"}); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	h := NewHandler(repo)
	req := httptest.NewRequest(http.MethodPut, "/api/users/"+strconv.Itoa(first.ID)+"/role", nil)
	rr := httptest.NewRecorder()
	if !h.rejectLastSuperadmin(rr, req, first.ID) {
		t.Fatal("expected the only superadmin to be protected")
	}
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}

	second := &User{Email: "second-admin@example.com", PasswordHash: "12345678", Name: "Second Admin", Role: "superadmin"}
	if err := repo.CreateUser(second); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	rr = httptest.NewRecorder()
	if h.rejectLastSuperadmin(rr, req, first.ID) {
		t.Fatal("expected demotion to remain allowed while another superadmin exists")
	}
}

func assertCount(t *testing.T, db *sql.DB, table string, expected int) {
	t.Helper()

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&count); err != nil {
		t.Fatalf("failed to count %s: %v", table, err)
	}
	if count != expected {
		t.Fatalf("expected %s count %d, got %d", table, expected, count)
	}
}

func assertNullCount(t *testing.T, db *sql.DB, table string, column string, expected int) {
	t.Helper()

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM " + table + " WHERE " + column + " IS NULL").Scan(&count); err != nil {
		t.Fatalf("failed to count null %s.%s: %v", table, column, err)
	}
	if count != expected {
		t.Fatalf("expected null %s.%s count %d, got %d", table, column, expected, count)
	}
}
