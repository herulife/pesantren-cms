package notifications

import (
	"database/sql"
)

type TagihanTarget struct {
	Amount      int
	Description string
	Name        string
	Phone       string
}

type NilaiTarget struct {
	Name        string
	Phone       string
	Semester    string
	Year        string
	FinalScore  float64
	GradeLetter string
}

type PSBTarget struct {
	Name   string
	Phone  string
	Status string
}

type Repository interface {
	GetPendingTagihan() ([]TagihanTarget, error)
	GetNilai() ([]NilaiTarget, error)
	GetPSBStatus() ([]PSBTarget, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetPendingTagihan() ([]TagihanTarget, error) {
	query := `
		SELECT p.amount, p.description, u.name, u.whatsapp 
		FROM payments p 
		JOIN users u ON p.user_id = u.id 
		WHERE p.status = 'pending' AND u.whatsapp != ''
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []TagihanTarget
	for rows.Next() {
		var t TagihanTarget
		if err := rows.Scan(&t.Amount, &t.Description, &t.Name, &t.Phone); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *repository) GetNilai() ([]NilaiTarget, error) {
	query := `
		SELECT u.name, u.whatsapp, g.semester, g.academic_year, g.final_score, g.grade_letter
		FROM grades g
		JOIN users u ON g.student_id = u.id
		WHERE u.whatsapp != '' AND u.whatsapp IS NOT NULL
		ORDER BY u.id, g.subject_id
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []NilaiTarget
	for rows.Next() {
		var t NilaiTarget
		if err := rows.Scan(&t.Name, &t.Phone, &t.Semester, &t.Year, &t.FinalScore, &t.GradeLetter); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *repository) GetPSBStatus() ([]PSBTarget, error) {
	query := `
		SELECT full_name, parent_phone, status 
		FROM registrations 
		WHERE parent_phone != '' AND parent_phone IS NOT NULL
		AND status IN ('pending', 'accepted', 'rejected')
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []PSBTarget
	for rows.Next() {
		var t PSBTarget
		if err := rows.Scan(&t.Name, &t.Phone, &t.Status); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}
