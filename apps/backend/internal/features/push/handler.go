package push

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"darussunnah-api/internal/platform/logger"
	"github.com/go-chi/chi/v5"
)

const (
	// Judul & isi sambutan saat pertama kali langganan.
	welcomeTitle = "Darussunnah Parung"
	welcomeBody  = "Notifikasi aktif. Terima kasih sudah mengikuti, kamu akan menerima info PPDB, pengumuman, dan agenda terbaru dari web ini."
)

type Handler struct {
	repo   IRepository
	sender *Sender
}

func sendJSON(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

// NewHandler membuat handler push beserta repository & sender-nya.
func NewHandler(db *sql.DB) *Handler {
	return &Handler{
		repo:   NewRepository(db),
		sender: NewSender(db),
	}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/public-key", h.PublicKey)
	r.Post("/subscribe", h.Subscribe)
	r.Post("/unsubscribe", h.Unsubscribe)
	return r
}

// PublicKey mengembalikan VAPID public key agar frontend bisa berlangganan.
func (h *Handler) PublicKey(w http.ResponseWriter, r *http.Request) {
	if !h.sender.Enabled() {
		sendJSON(w, http.StatusServiceUnavailable, false, "Notifikasi belum dikonfigurasi", nil)
		return
	}
	sendJSON(w, http.StatusOK, true, "OK", map[string]string{
		"public_key": h.sender.PublicKey(),
	})
}

type subscribeRequest struct {
	Subscription struct {
		Endpoint string `json:"endpoint"`
		Keys     struct {
			P256DH string `json:"p256dh"`
			Auth   string `json:"auth"`
		} `json:"keys"`
	} `json:"subscription"`
	UserAgent string `json:"user_agent"`
}

// Subscribe menyimpan langganan push dari perangkat pengunjung.
func (h *Handler) Subscribe(w http.ResponseWriter, r *http.Request) {
	var req subscribeRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16*1024)).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, false, "Data langganan tidak valid", nil)
		return
	}

	endpoint := strings.TrimSpace(req.Subscription.Endpoint)
	p256dh := strings.TrimSpace(req.Subscription.Keys.P256DH)
	auth := strings.TrimSpace(req.Subscription.Keys.Auth)
	if endpoint == "" || p256dh == "" || auth == "" {
		sendJSON(w, http.StatusBadRequest, false, "Data langganan tidak lengkap", nil)
		return
	}
	if !strings.HasPrefix(endpoint, "https://") {
		sendJSON(w, http.StatusBadRequest, false, "Endpoint langganan tidak valid", nil)
		return
	}

	userAgent := strings.TrimSpace(req.UserAgent)
	if userAgent == "" {
		userAgent = r.UserAgent()
	}
	if len(userAgent) > 400 {
		userAgent = userAgent[:400]
	}

	sub := &Subscription{
		Endpoint:  endpoint,
		P256DH:    p256dh,
		Auth:      auth,
		UserAgent: userAgent,
	}
	if err := h.repo.Upsert(sub); err != nil {
		logger.Error(r.Context(), "push: gagal simpan subscription", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, false, "Gagal menyimpan langganan", nil)
		return
	}

	sent, _ := h.sender.Send([]Subscription{*sub}, welcomeTitle, welcomeBody, "/")
	if sent == 0 {
		logger.Warn(r.Context(), "push: sambutan tidak terkirim", logger.Field{"endpoint": endpoint})
	}

	sendJSON(w, http.StatusOK, true, "Berhasil berlangganan notifikasi", map[string]interface{}{
		"subscribed": true,
		"notified":   sent > 0,
	})
}

type unsubscribeRequest struct {
	Endpoint string `json:"endpoint"`
}

// Unsubscribe menghapus langganan push sebuah perangkat.
func (h *Handler) Unsubscribe(w http.ResponseWriter, r *http.Request) {
	var req unsubscribeRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8*1024)).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, false, "Data tidak valid", nil)
		return
	}
	endpoint := strings.TrimSpace(req.Endpoint)
	if endpoint == "" {
		sendJSON(w, http.StatusBadRequest, false, "Endpoint wajib diisi", nil)
		return
	}

	if _, err := h.repo.DeleteByEndpoint(endpoint); err != nil {
		logger.Error(r.Context(), "push: gagal hapus subscription", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, false, "Gagal menghapus langganan", nil)
		return
	}
	sendJSON(w, http.StatusOK, true, "Berhasil berhenti berlangganan", nil)
}

// List menampilkan jumlah & daftar perangkat yang berlangganan (superadmin).
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	subs, err := h.repo.List()
	if err != nil {
		logger.Error(r.Context(), "push: gagal ambil daftar subscription", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, false, "Gagal mengambil data", nil)
		return
	}
	sendJSON(w, http.StatusOK, true, "OK", map[string]interface{}{
		"total": len(subs),
		"items": subs,
	})
}

type broadcastRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	URL   string `json:"url"`
}

// Broadcast mengirim notifikasi ke seluruh perangkat yang berlangganan.
func (h *Handler) Broadcast(w http.ResponseWriter, r *http.Request) {
	var req broadcastRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16*1024)).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, false, "Data tidak valid", nil)
		return
	}
	title := strings.TrimSpace(req.Title)
	body := strings.TrimSpace(req.Body)
	if title == "" || body == "" {
		sendJSON(w, http.StatusBadRequest, false, "Judul dan isi wajib diisi", nil)
		return
	}
	url := strings.TrimSpace(req.URL)
	if url == "" {
		url = "/"
	}

	if !h.sender.Enabled() {
		sendJSON(w, http.StatusServiceUnavailable, false, "Notifikasi belum dikonfigurasi", nil)
		return
	}

	subs, err := h.repo.List()
	if err != nil {
		logger.Error(r.Context(), "push: gagal ambil subscription untuk broadcast", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, false, "Gagal mengambil data", nil)
		return
	}

	sent, removed := h.sender.Send(subs, title, body, url)
	logger.Info(r.Context(), "push: broadcast selesai", logger.Field{
		"total":   len(subs),
		"sent":    sent,
		"removed": removed,
	})

	sendJSON(w, http.StatusOK, true, "Notifikasi terkirim", map[string]interface{}{
		"total":   len(subs),
		"sent":    sent,
		"removed": removed,
	})
}