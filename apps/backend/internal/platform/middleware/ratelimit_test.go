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

func TestRateLimiterRemovesExpiredClientEntries(t *testing.T) {
	start := time.Date(2026, time.April, 30, 12, 0, 0, 0, time.UTC)
	current := start

	limiter := NewRateLimiter(2, time.Minute)
	limiter.now = func() time.Time { return current }
	limiter.cleanupInterval = time.Second
	handler := limiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	firstReq := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	firstReq.RemoteAddr = "192.0.2.10:1234"
	firstRec := httptest.NewRecorder()
	handler.ServeHTTP(firstRec, firstReq)
	if firstRec.Code != http.StatusOK {
		t.Fatalf("expected first request to pass, got %d", firstRec.Code)
	}

	if len(limiter.clients) != 1 {
		t.Fatalf("expected 1 tracked client, got %d", len(limiter.clients))
	}

	current = start.Add(2 * time.Minute)

	secondReq := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	secondReq.RemoteAddr = "192.0.2.11:1234"
	secondRec := httptest.NewRecorder()
	handler.ServeHTTP(secondRec, secondReq)
	if secondRec.Code != http.StatusOK {
		t.Fatalf("expected second request to pass, got %d", secondRec.Code)
	}

	if len(limiter.clients) != 1 {
		t.Fatalf("expected expired client entry to be removed, got %d tracked clients", len(limiter.clients))
	}

	if _, exists := limiter.clients["192.0.2.10:/api/login"]; exists {
		t.Fatalf("expected expired client key to be removed")
	}
}
