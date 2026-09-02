package raport

import (
	"encoding/json"
	"net/http"
)

// GetSubjects returns subjects with E-Raport config.
func (h *Handler) GetSubjects(w http.ResponseWriter, r *http.Request) {
	list, err := h.repo.ListSubjectsExtended()
	if err != nil {
		writeJSON(w, 500, "Gagal memuat mata pelajaran: "+err.Error(), nil)
		return
	}
	if list == nil {
		list = []map[string]interface{}{}
	}
	writeJSON(w, 200, "Daftar mata pelajaran", list)
}

// UpdateSubjects accepts [{subject_id, weight, kkm}, ...] and validates SUM==100.
func (h *Handler) UpdateSubjects(w http.ResponseWriter, r *http.Request) {
	var items []SubjectWeight
	if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
		writeJSON(w, 400, "Payload tidak valid", nil)
		return
	}
	if len(items) == 0 {
		writeJSON(w, 400, "Tidak ada data bobot mapel", nil)
		return
	}
	if err := h.repo.UpdateSubjectsWeights(items); err != nil {
		writeJSON(w, 400, err.Error(), nil)
		return
	}
	writeJSON(w, 200, "Bobot mapel diperbarui (total 100%)", items)
}
