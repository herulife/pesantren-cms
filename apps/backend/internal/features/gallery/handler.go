package gallery

import (
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

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

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if r.URL.Query().Get("limit") != "" && err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Parameter 'limit' tidak valid", nil)
		return
	}
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if r.URL.Query().Get("offset") != "" && err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Parameter 'offset' tidak valid", nil)
		return
	}

	if limit == 0 {
		limit = 12
	}

	gallery, total, err := h.repo.FindAll(category, search, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if gallery == nil {
		gallery = make([]GalleryItem, 0)
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar galeri berhasil dimuat", map[string]interface{}{
		"items": gallery,
		"pagination": map[string]int{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

// GetMeta returns album metadata (including Drive links) for all albums
func (h *Handler) GetMeta(w http.ResponseWriter, r *http.Request) {
	meta, err := h.repo.GetAllMeta()
	if err != nil {
		logger.Error(r.Context(), "GetMeta error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal mengambil metadata album", nil)
		return
	}
	if meta == nil {
		meta = []GalleryAlbumMeta{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Metadata album berhasil dimuat", map[string]interface{}{
		"albums": meta,
	})
}

// UpdateMeta updates album metadata (Drive URL, description, etc.)
func (h *Handler) UpdateMeta(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		sendJSONResponse(w, http.StatusBadRequest, false, "Slug album diperlukan", nil)
		return
	}

	var payload struct {
		AlbumName     string `json:"album_name"`
		EventDate     string `json:"event_date"`
		Category      string `json:"category"`
		Description   string `json:"description"`
		DriveURL      string `json:"drive_url"`
		DriveFolderID string `json:"drive_folder_id"`
		IsActive      bool   `json:"is_active"`
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Format JSON tidak valid", nil)
		return
	}

	meta := &GalleryAlbumMeta{
		AlbumSlug:     slug,
		AlbumName:     payload.AlbumName,
		EventDate:     payload.EventDate,
		Category:      payload.Category,
		Description:   payload.Description,
		DriveURL:      payload.DriveURL,
		DriveFolderID: payload.DriveFolderID,
		IsActive:      payload.IsActive,
	}

	// If album doesn't exist yet, upsert it
	h.repo.UpsertMeta(slug, payload.AlbumName)

	if err := h.repo.UpdateMeta(slug, meta); err != nil {
		logger.Error(r.Context(), "UpdateMeta error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal update metadata album", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Metadata album berhasil diperbarui", nil)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var item GalleryItem
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if err := validators.DecodeStrictJSON(body, &item); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	request := validators.GalleryRequest{
		Title:        item.Title,
		Category:     item.Category,
		AlbumName:    item.AlbumName,
		AlbumSlug:    item.AlbumSlug,
		EventDate:    item.EventDate,
		ImageURL:     item.ImageURL,
		IsAlbumCover: item.IsAlbumCover,
	}
	if validationErrs := validators.ValidateGalleryRequest(&request); len(validationErrs) > 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}
	item.Title = request.Title
	item.Category = request.Category
	item.AlbumName = request.AlbumName
	item.AlbumSlug = request.AlbumSlug
	item.EventDate = request.EventDate
	item.ImageURL = request.ImageURL

	if err := h.repo.Create(&item); err != nil {
		if errors.Is(err, ErrDuplicateGalleryItem) {
			sendJSONResponse(w, http.StatusConflict, false, "Foto yang sama sudah ada di album ini", nil)
			return
		}
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, "Item galeri berhasil ditambahkan", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID galeri tidak valid", nil)
		return
	}
	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Item galeri berhasil dihapus", nil)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Post("/", h.Create)
	r.Delete("/{id}", h.Delete)
	// Album metadata routes (public + admin)
	r.Get("/albums/metadata", h.GetMeta)
	r.Put("/albums/{slug}", h.UpdateMeta)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(category, search string, limit, offset int) ([]GalleryItem, int, error)
	GetAllMeta() ([]GalleryAlbumMeta, error)
	UpdateMeta(slug string, meta *GalleryAlbumMeta) error
	UpsertMeta(slug, name string) error
	Create(item *GalleryItem) error
	Delete(id int) error
}
