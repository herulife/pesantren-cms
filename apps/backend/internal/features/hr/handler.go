package hr

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

var datePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func writeJSON(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": success, "message": msg, "data": data})
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/employees", h.ListEmployees)
	r.Post("/employees", h.CreateEmployee)
	r.Put("/employees/{code}", h.UpdateEmployee)
	r.Delete("/employees/{code}", h.DeleteEmployee)
	r.Get("/attendance", h.ListAttendance)
	r.Post("/attendance", h.CreateAttendance)
	r.Put("/attendance/{id}", h.UpdateAttendance)
	r.Delete("/attendance/{id}", h.DeleteAttendance)
	r.Get("/per-guru", h.PerGuru)
	r.Get("/rekap", h.Rekap)
	return r
}

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	list, err := h.repo.ListEmployees(q.Get("active_only") == "true", q.Get("search"))
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat data pegawai", nil)
		return
	}
	writeJSON(w, 200, true, "Data pegawai berhasil dimuat", list)
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var e Employee
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	e.Code = strings.TrimSpace(e.Code)
	e.Name = strings.TrimSpace(e.Name)
	errs := map[string][]string{}
	if e.Code == "" {
		errs["code"] = []string{"Kode/ID pegawai wajib diisi"}
	}
	if len(e.Name) < 3 {
		errs["name"] = []string{"Nama pegawai minimal 3 karakter"}
	}
	if e.Kind != "Guru" && e.Kind != "Staf" {
		errs["kind"] = []string{"Jenis harus Guru/Staf"}
	}
	if len(errs) > 0 {
		writeJSON(w, 422, false, "Validasi gagal", errs)
		return
	}
	if err := h.repo.CreateEmployee(&e); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeJSON(w, 409, false, "Kode pegawai sudah ada", nil)
			return
		}
		writeJSON(w, 500, false, "Gagal menyimpan pegawai", nil)
		return
	}
	writeJSON(w, 201, true, "Pegawai berhasil ditambahkan", nil)
}

func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	var e Employee
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	e.Code = chi.URLParam(r, "code")
	if err := h.repo.UpdateEmployee(&e); err != nil {
		writeJSON(w, 500, false, "Gagal mengubah pegawai", nil)
		return
	}
	writeJSON(w, 200, true, "Pegawai berhasil diubah", nil)
}

func (h *Handler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.DeleteEmployee(chi.URLParam(r, "code")); err != nil {
		writeJSON(w, 500, false, "Gagal menghapus pegawai", nil)
		return
	}
	writeJSON(w, 200, true, "Pegawai berhasil dihapus", nil)
}

func validStatus(s string) bool {
	return s == "Masuk" || s == "Sakit" || s == "Ijin" || s == "Tanpa Keterangan"
}

func (h *Handler) ListAttendance(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	list, err := h.repo.ListAttendance(q.Get("code"), q.Get("from"), q.Get("to"))
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat absensi", nil)
		return
	}
	writeJSON(w, 200, true, "Absensi berhasil dimuat", list)
}

func (h *Handler) CreateAttendance(w http.ResponseWriter, r *http.Request) {
	var a Attendance
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	errs := map[string][]string{}
	if strings.TrimSpace(a.EmployeeCode) == "" {
		errs["employee_code"] = []string{"Guru wajib dipilih"}
	}
	if !datePattern.MatchString(a.Date) {
		errs["date"] = []string{"Tanggal harus format YYYY-MM-DD"}
	}
	if !validStatus(a.Status) {
		errs["status"] = []string{"Status harus Masuk/Sakit/Ijin/Tanpa Keterangan"}
	}
	if len(errs) > 0 {
		writeJSON(w, 422, false, "Validasi gagal", errs)
		return
	}
	id, err := h.repo.CreateAttendance(&a)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeJSON(w, 409, false, "Absensi guru tanggal ini sudah ada", nil)
			return
		}
		writeJSON(w, 500, false, "Gagal menyimpan absensi", nil)
		return
	}
	writeJSON(w, 201, true, "Absensi berhasil dicatat", map[string]interface{}{"id": id})
}

func (h *Handler) UpdateAttendance(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var a Attendance
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	a.ID = id
	if !validStatus(a.Status) {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"status": {"Status tidak valid"}})
		return
	}
	if err := h.repo.UpdateAttendance(&a); err != nil {
		writeJSON(w, 500, false, "Gagal mengubah absensi", nil)
		return
	}
	writeJSON(w, 200, true, "Absensi berhasil diubah", nil)
}

func (h *Handler) DeleteAttendance(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteAttendance(id); err != nil {
		writeJSON(w, 500, false, "Gagal menghapus absensi", nil)
		return
	}
	writeJSON(w, 200, true, "Absensi berhasil dihapus", nil)
}

func (h *Handler) PerGuru(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	sum, list, err := h.repo.PerGuruSummary(q.Get("code"), q.Get("from"), q.Get("to"))
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat laporan", nil)
		return
	}
	writeJSON(w, 200, true, "Laporan per guru berhasil dimuat", map[string]interface{}{"summary": sum, "rows": list})
}

func (h *Handler) Rekap(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	from, to := q.Get("from"), q.Get("to")
	days := 0
	if datePattern.MatchString(from) && datePattern.MatchString(to) {
		if t1, e1 := time.Parse("2006-01-02", from); e1 == nil {
			if t2, e2 := time.Parse("2006-01-02", to); e2 == nil && !t2.Before(t1) {
				days = int(t2.Sub(t1).Hours()/24) + 1
			}
		}
	}
	rows, err := h.repo.Rekap(from, to, days)
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat rekap", nil)
		return
	}
	writeJSON(w, 200, true, "Rekap absensi berhasil dimuat", rows)
}
