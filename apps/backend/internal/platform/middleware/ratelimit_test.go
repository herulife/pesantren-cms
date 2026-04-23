package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestClientIPIgnoresSpoofedForwardHeaders(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/login", nil)
	req.RemoteAddr = "192.0.2.10:1234"
	req.Header.Set("X-Forwarded-For", "203.0.113.50")
	req.Header.Set("X-Real-IP", "203.0.113.51")

	ip := clientIP(req)
	if ip != "192.0.2.10" {
		t.Fatalf("expected remote address IP, got %q", ip)
	}
}

func TestRateLimiterBlocksAfterLimit(t *testing.T) {
	limiter := NewRateLimiter(2, time.Minute)
	handler := limiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
		req.RemoteAddr = "192.0.2.10:1234"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d should pass, got %d", i+1, rec.Code)
		}
	}

	req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req.RemoteAddr = "192.0.2.10:1234"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected rate limited response, got %d", rec.Code)
	}
}
