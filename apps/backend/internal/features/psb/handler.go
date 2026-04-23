package psb

import (
	"context"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type PSBRepository interface {
	FindAll(ctx context.Context, status string, limit, offset int) ([]Registration, int, error)
	FindByID(ctx context.Context, id int) (*Registration, error)
	FindByUserID(ctx context.Context, userID int) (*Registration, error)
	SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error)
	UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL string) (*Registration, error)
	UpdateStatus(ctx context.Context, id int, status string) error
	Delete(ctx context.Context, id int) error
}

type Handler struct {
	repo PSBRepository
}

func NewHandler(repo PSBRepository) *Handler {
	return &Handler{repo: repo}
}

func currentUserID(r *http.Request) (int, bool) {
	return auth.CurrentUserID(r.Context())
}

type portalRegistrationRequest struct {
	FullName      string `json:"full_name"`
	Nickname      string `json:"nickname"`
	Gender        string `json:"gender"`
	NIK           string `json:"nik"`
	BirthPlace    string `json:"birth_place"`
	BirthDate     string `json:"birth_date"`
	Address       string `json:"address"`
	FatherName    string `json:"father_name"`
	FatherJob     string `json:"father_job"`
	FatherPhone   string `json:"father_phone"`
	MotherName    string `json:"mother_name"`
	MotherJob     string `json:"mother_job"`
	MotherPhone   string `json:"mother_phone"`
	SchoolOrigin  string `json:"school_origin"`
	ProgramChoice string `json:"program_choice"`
}

type portalDocumentsRequest struct {
	KKURL      string `json:"kk_url"`
	IjazahURL  string `json:"ijazah_url"`
	PasfotoURL string `json:"pasfoto_url"`
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("GetAll request started")
	defer logger.LogDuration("GetAll request completed")

	status := r.URL.Query().Get("status")

	// Validasi limit
	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err != nil {
			logger.LogWarning("Invalid limit parameter: %s, using default (20)", limitStr)
		} else if parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Validasi offset
	offsetStr := r.URL.Query().Get("offset")
	offset := 0 // default
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err != nil {
			logger.LogWarning("Invalid offset parameter: %s, using default (0)", offsetStr)
		} else if parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	regs, total, err := h.repo.FindAll(r.Context(), status, limit, offset)
	if err != nil {
		logger.LogError("Failed to fetch registrations: %v", err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	logger.LogInfo("Successfully fetched %d registrations", len(regs))
	pagination := map[string]interface{}{
		"total":  total,
		"limit":  limit,
		"offset": offset,
	}
	SendSuccessResponseWithPagination(w, http.StatusOK, regs, pagination, "")
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("GetByID request started")
	defer logger.LogDuration("GetByID request completed")

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		logger.LogWarning("Invalid ID parameter: %s, error: %v", chi.URLParam(r, "id"), err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	if id <= 0 {
		logger.LogWarning("Invalid ID value: %d (must be positive)", id)
		SendErrorResponse(w, http.StatusBadRequest, "ID must be a positive integer")
		return
	}

	reg, err := h.repo.FindByID(r.Context(), id)
	if err != nil {
		logger.LogError("Registration not found or error occurred: %v", err)
		SendErrorResponse(w, http.StatusNotFound, "Registration not found")
		return
	}

	logger.LogInfo("Successfully retrieved registration ID: %d", id)
	SendSuccessResponse(w, http.StatusOK, reg, "")
}

func (h *Handler) GetMine(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		SendErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	reg, err := h.repo.FindByUserID(r.Context(), userID)
	if err != nil {
		SendSuccessResponse(w, http.StatusOK, nil, "Belum ada data PSB")
		return
	}

	SendSuccessResponse(w, http.StatusOK, reg, "")
}

func (h *Handler) SaveMine(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		SendErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var req portalRegistrationRequest
	if err := json.Unmarshal(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	reg, err := h.repo.SaveByUserID(r.Context(), userID, Registration{
		FullName:      req.FullName,
		Nickname:      req.Nickname,
		Gender:        req.Gender,
		NIK:           req.NIK,
		BirthPlace:    req.BirthPlace,
		BirthDate:     req.BirthDate,
		Address:       req.Address,
		FatherName:    req.FatherName,
		FatherJob:     req.FatherJob,
		FatherPhone:   req.FatherPhone,
		MotherName:    req.MotherName,
		MotherJob:     req.MotherJob,
		MotherPhone:   req.MotherPhone,
		SchoolOrigin:  req.SchoolOrigin,
		ProgramChoice: req.ProgramChoice,
	})
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal menyimpan biodata PSB")
		return
	}

	SendSuccessResponse(w, http.StatusOK, reg, "Biodata PSB berhasil disimpan")
}

func (h *Handler) SaveMyDocuments(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		SendErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var req portalDocumentsRequest
	if err := json.Unmarshal(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	reg, err := h.repo.UpdateDocumentsByUserID(r.Context(), userID, req.KKURL, req.IjazahURL, req.PasfotoURL)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Lengkapi biodata PSB terlebih dahulu sebelum unggah dokumen")
		return
	}

	SendSuccessResponse(w, http.StatusOK, reg, "Dokumen PSB berhasil diperbarui")
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("UpdateStatus request started")
	defer logger.LogDuration("UpdateStatus request completed")

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		logger.LogWarning("Invalid ID parameter: %s, error: %v", chi.URLParam(r, "id"), err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	if id <= 0 {
		logger.LogWarning("Invalid ID value: %d (must be positive)", id)
		SendErrorResponse(w, http.StatusBadRequest, "ID must be a positive integer")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		logger.LogWarning("Failed to read request body: %v", err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var req validators.RegistrationStatusRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		logger.LogWarning("Failed to decode request body: %v", err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if validationErrs := validators.ValidateRegistrationStatusRequest(&req); len(validationErrs) > 0 {
		logger.LogWarning("Registration status validation failed: %+v", validationErrs)
		SendErrorResponse(w, http.StatusBadRequest, validationErrs["status"])
		return
	}

	if err := h.repo.UpdateStatus(r.Context(), id, req.Status); err != nil {
		logger.LogError("Failed to update status for ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	logger.LogInfo("Successfully updated registration ID %d to status: %s", id, req.Status)
	SendSuccessResponse(w, http.StatusOK, nil, "Status updated successfully")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("Delete request started")
	defer logger.LogDuration("Delete request completed")

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		logger.LogWarning("Invalid ID parameter: %s, error: %v", chi.URLParam(r, "id"), err)
		SendErrorResponse(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	if id <= 0 {
		logger.LogWarning("Invalid ID value: %d (must be positive)", id)
		SendErrorResponse(w, http.StatusBadRequest, "ID must be a positive integer")
		return
	}

	if _, err := h.repo.FindByID(r.Context(), id); err != nil {
		logger.LogError("Registration not found before delete: %v", err)
		SendErrorResponse(w, http.StatusNotFound, "Registration not found")
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		logger.LogError("Failed to delete registration ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	logger.LogInfo("Successfully deleted registration ID %d", id)
	SendSuccessResponse(w, http.StatusOK, nil, "Registration deleted successfully")
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/me", h.GetMine)
	r.Put("/me", h.SaveMine)
	r.Put("/me/documents", h.SaveMyDocuments)
	r.Get("/{id}", h.GetByID)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Delete("/{id}", h.Delete)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(ctx context.Context, status string, limit, offset int) ([]Registration, int, error)
	FindByID(ctx context.Context, id int) (*Registration, error)
	FindByUserID(ctx context.Context, userID int) (*Registration, error)
	SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error)
	UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL string) (*Registration, error)
	UpdateStatus(ctx context.Context, id int, status string) error
	Delete(ctx context.Context, id int) error
}
