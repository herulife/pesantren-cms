package academics

import (
	"database/sql"
	"strings"
)

// GetAllArbainProgress mengembalikan seluruh catatan setoran Arbain.
func (r *Repository) GetAllArbainProgress(limit, offset int) ([]ArbainProgress, error) {
	query := `
		SELECT p.id, p.student_id, u.name as student_name, p.hadith_number, p.status,
			p.nilai, p.notes, p.evaluation_date
		FROM arbain_progress p
		JOIN users u ON u.id = p.student_id
		ORDER BY p.evaluation_date DESC, p.hadith_number ASC`
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
	}
	args := []interface{}{}
	if limit > 0 {
		args = append(args, limit, offset)
	}
	return r.queryArbainProgress(query, args...)
}

// GetScopedArbainProgress = GetAllArbainProgress dibatasi kelas tertentu (wali_kelas).
func (r *Repository) GetScopedArbainProgress(classes []string, limit, offset int) ([]ArbainProgress, error) {
	if len(classes) == 0 {
		return []ArbainProgress{}, nil
	}
	ph := make([]string, 0, len(classes))
	args := []interface{}{}
	for _, c := range classes {
		ph = append(ph, "?")
		args = append(args, c)
	}
	query := `
		SELECT p.id, p.student_id, u.name as student_name, p.hadith_number, p.status,
			p.nilai, p.notes, p.evaluation_date
		FROM arbain_progress p
		JOIN users u ON u.id = p.student_id
		LEFT JOIN santri st ON st.user_id = p.student_id
		WHERE st.class IN (` + strings.Join(ph, ",") + `)
		ORDER BY p.evaluation_date DESC, p.hadith_number ASC`
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, limit, offset)
	}
	return r.queryArbainProgress(query, args...)
}

// GetArbainProgressByStudent = catatan setoran Arbain milik satu Buffer Santri.
func (r *Repository) GetArbainProgressByStudent(studentID int) ([]ArbainProgress, error) {
	query := `
		SELECT p.id, p.student_id, u.name as student_name, p.hadith_number, p.status,
			p.nilai, p.notes, p.evaluation_date
		FROM arbain_progress p
		JOIN users u ON u.id = p.student_id
		WHERE p.student_id = ?
		ORDER BY p.hadith_number ASC`
	return r.queryArbainProgress(query, studentID)
}

// GetArbainSummaryByStudent menghitung rekap setoran Arbain satu Buffer Santri.
func (r *Repository) GetArbainSummaryByStudent(studentID int) (*ArbainSummary, error) {
	query := `SELECT status, COUNT(*) FROM arbain_progress WHERE student_id = ? GROUP BY status`
	rows, err := r.db.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	summary := &ArbainSummary{Status: map[string]int{}}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		summary.Status[status] = count
		summary.Total += count
	}
	return summary, nil
}

// CreateArbainProgress inserts catatan setoran baru.
func (r *Repository) CreateArbainProgress(p *ArbainProgress) error {
	query := `INSERT INTO arbain_progress (student_id, hadith_number, status, nilai, notes, evaluation_date)
		VALUES (?, ?, ?, ?, ?, ?)`
	res, err := r.db.Exec(query, p.StudentID, p.HadithNumber, p.Status, p.Nilai, p.Notes, p.EvaluationDate)
	if err != nil {
		return err
	}
	id64, _ := res.LastInsertId()
	p.ID = int(id64)
	return nil
}

// UpdateArbainProgress mengubah catatan setoran yang ada.
func (r *Repository) UpdateArbainProgress(id int, p *ArbainProgress) error {
	query := `UPDATE arbain_progress SET student_id=?, hadith_number=?, status=?, nilai=?, notes=?, evaluation_date=? WHERE id=?`
	_, err := r.db.Exec(query, p.StudentID, p.HadithNumber, p.Status, p.Nilai, p.Notes, p.EvaluationDate, id)
	return err
}

// DeleteArbainProgress menghapus catatan setoran.
func (r *Repository) DeleteArbainProgress(id int) error {
	_, err := r.db.Exec(`DELETE FROM arbain_progress WHERE id = ?`, id)
	return err
}

func (r *Repository) queryArbainProgress(query string, args ...interface{}) ([]ArbainProgress, error) {
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ArbainProgress{}
	for rows.Next() {
		var p ArbainProgress
		if err := rows.Scan(&p.ID, &p.StudentID, &p.StudentName, &p.HadithNumber,
			&p.Status, &p.Nilai, &p.Notes, &p.EvaluationDate); err != nil {
			return nil, err
		}
		// lengkapi dari reference hadis supaya frontend tidak perlu fetch terpisah
		if h, ok := ArbainByNomor(p.HadithNumber); ok {
			p.HadithTitle = h.Title
			p.Category = h.Category
			p.Translation = h.Translation
			p.Source = h.Source
		}
		out = append(out, p)
	}
	return out, nil
}

// ArbainStudentID mengembalikan student_id dari satu catatan Arbain.
func ArbainStudentID(db *sql.DB, progressID int) (int, error) {
	var studentID int
	err := db.QueryRow(`SELECT student_id FROM arbain_progress WHERE id = ?`, progressID).Scan(&studentID)
	return studentID, err
}
