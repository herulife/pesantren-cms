package validators

import (
	"strings"
	"time"
)

type CampaignRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	TargetAmount float64 `json:"target_amount"`
	ImageURL    string  `json:"image_url"`
	IsActive    int     `json:"is_active"`
	EndDate     *time.Time `json:"end_date"`
}

func ValidateCampaignRequest(req *CampaignRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.ImageURL = strings.TrimSpace(req.ImageURL)
	if len(req.Title) < 5 {
		errs.Add("title", "Judul minimal 5 karakter")
	}
	if len(req.Title) > 200 {
		errs.Add("title", "Judul maksimal 200 karakter")
	}
	if len(req.Description) < 10 {
		errs.Add("description", "Deskripsi minimal 10 karakter")
	}
	if req.TargetAmount <= 0 {
		errs.Add("target_amount", "Target dana harus lebih dari 0")
	}
	if req.TargetAmount > 1000000000000 {
		errs.Add("target_amount", "Target dana terlalu besar")
	}
	if req.ImageURL != "" && !ValidateMediaURL(req.ImageURL) {
		errs.Add("image_url", "URL gambar tidak valid")
	}
	if req.IsActive != 0 && req.IsActive != 1 {
		errs.Add("is_active", "Status harus 0 atau 1")
	}
	if req.EndDate != nil && req.EndDate.Before(time.Now().Truncate(24*time.Hour)) {
		errs.Add("end_date", "Tenggat waktu harus di masa depan")
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

type DonorRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
	Notes   string `json:"notes"`
}

func ValidateDonorRequest(req *DonorRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Name = NormalizeText(req.Name)
	req.Address = strings.TrimSpace(req.Address)
	req.Phone = strings.TrimSpace(req.Phone)
	req.Notes = strings.TrimSpace(req.Notes)
	if len(req.Name) < 3 {
		errs.Add("name", "Nama donatur minimal 3 karakter")
	}
	if len(req.Name) > 200 {
		errs.Add("name", "Nama donatur maksimal 200 karakter")
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

type DonationRequest struct {
	CampaignID int     `json:"campaign_id"`
	DonorID    int     `json:"donor_id"`
	DonorName  string  `json:"donor_name"`
	DonorPhone string  `json:"donor_phone"`
	Amount     float64 `json:"amount"`
	Type       string  `json:"type"`
	Method     string  `json:"method"`
	ProofURL   string  `json:"proof_url"`
	Notes      string  `json:"notes"`
}

func ValidateDonationRequest(req *DonationRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.DonorName = NormalizeText(req.DonorName)
	req.DonorPhone = strings.TrimSpace(req.DonorPhone)
	req.Type = NormalizeText(req.Type)
	req.Method = strings.TrimSpace(req.Method)
	req.ProofURL = strings.TrimSpace(req.ProofURL)
	req.Notes = strings.TrimSpace(req.Notes)
	if req.CampaignID <= 0 {
		errs.Add("campaign_id", "Program kampanye wajib dipilih")
	}
	if req.DonorID <= 0 && req.DonorName == "" {
		errs.Add("donor_name", "Donatur wajib dipilih atau isi nama donatur")
	}
	if req.Amount <= 0 {
		errs.Add("amount", "Nominal donasi harus lebih dari 0")
	}
	if req.Amount > 1000000000000 {
		errs.Add("amount", "Nominal donasi terlalu besar")
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}
