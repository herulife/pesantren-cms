package iuran

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/features/upload"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/finance"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/sysnotif"
	"almaparung-api/internal/platform/whatsapp"
	"almaparung-api/internal/validators"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func sendJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

var periodPattern = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)
var datePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func validateBill(period string, amount int) map[string][]string {
	errs := map[string][]string{}
	if !periodPattern.MatchString(period) {
		errs["period"] = []string{"Periode harus format YYYY-MM (contoh: 2026-09)"}
	}
	if amount <= 0 {
		errs["amount"] = []string{"Nominal tagihan harus lebih dari 0"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func validateDueDate(dueDate string) map[string][]string {
	if dueDate != "" && !datePattern.MatchString(dueDate) {
		return map[string][]string{"due_date": {"Tanggal jatuh tempo harus format YYYY-MM-DD"}}
	}
	return nil
}

func writeValidationError(w http.ResponseWriter, errs map[string][]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"message": "Validasi gagal",
		"errors":  errs,
	})
}

func adminID(r *http.Request) int {
	// PHASE 6: pakai helper auth tunggal (assertion lama ke map selalu gagal -> 0).
	if id, ok := auth.GetAuthenticatedUserID(r.Context()); ok {
		return id
	}
	return 0
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/bills", h.ListBills)
	r.Get("/bills/summary", h.Summary)
	r.Get("/report", h.Report)
	r.Get("/santri", h.ListSantri)
	r.Post("/bills/generate", h.Generate)
	r.Post("/bills", h.Create)
	r.Put("/bills/{id}", h.Update)
	r.Post("/bills/{id}/pay", h.Pay)
	r.Post("/bills/{id}/cancel", h.Cancel)
	r.Delete("/bills/{id}", h.Delete)
	r.Delete("/bills/by-period", h.DeleteByPeriod)
	r.Post("/bills/{id}/verify", h.Verify)
	r.Delete("/bills/by-santri", h.DeleteBySantri)
	return r
}

func (h *Handler) ListSantri(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.ListActiveSantri()
	if err != nil {
		logger.Error(r.Context(), "iuran list santri failed", logger.Field{"operation": "iuran_list_santri", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if list == nil {
		list = []IuranSantri{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar santri aktif berhasil dimuat", list)
}

func (h *Handler) ListBills(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	period := strings.TrimSpace(q.Get("period"))
	status := strings.TrimSpace(q.Get("status"))
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	if status != "" && status != "unpaid" && status != "partial" && status != "paid" {
		sendJSONResponse(w, http.StatusBadRequest, false, "Status harus unpaid, partial, atau paid", nil)
		return
	}
	name := strings.TrimSpace(q.Get("name"))
	bills, err := h.repo.ListBills(period, status, santriID, name)
	if err != nil {
		logger.Error(r.Context(), "iuran list bills failed", logger.Field{"operation": "iuran_list_bills", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if bills == nil {
		bills = []IuranBill{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar tagihan IURAN berhasil dimuat", bills)
}

func (h *Handler) Summary(w http.ResponseWriter, r *http.Request) {
	period := strings.TrimSpace(r.URL.Query().Get("period"))
	if !periodPattern.MatchString(period) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode harus format YYYY-MM (contoh: 2026-09)", nil)
		return
	}
	s, err := h.repo.Summary(period, strings.TrimSpace(r.URL.Query().Get("name")))
	if err != nil {
		logger.Error(r.Context(), "iuran summary failed", logger.Field{"operation": "iuran_summary", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Ringkasan tagihan IURAN berhasil dimuat", s)
}

func (h *Handler) Report(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	start := strings.TrimSpace(q.Get("period_start"))
	end := strings.TrimSpace(q.Get("period_end"))
	class := strings.TrimSpace(q.Get("class"))
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	if !periodPattern.MatchString(start) || !periodPattern.MatchString(end) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode awal/akhir harus format YYYY-MM (contoh: 2026-09)", nil)
		return
	}
	if end < start {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode akhir tidak boleh sebelum periode awal", nil)
		return
	}
	rows, err := h.repo.Report(start, end, class, santriID)
	if err != nil {
		logger.Error(r.Context(), "iuran report failed", logger.Field{"operation": "iuran_report", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if rows == nil {
		rows = []IuranReportRow{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Laporan tagihan per santri berhasil dimuat", rows)
}

type generateRequest struct {
	Name      string `json:"name"`
	Period    string `json:"period"`
	Amount    int    `json:"amount"`
	DueDate   string `json:"due_date"`
	Class     string `json:"class"`
	SantriIDs []int  `json:"santri_ids"`
}

func (h *Handler) Generate(w http.ResponseWriter, r *http.Request) {
	var req generateRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Period = strings.TrimSpace(req.Period)
	req.DueDate = strings.TrimSpace(req.DueDate)
	req.Class = strings.TrimSpace(req.Class)
	if req.Name == "" {
		writeValidationError(w, map[string][]string{"name": {"Nama iuran wajib diisi"}})
		return
	}
	if errs := validateBill(req.Period, req.Amount); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if errs := validateDueDate(req.DueDate); errs != nil {
		writeValidationError(w, errs)
		return
	}
	created, skipped, err := h.repo.GenerateBills(req.Name, req.Period, req.Amount, req.DueDate, req.Class, req.SantriIDs)
	if err != nil {
		logger.Error(r.Context(), "iuran generate failed", logger.Field{"operation": "iuran_generate", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "GENERATE_IURAN", fmt.Sprintf("Generate tagihan IURAN periode %s: %d baru, %d sudah ada", req.Period, created, skipped), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("Tagihan periode %s dibuat: %d baru, %d sudah ada", req.Period, created, skipped), map[string]interface{}{
		"period":  req.Period,
		"created": created,
		"skipped": skipped,
	})
}

type billRequest struct {
	SantriID int    `json:"santri_id"`
	Name     string `json:"name"`
	Period   string `json:"period"`
	Amount   int    `json:"amount"`
	DueDate  string `json:"due_date"`
	Notes    string `json:"notes"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req billRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Period = strings.TrimSpace(req.Period)
	req.DueDate = strings.TrimSpace(req.DueDate)
	if req.Name == "" {
		writeValidationError(w, map[string][]string{"name": {"Nama iuran wajib diisi"}})
		return
	}
	if req.SantriID <= 0 {
		writeValidationError(w, map[string][]string{"santri_id": {"Santri wajib dipilih"}})
		return
	}
	if errs := validateBill(req.Period, req.Amount); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if errs := validateDueDate(req.DueDate); errs != nil {
		writeValidationError(w, errs)
		return
	}
	b := &IuranBill{SantriID: req.SantriID, Name: req.Name, Period: req.Period, Amount: req.Amount, DueDate: req.DueDate, Notes: req.Notes}
	if err := h.repo.CreateBill(b); err != nil {
		if IsDuplicateError(err) {
			sendJSONResponse(w, http.StatusConflict, false, "Tagihan santri ini untuk periode tersebut sudah ada", nil)
			return
		}
		logger.Error(r.Context(), "iuran create failed", logger.Field{"operation": "iuran_create", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "CREATE_IURAN", fmt.Sprintf("Membuat tagihan IURAN santri ID %d periode %s", req.SantriID, req.Period), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan IURAN berhasil dibuat", nil)
}

type updateBillRequest struct {
	Amount  int    `json:"amount"`
	DueDate string `json:"due_date"`
	Notes   string `json:"notes"`
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	var req updateBillRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	req.DueDate = strings.TrimSpace(req.DueDate)
	if req.Amount <= 0 {
		writeValidationError(w, map[string][]string{"amount": {"Nominal tagihan harus lebih dari 0"}})
		return
	}
	if errs := validateDueDate(req.DueDate); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if err := h.repo.UpdateBill(id, req.Amount, req.DueDate, req.Notes); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan", nil)
			return
		}
		if err == errBillAmountBelowPaid {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "iuran update failed", logger.Field{"operation": "iuran_update", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "UPDATE_IURAN", fmt.Sprintf("Memperbarui tagihan IURAN ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan IURAN berhasil diperbarui", nil)
}

type payRequest struct {
	Amount int    `json:"amount"`
	Method string `json:"method"`
	PaidAt string `json:"paid_at"`
	Notes  string `json:"notes"`
}

func (h *Handler) Pay(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	var req payRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if req.Amount <= 0 {
		writeValidationError(w, map[string][]string{"amount": {"Jumlah bayar harus lebih dari 0"}})
		return
	}
	payKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	payDup := false
	var payErr error
	if payKey != "" {
		payErr = h.repo.PayBillWithKey(id, req.Amount, strings.TrimSpace(req.Method), strings.TrimSpace(req.PaidAt), req.Notes, adminID(r), payKey)
		if payErr == finance.ErrIdempotentReplay {
			payErr = nil
			payDup = true
		}
	} else {
		payErr = h.repo.PayBill(id, req.Amount, strings.TrimSpace(req.Method), strings.TrimSpace(req.PaidAt), req.Notes, adminID(r))
	}
	if err := payErr; err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan", nil)
			return
		}
		if err == errBillAlreadyPaid {
			sendJSONResponse(w, http.StatusConflict, false, "Tagihan sudah lunas", map[string]interface{}{"code": "PAYMENT_ALREADY_PAID"})
			return
		}
		if err == errBillOverpay {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "iuran pay failed", logger.Field{"operation": "iuran_pay", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "PAY_IURAN", fmt.Sprintf("Pembayaran IURAN ID %d sebesar Rp %d", id, req.Amount), r.RemoteAddr, r.UserAgent())
	h.notifyKwitansiWA(id, r, aid)
	sendJSONResponse(w, http.StatusOK, true, "Pembayaran IURAN berhasil dicatat", map[string]interface{}{"duplicate": payDup})
}

func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	if err := h.repo.CancelBill(id, adminID(r)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan atau belum ada pembayaran", nil)
			return
		}
		logger.Error(r.Context(), "iuran cancel failed", logger.Field{"operation": "iuran_cancel", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "CANCEL_IURAN", fmt.Sprintf("Membatalkan pembayaran IURAN ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Pembayaran IURAN dibatalkan, tagihan kembali belum lunas", nil)
}

func (h *Handler) DeleteByPeriod(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	name := strings.TrimSpace(q.Get("name"))
	period := strings.TrimSpace(q.Get("period"))
	if name == "" || !periodPattern.MatchString(period) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Nama iuran dan periode YYYY-MM wajib diisi", nil)
		return
	}
	n, err := h.repo.DeleteByPeriod(name, period)
	if err != nil {
		logger.Error(r.Context(), "iuran delete by period failed", logger.Field{"operation": "iuran_delete_period", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_IURAN_PERIOD", fmt.Sprintf("Hapus %d tagihan IURAN %s periode %s", n, name, period), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("%d tagihan dihapus (yang sudah dibayar tidak ikut)", n), map[string]interface{}{"deleted": n})
}

func (h *Handler) DeleteBySantri(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	name := strings.TrimSpace(q.Get("name"))
	period := strings.TrimSpace(q.Get("period"))
	if santriID <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Santri wajib dipilih", nil)
		return
	}
	n, err := h.repo.DeleteBySantri(santriID, name, period)
	if err != nil {
		logger.Error(r.Context(), "iuran delete by santri failed", logger.Field{"operation": "iuran_delete_santri", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_IURAN_SANTRI", fmt.Sprintf("Hapus %d tagihan IURAN santri ID %d", n, santriID), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("%d tagihan dihapus (yang sudah dibayar tidak ikut)", n), map[string]interface{}{"deleted": n})
}

func (h *Handler) notifyKwitansiWA(billID int, r *http.Request, aid int) {
	if !h.repo.WAKwitansiEnabled() {
		return
	}
	go func(id int) {
		info, err := h.repo.KwitansiInfoByBill(id)
		if err != nil || info == nil {
			return
		}
		phone := whatsapp.NormalizePhone(info.Phone)
		if phone == "" {
			return
		}
		msg := whatsapp.FormatKwitansi(info.SantriName, info.ReceiptNo, info.Period, info.Total)
		if err := whatsapp.SendMessage(phone, msg); err == nil {
			logger.RecordActivity(&aid, "SEND_WA_KWITANSI", "WA kwitansi "+info.ReceiptNo+" ke "+phone, r.RemoteAddr, r.UserAgent())
		}
	}(billID)
}

func (h *Handler) SubmitProof(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	uid, ok := auth.CurrentUserID(r.Context())
	if !ok {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	var req struct {
		Amount int    `json:"amount"`
		Method string `json:"method"`
		PaidAt string `json:"paid_at"`
		Proof  string `json:"proof_url"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if req.Proof == "" {
		writeValidationError(w, map[string][]string{"proof_url": {"Bukti transfer wajib diunggah"}})
		return
	}
	if err := upload.ValidateProofURL(req.Proof); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, err.Error(), nil)
		return
	}
	if err := h.repo.SubmitProof(id, uid, req.Amount, strings.TrimSpace(req.Method), strings.TrimSpace(req.PaidAt), req.Proof); err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan", nil)
			return
		}
		if err == errProofConflict {
			sendJSONResponse(w, http.StatusConflict, false, "Tagihan sedang menunggu verifikasi", map[string]interface{}{"code": "PROOF_PENDING"})
			return
		}
		if err == errBillOverpay {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "iuran proof failed", logger.Field{"operation": "iuran_proof", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	// Jilid 82: bendahara tahu ada bukti pembayaran iuran baru yang menunggu diverifikasi.
	if err := sysnotif.Emit(r.Context(), database.DB, "pembayaran", "Pembayaran iuran masuk",
		fmt.Sprintf("Tagihan #%d — Rp%d menunggu verifikasi", id, req.Amount), "/admin/iuran"); err != nil {
		logger.Warn(r.Context(), "sysnotif emit failed", logger.Field{"operation": "sysnotif_iuran_proof", "error": err.Error()})
	}
	sendJSONResponse(w, http.StatusOK, true, "Bukti pembayaran terkirim, menunggu verifikasi bendahara", nil)
}

func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	var req struct {
		Approve bool   `json:"approve"`
		Note    string `json:"note"`
	}
	_ = validators.DecodeJSON(w, r, &req)
	verifyKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	verifyDup := false
	var verifyErr error
	if verifyKey != "" {
		verifyErr = h.repo.VerifyBillWithKey(id, req.Approve, strings.TrimSpace(req.Note), adminID(r), verifyKey)
		if verifyErr == finance.ErrIdempotentReplay {
			verifyErr = nil
			verifyDup = true
		}
	} else {
		verifyErr = h.repo.VerifyBill(id, req.Approve, strings.TrimSpace(req.Note), adminID(r))
	}
	_ = verifyDup
	if err := verifyErr; err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Tidak ada pengajuan menunggu verifikasi", nil)
			return
		}
		if err == errBillOverpay {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "spp verify failed", logger.Field{"operation": "spp_verify", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if req.Approve {
		h.notifyKwitansiWA(id, r, adminID(r))
		sendJSONResponse(w, http.StatusOK, true, "Pembayaran disetujui dan dicatat", nil)
	} else {
		sendJSONResponse(w, http.StatusOK, true, "Pembayaran ditolak, tagihan dikembalikan", nil)
	}
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	if err := h.repo.DeleteBill(id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan", nil)
			return
		}
		if err == errBillHasPayments {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "iuran delete failed", logger.Field{"operation": "iuran_delete", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_IURAN", fmt.Sprintf("Menghapus tagihan IURAN ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan IURAN berhasil dihapus", nil)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	ListBills(period, status string, santriID int, name string) ([]IuranBill, error)
	GetBill(id int) (*IuranBill, error)
	CreateBill(b *IuranBill) error
	UpdateBill(id, amount int, dueDate, notes string) error
	DeleteBill(id int) error
	DeleteByPeriod(name, period string) (int64, error)
	DeleteBySantri(santriID int, name, period string) (int64, error)
	SubmitProof(billID, uid, amount int, method, paidAt, proof string) error
	VerifyBill(billID int, approve bool, note string, byID int) error
	VerifyBillWithKey(billID int, approve bool, note string, byID int, key string) error
	GenerateBills(name, period string, amount int, dueDate, class string, santriIDs []int) (created int, skipped int, err error)
	PayBill(id, amount int, method, paidAt, notes string, byID int) error
	PayBillWithKey(id, amount int, method, paidAt, notes string, byID int, key string) error
	CancelBill(id, byID int) error
	WAKwitansiEnabled() bool
	KwitansiInfoByBill(billID int) (*KwitansiInfo, error)
	Summary(period, name string) (*IuranSummary, error)
	Report(periodStart, periodEnd, class string, santriID int) ([]IuranReportRow, error)
	ListActiveSantri() ([]IuranSantri, error)
}
