package project

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/weight"
	"almaparung-api/internal/validators"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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
	// SubProjects
	r.Get("/subprojects", h.ListSubProjects)
	r.Post("/subprojects", h.CreateSubProject)
	r.Put("/subprojects/{id}", h.UpdateSubProject)
	r.Delete("/subprojects/{id}", h.DeleteSubProject)
	// Activities
	r.Get("/activities", h.ListActivities)
	r.Post("/activities", h.CreateActivity)
	r.Put("/activities/{id}", h.UpdateActivity)
	r.Delete("/activities/{id}", h.DeleteActivity)
	// Indicators
	r.Get("/indicators", h.ListIndicators)
	r.Post("/indicators", h.CreateIndicator)
	r.Delete("/indicators/{id}", h.DeleteIndicator)
	// Weight validation
	r.Get("/weights/validate", h.ValidateWeights)
	return r
}

func sendJSON(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": success, "message": msg, "data": data})
}


func audit(r *http.Request, action, details string) {
	if uid, ok := auth.CurrentUserID(r.Context()); ok {
		logger.RecordActivity(&uid, action, details, r.RemoteAddr, r.UserAgent())
	}
}
func (h *Handler) ListSubProjects(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.GetAllSubProjects()
	if err != nil {
		logger.Error(r.Context(), "project list subprojects failed", logger.Field{"error": err.Error()})
		sendJSON(w, 500, false, "Gagal memuat sub project", nil)
		return
	}
	if list == nil {
		list = []SubProject{}
	}
	sendJSON(w, 200, true, "Daftar sub project", list)
}

func (h *Handler) CreateSubProject(w http.ResponseWriter, r *http.Request) {
	var s SubProject
	if err := validators.DecodeJSON(w, r, &s); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	s.Name = strings.TrimSpace(s.Name)
	s.Code = strings.TrimSpace(s.Code)
	if s.Name == "" {
		sendJSON(w, 400, false, "Nama sub project wajib diisi", nil)
		return
	}
	if s.Weight <= 0 || s.Weight > 100 {
		sendJSON(w, 400, false, "Bobot harus 1-100", nil)
		return
	}
	// Validate total weight ==100 after insert
	all, _ := h.repo.GetAllSubProjects()
	weights := map[string]float64{}
	for _, sp := range all {
		weights[sp.Name] = sp.Weight
	}
	weights[s.Name] = s.Weight
	if err := weight.ValidateWeights(weights); err != nil {
		sendJSON(w, 400, false, err.Error(), nil)
		return
	}
	if err := h.repo.CreateSubProject(&s); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			sendJSON(w, 409, false, "Kode/nama sub project sudah ada", nil)
			return
		}
		sendJSON(w, 500, false, "Gagal membuat sub project", nil)
		return
	}
	audit(r, "PROJECT_SUB_CREATE", "Buat sub project id="+strconv.Itoa(s.ID)+" ("+s.Name+") bobot="+strconv.FormatFloat(s.Weight, 'f', 1, 64))
	sendJSON(w, 201, true, "Sub project berhasil dibuat", s)
}

func (h *Handler) UpdateSubProject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var s SubProject
	if err := validators.DecodeJSON(w, r, &s); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid", nil)
		return
	}
	s.ID = id
	if s.Weight <= 0 || s.Weight > 100 {
		sendJSON(w, 400, false, "Bobot harus 1-100", nil)
		return
	}
	// Validate total weight after update
	all, _ := h.repo.GetAllSubProjects()
	weights := map[string]float64{}
	for _, sp := range all {
		if sp.ID == id {
			weights[s.Name] = s.Weight
		} else {
			weights[sp.Name] = sp.Weight
		}
	}
	if len(weights) > 0 {
		if err := weight.ValidateWeights(weights); err != nil {
			sendJSON(w, 400, false, err.Error()+" Publish diblokir sampai total 100%", nil)
			return
		}
	}
	if err := h.repo.UpdateSubProject(&s); err != nil {
		sendJSON(w, 500, false, "Gagal update sub project", nil)
		return
	}
	sendJSON(w, 200, true, "Sub project diperbarui", s)
}

func (h *Handler) DeleteSubProject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteSubProject(id); err != nil {
		sendJSON(w, 500, false, "Gagal hapus sub project", nil)
		return
	}
	audit(r, "PROJECT_SUB_DELETE", "Hapus sub project id="+strconv.Itoa(id))
	sendJSON(w, 200, true, "Sub project dihapus", nil)
}

func (h *Handler) ListActivities(w http.ResponseWriter, r *http.Request) {
	subIDStr := r.URL.Query().Get("sub_project_id")
	subID, _ := strconv.Atoi(subIDStr)
	list, err := h.repo.GetActivities(subID)
	if err != nil {
		sendJSON(w, 500, false, "Gagal memuat kegiatan", nil)
		return
	}
	if list == nil {
		list = []Activity{}
	}
	sendJSON(w, 200, true, "Daftar kegiatan", list)
}

func (h *Handler) CreateActivity(w http.ResponseWriter, r *http.Request) {
	var a Activity
	if err := validators.DecodeJSON(w, r, &a); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if a.Name == "" || a.SubProjectID <= 0 {
		sendJSON(w, 400, false, "Nama dan sub_project_id wajib", nil)
		return
	}
	if a.Weight <= 0 || a.Weight > 100 {
		sendJSON(w, 400, false, "Bobot kegiatan 1-100", nil)
		return
	}
	// Allow incremental build: block only if total exceeds 100%
	acts, _ := h.repo.GetActivities(a.SubProjectID)
	total := a.Weight
	for _, act := range acts {
		total += act.Weight
	}
	if total > 100.0001 {
		sendJSON(w, 400, false, "Total bobot kegiatan melebihi 100% ("+strconv.FormatFloat(total,'f',2,64)+"%). Sesuaikan bobot.", nil)
		return
	}
	if err := h.repo.CreateActivity(&a); err != nil {
		sendJSON(w, 500, false, "Gagal membuat kegiatan", nil)
		return
	}
	sendJSON(w, 201, true, "Kegiatan berhasil dibuat", a)
}

func (h *Handler) UpdateActivity(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var a Activity
	if err := validators.DecodeJSON(w, r, &a); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid", nil)
		return
	}
	a.ID = id
	// Block only if total exceeds 100%
	all, _ := h.repo.GetActivities(a.SubProjectID)
	total := a.Weight
	for _, act := range all {
		if act.ID != id {
			total += act.Weight
		}
	}
	if total > 100.0001 {
		sendJSON(w, 400, false, "Total bobot kegiatan melebihi 100% ("+strconv.FormatFloat(total,'f',2,64)+"%). Sesuaikan bobot.", nil)
		return
	}
	if err := h.repo.UpdateActivity(&a); err != nil {
		sendJSON(w, 500, false, "Gagal update kegiatan", nil)
		return
	}
	sendJSON(w, 200, true, "Kegiatan diperbarui", a)
}

func (h *Handler) DeleteActivity(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.repo.DeleteActivity(id)
	sendJSON(w, 200, true, "Kegiatan dihapus", nil)
}

func (h *Handler) ListIndicators(w http.ResponseWriter, r *http.Request) {
	actID, _ := strconv.Atoi(r.URL.Query().Get("activity_id"))
	list, _ := h.repo.GetIndicators(actID)
	if list == nil {
		list = []Indicator{}
	}
	sendJSON(w, 200, true, "Daftar indikator", list)
}

func (h *Handler) CreateIndicator(w http.ResponseWriter, r *http.Request) {
	var ind Indicator
	if err := validators.DecodeJSON(w, r, &ind); err != nil {
		sendJSON(w, 400, false, "Payload tidak valid", nil)
		return
	}
	if ind.Name == "" || ind.ActivityID <= 0 || ind.Weight <= 0 {
		sendJSON(w, 400, false, "Nama, activity_id, weight wajib", nil)
		return
	}
	// Allow incremental build: block only if total exceeds 100%
	inds, _ := h.repo.GetIndicators(ind.ActivityID)
	total := ind.Weight
	for _, i := range inds {
		total += i.Weight
	}
	if total > 100.0001 {
		sendJSON(w, 400, false, "Total bobot indikator melebihi 100% ("+strconv.FormatFloat(total,'f',2,64)+"%). Sesuaikan bobot.", nil)
		return
	}
	h.repo.CreateIndicator(&ind)
	sendJSON(w, 201, true, "Indikator dibuat", ind)
}

func (h *Handler) DeleteIndicator(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.repo.DeleteIndicator(id)
	sendJSON(w, 200, true, "Indikator dihapus", nil)
}

func (h *Handler) ValidateWeights(w http.ResponseWriter, r *http.Request) {
	subs, _ := h.repo.GetAllSubProjects()
	weights := map[string]float64{}
	for _, s := range subs {
		weights[s.Name] = s.Weight
	}
	if err := weight.ValidateWeights(weights); err != nil {
		sendJSON(w, 400, false, err.Error(), map[string]interface{}{"total": weights})
		return
	}
	sendJSON(w, 200, true, "Total bobot valid 100%", weights)
}
