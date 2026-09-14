package donations

import (
	"context"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/whatsapp"
	"almaparung-api/internal/validators"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
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

func (h *Handler) GetCampaign(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	logger.Info(r.Context(), "donation campaign get started", logger.Field{"operation": "donations_campaign_get", "campaign_id": id})
	c, err := h.repo.FindCampaignByID(id)
	if err != nil {
		logger.Error(r.Context(), "donation campaign get failed", logger.Field{"operation": "donations_campaign_get", "campaign_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusNotFound, false, "Program donasi tidak ditemukan", nil)
		return
	}
	logger.Info(r.Context(), "donation campaign get completed", logger.Field{"operation": "donations_campaign_get", "campaign_id": id, "duration_ms": time.Since(startedAt).Milliseconds()})
	sendJSONResponse(w, http.StatusOK, true, "Program donasi berhasil dimuat", c)
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
	donationType := r.URL.Query().Get("type")

	list, err := h.repo.FindAllDonations(campaignID, status, search, donationType)
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
	sendJSONResponse(w, http.StatusOK, true, "Daftar donasi berhasil dimuat", toPublicList(list))
}

func parseEndDate(raw json.RawMessage) (*time.Time, error) {
	if len(raw) == 0 || string(raw) == "null" || string(raw) == `""` {
		return nil, nil
	}
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil, err
	}
	if s == "" {
		return nil, nil
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02", "2006-01-02T15:04:05Z07:00"} {
		if t, err := time.Parse(layout, s); err == nil {
			return &t, nil
		}
	}
	return nil, fmt.Errorf("invalid date format: %s", s)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "donation campaign create started", logger.Field{"operation": "donations_campaign_create"})
	var raw map[string]json.RawMessage
	if err := validators.DecodeJSON(w, r, &raw); err != nil {
		logger.Warn(r.Context(), "donation campaign create rejected", logger.Field{"operation": "donations_campaign_create"})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	var c Campaign
	// decode with custom end_date handling
	if v, ok := raw["end_date"]; ok {
		if t, err := parseEndDate(v); err != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Format tanggal tidak valid (YYYY-MM-DD)", nil)
			return
		} else {
			c.EndDate = t
		}
		delete(raw, "end_date")
	}
	// re-marshal remaining and decode to Campaign
	rem, _ := json.Marshal(raw)
	_ = json.Unmarshal(rem, &c)
	req := validators.CampaignRequest{Title: c.Title, Description: c.Description, TargetAmount: c.TargetAmount, ImageURL: c.ImageURL, IsActive: c.IsActive, EndDate: c.EndDate}
	if errs := validators.ValidateCampaignRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
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

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	logger.Info(r.Context(), "donation campaign update started", logger.Field{"operation": "donations_campaign_update", "campaign_id": id})
	var raw map[string]json.RawMessage
	if err := validators.DecodeJSON(w, r, &raw); err != nil {
		logger.Warn(r.Context(), "donation campaign update rejected", logger.Field{"operation": "donations_campaign_update"})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	var c Campaign
	if v, ok := raw["end_date"]; ok {
		if t, err := parseEndDate(v); err != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Format tanggal tidak valid (YYYY-MM-DD)", nil)
			return
		} else {
			c.EndDate = t
		}
		delete(raw, "end_date")
	}
	rem, _ := json.Marshal(raw)
	_ = json.Unmarshal(rem, &c)
	c.ID = id
	req := validators.CampaignRequest{Title: c.Title, Description: c.Description, TargetAmount: c.TargetAmount, ImageURL: c.ImageURL, IsActive: c.IsActive, EndDate: c.EndDate}
	if errs := validators.ValidateCampaignRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	if err := h.repo.UpdateCampaign(&c); err != nil {
		logger.Error(r.Context(), "donation campaign update failed", logger.Field{"operation": "donations_campaign_update", "campaign_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	logger.Info(r.Context(), "donation campaign update completed", logger.Field{
		"operation":   "donations_campaign_update",
		"campaign_id": id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Program donasi berhasil diperbarui", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	logger.Info(r.Context(), "donation campaign delete started", logger.Field{"operation": "donations_campaign_delete", "campaign_id": id})
	if err := h.repo.DeleteCampaign(id); err != nil {
		if errors.Is(err, ErrCampaignHasTransactions) {
			sendJSONResponse(w, http.StatusConflict, false, "Program donasi memiliki transaksi dan tidak bisa dihapus. Nonaktifkan saja.", nil)
			return
		}
		logger.Error(r.Context(), "donation campaign delete failed", logger.Field{"operation": "donations_campaign_delete", "campaign_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: actorID, ActorRole: actorRole,
		Action: "DELETE_CAMPAIGN", Entity: "donation_campaign", EntityID: strconv.Itoa(id),
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
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

	// PHASE 2: actor wajib dari authenticated context (hapus hardcoded adminID:=1).
	adminID, ok := auth.GetAuthenticatedUserID(r.Context())
	if !ok {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Akses belum diizinkan", nil)
		return
	}

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
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: adminID, ActorRole: actorRole,
		Action: "VERIFY_DONATION", Entity: "donation", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"status": "verified"},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Donasi berhasil diverifikasi dan notifikasi dikirim", nil)
}

func (h *Handler) GetDonors(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	list, err := h.repo.FindAllDonors(search)
	if err != nil {
		logger.Error(r.Context(), "donors list failed", logger.Field{"operation": "donors_list", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if list == nil {
		list = []Donor{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar donatur berhasil dimuat", list)
}

func (h *Handler) CreateDonor(w http.ResponseWriter, r *http.Request) {
	var req validators.DonorRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if errs := validators.ValidateDonorRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	d := &Donor{Name: req.Name, Address: req.Address, Phone: req.Phone, Notes: req.Notes}
	if err := h.repo.CreateDonor(d); err != nil {
		logger.Error(r.Context(), "donor create failed", logger.Field{"operation": "donor_create", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, "Donatur berhasil ditambahkan", nil)
}

func (h *Handler) UpdateDonor(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req validators.DonorRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if errs := validators.ValidateDonorRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	d := &Donor{ID: id, Name: req.Name, Address: req.Address, Phone: req.Phone, Notes: req.Notes}
	if err := h.repo.UpdateDonor(d); err != nil {
		logger.Error(r.Context(), "donor update failed", logger.Field{"operation": "donor_update", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Donatur berhasil diperbarui", nil)
}

func (h *Handler) DeleteDonor(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteDonor(id); err != nil {
		logger.Error(r.Context(), "donor delete failed", logger.Field{"operation": "donor_delete", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Donatur berhasil dihapus", nil)
}

func (h *Handler) CreateDonation(w http.ResponseWriter, r *http.Request) {
	var req validators.DonationRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if errs := validators.ValidateDonationRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	d := &Donation{
		CampaignID: req.CampaignID, DonorName: req.DonorName, DonorPhone: req.DonorPhone,
		Amount: req.Amount, Type: req.Type, PaymentMethod: req.Method, ProofURL: req.ProofURL, Notes: req.Notes,
	}
	if req.DonorID > 0 {
		donor, err := h.repo.FindDonorByID(req.DonorID)
		if err != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Donatur tidak ditemukan", nil)
			return
		}
		d.DonorID = &req.DonorID
		if d.DonorName == "" {
			d.DonorName = donor.Name
		}
		if d.DonorPhone == "" {
			d.DonorPhone = donor.Phone
		}
	}
	if d.PaymentMethod == "" {
		d.PaymentMethod = "transfer"
	}
	if _, err := h.repo.CreateDonation(d); err != nil {
		logger.Error(r.Context(), "donation create failed", logger.Field{"operation": "donation_create", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, "Transaksi donasi berhasil dicatat", nil)
}

func (h *Handler) UpdateDonation(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req validators.DonationRequest
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if errs := validators.ValidateDonationRequest(&req); errs != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Validasi gagal", "errors": errs})
		return
	}
	d := &Donation{
		ID: id, CampaignID: req.CampaignID, DonorName: req.DonorName, DonorPhone: req.DonorPhone,
		Amount: req.Amount, Type: req.Type, PaymentMethod: req.Method, ProofURL: req.ProofURL, Notes: req.Notes,
	}
	if req.DonorID > 0 {
		if _, err := h.repo.FindDonorByID(req.DonorID); err != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Donatur tidak ditemukan", nil)
			return
		}
		d.DonorID = &req.DonorID
	}
	if err := h.repo.UpdateDonation(d); err != nil {
		if err == errDonationLocked {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Transaksi tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "donation update failed", logger.Field{"operation": "donation_update", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Transaksi donasi berhasil diperbarui", nil)
}

func (h *Handler) DeleteDonation(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteDonation(id); err != nil {
		if err == errDonationLocked {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Transaksi tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "donation delete failed", logger.Field{"operation": "donation_delete", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Transaksi donasi berhasil dihapus", nil)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/campaigns", h.GetCampaigns)
	r.Get("/campaigns/{id}", h.GetCampaign)
	r.Post("/campaigns", h.Create)
	r.Put("/campaigns/{id}", h.Update)
	r.Delete("/campaigns/{id}", h.Delete)
	r.Get("/list", h.GetDonations)
	r.Post("/list", h.CreateDonation)
	r.Put("/list/{id}", h.UpdateDonation)
	r.Delete("/list/{id}", h.DeleteDonation)
	r.Put("/verify/{id}", h.VerifyDonation)
	r.Get("/donors", h.GetDonors)
	r.Post("/donors", h.CreateDonor)
	r.Put("/donors/{id}", h.UpdateDonor)
	r.Delete("/donors/{id}", h.DeleteDonor)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAllCampaigns(activeOnly bool, search string) ([]Campaign, error)
	FindCampaignByID(id int) (*Campaign, error)
	FindAllDonations(campaignID int, status, search, donationType string) ([]Donation, error)
	FindDonationByID(id int) (*Donation, error)
	CreateDonation(d *Donation) (int64, error)
	UpdateDonation(d *Donation) error
	DeleteDonation(id int) error
	VerifyDonation(id int, verifiedBy int) error
	CreateCampaign(c *Campaign) error
	UpdateCampaign(c *Campaign) error
	DeleteCampaign(id int) error
	UpdateCampaignAmount(id int, amount float64) error
	FindAllDonors(search string) ([]Donor, error)
	FindDonorByID(id int) (*Donor, error)
	CreateDonor(d *Donor) error
	UpdateDonor(d *Donor) error
	DeleteDonor(id int) error
}
