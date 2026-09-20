package notes

import (
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"crypto/rand"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

const (
	maxNoteContentBytes = 1 << 20
	maxNoteContentRunes = 500_000
)

var urlAlphabet = []byte("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

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

	var expiresAt *string
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		value := time.Now().Add(time.Duration(*req.ExpiresInDays) * 24 * time.Hour).UTC().Format(time.RFC3339)
		expiresAt = &value
	}

	note := &Note{
		URLID:       randomAlphabetBytes(12),
		Title:       strings.TrimSpace(req.Title),
		Content:     req.Content,
		DeleteToken: randomAlphabetBytes(16),
		ExpiresAt:   expiresAt,
	}

	if err := h.repo.Create(note); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	sendJSONResponse(w, http.StatusCreated, true, "Catatan berhasil disimpan", map[string]interface{}{
		"url_id":       note.URLID,
		"title":        note.Title,
		"content":      note.Content,
		"created_at":   note.CreatedAt,
		"expires_at":   note.ExpiresAt,
		"delete_token": note.DeleteToken,
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
	DeleteByURLIDAndToken(urlID, deleteToken string) (bool, error)
}
