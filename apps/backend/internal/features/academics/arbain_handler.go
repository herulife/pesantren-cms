package academics

import (
	"net/http"
	"strconv"
	"strings"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/scope"
	"almaparung-api/internal/validators"

	"github.com/go-chi/chi/v5"
)

// arbainTotalHadits = jumlah butir Hadis Arbain Imam Nawawi.
const arbainTotalHadits = 42

// validateArbainProgress memvalidasi payload setoran hadis Arbain.
func validateArbainProgress(p *ArbainProgress) map[string][]string {
	errs := map[string][]string{}
	if p.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	}
	if p.HadithNumber < 1 || p.HadithNumber > arbainTotalHadits {
		errs["hadith_number"] = []string{"Nomor hadis harus 1-42"}
	}
	if p.Status != ArbainStatusProses && p.Status != ArbainStatusSetor && p.Status != ArbainStatusLulus {
		errs["status"] = []string{"Status harus proses/setor/lulus"}
	}
	if p.Nilai < 0 || p.Nilai > 100 {
		errs["nilai"] = []string{"Nilai harus 0-100"}
	}
	if strings.TrimSpace(p.EvaluationDate) == "" {
		errs["evaluation_date"] = []string{"Tanggal penilaian wajib diisi"}
	} else if !validators.ValidateDate(strings.TrimSpace(p.EvaluationDate)) {
		errs["evaluation_date"] = []string{"Tanggal harus format YYYY-MM-DD"}
	}
	if len(errs) == 0 {
		return nil
	}
	return errs
}

// canWriteArbainGrade = hanya ustadz (ataurole full access) yang boleh mencatat setoran.
func canWriteArbainGrade(role string) bool {
	return scope.FullAccess(role) || role == "ustadz"
}

// GetArbainReference mengembalikan daftar 42 hadis Arbain (read-only, tanpa authzed role khusus).
func (h *Handler) GetArbainReference(w http.ResponseWriter, r *http.Request) {
	writeJSONResponse(w, http.StatusOK, true, "Daftar Hadis Arbain berhasil dimuat", HadisArbainList())
}

// GetArbainProgress mengembalikan catatan setoran hadis Arbain.
// wali_kelas -> hanya kelasnya; role lain yang punya akses -> semua.
func (h *Handler) GetArbainProgress(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	if role == "guru" {
		writeJSONResponse(w, http.StatusForbidden, false, "Guru tidak berwenang melihat data Arbain", nil)
		return
	}
	var list []ArbainProgress
	var err error
	if role == "wali_kelas" {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			list, err = h.repo.GetScopedArbainProgress(sc.Classes, limit, offset)
		}
	} else {
		list, err = h.repo.GetAllArbainProgress(limit, offset)
	}
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data setoran Arbain berhasil dimuat", list)
}

// GetMyArbainProgress mengembalikan catatan setoran milik Buffer Santri yang login.
func (h *Handler) GetMyArbainProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(r)
	if !ok {
		writeJSONResponse(w, http.StatusUnauthorized, false, "Akses belum diizinkan", nil)
		return
	}
	list, err := h.repo.GetArbainProgressByStudent(userID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	summary, err := h.repo.GetArbainSummaryByStudent(userID)
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data Arbain berhasil dimuat", map[string]interface{}{
		"progress": list,
		"summary":  summary,
	})
}

// CreateArbainProgress mencatat setoran hadis baru.
func (h *Handler) CreateArbainProgress(w http.ResponseWriter, r *http.Request) {
	var p ArbainProgress
	if err := validators.DecodeJSON(w, r, &p); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateArbainProgress(&p); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !canWriteArbainGrade(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian Arbain hanya oleh ustadz", nil)
		return
	}
	if err := h.repo.CreateArbainProgress(&p); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Setoran Arbain berhasil ditambahkan", p)
}

// UpdateArbainProgress mengubah catatan setoran yang ada.
func (h *Handler) UpdateArbainProgress(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var p ArbainProgress
	if err := validators.DecodeJSON(w, r, &p); err != nil {
		writeJSONResponse(w, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}
	if errs := validateArbainProgress(&p); errs != nil {
		writeJSONValidationError(w, errs)
		return
	}
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !canWriteArbainGrade(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian Arbain hanya oleh ustadz", nil)
		return
	}
	if err := h.repo.UpdateArbainProgress(id, &p); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Setoran Arbain berhasil diperbarui", p)
}

// DeleteArbainProgress menghapus catatan setoran.
func (h *Handler) DeleteArbainProgress(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	role, _ := auth.GetAuthenticatedRole(r.Context())
	if !canWriteArbainGrade(role) {
		writeJSONResponse(w, http.StatusForbidden, false, "Penilaian Arbain hanya oleh ustadz", nil)
		return
	}
	if err := h.repo.DeleteArbainProgress(id); err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Setoran Arbain berhasil dihapus", nil)
}