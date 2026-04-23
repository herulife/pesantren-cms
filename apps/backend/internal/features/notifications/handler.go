package notifications

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/platform/telegram"
	"darussunnah-api/internal/platform/whatsapp"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo Repository
}

func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/status", h.GetStatus)
	r.Post("/send-wa", h.SendWhatsApp)
	r.Post("/send-telegram", h.SendTelegram)
	r.Post("/broadcast-tagihan", h.BroadcastTagihan)
	r.Post("/broadcast-nilai", h.BroadcastNilai)
	r.Post("/broadcast-psb", h.BroadcastPSB)
	return r
}

func getAdminID(r *http.Request) int {
	if userID, ok := auth.CurrentUserID(r.Context()); ok {
		return userID
	}
	return 0
}

func writeJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	writeJSONResponse(w, status, false, message, nil)
}

func (h *Handler) GetStatus(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "notification status started", logger.Field{"operation": "notifications_status"})
	waAPIKey := os.Getenv("FONNTE_API_KEY")
	waAPIURL := os.Getenv("FONNTE_API_URL")
	waConfigured := whatsapp.IsConfigured(waAPIKey, waAPIURL)
	telegramConfigured := telegram.IsConfigured(os.Getenv("TELEGRAM_BOT_TOKEN"))
	writeJSONResponse(w, http.StatusOK, true, "Status WhatsApp berhasil dimuat", map[string]interface{}{
		"configured":          waConfigured,
		"whatsapp_configured": waConfigured,
		"telegram_configured": telegramConfigured,
	})
	logger.Info(r.Context(), "notification status completed", logger.Field{
		"operation":   "notifications_status",
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
}

func (h *Handler) SendWhatsApp(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "send whatsapp started", logger.Field{"operation": "notifications_send_whatsapp"})
	var req struct {
		Target  string `json:"target"`
		Message string `json:"message"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		logger.Warn(r.Context(), "send whatsapp rejected invalid payload", logger.Field{"operation": "notifications_send_whatsapp"})
		writeJSONError(w, http.StatusBadRequest, "Payload permintaan tidak valid")
		return
	}
	if req.Target == "" || req.Message == "" {
		logger.Warn(r.Context(), "send whatsapp rejected empty target or message", logger.Field{"operation": "notifications_send_whatsapp"})
		writeJSONError(w, http.StatusBadRequest, "Nomor tujuan dan pesan wajib diisi")
		return
	}

	if err := whatsapp.SendMessage(req.Target, req.Message); err != nil {
		logger.Error(r.Context(), "send whatsapp failed", logger.Field{"operation": "notifications_send_whatsapp", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	adminID := getAdminID(r)
	logger.RecordActivity(&adminID, "SEND_WA", fmt.Sprintf("Kirim WA ke %s", req.Target), r.RemoteAddr, r.UserAgent())
	logger.Info(r.Context(), "send whatsapp completed", logger.Field{
		"operation":   "notifications_send_whatsapp",
		"target":      req.Target,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})

	writeJSONResponse(w, http.StatusOK, true, "Pesan WhatsApp berhasil dikirim", nil)
}

func (h *Handler) SendTelegram(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "send telegram started", logger.Field{"operation": "notifications_send_telegram"})
	var req struct {
		ChatID  int64  `json:"chat_id"`
		Message string `json:"message"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		logger.Warn(r.Context(), "send telegram rejected invalid payload", logger.Field{"operation": "notifications_send_telegram"})
		writeJSONError(w, http.StatusBadRequest, "Payload permintaan tidak valid")
		return
	}
	if req.ChatID == 0 || req.Message == "" {
		logger.Warn(r.Context(), "send telegram rejected empty chat or message", logger.Field{"operation": "notifications_send_telegram"})
		writeJSONError(w, http.StatusBadRequest, "Chat ID dan pesan wajib diisi")
		return
	}

	if err := telegram.SendMessage(req.ChatID, req.Message); err != nil {
		logger.Error(r.Context(), "send telegram failed", logger.Field{"operation": "notifications_send_telegram", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan Telegram")
		return
	}

	adminID := getAdminID(r)
	logger.RecordActivity(&adminID, "SEND_TELEGRAM", fmt.Sprintf("Kirim Telegram ke %d", req.ChatID), r.RemoteAddr, r.UserAgent())
	logger.Info(r.Context(), "send telegram completed", logger.Field{
		"operation":   "notifications_send_telegram",
		"chat_id":     req.ChatID,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Pesan Telegram berhasil dikirim", nil)
}

func (h *Handler) BroadcastTagihan(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "broadcast tagihan started", logger.Field{"operation": "notifications_broadcast_tagihan"})
	targets, err := h.repo.GetPendingTagihan()
	if err != nil {
		logger.Error(r.Context(), "broadcast tagihan failed", logger.Field{"operation": "notifications_broadcast_tagihan", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	adminID := getAdminID(r)
	count := len(targets)

	writeJSONResponse(w, http.StatusOK, true, "Broadcast tagihan siap diproses di background", map[string]interface{}{
		"count": count,
	})
	logger.Info(r.Context(), "broadcast tagihan queued", logger.Field{
		"operation":   "notifications_broadcast_tagihan",
		"count":       count,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})

	remoteAddr := r.RemoteAddr
	userAgent := r.UserAgent()

	go func() {
		for _, t := range targets {
			msg := whatsapp.FormatTagihanSPP(t.Name, t.Description, t.Amount)
			if err := whatsapp.SendMessage(t.Phone, msg); err == nil {
				logger.RecordActivity(&adminID, "SEND_WA_BROADCAST", fmt.Sprintf("Broadcast SPP ke %s (%s)", t.Name, t.Phone), remoteAddr, userAgent)
			} else {
				logger.Error(r.Context(), "broadcast tagihan send failed", logger.Field{"operation": "notifications_broadcast_tagihan", "phone": t.Phone, "error": err.Error()})
			}
		}
	}()
}

func (h *Handler) TelegramWebhook(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "telegram webhook started", logger.Field{"operation": "notifications_telegram_webhook"})
	if !telegram.IsConfigured(os.Getenv("TELEGRAM_BOT_TOKEN")) {
		logger.Warn(r.Context(), "telegram webhook rejected because bot is not configured", logger.Field{"operation": "notifications_telegram_webhook"})
		writeJSONError(w, http.StatusServiceUnavailable, "Telegram bot belum dikonfigurasi")
		return
	}

	if !telegram.WebhookSecretMatches(r.Header.Get("X-Telegram-Bot-Api-Secret-Token")) {
		logger.Warn(r.Context(), "telegram webhook rejected invalid secret", logger.Field{"operation": "notifications_telegram_webhook"})
		writeJSONError(w, http.StatusUnauthorized, "Webhook Telegram tidak valid")
		return
	}

	var update telegram.Update
	if err := validators.DecodeJSON(w, r, &update); err != nil {
		logger.Warn(r.Context(), "telegram webhook rejected invalid payload", logger.Field{"operation": "notifications_telegram_webhook"})
		writeJSONError(w, http.StatusBadRequest, "Payload Telegram tidak valid")
		return
	}

	chatID := update.Message.Chat.ID
	text := strings.TrimSpace(update.Message.Text)
	if chatID == 0 || text == "" {
		logger.Info(r.Context(), "telegram webhook ignored empty update", logger.Field{"operation": "notifications_telegram_webhook"})
		writeJSONResponse(w, http.StatusOK, true, "Update Telegram diabaikan", nil)
		return
	}

	if !telegram.IsAllowedChat(chatID) {
		_ = telegram.SendMessage(chatID, "Chat ini belum diizinkan untuk mengontrol sistem.")
		logger.Warn(r.Context(), "telegram webhook rejected unauthorized chat", logger.Field{"operation": "notifications_telegram_webhook", "chat_id": chatID})
		writeJSONResponse(w, http.StatusOK, true, "Chat Telegram tidak diizinkan", nil)
		return
	}

	responseText := h.handleTelegramCommand(text)
	if err := telegram.SendMessage(chatID, responseText); err != nil {
		logger.Error(r.Context(), "telegram webhook reply failed", logger.Field{"operation": "notifications_telegram_webhook", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal membalas command Telegram")
		return
	}

	logger.Info(r.Context(), "telegram webhook completed", logger.Field{
		"operation":   "notifications_telegram_webhook",
		"chat_id":     chatID,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	writeJSONResponse(w, http.StatusOK, true, "Command Telegram diproses", nil)
}

func (h *Handler) handleTelegramCommand(command string) string {
	switch strings.Fields(strings.ToLower(command))[0] {
	case "/start", "/help":
		return "Perintah tersedia:\n/status\n/tagihan\n/nilai\n/psb\n/help"
	case "/status":
		waConfigured := whatsapp.IsConfigured(os.Getenv("FONNTE_API_KEY"), os.Getenv("FONNTE_API_URL"))
		return fmt.Sprintf("Status sistem:\nWhatsApp: %s\nTelegram: aktif", boolLabel(waConfigured))
	case "/tagihan":
		targets, err := h.repo.GetPendingTagihan()
		if err != nil {
			return "Gagal mengambil data tagihan."
		}
		go func(items []TagihanTarget) {
			for _, t := range items {
				msg := whatsapp.FormatTagihanSPP(t.Name, t.Description, t.Amount)
				_ = whatsapp.SendMessage(t.Phone, msg)
			}
		}(targets)
		return fmt.Sprintf("Broadcast tagihan dijalankan untuk %d data.", len(targets))
	case "/nilai":
		targets, err := h.repo.GetNilai()
		if err != nil {
			return "Gagal mengambil data nilai."
		}
		go func(items []NilaiTarget) {
			for _, t := range items {
				msg := whatsapp.FormatNilaiRaport(t.Name, t.Semester, t.Year, t.FinalScore, t.GradeLetter)
				_ = whatsapp.SendMessage(t.Phone, msg)
			}
		}(targets)
		return fmt.Sprintf("Broadcast nilai dijalankan untuk %d data.", len(targets))
	case "/psb":
		targets, err := h.repo.GetPSBStatus()
		if err != nil {
			return "Gagal mengambil data PSB."
		}
		go func(items []PSBTarget) {
			for _, t := range items {
				msg := whatsapp.FormatPSBStatus(t.Name, t.Status)
				_ = whatsapp.SendMessage(t.Phone, msg)
			}
		}(targets)
		return fmt.Sprintf("Broadcast PSB dijalankan untuk %d data.", len(targets))
	default:
		return "Command tidak dikenal. Kirim /help untuk daftar command."
	}
}

func boolLabel(value bool) string {
	if value {
		return "siap"
	}
	return "belum siap"
}

// BroadcastNilai sends raport notifications to all students with WA numbers.
func (h *Handler) BroadcastNilai(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "broadcast nilai started", logger.Field{"operation": "notifications_broadcast_nilai"})
	targets, err := h.repo.GetNilai()
	if err != nil {
		logger.Error(r.Context(), "broadcast nilai failed", logger.Field{"operation": "notifications_broadcast_nilai", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	// Filter distinct students to avoid duplicate
	sent := make(map[string]bool)
	var finalTargets []NilaiTarget
	for _, t := range targets {
		key := t.Phone + "_" + t.Semester + "_" + t.Year
		if !sent[key] {
			sent[key] = true
			finalTargets = append(finalTargets, t)
		}
	}

	adminID := getAdminID(r)
	count := len(finalTargets)

	writeJSONResponse(w, http.StatusOK, true, "Broadcast nilai siap diproses di background", map[string]interface{}{
		"count": count,
	})
	logger.Info(r.Context(), "broadcast nilai queued", logger.Field{
		"operation":   "notifications_broadcast_nilai",
		"count":       count,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})

	remoteAddr := r.RemoteAddr
	userAgent := r.UserAgent()

	go func() {
		for _, t := range finalTargets {
			msg := whatsapp.FormatNilaiRaport(t.Name, t.Semester, t.Year, t.FinalScore, t.GradeLetter)
			if err := whatsapp.SendMessage(t.Phone, msg); err == nil {
				logger.RecordActivity(&adminID, "SEND_WA_BROADCAST_NILAI", fmt.Sprintf("Broadcast nilai ke %s (%s)", t.Name, t.Phone), remoteAddr, userAgent)
			} else {
				logger.Error(r.Context(), "broadcast nilai send failed", logger.Field{"operation": "notifications_broadcast_nilai", "phone": t.Phone, "error": err.Error()})
			}
		}
	}()
}

// BroadcastPSB sends PSB status notifications to applicants with WA numbers.
func (h *Handler) BroadcastPSB(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "broadcast psb started", logger.Field{"operation": "notifications_broadcast_psb"})
	targets, err := h.repo.GetPSBStatus()
	if err != nil {
		logger.Error(r.Context(), "broadcast psb failed", logger.Field{"operation": "notifications_broadcast_psb", "error": err.Error()})
		writeJSONError(w, http.StatusInternalServerError, "Gagal memproses permintaan (Internal Server Error)")
		return
	}

	adminID := getAdminID(r)
	count := len(targets)

	writeJSONResponse(w, http.StatusOK, true, "Broadcast PSB siap diproses di background", map[string]interface{}{
		"count": count,
	})
	logger.Info(r.Context(), "broadcast psb queued", logger.Field{
		"operation":   "notifications_broadcast_psb",
		"count":       count,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})

	remoteAddr := r.RemoteAddr
	userAgent := r.UserAgent()

	go func() {
		for _, t := range targets {
			msg := whatsapp.FormatPSBStatus(t.Name, t.Status)
			if err := whatsapp.SendMessage(t.Phone, msg); err == nil {
				logger.RecordActivity(&adminID, "SEND_WA_BROADCAST_PSB", fmt.Sprintf("Broadcast PSB status ke %s (%s) - %s", t.Name, t.Phone, t.Status), remoteAddr, userAgent)
			} else {
				logger.Error(r.Context(), "broadcast psb send failed", logger.Field{"operation": "notifications_broadcast_psb", "phone": t.Phone, "error": err.Error()})
			}
		}
	}()
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
}
