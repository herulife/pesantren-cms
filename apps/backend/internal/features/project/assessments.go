package project

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/scope"
	"almaparung-api/internal/validators"
)

// Assessment adalah nilai project seorang santri untuk satu kegiatan
// (skala 1-4, sama seperti aspek kesantrian).
type Assessment struct {
	ID           int     `json:"id"`
	StudentID    int     `json:"student_id"`
	ActivityID   int     `json:"activity_id"`
	Semester     string  `json:"semester"`
	AcademicYear string  `json:"academic_year"`
	Score        float64 `json:"score"`
	UpdatedAt    string  `json:"updated_at"`
}

// UpsertAssessment menyimpan/memperbarui nilai project santri per kegiatan.
func (r *Repository) UpsertAssessment(studentID, activityID int, semester, ay string, score float64) error {
	now := time.Now().UTC().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(`
		INSERT INTO project_assessments (student_id, activity_id, semester, academic_year, score, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(student_id, activity_id, semester, academic_year) DO UPDATE SET
			score = excluded.score,
			updated_at = excluded.updated_at
	`, studentID, activityID, semester, ay, score, now, now)
	return err
}

// ListAssessments mengembalikan peta activity_id -> score untuk seorang santri.
func (r *Repository) ListAssessments(studentID int, semester, ay string) (map[int]float64, error) {
	rows, err := r.db.Query(`SELECT activity_id, score FROM project_assessments
		WHERE student_id = ? AND semester = ? AND academic_year = ?`, studentID, semester, ay)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[int]float64{}
	for rows.Next() {
		var aid int
		var sc float64
		if err := rows.Scan(&aid, &sc); err != nil {
			continue
		}
		out[aid] = sc
	}
	return out, rows.Err()
}

// SetAssessment: POST /project/assessments {student_id, activity_id, semester, academic_year, score}
func (h *Handler) SetAssessment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID    int     `json:"student_id"`
		ActivityID   int     `json:"activity_id"`
		Semester     string  `json:"semester"`
		AcademicYear string  `json:"academic_year"`
		Score        float64 `json:"score"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	req.Semester = validators.NormalizeSemester(req.Semester)
	req.AcademicYear = strings.TrimSpace(req.AcademicYear)
	if req.StudentID <= 0 || req.ActivityID <= 0 || req.Semester == "" || req.AcademicYear == "" {
		sendJSON(w, 400, false, "student_id, activity_id, semester, academic_year wajib diisi", nil)
		return
	}
	if req.Score < 1 || req.Score > 4 {
		sendJSON(w, 400, false, "Nilai project harus 1-4", nil)
		return
	}
	// Pastikan aktivitasnya ada & aktif.
	acts, err := h.repo.GetActivities(0)
	found := false
	if err == nil {
		for _, a := range acts {
			if a.ID == req.ActivityID && a.IsActive {
				found = true
				break
			}
		}
	}
	if !found {
		sendJSON(w, 404, false, "Kegiatan tidak ditemukan/aktif", nil)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if scope.ReadOnly(role) || role == "guru" || role == "ustadz" {
		sendJSON(w, 403, false, "Penilaian project hanya oleh wali kelas", nil)
		return
	}
	if role == "wali_kelas" {
		className, scErr := scope.StudentClass(database.DB, req.StudentID)
		sc, resErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || resErr != nil || !sc.HasClass(className) {
			sendJSON(w, 403, false, "Hanya dapat menilai project santri kelas sendiri", nil)
			return
		}
	}
	if err := h.repo.UpsertAssessment(req.StudentID, req.ActivityID, req.Semester, req.AcademicYear, req.Score); err != nil {
		sendJSON(w, 500, false, "Gagal menyimpan nilai project", nil)
		return
	}
	audit(r, "SET_PROJECT_ASSESSMENT", "Nilai project santri "+strconv.Itoa(req.StudentID)+" kegiatan "+strconv.Itoa(req.ActivityID)+" = "+strconv.FormatFloat(req.Score, 'f', 1, 64))
	sendJSON(w, 200, true, "Nilai project tersimpan", nil)
}

// ListAssessments: GET /project/assessments?student_id=&semester=&academic_year=
func (h *Handler) ListAssessments(w http.ResponseWriter, r *http.Request) {
	studentID, _ := strconv.Atoi(r.URL.Query().Get("student_id"))
	semester := validators.NormalizeSemester(r.URL.Query().Get("semester"))
	ay := strings.TrimSpace(r.URL.Query().Get("academic_year"))
	if studentID <= 0 || semester == "" || ay == "" {
		sendJSON(w, 400, false, "student_id, semester, academic_year wajib diisi", nil)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "guru" || role == "ustadz" {
		sendJSON(w, 403, false, "Tidak berwenang melihat nilai project", nil)
		return
	}
	if role == "wali_kelas" {
		className, scErr := scope.StudentClass(database.DB, studentID)
		sc, resErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || resErr != nil || !sc.HasClass(className) {
			sendJSON(w, 403, false, "Hanya dapat melihat nilai project santri kelas sendiri", nil)
			return
		}
	}
	m, err := h.repo.ListAssessments(studentID, semester, ay)
	if err != nil {
		sendJSON(w, 500, false, "Gagal memuat nilai project", nil)
		return
	}
	if m == nil {
		m = map[int]float64{}
	}
	sendJSON(w, 200, true, "Nilai project santri", m)
}
