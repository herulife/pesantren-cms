package raport

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"almaparung-api/internal/platform/weight"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/list", h.ListRaports)
	r.Get("/calculate", h.Calculate)        // ?student_id=&semester=&academic_year=&mapel_weight=&project_weight=&kesantrian_weight=
	r.Post("/save", h.Save)                 // require superadmin/bendahara
	r.Get("/santri/{id}", h.GetByStudentID) // student self view / wali view
	r.Get("/weights/default", h.DefaultWeights)
	return r
}

func writeJSON(w http.ResponseWriter, status int, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": status < 400, "message": msg, "data": data})
}

// DefaultWeights returns the E-Raport weight defaults (Mapel 50, Project 25, Kesantrian 25).
func (h *Handler) DefaultWeights(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, "Bobot default E-Raport", map[string]int{"mapel": 50, "project": 25, "kesantrian": 25})
}

func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	studentID, _ := strconv.Atoi(r.URL.Query().Get("student_id"))
	semester := r.URL.Query().Get("semester")
	ay := r.URL.Query().Get("academic_year")
	if studentID <= 0 || semester == "" || ay == "" {
		writeJSON(w, 400, "student_id, semester, academic_year wajib diisi", nil)
		return
	}
	weights := map[string]int{
		"mapel":      getInt(r, "mapel_weight", 50),
		"project":    getInt(r, "project_weight", 25),
		"kesantrian": getInt(r, "kesantrian_weight", 25),
	}
	// Ensure total == 100
	total := weights["mapel"] + weights["project"] + weights["kesantrian"]
	if total != 100 {
		writeJSON(w, 400, "Total bobot E-Raport (mapel+project+kesantrian) harus 100%. Saat ini "+strconv.Itoa(total)+"%", nil)
		return
	}
	res, err := h.repo.Compute(ctx, studentID, semester, ay, weights)
	if err != nil {
		writeJSON(w, 500, "Gagal menghitung rapor: "+err.Error(), nil)
		return
	}
	writeJSON(w, 200, "Rapor berhasil dihitung", res)
}

func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var s StoredRaport
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		writeJSON(w, 400, "Payload tidak valid", nil)
		return
	}
	if s.StudentID <= 0 || s.Semester == "" || s.AcademicYear == "" {
		writeJSON(w, 400, "student_id, semester, academic_year wajib", nil)
		return
	}
	// Recompute final to prevent tampering
	res, err := h.repo.Compute(ctx, s.StudentID, s.Semester, s.AcademicYear, map[string]int{"mapel": 50, "project": 25, "kesantrian": 25})
	if err == nil {
		s.MapelScore = res.MapelScore
		s.ProjectScore = res.ProjectScore
		s.KesantrianScore = res.KesantrianScore
		s.FinalScore = res.FinalScore
		s.Predikat = res.Predikat
	}
	s.Status = "locked"
	s.UpdatedAt = time.Now().UTC().Format("2006-01-02 15:04:05")
	if err := h.repo.Upsert(ctx, &s); err != nil {
		writeJSON(w, 500, "Gagal menyimpan rapor: "+err.Error(), nil)
		return
	}
	writeJSON(w, 200, "Rapor berhasil disimpan (locked)", s)
}

func (h *Handler) GetByStudentID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	semester := r.URL.Query().Get("semester")
	ay := r.URL.Query().Get("academic_year")
	// Prefer stored; if none, compute on the fly
	if s, err := h.repo.GetStored(ctx, id, semester, ay); err == nil {
		writeJSON(w, 200, "Rapor santri", s)
		return
	}
	res, err := h.repo.Compute(ctx, id, semester, ay, map[string]int{"mapel": 50, "project": 25, "kesantrian": 25})
	if err != nil {
		writeJSON(w, 500, "Gagal memuat rapor: "+err.Error(), nil)
		return
	}
	writeJSON(w, 200, "Rapor santri (live)", res)
}

func (h *Handler) ListRaports(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	ay := r.URL.Query().Get("academic_year")
	semester := r.URL.Query().Get("semester")
	if ay == "" || semester == "" {
		writeJSON(w, 400, "academic_year dan semester wajib", nil)
		return
	}
	list, err := h.repo.ListByAcademicYear(ctx, ay, semester)
	if err != nil {
		writeJSON(w, 500, "Gagal memuat daftar rapor: "+err.Error(), nil)
		return
	}
	if list == nil {
		list = []StoredRaport{}
	}
	writeJSON(w, 200, "Daftar rapor", list)
}

func getInt(r *http.Request, key string, def int) int {
	if v := r.URL.Query().Get(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

// WeightOverview returns E-Raport weight validation (alias to keep engine import used).
func WeightCheck(w http.ResponseWriter, _ map[string]float64) {
	_ = weight.ValidateWeights
}
