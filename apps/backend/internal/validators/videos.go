package validators

import "strings"

type VideoRequest struct {
	Title      string `json:"title"`
	SeriesName string `json:"series_name"`
	SeriesSlug string `json:"series_slug"`
	EventDate  string `json:"event_date"`
	IsFeatured bool   `json:"is_featured"`
	URL        string `json:"url"`
	Thumbnail  string `json:"thumbnail"`
}

func ValidateVideoRequest(req *VideoRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Title = NormalizeText(req.Title)
	req.SeriesName = NormalizeText(req.SeriesName)
	req.SeriesSlug = NormalizeSlug(req.SeriesSlug)
	req.EventDate = strings.TrimSpace(req.EventDate)
	req.URL = strings.TrimSpace(req.URL)
	req.Thumbnail = strings.TrimSpace(req.Thumbnail)

	if len(req.Title) < 3 {
		errs.Add("title", "Judul minimal 3 karakter")
	}
	if req.SeriesName != "" && len(req.SeriesName) < 3 {
		errs.Add("series_name", "Nama series minimal 3 karakter")
	}
	if req.SeriesSlug == "" && req.SeriesName != "" {
		req.SeriesSlug = NormalizeSlug(req.SeriesName)
	}
	if req.SeriesSlug != "" && !ValidateSlug(req.SeriesSlug) {
		errs.Add("series_slug", "Slug series tidak valid")
	}
	if req.EventDate != "" && !ValidateDate(req.EventDate) {
		errs.Add("event_date", "Tanggal kegiatan harus berformat YYYY-MM-DD")
	}
	if !ValidateURL(req.URL) {
		errs.Add("url", "URL video tidak valid")
	}
	if !ValidateMediaURL(req.Thumbnail) {
		errs.Add("thumbnail", "URL thumbnail tidak valid")
	}
	return errs
}
