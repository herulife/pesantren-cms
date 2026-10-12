package upload

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

// PHASE 4: bukti pembayaran bersifat PRIVATE. File proofs disimpan di
// ./public/uploads/proofs/ dan HANYA disajikan via ServeProof (auth +
// ownership), bukan FileServer publik.

var allowedProofExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
}

// randomFileName menghasilkan nama file acak (tidak prediktabel, tanpa nama user).
func randomFileName(ext string) (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]) + ext, nil
}

// ValidateProofURL memastikan proof_url menunjuk ke file upload internal yang
// aman: path relatif /uploads/, tanpa traversal, tanpa scheme, ekstensi image.
func ValidateProofURL(u string) error {
	u = strings.TrimSpace(u)
	if u == "" {
		return fmt.Errorf("bukti pembayaran wajib diisi")
	}
	if len(u) > 255 {
		return fmt.Errorf("URL bukti terlalu panjang")
	}
	if !strings.HasPrefix(u, "/uploads/") {
		return fmt.Errorf("URL bukti tidak valid")
	}
	if strings.Contains(u, "..") || strings.Contains(u, "\\") || strings.Contains(u, "://") {
		return fmt.Errorf("URL bukti tidak valid")
	}
	ext := strings.ToLower(filepath.Ext(u))
	if !allowedProofExt[ext] {
		return fmt.Errorf("format bukti harus JPG, JPEG, PNG, GIF, atau WEBP")
	}
	return nil
}

// ServeProof menyajikan file bukti pembayaran hanya untuk pemilik / bendahara /
// superadmin. File legacy di /uploads root tetap publik (KNOWN ISSUE, backfill
// PHASE 10); file baru wajib di /uploads/proofs/.
func ServeProof(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		file := chi.URLParam(r, "file")
		if file == "" || strings.ContainsAny(file, "/\\") || len(file) > 128 {
			http.NotFound(w, r)
			return
		}
		lower := strings.ToLower(file)
		for i := 0; i < len(lower); i++ {
			c := lower[i]
			if !(c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '.' || c == '-' || c == '_') {
				http.NotFound(w, r)
				return
			}
		}
		if !allowedProofExt[strings.ToLower(filepath.Ext(file))] {
			http.NotFound(w, r)
			return
		}

		user, ok := auth.GetAuthenticatedUser(r)
		if !ok {
			w.Header().Set("Cache-Control", "no-store")
			http.Error(w, `{"success":false,"message":"Akses belum diizinkan"}`, http.StatusUnauthorized)
			return
		}
		proofPath := "/uploads/proofs/" + file
		if user.Role == "panitia_psb" {
			// Tugas verifikasi PSB: boleh melihat bukti pendaftaran mana pun.
			var onePanitia int
			qPanitia := `SELECT 1 FROM registrations WHERE payment_proof_url = ? LIMIT 1`
			if errPanitia := db.QueryRow(qPanitia, proofPath).Scan(&onePanitia); errPanitia != nil {
				w.Header().Set("Cache-Control", "no-store")
				http.Error(w, `{"success":false,"message":"Akses ditolak"}`, http.StatusForbidden)
				return
			}
		} else if user.Role != "superadmin" && user.Role != "bendahara" {
			var one int
			q := `SELECT 1 FROM spp_bills b JOIN santri s ON s.id = b.santri_id
			      WHERE b.payment_proof = ? AND s.user_id = ? LIMIT 1`
			if err := db.QueryRow(q, proofPath, user.ID).Scan(&one); err != nil {
				q2 := `SELECT 1 FROM iuran_bills b JOIN santri s ON s.id = b.santri_id
				      WHERE b.payment_proof = ? AND s.user_id = ? LIMIT 1`
				if err2 := db.QueryRow(q2, proofPath, user.ID).Scan(&one); err2 != nil {
					q3 := `SELECT 1 FROM registrations WHERE payment_proof_url = ? AND user_id = ? LIMIT 1`
					if err3 := db.QueryRow(q3, proofPath, user.ID).Scan(&one); err3 != nil {
						logger.Warn(r.Context(), "proof access denied", logger.Field{
							"correlation_id": logger.CorrelationID(r),
							"user_id":        user.ID,
							"file":           file,
						})
						w.Header().Set("Cache-Control", "no-store")
					http.Error(w, `{"success":false,"message":"Akses ditolak"}`, http.StatusForbidden)
						return
					}
				}
			}
		}

		full := filepath.Join("./public/uploads/proofs", file)
		if _, err := os.Stat(full); err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "private, max-age=300")
		http.ServeFile(w, r, full)
	}
}
