package exams

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/validators"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetAvailableExams(w http.ResponseWriter, r *http.Request) {
	exams, err := h.repo.GetAvailableExams()
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat daftar ujian", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar ujian berhasil dimuat", exams)
}

func (h *Handler) GetQuestions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	examID, _ := strconv.Atoi(idStr)

	// Determine if student or admin (to hide/show keys)
	role, _ := currentUserRole(r)
	hideAnswers := (role == "user")
	if hideAnswers {
		// Enrollment gate: user wajib sudah StartSession untuk ujian ini.
		studentID, _ := currentUserID(r)
		if studentID <= 0 || !h.repo.HasSession(studentID, examID) {
			writeJSONResponse(w, http.StatusForbidden, false, "Mulai sesi ujian terlebih dahulu", nil)
			return
		}
	}

	questions, err := h.repo.GetExamQuestions(examID, hideAnswers)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat soal", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar soal berhasil dimuat", questions)
}

func (h *Handler) StartSession(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ExamID int `json:"exam_id"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}

	studentID, _ := currentUserID(r)
	sessionID, err := h.repo.StartSession(studentID, body.ExamID)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memulai sesi ujian", nil)
		return
	}

	writeJSONResponse(w, http.StatusOK, true, "Sesi ujian dimulai", map[string]int{"session_id": sessionID})
}

func (h *Handler) SubmitAnswer(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SessionID      int `json:"session_id"`
		QuestionID     int `json:"question_id"`
		SelectedAnswer int `json:"selected_answer"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses ditolak", nil)
		return
	}
	// IDOR check: session must belong to caller
	if !h.repo.IsSessionOwnedBy(body.SessionID, userID) {
		writeJSONResponse(w, http.StatusForbidden, false, "Sesi tidak milik Anda", nil)
		return
	}

	err := h.repo.SubmitAnswer(body.SessionID, body.QuestionID, body.SelectedAnswer)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan jawaban", nil)
		return
	}

	writeJSONResponse(w, http.StatusOK, true, "Jawaban tersimpan", nil)
}

func (h *Handler) FinishSession(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SessionID int `json:"session_id"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses ditolak", nil)
		return
	}
	if !h.repo.IsSessionOwnedBy(body.SessionID, userID) {
		writeJSONResponse(w, http.StatusForbidden, false, "Sesi tidak milik Anda", nil)
		return
	}
	score, err := h.repo.FinishSession(body.SessionID)
	if err != nil {
		if errors.Is(err, ErrSessionFinished) {
			writeJSONResponse(w, http.StatusConflict, false, "Ujian sudah diakhiri sebelumnya", nil)
			return
		}
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal mengakhiri ujian", nil)
		return
	}

	writeJSONResponse(w, http.StatusOK, true, "Ujian selesai", map[string]float64{"score": score})
}

// Admin Ops
func (h *Handler) CreateExam(w http.ResponseWriter, r *http.Request) {
	var e Exam
	if err := validators.DecodeJSON(w, r, &e); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	e.Semester = validators.NormalizeSemester(e.Semester)
	if errs := validateExam(&e); len(errs) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	if err := h.repo.CreateExam(&e); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal membuat ujian", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Ujian berhasil dibuat", nil)
}

func (h *Handler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	var q Question
	if err := validators.DecodeJSON(w, r, &q); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if errs := validateQuestion(&q); len(errs) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}

	if err := h.repo.AddQuestion(&q); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal menambahkan soal", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Soal berhasil ditambahkan", nil)
}

func validateExam(e *Exam) map[string]string {
	errs := map[string]string{}
	if len(e.Title) < 3 {
		errs["title"] = "Judul minimal 3 karakter"
	}
	if e.SubjectID <= 0 {
		errs["subject_id"] = "Mata pelajaran wajib dipilih"
	}
	if e.DurationMinutes <= 0 {
		errs["duration"] = "Durasi harus >0 menit"
	}
	if e.Semester != "" && e.Semester != "1" && e.Semester != "2" {
		errs["semester"] = "Semester harus ganjil/genap"
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

// AUDIT FIX: kunci jawaban harus menunjuk opsi yang ada; poin 0-100.
func validateQuestion(q *Question) map[string]string {
	errs := map[string]string{}
	if q.ExamID <= 0 {
		errs["exam_id"] = "Ujian wajib dipilih"
	}
	if len(q.QuestionText) < 3 {
		errs["question_text"] = "Teks soal minimal 3 karakter"
	}
	if len(q.Options) < 2 {
		errs["options"] = "Minimal 2 opsi jawaban"
	}
	if q.CorrectAnswerKey < 0 || q.CorrectAnswerKey >= len(q.Options) {
		errs["correct_answer_key"] = "Kunci jawaban di luar rentang opsi"
	}
	if q.Points < 0 || q.Points > 100 {
		errs["points"] = "Poin harus 0-100"
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func currentUserID(r *http.Request) (int, bool) {
	return auth.CurrentUserID(r.Context())
}

func currentUserRole(r *http.Request) (string, bool) {
	claims, ok := r.Context().Value(auth.UserContextKey).(jwt.MapClaims)
	if !ok {
		return "", false
	}
	role, ok := claims["role"].(string)
	return role, ok
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

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	// Admin: CRUD for Exams
	CreateExam(e *Exam) error
	AddQuestion(q *Question) error
	// Student: Get Exams
	GetAvailableExams() ([]Exam, error)
	GetExamQuestions(examID int, hideAnswers bool) ([]Question, error)
	// Student: Session Management
	StartSession(studentID, examID int) (int, error)
	SubmitAnswer(sessionID, questionID, selectedAnswer int) error
	FinishSession(sessionID int) (float64, error)
	IsSessionOwnedBy(sessionID, userID int) bool
	HasSession(studentID, examID int) bool
}
