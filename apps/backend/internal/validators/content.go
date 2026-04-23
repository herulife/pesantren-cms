package validators

import (
	"regexp"
	"strings"
)

type ProgramRequest struct {
	Title      string `json:"title"`
	Slug       string `json:"slug"`
	Category   string `json:"category"`
	Excerpt    string `json:"excerpt"`
	Content    string `json:"content"`
	ImageURL   string `json:"image_url"`
	IsFeatured bool   `json:"is_featured"`
	OrderIndex int    `json:"order_index"`
}

type TeacherRequest struct {
	Name     string `json:"name"`
	Subject  string `json:"subject"`
	Bio      string `json:"bio"`
	ImageURL string `json:"image_url"`
	Email    string `json:"email"`
	WhatsApp string `json:"whatsapp"`
}

type GalleryRequest struct {
	Title        string `json:"title"`
	Category     string `json:"category"`
	AlbumName    string `json:"album_name"`
	AlbumSlug    string `json:"album_slug"`
	EventDate    string `json:"event_date"`
	ImageURL     string `json:"image_url"`
	IsAlbumCover bool   `json:"is_album_cover"`
}

type AgendaRequest struct {
	Title       string  `json:"title"`
	StartDate   string  `json:"start_date"`
	EndDate     *string `json:"end_date"`
	TimeInfo    *string `json:"time_info"`
	Location    *string `json:"location"`
	Description *string `json:"description"`
	Category    string  `json:"category"`
}

func ValidateProgramRequest(req *ProgramRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.Slug = NormalizeSlug(req.Slug)
	req.Category = NormalizeText(req.Category)
	req.Excerpt = NormalizeText(req.Excerpt)
	req.Content = NormalizeText(req.Content)
	req.ImageURL = NormalizeText(req.ImageURL)

	if len(req.Title) < 3 {
		errs.Add("title", "Judul minimal 3 karakter")
	}
	if req.Slug == "" {
		req.Slug = NormalizeSlug(req.Title)
	}
	if !ValidateSlug(req.Slug) {
		errs.Add("slug", "Slug tidak valid")
	}
	if req.ImageURL != "" && !ValidateMediaURL(req.ImageURL) {
		errs.Add("image_url", "URL gambar tidak valid")
	}
	if req.OrderIndex < 0 {
		errs.Add("order_index", "Order index tidak boleh negatif")
	}
	return errs
}

func ValidateTeacherRequest(req *TeacherRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Name = NormalizeText(req.Name)
	req.Subject = NormalizeText(req.Subject)
	req.Bio = NormalizeText(req.Bio)
	req.ImageURL = NormalizeText(req.ImageURL)

	if len(req.Name) < 3 {
		errs.Add("name", "Nama minimal 3 karakter")
	}
	if len(req.Subject) < 3 {
		errs.Add("subject", "Mata pelajaran minimal 3 karakter")
	}
	if req.ImageURL != "" && !ValidateMediaURL(req.ImageURL) {
		errs.Add("image_url", "URL gambar tidak valid")
	}
	if req.Email != "" && !ValidateEmail(req.Email) {
		errs.Add("email", "Format email tidak valid")
	}
	// WhatsApp normalization: remove spaces, dashes, etc.
	if req.WhatsApp != "" {
		cleaned := regexp.MustCompile(`[^0-9]`).ReplaceAllString(req.WhatsApp, "")
		if strings.HasPrefix(cleaned, "08") {
			cleaned = "628" + cleaned[2:]
		}
		if len(cleaned) < 10 {
			errs.Add("whatsapp", "Nomor WhatsApp tidak valid")
		} else {
			req.WhatsApp = cleaned
		}
	}
	return errs
}

func ValidateGalleryRequest(req *GalleryRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.Category = NormalizeText(req.Category)
	req.AlbumName = NormalizeText(req.AlbumName)
	req.AlbumSlug = NormalizeSlug(req.AlbumSlug)
	req.EventDate = NormalizeText(req.EventDate)
	req.ImageURL = NormalizeText(req.ImageURL)

	if len(req.Title) < 3 {
		errs.Add("title", "Judul minimal 3 karakter")
	}
	if req.AlbumName != "" && len(req.AlbumName) < 3 {
		errs.Add("album_name", "Nama album minimal 3 karakter")
	}
	if req.AlbumSlug == "" && req.AlbumName != "" {
		req.AlbumSlug = NormalizeSlug(req.AlbumName)
	}
	if req.AlbumSlug != "" && !ValidateSlug(req.AlbumSlug) {
		errs.Add("album_slug", "Slug album tidak valid")
	}
	if req.EventDate != "" && !ValidateDate(req.EventDate) {
		errs.Add("event_date", "Tanggal kegiatan harus berformat YYYY-MM-DD")
	}
	if req.ImageURL == "" || !ValidateMediaURL(req.ImageURL) {
		errs.Add("image_url", "URL gambar wajib valid")
	}
	return errs
}

func ValidateAgendaRequest(req *AgendaRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.Category = NormalizeText(req.Category)
	if req.TimeInfo != nil {
		value := NormalizeText(*req.TimeInfo)
		req.TimeInfo = &value
	}
	if req.Location != nil {
		value := NormalizeText(*req.Location)
		req.Location = &value
	}
	if req.Description != nil {
		value := NormalizeText(*req.Description)
		req.Description = &value
	}
	if req.EndDate != nil {
		value := NormalizeText(*req.EndDate)
		req.EndDate = &value
	}

	if len(req.Title) < 3 {
		errs.Add("title", "Judul minimal 3 karakter")
	}
	if !ValidateDate(req.StartDate) {
		errs.Add("start_date", "Tanggal mulai harus berformat YYYY-MM-DD")
	}
	if req.EndDate != nil && *req.EndDate != "" && !ValidateDate(*req.EndDate) {
		errs.Add("end_date", "Tanggal selesai harus berformat YYYY-MM-DD")
	}
	return errs
}
