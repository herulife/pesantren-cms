package psb

import (
	"errors"
	"context"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/validators"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type PSBRepository interface {
	FindAll(ctx context.Context, status string, limit, offset int) ([]Registration, int, error)
	FindByID(ctx context.Context, id int) (*Registration, error)
	FindByUserID(ctx context.Context, userID int) (*Registration, error)
	SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error)
	UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL string) (*Registration, error)
	UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error)
	UpdatePaymentStatus(ctx context.Context, id int, status string, note string) error
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

type portalPaymentRequest struct {
	PaymentProofURL string `json:"payment_proof_url"`
	PaymentAmount   int    `json:"payment_amount"`
	PaymentDate     string `json:"payment_date"`
}

func validatePortalRegistration(req *portalRegistrationRequest) validators.ValidationErrors {
	errs := validators.ValidationErrors{}
	req.FullName = validators.NormalizeText(req.FullName)
	req.Gender = validators.NormalizeText(req.Gender)
	req.NIK = validators.NormalizeText(req.NIK)
	req.BirthDate = validators.NormalizeText(req.BirthDate)
	req.ProgramChoice = validators.NormalizeText(req.ProgramChoice)
	if req.FullName == "" {
		errs.Add("full_name", "Nama lengkap wajib diisi")
	}
	if req.NIK != "" {
		matched := validators.ValidateNIK(req.NIK)
		if !matched {
			errs.Add("nik", "NIK harus 16 digit angka")
		}
	}
	if req.Gender != "" {
		g := validators.NormalizeText(req.Gender)
		low := validators.NormalizeText(g)
		// allow L/P, Laki-laki, Perempuan
		valid := map[string]bool{"l": true, "p": true, "laki-laki": true, "perempuan": true, "laki": true}
		if !valid[low] && !valid[g] {
			// also check case-insensitive
			if low != "l" && low != "p" && low != "laki-laki" && low != "perempuan" {
				errs.Add("gender", "Jenis kelamin harus L/P atau Laki-laki/Perempuan")
			}
		}
	}
	if req.BirthDate != "" && !validators.ValidateDate(req.BirthDate) {
		errs.Add("birth_date", "Tanggal lahir harus format YYYY-MM-DD")
	}
	if req.FatherPhone != "" && !validators.ValidatePhone(req.FatherPhone) {
		errs.Add("father_phone", "No HP ayah tidak valid")
	}
	if req.MotherPhone != "" && !validators.ValidatePhone(req.MotherPhone) {
		errs.Add("mother_phone", "No HP ibu tidak valid")
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
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
			if limit > 100 {
				limit = 100
			}
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
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}
	// Validate portal registration
	if errs := validatePortalRegistration(&req); len(errs) > 0 {
		SendValidationErrorResponse(w, errs)
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
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}
	if req.KKURL != "" && !validators.ValidateMediaURL(req.KKURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL KK tidak valid")
		return
	}
	if req.IjazahURL != "" && !validators.ValidateMediaURL(req.IjazahURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL Ijazah tidak valid")
		return
	}
	if req.PasfotoURL != "" && !validators.ValidateMediaURL(req.PasfotoURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL Pasfoto tidak valid")
		return
	}

	reg, err := h.repo.UpdateDocumentsByUserID(r.Context(), userID, req.KKURL, req.IjazahURL, req.PasfotoURL)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Lengkapi biodata PSB terlebih dahulu sebelum unggah dokumen")
		return
	}

	SendSuccessResponse(w, http.StatusOK, reg, "Dokumen PSB berhasil diperbarui")
}

func (h *Handler) SaveMyPayment(w http.ResponseWriter, r *http.Request) {
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

	var req portalPaymentRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}

	proofURL := strings.TrimSpace(req.PaymentProofURL)
	paymentDate := strings.TrimSpace(req.PaymentDate)
	if proofURL == "" {
		SendErrorResponse(w, http.StatusBadRequest, "Bukti pembayaran wajib diunggah")
		return
	}
	// AUDIT FIX: tolak URL non-media (mis. javascript:) agar bukti tidak bisa dipalsukan.
	if !validators.ValidateMediaURL(proofURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL bukti pembayaran tidak valid")
		return
	}
	if req.PaymentAmount <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "Nominal pembayaran wajib diisi")
		return
	}
	// AUDIT FIX: batas atas wajar agar amount raksasa tidak lolos.
	if req.PaymentAmount > 1000000000 {
		SendErrorResponse(w, http.StatusBadRequest, "Nominal pembayaran tidak wajar")
		return
	}
	if paymentDate == "" {
		paymentDate = time.Now().Format("2006-01-02")
	} else if !validators.ValidateDate(paymentDate) {
		SendErrorResponse(w, http.StatusBadRequest, "Tanggal pembayaran harus berformat YYYY-MM-DD")
		return
	}

	reg, err := h.repo.UpdatePaymentByUserID(r.Context(), userID, proofURL, req.PaymentAmount, paymentDate)
	if err != nil {
		if errors.Is(err, ErrPaymentLocked) {
			SendErrorResponse(w, http.StatusBadRequest, "Pembayaran sudah lunas, unggahan baru ditolak")
			return
		}
		SendErrorResponse(w, http.StatusBadRequest, "Lengkapi biodata PSB terlebih dahulu sebelum unggah bukti pembayaran")
		return
	}

	SendSuccessResponse(w, http.StatusOK, reg, "Bukti pembayaran berhasil dikirim dan menunggu verifikasi")
}

func (h *Handler) UpdatePaymentStatus(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("UpdatePaymentStatus request started")
	defer logger.LogDuration("UpdatePaymentStatus request completed")

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid ID format")
		return
	}
	if id <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "ID must be a positive integer")
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var req validators.RegistrationPaymentStatusRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if validationErrs := validators.ValidateRegistrationPaymentStatusRequest(&req); len(validationErrs) > 0 {
		SendErrorResponse(w, http.StatusBadRequest, validationErrs["payment_status"])
		return
	}

	if err := h.repo.UpdatePaymentStatus(r.Context(), id, req.PaymentStatus, req.PaymentNote); err != nil {
		if errors.Is(err, ErrInvalidTransition) {
			SendErrorResponse(w, http.StatusUnprocessableEntity, "Transisi status pembayaran tidak diizinkan")
			return
		}
		logger.LogError("Failed to update payment status for ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID, ActorRole: actorRole,
		Action: "UPDATE_PSB_PAYMENT_STATUS", Entity: "registration", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"payment_status": req.PaymentStatus},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	SendSuccessResponse(w, http.StatusOK, nil, "Status pembayaran berhasil diperbarui")
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

	if req.Status == "accepted" {
		reg, err := h.repo.FindByID(r.Context(), id)
		if err != nil {
			SendErrorResponse(w, http.StatusNotFound, "Registration not found")
			return
		}
		if strings.ToLower(strings.TrimSpace(reg.PaymentStatus)) != "paid" {
			SendErrorResponse(w, http.StatusBadRequest, "Pembayaran pendaftaran harus lunas sebelum santri diterima")
			return
		}
	}

	if err := h.repo.UpdateStatus(r.Context(), id, req.Status); err != nil {
		if errors.Is(err, ErrInvalidTransition) {
			SendErrorResponse(w, http.StatusUnprocessableEntity, "Transisi status tidak diizinkan")
			return
		}
		logger.LogError("Failed to update status for ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}
	actorID2, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole2, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID2, ActorRole: actorRole2,
		Action: "UPDATE_PSB_STATUS", Entity: "registration", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"status": req.Status},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})

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
	r.Get("/{id}", h.GetByID)
	r.Put("/{id}/payment-status", h.UpdatePaymentStatus)
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
	UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error)
	UpdatePaymentStatus(ctx context.Context, id int, status string, note string) error
	UpdateStatus(ctx context.Context, id int, status string) error
	Delete(ctx context.Context, id int) error
}
