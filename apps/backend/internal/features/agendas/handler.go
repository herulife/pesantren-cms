package agendas

import (
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

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

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	agendas, err := h.repo.List(search)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	if agendas == nil {
		agendas = []Agenda{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar agenda berhasil dimuat", agendas)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var a Agenda
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		logger.Warn(r.Context(), "Bad request reading agenda body", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if err := validators.DecodeStrictJSON(body, &a); err != nil {
		logger.Warn(r.Context(), "Bad request decoding agenda", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	request := validators.AgendaRequest{
		Title:       a.Title,
		StartDate:   a.StartDate,
		EndDate:     a.EndDate,
		TimeInfo:    a.TimeInfo,
		Location:    a.Location,
		Description: a.Description,
		Category:    a.Category,
	}
	if validationErrs := validators.ValidateAgendaRequest(&request); len(validationErrs) > 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}
	a.Title = request.Title
	a.StartDate = request.StartDate
	a.EndDate = request.EndDate
	a.TimeInfo = request.TimeInfo
	a.Location = request.Location
	a.Description = request.Description
	a.Category = request.Category
	if err := h.repo.Create(&a); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusCreated, true, "Agenda berhasil ditambahkan", a)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID agenda tidak valid", nil)
		return
	}
	var a Agenda
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		logger.Warn(r.Context(), "Bad request reading agenda update body", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	if err := validators.DecodeStrictJSON(body, &a); err != nil {
		logger.Warn(r.Context(), "Bad request decoding agenda update", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload permintaan tidak valid", nil)
		return
	}
	request := validators.AgendaRequest{
		Title:       a.Title,
		StartDate:   a.StartDate,
		EndDate:     a.EndDate,
		TimeInfo:    a.TimeInfo,
		Location:    a.Location,
		Description: a.Description,
		Category:    a.Category,
	}
	if validationErrs := validators.ValidateAgendaRequest(&request); len(validationErrs) > 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Validasi gagal", validationErrs)
		return
	}
	a.Title = request.Title
	a.StartDate = request.StartDate
	a.EndDate = request.EndDate
	a.TimeInfo = request.TimeInfo
	a.Location = request.Location
	a.Description = request.Description
	a.Category = request.Category
	if err := h.repo.Update(id, &a); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Agenda berhasil diperbarui", nil)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID agenda tidak valid", nil)
		return
	}
	if err := h.repo.Delete(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Agenda berhasil dihapus", nil)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	List(search string) ([]Agenda, error)
	Create(a *Agenda) error
	Update(id int, a *Agenda) error
	Delete(id int) error
}
