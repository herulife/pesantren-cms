package walisantri

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
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

func writeJSON(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": success, "message": msg, "data": data})
}

// List: daftar akun wali + Santri-nya + akun yatim + statistik. Satu panggilan
// supaya halaman /admin/akun/walisantri tidak perlu request paralel.
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

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
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
		writeJSON(w, http.StatusBadRequest, false, err.Error(), nil)
		return
	}

	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID,
		Action: "UPDATE_WALI", Entity: "user", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"name": req.Name, "email": req.Email},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	writeJSON(w, http.StatusOK, true, "Akun wali diperbarui", nil)
}
