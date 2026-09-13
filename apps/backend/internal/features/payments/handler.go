package payments

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
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

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func validatePayment(p *Payment) map[string][]string {
	errs := map[string][]string{}
	if p.UserID <= 0 {
		errs["user_id"] = []string{"Santri wajib dipilih"}
	}
	if p.Amount <= 0 {
		errs["amount"] = []string{"Jumlah pembayaran harus lebih dari 0"}
	}
	if strings.TrimSpace(p.Description) == "" {
		errs["description"] = []string{"Keterangan wajib diisi"}
	}
	if p.Status != "" && p.Status != "pending" && p.Status != "success" && p.Status != "failed" {
		errs["status"] = []string{"Status harus pending, success, atau failed"}
	}
	if strings.TrimSpace(p.Method) == "" {
		errs["method"] = []string{"Metode pembayaran wajib diisi"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
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

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/all", h.GetAll)
	r.Get("/transactions", h.GetTransactions)
	r.Get("/receipt", h.GetReceipt)
	r.Get("/unpaid", h.GetUnpaid)
	r.Get("/users", h.GetAllUsers)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *Handler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	list, err := h.repo.ListPayTx(q.Get("from"), q.Get("to"), strings.TrimSpace(q.Get("search")), limit, offset)
	if err != nil {
		logger.Error(r.Context(), "payments transactions failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat transaksi", nil)
		return
	}
	if list == nil {
		list = []PayTx{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Transaksi berhasil dimuat", list)
}

func (h *Handler) GetUnpaid(w http.ResponseWriter, r *http.Request) {
	santriID, _ := strconv.Atoi(r.URL.Query().Get("santri_id"))
	if santriID <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "santri_id wajib diisi", nil)
		return
	}
	list, err := h.repo.UnpaidBills(santriID)
	if err != nil {
		logger.Error(r.Context(), "payments unpaid failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat tagihan", nil)
		return
	}
	if list == nil {
		list = []UnpaidBill{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Tagihan belum lunas berhasil dimuat", list)
}

func (h *Handler) receiptByOwner(w http.ResponseWriter, r *http.Request, ownerUID int) {
	q := r.URL.Query()
	santriID, _ := strconv.Atoi(q.Get("santri_id"))
	period := strings.TrimSpace(q.Get("period"))
	if santriID <= 0 || len(period) < 7 {
		sendJSONResponse(w, http.StatusBadRequest, false, "santri_id dan period (YYYY-MM) wajib diisi", nil)
		return
	}
	byID := 0
	if uid, ok := auth.CurrentUserID(r.Context()); ok {
		byID = uid
	}
	detail, err := h.repo.GetOrCreateReceipt(santriID, period[:7], byID, ownerUID)
	if err != nil {
		if err == ErrNoReceiptData || err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Belum ada pembayaran pada periode ini", nil)
			return
		}
		logger.Error(r.Context(), "payments receipt failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat kwitansi", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Kwitansi berhasil dimuat", detail)
}

func (h *Handler) GetReceipt(w http.ResponseWriter, r *http.Request) {
	h.receiptByOwner(w, r, 0)
}

func (h *Handler) GetMyReceipt(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.CurrentUserID(r.Context())
	if !ok {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	h.receiptByOwner(w, r, uid)
}

func (h *Handler) myUID(w http.ResponseWriter, r *http.Request) (int, bool) {
	uid, ok := auth.CurrentUserID(r.Context())
	if !ok {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return 0, false
	}
	return uid, true
}

func (h *Handler) GetMyBills(w http.ResponseWriter, r *http.Request) {
	uid, ok := h.myUID(w, r)
	if !ok {
		return
	}
	list, err := h.repo.MyBills(uid)
	if err != nil {
		logger.Error(r.Context(), "payments my-bills failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat tagihan", nil)
		return
	}
	if list == nil {
		list = []MyBill{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Tagihan berhasil dimuat", list)
}

func (h *Handler) GetMyLedger(w http.ResponseWriter, r *http.Request) {
	uid, ok := h.myUID(w, r)
	if !ok {
		return
	}
	list, err := h.repo.MyLedger(uid, 50)
	if err != nil {
		logger.Error(r.Context(), "payments my-ledger failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat riwayat", nil)
		return
	}
	if list == nil {
		list = []PayTx{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Riwayat berhasil dimuat", list)
}

func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	logger.Info(r.Context(), "payments list users started", logger.Field{"operation": "payments_list_users"})
	users, err := h.repo.GetUsers()
	if err != nil {
		logger.Error(r.Context(), "payments list users failed", logger.Field{"operation": "payments_list_users", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "payments list users completed", logger.Field{"operation": "payments_list_users", "count": len(users)})
	sendJSONResponse(w, http.StatusOK, true, "Daftar pengguna berhasil dimuat", users)
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	logger.Info(r.Context(), "payments list started", logger.Field{"operation": "payments_list"})
	ps, err := h.repo.GetAll()
	if err != nil {
		logger.Error(r.Context(), "payments list failed", logger.Field{"operation": "payments_list", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "payments list completed", logger.Field{"operation": "payments_list", "count": len(ps)})
	limit, offset := parsePagination(r)
	if len(ps) > limit {
		end := offset + limit
		if end > len(ps) {
			end = len(ps)
		}
		if offset < len(ps) {
			ps = ps[offset:end]
		} else {
			ps = ps[:0]
		}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar pembayaran berhasil dimuat", ps)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	logger.Info(r.Context(), "payments create started", logger.Field{"operation": "payments_create"})
	var p Payment
	if err := validators.DecodeJSON(w, r, &p); err != nil {
		logger.Warn(r.Context(), "payments create rejected", logger.Field{"operation": "payments_create"})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if strings.TrimSpace(p.Status) == "" {
		p.Status = "success"
	}
	if strings.TrimSpace(p.Method) == "" {
		p.Method = "manual"
	}
	if errs := validatePayment(&p); errs != nil {
		writeValidationError(w, errs)
		return
	}

	if err := h.repo.Create(&p); err != nil {
		logger.Error(r.Context(), "payments create failed", logger.Field{"operation": "payments_create", "error": err.Error(), "user_id": p.UserID})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := 0
	if claims, ok := r.Context().Value(auth.UserContextKey).(map[string]interface{}); ok {
		if id, ok := claims["id"].(float64); ok {
			adminID = int(id)
		}
	}
	logger.RecordActivity(&adminID, "CREATE_PAYMENT", fmt.Sprintf("Mencatat pembayaran Rp %d untuk User ID %d", p.Amount, p.UserID), r.RemoteAddr, r.UserAgent())
	logger.Info(r.Context(), "payments create completed", logger.Field{"operation": "payments_create", "user_id": p.UserID, "amount": p.Amount})

	sendJSONResponse(w, http.StatusOK, true, "Pembayaran berhasil dicatat", nil)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	logger.Info(r.Context(), "payments update started", logger.Field{"operation": "payments_update"})
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID pembayaran tidak valid", nil)
		return
	}
	var p Payment
	if err := validators.DecodeJSON(w, r, &p); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	p.ID = id
	if strings.TrimSpace(p.Status) == "" {
		p.Status = "success"
	}
	if strings.TrimSpace(p.Method) == "" {
		p.Method = "manual"
	}
	if errs := validatePayment(&p); errs != nil {
		writeValidationError(w, errs)
		return
	}
	if err := h.repo.Update(&p); err != nil {
		logger.Error(r.Context(), "payments update failed", logger.Field{"operation": "payments_update", "error": err.Error(), "payment_id": id})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	adminID := 0
	if claims, ok := r.Context().Value(auth.UserContextKey).(map[string]interface{}); ok {
		if cid, ok := claims["id"].(float64); ok {
			adminID = int(cid)
		}
	}
	logger.RecordActivity(&adminID, "UPDATE_PAYMENT", fmt.Sprintf("Memperbarui pembayaran ID %d", id), r.RemoteAddr, r.UserAgent())
	logger.Info(r.Context(), "payments update completed", logger.Field{"operation": "payments_update", "payment_id": id})
	sendJSONResponse(w, http.StatusOK, true, "Pembayaran berhasil diperbarui", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	logger.Info(r.Context(), "payments delete started", logger.Field{"operation": "payments_delete"})
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		logger.Warn(r.Context(), "payments delete rejected", logger.Field{"operation": "payments_delete", "id": idStr})
		sendJSONResponse(w, http.StatusBadRequest, false, "ID pembayaran tidak valid", nil)
		return
	}

	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "payments delete failed", logger.Field{"operation": "payments_delete", "error": err.Error(), "payment_id": id})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := 0
	if claims, ok := r.Context().Value(auth.UserContextKey).(map[string]interface{}); ok {
		if cid, ok := claims["id"].(float64); ok {
			adminID = int(cid)
		}
	}
	logger.RecordActivity(&adminID, "DELETE_PAYMENT", fmt.Sprintf("Menghapus catatan pembayaran ID %d", id), r.RemoteAddr, r.UserAgent())
	logger.Info(r.Context(), "payments delete completed", logger.Field{"operation": "payments_delete", "payment_id": id})

	sendJSONResponse(w, http.StatusOK, true, "Pembayaran berhasil dihapus", nil)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	GetAll() ([]Payment, error)
	GetByUserID(userID int) ([]Payment, error)
	Create(p *Payment) error
	Update(p *Payment) error
	Delete(id int) error
	GetUsers() ([]struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}, error)
	ListPayTx(from, to, search string, limit, offset int) ([]PayTx, error)
	UnpaidBills(santriID int) ([]UnpaidBill, error)
	MyBills(uid int) ([]MyBill, error)
	MyLedger(uid int, limit int) ([]PayTx, error)
	GetOrCreateReceipt(santriID int, period string, byID, ownerUID int) (*ReceiptDetail, error)
}
