package auth

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "user"

// validRoles adalah daftar role yang diakui sistem.
var validRoles = map[string]bool{
	"superadmin": true, "bendahara": true, "panitia_psb": true,
	"tim_media": true, "admin": true, "user": true,
	"pimpinan": true, "wali_kelas": true, "guru": true, "ustadz": true,
}

func IsValidRole(role string) bool { return validRoles[role] }

// sessionDB diisi via ConfigureSessionValidation (dipanggil main setelah
// database.Connect, sehingga migrasi token_version sudah berjalan).
var sessionDB *sql.DB

// ConfigureSessionValidation mengaktifkan validasi sesi berbasis DB
// (user exists + role cocok + token_version cocok) di AuthMiddleware.
func ConfigureSessionValidation(db *sql.DB) { sessionDB = db }

func CurrentUserID(ctx context.Context) (int, bool) {
	return GetAuthenticatedUserID(ctx)
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		correlationID := logger.CorrelationID(r)
		tokenString := extractToken(r)
		if tokenString == "" {
			logger.Warn(r.Context(), "auth failed token is missing", logger.Field{
				"correlation_id": correlationID,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Sesi login tidak ditemukan", nil)
			return
		}
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return GetJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			fields := logger.Field{
				"correlation_id": correlationID,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			}
			if err != nil {
				fields["error"] = err.Error()
			}
			logger.Warn(r.Context(), "auth failed invalid or expired token", fields)
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Sesi login tidak valid atau sudah berakhir", nil)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Warn(r.Context(), "auth failed invalid token claims", logger.Field{
				"correlation_id": correlationID,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Data sesi login tidak valid", nil)
			return
		}

		// PHASE 2: validasi sesi ke database (revocable session).
		if err := validateSession(claims); err != nil {
			logger.Warn(r.Context(), "auth failed session revoked", logger.Field{
				"correlation_id": correlationID,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
				"reason":         err.Error(),
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, err.Error(), nil)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// validateSession memastikan: user ada, role valid & cocok, token_version cocok.
// Token lama tanpa claim token_version DITOLAK (wajib login ulang pasca-deploy).
func validateSession(claims jwt.MapClaims) error {
	if sessionDB == nil {
		return nil // validasi DB belum dikonfigurasi (mis. unit test)
	}
	id, ok := claimInt(claims["id"])
	if !ok || id <= 0 {
		return fmt.Errorf("data sesi login tidak valid")
	}
	tv, ok := claimInt(claims["token_version"])
	if !ok {
		return fmt.Errorf("sesi kedaluwarsa, silakan login ulang")
	}
	claimRole, _ := claims["role"].(string)
	if !IsValidRole(claimRole) {
		return fmt.Errorf("role sesi tidak valid")
	}
	repo := &Repository{db: sessionDB}
	user, err := repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("akun tidak ditemukan atau sudah dihapus")
	}
	if user.Role != claimRole {
		return fmt.Errorf("role berubah, silakan login ulang")
	}
	if user.TokenVersion != tv {
		return fmt.Errorf("sesi sudah diakhiri, silakan login ulang")
	}
	return nil
}

func extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("alma_token"); err == nil && strings.TrimSpace(cookie.Value) != "" {
		return cookie.Value
	}

	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
}

// RequireRole middleware: only allows users with specified roles.
// "superadmin" always passes regardless of allowed list.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := GetAuthenticatedUser(r)
			if !ok {
				writeAPIError(w, http.StatusUnauthorized, logger.CorrelationID(r), "Akses belum diizinkan", nil)
				return
			}

			// superadmin bypasses all role checks
			if user.Role == "superadmin" {
				next.ServeHTTP(w, r)
				return
			}

			for _, role := range allowedRoles {
				if user.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			logger.Warn(r.Context(), "rbac denied", logger.Field{
				"correlation_id": logger.CorrelationID(r),
				"role":           user.Role,
				"allowed_roles":  allowedRoles,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			})
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprintf(w, `{"success":false,"message":"Akses ditolak. Role '%s' tidak memiliki izin untuk fitur ini."}`, user.Role)
		})
	}
}

// RequireLicense menolak request bila lisensi (settings.app_license_key) tidak
// valid. Bypass saat DEV_MODE=true atau untuk bootstrap superadmin. SENGAJA
// tidak dipasang di router default Darussunnah (agar tidak mem-brick aplikasi
// ketika DB belum memiliki app_license_key); disediakan untuk aktivasi nanti.
func RequireLicense(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if os.Getenv("DEV_MODE") == "true" {
				next.ServeHTTP(w, r)
				return
			}
			if u, ok := GetAuthenticatedUser(r); ok && u.Role == "superadmin" {
				next.ServeHTTP(w, r)
				return
			}
			status, _ := CheckLicense(db)
			if !status.IsValid {
				logger.Warn(r.Context(), "license check failed", logger.Field{
					"correlation_id": logger.CorrelationID(r),
					"ip":             r.RemoteAddr,
					"path":           r.URL.Path,
					"message":        status.Message,
				})
				writeAPIError(w, http.StatusPaymentRequired, logger.CorrelationID(r), "License Error: "+status.Message, nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
