package santri

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/logger"
)

// ErrPurgeStaffUser dikembalikan bila akun yang tertaut ke santri bukan akun
// portal role='user' (mis. akun staf). Purge dibatalkan agar tidak menghapus
// akun operasional.
var ErrPurgeStaffUser = fmt.Errorf("akun tertaut bukan akun portal santri; purge dibatalkan")

// PurgeSantri menghapus santri beserta SELURUH data terkaitnya dalam satu
// transaksi: tagihan SPP/iuran (termasuk yang sudah dibayar/lunas),
// kwitansi & transaksi pembayaran, nilai, rapor tersimpan, aspek kesantrian,
// presensi, tahfidz, poin, pelanggaran, sesi ujian + jawaban, wallet + QR,
// pembayaran PSB, registrasi PSB + invoice + notifikasi WA terkait, baris
// santri, dan akun portal (users) miliknya.
//
// Operasi ini destruktif dan tidak bisa dibatalkan. Pemanggil (handler) wajib
// membatasi hanya untuk superadmin dan mencatat audit.
func (r *Repository) PurgeSantri(id int) (map[string]int64, error) {
	var userID sql.NullInt64
	var regID int
	err := r.db.QueryRow(`SELECT user_id, COALESCE(registration_id,0) FROM santri WHERE id=?`, id).
		Scan(&userID, &regID)
	if err != nil {
		return nil, err // sql.ErrNoRows bila santri tidak ada
	}

	var uid int64
	var hasUser bool
	if userID.Valid && userID.Int64 > 0 {
		var role string
		if err := r.db.QueryRow(`SELECT role FROM users WHERE id=?`, userID.Int64).Scan(&role); err != nil {
			return nil, err
		}
		if role != "user" {
			return nil, ErrPurgeStaffUser
		}
		uid = userID.Int64
		hasUser = true
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	counts := map[string]int64{}
	execCount := func(key, query string, args ...interface{}) error {
		res, err := tx.Exec(query, args...)
		if err != nil {
			return fmt.Errorf("%s: %w", key, err)
		}
		n, _ := res.RowsAffected()
		counts[key] = n
		return nil
	}

	// 1. Data akademik & aktivitas milik akun portal (kunci users.id).
	if hasUser {
		if err := execCount("exam_answers", `DELETE FROM exam_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE student_id=?)`, uid); err != nil {
			return nil, err
		}
		for key, q := range map[string]string{
			"exam_sessions":    `DELETE FROM exam_sessions WHERE student_id=?`,
			"grades":           `DELETE FROM grades WHERE student_id=?`,
			"raports":          `DELETE FROM raports WHERE student_id=?`,
			"kesantrian_aspek": `DELETE FROM kesantrian_aspek WHERE student_id=?`,
			"attendance":       `DELETE FROM attendance WHERE student_id=?`,
			"tahfidz_progress": `DELETE FROM tahfidz_progress WHERE student_id=?`,
			"student_points":   `DELETE FROM student_points WHERE student_id=?`,
			"violation_logs":   `DELETE FROM violation_logs WHERE student_id=?`,
			"payments":         `DELETE FROM payments WHERE user_id=?`,
			"psb_payments":     `DELETE FROM psb_payments WHERE user_id=?`,
			"user_qr_tokens":   `DELETE FROM user_qr_tokens WHERE user_id=?`,
			"activity_logs":    `DELETE FROM activity_logs WHERE user_id=?`,
		} {
			if err := execCount(key, q, uid); err != nil {
				return nil, err
			}
		}
		if err := execCount("wallet_transactions", `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM user_wallets WHERE user_id=?)`, uid); err != nil {
			return nil, err
		}
		if err := execCount("user_wallets", `DELETE FROM user_wallets WHERE user_id=?`, uid); err != nil {
			return nil, err
		}
	}

	// 2. Keuangan milik santri (kunci santri.id) — termasuk yang sudah dibayar.
	for key, q := range map[string]string{
		"spp_bills":            `DELETE FROM spp_bills WHERE santri_id=?`,
		"iuran_bills":          `DELETE FROM iuran_bills WHERE santri_id=?`,
		"payment_transactions": `DELETE FROM payment_transactions WHERE santri_id=?`,
		"receipts":             `DELETE FROM receipts WHERE santri_id=?`,
	} {
		if err := execCount(key, q, id); err != nil {
			return nil, err
		}
	}

	// 3. Jejak PSB milik santri (kunci registration_id).
	if regID > 0 {
		for key, q := range map[string]string{
			"invoices":         `DELETE FROM invoices WHERE registration_id=?`,
			"psb_payments_reg": `DELETE FROM psb_payments WHERE registration_id=?`,
			"wa_notifications": `DELETE FROM wa_notifications WHERE registration_id=?`,
		} {
			if err := execCount(key, q, regID); err != nil {
				return nil, err
			}
		}
		if err := execCount("registrations", `DELETE FROM registrations WHERE id=?`, regID); err != nil {
			return nil, err
		}
	}

	// 4. Baris santri, lalu akun portal.
	if err := execCount("santri", `DELETE FROM santri WHERE id=?`, id); err != nil {
		return nil, err
	}
	if counts["santri"] == 0 {
		return nil, sql.ErrNoRows
	}
	if hasUser {
		if err := execCount("users", `DELETE FROM users WHERE id=?`, uid); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true
	return counts, nil
}

// Purge menghapus total satu santri beserta seluruh data terkaitnya.
// HANYA superadmin. Konfirmasi ganda wajib dilakukan di UI.
func (h *Handler) Purge(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if role != "superadmin" {
		sendJSONResponse(w, http.StatusForbidden, false, "Hanya superadmin yang dapat menghapus total santri", nil)
		return
	}
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if id <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "ID santri tidak valid", nil)
		return
	}
	counts, err := h.repo.PurgeSantri(id)
	if err != nil {
		if err == sql.ErrNoRows {
			sendJSONResponse(w, http.StatusNotFound, false, "Santri tidak ditemukan", nil)
			return
		}
		if err == ErrPurgeStaffUser {
			sendJSONResponse(w, http.StatusUnprocessableEntity, false, err.Error(), nil)
			return
		}
		logger.Error(r.Context(), "santri purge failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menghapus total santri", nil)
		return
	}
	actorID, _ := auth.GetAuthenticatedUserID(r.Context())
	actorRole, _ := auth.GetAuthenticatedRole(r.Context())
	audit.Record(r.Context(), audit.Entry{
		RequestID: logger.CorrelationID(r), ActorID: actorID, ActorRole: actorRole,
		Action: "PURGE_SANTRI", Entity: "santri", EntityID: strconv.Itoa(id),
		After: map[string]interface{}{"deleted": counts},
		IP: r.RemoteAddr, UserAgent: r.UserAgent(),
	})
	total := int64(0)
	for _, n := range counts {
		total += n
	}
	sendJSONResponse(w, http.StatusOK, true,
		fmt.Sprintf("Santri dan seluruh datanya dihapus total (%d baris)", total),
		map[string]interface{}{"deleted": counts})
}
