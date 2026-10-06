package auth

import (
	"context"
	"darussunnah-api/internal/platform/database"
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

// CurrentUserRole returns the role claim from the verified token. The second
// return value is false when there is no authenticated user in the context.
func CurrentUserRole(ctx context.Context) (string, bool) {
	claims, ok := ctx.Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return "", false
	}
	role, ok := claims["role"].(string)
	if !ok || role == "" {
		return "", false
	}
	return role, true
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
		// Fail closed when no signing key is configured. Parsing with a nil HMAC
		// key would otherwise accept a token signed with an empty secret.
		if !SecretConfigured() {
			logger.Error(r.Context(), "auth rejected: JWT_SECRET is not configured", logger.Field{
				"correlation_id": correlationID,
				"path":           r.URL.Path,
			})
			writeAPIError(w, http.StatusInternalServerError, correlationID, "Konfigurasi server tidak valid", nil)
			return
		}

		// Pin the algorithm to HS256. The previous check accepted any HMAC variant
		// (HS256/HS384/HS512), so a caller could pick the signing algorithm.
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return GetJWTSecret(), nil
		},
			// Bind the token to this service so a token minted elsewhere with the
			// same secret cannot be replayed against this API.
			jwt.WithIssuer(tokenIssuer),
			jwt.WithAudience(tokenAudience),
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		)

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

		// Enforce token revocation (logout / password / role change).
		if denied := isTokenDenied(claims); denied {
			logger.Warn(r.Context(), "auth failed revoked or stale token", logger.Field{
				"correlation_id": correlationID,
				"ip":             r.RemoteAddr,
				"path":           r.URL.Path,
			})
			writeAPIError(w, http.StatusUnauthorized, correlationID, "Sesi login sudah tidak valid", nil)
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

// isTokenDenied enforces revocation: a token is rejected if its jti was
// explicitly revoked (logout) or its embedded version no longer matches the
// user's current token_version (password/role change).
func isTokenDenied(claims jwt.MapClaims) bool {
	if database.DB == nil {
		return false
	}

	if jti, _ := claims["jti"].(string); jti != "" {
		var count int
		if err := database.DB.QueryRow("SELECT COUNT(1) FROM revoked_tokens WHERE jti = ?", jti).Scan(&count); err == nil && count > 0 {
			return true
		}
	}

	if ver, ok := claims["ver"].(float64); ok {
		idf, ok := claims["id"].(float64)
		if !ok {
			return false
		}
		var dbVer int
		err := database.DB.QueryRow("SELECT COALESCE(token_version, 0) FROM users WHERE id = ?", int(idf)).Scan(&dbVer)
		if err != nil {
			// User missing or DB error: fail closed.
			return true
		}
		if int(ver) != dbVer {
			return true
		}
	}

	return false
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
