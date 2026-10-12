package raport

import (
	"darussunnah-api/internal/platform/weight"
	"database/sql"
	"fmt"
)

// SubjectWeight is used to update subject weights (with SUM==100 validation).
type SubjectWeight struct {
	SubjectID int     `json:"subject_id"`
	Weight    float64 `json:"weight"`
	KKM       float64 `json:"kkm"`
}

// ListSubjectsExtended returns subjects with their E-Raport config.
func (r *Repository) ListSubjectsExtended() ([]map[string]interface{}, error) {
	rows, err := r.db.Query(`
		SELECT id, name, category, teacher_id, weight, kkm, sort_order, is_active
		FROM subjects ORDER BY sort_order ASC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []map[string]interface{}
	for rows.Next() {
		var id int
		var name, category string
		var teacherID sql.NullInt64
		var weight, kkm float64
		var sortOrder, isActive int
		if err := rows.Scan(&id, &name, &category, &teacherID, &weight, &kkm, &sortOrder, &isActive); err != nil {
			return nil, err
		}
		ti := interface{}(nil)
		if teacherID.Valid {
			ti = teacherID.Int64
		}
		list = append(list, map[string]interface{}{
			"id": id, "name": name, "category": category, "teacher_id": ti,
			"weight": weight, "kkm": kkm, "sort_order": sortOrder, "is_active": isActive == 1,
		})
	}
	return list, nil
}

// UpdateSubjectsWeights validates total ==100 for active subjects then updates.
func (r *Repository) UpdateSubjectsWeights(items []SubjectWeight) error {
	// 1. Load current active subjects
	rows, err := r.db.Query(`SELECT id, name, weight, is_active FROM subjects`)
	if err != nil {
		return err
	}
	current := map[int]float64{}  // id -> weight
	isActive := map[int]int{}
	for rows.Next() {
		var id int
		var name string
		var w float64
		var act int
		if err := rows.Scan(&id, &name, &w, &act); err != nil {
			rows.Close()
			return err
		}
		current[id] = w
		isActive[id] = act
		_ = name
	}
	rows.Close()

	// 2. Apply new weights
	names := map[int]string{}
	if err != nil {
		return err
	}
	newWeights := map[string]float64{}
	weightsOfID := map[int]float64{}
	// find names for active subjects
	nRows, err := r.db.Query(`SELECT id, name FROM subjects`)
	if err != nil {
		return err
	}
	for nRows.Next() {
		var id int
		var name string
		nRows.Scan(&id, &name)
		names[id] = name
	}
	nRows.Close()

	for _, it := range items {
		if isActive[it.SubjectID] != 1 {
			continue
		}
		current[it.SubjectID] = it.Weight
		weightsOfID[it.SubjectID] = it.Weight
	}
	for id, w := range current {
		if isActive[id] != 1 {
			continue
		}
		newWeights[names[id]] = w
	}
	if err := weight.ValidateWeights(newWeights); err != nil {
		return fmt.Errorf("bobot mata pelajaran: %w", err)
	}
	// 3. Update each
	for id, w := range weightsOfID {
		if _, err := r.db.Exec(`UPDATE subjects SET weight = ? WHERE id = ?`, w, id); err != nil {
			return err
		}
	}
	return nil
}
