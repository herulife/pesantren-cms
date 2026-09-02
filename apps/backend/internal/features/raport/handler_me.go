package raport

import (
	"net/http"

	"almaparung-api/internal/features/auth"
)

// GetMine returns the current authenticated user's (santri) E-Raport.
// GET /portal/raport/me?semester=1&academic_year=2025%2F2026
func (h *Handler) GetMine(w http.ResponseWriter, r *http.Request) {
	uid, ok := auth.CurrentUserID(r.Context())
	if !ok {
		writeJSON(w, 401, "Akses belum diizinkan", nil)
		return
	}
	semester := r.URL.Query().Get("semester")
	if semester == "" {
		semester = "1"
	}
	ay := r.URL.Query().Get("academic_year")
	if ay == "" {
		ay = "2025/2026"
	}
	// Return stored raport first if locked; else compute live.
	if stored, err := h.repo.GetStored(r.Context(), uid, semester, ay); err == nil {
		writeJSON(w, 200, "Rapor santri", stored)
		return
	}
	res, err := h.repo.Compute(r.Context(), uid, semester, ay, map[string]int{"mapel": 50, "project": 25, "kesantrian": 25})
	if err != nil {
		writeJSON(w, 404, "Belum ada data rapor untuk semester ini", nil)
		return
	}
	res.Status = "live"
	writeJSON(w, 200, "Rapor santri", res)
}
