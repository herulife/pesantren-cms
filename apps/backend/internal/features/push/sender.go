package push

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"os"

	"github.com/SherClockHolmes/webpush-go"

	"darussunnah-api/internal/platform/logger"
)

// Payload adalah isi notifikasi yang diterima service worker di frontend.
type Payload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	URL   string `json:"url"`
}

// Sender mengirim web push memakai VAPID keys dari environment.
type Sender struct {
	repo       *Repository
	subject    string
	publicKey  string
	privateKey string
}

func NewSender(db *sql.DB) *Sender {
	subject := os.Getenv("VAPID_SUBJECT")
	if subject == "" {
		subject = "mailto:admin@darussunnahparung.com"
	}
	return &Sender{
		repo:       NewRepository(db),
		subject:    subject,
		publicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		privateKey: os.Getenv("VAPID_PRIVATE_KEY"),
	}
}

// Enabled menandakan VAPID keys sudah dikonfigurasi.
func (s *Sender) Enabled() bool {
	return s.publicKey != "" && s.privateKey != ""
}

// PublicKey mengembalikan VAPID public key (untuk langganan di frontend).
func (s *Sender) PublicKey() string {
	return s.publicKey
}

// Send mengirim notifikasi ke semua subscription. Subscription yang sudah
// tidak valid (404/410) dihapus otomatis dari database.
func (s *Sender) Send(subs []Subscription, title, body, url string) (sent, removed int) {
	if !s.Enabled() {
		return 0, 0
	}

	payload, err := json.Marshal(Payload{Title: title, Body: body, URL: url})
	if err != nil {
		return 0, 0
	}

	options := &webpush.Options{
		Subscriber:      s.subject,
		VAPIDPublicKey:  s.publicKey,
		VAPIDPrivateKey: s.privateKey,
		TTL:             86400,
	}

	ctx := context.Background()
	for i := range subs {
		sub := subs[i]
		resp, err := webpush.SendNotification(payload, &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.P256DH,
				Auth:   sub.Auth,
			},
		}, options)
		if err != nil {
			logger.Warn(ctx, "webpush: kirim gagal", logger.Field{
				"endpoint": sub.Endpoint,
				"error":    err.Error(),
			})
			continue
		}
		resp.Body.Close()

		switch {
		case resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound:
			removed++
			if _, err := s.repo.DeleteByEndpoint(sub.Endpoint); err != nil {
				logger.Warn(ctx, "webpush: hapus subscription gagal", logger.Field{
					"endpoint": sub.Endpoint,
					"error":    err.Error(),
				})
			}
		case resp.StatusCode >= 200 && resp.StatusCode < 300:
			sent++
		default:
			logger.Warn(ctx, "webpush: status tak terduga", logger.Field{
				"endpoint": sub.Endpoint,
				"status":   resp.StatusCode,
			})
		}
	}
	return sent, removed
}