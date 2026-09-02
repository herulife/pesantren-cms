package academics

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"encoding/json"
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

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	// Subjects
	r.Get("/subjects", h.GetSubjects)
	r.Post("/subjects", h.CreateSubject)
	r.Delete("/subjects/{id}", h.DeleteSubject)
	// Grades
	r.Get("/grades", h.GetGrades) // ?semester=&year=
	r.Get("/grades/student/{id}", h.GetGradesByStudent)
	r.Post("/grades", h.CreateGrade)
	r.Put("/grades/{id}", h.UpdateGrade)
	r.Delete("/grades/{id}", h.DeleteGrade)
	// Attendance
	r.Get("/attendance", h.GetAttendance) // ?date=2025-01-15
	r.Post("/attendance", h.CreateAttendance)
	r.Put("/attendance/{id}", h.UpdateAttendance)
	r.Delete("/attendance/{id}", h.DeleteAttendance)
	r.Get("/attendance/summary/{id}", h.GetAttendanceSummary)
	r.Get("/attendance/me/summary", h.GetMyAttendanceSummary)
	// Tahfidz
	r.Get("/tahfidz", h.GetTahfidz)
	r.Get("/tahfidz/me", h.GetMyTahfidz)
	r.Post("/tahfidz", h.CreateTahfidz)
	r.Put("/tahfidz/{id}", h.UpdateTahfidz)
	r.Delete("/tahfidz/{id}", h.DeleteTahfidz)
	// Students list
	r.Get("/students", h.GetStudents)
	r.Get("/grades/me", h.GetMyGrades)
	return r
}

func currentUserID(r *http.Request) (int, bool) {
	return auth.CurrentUserID(r.Context())
}

func writeJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func writeJSONValidationError(w http.ResponseWriter, errors map[string][]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"message": "Validasi gagal",
		"errors":  errors,
	})
}

func validateGrade(g *Grade) map[string][]string {
	errs := map[string][]string{}
	if g.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	}
	if g.SubjectID <= 0 {
		errs["subject_id"] = []string{"Mata pelajaran wajib dipilih"}
	}
	if g.UTSScore < 0 || g.UTSScore > 100 {
		errs["uts_score"] = []string{"Nilai UTS harus 0-100"}
	}
	if g.UASScore < 0 || g.UASScore > 100 {
		errs["uas_score"] = []string{"Nilai UAS harus 0-100"}
	}
	if g.TaskScore < 0 || g.TaskScore > 100 {
		errs["task_score"] = []string{"Nilai tugas harus 0-100"}
	}
	if g.Semester != "" && g.Semester != "ganjil" && g.Semester != "genap" {
		errs["semester"] = []string{"Semester harus ganjil atau genap"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func validateAttendance(a *Attendance) map[string][]string {
	errs := map[string][]string{}
	if a.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	}
	if a.Date == "" {
		errs["date"] = []string{"Tanggal wajib diisi"}
	}
	validStatus := map[string]bool{"hadir": true, "sakit": true, "izin": true, "alpha": true}
	if !validStatus[a.Status] {
		errs["status"] = []string{"Status harus hadir/sakit/izin/alpha"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func validateTahfidz(t *TahfidzProgress) map[string][]string {
	errs := map[string][]string{}
	if t.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	}
	if t.Juz < 1 || t.Juz > 30 {
		errs["juz"] = []string{"Juz harus 1-30"}
	}
	if t.SurahName == "" {
		errs["surah_name"] = []string{"Nama surah wajib diisi"}
	}
	validStatus := map[string]bool{"proses": true, "setor": true, "lulus": true}
	if t.Status != "" && !validStatus[t.Status] {
		errs["status"] = []string{"Status harus proses/setor/lulus"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
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

func calcGrade(uts, uas, task float64) (float64, string) {
	final := (30*uts + 40*uas + 30*task) / 100
	var letter string
	switch {
	case final >= 85:
		letter = "A"
	case final >= 70:
		letter = "B"
	case final >= 55:
		letter = "C"
	case final >= 40:
		letter = "D"
	default:
		letter = "E"
	}
	return final, letter
}

func (h *Handler) GetSubjects(w http.ResponseWriter, r *http.Request) {
	ss, err := h.repo.GetAllSubjects()
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar mata pelajaran berhasil dimuat", ss)
}

func (h *Handler) CreateSubject(w http.ResponseWriter, r *http.Request) {
	var s Subject
	if err := validators.DecodeJSON(w, r, &s); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	s.Name = strings.TrimSpace(s.Name)
	s.Category = strings.TrimSpace(s.Category)
	if s.Name == "" {
		writeJSONValidationError(w, map[string][]string{
			"name": {"Nama mata pelajaran wajib diisi"},
		})
		return
	}
	if s.Category == "" {
		s.Category = "Akademik"
	}
	if s.TeacherID < 0 {
		writeJSONValidationError(w, map[string][]string{
			"teacher_id": {"Guru pengampu tidak valid"},
		})
		return
	}
	if err := h.repo.CreateSubject(&s); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Mata pelajaran berhasil ditambahkan", nil)
}

func (h *Handler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteSubject(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Mata pelajaran berhasil dihapus", nil)
}

func (h *Handler) GetGrades(w http.ResponseWriter, r *http.Request) {
	semester := r.URL.Query().Get("semester")
	year := r.URL.Query().Get("year")
	limit, offset := parsePagination(r)
	gs, err := h.repo.GetAllGrades(semester, year, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data nilai berhasil dimuat", gs)
}

func (h *Handler) GetGradesByStudent(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	gs, err := h.repo.GetGradesByStudent(id)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data nilai santri berhasil dimuat", gs)
}

func (h *Handler) GetMyGrades(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses belum diizinkan", nil)
		return
	}

	gs, err := h.repo.GetGradesByStudent(userID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data nilai santri berhasil dimuat", gs)
}

func (h *Handler) CreateGrade(w http.ResponseWriter, r *http.Request) {
	var g Grade
	if err := validators.DecodeJSON(w, r, &g); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateGrade(&g); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.CreateGrade(&g); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Nilai berhasil ditambahkan", nil)
}

func (h *Handler) UpdateGrade(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var g Grade
	if err := validators.DecodeJSON(w, r, &g); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateGrade(&g); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.UpdateGrade(id, &g); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Nilai berhasil diperbarui", nil)
}

func (h *Handler) DeleteGrade(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteGrade(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Nilai berhasil dihapus", nil)
}

func (h *Handler) GetAttendance(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	as, err := h.repo.GetAttendance(date)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data presensi berhasil dimuat", as)
}

func (h *Handler) CreateAttendance(w http.ResponseWriter, r *http.Request) {
	var a Attendance
	if err := validators.DecodeJSON(w, r, &a); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateAttendance(&a); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.CreateAttendance(&a); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Presensi berhasil ditambahkan", nil)
}

func (h *Handler) UpdateAttendance(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var a Attendance
	if err := validators.DecodeJSON(w, r, &a); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateAttendance(&a); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.UpdateAttendance(id, &a); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Presensi berhasil diperbarui", nil)
}

func (h *Handler) DeleteAttendance(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteAttendance(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Presensi berhasil dihapus", nil)
}

func (h *Handler) GetAttendanceSummary(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	summary, err := h.repo.GetAttendanceSummary(id)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Ringkasan presensi berhasil dimuat", summary)
}

func (h *Handler) GetMyAttendanceSummary(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses belum diizinkan", nil)
		return
	}

	summary, err := h.repo.GetAttendanceSummary(userID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Ringkasan presensi berhasil dimuat", summary)
}

func (h *Handler) GetTahfidz(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	ts, err := h.repo.GetAllTahfidz(limit, offset)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil dimuat", ts)
}

func (h *Handler) GetMyTahfidz(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses belum diizinkan", nil)
		return
	}

	ts, err := h.repo.GetTahfidzByStudent(userID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil dimuat", ts)
}

func (h *Handler) CreateTahfidz(w http.ResponseWriter, r *http.Request) {
	var t TahfidzProgress
	if err := validators.DecodeJSON(w, r, &t); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateTahfidz(&t); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.CreateTahfidz(&t); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil ditambahkan", nil)
}

func (h *Handler) UpdateTahfidz(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var t TahfidzProgress
	if err := validators.DecodeJSON(w, r, &t); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateTahfidz(&t); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	if err := h.repo.UpdateTahfidz(id, &t); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil diperbarui", nil)
}

func (h *Handler) DeleteTahfidz(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteTahfidz(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil dihapus", nil)
}

func (h *Handler) GetStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.repo.GetStudents()
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data santri berhasil dimuat", students)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	// Subjects
	GetAllSubjects() ([]Subject, error)
	CreateSubject(s *Subject) error
	DeleteSubject(id int) error
	// Grades
	GetAllGrades(semester, year string, limit, offset int) ([]Grade, error)
	GetGradesByStudent(studentID int) ([]Grade, error)
	CreateGrade(g *Grade) error
	UpdateGrade(id int, g *Grade) error
	DeleteGrade(id int) error
	// Attendance
	GetAttendance(date string) ([]Attendance, error)
	CreateAttendance(a *Attendance) error
	UpdateAttendance(id int, a *Attendance) error
	DeleteAttendance(id int) error
	GetAttendanceSummary(studentID int) (map[string]int, error)
	// Tahfidz
	GetAllTahfidz(limit, offset int) ([]TahfidzProgress, error)
	GetTahfidzByStudent(studentID int) ([]TahfidzProgress, error)
	CreateTahfidz(t *TahfidzProgress) error
	UpdateTahfidz(id int, t *TahfidzProgress) error
	DeleteTahfidz(id int) error
	GetStudents() ([]struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}, error)
}
