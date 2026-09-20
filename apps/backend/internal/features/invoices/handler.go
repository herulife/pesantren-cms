package invoices

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"

	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/validators"
)

// InvoiceRepository kontrak yang dipakai handler.
type InvoiceRepository interface {
	Create(ctx context.Context, registrationID, amount int, method string) (*Invoice, error)
	ApplyWebhook(ctx context.Context, code, gatewayTxID, status string, amount int) (*WebhookResult, error)
}

// Handler endpoint invoice (create oleh panitia, webhook publik + HMAC).
type Handler struct {
	repo InvoiceRepository
}

// NewHandler membuat handler invoice.
func NewHandler(repo InvoiceRepository) *Handler {
	return &Handler{repo: repo}
}

type createRequest struct {
	RegistrationID int    `json:"registration_id"`
	Amount         int    `json:"amount"`
	Method         string `json:"method"`
}

type webhookRequest struct {
	Code        string `json:"invoice_code"`
	GatewayTxID string `json:"gateway_tx_id"`
	Status      string `json:"status"`
	Amount      int    `json:"amount"`
}

// Create menerbitkan invoice pending untuk satu registrasi (panitia).
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Isi permintaan tidak valid")
		return
	}
	var req createRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	if req.RegistrationID <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "registration_id wajib diisi")
		return
	}
	if req.Amount <= 0 {
		SendErrorResponse(w, http.StatusBadRequest, "amount harus lebih dari 0")
		return
	}
	inv, err := h.repo.Create(r.Context(), req.RegistrationID, req.Amount, req.Method)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal membuat invoice")
		return
	}
	audit.Record(r.Context(), audit.Entry{
		Action: "INVOICE_CREATE", Entity: "invoice", EntityID: inv.Code,
		After:     map[string]interface{}{"registration_id": req.RegistrationID, "amount": req.Amount},
		IP:        r.RemoteAddr,
		UserAgent: r.UserAgent(),
	})
	SendSuccessResponse(w, http.StatusCreated, inv, "Invoice dibuat")
}

func webhookSecret() string {
	return strings.TrimSpace(os.Getenv("INVOICE_WEBHOOK_SECRET"))
}

// signatureValid memverifikasi HMAC-SHA256 body dengan secret.
// Header X-Signature boleh polos hex atau diawali "sha256=".
func signatureValid(secret string, body []byte, header string) bool {
	header = strings.TrimSpace(header)
	header = strings.TrimSpace(strings.TrimPrefix(header, "sha256="))
	if header == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(strings.ToLower(header)))
}

// Webhook menerima event gateway secara provider-agnostik.
// Idempoten: replay gateway_tx_id sama -> 200 tanpa efek ganda.
func (h *Handler) Webhook(w http.ResponseWriter, r *http.Request) {
	secret := webhookSecret()
	if secret == "" {
		SendErrorResponse(w, http.StatusServiceUnavailable, "Webhook invoice belum dikonfigurasi")
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Isi permintaan tidak valid")
		return
	}
	if !signatureValid(secret, body, r.Header.Get("X-Signature")) {
		SendErrorResponse(w, http.StatusUnauthorized, "Signature webhook tidak valid")
		return
	}
	var req webhookRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	req.Code = strings.TrimSpace(req.Code)
	req.GatewayTxID = strings.TrimSpace(req.GatewayTxID)
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	if req.Code == "" || req.GatewayTxID == "" {
		SendErrorResponse(w, http.StatusBadRequest, "invoice_code dan gateway_tx_id wajib diisi")
		return
	}
	switch req.Status {
	case "pending", "paid", "failed", "expired":
	default:
		SendErrorResponse(w, http.StatusBadRequest, "status webhook tidak dikenal")
		return
	}

	res, err := h.repo.ApplyWebhook(r.Context(), req.Code, req.GatewayTxID, req.Status, req.Amount)
	switch {
	case err == nil:
		audit.Record(r.Context(), audit.Entry{
			Action: "INVOICE_WEBHOOK", Entity: "invoice", EntityID: req.Code,
			After: map[string]interface{}{
				"status": req.Status, "gateway_tx_id": req.GatewayTxID, "replay": res.Replay,
			},
			IP:        r.RemoteAddr,
			UserAgent: r.UserAgent(),
		})
		SendSuccessResponse(w, http.StatusOK, res, "Webhook diproses")
	case errors.Is(err, sql.ErrNoRows):
		SendErrorResponse(w, http.StatusNotFound, "Invoice tidak ditemukan")
	case errors.Is(err, ErrConflictTx):
		SendErrorResponse(w, http.StatusConflict, "Event gateway sudah tercatat sebelumnya")
	case errors.Is(err, ErrInvalidTransition):
		SendErrorResponse(w, http.StatusUnprocessableEntity, "Transisi status invoice tidak diizinkan")
	default:
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memproses webhook")
	}
}
