package wallet

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
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
		PIN string `json:"pin"`
	}
	if err := validators.DecodeJSON(w, r, &body); err != nil || len(body.PIN) < 4 {
		logger.Warn(r.Context(), "wallet pin update rejected", logger.Field{
			"operation": "wallet_set_pin",
			"user_id":   userID,
		})
		writeJSONResponse(w, http.StatusBadRequest, false, "PIN tidak valid (minimal 4 digit)", nil)
		return
	}

	if err := h.repo.SetPIN(userID, body.PIN); err != nil {
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

	if err := h.repo.ProcessTransaction(body.UserID, tr); err != nil {
		logger.Error(r.Context(), "wallet topup failed", logger.Field{
			"operation":      "wallet_topup",
			"target_user_id": body.UserID,
			"amount":         body.Amount,
			"error":          err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	logger.Info(r.Context(), "wallet topup completed", logger.Field{
		"operation":      "wallet_topup",
		"target_user_id": body.UserID,
		"amount":         body.Amount,
		"duration_ms":    time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Pengisian saldo berhasil", nil)
}

func (h *Handler) Spend(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Unauthorized", nil)
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

	// 1. Verify PIN
	match, err := h.repo.VerifyPIN(userID, body.PIN)
	if err != nil || !match {
		logger.Warn(r.Context(), "wallet spend pin verification failed", logger.Field{
			"operation": "wallet_spend",
			"user_id":   userID,
		})
		writeJSONResponse(w, http.StatusForbidden, false, "PIN salah", nil)
		return
	}

	// 2. Process
	tr := &Transaction{
		Type:        "purchase",
		Amount:      body.Amount,
		Description: body.Description,
	}

	if err := h.repo.ProcessTransaction(userID, tr); err != nil {
		logger.Error(r.Context(), "wallet spend failed", logger.Field{
			"operation": "wallet_spend",
			"user_id":   userID,
			"amount":    body.Amount,
			"error":     err.Error(),
		})
		writeJSONResponse(w, http.StatusInternalServerError, false, err.Error(), nil)
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
	VerifyPIN(userID int, pin string) (bool, error)
	ProcessTransaction(userID int, tr *Transaction) error
	GetHistory(userID int, limit int) ([]Transaction, error)
}
