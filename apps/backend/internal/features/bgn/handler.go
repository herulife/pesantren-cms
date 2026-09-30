package bgn

import (
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func sendJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/stats", h.GetStats)
	r.Post("/", h.Create)
	r.Post("/import", h.Import)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	filter := Filter{
		Position: strings.TrimSpace(r.URL.Query().Get("position")),
		Status:   strings.TrimSpace(r.URL.Query().Get("status")),
		Search:   strings.TrimSpace(r.URL.Query().Get("search")),
	}
	items, err := h.repo.FindAll(filter)
	if err != nil {
		logger.Error(r.Context(), "FindAll bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal memuat data BGN (Internal Server Error)"})
		return
	}
	sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "data": items})
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.Stats()
	if err != nil {
		logger.Error(r.Context(), "Stats bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal memuat statistik BGN (Internal Server Error)"})
		return
	}
	sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "data": stats})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var in RecipientInput
	if !decodeJSON(w, r, &in) {
		return
	}
	if errs := normalizeInput(&in); len(errs) > 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "errors": errs})
		return
	}
	id, err := h.repo.Create(&in)
	if err != nil {
		logger.Error(r.Context(), "Create bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal menyimpan data BGN (Internal Server Error)"})
		return
	}
	sendJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"data":    map[string]interface{}{"id": id},
		"message": "Data BGN berhasil disimpan",
	})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "ID tidak valid"})
		return
	}
	var in RecipientInput
	if !decodeJSON(w, r, &in) {
		return
	}
	if errs := normalizeInput(&in); len(errs) > 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "errors": errs})
		return
	}
	if err := h.repo.Update(id, &in); err != nil {
		logger.Error(r.Context(), "Update bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal memperbarui data BGN (Internal Server Error)"})
		return
	}
	sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Data BGN berhasil diperbarui"})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "ID tidak valid"})
		return
	}
	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "Delete bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal menghapus data BGN (Internal Server Error)"})
		return
	}
	sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Data BGN berhasil dihapus"})
}

func (h *Handler) Import(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Items []RecipientInput `json:"items"`
	}
	if !decodeJSON(w, r, &payload) {
		return
	}
	if len(payload.Items) == 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Tidak ada data untuk diimport"})
		return
	}

	clean := make([]RecipientInput, 0, len(payload.Items))
	skippedInvalid := 0
	for _, it := range payload.Items {
		if errs := normalizeInput(&it); len(errs) > 0 {
			skippedInvalid++
			continue
		}
		clean = append(clean, it)
	}
	if len(clean) == 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Tidak ada baris valid untuk diimport"})
		return
	}

	result, err := h.repo.ImportUpsert(clean)
	if err != nil {
		logger.Error(r.Context(), "Import bgn failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal mengimport data BGN (Internal Server Error)"})
		return
	}
	result.Skipped += skippedInvalid

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    result,
		"message": fmt.Sprintf("%d ditambahkan, %d diperbarui, %d dilewati", result.Added, result.Updated, result.Skipped),
	})
}

func normalizeInput(in *RecipientInput) []string {
	in.Identity = strings.TrimSpace(in.Identity)
	in.Name = strings.TrimSpace(in.Name)
	in.BirthDate = strings.TrimSpace(in.BirthDate)
	in.ParentName = strings.TrimSpace(in.ParentName)
	in.Gender = strings.ToUpper(strings.TrimSpace(in.Gender))
	in.Position = strings.ToLower(strings.TrimSpace(in.Position))

	var errs []string
	if in.Name == "" {
		errs = append(errs, "Nama penerima wajib diisi")
	}
	if len(in.Identity) > 20 {
		errs = append(errs, "NISN/NIK maksimal 20 karakter")
	}
	switch in.Gender {
	case "", "L", "P":
	default:
		errs = append(errs, "Jenis kelamin harus L atau P")
		in.Gender = ""
	}
	switch in.Position {
	case "":
		errs = append(errs, "Posisi wajib diisi")
	case "penerima":
		in.Position = "santri"
	case "santri", "guru", "tendik":
	default:
		errs = append(errs, "Posisi harus santri, guru, atau tendik")
	}
	return errs
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	body, err := io.ReadAll(io.LimitReader(r.Body, 2<<20))
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return false
	}
	if err := validators.DecodeStrictJSON(body, dst); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return false
	}
	return true
}