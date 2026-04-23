package middleware

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type RateLimiter struct {
	mu      sync.Mutex
	window  time.Duration
	limit   int
	clients map[string][]time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		window:  window,
		limit:   limit,
		clients: make(map[string][]time.Time),
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		now := time.Now()
		key := fmt.Sprintf("%s:%s", clientIP(r), r.URL.Path)

		rl.mu.Lock()
		requests := rl.clients[key]
		cutoff := now.Add(-rl.window)
		filtered := requests[:0]
		for _, ts := range requests {
			if ts.After(cutoff) {
				filtered = append(filtered, ts)
			}
		}

		if len(filtered) >= rl.limit {
			retryAfter := int(filtered[0].Add(rl.window).Sub(now).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			rl.clients[key] = filtered
			rl.mu.Unlock()

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"success":false,"message":"Terlalu banyak permintaan. Coba lagi nanti."}`))
			return
		}

		rl.clients[key] = append(filtered, now)
		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}
