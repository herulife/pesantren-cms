package walisantri

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/validators"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Put("/{id}", h.Update)
	return r
}

// GetAll: daftar akun wali + Santri-nya + akun yatim + statistik. Satu panggilan
// supaya halaman /admin/akun/walisantri tidak perlu requestParalel.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	out, err := h.repo.ListAll()
	if err != nil {
		logger.Error(r.Context(), "walisantri list failed", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, false, "Gagal memuat daftar akun wali", nil)
		return
	}
	writeJSON(w, http.StatusOK, true, "Daftar akun wali berhasil dimuat", out)
}

// Update: ganti nama + email akun wali (data karangan -> data asli).
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, false, "ID akun wali tidak valid", nil)
		return
	}

	body, err := readBody(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, false, "Isi permintaan tidak valid", nil)
		return
	}
	var req validators.WaliUpdateRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, false, "Isi permintaan tidak valid: "+err.Error(), nil)
		return
	}
	if errs := validators.ValidateWaliUpdateRequest(&req); len(errs) > 0 {
		writeJSON(w, http.StatusUnprocessableEntity, false, "Data wali tidak valid", errs)
		return
	}

	if err := h.repo.Update(id, UpdateInput{Name: req.Name, Email: req.Email}); err != nil {
		if errors.Is(err, ErrDuplicateEmail) {
			writeJSON(w, http.StatusConflict, false, "Email itu sudah dipakai akun lain", nil)
			return
		}
		logger.Error(r.Context(), "walisantri update failed", logger.Field{"user_id": id, "error": err.Error()})
		writeJSON(w, http.StatusBadRequest, false, "Gagal menyimpan akun wali", nil)
		return
	}

	actorID, _ := actorFrom(r)
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID,
		Action: "UPDATE_WALI", Entity: "user", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"name": req.Name, "email": req.Email},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	writeJSON(w, http.StatusOK, true, "Akun wali diperbarui", nil)
}

func actorFrom(r *http.Request) (int, bool) {
	if v := r.Header.Get("X-Actor-ID"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n, true
		}
	}
	return 0, false
}

// trim untuk dipakai ulang saat constructing pesan.
func trim(s string) string { return strings.TrimSpace(s) }