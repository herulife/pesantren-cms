package auth

import (
	"context"
	"darussunnah-api/internal/platform/database"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"google.golang.org/api/idtoken"
)

func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		logger.Error(context.Background(), "missing JWT_SECRET environment variable", nil)
		return nil
	}
	return []byte(secret)
}

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}

	var req validators.LoginRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}
	if validationErrs := validators.ValidateLoginRequest(&req); len(validationErrs) > 0 {
		writeValidationError(w, correlationID, validationErrs)
		return
	}

	user, err := h.repo.FindByEmail(req.Email)
	if err != nil {
		logger.Warn(r.Context(), "invalid login credentials", logger.Field{
			"correlation_id": correlationID,
			"email":          req.Email,
		})
		writeAPIError(w, http.StatusUnauthorized, correlationID, "Email atau kata sandi tidak valid", nil)
		return
	}

	if err := h.repo.CheckPassword(user.PasswordHash, req.Password); err != nil {
		logger.Warn(r.Context(), "invalid login credentials", logger.Field{
			"correlation_id": correlationID,
			"email":          req.Email,
		})
		writeAPIError(w, http.StatusUnauthorized, correlationID, "Email atau kata sandi tidak valid", nil)
		return
	}

	if err := h.repo.UpdateLastLogin(user.ID); err != nil {
		logger.Warn(r.Context(), "failed updating last login", logger.Field{
			"correlation_id": correlationID,
			"user_id":        user.ID,
			"error":          err.Error(),
		})
	} else {
		now := time.Now()
		user.LastLoginAt = &now
	}

	// Create JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(GetJWTSecret())
	if err != nil {
		logger.Error(r.Context(), "failed generating jwt token", logger.Field{
			"correlation_id": correlationID,
			"error":          err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, correlationID, "Gagal membuat token akses", nil)
		return
	}

	setAuthCookie(w, tokenString)

	// Log activity
	logger.RecordActivity(&user.ID, "LOGIN", "Berhasil login ke sistem admin", r.RemoteAddr, r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Correlation-ID", correlationID)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

// REGISTER endpoint
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}

	var req validators.RegisterRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}
	if validationErrs := validators.ValidateRegisterRequest(&req); len(validationErrs) > 0 {
		writeValidationError(w, correlationID, validationErrs)
		return
	}

	// Cek jika email sudah terdaftar
	existing, _ := h.repo.FindByEmail(req.Email)
	if existing != nil {
		logger.Warn(r.Context(), "register conflict email already exists", logger.Field{
			"correlation_id": correlationID,
			"email":          req.Email,
		})
		writeAPIError(w, http.StatusConflict, correlationID, "Email sudah terdaftar", nil)
		return
	}

	newUser := User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: req.Password, // Akan di hash di repo
		Role:         "user",       // Default role
	}

	if err := h.repo.CreateUser(&newUser); err != nil {
		logger.Error(r.Context(), "failed creating user account", logger.Field{
			"correlation_id": correlationID,
			"email":          req.Email,
			"error":          err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, correlationID, "Gagal membuat akun", nil)
		return
	}

	logger.RecordActivity(&newUser.ID, "REGISTER", "Pengguna baru mendaftar", r.RemoteAddr, r.UserAgent())
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Correlation-ID", correlationID)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pendaftaran berhasil, silakan login",
	})
}

// GOOGLE LOGIN endpoint
func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	var req struct {
		Token string `json:"credential"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}
	req.Token = strings.TrimSpace(req.Token)
	if req.Token == "" {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Credential wajib diisi", nil)
		return
	}

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	var email, name string

	// Bypassing validasi hanya saat development lokal yang eksplisit.
	if os.Getenv("DEV_MODE") == "true" && clientID == "mock_client_id" && req.Token == "mock_token" {
		email = "mockuser@google.com"
		name = "Google Mock User"
	} else {
		if strings.TrimSpace(clientID) == "" || clientID == "mock_client_id" {
			logger.Warn(r.Context(), "google login misconfigured", logger.Field{
				"correlation_id": correlationID,
			})
			writeAPIError(w, http.StatusServiceUnavailable, correlationID, "Login Google belum dikonfigurasi", nil)
			return
		}

		payload, err := idtoken.Validate(context.Background(), req.Token, clientID)
		if err != nil {
			logger.Warn(r.Context(), "google token validation failed", logger.Field{
				"correlation_id": correlationID,
				"error":          err.Error(),
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Token Google tidak dapat diproses", nil)
			return
		}

		emailValue, emailOk := payload.Claims["email"].(string)
		nameValue, nameOk := payload.Claims["name"].(string)
		if !emailOk || strings.TrimSpace(emailValue) == "" {
			logger.Warn(r.Context(), "invalid claims in google token", logger.Field{
				"correlation_id": correlationID,
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Data akun Google tidak valid", nil)
			return
		}
		email = emailValue
		if nameOk && strings.TrimSpace(nameValue) != "" {
			name = nameValue
		} else {
			name = strings.Split(emailValue, "@")[0]
		}
	}

	// Temukan atau buat akun
	user, err := h.repo.FindByEmail(email)
	if err != nil {
		newUser := User{
			Name:         name,
			Email:        email,
			Role:         "user",
			PasswordHash: "", // OAuth user
		}
		if err := h.repo.CreateUser(&newUser); err != nil {
			logger.Error(r.Context(), "failed syncing google account", logger.Field{
				"correlation_id": correlationID,
				"email":          email,
				"error":          err.Error(),
			})
			writeAPIError(w, http.StatusInternalServerError, correlationID, "Gagal sinkronisasi akun Google", nil)
			return
		}
		user = &newUser
	}

	if err := h.repo.UpdateLastLogin(user.ID); err != nil {
		logger.Warn(r.Context(), "failed updating last login for google user", logger.Field{
			"correlation_id": correlationID,
			"user_id":        user.ID,
			"error":          err.Error(),
		})
	} else {
		now := time.Now()
		user.LastLoginAt = &now
	}

	// Create local JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(GetJWTSecret())
	if err != nil {
		logger.Error(r.Context(), "failed generating jwt token for google login", logger.Field{
			"correlation_id": correlationID,
			"error":          err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, correlationID, "Gagal membuat token akses", nil)
		return
	}

	setAuthCookie(w, tokenString)

	logger.RecordActivity(&user.ID, "LOGIN_GOOGLE", "Berhasil login via Google SSO", r.RemoteAddr, r.UserAgent())
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Correlation-ID", correlationID)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	clearAuthCookie(w)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Logout berhasil",
	})
}

func (h *Handler) GetLicenseStatus(w http.ResponseWriter, r *http.Request) {
	status, err := CheckLicense(database.DB)
	if err != nil {
		logger.Error(r.Context(), "failed checking license status", logger.Field{
			"correlation_id": logger.CorrelationID(r),
			"error":          err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memeriksa status lisensi", nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(status)
}

// GET /api/me — Returns current user info from JWT claims
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		writeAPIError(w, http.StatusUnauthorized, logger.CorrelationID(r), "Akses belum diizinkan", nil)
		return
	}

	email, _ := claims["email"].(string)
	user, err := h.repo.FindByEmail(email)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Pengguna tidak ditemukan", nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

// GET /api/users — list all users (superadmin only)
func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	users, err := h.repo.GetAllUsers(search)
	if err != nil {
		logger.Error(r.Context(), "failed fetching users", logger.Field{"error": err.Error()})
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    users,
	})
}

// POST /api/users — create user (superadmin only)
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	correlationID := logger.CorrelationID(r)
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}

	var req validators.CreateUserRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, correlationID, "Isi permintaan tidak valid", nil)
		return
	}
	if validationErrs := validators.ValidateCreateUserRequest(&req); len(validationErrs) > 0 {
		writeValidationError(w, correlationID, validationErrs)
		return
	}

	existing, _ := h.repo.FindByEmail(req.Email)
	if existing != nil {
		writeAPIError(w, http.StatusConflict, correlationID, "Email sudah terdaftar", nil)
		return
	}

	newUser := User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: req.Password,
		Role:         req.Role,
	}

	if err := h.repo.CreateUser(&newUser); err != nil {
		logger.Error(r.Context(), "failed creating user via admin panel", logger.Field{
			"email": req.Email,
			"role":  req.Role,
			"error": err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, correlationID, "Gagal membuat akun", nil)
		return
	}

	adminID := 0
	if claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims); ok {
		if cid, ok := claims["id"].(float64); ok {
			adminID = int(cid)
		}
	}
	logger.RecordActivity(&adminID, "CREATE_USER", fmt.Sprintf("Membuat user baru %s dengan role %s", newUser.Email, newUser.Role), r.RemoteAddr, r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User berhasil dibuat",
		"data": map[string]interface{}{
			"id":    newUser.ID,
			"name":  newUser.Name,
			"email": newUser.Email,
			"role":  newUser.Role,
		},
	})
}

// DELETE /api/users/{id} — delete user (superadmin only)
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Invalid user ID", nil)
		return
	}

	if claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims); ok {
		if currentID, ok := claims["id"].(float64); ok && int(currentID) == id {
			writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Tidak diizinkan menghapus akun yang sedang dipakai", nil)
			return
		}
	}

	if err := h.repo.DeleteUser(id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Pengguna tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "failed deleting user", logger.Field{
			"user_id": id,
			"error":   err.Error(),
		})
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := 0
	if claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims); ok {
		if cid, ok := claims["id"].(float64); ok {
			adminID = int(cid)
		}
	}
	logger.RecordActivity(&adminID, "DELETE_USER", fmt.Sprintf("Menghapus User ID %d", id), r.RemoteAddr, r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User berhasil dihapus",
	})
}

// PUT /api/users/{id}/role — update user role (superadmin only)
func (h *Handler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		// fallback for chi router
		idStr = chi.URLParam(r, "id")
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Invalid user ID", nil)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Isi permintaan tidak valid", nil)
		return
	}

	var req validators.RoleUpdateRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Isi permintaan tidak valid", nil)
		return
	}
	if validationErrs := validators.ValidateRoleUpdateRequest(&req); len(validationErrs) > 0 {
		writeValidationError(w, logger.CorrelationID(r), validationErrs)
		return
	}

	if err := h.repo.UpdateRole(id, req.Role); err != nil {
		logger.Warn(r.Context(), "failed updating user role", logger.Field{
			"user_id": id,
			"role":    req.Role,
			"error":   err.Error(),
		})
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Permintaan tidak valid (Bad Request)", nil)
		return
	}

	// Log activity
	adminID := 0
	if claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims); ok {
		if cid, ok := claims["id"].(float64); ok {
			adminID = int(cid)
		}
	}
	logger.RecordActivity(&adminID, "UPDATE_ROLE", fmt.Sprintf("Mengubah role User ID %d menjadi '%s'", id, req.Role), r.RemoteAddr, r.UserAgent())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Role berhasil diperbarui",
	})
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	// Public routes
	r.Post("/login", h.Login)
	r.Post("/register", h.Register)
	r.Post("/google", h.GoogleLogin)
	r.Post("/logout", h.Logout)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)
		r.Get("/me", h.GetMe)

		// Admin/Superadmin only
		r.Group(func(r chi.Router) {
			r.Post("/users", h.CreateUser)
			r.Get("/users", h.GetAllUsers)
			r.Put("/users/{id}/role", h.UpdateUserRole)
			r.Delete("/users/{id}", h.DeleteUser)
		})
	})

	return r
}

func writeValidationError(w http.ResponseWriter, correlationID string, errs validators.ValidationErrors) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Correlation-ID", correlationID)
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        false,
		"message":        "Validasi gagal",
		"correlation_id": correlationID,
		"errors":         errs,
	})
}

func writeAPIError(w http.ResponseWriter, status int, correlationID, message string, details map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if correlationID != "" {
		w.Header().Set("X-Correlation-ID", correlationID)
	}
	w.WriteHeader(status)

	payload := map[string]interface{}{
		"success":        false,
		"message":        message,
		"correlation_id": correlationID,
	}
	if len(details) > 0 {
		payload["details"] = details
	}

	_ = json.NewEncoder(w).Encode(payload)
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "darussunnah_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true"),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int((24 * time.Hour).Seconds()),
	})
}

func clearAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "darussunnah_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true"),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindByEmail(email string) (*User, error)
	CheckPassword(hashedPassword, password string) error
	UpdatePassword(id int, newPassword string) error
	CreateUser(user *User) error
	GetAllUsers(search string) ([]User, error)
	UpdateLastLogin(id int) error
	DeleteUser(id int) error
	UpdateRole(userID int, role string) error
}
