package disciplines

import (
	"context"
	"darussunnah-api/internal/validators"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func parsePagination(r *http.Request) (int, int) {
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	offsetStr := r.URL.Query().Get("offset")
	offset := 0
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}
	return limit, offset
}

func (h *Handler) GetAllPoints(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("GetAllPoints request started")
	defer logger.LogDuration("GetAllPoints completed")

	limit, offset := parsePagination(r)

	points, total, err := h.repo.FindAllPoints(r.Context(), limit, offset)
	if err != nil {
		logger.LogError("Failed to fetch points: %v", err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil data poin santri")
		return
	}

	pagination := map[string]interface{}{"total": total, "limit": limit, "offset": offset}
	SendSuccessResponseWithPagination(w, http.StatusOK, points, pagination, "")
}

func (h *Handler) GetStudentPoints(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("GetStudentPoints request started")
	defer logger.LogDuration("GetStudentPoints completed")

	studentID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || studentID <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	point, err := h.repo.GetStudentPoint(r.Context(), studentID)
	if err != nil {
		logger.LogError("Failed to fetch points for %d: %v", studentID, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil data poin")
		return
	}

	if point == nil {
		// Not found, means 100 points assume
		point = &StudentPoint{
			StudentID:     studentID,
			CurrentPoints: 100,
			AcademicYear:  time.Now().Format("2006"),
		}
	}

	SendSuccessResponse(w, http.StatusOK, point, "")
}

func (h *Handler) GetAllLogs(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("GetAllLogs request started")
	defer logger.LogDuration("GetAllLogs completed")

	limit, offset := parsePagination(r)

	studentID := 0
	studentIDStr := r.URL.Query().Get("student_id")
	if studentIDStr != "" {
		if parsed, err := strconv.Atoi(studentIDStr); err == nil && parsed > 0 {
			studentID = parsed
		}
	}

	logs, total, err := h.repo.FindAllLogs(r.Context(), studentID, limit, offset)
	if err != nil {
		logger.LogError("Failed to fetch logs: %v", err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil data riwayat pelanggaran")
		return
	}

	pagination := map[string]interface{}{"total": total, "limit": limit, "offset": offset}
	SendSuccessResponseWithPagination(w, http.StatusOK, logs, pagination, "")
}

type createViolationRequest struct {
	StudentID         int    `json:"student_id"`
	ReporterName      string `json:"reporter_name"`
	ViolationCategory string `json:"violation_category"`
	ViolationDetail   string `json:"violation_detail"`
	PointsDeducted    int    `json:"points_deducted"`
	ActionTaken       string `json:"action_taken"`
}

func (h *Handler) CreateViolation(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("CreateViolation request started")
	defer logger.LogDuration("CreateViolation completed")

	var req createViolationRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		logger.LogError("Failed decoding request: %v", err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid payload format")
		return
	}

	if req.StudentID <= 0 || req.ViolationCategory == "" || req.PointsDeducted <= 0 || req.ReporterName == "" {
		SendErrorResponse(w, http.StatusBadRequest, "Semua kolom (StudentID, ReporterName, ViolationCategory, PointsDeducted) wajib diisi dengan format yang benar")
		return
	}

	err := h.repo.RecordViolation(r.Context(), ViolationLog{
		StudentID:         req.StudentID,
		ReporterName:      req.ReporterName,
		ViolationCategory: req.ViolationCategory,
		ViolationDetail:   req.ViolationDetail,
		PointsDeducted:    req.PointsDeducted,
		ActionTaken:       req.ActionTaken,
	})

	if err != nil {
		logger.LogError("Failed recording violation: %v", err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses data pelanggaran dan pengurangan poin")
		return
	}

	SendSuccessResponse(w, http.StatusCreated, nil, "Riwayat pelanggaran berhasil dicatat")
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/points", h.GetAllPoints)
	r.Get("/students/{id}/points", h.GetStudentPoints)
	r.Get("/logs", h.GetAllLogs)
	r.Post("/violations", h.CreateViolation)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	// EnsureStudentPointExists creates a 100-point entry if the student doesn't have one yet.
	EnsureStudentPointExists(ctx context.Context, studentID int, academicYear string) error
	FindAllPoints(ctx context.Context, limit, offset int) ([]StudentPoint, int, error)
	GetStudentPoint(ctx context.Context, studentID int) (*StudentPoint, error)
	FindAllLogs(ctx context.Context, studentID int, limit, offset int) ([]ViolationLog, int, error)
	RecordViolation(ctx context.Context, log ViolationLog) error
}
