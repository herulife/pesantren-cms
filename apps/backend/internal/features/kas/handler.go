package kas

import (
	"database/sql"
	"errors"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct{ repo *Repository }

func NewHandler(repo *Repository) *Handler { return &Handler{repo: repo} }

var datePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func writeJSON(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": success, "message": msg, "data": data})
}

func currentUserID(r *http.Request) int {
	// PHASE 8: helper auth tunggal (assertion lama selalu gagal -> 0).
	if id, ok := auth.GetAuthenticatedUserID(r.Context()); ok {
		return id
	}
	return 0
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/categories", h.ListCategories)
	r.Post("/categories", h.CreateCategory)
	r.Put("/categories/{id}", h.UpdateCategory)
	r.Delete("/categories/{id}", h.DeleteCategory)
	r.Get("/transactions", h.ListTransactions)
	r.Post("/transactions", h.CreateTransaction)
	r.Delete("/transactions/{id}", h.DeleteTransaction)
	r.Get("/summary", h.Summary)
	return r
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.ListCategories(r.URL.Query().Get("kind"))
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat kategori kas", nil)
		return
	}
	writeJSON(w, 200, true, "Kategori kas berhasil dimuat", list)
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
		Kind string `json:"kind"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	if len(req.Name) < 2 || len(req.Name) > 100 {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"name": {"Nama kategori 2-100 karakter"}})
		return
	}
	if req.Kind != "masuk" && req.Kind != "keluar" {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"kind": {"Jenis harus masuk/keluar"}})
		return
	}
	id, err := h.repo.CreateCategory(req.Name, req.Kind, currentUserID(r))
	if err != nil {
		writeJSON(w, 500, false, "Gagal menyimpan kategori", nil)
		return
	}
	writeJSON(w, 201, true, "Kategori berhasil ditambahkan", map[string]interface{}{"id": id})
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Name string `json:"name"`
		Kind string `json:"kind"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	if len(req.Name) < 2 {
		writeJSON(w, 422, false, "Validasi gagal", map[string][]string{"name": {"Nama kategori 2-100 karakter"}})
		return
	}
	if err := h.repo.UpdateCategory(id, req.Name, req.Kind, currentUserID(r)); err != nil {
		writeJSON(w, 500, false, "Gagal mengubah kategori", nil)
		return
	}
	writeJSON(w, 200, true, "Kategori berhasil diubah", nil)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if err := h.repo.DeleteCategory(id); err != nil {
		writeJSON(w, 500, false, "Gagal menghapus kategori", nil)
		return
	}
	writeJSON(w, 200, true, "Kategori berhasil dihapus", nil)
}

func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	catID, _ := strconv.Atoi(q.Get("category_id"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	list, err := h.repo.ListTransactions(q.Get("date_from"), q.Get("date_to"), q.Get("kind"), catID, limit, offset)
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat transaksi kas", nil)
		return
	}
	writeJSON(w, 200, true, "Transaksi kas berhasil dimuat", list)
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Date       string `json:"date"`
		Kind       string `json:"kind"`
		CategoryID int    `json:"category_id"`
		Amount     int    `json:"amount"`
		Method     string `json:"method"`
		Notes      string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, false, "Permintaan tidak valid", nil)
		return
	}
	errs := map[string][]string{}
	if !datePattern.MatchString(req.Date) {
		errs["date"] = []string{"Tanggal harus format YYYY-MM-DD"}
	}
	if req.Kind != "masuk" && req.Kind != "keluar" {
		errs["kind"] = []string{"Jenis harus masuk/keluar"}
	}
	if req.Amount <= 0 {
		errs["amount"] = []string{"Nominal harus lebih dari 0"}
	}
	if len(errs) > 0 {
		writeJSON(w, 422, false, "Validasi gagal", errs)
		return
	}
	if req.Method == "" {
		req.Method = "manual"
	}
	key := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	id, err := h.repo.CreateTransaction(&Transaction{Date: req.Date, Kind: req.Kind, CategoryID: req.CategoryID, Amount: req.Amount, Method: req.Method, Notes: req.Notes, CreatedBy: currentUserID(r), IdempotencyKey: key})
	if err != nil {
		if errors.Is(err, ErrKasDuplicate) {
			writeJSON(w, 200, true, "Transaksi sudah dicatat sebelumnya", map[string]interface{}{"id": id, "duplicate": true})
			return
		}
		writeJSON(w, 500, false, "Gagal menyimpan transaksi", nil)
		return
	}
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: currentUserID(r), ActorRole: actorRole,
		Action: "CREATE_KAS", Entity: "kas_transaction", EntityID: strconv.FormatInt(id, 10),
		After: map[string]interface{}{"amount": req.Amount, "kind": req.Kind},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	writeJSON(w, 201, true, "Transaksi kas berhasil dicatat", map[string]interface{}{"id": id})
}

func (h *Handler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	reason := strings.TrimSpace(r.URL.Query().Get("reason"))
	if err := h.repo.VoidTransaction(id, reason, currentUserID(r)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, 404, false, "Transaksi tidak ditemukan atau sudah dibatalkan", nil)
			return
		}
		writeJSON(w, 500, false, "Gagal membatalkan transaksi", nil)
		return
	}
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		ActorID: currentUserID(r), ActorRole: actorRole,
		Action: "VOID_KAS", Entity: "kas_transaction", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"voided": true, "reason": reason},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	writeJSON(w, 200, true, "Transaksi dibatalkan (void, riwayat dipertahankan)", nil)
}

func (h *Handler) Summary(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	s, err := h.repo.Summary(q.Get("date_from"), q.Get("date_to"))
	if err != nil {
		writeJSON(w, 500, false, "Gagal memuat ringkasan kas", nil)
		return
	}
	writeJSON(w, 200, true, "Ringkasan kas berhasil dimuat", s)
}
