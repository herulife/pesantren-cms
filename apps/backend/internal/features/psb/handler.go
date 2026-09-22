package psb

import (
	"errors"
	"context"
	"database/sql"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/wanotif"
	"almaparung-api/internal/platform/whatsapp"
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
	UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL, yatimDocURL, sktmDocURL string) (*Registration, error)
	UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error)
	UpdatePaymentStatus(ctx context.Context, id int, status string, note string, actorID int) error
	UpdateStatus(ctx context.Context, id int, status string, note string, opts *StatusUpdateOptions) error
	GetMyReceipt(ctx context.Context, userID int) (*PsbPayment, error)
	AcceptToSantri(ctx context.Context, id int) (*SantriResult, error)
	FindByPublicNumber(ctx context.Context, id int) (*PublicPSBResult, error)
	Delete(ctx context.Context, id int) error
}

// PublicPSBResult adalah data minimal pengumuman PSB yang boleh diakses
// publik tanpa login, cukup dengan nomor pendaftaran (id registrasi).
type PublicPSBResult struct {
	ID            int    `json:"id"`
	No            string `json:"no"`
	FullName      string `json:"full_name"`
	Status        string `json:"status"`
	StatusLabel   string `json:"status_label"`
	ProgramChoice string `json:"program_choice"`
	Jenjang string `json:"jenjang"`
	TestDate      string `json:"test_date"`
	RejectionNote string `json:"rejection_note,omitempty"`
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
	Jenjang string `json:"jenjang"`
	Category string `json:"category"`
}

type portalDocumentsRequest struct {
	KKURL      string `json:"kk_url"`
	IjazahURL  string `json:"ijazah_url"`
	PasfotoURL string `json:"pasfoto_url"`
	YatimDocURL string `json:"yatim_doc_url"`
	SktmDocURL  string `json:"sktm_doc_url"`
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
	req.Jenjang = validators.NormalizeText(req.Jenjang)
	req.Category = validators.NormalizeText(req.Category)
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
		lower := strings.ToLower(validators.NormalizeText(req.Gender))
		valid := map[string]bool{"l": true, "p": true, "laki-laki": true, "perempuan": true, "laki": true, "pria": true, "wanita": true}
		if !valid[lower] {
			errs.Add("gender", "Jenis kelamin harus L/P atau Laki-laki/Perempuan")
		} else {
			switch lower {
			case "laki-laki", "laki", "pria":
				req.Gender = "L"
			case "perempuan", "wanita":
			req.Gender = "P"
			default:
				req.Gender = strings.ToUpper(lower)
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
	if req.Category == "" {
		req.Category = "reguler"
	}
	programLower := strings.ToLower(strings.TrimSpace(req.ProgramChoice))
	if strings.HasPrefix(programLower, "tahfidz") {
		req.ProgramChoice = "tahfidz"
	} else if programLower == "bahasa" || programLower == "bahasa arab" {
		req.ProgramChoice = "bahasa"
	} else if req.ProgramChoice == "" {
		errs.Add("program_choice", "Pilih program Tahfidz atau Bahasa")
	} else {
		errs.Add("program_choice", "Program harus Tahfidz atau Bahasa")
	}
	jl := strings.ToLower(strings.TrimSpace(req.Jenjang))
	if jl == "smp" || jl == "smk" {
		req.Jenjang = jl
	} else {
		errs.Add("jenjang", "Jenjang harus SMP atau SMK")
	}
	if req.Category != "reguler" && req.Category != "yatim" && req.Category != "dhuafa" {
		errs.Add("category", "Kategori harus Reguler, Yatim, atau Dhuafa")
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
		if errors.Is(err, sql.ErrNoRows) {
			SendSuccessResponse(w, http.StatusOK, nil, "Belum ada data PSB")
			return
		}
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memuat data PSB")
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
		Jenjang:       req.Jenjang,
		Category:      req.Category,
	})
	if err != nil {
		if errors.Is(err, ErrDuplicateNIK) {
			SendErrorResponse(w, http.StatusConflict, "NIK sudah terdaftar atas nama pendaftar lain. Periksa kembali atau hubungi panitia PSB.")
			return
		}
		if errors.Is(err, ErrYatimQuotaFull) {
			SendErrorResponse(w, http.StatusConflict, "Kuota beasiswa yatim sudah penuh (5 orang). Hubungi panitia PSB.")
			return
		}
		if errors.Is(err, ErrInvalidJenjang) {
			SendErrorResponse(w, http.StatusBadRequest, "Jenjang harus SMP atau SMK")
			return
		}
		if errors.Is(err, ErrJenjangQuotaFull) {
			SendErrorResponse(w, http.StatusConflict, "Kuota jenjang sudah penuh. Hubungi panitia PSB.")
			return
		}
		if errors.Is(err, ErrInvalidCategory) || errors.Is(err, ErrInvalidProgram) {
			SendErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, ErrEditLocked) {
			SendErrorResponse(w, http.StatusForbidden, "Biodata sudah dikunci karena masuk tahap verifikasi. Hubungi panitia PSB untuk perubahan.")
			return
		}
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
	if req.YatimDocURL != "" && !validators.ValidateMediaURL(req.YatimDocURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL surat keterangan tidak valid")
		return
	}
	if req.SktmDocURL != "" && !validators.ValidateMediaURL(req.SktmDocURL) {
		SendErrorResponse(w, http.StatusBadRequest, "URL SKTM tidak valid")
		return
	}

	reg, err := h.repo.UpdateDocumentsByUserID(r.Context(), userID, req.KKURL, req.IjazahURL, req.PasfotoURL, req.YatimDocURL, req.SktmDocURL)
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

	msg := "Bukti pembayaran berhasil dikirim dan menunggu verifikasi"
	if expRepo, ok := h.repo.(interface{ ExpectedPSBAmount(context.Context) int }); ok {
		if exp := expRepo.ExpectedPSBAmount(r.Context()); exp > 0 && reg.PaymentAmount != exp {
			msg = "Bukti diterima, tetapi nominal berbeda dari ketentuan. Panitia akan memverifikasi."
		}
	}
	SendSuccessResponse(w, http.StatusOK, reg, msg)
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

	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())

	if err := h.repo.UpdatePaymentStatus(r.Context(), id, req.PaymentStatus, req.PaymentNote, actorID); err != nil {
		if errors.Is(err, ErrInvalidTransition) {
			SendErrorResponse(w, http.StatusUnprocessableEntity, "Transisi status pembayaran tidak diizinkan")
			return
		}
		logger.LogError("Failed to update payment status for ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID, ActorRole: actorRole,
		Action: "UPDATE_PSB_PAYMENT_STATUS", Entity: "registration", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"payment_status": req.PaymentStatus},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	// WA otomatis saat pembayaran dinyatakan lunas (dicatat + dicoba kirim).
	if req.PaymentStatus == "paid" {
		if reg, err := h.repo.FindByID(r.Context(), id); err == nil {
			phone := whatsapp.NormalizePhone(firstNonEmpty(reg.ParentPhone, reg.FatherPhone, reg.MotherPhone))
			if phone != "" {
				msg := whatsapp.FormatPSBUpdate(reg.FullName, "Pembayaran pendaftaran telah terverifikasi (LUNAS)", "")
				regID := int64(id)
				if _, err := wanotif.Enqueue(r.Context(), &regID, "psb_payment", phone, msg); err != nil {
					logger.LogWarning("Gagal mencatat notifikasi WA PSB lunas ke %s: %v", phone, err)
				}
			}
		}
	}

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

	if req.Status == "accepted" || req.Status == "re_registration" {
		reg, err := h.repo.FindByID(r.Context(), id)
		if err != nil {
			SendErrorResponse(w, http.StatusNotFound, "Registration not found")
			return
		}
		if strings.ToLower(strings.TrimSpace(reg.PaymentStatus)) != "paid" {
			SendErrorResponse(w, http.StatusBadRequest, "Pembayaran pendaftaran harus lunas sebelum santri diterima / daftar ulang")
			return
		}
	}

	opts := &StatusUpdateOptions{
		TestDate:      req.TestDate,
		TestLocation:  req.TestLocation,
		TestScore:     req.TestScore,
		TestNote:      req.TestNote,
		ReRegDeadline: req.ReRegistrationDeadline,
	}
	if err := h.repo.UpdateStatus(r.Context(), id, req.Status, req.Note, opts); err != nil {
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
		After: map[string]interface{}{
			"status": req.Status, "note": req.Note,
			"test_date": req.TestDate, "test_location": req.TestLocation,
			"test_score": req.TestScore, "re_registration_deadline": req.ReRegistrationDeadline,
		},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	// Notifikasi WhatsApp otomatis untuk wali. Gagal kirim tidak menggagalkan transaksi.
	notifyPSBTransition(r, h.repo, id, req.Status, req.Note, opts)

	logger.LogInfo("Successfully updated registration ID %d to status: %s", id, req.Status)
	SendSuccessResponse(w, http.StatusOK, nil, "Status updated successfully")
}

// GetMyReceipt mengembalikan kwitansi biaya pendaftaran PSB milik wali yang
// sudah lunas. Tidak ditemukan -> 404 (belum lunas / tidak ada data).
func (h *Handler) GetMyReceipt(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		SendErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	receipt, err := h.repo.GetMyReceipt(r.Context(), userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			SendErrorResponse(w, http.StatusNotFound, "Kwitansi belum tersedia (pembayaran belum lunas)")
			return
		}
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memuat kwitansi")
		return
	}
	SendSuccessResponse(w, http.StatusOK, receipt, "")
}

func (h *Handler) AcceptToSantri(w http.ResponseWriter, r *http.Request) {
	logger := NewRequestLogger(r)
	logger.LogInfo("AcceptToSantri request started")
	defer logger.LogDuration("AcceptToSantri request completed")

	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		logger.LogWarning("Invalid ID parameter: %s", chi.URLParam(r, "id"))
		SendErrorResponse(w, http.StatusBadRequest, "Invalid ID format")
		return
	}

	santri, err := h.repo.AcceptToSantri(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotAccepted):
			SendErrorResponse(w, http.StatusBadRequest, "Pendaftar harus berstatus Diterima (accepted) lebih dulu")
			return
		case errors.Is(err, ErrPaymentNotLunas):
			SendErrorResponse(w, http.StatusBadRequest, "Pembayaran pendaftaran belum lunas")
			return
		case errors.Is(err, ErrAlreadySantri):
			SendErrorResponse(w, http.StatusConflict, "Pendaftar ini sudah menjadi santri")
			return
		case errors.Is(err, ErrYatimQuotaFull):
			SendErrorResponse(w, http.StatusConflict, "Kuota beasiswa yatim sudah penuh (5 orang)")
			return
		case errors.Is(err, ErrYatimDocMissing):
			SendErrorResponse(w, http.StatusBadRequest, "Surat keterangan kematian wajib diunggah untuk kategori yatim")
			return
		case errors.Is(err, ErrDhuafaDocMissing):
			SendErrorResponse(w, http.StatusBadRequest, "SKTM wajib diunggah untuk kategori dhuafa")
			return
		case errors.Is(err, sql.ErrNoRows):
			SendErrorResponse(w, http.StatusNotFound, "Registration not found")
			return
		}
		logger.LogError("Failed to move registration ID %d to santri: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID, ActorRole: actorRole,
		Action: "ACCEPT_PSB_TO_SANTRI", Entity: "registration", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"santri_id": santri.ID, "nis": santri.NIS, "name": santri.Name},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	logger.LogInfo("Successfully moved registration ID %d to santri (id=%d nis=%s)", id, santri.ID, santri.NIS)
	SendSuccessResponse(w, http.StatusOK, santri, "Pendaftar berhasil dipindahkan menjadi santri")
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
		if errors.Is(err, ErrAlreadySantri) {
			SendErrorResponse(w, http.StatusConflict, "Pendaftar ini sudah menjadi santri dan tidak bisa dihapus")
			return
		}
		logger.LogError("Failed to delete registration ID %d: %v", id, err)
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID, ActorRole: actorRole,
		Action: "DELETE_PSB_REGISTRATION", Entity: "registration", EntityID: strconv.Itoa(id),
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	logger.LogInfo("Successfully deleted registration ID %d", id)
	SendSuccessResponse(w, http.StatusOK, nil, "Registration deleted successfully")
}

// psbStatusLabel memetakan status registrasi ke label Indonesia yang ramah
// untuk ditampilkan ke wali santri (portal & notifikasi).
func psbStatusLabel(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "review":
		return "Berkas sedang diverifikasi panitia"
	case "tes":
		return "Diundang tes seleksi"
	case "accepted":
		return "Diterima"
	case "re_registration":
		return "Masa daftar ulang"
	case "rejected":
		return "Belum dapat diterima"
	case "santri":
		return "Sudah menjadi santri"
	default:
		return "Sedang diproses"
	}
}

// notifyPSBTransition mengirim notifikasi WhatsApp otomatis ke nomor wali saat
// status pendaftaran berubah. Gagal kirim (gateway nonaktif / nomor kosong)
// hanya dicatat di log dan TIDAK menggagalkan operasi inti.
func notifyPSBTransition(r *http.Request, repo PSBRepository, id int, status, note string, opts *StatusUpdateOptions) {
	reg, err := repo.FindByID(r.Context(), id)
	if err != nil {
		return
	}
	phone := whatsapp.NormalizePhone(firstNonEmpty(reg.ParentPhone, reg.FatherPhone, reg.MotherPhone))
	if phone == "" {
		return
	}

	detail := note
	switch status {
	case "tes":
		parts := []string{}
		if reg.TestDate != "" {
			parts = append(parts, "Jadwal: "+reg.TestDate)
		}
		if reg.TestLocation != "" {
			parts = append(parts, "Lokasi: "+reg.TestLocation)
		}
		if len(parts) > 0 {
			detail = strings.Join(parts, " • ")
		}
	case "re_registration":
		if reg.ReRegDeadline != "" {
			detail = "Batas daftar ulang: " + reg.ReRegDeadline
		}
	}

	msg := whatsapp.FormatPSBUpdate(reg.FullName, psbStatusLabel(status), detail)
	if msg == "" {
		return
	}
	regID := int64(id)
	if _, err := wanotif.Enqueue(r.Context(), &regID, "psb_status", phone, msg); err != nil {
		logger := NewRequestLogger(r)
		logger.LogWarning("Gagal mencatat notifikasi WA PSB ke %s: %v", phone, err)
	}
}

// GetPengumuman adalah endpoint publik untuk cek kelulusan PSB. Cukup dengan
// nomor pendaftaran (id registrasi) tanpa login — menampilkan data minimal.
func (h *Handler) GetPengumuman(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("no")
	if raw == "" {
		raw = r.URL.Query().Get("id")
	}
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "Nomor pendaftaran tidak valid")
		return
	}

	result, err := h.repo.FindByPublicNumber(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			SendErrorResponse(w, http.StatusNotFound, "Nomor pendaftaran tidak ditemukan")
			return
		}
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}
	SendSuccessResponse(w, http.StatusOK, result, "")
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/{id}", h.GetByID)
	r.Put("/{id}/payment-status", h.UpdatePaymentStatus)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Put("/{id}/accept-santri", h.AcceptToSantri)
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
	UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL, yatimDocURL, sktmDocURL string) (*Registration, error)
	UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error)
	UpdatePaymentStatus(ctx context.Context, id int, status string, note string, actorID int) error
	UpdateStatus(ctx context.Context, id int, status string, note string, opts *StatusUpdateOptions) error
	GetMyReceipt(ctx context.Context, userID int) (*PsbPayment, error)
	AcceptToSantri(ctx context.Context, id int) (*SantriResult, error)
	FindByPublicNumber(ctx context.Context, id int) (*PublicPSBResult, error)
	Delete(ctx context.Context, id int) error
}
