package middleware

import "net/http"

// AUDIT FIX [6.7]: baseline security headers for all API responses.
// No HSTS on purpose: backend also serves plain HTTP directly (:8080) and
// HSTS is host-wide (would force-https the direct port too).
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		next.ServeHTTP(w, r)
	})
}
