package santri

import (
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/scope"
	"almaparung-api/internal/validators"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type PortalUser struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Santri struct {
	ID               int    `json:"id"`
	NIS              string `json:"nis"`
	Name             string `json:"name"`
	Nickname         string `json:"nickname"`
	Gender           string `json:"gender"`
	BirthPlace       string `json:"birth_place"`
	BirthDate        string `json:"birth_date"`
	Address          string `json:"address"`
	Class            string `json:"class"`
	Jenjang          string `json:"jenjang"`
	Angkatan         string `json:"angkatan"`
	Status           string `json:"status"`
	Category         string `json:"category"`
	ParentName       string `json:"parent_name"`
	ParentPhone      string `json:"parent_phone"`
	NIK              string `json:"nik"`
	FatherName       string `json:"father_name"`
	FatherPhone      string `json:"father_phone"`
	MotherName       string `json:"mother_name"`
	MotherPhone      string `json:"mother_phone"`
	FatherOccupation string `json:"father_occupation"`
	MotherOccupation string `json:"mother_occupation"`
	RegistrationID   int    `json:"registration_id"`
	PhotoURL         string `json:"photo_url"`
	UserID           *int   `json:"user_id,omitempty"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
}

// SantriInput adalah DTO tulis (whitelist). ID, user_id, dan timestamp TIDAK
// bisa diubah via create/update (user_id hanya via link-user).
type SantriInput struct {
	NIS              string `json:"nis"`
	Name             string `json:"name"`
	Nickname         string `json:"nickname"`
	Gender           string `json:"gender"`
	BirthPlace       string `json:"birth_place"`
	BirthDate        string `json:"birth_date"`
	Address          string `json:"address"`
	Class            string `json:"class"`
	Jenjang          string `json:"jenjang"`
	Angkatan         string `json:"angkatan"`
	Status           string `json:"status"`
	Category         string `json:"category"`
	ParentName       string `json:"parent_name"`
	ParentPhone      string `json:"parent_phone"`
	NIK              string `json:"nik"`
	FatherName       string `json:"father_name"`
	FatherPhone      string `json:"father_phone"`
	MotherName       string `json:"mother_name"`
	MotherPhone      string `json:"mother_phone"`
	FatherOccupation string `json:"father_occupation"`
	MotherOccupation string `json:"mother_occupation"`
	RegistrationID   int    `json:"registration_id"`
	PhotoURL         string `json:"photo_url"`
}

func (in *SantriInput) toSantri() *Santri {
	return &Santri{
		NIS: in.NIS, Name: in.Name, Nickname: in.Nickname, Gender: in.Gender,
		BirthPlace: in.BirthPlace, BirthDate: in.BirthDate, Address: in.Address,
		Class: in.Class, Jenjang: in.Jenjang, Angkatan: in.Angkatan, Status: in.Status, Category: in.Category,
		ParentName: in.ParentName, ParentPhone: in.ParentPhone, NIK: in.NIK, FatherName: in.FatherName, FatherPhone: in.FatherPhone, MotherName: in.MotherName, MotherPhone: in.MotherPhone, FatherOccupation: in.FatherOccupation, MotherOccupation: in.MotherOccupation, RegistrationID: in.RegistrationID, PhotoURL: in.PhotoURL,
	}
}

type IRepository interface {
	FindAll(search, class, status string, limit, offset int) ([]Santri, int, error)
	FindAllScoped(search string, classes []string, status string, limit, offset int) ([]Santri, int, error)
	FindPortalUsers(search string) ([]PortalUser, error)
	FindByID(id int) (*Santri, error)
	Create(s *Santri) error
	BulkCreate(items []Santri) (int, error)
	Update(s *Santri) error
	Delete(id int) error
	BulkDelete(ids []int) (int, error)
	PurgeSantri(id int) (map[string]int64, error)
	SetClassBulk(items map[int]string) (int, error)
	LinkUser(santriID, userID int) error
	UnlinkUser(santriID int) error
	FindAvailablePortalUsers(search string, includeID int) ([]PortalUser, error)
	LinkUserExclusive(santriID, userID int) error
	ResetLinkedPassword(santriID int, newPassword string) (int, error)
	FindByUserID(userID int) ([]Santri, error)
	ListClassesFromSantri(classes []string) ([]ClassCount, error)
}

type Handler struct {
	repo IRepository
}

func parsePagination(r *http.Request) (limit, offset int) {
	limit, _ = strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ = strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func NewHandler(repo IRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/my-santri", h.GetMySantri)
	r.Get("/portal-users", h.GetPortalUsers)
	r.Get("/classes", h.GetClasses)
	r.Get("/", h.GetAll)
	r.Get("/{id}", h.GetByID)
	r.Post("/", h.Create)
	r.Post("/bulk", h.BulkCreate)
	r.Post("/set-class", h.SetClass)
	r.Put("/{id}", h.Update)
	r.Put("/{id}/link-user", h.LinkUser)
	r.Put("/{id}/unlink-user", h.UnlinkUser)
	r.Get("/portal-users-available", h.GetAvailablePortalUsers)
	r.Put("/{id}/link-user-exclusive", h.LinkUserExclusiveHandler)
	r.Post("/{id}/reset-password", h.ResetSantriPassword)
	r.Delete("/{id}", h.Delete)
	r.Delete("/{id}/purge", h.Purge)
	r.Delete("/bulk", h.BulkDelete)
	return r
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

func sendValidationError(w http.ResponseWriter, errs map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"message": "Validasi gagal",
		"errors":  errs,
	})
}

func validateSantri(s *Santri) map[string]string {
	errs := map[string]string{}
	s.NIS = strings.TrimSpace(s.NIS)
	s.Name = strings.TrimSpace(s.Name)
	s.Gender = strings.ToLower(strings.TrimSpace(s.Gender))
	s.Status = strings.ToLower(strings.TrimSpace(s.Status))
	s.Jenjang = strings.ToLower(strings.TrimSpace(s.Jenjang))
	if s.NIS == "" {
		errs["nis"] = "NIS wajib diisi"
	} else if len(s.NIS) < 4 || len(s.NIS) > 20 {
		errs["nis"] = "NIS 4-20 karakter"
	}
	if s.Name == "" {
		errs["name"] = "Nama santri wajib diisi"
	} else if len(s.Name) < 3 {
		errs["name"] = "Nama minimal 3 karakter"
	}
	if s.Gender != "" && s.Gender != "l" && s.Gender != "p" && s.Gender != "laki-laki" && s.Gender != "perempuan" {
		errs["gender"] = "Gender harus L/P"
	}
	if s.Class == "" {
		errs["class"] = "Kelas wajib diisi"
	}
	if s.Jenjang != "" && s.Jenjang != "smp" && s.Jenjang != "smk" {
		errs["jenjang"] = "Jenjang harus SMP/SMK"
	}
	validStatus := map[string]bool{"aktif": true, "lulus": true, "pindah": true, "cuti": true}
	if s.Status != "" && !validStatus[s.Status] {
		errs["status"] = "Status harus aktif/lulus/pindah/cuti"
	}
	// Kategori mengikuti daftar yang sama dengan registrations.category (PSB),
	// supaya tidak ada dua ejaan untuk nilai yang sama. Kosong -> "reguler"
	// (konsisten dengan PSB), nilai != "" yang tidak dikenal -> 400.
	if raw := strings.TrimSpace(s.Category); raw == "" {
		s.Category = validators.CategoryReguler
	} else {
		s.Category = validators.NormalizeCategory(raw)
		if s.Category == "" {
			errs["category"] = "Kategori harus reguler, yatim, atau dhuafa"
		}
	}
	if s.BirthDate != "" && !validators.ValidateDate(s.BirthDate) {
		errs["birth_date"] = "Tanggal lahir format YYYY-MM-DD"
	}
	if s.ParentPhone != "" && !validators.ValidatePhone(s.ParentPhone) {
		errs["parent_phone"] = "No HP wali tidak valid"
	}
	if s.NIK != "" {
		validNIK := len(s.NIK) == 16
		for _, c := range s.NIK {
			if c < '0' || c > '9' {
				validNIK = false
				break
			}
		}
		if !validNIK {
			errs["nik"] = "NIK harus 16 digit angka"
		}
	}
	if s.FatherPhone != "" && !validators.ValidatePhone(s.FatherPhone) {
		errs["father_phone"] = "No HP ayah tidak valid"
	}
	if s.MotherPhone != "" && !validators.ValidatePhone(s.MotherPhone) {
		errs["mother_phone"] = "No HP ibu tidak valid"
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	class := r.URL.Query().Get("class")
	status := r.URL.Query().Get("status")
	limit, offset := parsePagination(r)
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	var list []Santri
	var total int
	var err error
	if role == "wali_kelas" {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			list, total, err = h.repo.FindAllScoped(search, sc.Classes, status, limit, offset)
		}
	} else {
		list, total, err = h.repo.FindAll(search, class, status, limit, offset)
	}
	if err != nil {
		logger.Error(r.Context(), "santri list failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat data santri", nil)
		return
	}
	if list == nil {
		list = []Santri{}
	}
	w.Header().Set("X-Total-Count", strconv.Itoa(total))
	sendJSONResponse(w, http.StatusOK, true, "Daftar santri berhasil dimuat", map[string]interface{}{"items": list, "total": total, "limit": limit, "offset": offset})
}

func (h *Handler) GetPortalUsers(w http.ResponseWriter, r *http.Request) {
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	users, err := h.repo.FindPortalUsers(search)
	if err != nil {
		logger.Error(r.Context(), "portal user list failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat akun portal", nil)
		return
	}
	if users == nil {
		users = []PortalUser{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar akun portal berhasil dimuat", users)
}

// GetClasses mengirim daftar kelas yang benar-benar ada di data (distinct
// `santri.class` + jumlahnya). Dipakai dropdown filter di /admin/kesantrian
// supaya opsinya tidak lagi bergantung pada baris yang kebetulan termuat.
func (h *Handler) GetClasses(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	var scoped []string
	if role == "wali_kelas" {
		sc, err := scope.Resolve(database.DB, uid, role)
		if err != nil {
			logger.Error(r.Context(), "santri classes scope failed", logger.Field{"error": err.Error()})
		} else {
			scoped = sc.Classes
		}
	}
	list, err := h.repo.ListClassesFromSantri(scoped)
	if err != nil {
		logger.Error(r.Context(), "santri classes failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat daftar kelas", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Daftar kelas berhasil dimuat", list)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	santri, err := h.repo.FindByID(id)
	if err != nil {
		sendJSONResponse(w, http.StatusNotFound, false, "Santri tidak ditemukan", nil)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "wali_kelas" {
		sc, scErr := scope.Resolve(database.DB, uid, role)
		if scErr != nil || !sc.HasClass(santri.Class) {
			sendJSONResponse(w, http.StatusForbidden, false, "Hanya dapat melihat santri kelas sendiri", nil)
			return
		}
	}
	sendJSONResponse(w, http.StatusOK, true, "Detail santri", santri)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	var in SantriInput
	if err := validators.DecodeJSON(w, r, &in); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	s := in.toSantri()
	if errs := validateSantri(s); errs != nil {
		sendValidationError(w, errs)
		return
	}
	if err := h.repo.Create(s); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			sendJSONResponse(w, http.StatusConflict, false, "NIS sudah terdaftar", nil)
			return
		}
		logger.Error(r.Context(), "santri create failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menambah santri", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "CREATE_SANTRI", Entity: "santri", EntityID: strconv.Itoa(s.ID),
		After: map[string]interface{}{"nis": s.NIS, "name": s.Name},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusCreated, true, "Santri berhasil ditambahkan", s)
}

func (h *Handler) BulkCreate(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	var req struct {
		Items []SantriInput `json:"items"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if len(req.Items) == 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada data untuk ditambahkan", nil)
		return
	}
	if len(req.Items) > 500 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Maksimal 500 data per import", nil)
		return
	}
	var firstErr error
	items := make([]Santri, 0, len(req.Items))
	for i := range req.Items {
		if errs := validateSantri(req.Items[i].toSantri()); errs != nil {
			sendJSONResponse(w, http.StatusBadRequest, false, "Data ke-"+strconv.Itoa(i+1)+" tidak valid", errs)
			return
		}
		items = append(items, *req.Items[i].toSantri())
	}
	inserted, err := h.repo.BulkCreate(items)
	if err != nil {
		firstErr = err
	}
	if firstErr != nil && strings.Contains(firstErr.Error(), "UNIQUE") {
		sendJSONResponse(w, http.StatusConflict, false, "Beberapa NIS sudah terdaftar", map[string]interface{}{"inserted": inserted})
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "BULK_CREATE_SANTRI", Entity: "santri",
		After: map[string]interface{}{"inserted": inserted},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusCreated, true, strconv.Itoa(inserted)+" santri berhasil ditambahkan", map[string]interface{}{"inserted": inserted})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var in SantriInput
	if err := validators.DecodeJSON(w, r, &in); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	s := in.toSantri()
	if errs := validateSantri(s); errs != nil {
		sendValidationError(w, errs)
		return
	}
	s.ID = id
	if err := h.repo.Update(s); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			sendJSONResponse(w, http.StatusConflict, false, "NIS sudah terdaftar", nil)
			return
		}
		logger.Error(r.Context(), "santri update failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memperbarui santri", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "UPDATE_SANTRI", Entity: "santri", EntityID: strconv.Itoa(id),
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Santri berhasil diperbarui", s)
}

func (h *Handler) LinkUser(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		UserID int `json:"user_id"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if req.UserID <= 0 {
		sendValidationError(w, map[string]string{"user_id": "Akun wali wajib dipilih"})
		return
	}
	if err := h.repo.LinkUser(id, req.UserID); err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Akun user tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "santri link-user failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghubungkan akun wali", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "LINK_SANTRI_USER", Entity: "santri", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"user_id": req.UserID},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Akun wali berhasil dihubungkan", nil)
}

func (h *Handler) UnlinkUser(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.UnlinkUser(id); err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Santri tidak ditemukan", nil)
			return
		}
		logger.Error(r.Context(), "santri unlink-user failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal melepas akun wali", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "UNLINK_SANTRI_USER", Entity: "santri", EntityID: strconv.Itoa(id),
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Akun wali berhasil dilepas", nil)
}

func (h *Handler) GetMySantri(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.CurrentUserID(r.Context())
	if !ok {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Sesi login tidak ditemukan", nil)
		return
	}
	list, err := h.repo.FindByUserID(uid)
	if err != nil {
		logger.Error(r.Context(), "santri my-santri failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat data santri", nil)
		return
	}
	if list == nil {
		list = []Santri{}
	}
	sendJSONResponse(w, http.StatusOK, true, "Data santri berhasil dimuat", list)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.Delete(id); err != nil {
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus santri", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "DELETE_SANTRI", Entity: "santri", EntityID: strconv.Itoa(id),
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Santri berhasil dihapus", nil)
}

func (h *Handler) SetClass(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	var req struct {
		Items []struct {
			ID    int    `json:"id"`
			Class string `json:"class"`
		} `json:"items"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if len(req.Items) == 0 || len(req.Items) > 500 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Maksimal 500 santri per simpan", nil)
		return
	}
	m := map[int]string{}
	for _, it := range req.Items {
		if it.ID > 0 {
			m[it.ID] = it.Class
		}
	}
	n, err := h.repo.SetClassBulk(m)
	if err != nil {
		logger.Error(r.Context(), "santri set-class failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan kelas", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "SET_CLASS_SANTRI", Entity: "santri",
		After: map[string]interface{}{"updated": n},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, strconv.Itoa(n)+" santri berhasil diset kelasnya", map[string]interface{}{"updated": n})
}

func (h *Handler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "pimpinan" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang mengubah data santri", nil)
		return
	}
	var req struct {
		IDs []int `json:"ids"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid", nil)
		return
	}
	if len(req.IDs) == 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada data yang dipilih", nil)
		return
	}
	deleted, err := h.repo.BulkDelete(req.IDs)
	if err != nil {
		logger.Error(r.Context(), "santri bulk delete failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus santri", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "BULK_DELETE_SANTRI", Entity: "santri",
		After: map[string]interface{}{"deleted": deleted, "ids": req.IDs},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, strconv.Itoa(deleted)+" santri berhasil dihapus", map[string]interface{}{"deleted": deleted})
}
