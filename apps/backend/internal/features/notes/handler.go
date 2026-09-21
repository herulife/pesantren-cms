package notes

import (
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

const (
	maxNoteContentBytes = 1 << 20
	maxNoteContentRunes = 500_000
	maxOwnerKeyLen      = 64
	minOwnerKeyLen      = 6
	maxCustomURLLen     = 60
	minCustomURLLen     = 3
)

var urlAlphabet = []byte("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

var customURLRe = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`)

var ownerKeyWords = []string{
	"mangga", "pisang", "durian", "rambutan", "sirsak", "jambu", "nangka", "salak",
	"kelapa", "jeruk", "apel", "tomat", "bayam", "kangkung", "tempe", "nasi",
	"kopi", "teh", "susu", "roti",
}

var ownerKeyWords2 = []string{
	"merah", "kuning", "hijau", "biru", "pagi", "malam", "senja", "bulan",
	"bintang", "gunung", "pantai", "sawah", "taman", "sekolah", "masjid", "senang",
}

type Handler struct {
	repo IRepository
}

func sendJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	r.Get("/mine", h.ListMine)
	r.Get("/{urlID}", h.Get)
	r.Delete("/{urlID}", h.Delete)
	return r
}

func randomAlphabetBytes(length int) string {
	buf := make([]byte, length)
	random := make([]byte, length)
	if _, err := rand.Read(random); err != nil {
		return ""
	}
	for i := range buf {
		buf[i] = urlAlphabet[int(random[i])%len(urlAlphabet)]
	}
	return string(buf)
}

func randomPick(list []string) string {
	buf := make([]byte, 1)
	if _, err := rand.Read(buf); err != nil {
		return list[0]
	}
	return list[int(buf[0])%len(list)]
}

func randomTwoDigits() string {
	buf := make([]byte, 1)
	if _, err := rand.Read(buf); err != nil {
		return "12"
	}
	return fmt.Sprintf("%02d", int(buf[0])%100)
}

func randomOwnerKey() string {
	return fmt.Sprintf("%s-%s%s", randomPick(ownerKeyWords), randomPick(ownerKeyWords2), randomTwoDigits())
}

func validExpiresInDays(value *int) bool {
	if value == nil {
		return true
	}
	switch *value {
	case 1, 7, 30, 90, 365:
		return true
	default:
		return false
	}
}

func validOwnerKey(key string) bool {
	if key == "" {
		return false
	}
	if len(key) < minOwnerKeyLen || len(key) > maxOwnerKeyLen {
		return false
	}
	for _, c := range key {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.') {
			return false
		}
	}
	return true
}

func validCustomURL(url string) bool {
	if url == "" {
		return true
	}
	if len(url) < minCustomURLLen || len(url) > maxCustomURLLen {
		return false
	}
	if strings.EqualFold(url, "mine") || strings.EqualFold(url, "new") {
		return false
	}
	return customURLRe.MatchString(url)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, maxNoteContentBytes+64*1024))
	if err != nil {
		logger.Warn(r.Context(), "Bad request reading note body", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}

	var req struct {
		Title         string `json:"title"`
		Content       string `json:"content"`
		ExpiresInDays *int   `json:"expires_in_days"`
		OwnerKey      string `json:"owner_key"`
		CustomURL     string `json:"custom_url"`
	}
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		logger.Warn(r.Context(), "Bad request decoding note", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		sendJSONResponse(w, http.StatusBadRequest, false, "Isi catatan tidak boleh kosong", nil)
		return
	}
	if len([]rune(req.Content)) > maxNoteContentRunes {
		sendJSONResponse(w, http.StatusBadRequest, false, "Catatan terlalu besar (maksimal 500.000 karakter)", nil)
		return
	}
	if !validExpiresInDays(req.ExpiresInDays) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Masa berlaku tidak valid", nil)
		return
	}

	req.OwnerKey = strings.TrimSpace(req.OwnerKey)
	if req.OwnerKey != "" && !validOwnerKey(req.OwnerKey) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Kunci catatan tidak valid (minimal 6 karakter: huruf, angka, -, _, atau .)", nil)
		return
	}
	if req.OwnerKey == "" {
		req.OwnerKey = randomOwnerKey()
	}

	customURL := strings.ToLower(strings.TrimSpace(req.CustomURL))
	if !validCustomURL(customURL) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Nama link tidak valid (huruf kecil, angka, atau tanda hubung, 3-60 karakter)", nil)
		return
	}

	var urlID string
	if customURL != "" {
		if existing, _ := h.repo.GetByURLID(customURL); existing != nil {
			sendJSONResponse(w, http.StatusConflict, false, "Nama link sudah dipakai. Coba nama lain, atau biarkan kosong untuk link otomatis.", nil)
			return
		}
		urlID = customURL
	} else {
		for attempt := 0; attempt < 5; attempt++ {
			candidate := randomAlphabetBytes(6)
			if existing, _ := h.repo.GetByURLID(candidate); existing == nil {
				urlID = candidate
				break
			}
		}
		if urlID == "" {
			logger.Error(r.Context(), "Could not allocate unique note URLID", logger.Field{})
			sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
			return
		}
	}

	var expiresAt *string
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		value := time.Now().Add(time.Duration(*req.ExpiresInDays) * 24 * time.Hour).UTC().Format(time.RFC3339)
		expiresAt = &value
	}

	note := &Note{
		URLID:       urlID,
		Title:       strings.TrimSpace(req.Title),
		Content:     req.Content,
		DeleteToken: randomAlphabetBytes(16),
		OwnerKey:    req.OwnerKey,
		ExpiresAt:   expiresAt,
	}

	if err := h.repo.Create(note); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	persisted, err := h.repo.GetByURLID(note.URLID)
	if err == nil && persisted != nil {
		note.CreatedAt = persisted.CreatedAt
	}

	sendJSONResponse(w, http.StatusCreated, true, "Catatan berhasil disimpan", map[string]interface{}{
		"url_id":       note.URLID,
		"title":        note.Title,
		"content":      note.Content,
		"created_at":   note.CreatedAt,
		"expires_at":   note.ExpiresAt,
		"delete_token": note.DeleteToken,
		"owner_key":    note.OwnerKey,
	})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	urlID := chi.URLParam(r, "urlID")
	note, err := h.repo.GetByURLID(urlID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if note == nil || isExpired(note.ExpiresAt) {
		sendJSONResponse(w, http.StatusNotFound, false, "Catatan tidak ditemukan atau sudah kedaluwarsa", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Berhasil", map[string]interface{}{
		"url_id":     note.URLID,
		"title":      note.Title,
		"content":    note.Content,
		"created_at": note.CreatedAt,
		"expires_at": note.ExpiresAt,
	})
}

func (h *Handler) ListMine(w http.ResponseWriter, r *http.Request) {
	ownerKey := strings.TrimSpace(r.URL.Query().Get("key"))
	if ownerKey == "" || !validOwnerKey(ownerKey) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Kunci catatan tidak valid", nil)
		return
	}
	notes, err := h.repo.ListByOwner(ownerKey)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	items := make([]map[string]interface{}, 0, len(notes))
	for _, n := range notes {
		if isExpired(n.ExpiresAt) {
			continue
		}
		items = append(items, map[string]interface{}{
			"url_id":       n.URLID,
			"title":        n.Title,
			"content":      n.Content,
			"created_at":   n.CreatedAt,
			"expires_at":   n.ExpiresAt,
			"delete_token": n.DeleteToken,
		})
	}
	sendJSONResponse(w, http.StatusOK, true, "Berhasil", items)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	urlID := chi.URLParam(r, "urlID")
	deleteToken := strings.TrimSpace(r.Header.Get("X-Delete-Token"))
	if deleteToken == "" {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Token hapus tidak valid", nil)
		return
	}
	deleted, err := h.repo.DeleteByURLIDAndToken(urlID, deleteToken)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if !deleted {
		sendJSONResponse(w, http.StatusNotFound, false, "Catatan tidak ditemukan atau token hapus salah", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Catatan berhasil dihapus", nil)
}

func isExpired(expiresAt *string) bool {
	if expiresAt == nil || *expiresAt == "" {
		return false
	}
	t, err := time.Parse(time.RFC3339, *expiresAt)
	if err != nil {
		return false
	}
	return time.Now().UTC().After(t)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	Create(n *Note) error
	GetByURLID(urlID string) (*Note, error)
	ListByOwner(ownerKey string) ([]Note, error)
	DeleteByURLIDAndToken(urlID, deleteToken string) (bool, error)
}
