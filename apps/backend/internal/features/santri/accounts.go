package santri

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/scope"
	"almaparung-api/internal/validators"
)

// ErrUserAlreadyLinked: tidak lagi dipakai sebagai penolak. Sejak Jilid 76 satu
// akun wali boleh dipakai banyak Santri (saudara berbagi 1 login), jadi
// variabel ini dipertahankan hanya supaya kompilasi tidak breakage.
var ErrUserAlreadyLinked = fmt.Errorf("akun sudah dipakai Santri lain")

// FindAvailablePortalUsers mengembalikan akun portal (role='user') yang bisa
// dipakai untuk Santri ini.
//
// Jilid 66: satu akun wali boleh dipakai BEBAS SANTRI (saudara satu keluarga
// berbagi 1 login), jadi akun yang sudah tertaut pun WAJIB ikut ditampilkan.
// Yang disembunyikan hanya akun yatim yang masih password default NULL dan
// tidak punya anak. Akun yang sedang ditautkan (includeID) selalu tampil.
func (r *Repository) FindAvailablePortalUsers(search string, includeID int) ([]PortalUser, error) {
	query := `SELECT u.id, u.name, u.email FROM users u
		WHERE u.role = 'user'
		AND (EXISTS (SELECT 1 FROM santri s WHERE s.user_id = u.id) OR u.id = ?)`
	args := []interface{}{includeID}
	if search != "" {
		query += " AND (u.name LIKE ? OR u.email LIKE ?)"
		like := "%" + search + "%"
		args = append(args, like, like)
	}
	query += " ORDER BY u.name ASC, u.id ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := []PortalUser{}
	for rows.Next() {
		var user PortalUser
		if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}

// LinkUserExclusive menautkan Santri ke akun portal.

// Jilid 76: nama fungsi dipertahankan demi kompatibilitas route + frontend,
// tapi TIDAK lagi eksklusif. Satu akun wali boleh dipakai banyak Santri
// (saudara satu keluarga berbagi 1 login) karena index unik
// idx_santri_user_unique sudah di-drop. Yang ditegakkan sekarang: akun harus
// ada dan role='user' (akun staff tidak bisa dipakai sebagai wali).
func (r *Repository) LinkUserExclusive(santriID, userID int) error {
	var exists int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE id = ? AND role = 'user'`, userID).Scan(&exists); err != nil {
		return err
	}
	if exists == 0 {
		return sql.ErrNoRows
	}
	_, err := r.db.Exec(`UPDATE santri SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, userID, santriID)
	return err
}

// ResetLinkedPassword mengganti password akun santri yang tertaut (dipakai
// wali untuk login). Minimal 6 karakter.
func (r *Repository) ResetLinkedPassword(santriID int, newPassword string) (int, error) {
	var userID sql.NullInt64
	if err := r.db.QueryRow(`SELECT user_id FROM santri WHERE id = ?`, santriID).Scan(&userID); err != nil {
		return 0, err
	}
	if !userID.Valid || userID.Int64 == 0 {
		return 0, sql.ErrNoRows
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}
	if _, err := r.db.Exec(`UPDATE users SET password_hash = ? WHERE id = ? AND role = 'user'`, string(hash), userID.Int64); err != nil {
		return 0, err
	}
	return int(userID.Int64), nil
}

// GetAvailablePortalUsers: GET /santri/portal-users?search=&include_id=
func (h *Handler) GetAvailablePortalUsers(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role == "wali_kelas" || role == "guru" || role == "ustadz" {
		sendJSONResponse(w, http.StatusForbidden, false, "Tidak berwenang melihat daftar akun", nil)
		return
	}
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	includeID, _ := strconv.Atoi(r.URL.Query().Get("include_id"))
	users, err := h.repo.FindAvailablePortalUsers(search, includeID)
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

// LinkUserExclusiveHandler: PUT /santri/{id}/link-user-exclusive {user_id}
func (h *Handler) LinkUserExclusiveHandler(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) {
		sendJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat menautkan akun", nil)
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
		sendJSONResponse(w, http.StatusBadRequest, false, "Akun santri wajib dipilih", nil)
		return
	}
	if err := h.repo.LinkUserExclusive(id, req.UserID); err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Santri atau akun tidak ditemukan", nil)
			return
		}
		if err == ErrUserAlreadyLinked {
			sendJSONResponse(w, http.StatusConflict, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "santri link exclusive failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menautkan akun", nil)
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
	sendJSONResponse(w, http.StatusOK, true, "Akun santri berhasil ditautkan. Wali login memakai akun ini.", nil)
}

// ResetSantriPassword: POST /santri/{id}/reset-password {password}
func (h *Handler) ResetSantriPassword(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) {
		sendJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mereset password", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Password string `json:"password"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	if len(req.Password) < 6 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Password minimal 6 karakter", nil)
		return
	}
	uid, err := h.repo.ResetLinkedPassword(id, req.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Santri belum punya akun tertaut", nil)
			return
		}
		logger.Error(r.Context(), "santri reset password failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal mereset password", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "RESET_SANTRI_PASSWORD", Entity: "santri", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"user_id": uid},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	sendJSONResponse(w, http.StatusOK, true, "Password akun santri direset. Sampaikan password baru ke wali.", nil)
}

// ErrEmailTaken: email login baru sudah dipakai akun lain (balas 409).
var ErrEmailTaken = errors.New("email sudah dipakai akun lain")

// UpdateLinkedAccount mengganti email login (dan opsional password) akun
// portal yang tertaut ke santri. Password diganti -> token_version ikut
// dinaikkan supaya semua sesi lama langsung mati. Mengembalikan user_id akun
// itu + jumlah santri yang berbagi akun yang sama (saudara satu keluarga),
// supaya UI bisa memperingatkan admin sebelum mengubah login bersama.
func (r *Repository) UpdateLinkedAccount(santriID int, email, newPassword string) (int, int, error) {
	var userID sql.NullInt64
	if err := r.db.QueryRow(`SELECT user_id FROM santri WHERE id = ?`, santriID).Scan(&userID); err != nil {
		return 0, 0, err
	}
	if !userID.Valid || userID.Int64 == 0 {
		return 0, 0, sql.ErrNoRows
	}
	uid := int(userID.Int64)

	var role string
	if err := r.db.QueryRow(`SELECT role FROM users WHERE id = ?`, uid).Scan(&role); err != nil {
		return 0, 0, sql.ErrNoRows
	}
	if role != "user" {
		return 0, 0, errors.New("akun tertaut bukan akun portal")
	}

	var taken bool
	if err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = ? AND id <> ?)`, email, uid).Scan(&taken); err != nil {
		return 0, 0, err
	}
	if taken {
		return 0, 0, ErrEmailTaken
	}

	var shared int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM santri WHERE user_id = ?`, uid).Scan(&shared); err != nil {
		return 0, 0, err
	}

	if newPassword == "" {
		if _, err := r.db.Exec(`UPDATE users SET email = ? WHERE id = ?`, email, uid); err != nil {
			return 0, 0, err
		}
		return uid, shared, nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return 0, 0, err
	}
	if _, err := r.db.Exec(`UPDATE users SET email = ?, password_hash = ?, token_version = COALESCE(token_version,0) + 1 WHERE id = ?`,
		email, string(hash), uid); err != nil {
		return 0, 0, err
	}
	return uid, shared, nil
}

// UpdateSantriAccount: PUT /santri/{id}/account {email, password?}
// Satu permintaan untuk mengubah email login akun portal santri dan/atau
// password-nya. Password dikosongkan = password tidak diubah (beda dengan
// /reset-password yang selalu mengganti password).
func (h *Handler) UpdateSantriAccount(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !scope.FullAccess(role) {
		sendJSONResponse(w, http.StatusForbidden, false, "Hanya admin yang dapat mengubah akun portal", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if id <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID santri tidak valid", nil)
		return
	}
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := validators.DecodeJSON(w, r, &req); err != nil {
		sendJSONResponse(w, http.StatusBadRequest, false, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	req.Email = validators.NormalizeEmail(req.Email)
	if !validators.ValidateEmail(req.Email) {
		sendValidationError(w, map[string]string{"email": "Format email tidak valid"})
		return
	}
	if req.Password != "" && len(req.Password) < 6 {
		sendValidationError(w, map[string]string{"password": "Password minimal 6 karakter"})
		return
	}

	uid, shared, err := h.repo.UpdateLinkedAccount(id, req.Email, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			sendJSONResponse(w, http.StatusConflict, false, "Email itu sudah dipakai akun lain", nil)
		case errors.Is(err, sql.ErrNoRows):
			sendJSONResponse(w, http.StatusNotFound, false, "Santri belum punya akun tertaut", nil)
		default:
			logger.Error(r.Context(), "santri account update failed", logger.Field{"santri_id": id, "error": err.Error()})
			sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memperbarui akun portal", nil)
		}
		return
	}

	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "UPDATE_SANTRI_ACCOUNT", Entity: "santri", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"user_id": uid, "email": req.Email, "password_changed": req.Password != ""},
		IP:    r.RemoteAddr, UserAgent: r.UserAgent(),
	})

	message := "Email login akun santri diperbarui"
	if req.Password != "" {
		message = "Email dan password akun santri diperbarui. Sesi login lama otomatis dicabut."
	}
	sendJSONResponse(w, http.StatusOK, true, message, map[string]interface{}{
		"user_id":       uid,
		"shared_santri": shared,
	})
}
