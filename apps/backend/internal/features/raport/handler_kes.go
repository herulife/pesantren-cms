package raport

import (
	"encoding/json"
	"net/http"
	"strconv"
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
