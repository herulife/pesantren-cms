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

func CurrentUserID(ctx context.Context) (int, bool) {
	claims, ok := ctx.Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return 0, false
	}
	idFloat, ok := claims["id"].(float64)
	if !ok {
		return 0, false
	}
	return int(idFloat), true
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

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("darussunnah_token"); err == nil && strings.TrimSpace(cookie.Value) != "" {
		return cookie.Value
	}

	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
}

func RequireLicense(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Bypass license check in development mode
			if os.Getenv("DEV_MODE") == "true" {
				next.ServeHTTP(w, r)
				return
			}

			if canBypassLicenseForBootstrap(r) {
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

func canBypassLicenseForBootstrap(r *http.Request) bool {
	claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return false
	}

	role, _ := claims["role"].(string)
	if role != "superadmin" {
		return false
	}

	switch {
	case r.URL.Path == "/api/me":
		return true
	case strings.HasPrefix(r.URL.Path, "/api/settings"):
		return true
	case strings.HasPrefix(r.URL.Path, "/api/users"):
		return true
	default:
		return false
	}
}

// RequireRole middleware: only allows users with specified roles.
// "superadmin" always passes regardless of allowed list.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(jwt.MapClaims)
			if !ok {
				writeAPIError(w, http.StatusUnauthorized, logger.CorrelationID(r), "Akses belum diizinkan", nil)
				return
			}

			userRole, _ := claims["role"].(string)

			// superadmin bypasses all role checks
			if userRole == "superadmin" {
				next.ServeHTTP(w, r)
				return
			}

			for _, role := range allowedRoles {
				if userRole == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			logger.Warn(r.Context(), "rbac denied", logger.Field{
				"correlation_id": logger.CorrelationID(r),
				"role":           userRole,
				"allowed_roles":  allowedRoles,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			})
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprintf(w, `{"success":false,"message":"Akses ditolak. Role '%s' tidak memiliki izin untuk fitur ini."}`, userRole)
		})
	}
}
