package news

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/ai"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

type Handler struct {
	repo IRepository
}

type newsPayload struct {
	Title      string `json:"title"`
	Slug       string `json:"slug"`
	Content    string `json:"content"`
	Excerpt    string `json:"excerpt"`
	Status     string `json:"status"`
	ImageURL   string `json:"image_url"`
	CategoryID int64  `json:"category_id"`
}

func claimUserID(value interface{}) int {
	claims, ok := value.(jwt.MapClaims)
	if !ok {
		return 0
	}

	switch id := claims["id"].(type) {
	case float64:
		return int(id)
	case float32:
		return int(id)
	case int:
		return id
	case int64:
		return int(id)
	case string:
		parsed, err := strconv.Atoi(strings.TrimSpace(id))
		if err == nil {
			return parsed
		}
	}

	return 0
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
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if err != nil || offset < 0 {
		offset = 0
	}

	newsList, total, err := h.repo.FindAll(status, category, search, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	sendJSONResponse(w, http.StatusOK, true, "Daftar berita berhasil dimuat", map[string]interface{}{
		"items": newsList,
		"pagination": map[string]int{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	n, err := h.repo.FindByID(id)
	if err != nil {
		sendJSONResponse(w, http.StatusNotFound, false, "Berita tidak ditemukan", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Detail berita berhasil dimuat", n)
}

func (h *Handler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	n, err := h.repo.FindBySlug(slug)
	if err != nil {
		sendJSONResponse(w, http.StatusNotFound, false, "Berita tidak ditemukan", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Detail berita berhasil dimuat", n)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}

	var payload newsPayload
	if err := validators.DecodeStrictJSON(body, &payload); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	logger.Info(r.Context(), "news create payload received", logger.Field{"title": payload.Title, "slug": payload.Slug})

	request := validators.NewsRequest{
		Title:    payload.Title,
		Slug:     payload.Slug,
		Content:  payload.Content,
		Excerpt:  payload.Excerpt,
		Status:   payload.Status,
		ImageURL: payload.ImageURL,
	}
	if validationErrs := validators.ValidateNewsRequest(&request); len(validationErrs) > 0 {
		logger.Warn(r.Context(), "news create validation error", logger.Field{"errors": fmt.Sprintf("%+v", validationErrs)})
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}
	uniqueSlug, err := h.repo.EnsureUniqueSlug(request.Slug, 0)
	if err != nil {
		logger.Error(r.Context(), "news create slug error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses slug berita", nil)
		return
	}
	request.Slug = uniqueSlug
	logger.Info(r.Context(), "news create request prepared", logger.Field{"slug": request.Slug, "status": request.Status})

	n := News{
		Title:   request.Title,
		Slug:    request.Slug,
		Content: request.Content,
		Excerpt: request.Excerpt,
		Status:  request.Status,
		ImageURL: sql.NullString{
			String: request.ImageURL,
			Valid:  request.ImageURL != "",
		},
		CategoryID: sql.NullInt64{
			Int64: payload.CategoryID,
			Valid: payload.CategoryID > 0,
		},
	}
	n.AuthorID = claimUserID(r.Context().Value(auth.UserContextKey))
	logger.Info(r.Context(), "news create model", logger.Field{"title": n.Title, "slug": n.Slug, "status": n.Status, "author_id": n.AuthorID})

	if err := h.repo.Create(&n); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := claimUserID(r.Context().Value(auth.UserContextKey))
	logger.RecordActivity(&adminID, "CREATE_NEWS", fmt.Sprintf("Membuat berita baru: %s", n.Title), r.RemoteAddr, r.UserAgent())

	sendJSONResponse(w, http.StatusCreated, true, "Berita berhasil ditambahkan", nil)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var payload newsPayload
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if err := validators.DecodeStrictJSON(body, &payload); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	logger.Info(r.Context(), "news update payload received", logger.Field{"id": id, "title": payload.Title})

	request := validators.NewsRequest{
		Title:    payload.Title,
		Slug:     payload.Slug,
		Content:  payload.Content,
		Excerpt:  payload.Excerpt,
		Status:   payload.Status,
		ImageURL: payload.ImageURL,
	}
	if validationErrs := validators.ValidateNewsRequest(&request); len(validationErrs) > 0 {
		logger.Warn(r.Context(), "news update validation error", logger.Field{"id": id, "errors": fmt.Sprintf("%+v", validationErrs)})
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}
	uniqueSlug, err := h.repo.EnsureUniqueSlug(request.Slug, id)
	if err != nil {
		logger.Error(r.Context(), "news update slug error", logger.Field{"id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses slug berita", nil)
		return
	}
	request.Slug = uniqueSlug
	logger.Info(r.Context(), "news update request prepared", logger.Field{"id": id, "slug": request.Slug})

	n := News{
		Title:   request.Title,
		Slug:    request.Slug,
		Content: request.Content,
		Excerpt: request.Excerpt,
		Status:  request.Status,
		ImageURL: sql.NullString{
			String: request.ImageURL,
			Valid:  request.ImageURL != "",
		},
		CategoryID: sql.NullInt64{
			Int64: payload.CategoryID,
			Valid: payload.CategoryID > 0,
		},
	}
	n.AuthorID = claimUserID(r.Context().Value(auth.UserContextKey))
	logger.Info(r.Context(), "news update model", logger.Field{"id": id, "title": n.Title, "slug": n.Slug, "status": n.Status, "author_id": n.AuthorID})

	if err := h.repo.Update(id, &n); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			sendJSONResponse(w, http.StatusNotFound, false, "Berita tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := claimUserID(r.Context().Value(auth.UserContextKey))
	logger.RecordActivity(&adminID, "UPDATE_NEWS", fmt.Sprintf("Memperbarui berita ID %d: %s", id, n.Title), r.RemoteAddr, r.UserAgent())

	sendJSONResponse(w, http.StatusOK, true, "Berita berhasil diperbarui", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.SoftDelete(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}

	// Log activity
	adminID := claimUserID(r.Context().Value(auth.UserContextKey))
	logger.RecordActivity(&adminID, "DELETE_NEWS", fmt.Sprintf("Menghapus (soft-delete) berita ID %d", id), r.RemoteAddr, r.UserAgent())

	sendJSONResponse(w, http.StatusOK, true, "Berita berhasil dipindahkan ke sampah", nil)
}

func (h *Handler) Restore(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.Restore(id); err != nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memulihkan berita", nil)
		return
	}

	// Log activity
	adminID := claimUserID(r.Context().Value(auth.UserContextKey))
	logger.RecordActivity(&adminID, "RESTORE_NEWS", fmt.Sprintf("Memulihkan berita ID %d", id), r.RemoteAddr, r.UserAgent())

	sendJSONResponse(w, http.StatusOK, true, "Berita berhasil dipulihkan", nil)
}

func (h *Handler) ForceDelete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.ForceDelete(id); err != nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus berita secara permanen", nil)
		return
	}

	// Log activity
	adminID := claimUserID(r.Context().Value(auth.UserContextKey))
	logger.RecordActivity(&adminID, "FORCE_DELETE_NEWS", fmt.Sprintf("Menghapus permanen berita ID %d", id), r.RemoteAddr, r.UserAgent())

	sendJSONResponse(w, http.StatusOK, true, "Berita berhasil dihapus permanen", nil)
}

func (h *Handler) GenerateArticle(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Topic     string `json:"topic"`
		WithImage bool   `json:"withImage"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Permintaan tidak valid", nil)
		return
	}

	articleText, err := ai.GenerateArticle(req.Topic)
	if err != nil {
		sendJSONResponse(w, http.StatusBadGateway, false, err.Error(), nil)
		return
	}

	responseBody := map[string]interface{}{"result": articleText}

	if req.WithImage {
		imageUrl, imgErr := ai.GenerateAndDownloadImage(req.Topic)
		if imgErr == nil && imageUrl != "" {
			responseBody["suggestedImage"] = imageUrl
		} else {
			logger.Error(r.Context(), "failed downloading ai image", logger.Field{"error": imgErr.Error()})
		}
	}

	sendJSONResponse(w, http.StatusOK, true, "Draft berita AI berhasil dibuat", responseBody)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Post("/", h.Create)
	r.Post("/generate", h.GenerateArticle)
	r.Get("/slug/{slug}", h.GetBySlug)

	// Group routes that require an ID
	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", h.GetByID)
		r.Put("/", h.Update)
		r.Delete("/", h.Delete)
		r.Put("/restore", h.Restore)
		r.Delete("/force", h.ForceDelete)
	})

	return r
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	EnsureUniqueSlug(baseSlug string, excludeID int) (string, error)
	FindAll(status, category, search string, limit, offset int) ([]News, int, error)
	FindByID(id int) (*News, error)
	FindBySlug(slug string) (*News, error)
	Create(n *News) error
	Update(id int, n *News) error
	SoftDelete(id int) error
	Restore(id int) error
	ForceDelete(id int) error
}
