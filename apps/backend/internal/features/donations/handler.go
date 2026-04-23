package donations

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/platform/whatsapp"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

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

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetCampaigns(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "donation campaigns list started", logger.Field{"operation": "donations_campaigns_list"})
	activeOnly := r.URL.Query().Get("active_only") == "true"
	search := r.URL.Query().Get("search")
	list, err := h.repo.FindAllCampaigns(activeOnly, search)
	if err != nil {
		logger.Error(r.Context(), "donation campaigns list failed", logger.Field{"operation": "donations_campaigns_list", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "donation campaigns list completed", logger.Field{
		"operation":   "donations_campaigns_list",
		"count":       len(list),
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Daftar program donasi berhasil dimuat", list)
}

func (h *Handler) GetDonations(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "donations list started", logger.Field{"operation": "donations_list"})
	campaignID, _ := strconv.Atoi(r.URL.Query().Get("campaign_id"))
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	list, err := h.repo.FindAllDonations(campaignID, status, search)
	if err != nil {
		logger.Error(r.Context(), "donations list failed", logger.Field{"operation": "donations_list", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "donations list completed", logger.Field{
		"operation":   "donations_list",
		"count":       len(list),
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Daftar donasi berhasil dimuat", list)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "donation campaign create started", logger.Field{"operation": "donations_campaign_create"})
	var c Campaign
	if err := validators.DecodeJSON(w, r, &c); err != nil {
		logger.Warn(r.Context(), "donation campaign create rejected", logger.Field{"operation": "donations_campaign_create"})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}

	if err := h.repo.CreateCampaign(&c); err != nil {
		logger.Error(r.Context(), "donation campaign create failed", logger.Field{"operation": "donations_campaign_create", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "donation campaign create completed", logger.Field{
		"operation":   "donations_campaign_create",
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusCreated, true, "Program donasi berhasil ditambahkan", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	logger.Info(r.Context(), "donation campaign delete started", logger.Field{"operation": "donations_campaign_delete", "campaign_id": id})
	if err := h.repo.DeleteCampaign(id); err != nil {
		logger.Error(r.Context(), "donation campaign delete failed", logger.Field{"operation": "donations_campaign_delete", "campaign_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "donation campaign delete completed", logger.Field{
		"operation":   "donations_campaign_delete",
		"campaign_id": id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Program donasi berhasil dihapus", nil)
}

func (h *Handler) VerifyDonation(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	logger.Info(r.Context(), "donation verify started", logger.Field{"operation": "donations_verify", "donation_id": id})

	// Get donation details for notification BEFORE verification if needed, or after
	donation, err := h.repo.FindDonationByID(id)
	if err != nil {
		logger.Warn(r.Context(), "donation verify not found", logger.Field{"operation": "donations_verify", "donation_id": id})
		sendJSONResponse(w, http.StatusNotFound, false, "Donasi tidak ditemukan", nil)
		return
	}

	// In a real app, we would get the admin ID from the context/session
	adminID := 1

	if err := h.repo.VerifyDonation(id, adminID); err != nil {
		logger.Error(r.Context(), "donation verify failed", logger.Field{"operation": "donations_verify", "donation_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Send WA Notification
	if donation.DonorPhone != "" {
		msg := whatsapp.FormatDonasiSukses(donation.DonorName, int(donation.Amount), donation.CampaignTitle)
		go func() {
			if err := whatsapp.SendMessage(donation.DonorPhone, msg); err != nil {
				logger.Error(context.Background(), "donation whatsapp notification failed", logger.Field{"operation": "donations_verify_notify", "phone": donation.DonorPhone, "error": err.Error()})
			}
		}()
	}

	logger.Info(r.Context(), "donation verify completed", logger.Field{
		"operation":   "donations_verify",
		"donation_id": id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Donasi berhasil diverifikasi dan notifikasi dikirim", nil)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/campaigns", h.GetCampaigns)
	r.Post("/campaigns", h.Create)
	r.Delete("/campaigns/{id}", h.Delete)
	r.Get("/list", h.GetDonations)
	r.Put("/verify/{id}", h.VerifyDonation)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAllCampaigns(activeOnly bool, search string) ([]Campaign, error)
	FindAllDonations(campaignID int, status, search string) ([]Donation, error)
	FindDonationByID(id int) (*Donation, error)
	VerifyDonation(id int, verifiedBy int) error
	CreateCampaign(c *Campaign) error
	DeleteCampaign(id int) error
	UpdateCampaignAmount(id int, amount float64) error
}
