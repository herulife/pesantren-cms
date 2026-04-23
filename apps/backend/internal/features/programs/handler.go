package programs

import (
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo IRepository
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func sendJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.GetAll)
	r.Get("/{id}", h.GetByID)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	programs, err := h.repo.FindAll(category, search)
	if err != nil {
		logger.Error(r.Context(), "FindAll programs failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal memuat program (Internal Server Error)"})
		return
	}

	// Always return an array
	if programs == nil {
		programs = []Program{}
	}

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    programs,
	})
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	program, err := h.repo.FindByID(id)
	if err != nil {
		sendJSON(w, http.StatusNotFound, map[string]interface{}{"success": false, "message": "Program not found"})
		return
	}

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    program,
	})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input Program
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return
	}
	if err := validators.DecodeStrictJSON(body, &input); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return
	}
	request := validators.ProgramRequest{
		Title:      input.Title,
		Slug:       input.Slug,
		Category:   input.Category,
		Excerpt:    input.Excerpt,
		Content:    input.Content,
		ImageURL:   input.ImageURL,
		IsFeatured: input.IsFeatured,
		OrderIndex: input.OrderIndex,
	}
	if validationErrs := validators.ValidateProgramRequest(&request); len(validationErrs) > 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "errors": validationErrs})
		return
	}
	input.Title = request.Title
	input.Slug = request.Slug
	input.Category = request.Category
	input.Excerpt = request.Excerpt
	input.Content = request.Content
	input.ImageURL = request.ImageURL
	input.OrderIndex = request.OrderIndex

	id, err := h.repo.Create(&input)
	if err != nil {
		logger.Error(r.Context(), "Create program failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal membuat program (Internal Server Error)"})
		return
	}
	input.ID = int(id)

	sendJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"data":    input,
	})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input Program
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return
	}
	if err := validators.DecodeStrictJSON(body, &input); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "message": "Invalid payload"})
		return
	}
	request := validators.ProgramRequest{
		Title:      input.Title,
		Slug:       input.Slug,
		Category:   input.Category,
		Excerpt:    input.Excerpt,
		Content:    input.Content,
		ImageURL:   input.ImageURL,
		IsFeatured: input.IsFeatured,
		OrderIndex: input.OrderIndex,
	}
	if validationErrs := validators.ValidateProgramRequest(&request); len(validationErrs) > 0 {
		sendJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "errors": validationErrs})
		return
	}
	input.Title = request.Title
	input.Slug = request.Slug
	input.Category = request.Category
	input.Excerpt = request.Excerpt
	input.Content = request.Content
	input.ImageURL = request.ImageURL
	input.OrderIndex = request.OrderIndex

	err = h.repo.Update(id, &input)
	if err != nil {
		logger.Error(r.Context(), "Update program failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal memperbarui program (Internal Server Error)"})
		return
	}

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Program updated successfully",
	})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.repo.Delete(id)
	if err != nil {
		logger.Error(r.Context(), "Delete program failed", logger.Field{"error": err.Error()})
		sendJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "message": "Gagal menghapus program (Internal Server Error)"})
		return
	}

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Program deleted successfully",
	})
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(category, search string) ([]Program, error)
	FindByID(id string) (*Program, error)
	Create(p *Program) (int64, error)
	Update(id string, p *Program) error
	Delete(id string) error
}
