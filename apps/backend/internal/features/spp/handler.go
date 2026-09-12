package spp

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
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
	if claims, ok := r.Context().Value(auth.UserContextKey).(map[string]interface{}); ok {
		if id, ok := claims["id"].(float64); ok {
			return int(id)
		}
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
	r.Delete("/bills/by-santri", h.DeleteBySantri)
	r.Get("/combined-report", h.CombinedReport)
	return r
}

func (h *Handler) ListSantri(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.ListActiveSantri()
	if err != nil {
		logger.Error(r.Context(), "spp list santri failed", logger.Field{"operation": "spp_list_santri", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if list == nil {
		list = []SppSantri{}
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
	bills, err := h.repo.ListBills(period, status, santriID)
	if err != nil {
		logger.Error(r.Context(), "spp list bills failed", logger.Field{"operation": "spp_list_bills", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if bills == nil {
		bills = []SppBill{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar tagihan SPP berhasil dimuat", bills)
}

func (h *Handler) Summary(w http.ResponseWriter, r *http.Request) {
	period := strings.TrimSpace(r.URL.Query().Get("period"))
	if !periodPattern.MatchString(period) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode harus format YYYY-MM (contoh: 2026-09)", nil)
		return
	}
	s, err := h.repo.Summary(period)
	if err != nil {
		logger.Error(r.Context(), "spp summary failed", logger.Field{"operation": "spp_summary", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Ringkasan tagihan SPP berhasil dimuat", s)
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
		logger.Error(r.Context(), "spp report failed", logger.Field{"operation": "spp_report", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if rows == nil {
		rows = []SppReportRow{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Laporan tagihan per santri berhasil dimuat", rows)
}

type generateRequest struct {
	Period    string `json:"period"`
	PeriodEnd string `json:"period_end"`
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
	req.Period = strings.TrimSpace(req.Period)
	req.PeriodEnd = strings.TrimSpace(req.PeriodEnd)
	req.DueDate = strings.TrimSpace(req.DueDate)
	req.Class = strings.TrimSpace(req.Class)
	if errs := validateBill(req.Period, req.Amount); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if errs := validateDueDate(req.DueDate); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if req.PeriodEnd != "" && (!periodPattern.MatchString(req.PeriodEnd) || req.PeriodEnd < req.Period) {
		writeValidationError(w, map[string][]string{"period_end": {"Akhir periode harus >= awal periode (YYYY-MM)"}})
		return
	}
	created, skipped, err := h.repo.GenerateBills(req.Period, req.PeriodEnd, req.Amount, req.DueDate, req.Class, req.SantriIDs)
	if err != nil {
		logger.Error(r.Context(), "spp generate failed", logger.Field{"operation": "spp_generate", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "GENERATE_SPP", fmt.Sprintf("Generate tagihan SPP periode %s: %d baru, %d sudah ada", req.Period, created, skipped), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("Tagihan periode %s dibuat: %d baru, %d sudah ada", req.Period, created, skipped), map[string]interface{}{
		"period":  req.Period,
		"created": created,
		"skipped": skipped,
	})
}

type billRequest struct {
	SantriID int    `json:"santri_id"`
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
	req.Period = strings.TrimSpace(req.Period)
	req.DueDate = strings.TrimSpace(req.DueDate)
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
	b := &SppBill{SantriID: req.SantriID, Period: req.Period, Amount: req.Amount, DueDate: req.DueDate, Notes: req.Notes}
	if err := h.repo.CreateBill(b); err != nil {
		if IsDuplicateError(err) {
			sendJSONResponse(w, http.StatusConflict, false, "Tagihan santri ini untuk periode tersebut sudah ada", nil)
			return
		}
		logger.Error(r.Context(), "spp create failed", logger.Field{"operation": "spp_create", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "CREATE_SPP", fmt.Sprintf("Membuat tagihan SPP santri ID %d periode %s", req.SantriID, req.Period), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan SPP berhasil dibuat", nil)
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
		logger.Error(r.Context(), "spp update failed", logger.Field{"operation": "spp_update", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "UPDATE_SPP", fmt.Sprintf("Memperbarui tagihan SPP ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan SPP berhasil diperbarui", nil)
}

type payRequest struct {
	Amount  int    `json:"amount"`
	Method  string `json:"method"`
	PaidAt  string `json:"paid_at"`
	Notes   string `json:"notes"`
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
	if err := h.repo.PayBill(id, req.Amount, strings.TrimSpace(req.Method), strings.TrimSpace(req.PaidAt), req.Notes, adminID(r)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan", nil)
			return
		}
		if err == errBillAlreadyPaid || err == errBillOverpay {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "spp pay failed", logger.Field{"operation": "spp_pay", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "PAY_SPP", fmt.Sprintf("Pembayaran SPP ID %d sebesar Rp %d", id, req.Amount), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Pembayaran SPP berhasil dicatat", nil)
}

func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID tagihan tidak valid", nil)
		return
	}
	if err := h.repo.CancelBill(id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Tagihan tidak ditemukan atau belum ada pembayaran", nil)
			return
		}
		logger.Error(r.Context(), "spp cancel failed", logger.Field{"operation": "spp_cancel", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "CANCEL_SPP", fmt.Sprintf("Membatalkan pembayaran SPP ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Pembayaran SPP dibatalkan, tagihan kembali belum lunas", nil)
}

func (h *Handler) DeleteByPeriod(w http.ResponseWriter, r *http.Request) {
	period := strings.TrimSpace(r.URL.Query().Get("period"))
	if !periodPattern.MatchString(period) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode harus format YYYY-MM", nil)
		return
	}
	n, err := h.repo.DeleteByPeriod(period)
	if err != nil {
		logger.Error(r.Context(), "spp delete by period failed", logger.Field{"operation": "spp_delete_period", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_SPP_PERIOD", fmt.Sprintf("Hapus %d tagihan SPP periode %s", n, period), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("%d tagihan dihapus (yang sudah dibayar tidak ikut)", n), map[string]interface{}{"deleted": n})
}

func (h *Handler) DeleteBySantri(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	period := strings.TrimSpace(q.Get("period"))
	if santriID <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Santri wajib dipilih", nil)
		return
	}
	if period != "" && !periodPattern.MatchString(period) {
		sendJSONResponse(w, http.StatusBadRequest, false, "Periode harus format YYYY-MM", nil)
		return
	}
	n, err := h.repo.DeleteBySantri(santriID, period)
	if err != nil {
		logger.Error(r.Context(), "spp delete by santri failed", logger.Field{"operation": "spp_delete_santri", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_SPP_SANTRI", fmt.Sprintf("Hapus %d tagihan SPP santri ID %d", n, santriID), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, fmt.Sprintf("%d tagihan dihapus (yang sudah dibayar tidak ikut)", n), map[string]interface{}{"deleted": n})
}

func (h *Handler) CombinedReport(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	start := strings.TrimSpace(q.Get("period_start"))
	end := strings.TrimSpace(q.Get("period_end"))
	if !periodPattern.MatchString(start) || !periodPattern.MatchString(end) || end < start {
		sendJSONResponse(w, http.StatusBadRequest, false, "Rentang periode tidak valid (YYYY-MM s/d YYYY-MM)", nil)
		return
	}
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	rows, err := h.repo.CombinedReport(start, end, strings.TrimSpace(q.Get("class")), santriID)
	if err != nil {
		logger.Error(r.Context(), "spp combined report failed", logger.Field{"operation": "spp_combined_report", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if rows == nil {
		rows = []CombinedRow{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Laporan gabungan berhasil dimuat", rows)
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
		logger.Error(r.Context(), "spp delete failed", logger.Field{"operation": "spp_delete", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	aid := adminID(r)
	logger.RecordActivity(&aid, "DELETE_SPP", fmt.Sprintf("Menghapus tagihan SPP ID %d", id), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Tagihan SPP berhasil dihapus", nil)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	ListBills(period, status string, santriID int) ([]SppBill, error)
	GetBill(id int) (*SppBill, error)
	CreateBill(b *SppBill) error
	UpdateBill(id, amount int, dueDate, notes string) error
	DeleteBill(id int) error
	DeleteByPeriod(period string) (int64, error)
	DeleteBySantri(santriID int, period string) (int64, error)
	CombinedReport(periodStart, periodEnd, class string, santriID int) ([]CombinedRow, error)
	GenerateBills(period, periodEnd string, amount int, dueDate, class string, santriIDs []int) (created int, skipped int, err error)
	PayBill(id, amount int, method, paidAt, notes string, byID int) error
	CancelBill(id int) error
	Summary(period string) (*SppSummary, error)
	Report(periodStart, periodEnd, class string, santriID int) ([]SppReportRow, error)
	ListActiveSantri() ([]SppSantri, error)
}
