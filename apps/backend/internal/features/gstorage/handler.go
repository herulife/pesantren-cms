package gstorage

import (
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"darussunnah-api/internal/validators"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo *Repository
	svc  *Service
	cfg  *Config
}

func NewHandler(repo *Repository, svc *Service, cfg *Config) *Handler {
	return &Handler{repo: repo, svc: svc, cfg: cfg}
}

func writeJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func writeAPIError(w http.ResponseWriter, status int, correlationID, message string, details map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       false,
		"message":       message,
		"correlationId": correlationID,
		"details":       details,
	})
}

func (h *Handler) audit(r *http.Request, action, details string) {
	if uid, ok := auth.CurrentUserID(r.Context()); ok {
		logger.RecordActivity(&uid, action, details, r.RemoteAddr, r.UserAgent())
	} else {
		logger.RecordActivity(nil, action, details, r.RemoteAddr, r.UserAgent())
	}
}

// Routes mounts all admin storage endpoints. The public OAuth callback is
// mounted separately in main.go.
func (h *Handler) Routes(r chi.Router) {
	r.Get("/status", h.status)
	r.Get("/stats", h.stats)
	r.Get("/accounts", h.listAccounts)
	r.Get("/accounts/{id}", h.accountDetail)
	r.Patch("/accounts/{id}", h.updateAccount)
	r.Delete("/accounts/{id}", h.deleteAccount)
	r.Get("/accounts/{id}/folders", h.listFolders)
	r.Post("/accounts/{id}/sources", h.createSource)
	r.Get("/oauth/begin", h.beginOAuth)
	r.Get("/sources", h.listAllSources)
	r.Get("/sources/{id}", h.sourceDetail)
	r.Patch("/sources/{id}", h.updateSource)
	r.Delete("/sources/{id}", h.deleteSource)
	r.Post("/sources/{id}/test", h.testSource)
	r.Post("/sources/{id}/sync", h.startSync)
	r.Get("/sources/{id}/sync", h.syncStatus)
}

// ── Status & stats ───────────────────────────────────────

func (h *Handler) status(w http.ResponseWriter, r *http.Request) {
	accounts, _ := h.repo.ListAccounts()
	sources, _ := h.repo.ListAllSources()
	writeJSONResponse(w, http.StatusOK, true, "Status storage", map[string]interface{}{
		"configured":      h.cfg.Configured(),
		"client_id_masked": h.cfg.ConfiguredIDMasked(),
		"redirect_uri":    h.cfg.RedirectURL,
		"app_url":         h.cfg.AppURL,
		"accounts":        len(accounts),
		"sources":         len(sources),
	})
}

func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	t, err := h.computeTotals()
	if err != nil {
		logger.Error(r.Context(), "storage stats error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat statistik storage", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Statistik storage", t)
}

func (h *Handler) computeTotals() (*Totals, error) {
	accounts, err := h.repo.ListAccounts()
	if err != nil {
		return nil, err
	}
	sources, err := h.repo.ListAllSources()
	if err != nil {
		return nil, err
	}
	t := &Totals{Accounts: len(accounts), Sources: len(sources)}
	for _, s := range sources {
		if s.SyncEnabled {
			t.Enabled++
		}
	}
	var n int
	_ = h.repo.db.QueryRow(`SELECT COUNT(*) FROM gallery`).Scan(&n)
	t.Media = n
	_ = h.repo.db.QueryRow(`SELECT COUNT(*) FROM gallery WHERE source = 'gdrive'`).Scan(&n)
	t.SyncedMedia = n
	_ = h.repo.db.QueryRow(`SELECT COALESCE(SUM(files_total),0) FROM storage_sync_runs WHERE status = 'success'`).Scan(&n)
	t.TotalFilesSynced = n
	return t, nil
}

// ── Accounts ─────────────────────────────────────────────

func (h *Handler) listAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.repo.ListAccounts()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memuat akun storage", nil)
		return
	}
	type accountView struct {
		Account
		Sources []Source `json:"sources"`
	}
	views := make([]accountView, 0, len(accounts))
	totalSources := 0
	for _, acc := range accounts {
		sources, err := h.repo.ListSources(acc.ID)
		if err != nil {
			writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memuat sumber storage", nil)
			return
		}
		totalSources += len(sources)
		views = append(views, accountView{Account: acc, Sources: sources})
	}
	totals := &Totals{Accounts: len(accounts), Sources: totalSources}
	for _, acc := range accounts {
		srcs, _ := h.repo.ListSources(acc.ID)
		for _, s := range srcs {
			if s.SyncEnabled {
				totals.Enabled++
			}
		}
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar akun storage", map[string]interface{}{
		"accounts": views,
		"totals":   totals,
	})
}

func (h *Handler) accountDetail(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	acc, err := h.repo.GetAccount(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}
	sources, err := h.repo.ListSources(id)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memuat sumber storage", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Detail akun", map[string]interface{}{
		"account": acc,
		"sources": sources,
	})
}

func (h *Handler) updateAccount(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	var req struct {
		Name   string `json:"name"`
		Status string `json:"status"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Data permintaan tidak valid: "+err.Error(), nil)
		return
	}
	acc, err := h.repo.GetAccount(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = acc.Name
	}
	status := req.Status
	if status != "active" && status != "disabled" {
		status = acc.Status
	}
	if err := h.repo.UpdateAccount(id, name, status, "", false); err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memperbarui akun", nil)
		return
	}
	h.audit(r, "google_drive.accounts.update", "Update akun storage #"+strconv.FormatInt(id, 10))
	writeJSONResponse(w, http.StatusOK, true, "Akun storage diperbarui", map[string]interface{}{"id": id})
}

func (h *Handler) deleteAccount(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	if _, err := h.repo.GetAccount(id); err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}
	sources, _ := h.repo.ListSources(id)
	for _, s := range sources {
		h.removeLocalSourceDir(s)
		h.repo.DeleteGalleryBySource(s.Slug)
	}
	if err := h.repo.DeleteAccount(id); err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal menghapus akun", nil)
		return
	}
	h.audit(r, "google_drive.accounts.delete", "Hapus akun storage #"+strconv.FormatInt(id, 10))
	writeJSONResponse(w, http.StatusOK, true, "Akun storage dihapus", map[string]interface{}{"id": id})
}

func (h *Handler) listFolders(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	acc, err := h.repo.GetAccount(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}
	parent := r.URL.Query().Get("parent")
	folders, err := h.svc.ListFolders(r.Context(), acc, parent)
	if err != nil {
		writeAPIError(w, http.StatusBadGateway, logger.CorrelationID(r), err.Error(), nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar folder", folders)
}

// ── OAuth ────────────────────────────────────────────────

func (h *Handler) beginOAuth(w http.ResponseWriter, r *http.Request) {
	if !h.cfg.Configured() {
		writeAPIError(w, http.StatusServiceUnavailable, logger.CorrelationID(r),
			"Google OAuth belum dikonfigurasi. Tambahkan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_REDIRECT_URI pada environment backend.", nil)
		return
	}
	uid, _ := auth.CurrentUserID(r.Context())
	url, err := h.svc.BeginOAuth(uid)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal membuat tautan OAuth: "+err.Error(), nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Tautan OAuth siap", map[string]interface{}{
		"auth_url":  url,
		"redirect":  h.cfg.RedirectURL,
	})
}

// OAuthCallback handles the Google redirect. Mounted publicly in main.go.
func (h *Handler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if err := h.cfg.ConfiguredUnless(); err != nil {
		h.redirectWithError(w, r, err.Error())
		return
	}
	if code == "" {
		errMsg := r.URL.Query().Get("error")
		if errMsg == "" {
			errMsg = "Otorisasi dibatalkan"
		}
		h.redirectWithError(w, r, "Gagal menghubungkan Google: "+errMsg)
		return
	}
	if _, ok := h.svc.validateState(state); !ok {
		h.redirectWithError(w, r, "Sesi otorisasi tidak valid atau kedaluwarsa. Silakan coba lagi.")
		return
	}

	accID, account, err := h.svc.ExchangeCode(r.Context(), code)
	if err != nil {
		logger.Error(r.Context(), "gstorage oauth exchange failed", logger.Field{"error": err.Error()})
		h.redirectWithError(w, r, "Gagal bertukar token: "+err.Error())
		return
	}
	if account != nil {
		h.audit(r, "google_drive.accounts.connect", "Hubungkan akun Google "+account.AccountEmail)
	}
	http.Redirect(w, r, h.cfg.AppURL+"/admin/gallery/storage?connected="+strconv.FormatInt(accID, 10), http.StatusFound)
}

// redirectWithError sends the caller back to the admin UI with a readable
// message. Internal error text must never be passed through: OAuth failures used
// to redirect with err.Error(), leaking provider response bodies, client
// configuration details and endpoint internals into a browser-visible URL that
// also lands in nginx and Cloudflare access logs.
func (h *Handler) redirectWithError(w http.ResponseWriter, r *http.Request, msg string) {
	correlationID := logger.CorrelationID(r)

	logger.Warn(r.Context(), "storage oauth redirect with error", logger.Field{
		"correlation_id": correlationID,
		"detail":         msg,
	})

	// Map to a generic, actionable message for the browser.
	public := "Konfigurasi penyimpanan Google gagal. Silakan coba lagi atau hubungi administrator."
	if strings.Contains(msg, "redirect_uri") || strings.Contains(msg, "redirect") {
		public = "Alamat callback OAuth tidak cocok dengan konfigurasi di Google Cloud Console."
	} else if strings.Contains(msg, "state") {
		public = "Sesi OAuth tidak valid atau sudah kedaluwarsa. Silakan ulangi."
	}

	// The correlation ID lets an admin match the browser message to the server log.
	public += " (Ref: " + correlationID + ")"

	http.Redirect(w, r, h.cfg.AppURL+"/admin/gallery/storage?error="+urlEncode(public), http.StatusFound)
}

// ── Sources ──────────────────────────────────────────────

func (h *Handler) createSource(w http.ResponseWriter, r *http.Request) {
	accID := parseID(chi.URLParam(r, "id"))
	var req struct {
		Name         string `json:"name"`
		Slug         string `json:"slug"`
		RootFolderID string `json:"root_folder_id"`
		Category     string `json:"category"`
		TestFirst    bool   `json:"test_first"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Data permintaan tidak valid: "+err.Error(), nil)
		return
	}
	name := strings.TrimSpace(req.Name)
	rootFolder := strings.TrimSpace(req.RootFolderID)
	if name == "" || rootFolder == "" {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Nama sumber dan folder wajib diisi", nil)
		return
	}
	acc, err := h.repo.GetAccount(accID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}

	slug := normalizeSlug(req.Slug)
	if slug == "" {
		slug = normalizeSlug(name)
	}
	if slug == "" {
		slug = "album-" + strconv.FormatInt(accID, 10)
	}
	if existing, _ := h.repo.GetSourceBySlug(slug); existing != nil {
		slug = slug + "-" + strconv.FormatInt(accID, 10)
	}

	if req.TestFirst {
		if err := h.svc.TestConnection(r.Context(), acc, rootFolder); err != nil {
			_ = h.repo.UpdateAccount(accID, acc.Name, "error", err.Error(), false)
			writeAPIError(w, http.StatusBadGateway, logger.CorrelationID(r), err.Error(), nil)
			return
		}
		_ = h.repo.UpdateAccount(accID, acc.Name, "active", "", true)
	}

	category := strings.TrimSpace(req.Category)
	if category == "" {
		category = "Umum"
	}

	src := &Source{
		StorageAccountID: accID,
		Name:             name,
		Slug:             slug,
		RootFolderID:     rootFolder,
		Category:         category,
		SyncEnabled:      true,
	}
	sourceID, err := h.repo.CreateSource(src)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal menyimpan sumber: "+err.Error(), nil)
		return
	}
	_ = h.repo.EnsureAlbumMeta(slug, name, category, rootFolder)
	h.audit(r, "google_drive.sources.create", "Buat sumber #"+strconv.FormatInt(sourceID, 10)+" ("+name+") folder "+rootFolder)
	writeJSONResponse(w, http.StatusCreated, true, "Sumber data berhasil dibuat", map[string]interface{}{
		"source_id": sourceID,
	})
}

func (h *Handler) listAllSources(w http.ResponseWriter, r *http.Request) {
	sources, err := h.repo.ListAllSources()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memuat sumber storage", nil)
		return
	}
	type sourceView struct {
		Source
		AccountEmail string `json:"account_email"`
	}
	views := make([]sourceView, 0, len(sources))
	for _, s := range sources {
		var email string
		if acc, err := h.repo.GetAccount(s.StorageAccountID); err == nil {
			email = acc.AccountEmail
		}
		n, _ := h.countSourceMedia(s.Slug)
		s.MediaCount = n
		views = append(views, sourceView{Source: s, AccountEmail: email})
	}
	writeJSONResponse(w, http.StatusOK, true, "Daftar sumber storage", views)
}

func (h *Handler) sourceDetail(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	source, err := h.repo.GetSource(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	n, _ := h.countSourceMedia(source.Slug)
	source.MediaCount = n
	lastRun, _ := h.repo.LatestRun(id)
	history, _ := h.repo.ListRuns(id, 10)
	var accountEmail string
	if acc, err := h.repo.GetAccount(source.StorageAccountID); err == nil {
		accountEmail = acc.AccountEmail
	}
	job := h.svc.GetSyncJob(id)
	var jobView map[string]interface{}
	if job != nil {
		jobView = job.snapshot()
	}
	writeJSONResponse(w, http.StatusOK, true, "Detail sumber storage", map[string]interface{}{
		"source":        source,
		"account_email": accountEmail,
		"last_run":      lastRun,
		"run_history":   history,
		"job":           jobView,
	})
}

func (h *Handler) updateSource(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	var req struct {
		Name        *string `json:"name"`
		Slug        *string `json:"slug"`
		Category    *string `json:"category"`
		SyncEnabled *bool   `json:"sync_enabled"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, logger.CorrelationID(r), "Data permintaan tidak valid: "+err.Error(), nil)
		return
	}
	source, err := h.repo.GetSource(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	name := source.Name
	slug := source.Slug
	category := source.Category
	syncEnabled := source.SyncEnabled
	if req.Name != nil {
		name = strings.TrimSpace(*req.Name)
		if name == "" {
			name = source.Name
		}
	}
	if req.Slug != nil {
		slug = normalizeSlug(*req.Slug)
	}
	if req.Category != nil {
		category = strings.TrimSpace(*req.Category)
		if category == "" {
			category = source.Category
		}
	}
	if req.SyncEnabled != nil {
		syncEnabled = *req.SyncEnabled
	}
	if err := h.repo.UpdateSource(id, name, slug, category, syncEnabled, true); err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal memperbarui sumber", nil)
		return
	}
	h.audit(r, "google_drive.sources.update", "Update sumber #"+strconv.FormatInt(id, 10))
	writeJSONResponse(w, http.StatusOK, true, "Sumber storage diperbarui", map[string]interface{}{"id": id})
}

func (h *Handler) deleteSource(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	source, err := h.repo.GetSource(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	keep := r.URL.Query().Get("keep") == "1"
	if !keep {
		if n, err := h.repo.DeleteGalleryBySource(source.Slug); err == nil {
			h.audit(r, "google_drive.sources.media_removed", "Hapus "+strconv.FormatInt(n, 10)+" media dari album "+source.Slug)
		}
		h.removeLocalSourceDir(*source)
	}
	if err := h.repo.DeleteSource(id); err != nil {
		writeAPIError(w, http.StatusInternalServerError, logger.CorrelationID(r), "Gagal menghapus sumber", nil)
		return
	}
	h.audit(r, "google_drive.sources.delete", "Hapus sumber #"+strconv.FormatInt(id, 10)+" keep="+strconv.FormatBool(keep))
	writeJSONResponse(w, http.StatusOK, true, "Sumber storage dihapus", map[string]interface{}{"id": id})
}

func (h *Handler) removeLocalSourceDir(s Source) {
	dir := filepath.Join("public", "uploads", "gdrive-"+strconv.FormatInt(s.ID, 10))
	_ = os.RemoveAll(dir)
}

func (h *Handler) testSource(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	source, err := h.repo.GetSource(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	acc, err := h.repo.GetAccount(source.StorageAccountID)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Akun storage tidak ditemukan", nil)
		return
	}
	if err := h.svc.TestConnection(r.Context(), acc, source.RootFolderID); err != nil {
		_ = h.repo.SetSourceStatus(id, "error", err.Error())
		_ = h.repo.UpdateAccount(acc.ID, acc.Name, "error", err.Error(), false)
		h.audit(r, "google_drive.sources.test", "Tes gagal sumber #"+strconv.FormatInt(id, 10)+": "+err.Error())
		writeAPIError(w, http.StatusBadGateway, logger.CorrelationID(r), err.Error(), nil)
		return
	}
	_ = h.repo.SetSourceStatus(id, "connected", "")
	_ = h.repo.UpdateAccount(acc.ID, acc.Name, "active", "", true)
	h.audit(r, "google_drive.sources.test", "Tes OK sumber #"+strconv.FormatInt(id, 10))
	writeJSONResponse(w, http.StatusOK, true, "Koneksi berhasil", map[string]interface{}{"id": id, "source": source.Slug, "folder": source.RootFolderID})
}

func (h *Handler) startSync(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	source, err := h.repo.GetSource(id)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	job, err := h.svc.StartSync(id)
	if err != nil {
		_ = h.repo.SetSourceState(id, "error", "error", err.Error())
		writeAPIError(w, http.StatusConflict, logger.CorrelationID(r), err.Error(), nil)
		return
	}
	h.audit(r, "google_drive.sources.sync", "Mulai sync sumber #"+strconv.FormatInt(id, 10)+" folder "+source.RootFolderID)
	writeJSONResponse(w, http.StatusOK, true, "Sinkronisasi dimulai", map[string]interface{}{
		"source_id": id,
		"job":       job.snapshot(),
	})
}

func (h *Handler) syncStatus(w http.ResponseWriter, r *http.Request) {
	id := parseID(chi.URLParam(r, "id"))
	if _, err := h.repo.GetSource(id); err != nil {
		writeAPIError(w, http.StatusNotFound, logger.CorrelationID(r), "Sumber storage tidak ditemukan", nil)
		return
	}
	job := h.svc.GetSyncJob(id)
	lastRun, _ := h.repo.LatestRun(id)
	var jobView map[string]interface{}
	if job != nil {
		jobView = job.snapshot()
	}
	writeJSONResponse(w, http.StatusOK, true, "Status sinkronisasi", map[string]interface{}{
		"source_id": id,
		"job":       jobView,
		"last_run":  lastRun,
	})
}

// ── helpers ──────────────────────────────────────────────

func parseID(raw string) int64 {
	id, _ := strconv.ParseInt(raw, 10, 64)
	return id
}

func (h *Handler) countSourceMedia(slug string) (int, error) {
	var n int
	err := h.repo.db.QueryRow(`SELECT COUNT(*) FROM gallery WHERE album_slug = ? AND source = 'gdrive'`, slug).Scan(&n)
	return n, err
}

func normalizeSlug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	lastDash := false
	for _, c := range s {
		switch {
		case c >= 'a' && c <= 'z', c >= '0' && c <= '9':
			b.WriteRune(c)
			lastDash = false
		case c == ' ', c == '-', c == '_', c == '.':
			if !lastDash && b.Len() > 0 {
				b.WriteByte('-')
				lastDash = true
			}
		default:
			// skip non-ascii; keep separators minimal
			if !lastDash && b.Len() > 0 {
				b.WriteByte('-')
				lastDash = true
			}
		}
	}
	res := strings.Trim(b.String(), "-")
	if res == "" {
		return ""
	}
	return res
}

// urlEncode ensures the query param in redirects is safe. Kept minimal: URL
// escaping handled by http.Redirect for non-ASCII; wrap spaces for readability.
func urlEncode(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(s, " ", "%20"), "#", "%23")
}