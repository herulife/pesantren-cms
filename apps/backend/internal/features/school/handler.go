package school

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

func writeJSON(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": success, "message": msg, "data": data})
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/classes", h.ListClasses)
	r.Post("/classes", h.CreateClass)
	r.Put("/classes/{id}", h.UpdateClass)
	r.Delete("/classes/{id}", h.DeleteClass)
	r.Get("/years", h.ListYears)
	r.Post("/years", h.CreateYear)
	r.Put("/years/{id}", h.UpdateYear)
	r.Post("/years/{id}/activate", h.ActivateYear)
	r.Delete("/years/{id}", h.DeleteYear)
	return r
}

func (h *Handler) ListClasses(w http.ResponseWriter, r *http.Request) {
	active := r.URL.Query().Get("active_only") == "true"
	list, err := h.repo.ListClasses(active)
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat data kelas", nil)
		return
	}
	writeJSON(w, 200, true, "Data kelas berhasil dimuat", list)
}

func (h *Handler) CreateClass(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name    string `json:"name"`
		Jenjang string `json:"jenjang"`
		Wali    string `json:"wali_name"`
		Year    string `json:"academic_year"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if len(req.Name) < 1 || len(req.Name) > 50 {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"name": {"Nama kelas wajib 1-50 karakter"}})
		return
	}
	id, err := h.repo.CreateClass(req.Name, req.Jenjang, req.Wali, req.Year)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeJSON(w, 409, false, "Nama kelas sudah ada", nil)
			return
		}
		writeJSON(w, 500, false, "Gagal menyimpan kelas", nil)
		return
	}
	writeJSON(w, 201, true, "Kelas berhasil ditambahkan", map[string]interface{}{"id": id})
}

func (h *Handler) UpdateClass(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Name     string `json:"name"`
		Jenjang  string `json:"jenjang"`
		Wali     string `json:"wali_name"`
		Year     string `json:"academic_year"`
		IsActive int    `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"name": {"Nama kelas wajib diisi"}})
		return
	}
	if err := h.repo.UpdateClass(id, req.Name, req.Jenjang, req.Wali, req.Year, req.IsActive); err != nil {
		writeJSON(w, 500, false, "Gagal mengubah kelas", nil)
		return
	}
	writeJSON(w, 200, true, "Kelas berhasil diubah", nil)
}

func (h *Handler) DeleteClass(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteClass(id); err != nil {
		writeJSON(w, 500, false, "Gagal menghapus kelas", nil)
		return
	}
	writeJSON(w, 200, true, "Kelas berhasil dihapus", nil)
}

func (h *Handler) ListYears(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.ListYears()
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat tahun ajaran", nil)
		return
	}
	writeJSON(w, 200, true, "Tahun ajaran berhasil dimuat", list)
}

func (h *Handler) CreateYear(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name      string `json:"name"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"name": {"Nama tahun ajaran wajib diisi (contoh: 2025/2026)"}})
		return
	}
	id, err := h.repo.CreateYear(req.Name, req.StartDate, req.EndDate)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeJSON(w, 409, false, "Tahun ajaran sudah ada", nil)
			return
		}
		writeJSON(w, 500, false, "Gagal menyimpan tahun ajaran", nil)
		return
	}
	writeJSON(w, 201, true, "Tahun ajaran berhasil ditambahkan", map[string]interface{}{"id": id})
}

func (h *Handler) UpdateYear(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Name      string `json:"name"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
		IsActive  int    `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	if err := h.repo.UpdateYear(id, req.Name, req.StartDate, req.EndDate, req.IsActive); err != nil {
		writeJSON(w, 500, false, "Gagal mengubah tahun ajaran", nil)
		return
	}
	writeJSON(w, 200, true, "Tahun ajaran berhasil diubah", nil)
}

func (h *Handler) ActivateYear(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.SetActiveYear(id); err != nil {
		writeJSON(w, 500, false, "Gagal mengaktifkan tahun ajaran", nil)
		return
	}
	writeJSON(w, 200, true, "Tahun ajaran berhasil diaktifkan", nil)
}

func (h *Handler) DeleteYear(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteYear(id); err != nil {
		writeJSON(w, 500, false, "Gagal menghapus tahun ajaran", nil)
		return
	}
	writeJSON(w, 200, true, "Tahun ajaran berhasil dihapus", nil)
}
