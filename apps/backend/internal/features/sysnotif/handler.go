package sysnotif

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	platsysnotif "darussunnah-api/internal/platform/sysnotif"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// Handler menyajikan notifikasi sistem untuk panel admin (lonceng).
type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Get("/unread", h.UnreadCount)
	r.Post("/read/{id}", h.MarkRead)
	r.Post("/read-all", h.MarkAllRead)
	return r
}

func writeJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func currentUserID(r *http.Request) (int, bool) {
	return auth.CurrentUserID(r.Context())
}

// List mengembalikan 50 notifikasi terbaru + jumlah belum dibaca user.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	items, unread, err := platsysnotif.List(r.Context(), h.db, userID)
	if err != nil {
		logger.Error(r.Context(), "sysnotif list failed", logger.Field{"operation": "sysnotif_list", "error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Notifikasi berhasil dimuat", map[string]interface{}{
		"items":        items,
		"unread_count": unread,
	})
}

// UnreadCount mengembalikan jumlah notifikasi yang belum dibaca user.
func (h *Handler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	n, err := platsysnotif.UnreadCount(r.Context(), h.db, userID)
	if err != nil {
		logger.Error(r.Context(), "sysnotif unread failed", logger.Field{"operation": "sysnotif_unread", "error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Jumlah notifikasi belum dibaca berhasil dimuat", map[string]interface{}{
		"count": n,
	})
}

// MarkRead menandai satu notifikasi sebagai sudah dibaca.
func (h *Handler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "ID notifikasi tidak valid", nil)
		return
	}
	if err := platsysnotif.MarkRead(r.Context(), h.db, userID, id); err != nil {
		logger.Error(r.Context(), "sysnotif mark read failed", logger.Field{"operation": "sysnotif_mark_read", "error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Notifikasi ditandai sudah dibaca", nil)
}

// MarkAllRead menandai semua notifikasi sebagai sudah dibaca.
func (h *Handler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	if err := platsysnotif.MarkAllRead(r.Context(), h.db, userID); err != nil {
		logger.Error(r.Context(), "sysnotif mark all read failed", logger.Field{"operation": "sysnotif_mark_all_read", "error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Semua notifikasi ditandai sudah dibaca", nil)
}
