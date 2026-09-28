package settings

import (
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"
	"encoding/json"
	"net/http"
	"slices"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
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

// heavySettings sengaja TIDAK ikut dikirim pada daftar settings umum.
// website_builder_revisions memuat riwayat revisi penuh (~380 KB, 91% dari
// seluruh payload settings) dan tidak ada consumer frontend maupun backend
// yang membacanya lewat daftar ini. Nilainya tetap utuh di database dan
// bisa diambil lewat endpoint khusus GET /settings/revisions.
var heavySettings = []string{"website_builder_revisions"}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.FindAll()
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	trimmed := make([]Setting, 0, len(list))
	for _, setting := range list {
		if slices.Contains(heavySettings, setting.Key) {
			continue
		}
		trimmed = append(trimmed, setting)
	}

	writeJSONResponse(w, http.StatusOK, true, "Pengaturan berhasil dimuat", trimmed)
}

// GetRevisions mengembalikan riwayat revisi website builder secara eksplisit.
// Dipisah dari GetAll supaya daftar settings tetap ringan tapi datanya tetap
// bisa diakses superadmin.
func (h *Handler) GetRevisions(w http.ResponseWriter, r *http.Request) {
	value, err := h.repo.GetByKey("website_builder_revisions")
	if err != nil || value == "" {
		value = "{}"
	}
	writeJSONResponse(w, http.StatusOK, true, "Riwayat revisi website builder berhasil dimuat", map[string]string{
		"key":   "website_builder_revisions",
		"value": value,
	})
}

func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.FindAll()
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	allowedKeys := []string{
		"school_name",
		"web_logo_url",
		"web_welcome_text",
		"berdiri",
		"yayasan",
		"nspp",
		"legalitas",
		"school_address",
		"school_phone",
		"school_email",
		"school_website",
		"whatsapp_admin_numbers",
		"social_instagram",
		"social_facebook",
		"social_youtube",
		"social_tiktok",
		"social_twitter",
		"welcome_speech_name",
		"welcome_speech_role",
		"welcome_speech_image",
		"welcome_speech_text",
		"hero_slides",
		"banner_title",
		"banner_subtitle",
		"banner_image_url",
		"banner_button_text",
		"banner_button_url",
		"psb_payment_bank_name",
		"psb_payment_account_number",
		"psb_payment_account_name",
		"psb_payment_amount",
		"psb_payment_note",
		"psb_payment_instructions",
		"psb_page_hero_title",
		"psb_page_hero_subtitle",
		"psb_page_requirements",
		"psb_page_quota_ikhwan",
		"psb_page_quota_akhwat",
		"psb_quota_smp",
		"psb_quota_smk",
		"psb_page_quota_smp",
		"psb_page_quota_smk",
		"psb_page_fee",
		"psb_page_address",
		"psb_page_wa",
		"spp_bank_name",
		"spp_account_number",
		"spp_account_holder",
		"donation_bank_name",
		"donation_account_number",
		"donation_account_holder",
		"donation_whatsapp",
		"website_builder_enabled",
		"website_builder_theme_published",
		"website_builder_shell_published",
		"website_builder_home_published",
		"website_builder_pages_published",
	}

	publicList := make([]Setting, 0, len(allowedKeys))
	for _, setting := range list {
		if slices.Contains(allowedKeys, setting.Key) {
			publicList = append(publicList, setting)
		}
	}

	writeJSONResponse(w, http.StatusOK, true, "Pengaturan publik berhasil dimuat", publicList)
}

// GetRolePermissions mengembalikan peta hak akses menu per role.
// Bisa dibaca semua user yang sudah login (bukan hanya superadmin)
// agar Sidebar tiap role bisa memfilter menu sesuai pengaturan.
func (h *Handler) GetRolePermissions(w http.ResponseWriter, r *http.Request) {
	value, err := h.repo.GetByKey("role_menu_permissions")
	if err != nil || value == "" {
		value = "{}"
	}
	writeJSONResponse(w, http.StatusOK, true, "Hak akses menu berhasil dimuat", map[string]string{
		"key":   "role_menu_permissions",
		"value": value,
	})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	var req struct {
		Value string `json:"value"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	if err := h.repo.Update(key, req.Value); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Setting updated", nil)
}

func (h *Handler) BatchUpdate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Settings []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"settings"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	if len(req.Settings) == 0 {
		writeJSONResponse(w, http.StatusBadRequest, false, "Minimal satu setting harus dikirim", nil)
		return
	}

	updates := make([]SettingUpdate, 0, len(req.Settings))
	for _, item := range req.Settings {
		if item.Key == "" {
			writeJSONResponse(w, http.StatusBadRequest, false, "Key setting tidak boleh kosong", nil)
			return
		}
		updates = append(updates, SettingUpdate{
			Key:   item.Key,
			Value: item.Value,
		})
	}

	if err := h.repo.UpdateMany(updates); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	writeJSONResponse(w, http.StatusOK, true, "Settings updated", nil)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/revisions", h.GetRevisions)
	r.Put("/batch", h.BatchUpdate)
	r.Put("/{key}", h.Update)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll() ([]Setting, error)
	Update(key, value string) error
	UpdateMany(updates []SettingUpdate) error
	GetByKey(key string) (string, error)
}
