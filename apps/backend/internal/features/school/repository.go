package school

import (
	"database/sql"
	"strings"
	"time"
)

type Class struct {
	ID        int       `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Jenjang   string    `json:"jenjang"`
	WaliName  string    `json:"wali_name"`
	Year      string    `json:"academic_year"`
	IsActive  int       `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AcademicYear struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	StartDate string    `json:"start_date"`
	EndDate   string    `json:"end_date"`
	IsActive  int       `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) ListClasses(activeOnly bool) ([]Class, error) {
	q := `SELECT id, code, name, jenjang, wali_name, academic_year, is_active, created_at, updated_at FROM classes`
	if activeOnly {
		q += ` WHERE is_active=1`
	}
	q += ` ORDER BY name`
	rows, err := r.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Class{}
	for rows.Next() {
		var c Class
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Jenjang, &c.WaliName, &c.Year, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) CreateClass(name, jenjang, wali, year string) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO classes (name, jenjang, wali_name, academic_year) VALUES (?, ?, ?, ?)`, strings.TrimSpace(name), strings.TrimSpace(jenjang), strings.TrimSpace(wali), strings.TrimSpace(year))
	if err != nil {
		return 0, err
	}
	id, _ := res.LastInsertId()
	code := padClass(id)
	_, _ = r.db.Exec(`UPDATE classes SET code=? WHERE id=?`, code, id)
	return id, nil
}

func padClass(id int64) string {
	n := ""
	for v := id; v > 0; v /= 10 {
		n = string(rune('0'+v%10)) + n
	}
	if n == "" {
		n = "0"
	}
	for len(n) < 3 {
		n = "0" + n
	}
	return n
}

func (r *Repository) UpdateClass(id int, name, jenjang, wali, year string, active int) error {
	_, err := r.db.Exec(`UPDATE classes SET name=?, jenjang=?, wali_name=?, academic_year=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, strings.TrimSpace(name), strings.TrimSpace(jenjang), strings.TrimSpace(wali), strings.TrimSpace(year), active, id)
	return err
}

func (r *Repository) DeleteClass(id int) error {
	_, err := r.db.Exec(`DELETE FROM classes WHERE id=?`, id)
	return err
}

func (r *Repository) ListYears() ([]AcademicYear, error) {
	rows, err := r.db.Query(`SELECT id, name, start_date, end_date, is_active, created_at, updated_at FROM academic_years ORDER BY name DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AcademicYear{}
	for rows.Next() {
		var y AcademicYear
		if err := rows.Scan(&y.ID, &y.Name, &y.StartDate, &y.EndDate, &y.IsActive, &y.CreatedAt, &y.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, y)
	}
	return out, rows.Err()
}

func (r *Repository) CreateYear(name, start, end string) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO academic_years (name, start_date, end_date) VALUES (?, ?, ?)`, strings.TrimSpace(name), start, end)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateYear(id int, name, start, end string, active int) error {
	_, err := r.db.Exec(`UPDATE academic_years SET name=?, start_date=?, end_date=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, strings.TrimSpace(name), start, end, active, id)
	return err
}

func (r *Repository) SetActiveYear(id int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`UPDATE academic_years SET is_active=0`); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE academic_years SET is_active=1 WHERE id=?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *Repository) DeleteYear(id int) error {
	_, err := r.db.Exec(`DELETE FROM academic_years WHERE id=?`, id)
	return err
}
