package wallet

import (
	"errors"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/features/kas"
	"darussunnah-api/internal/platform/audit"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
	kas  *kas.Repository
}

func NewHandler(repo IRepository, kasRepo *kas.Repository) *Handler {
	return &Handler{repo: repo, kas: kasRepo}
}

// Pelindung brute-force PIN per pengguna: kunci 15 menit setelah 5x salah.
// Disimpan di memori (reset saat server restart).
const maxPinFails = 5
const pinLockDuration = 15 * time.Minute
const maxWalletAmount = 1000000000

type pinFailState struct {
	count       int
	lockedUntil time.Time
}

var pinGuard = struct {
	sync.Mutex
	fails map[int]pinFailState
}{fails: make(map[int]pinFailState)}

func pinLockedMinutes(userID int) int {
	pinGuard.Lock()
	defer pinGuard.Unlock()
	st := pinGuard.fails[userID]
	if st.count >= maxPinFails && time.Now().Before(st.lockedUntil) {
		return int(time.Until(st.lockedUntil).Minutes()) + 1
	}
	return 0
}

func pinRecordFail(userID int) int {
	pinGuard.Lock()
	defer pinGuard.Unlock()
	st := pinGuard.fails[userID]
	st.count++
	if st.count >= maxPinFails {
		st.lockedUntil = time.Now().Add(pinLockDuration)
	}
	pinGuard.fails[userID] = st
	if st.count >= maxPinFails {
		return int(pinLockDuration.Minutes())
	}
	return 0
}

func pinReset(userID int) {
	pinGuard.Lock()
	defer pinGuard.Unlock()
	delete(pinGuard.fails, userID)
}

func (h *Handler) GetMyWallet(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	startedAt := time.Now()
	logger.Info(r.Context(), "wallet get started", logger.Field{
		"operation": "wallet_get_my",
		"user_id":   userID,
	})

	wallet, err := h.repo.GetOrCreateByUserID(userID)
	if err != nil {
		logger.Error(r.Context(), "wallet get failed", logger.Field{
			"operation": "wallet_get_my",
			"user_id":   userID,
			"error":     err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat dompet", nil)
		return
	}

	logger.Info(r.Context(), "wallet get completed", logger.Field{
		"operation":   "wallet_get_my",
		"user_id":     userID,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Data dompet berhasil dimuat", wallet)
}

func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	startedAt := time.Now()
	logger.Info(r.Context(), "wallet history started", logger.Field{
		"operation": "wallet_get_history",
		"user_id":   userID,
	})

	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 20
	}

	history, err := h.repo.GetHistory(userID, limit)
	if err != nil {
		logger.Error(r.Context(), "wallet history failed", logger.Field{
			"operation": "wallet_get_history",
			"user_id":   userID,
			"error":     err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat riwayat", nil)
		return
	}

	logger.Info(r.Context(), "wallet history completed", logger.Field{
		"operation":   "wallet_get_history",
		"user_id":     userID,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Riwayat transaksi dimuat", history)
}

func (h *Handler) SetPIN(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	startedAt := time.Now()
	logger.Info(r.Context(), "wallet pin update started", logger.Field{
		"operation": "wallet_set_pin",
		"user_id":   userID,
	})

	var body struct {
		PIN    string `json:"pin"`
		OldPIN string `json:"old_pin"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil || len(body.PIN) < 4 {
		logger.Warn(r.Context(), "wallet pin update rejected", logger.Field{
			"operation": "wallet_set_pin",
			"user_id":   userID,
		})
		writeJSONResponse(w, http.StatusBadRequest, false, "PIN tidak valid (minimal 4 digit)", nil)
		return
	}

	if err := h.repo.SetPINWithCheck(userID, body.OldPIN, body.PIN); err != nil {
		if errors.Is(err, ErrPINMismatch) {
			writeJSONResponse(w, http.StatusForbidden, false, "PIN lama tidak cocok", nil)
			return
		}
		logger.Error(r.Context(), "wallet pin update failed", logger.Field{
			"operation": "wallet_set_pin",
			"user_id":   userID,
			"error":     err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan PIN", nil)
		return
	}

	logger.Info(r.Context(), "wallet pin update completed", logger.Field{
		"operation":   "wallet_set_pin",
		"user_id":     userID,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "PIN berhasil diperbarui", nil)
}

func (h *Handler) TopUp(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	// Usually admin only, check role in routes
	var body struct {
		UserID      int     `json:"user_id"`
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil || body.Amount <= 0 {
		logger.Warn(r.Context(), "wallet topup rejected", logger.Field{
			"operation": "wallet_topup",
		})
		writeJSONResponse(w, http.StatusBadRequest, false, "Data top-up tidak valid", nil)
		return
	}
	if body.Amount > maxWalletAmount {
		writeJSONResponse(w, http.StatusBadRequest, false, "Nominal top-up tidak wajar", nil)
		return
	}
	logger.Info(r.Context(), "wallet topup started", logger.Field{
		"operation":      "wallet_topup",
		"target_user_id": body.UserID,
		"amount":         body.Amount,
	})

	tr := &Transaction{
		Type:        "deposit",
		Amount:      body.Amount,
		Description: body.Description,
		ReferenceID: "ADMIN_TOPUP_" + strconv.FormatInt(int64(body.UserID), 10),
	}

	txID, err := h.repo.ProcessTransaction(body.UserID, tr)
	if err != nil {
		logger.Error(r.Context(), "wallet topup failed", logger.Field{
			"operation":      "wallet_topup",
			"target_user_id": body.UserID,
			"amount":         body.Amount,
			"error":          err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses pengisian saldo", nil)
		return
	}

	logger.Info(r.Context(), "wallet topup completed", logger.Field{
		"operation":      "wallet_topup",
		"target_user_id": body.UserID,
		"amount":         body.Amount,
		"duration_ms":    time.Since(startedAt).Milliseconds(),
	})
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	_ = h.recordKas("masuk", body.Amount, "Top-up saldo e-money: "+body.Description, actorID, fmt.Sprintf("WALLET_TX_%d", txID))
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "WALLET_TOPUP", Entity: "user_wallet", EntityID: strconv.FormatInt(int64(body.UserID), 10),
		After: map[string]interface{}{"amount": body.Amount, "description": body.Description},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Pengisian saldo berhasil", nil)
}

func (h *Handler) Spend(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	if wl, err := h.repo.GetOrCreateByUserID(userID); err == nil && !wl.IsActive {
		writeJSONResponse(w, http.StatusForbidden, false, "Dompet sedang dibekukan. Hubungi admin.", nil)
		return
	}
	if mins := pinLockedMinutes(userID); mins > 0 {
		writeJSONResponse(w, http.StatusForbidden, false, fmt.Sprintf("Terlalu banyak salah PIN. Coba lagi %d menit.", mins), nil)
		return
	}
	startedAt := time.Now()
	logger.Info(r.Context(), "wallet spend started", logger.Field{
		"operation": "wallet_spend",
		"user_id":   userID,
	})

	var body struct {
		PIN         string  `json:"pin"`
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil || body.Amount <= 0 {
		logger.Warn(r.Context(), "wallet spend rejected", logger.Field{
			"operation": "wallet_spend",
			"user_id":   userID,
		})
		writeJSONResponse(w, http.StatusBadRequest, false, "Data belanja tidak valid", nil)
		return
	}
	if body.Amount > maxWalletAmount {
		writeJSONResponse(w, http.StatusBadRequest, false, "Nominal belanja tidak wajar", nil)
		return
	}

	// 1. Verify PIN
	match, err := h.repo.VerifyPIN(userID, body.PIN)
	if err != nil || !match {
		if mins := pinRecordFail(userID); mins > 0 {
			logger.Warn(r.Context(), "wallet spend pin locked", logger.Field{
				"operation": "wallet_spend",
				"user_id":   userID,
			})
			writeJSONResponse(w, http.StatusForbidden, false, fmt.Sprintf("Terlalu banyak salah PIN. Coba lagi %d menit.", mins), nil)
			return
		}
		logger.Warn(r.Context(), "wallet spend pin verification failed", logger.Field{
			"operation": "wallet_spend",
			"user_id":   userID,
		})
		writeJSONResponse(w, http.StatusForbidden, false, "PIN salah", nil)
		return
	}
	pinReset(userID)

	// 2. Process
	tr := &Transaction{
		Type:        "purchase",
		Amount:      body.Amount,
		Description: body.Description,
	}

	if _, err := h.repo.ProcessTransaction(userID, tr); err != nil {
		logger.Error(r.Context(), "wallet spend failed", logger.Field{
			"operation": "wallet_spend",
			"user_id":   userID,
			"amount":    body.Amount,
			"error":     err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses transaksi", nil)
		return
	}
	logger.Info(r.Context(), "wallet spend completed", logger.Field{
		"operation":   "wallet_spend",
		"user_id":     userID,
		"amount":      body.Amount,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Transaksi berhasil", nil)
}

func currentUserID(r *http.Request) (int, bool) {
	return auth.CurrentUserID(r.Context())
}

// recordKas mencatat mutasi dompet ke jurnal Kas otomatis (Jilid 93) supaya
// perubahan saldo e-money ikut terlihat di laporan keuangan. Top-up -> "masuk",
// penarikan/refund -> "keluar". IdempotencyKey mencegah pencatatan ganda.
func (h *Handler) recordKas(kind string, amount float64, notes string, byID int, idempotencyKey string) error {
	if h.kas == nil {
		return nil
	}
	catID, err := h.kas.EnsureCategoryByName("Saldo E-Money", kind, byID)
	if err != nil {
		return err
	}
	_, err = h.kas.CreateTransaction(&kas.Transaction{
		Date:           time.Now().Format("2006-01-02"),
		Kind:           kind,
		CategoryID:     catID,
		Amount:         int(amount + 0.5),
		Method:         "e-money",
		Notes:          strings.TrimSpace(notes),
		CreatedBy:      byID,
		IdempotencyKey: idempotencyKey,
	})
	if errors.Is(err, kas.ErrKasDuplicate) {
		return nil
	}
	return err
}

// AdminList menampilkan daftar dompet santri/wali untuk panel admin.
func (h *Handler) AdminList(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	items, total, err := h.repo.AdminList(search, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "wallet admin list failed", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat daftar e-money", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar e-money berhasil dimuat", map[string]interface{}{
		"items": items, "total": total, "limit": limit, "offset": offset,
	})
}

// AdminHistory menampilkan mutasi dompet satu pengguna (dipakai panel admin).
func (h *Handler) AdminHistory(w http.ResponseWriter, r *http.Request) {
	userID, _ := strconv.Atoi(chi.URLParam(r, "userID"))
	if userID <= 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "ID pengguna tidak valid", nil)
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	history, err := h.repo.GetHistory(userID, limit)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat mutasi", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Mutasi berhasil dimuat", history)
}

// AdminAdjust dipakai admin/bendahara untuk top-up (deposit) atau menarik saldo
// (withdrawal/refund). Setiap mutasi ikut dicatat ke jurnal Kas otomatis.
func (h *Handler) AdminAdjust(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID      int     `json:"user_id"`
		Kind        string  `json:"kind"` // deposit | withdrawal
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	kind := strings.ToLower(strings.TrimSpace(body.Kind))
	if kind == "" {
		kind = "deposit"
	}
	if kind != "deposit" && kind != "withdrawal" {
		writeJSONResponse(w, http.StatusBadRequest, false, "Jenis mutasi tidak valid", nil)
		return
	}
	if body.UserID <= 0 || body.Amount <= 0 || body.Amount > maxWalletAmount {
		writeJSONResponse(w, http.StatusBadRequest, false, "Data mutasi tidak valid", nil)
		return
	}

	tr := &Transaction{
		Type:        kind,
		Amount:      body.Amount,
		Description: strings.TrimSpace(body.Description),
		ReferenceID: "ADMIN_ADJUST_" + strconv.Itoa(body.UserID),
	}
	txID, err := h.repo.ProcessTransaction(body.UserID, tr)
	if err != nil {
		if errors.Is(err, ErrInsufficientBalance) {
			writeJSONResponse(w, http.StatusBadRequest, false, "Saldo tidak mencukupi untuk penarikan", nil)
			return
		}
		writeJSONResponse(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	kasKind := "masuk"
	note := "Top-up saldo e-money"
	if kind == "withdrawal" {
		kasKind = "keluar"
		note = "Penarikan/refund saldo e-money"
	}
	if body.Description != "" {
		note += ": " + body.Description
	}
	if err := h.recordKas(kasKind, body.Amount, note, actorID, fmt.Sprintf("WALLET_TX_%d", txID)); err != nil {
		logger.Error(r.Context(), "wallet kas sync failed", logger.Field{"error": err.Error(), "tx_id": txID})
	}
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "WALLET_ADJUST", Entity: "user_wallet", EntityID: strconv.Itoa(body.UserID),
		After: map[string]interface{}{"kind": kind, "amount": body.Amount, "description": body.Description},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	msg := "Top-up berhasil"
	if kind == "withdrawal" {
		msg = "Penarikan saldo berhasil"
	}
	writeJSONResponse(w, http.StatusOK, true, msg, map[string]interface{}{"transaction_id": txID})
}

// AdminSetActive membekukan/mengaktifkan dompet.
func (h *Handler) AdminSetActive(w http.ResponseWriter, r *http.Request) {
	userID, _ := strconv.Atoi(chi.URLParam(r, "userID"))
	if userID <= 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "ID pengguna tidak valid", nil)
		return
	}
	var body struct {
		IsActive *bool `json:"is_active"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil || body.IsActive == nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if err := h.repo.SetActive(userID, *body.IsActive); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memperbarui status dompet", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "WALLET_SET_ACTIVE", Entity: "user_wallet", EntityID: strconv.Itoa(userID),
		After: map[string]interface{}{"is_active": *body.IsActive},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	msg := "Dompet dibekukan"
	if *body.IsActive {
		msg = "Dompet diaktifkan"
	}
	writeJSONResponse(w, http.StatusOK, true, msg, nil)
}

// AdminResetPIN mengganti PIN dompet. Kirim pin kosong untuk menghapus PIN.
func (h *Handler) AdminResetPIN(w http.ResponseWriter, r *http.Request) {
	userID, _ := strconv.Atoi(chi.URLParam(r, "userID"))
	if userID <= 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "ID pengguna tidak valid", nil)
		return
	}
	var body struct {
		PIN string `json:"pin"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	pin := strings.TrimSpace(body.PIN)
	if pin != "" && len(pin) < 4 {
		writeJSONResponse(w, http.StatusBadRequest, false, "PIN minimal 4 digit", nil)
		return
	}
	if err := h.repo.ResetPIN(userID, pin); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memperbarui PIN", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "WALLET_RESET_PIN", Entity: "user_wallet", EntityID: strconv.Itoa(userID),
		After: map[string]interface{}{"cleared": pin == ""},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	msg := "PIN berhasil diperbarui"
	if pin == "" {
		msg = "PIN berhasil direset (dihapus)"
	}
	writeJSONResponse(w, http.StatusOK, true, msg, nil)
}

// AdminDelete menghapus dompet beserta mutasinya (akun pengguna tetap).
func (h *Handler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	userID, _ := strconv.Atoi(chi.URLParam(r, "userID"))
	if userID <= 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "ID pengguna tidak valid", nil)
		return
	}
	if err := h.repo.DeleteWallet(userID); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus dompet", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "WALLET_DELETE", Entity: "user_wallet", EntityID: strconv.Itoa(userID),
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Dompet berhasil dihapus", nil)
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
	GetOrCreateByUserID(userID int) (*Wallet, error)
	SetPIN(userID int, pin string) error
	SetPINWithCheck(userID int, oldPIN, newPIN string) error
	VerifyPIN(userID int, pin string) (bool, error)
	ProcessTransaction(userID int, tr *Transaction) (int, error)
	GetHistory(userID int, limit int) ([]Transaction, error)
	AdminList(search string, limit, offset int) ([]AdminWalletRow, int, error)
	SetActive(userID int, active bool) error
	ResetPIN(userID int, pin string) error
	DeleteWallet(userID int) error
}
