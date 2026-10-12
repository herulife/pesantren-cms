package otp

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	"darussunnah-api/internal/platform/audit"
	"darussunnah-api/internal/platform/whatsapp"
	"darussunnah-api/internal/validators"

	"github.com/go-chi/chi/v5"
)

// OTPRepository kontrak yang dipakai handler (memudahkan unit test).
type OTPRepository interface {
	Request(ctx context.Context, phone, purpose string) (string, error)
	Verify(ctx context.Context, phone, purpose, code string) error
}

// Handler endpoint OTP publik (dilindungi rate limiter di main.go).
type Handler struct {
	repo OTPRepository
}

// NewHandler membuat handler OTP.
func NewHandler(repo OTPRepository) *Handler {
	return &Handler{repo: repo}
}

type otpRequest struct {
	Phone   string `json:"phone"`
	Purpose string `json:"purpose"`
}

type otpVerifyRequest struct {
	Phone   string `json:"phone"`
	Purpose string `json:"purpose"`
	Code    string `json:"code"`
}

func normalizePurpose(raw string) string {
	p := strings.ToLower(validators.NormalizeText(raw))
	if p == "" {
		return "psb"
	}
	if len(p) > 32 {
		return p[:32]
	}
	return p
}

func normalizePhone(raw string) string {
	return whatsapp.NormalizePhone(strings.TrimSpace(raw))
}

// FormatOTPMessage template pesan OTP WhatsApp.
func FormatOTPMessage(code string) string {
	return "Assalamu'alaikum Wr. Wb.\n\nKode verifikasi Darussunnah Anda: *" +
		strings.TrimSpace(code) +
		"*.\nBerlaku 10 menit. Jangan berikan kepada siapa pun.\n\n_Panitia Darussunnah_"
}

// Request menerbitkan kode OTP dan mengirimkannya via WhatsApp.
// Kode TIDAK pernah dikembalikan di response (hanya via WA).
func (h *Handler) Request(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Isi permintaan tidak valid")
		return
	}
	var req otpRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	phone := normalizePhone(req.Phone)
	if !validators.ValidatePhone(phone) {
		SendErrorResponse(w, http.StatusBadRequest, "Nomor WhatsApp tidak valid")
		return
	}
	purpose := normalizePurpose(req.Purpose)

	code, err := h.repo.Request(r.Context(), phone, purpose)
	if err != nil {
		if errors.Is(err, ErrCooldown) {
			SendErrorResponse(w, http.StatusTooManyRequests, "Terlalu cepat meminta kode. Tunggu sekitar 1 menit lalu coba lagi.")
			return
		}
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal membuat kode OTP")
		return
	}

	// Kegagalan kirim WA tidak menggugurkan kode (tetap valid 10 menit);
	// klien boleh meminta ulang setelah cooldown 60 detik.
	if err := whatsapp.SendMessage(phone, FormatOTPMessage(code)); err != nil {
		SendErrorResponse(w, http.StatusServiceUnavailable, "Kanal WhatsApp belum siap. Coba lagi sesaat lagi.")
		return
	}

	audit.Record(r.Context(), audit.Entry{
		Action: "OTP_REQUEST", Entity: "otp", EntityID: phone,
		After:     map[string]interface{}{"purpose": purpose},
		IP:        r.RemoteAddr,
		UserAgent: r.UserAgent(),
	})
	SendSuccessResponse(w, http.StatusOK,
		map[string]interface{}{"expires_in_seconds": int(CodeTTL.Seconds())},
		"Kode OTP dikirim via WhatsApp")
}

// Verify memeriksa kode OTP yang dimasukkan pengguna.
func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Isi permintaan tidak valid")
		return
	}
	var req otpVerifyRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	phone := normalizePhone(req.Phone)
	if !validators.ValidatePhone(phone) {
		SendErrorResponse(w, http.StatusBadRequest, "Nomor WhatsApp tidak valid")
		return
	}
	code := strings.TrimSpace(req.Code)
	if len(code) != 6 {
		SendErrorResponse(w, http.StatusBadRequest, "Kode OTP harus 6 digit")
		return
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			SendErrorResponse(w, http.StatusBadRequest, "Kode OTP harus 6 digit angka")
			return
		}
	}

	err = h.repo.Verify(r.Context(), phone, normalizePurpose(req.Purpose), code)
	switch {
	case err == nil:
		audit.Record(r.Context(), audit.Entry{
			Action: "OTP_VERIFY", Entity: "otp", EntityID: phone,
			After:     map[string]interface{}{"result": "ok"},
			IP:        r.RemoteAddr,
			UserAgent: r.UserAgent(),
		})
		SendSuccessResponse(w, http.StatusOK, nil, "Verifikasi berhasil")
	case errors.Is(err, ErrNotFound), errors.Is(err, ErrMismatch):
		SendErrorResponse(w, http.StatusBadRequest, "Kode OTP salah")
	case errors.Is(err, ErrExpired):
		SendErrorResponse(w, http.StatusBadRequest, "Kode OTP kedaluwarsa, minta kode baru")
	case errors.Is(err, ErrLocked):
		SendErrorResponse(w, http.StatusTooManyRequests, "Terlalu banyak percobaan, minta kode baru")
	default:
		SendErrorResponse(w, http.StatusInternalServerError, "Gagal memverifikasi kode OTP")
	}
}

// Routes mendaftarkan endpoint publik OTP.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/request", h.Request)
	r.Post("/verify", h.Verify)
	return r
}
