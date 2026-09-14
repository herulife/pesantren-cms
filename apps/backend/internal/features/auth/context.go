package auth

import (
	"context"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

// PHASE 2: helper autentikasi tunggal. SEMUA handler wajib memakai helper ini,
// JANGAN membaca claim JWT manual per-handler.

// AuthenticatedUser adalah identitas terverifikasi dari request.
type AuthenticatedUser struct {
	ID    int
	Email string
	Role  string
}

func claimInt(v interface{}) (int, bool) {
	switch n := v.(type) {
	case float64:
		return int(n), true
	case float32:
		return int(n), true
	case int:
		return n, true
	case int64:
		return int(n), true
	default:
		return 0, false
	}
}

func claimsFrom(ctx context.Context) (jwt.MapClaims, bool) {
	claims, ok := ctx.Value(UserContextKey).(jwt.MapClaims)
	if !ok {
		return nil, false
	}
	return claims, true
}

// GetAuthenticatedUserID mengembalikan ID user dari context. TIDAK PERNAH 0
// untuk request terautentikasi (middleware sudah memvalidasi ke DB).
func GetAuthenticatedUserID(ctx context.Context) (int, bool) {
	claims, ok := claimsFrom(ctx)
	if !ok {
		return 0, false
	}
	id, ok := claimInt(claims["id"])
	if !ok || id <= 0 {
		return 0, false
	}
	return id, true
}

// GetAuthenticatedRole mengembalikan role user dari context.
func GetAuthenticatedRole(ctx context.Context) (string, bool) {
	claims, ok := claimsFrom(ctx)
	if !ok {
		return "", false
	}
	role, _ := claims["role"].(string)
	if role == "" {
		return "", false
	}
	return role, true
}

// GetAuthenticatedEmail mengembalikan email user dari context.
func GetAuthenticatedEmail(ctx context.Context) (string, bool) {
	claims, ok := claimsFrom(ctx)
	if !ok {
		return "", false
	}
	email, _ := claims["email"].(string)
	if email == "" {
		return "", false
	}
	return email, true
}

// GetAuthenticatedUser mengembalikan identitas lengkap dari request HTTP.
func GetAuthenticatedUser(r *http.Request) (AuthenticatedUser, bool) {
	var u AuthenticatedUser
	var ok bool
	if u.ID, ok = GetAuthenticatedUserID(r.Context()); !ok {
		return AuthenticatedUser{}, false
	}
	if u.Role, ok = GetAuthenticatedRole(r.Context()); !ok {
		return AuthenticatedUser{}, false
	}
	u.Email, _ = GetAuthenticatedEmail(r.Context())
	return u, true
}
