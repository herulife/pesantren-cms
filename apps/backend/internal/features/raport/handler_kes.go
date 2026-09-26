package raport

import (
	"encoding/json"
	"net/http"
	"strconv"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/scope"
)

// SetKesantrian handles POST /api/raport/kesantrian {student_id, aspek, semester, academic_year, score}
func (h *Handler) SetKesantrian(w http.ResponseWriter, r *http.Request) {
	var in struct {
		StudentID    int     `json:"student_id"`
		Aspek        string  `json:"aspek"`
		Semester     string  `json:"semester"`
		AcademicYear string  `json:"academic_year"`
		Score        float64 `json:"score"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, 400, "Payload tidak valid", nil)
		return
	}
	if in.StudentID <= 0 || in.Aspek == "" || in.Semester == "" || in.AcademicYear == "" {
		writeJSON(w, 400, "student_id, aspek, semester, academic_year wajib diisi", nil)
		return
	}
	if in.Score < 1 || in.Score > 4 {
		writeJSON(w, 400, "Score kesantrian harus antara 1 dan 4", nil)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if scope.ReadOnly(role) || role == "guru" {
		writeJSON(w, 403, "Tidak berwenang mengisi kesantrian", nil)
		return
	}
	if role == "wali_kelas" {
		className, scErr := scope.StudentClass(database.DB, in.StudentID)
		sc, resErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || resErr != nil || !sc.HasClass(className) {
			writeJSON(w, 403, "Hanya dapat mengisi kesantrian santri kelas sendiri", nil)
			return
		}
	}
	if err := h.repo.SetKesantrianAspect(in.StudentID, in.Aspek, in.Semester, in.AcademicYear, in.Score); err != nil {
		writeJSON(w, 500, "Gagal simpan kesantrian: "+err.Error(), nil)
		return
	}
	writeJSON(w, 200, "Kesantrian aspek disimpan", in)
}

// GetKesantrian handles GET /api/raport/kesantrian?student_id=&semester=&academic_year=
func (h *Handler) GetKesantrian(w http.ResponseWriter, r *http.Request) {
	studentID, _ := strconv.Atoi(r.URL.Query().Get("student_id"))
	semester := r.URL.Query().Get("semester")
	ay := r.URL.Query().Get("academic_year")
	if studentID <= 0 || semester == "" || ay == "" {
		writeJSON(w, 400, "student_id, semester, academic_year wajib diisi", nil)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "guru" {
		writeJSON(w, 403, "Tidak berwenang melihat kesantrian", nil)
		return
	}
	if role == "wali_kelas" {
		className, scErr := scope.StudentClass(database.DB, studentID)
		sc, resErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || resErr != nil || !sc.HasClass(className) {
			writeJSON(w, 403, "Hanya dapat melihat kesantrian santri kelas sendiri", nil)
			return
		}
	}
	list, err := h.repo.GetKesantrianAspects(studentID, semester, ay)
	if err != nil {
		writeJSON(w, 500, "Gagal memuat kesantrian: "+err.Error(), nil)
		return
	}
	if list == nil {
		list = []KesantrianAspect{}
	}
	writeJSON(w, 200, "Daftar kesantrian aspek", list)
}
