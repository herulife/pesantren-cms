package spp

import (
	"fmt"
	"net/http"
	"strconv"

	"darussunnah-api/internal/features/settings"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
)

// ConfigStore penyimpanan pengaturan tagihan otomatis (pakai tabel settings).
type ConfigStore interface {
	GetByKey(key string) (string, error)
	UpdateMany(updates []settings.SettingUpdate) error
}

const (
	autoEnabledKey = "spp_auto_enabled"
	autoAmountKey  = "spp_auto_amount"
	autoDueDayKey  = "spp_auto_due_day"
	autoWAKey      = "spp_auto_wa"
)

// WithConfigStore menempelkan penyimpanan pengaturan ke handler SPP.
func (h *Handler) WithConfigStore(store ConfigStore) *Handler {
	h.config = store
	return h
}

func readAutoSetting(store ConfigStore, key string) string {
	if store == nil {
		return ""
	}
	v, err := store.GetByKey(key)
	if err != nil {
		return ""
	}
	return v
}

// GetAutoConfig membaca konfigurasi tagihan SPP otomatis.
func (h *Handler) GetAutoConfig(w http.ResponseWriter, r *http.Request) {
	if h.config == nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	enabled, _ := strconv.ParseBool(readAutoSetting(h.config, autoEnabledKey))
	amount, _ := strconv.Atoi(readAutoSetting(h.config, autoAmountKey))
	dueDay, _ := strconv.Atoi(readAutoSetting(h.config, autoDueDayKey))
	wa, _ := strconv.ParseBool(readAutoSetting(h.config, autoWAKey))
	sendJSONResponse(w, http.StatusOK, true, "Berhasil", map[string]interface{}{
		"enabled":    enabled,
		"amount":     amount,
		"due_day":    dueDay,
		"wa_enabled": wa,
	})
}

// PutAutoConfig menyimpan konfigurasi tagihan SPP otomatis.
func (h *Handler) PutAutoConfig(w http.ResponseWriter, r *http.Request) {
	if h.config == nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	var req struct {
		Enabled   bool `json:"enabled"`
		Amount    int  `json:"amount"`
		DueDay    int  `json:"due_day"`
		WAEnabled bool `json:"wa_enabled"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if req.Amount <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Besar SPP harus lebih dari 0", nil)
		return
	}
	if req.DueDay < 1 || req.DueDay > 28 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Hari jatuh tempo harus 1-28", nil)
		return
	}

	updates := []settings.SettingUpdate{
		{Key: autoEnabledKey, Value: strconv.FormatBool(req.Enabled)},
		{Key: autoAmountKey, Value: strconv.Itoa(req.Amount)},
		{Key: autoDueDayKey, Value: strconv.Itoa(req.DueDay)},
		{Key: autoWAKey, Value: strconv.FormatBool(req.WAEnabled)},
	}
	if err := h.config.UpdateMany(updates); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	aid := adminID(r)
	logger.RecordActivity(&aid, "UPDATE_SPP_AUTO", fmt.Sprintf("Konfigurasi tagihan SPP otomatis: aktif=%t, nominal=%d, jatuh tempo tgl %d, WA=%t", req.Enabled, req.Amount, req.DueDay, req.WAEnabled), r.RemoteAddr, r.UserAgent())
	sendJSONResponse(w, http.StatusOK, true, "Pengaturan tagihan otomatis disimpan", nil)
}