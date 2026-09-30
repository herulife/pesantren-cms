package academics

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/scope"
	"almaparung-api/internal/platform/weight"
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
	r.Get("/report-per-guru", h.ReportPerGuru) // ?semester=&year=
	r.Get("/grades/student/{id}", h.GetGradesByStudent)
	r.Post("/grades", h.CreateGrade)
	r.Put("/grades/{id}", h.UpdateGrade)
	r.Delete("/grades/{id}", h.DeleteGrade)
	// Bobot komponen nilai per mapel (UTS/UAS/Tugas/UH)
	r.Get("/grade-weights", h.GetGradeWeights)
	r.Put("/grade-weights", h.UpdateGradeWeights)
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
	// Hadis Arbain (42 hadis Arbain Imam Nawawi)
	r.Get("/arbain/reference", h.GetArbainReference)
	r.Get("/arbain", h.GetArbainProgress)
	r.Get("/arbain/me", h.GetMyArbainProgress)
	r.Post("/arbain", h.CreateArbainProgress)
	r.Put("/arbain/{id}", h.UpdateArbainProgress)
	r.Delete("/arbain/{id}", h.DeleteArbainProgress)
	// Students list
	r.Get("/students", h.GetStudents)
	r.Get("/grades/me", h.GetMyGrades)
	// KKM (ambang ketuntasan) — dapat diubah admin
	r.Get("/kkm", h.GetKKM)
	r.Put("/kkm", h.UpdateKKM)
	return r
}

// GetKKM mengembalikan ambang KKM akademik.
func (h *Handler) GetKKM(w http.ResponseWriter, r *http.Request) {
	k := weight.KKM()
	if v := academicKKMFromDB(); v > 0 {
		k = v
	}
	writeJSONResponse(w, http.StatusOK, true, "KKM akademik", map[string]int{"kkm": k})
}

// UpdateKKM menyimpan ambang KKM (hanya admin) dan menyegarkan nilai runtime.
func (h *Handler) UpdateKKM(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !weight.IsFullAccessRole(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mengubah KKM", nil)
		return
	}
	var req struct {
		KKM int `json:"kkm"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if req.KKM < 1 || req.KKM > 99 {
		writeJSONResponse(w, http.StatusBadRequest, false, "KKM harus 1-99", nil)
		return
	}
	if _, err := database.DB.Exec(`INSERT INTO settings (key, value, description) VALUES ('academic_kkm', ?, 'Ambang KKM akademik') ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`, strconv.Itoa(req.KKM)); err != nil {
		logger.Error(r.Context(), "update kkm failed", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan KKM", nil)
		return
	}
	weight.SetKKM(req.KKM)
	writeJSONResponse(w, http.StatusOK, true, "KKM tersimpan", map[string]int{"kkm": req.KKM})
}

// academicKKMFromDB membaca KKM tersimpan (0 bila belum ada).
func academicKKMFromDB() int {
	var v string
	if err := database.DB.QueryRow(`SELECT value FROM settings WHERE key='academic_kkm'`).Scan(&v); err != nil {
		return 0
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0
	}
	return n
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
	if g.UHScore < 0 || g.UHScore > 100 {
		errs["uh_score"] = []string{"Nilai ulangan harian harus 0-100"}
	}
	validSemesters := map[string]bool{"1": true, "2": true, "ganjil": true, "genap": true}
	if g.Semester != "" && !validSemesters[strings.ToLower(g.Semester)] {
		errs["semester"] = []string{"Semester harus 1 atau 2"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func normalizeSemester(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "1", "ganjil":
		return "1"
	case "2", "genap":
		return "2"
	default:
		return s
	}
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mengelola mapel", nil)
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mengelola mapel", nil)
		return
	}
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Ustadz tidak berwenang melihat nilai mapel", nil)
		return
	}
	var gs []Grade
	var err error
	if scope.FullAccess(role) || scope.ReadOnly(role) {
		gs, err = h.repo.GetAllGrades(semester, year, limit, offset)
	} else {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			gs, err = h.repo.GetScopedGrades(semester, year, sc.SubjectIDs, sc.Classes, limit, offset)
		}
	}
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data nilai berhasil dimuat", gs)
}

func (h *Handler) ReportPerGuru(w http.ResponseWriter, r *http.Request) {
	semester := r.URL.Query().Get("semester")
	year := r.URL.Query().Get("year")
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "wali_kelas" || role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang melihat laporan ini", nil)
		return
	}
	var rows []PerGuruRow
	var err error
	if role == "guru" {
		rows, err = h.repo.ReportPerGuruFor(semester, year, uid)
	} else {
		rows, err = h.repo.ReportPerGuru(semester, year)
	}
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Laporan per guru berhasil dimuat", rows)
}

func (h *Handler) GetGradesByStudent(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Ustadz tidak berwenang melihat nilai mapel", nil)
		return
	}
	gs, err := h.repo.GetGradesByStudent(id)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if role == "guru" {
		sc, scErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil {
			writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
			return
		}
		var out []Grade
		for _, g := range gs {
			if sc.HasSubject(g.SubjectID) {
				out = append(out, g)
			}
		}
		gs = out
	} else if role == "wali_kelas" {
		className, scErr := scope.StudentClass(database.DB, id)
		sc, resErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || resErr != nil || !sc.HasClass(className) {
			writeJSONResponse(w, http.StatusForbidden, false, "Hanya dapat melihat nilai santri kelas sendiri", nil)
			return
		}
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
	g.Semester = normalizeSemester(g.Semester)
	if errs := validateGrade(&g); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if scope.ReadOnly(role) || role == "wali_kelas" || role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang menambah nilai", nil)
		return
	}
	if role == "guru" {
		sc, scErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || !sc.HasSubject(g.SubjectID) {
			writeJSONResponse(w, http.StatusForbidden, false, "Hanya dapat mengisi nilai mapel yang diampu", nil)
			return
		}
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
	g.Semester = normalizeSemester(g.Semester)
	if errs := validateGrade(&g); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if scope.ReadOnly(role) || role == "wali_kelas" || role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah nilai", nil)
		return
	}
	if role == "guru" {
		subjID, subjErr := scope.GradeSubjectID(database.DB, id)
		sc, scErr := scope.Resolve(database.DB, uid, role)
		if subjErr != nil {
			writeJSONResponse(w, http.StatusNotFound, false, "Nilai tidak ditemukan", nil)
			return
		}
		if scErr != nil || !sc.HasSubject(subjID) {
			writeJSONResponse(w, http.StatusForbidden, false, "Hanya dapat mengubah nilai mapel yang diampu", nil)
			return
		}
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if scope.ReadOnly(role) || role == "wali_kelas" || role == "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang menghapus nilai", nil)
		return
	}
	if role == "guru" {
		subjID, subjErr := scope.GradeSubjectID(database.DB, id)
		sc, scErr := scope.Resolve(database.DB, uid, role)
		if subjErr != nil {
			writeJSONResponse(w, http.StatusNotFound, false, "Nilai tidak ditemukan", nil)
			return
		}
		if scErr != nil || !sc.HasSubject(subjID) {
			writeJSONResponse(w, http.StatusForbidden, false, "Hanya dapat menghapus nilai mapel yang diampu", nil)
			return
		}
	}
	if err := h.repo.DeleteGrade(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Nilai berhasil dihapus", nil)
}

// GetGradeWeights mengembalikan bobot komponen nilai per mapel.
func (h *Handler) GetGradeWeights(w http.ResponseWriter, r *http.Request) {
	weights, err := h.repo.GetAllSubjectWeights()
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Bobot nilai berhasil dimuat", weights)
}

// UpdateGradeWeights menyimpan bobot komponen nilai per mapel (admin).
func (h *Handler) UpdateGradeWeights(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !weight.IsFullAccessRole(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mengubah bobot nilai", nil)
		return
	}
	var req struct {
		Items []SubjectWeight `json:"items"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Permintaan tidak valid", nil)
		return
	}
	if len(req.Items) == 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "Daftar bobot tidak boleh kosong", nil)
		return
	}
	for _, item := range req.Items {
		gw := weight.GradeWeights{UTS: item.UtsWeight, UAS: item.UasWeight, Task: item.TaskWeight, UH: item.UhWeight}
		if err := weight.ValidateGradeWeights(gw); err != nil {
			writeJSONResponse(w, http.StatusBadRequest, false, "Bobot mapel "+strings.TrimSpace(item.SubjectName)+" tidak valid: "+err.Error(), nil)
			return
		}
	}
	if err := h.repo.UpsertSubjectWeights(req.Items); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Bobot nilai berhasil disimpan", nil)
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "guru" {
		writeJSONResponse(w, http.StatusForbidden, false, "Guru tidak berwenang melihat tahfidz", nil)
		return
	}
	var ts []TahfidzProgress
	var err error
	if role == "wali_kelas" {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			ts, err = h.repo.GetScopedTahfidz(sc.Classes, limit, offset)
		}
	} else {
		ts, err = h.repo.GetAllTahfidz(limit, offset)
	}
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) && role != "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian tahfidz hanya oleh ustadz", nil)
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) && role != "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian tahfidz hanya oleh ustadz", nil)
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
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) && role != "ustadz" {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian tahfidz hanya oleh ustadz", nil)
		return
	}
	if err := h.repo.DeleteTahfidz(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data tahfidz berhasil dihapus", nil)
}

func (h *Handler) GetStudents(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	var students interface{}
	var err error
	if role == "wali_kelas" {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			students, err = h.repo.GetStudentsByClasses(sc.Classes)
		}
	} else {
		students, err = h.repo.GetStudents()
	}
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
	GetSubjectWeights(subjectID int) (weight.GradeWeights, error)
	GetAllSubjectWeights() ([]SubjectWeight, error)
	UpsertSubjectWeights(items []SubjectWeight) error
	ReportPerGuru(semester, year string) ([]PerGuruRow, error)
	GetScopedGrades(semester, year string, subjectIDs []int, classes []string, limit, offset int) ([]Grade, error)
	ReportPerGuruFor(semester, year string, teacherID int) ([]PerGuruRow, error)
	GetScopedTahfidz(classes []string, limit, offset int) ([]TahfidzProgress, error)
	// Hadis Arbain
	GetAllArbainProgress(limit, offset int) ([]ArbainProgress, error)
	GetScopedArbainProgress(classes []string, limit, offset int) ([]ArbainProgress, error)
	GetArbainProgressByStudent(studentID int) ([]ArbainProgress, error)
	GetArbainSummaryByStudent(studentID int) (*ArbainSummary, error)
	CreateArbainProgress(p *ArbainProgress) error
	UpdateArbainProgress(id int, p *ArbainProgress) error
	DeleteArbainProgress(id int) error
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
	GetStudentsByClasses(classes []string) ([]struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}, error)
}
