package middleware

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	mu              sync.Mutex
	window          time.Duration
	limit           int
	clients         map[string][]time.Time
	now             func() time.Time
	lastCleanup     time.Time
	cleanupInterval time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	cleanupInterval := window
	if cleanupInterval <= 0 || cleanupInterval > time.Minute {
		cleanupInterval = time.Minute
	}

	return &RateLimiter{
		window:          window,
		limit:           limit,
		clients:         make(map[string][]time.Time),
		now:             time.Now,
		cleanupInterval: cleanupInterval,
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		now := rl.now()
		key := fmt.Sprintf("%s:%s", clientIP(r), r.URL.Path)

		rl.mu.Lock()
		rl.cleanupExpiredClientsLocked(now)
		requests := rl.clients[key]
		filtered := rl.filterRecentRequests(requests, now)

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

func (rl *RateLimiter) cleanupExpiredClientsLocked(now time.Time) {
	if !rl.lastCleanup.IsZero() && now.Sub(rl.lastCleanup) < rl.cleanupInterval {
		return
	}

	for key, requests := range rl.clients {
		filtered := rl.filterRecentRequests(requests, now)
		if len(filtered) == 0 {
			delete(rl.clients, key)
			continue
		}
		rl.clients[key] = filtered
	}

	rl.lastCleanup = now
}

func (rl *RateLimiter) filterRecentRequests(requests []time.Time, now time.Time) []time.Time {
	cutoff := now.Add(-rl.window)
	filtered := requests[:0]
	for _, ts := range requests {
		if ts.After(cutoff) {
			filtered = append(filtered, ts)
		}
	}
	return filtered
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil || host == "" {
		host = r.RemoteAddr
	}

	remoteIP := net.ParseIP(host)
	// Forwarded headers are only trusted when the immediate peer is a known
	// proxy (Cloudflare/origin proxy). This prevents attackers from spoofing
	// X-Forwarded-For when reaching the origin directly. Origin must still be
	// firewalled to Cloudflare IPs to fully close the bypass.
	if isTrustedProxyIP(remoteIP) {
		if ip := firstValidHeaderIP(r.Header.Get("CF-Connecting-IP")); ip != "" {
			return ip
		}
		if ip := firstValidHeaderIP(r.Header.Get("X-Forwarded-For")); ip != "" {
			return ip
		}
		if ip := firstValidHeaderIP(r.Header.Get("X-Real-IP")); ip != "" {
			return ip
		}
	}

	return host
}

func isTrustedProxyIP(ip net.IP) bool {
	if ip == nil {
		return false
	}

	for _, n := range trustedProxyNets() {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// cloudflareCIDRs are Cloudflare's published edge ranges (https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/).
var cloudflareCIDRs = []string{
	"173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
	"141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
	"197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
	"104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
	"2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
	"2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
}

var (
	trustedOnce sync.Once
	trustedNets []*net.IPNet
)

// trustedProxyNets resolves, once, the peer ranges whose forwarding headers we
// believe.
//
// This used to trust every private/loopback/link-local address. Because the
// reverse proxy hop arrives over the Docker bridge (172.19.x), that blanket
// private-range trust is required for this deployment - but it also meant any
// peer on a private network reaching the origin directly could forge
// CF-Connecting-IP and get a fresh rate-limit bucket per request, defeating login
// throttling entirely.
//
// Override with TRUSTED_PROXY_CIDRS (comma separated) to tighten this. Note the
// authoritative fix is still to firewall the origin so only Cloudflare ranges can
// reach it at all.
func trustedProxyNets() []*net.IPNet {
	trustedOnce.Do(func() {
		var cidrs []string

		if custom := strings.TrimSpace(os.Getenv("TRUSTED_PROXY_CIDRS")); custom != "" {
			cidrs = strings.Split(custom, ",")
		} else {
			// Default: loopback + RFC1918 + the Docker bridge, plus Cloudflare's
			// published ranges for deployments where the hop arrives over public
			// networking.
			cidrs = append(cidrs,
				"127.0.0.0/8", "::1/128",
				"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
				"169.254.0.0/16",
			)
			cidrs = append(cidrs, cloudflareCIDRs...)
		}

		trustedNets = make([]*net.IPNet, 0, len(cidrs))
		for _, c := range cidrs {
			c = strings.TrimSpace(c)
			if c == "" {
				continue
			}
			if _, n, err := net.ParseCIDR(c); err == nil {
				trustedNets = append(trustedNets, n)
				continue
			}
			if ip := net.ParseIP(c); ip != nil {
				bits := 32
				if ip.To4() == nil {
					bits = 128
				}
				trustedNets = append(trustedNets, &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)})
			}
		}
	})
	return trustedNets
}

func firstValidHeaderIP(value string) string {
	for _, part := range strings.Split(value, ",") {
		candidate := strings.TrimSpace(part)
		if candidate == "" {
			continue
		}
		if ip := net.ParseIP(candidate); ip != nil {
			return ip.String()
		}
	}
	return ""
}
