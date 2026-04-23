package messages

import (
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Post("/", h.Create) // Public
	r.Get("/{id}", h.GetByID)
	r.Patch("/{id}/read", h.MarkAsRead)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "messages list started", logger.Field{"operation": "messages_list"})
	isReadStr := r.URL.Query().Get("is_read")
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	var isRead *bool
	if isReadStr != "" {
		val := isReadStr == "1" || isReadStr == "true"
		isRead = &val
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	if limit > 200 {
		limit = 200
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.repo.FindAll(isRead, search, limit, offset)
	if err != nil {
		logger.Error(r.Context(), "messages list failed", logger.Field{"operation": "messages_list", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (API Error)", nil)
		return
	}

	logger.Info(r.Context(), "messages list completed", logger.Field{
		"operation":   "messages_list",
		"count":       len(messages),
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Messages fetched successfully", messages)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	startedAt := time.Now()
	logger.Info(r.Context(), "message detail started", logger.Field{"operation": "messages_get_by_id", "message_id": id})
	message, err := h.repo.FindByID(id)
	if err != nil {
		logger.Warn(r.Context(), "message detail not found", logger.Field{"operation": "messages_get_by_id", "message_id": id})
		sendJSONResponse(w, http.StatusNotFound, false, "Message not found", nil)
		return
	}

	logger.Info(r.Context(), "message detail completed", logger.Field{
		"operation":   "messages_get_by_id",
		"message_id":  id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Message fetched successfully", message)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	startedAt := time.Now()
	logger.Info(r.Context(), "message create started", logger.Field{"operation": "messages_create_public"})
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		logger.Warn(r.Context(), "message create rejected invalid body", logger.Field{"operation": "messages_create_public", "error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Invalid request payload", nil)
		return
	}

	var req validators.MessageRequest
	if err := validators.DecodeStrictJSON(body, &req); err != nil {
		logger.Warn(r.Context(), "message create rejected invalid json", logger.Field{"operation": "messages_create_public", "error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Invalid request payload", nil)
		return
	}
	if validationErrs := validators.ValidateMessageRequest(&req); len(validationErrs) > 0 {
		logger.Warn(r.Context(), "message create rejected validation error", logger.Field{"operation": "messages_create_public"})
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}

	m := Message{
		Name:     req.Name,
		Email:    req.Email,
		Whatsapp: req.Whatsapp,
		Message:  req.Message,
	}

	if err := h.repo.Create(&m); err != nil {
		logger.Error(r.Context(), "message create failed", logger.Field{"operation": "messages_create_public", "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (API Error)", nil)
		return
	}

	logger.Info(r.Context(), "message create completed", logger.Field{
		"operation":   "messages_create_public",
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusCreated, true, "Message sent successfully", nil)
}

func (h *Handler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	startedAt := time.Now()
	logger.Info(r.Context(), "message mark read started", logger.Field{"operation": "messages_mark_read", "message_id": id})
	if err := h.repo.MarkAsRead(id); err != nil {
		logger.Error(r.Context(), "message mark read failed", logger.Field{"operation": "messages_mark_read", "message_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (API Error)", nil)
		return
	}

	logger.Info(r.Context(), "message mark read completed", logger.Field{
		"operation":   "messages_mark_read",
		"message_id":  id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Message marked as read", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	startedAt := time.Now()
	logger.Info(r.Context(), "message delete started", logger.Field{"operation": "messages_delete", "message_id": id})
	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "message delete failed", logger.Field{"operation": "messages_delete", "message_id": id, "error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (API Error)", nil)
		return
	}

	logger.Info(r.Context(), "message delete completed", logger.Field{
		"operation":   "messages_delete",
		"message_id":  id,
		"duration_ms": time.Since(startedAt).Milliseconds(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Message deleted successfully", nil)
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

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(isRead *bool, search string, limit, offset int) ([]Message, error)
	FindByID(id string) (*Message, error)
	Create(m *Message) error
	MarkAsRead(id string) error
	Delete(id string) error
}
