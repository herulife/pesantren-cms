package santri

import (
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Santri struct {
	ID          int    `json:"id"`
	NIS         string `json:"nis"`
	Name        string `json:"name"`
	Nickname    string `json:"nickname"`
	Gender      string `json:"gender"`
	BirthPlace  string `json:"birth_place"`
	BirthDate   string `json:"birth_date"`
	Address     string `json:"address"`
	Class       string `json:"class"`
	Angkatan    string `json:"angkatan"`
	Status      string `json:"status"`
	ParentName  string `json:"parent_name"`
	ParentPhone string `json:"parent_phone"`
	PhotoURL    string `json:"photo_url"`
	UserID      *int   `json:"user_id,omitempty"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type IRepository interface {
	FindAll(search, class, status string, limit, offset int) ([]Santri, int, error)
	FindByID(id int) (*Santri, error)
	Create(s *Santri) error
	BulkCreate(items []Santri) (int, error)
	Update(s *Santri) error
	Delete(id int) error
	BulkDelete(ids []int) (int, error)
}

type Handler struct {
	repo IRepository
}

func parsePagination(r *http.Request) (limit, offset int) {
	limit, _ = strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ = strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/{id}", h.GetByID)
	r.Post("/", h.Create)
	r.Post("/bulk", h.BulkCreate)
	r.Post("/set-class", h.SetClass)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Delete("/bulk", h.BulkDelete)
	return r
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

func sendValidationError(w http.ResponseWriter, errs map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"message": "Validasi gagal",
		"errors":  errs,
	})
}

func validateSantri(s *Santri) map[string]string {
	errs := map[string]string{}
	s.NIS = strings.TrimSpace(s.NIS)
	s.Name = strings.TrimSpace(s.Name)
	s.Gender = strings.ToLower(strings.TrimSpace(s.Gender))
	s.Status = strings.ToLower(strings.TrimSpace(s.Status))
	if s.NIS == "" {
		errs["nis"] = "NIS wajib diisi"
	} else if len(s.NIS) < 4 || len(s.NIS) > 20 {
		errs["nis"] = "NIS 4-20 karakter"
	}
	if s.Name == "" {
		errs["name"] = "Nama santri wajib diisi"
	} else if len(s.Name) < 3 {
		errs["name"] = "Nama minimal 3 karakter"
	}
	if s.Gender != "" && s.Gender != "l" && s.Gender != "p" && s.Gender != "laki-laki" && s.Gender != "perempuan" {
		errs["gender"] = "Gender harus L/P"
	}
	if s.Class == "" {
		errs["class"] = "Kelas wajib diisi"
	}
	validStatus := map[string]bool{"aktif": true, "lulus": true, "pindah": true, "cuti": true}
	if s.Status != "" && !validStatus[s.Status] {
		errs["status"] = "Status harus aktif/lulus/pindah/cuti"
	}
	if s.BirthDate != "" && !validators.ValidateDate(s.BirthDate) {
		errs["birth_date"] = "Tanggal lahir format YYYY-MM-DD"
	}
	if s.ParentPhone != "" && !validators.ValidatePhone(s.ParentPhone) {
		errs["parent_phone"] = "No HP wali tidak valid"
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	class := r.URL.Query().Get("class")
	status := r.URL.Query().Get("status")
	limit, offset := parsePagination(r)
	list, total, err := h.repo.FindAll(search, class, status, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "santri list failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat data santri", nil)
		return
	}
	if list == nil {
		list = []Santri{}
	}
	w.Header().Set("X-Total-Count", strconv.Itoa(total))
	sendJSONResponse(w, http.StatusOK, true, "Daftar santri berhasil dimuat", map[string]interface{}{"items": list, "total": total, "limit": limit, "offset": offset})
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	santri, err := h.repo.FindByID(id)
	if err != nil {
		sendJSONResponse(w, http.StatusNotFound, false, "Santri tidak ditemukan", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Detail santri", santri)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var s Santri
	if err := validators.DecodeJSON(w, r, &s); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if errs := validateSantri(&s); errs != nil {
		sendValidationError(w, errs)
		return
	}
	if err := h.repo.Create(&s); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			sendJSONResponse(w, http.StatusConflict, false, "NIS sudah terdaftar", nil)
			return
		}
		logger.Error(r.Context(), "santri create failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menambah santri", nil)
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, "Santri berhasil ditambahkan", s)
}

func (h *Handler) BulkCreate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Items []Santri `json:"items"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if len(req.Items) == 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada data untuk ditambahkan", nil)
		return
	}
	if len(req.Items) > 500 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Maksimal 500 data per import", nil)
		return
	}
	var firstErr error
	for i := range req.Items {
		if errs := validateSantri(&req.Items[i]); errs != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Data ke-"+strconv.Itoa(i+1)+" tidak valid", errs)
			return
		}
	}
	inserted, err := h.repo.BulkCreate(req.Items)
	if err != nil {
		firstErr = err
	}
	if firstErr != nil && strings.Contains(firstErr.Error(), "UNIQUE") {
		sendJSONResponse(w, http.StatusConflict, false, "Beberapa NIS sudah terdaftar", map[string]interface{}{"inserted": inserted})
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, strconv.Itoa(inserted)+" santri berhasil ditambahkan", map[string]interface{}{"inserted": inserted})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var s Santri
	if err := validators.DecodeJSON(w, r, &s); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if errs := validateSantri(&s); errs != nil {
		sendValidationError(w, errs)
		return
	}
	s.ID = id
	if err := h.repo.Update(&s); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			sendJSONResponse(w, http.StatusConflict, false, "NIS sudah terdaftar", nil)
			return
		}
		logger.Error(r.Context(), "santri update failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memperbarui santri", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Santri berhasil diperbarui", s)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.Delete(id); err != nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus santri", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Santri berhasil dihapus", nil)
}

func (h *Handler) SetClass(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Items []struct {
			ID    int    `json:"id"`
			Class string `json:"class"`
		} `json:"items"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if len(req.Items) == 0 || len(req.Items) > 500 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Maksimal 500 santri per simpan", nil)
		return
	}
	m := map[int]string{}
	for _, it := range req.Items {
		if it.ID > 0 {
			m[it.ID] = it.Class
		}
	}
	n, err := h.repo.SetClassBulk(m)
	if err != nil {
		logger.Error(r.Context(), "santri set-class failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan kelas", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, strconv.Itoa(n)+" santri berhasil diset kelasnya", map[string]interface{}{"updated": n})
}

func (h *Handler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs []int `json:"ids"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if len(req.IDs) == 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada data yang dipilih", nil)
		return
	}
	deleted, err := h.repo.BulkDelete(req.IDs)
	if err != nil {
		logger.Error(r.Context(), "santri bulk delete failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus santri", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, strconv.Itoa(deleted)+" santri berhasil dihapus", map[string]interface{}{"deleted": deleted})
}
