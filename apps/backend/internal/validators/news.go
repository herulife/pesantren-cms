package validators

import "strings"

type NewsRequest struct {
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Content  string `json:"content"`
	Excerpt  string `json:"excerpt"`
	Status   string `json:"status"`
	ImageURL string `json:"image_url"`
}

func ValidateNewsRequest(req *NewsRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.Slug = NormalizeSlug(req.Slug)
	req.Content = strings.TrimSpace(req.Content)
	req.Excerpt = NormalizeText(req.Excerpt)
	req.Status = NormalizeText(req.Status)
	req.ImageURL = strings.TrimSpace(req.ImageURL)

	if len(req.Title) < 5 {
		errs.Add("title", "Judul minimal 5 karakter")
	}
	if req.Slug == "" {
		req.Slug = NormalizeSlug(req.Title)
	}
	if !ValidateSlug(req.Slug) {
		errs.Add("slug", "Slug hanya boleh huruf kecil, angka, dan tanda hubung")
	}
	if len(req.Content) < 20 {
		errs.Add("content", "Konten minimal 20 karakter")
	}
	if req.Status == "" {
		req.Status = "draft"
	}
	switch req.Status {
	case "draft", "published", "trash":
	default:
		errs.Add("status", "Status tidak valid")
	}
	if req.ImageURL != "" && !ValidateMediaURL(req.ImageURL) {
		errs.Add("image_url", "URL gambar tidak valid")
	}
	return errs
}
