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
