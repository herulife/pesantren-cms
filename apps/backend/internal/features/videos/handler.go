package videos

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type VideoRepository interface {
	FindAll(search string, limit, offset int) ([]Video, int, error)
	Create(v *Video) error
	Update(id int, v *Video) error
	Delete(id int) error
}

type Handler struct {
	repo VideoRepository
}

func writeJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}, pagination interface{}, correlationID string) {
	w.Header().Set("Content-Type", "application/json")
	if correlationID != "" {
		w.Header().Set("X-Correlation-ID", correlationID)
	}
	w.WriteHeader(status)
	response := map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	}
	if pagination != nil {
		response["pagination"] = pagination
	}
	json.NewEncoder(w).Encode(response)
}

func writeValidationError(w http.ResponseWriter, errors interface{}, correlationID string) {
	writeJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", errors, nil, correlationID)
}

func NewHandler(repo VideoRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	limit, err := strconv.Atoi(limitStr)
	if limitStr != "" && err != nil {
		logger.Warn(r.Context(), "Invalid limit param", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusBadRequest, false, "Parameter 'limit' tidak valid", nil, nil, correlationID)
		return
	}
	offset, err := strconv.Atoi(offsetStr)
	if offsetStr != "" && err != nil {
		logger.Warn(r.Context(), "Invalid offset param", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusBadRequest, false, "Parameter 'offset' tidak valid", nil, nil, correlationID)
		return
	}
	if limit == 0 {
		limit = 9
	}
	videos, total, err := h.repo.FindAll(search, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil, nil, correlationID)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar video berhasil dimuat", videos, map[string]int{
		"total":  total,
		"limit":  limit,
		"offset": offset,
	}, correlationID)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil, nil, correlationID)
		return
	}

	var v Video
	if err := validators.DecodeStrictJSON(body, &v); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil, nil, correlationID)
		return
	}
	request := validators.VideoRequest{
		Title:      v.Title,
		SeriesName: v.SeriesName,
		SeriesSlug: v.SeriesSlug,
		EventDate:  v.EventDate,
		IsFeatured: v.IsFeatured,
		URL:        v.URL,
		Thumbnail:  v.Thumbnail,
	}
	if validationErrs := validators.ValidateVideoRequest(&request); len(validationErrs) > 0 {
		writeValidationError(w, validationErrs, correlationID)
		return
	}
	v.Title = request.Title
	v.SeriesName = request.SeriesName
	v.SeriesSlug = request.SeriesSlug
	v.EventDate = request.EventDate
	v.IsFeatured = request.IsFeatured
	v.URL = request.URL
	v.Thumbnail = request.Thumbnail
	if err := h.repo.Create(&v); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil, nil, correlationID)
		return
	}
	writeJSONResponse(w, http.StatusCreated, true, "Video berhasil ditambahkan", nil, nil, correlationID)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		logger.Warn(r.Context(), "Invalid id param", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusBadRequest, false, "Parameter 'id' tidak valid", nil, nil, correlationID)
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil, nil, correlationID)
		return
	}

	var v Video
	if err := validators.DecodeStrictJSON(body, &v); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil, nil, correlationID)
		return
	}
	request := validators.VideoRequest{
		Title:      v.Title,
		SeriesName: v.SeriesName,
		SeriesSlug: v.SeriesSlug,
		EventDate:  v.EventDate,
		IsFeatured: v.IsFeatured,
		URL:        v.URL,
		Thumbnail:  v.Thumbnail,
	}
	if validationErrs := validators.ValidateVideoRequest(&request); len(validationErrs) > 0 {
		writeValidationError(w, validationErrs, correlationID)
		return
	}
	v.Title = request.Title
	v.SeriesName = request.SeriesName
	v.SeriesSlug = request.SeriesSlug
	v.EventDate = request.EventDate
	v.IsFeatured = request.IsFeatured
	v.URL = request.URL
	v.Thumbnail = request.Thumbnail
	if err := h.repo.Update(id, &v); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil, nil, correlationID)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Video berhasil diperbarui", nil, nil, correlationID)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	correlationID := r.Header.Get("X-Correlation-ID")
	if correlationID == "" {
		correlationID = uuid.New().String()
	}
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		logger.Warn(r.Context(), "Invalid id param", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusBadRequest, false, "Parameter 'id' tidak valid", nil, nil, correlationID)
		return
	}
	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil, nil, correlationID)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Video berhasil dihapus", nil, nil, correlationID)
}

// Untuk mengaktifkan autentikasi, wrap handler dengan auth.AuthMiddleware
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(auth.AuthMiddleware) // Autentikasi JWT diaktifkan
	r.Get("/", h.GetAll)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(search string, limit, offset int) ([]Video, int, error)
	Create(v *Video) error
	Update(id int, v *Video) error
	Delete(id int) error
}
