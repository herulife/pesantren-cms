package hr

import (
	"database/sql"
	"strings"
	"time"
)

type Employee struct {
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Gender    string    `json:"gender"`
	BirthPlace string   `json:"birth_place"`
	BirthDate string    `json:"birth_date"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Kind      string    `json:"kind"`
	IsActive  int       `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Attendance struct {
	ID           int    `json:"id"`
	EmployeeCode string `json:"employee_code"`
	EmployeeName string `json:"employee_name,omitempty"`
	Date         string `json:"date"`
	Status       string `json:"status"`
	Notes        string `json:"notes"`
	TimeIn       string `json:"time_in"`
	TimeOut      string `json:"time_out"`
	Minutes      int    `json:"minutes"`
}

type PerGuruSummary struct {
	WithoutInfo int `json:"without_info"`
	Present     int `json:"present"`
	Sick        int `json:"sick"`
	Permit      int `json:"permit"`
	TotalMin    int `json:"total_minutes"`
	Count       int `json:"count"`
}

type RekapRow struct {
	Code       string  `json:"code"`
	Name       string  `json:"name"`
	Days       int     `json:"days"`
	Present    int     `json:"present"`
	Sick       int     `json:"sick"`
	Permit     int     `json:"permit"`
	Alpha      int     `json:"alpha"`
	Percent    float64 `json:"percent"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) ListEmployees(activeOnly bool, search string) ([]Employee, error) {
	q := `SELECT code, name, gender, birth_place, birth_date, phone, email, kind, is_active, created_at, updated_at FROM employees WHERE 1=1`
	args := []interface{}{}
	if activeOnly {
		q += ` AND is_active=1`
	}
	if search != "" {
		q += ` AND (code LIKE ? OR name LIKE ?)`
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	q += ` ORDER BY name`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Employee{}
	for rows.Next() {
		var e Employee
		if err := rows.Scan(&e.Code, &e.Name, &e.Gender, &e.BirthPlace, &e.BirthDate, &e.Phone, &e.Email, &e.Kind, &e.IsActive, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (r *Repository) CreateEmployee(e *Employee) error {
	_, err := r.db.Exec(`INSERT INTO employees (code, name, gender, birth_place, birth_date, phone, email, kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		strings.TrimSpace(e.Code), strings.TrimSpace(e.Name), e.Gender, e.BirthPlace, e.BirthDate, e.Phone, e.Email, e.Kind)
	return err
}

func (r *Repository) UpdateEmployee(e *Employee) error {
	_, err := r.db.Exec(`UPDATE employees SET name=?, gender=?, birth_place=?, birth_date=?, phone=?, email=?, kind=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE code=?`,
		strings.TrimSpace(e.Name), e.Gender, e.BirthPlace, e.BirthDate, e.Phone, e.Email, e.Kind, e.IsActive, e.Code)
	return err
}

func (r *Repository) DeleteEmployee(code string) error {
	_, err := r.db.Exec(`DELETE FROM employees WHERE code=?`, code)
	return err
}

func minutesBetween(in, out string) int {
	parse := func(s string) (int, bool) {
		s = strings.TrimSpace(s)
		if len(s) < 5 {
			return 0, false
		}
		var h, m, sec int
		n, _ := time.Parse("15:04:05", s)
		if n.IsZero() {
			n2, err := time.Parse("15:04", s[:5])
			if err != nil {
				return 0, false
			}
			n = n2
		}
		h, m, sec = n.Clock()
		_ = sec
		return h*60 + m, true
	}
	a, ok1 := parse(in)
	b, ok2 := parse(out)
	if !ok1 || !ok2 || b < a {
		return 0
	}
	return b - a
}

func (r *Repository) ListAttendance(code, from, to string) ([]Attendance, error) {
	q := `SELECT a.id, a.employee_code, COALESCE(e.name,'') , a.date, a.status, a.notes, a.time_in, a.time_out
		FROM teacher_attendance a LEFT JOIN employees e ON e.code=a.employee_code WHERE 1=1`
	args := []interface{}{}
	if code != "" {
		q += ` AND a.employee_code=?`
		args = append(args, code)
	}
	if from != "" {
		q += ` AND a.date>=?`
		args = append(args, from)
	}
	if to != "" {
		q += ` AND a.date<=?`
		args = append(args, to)
	}
	q += ` ORDER BY a.date DESC, a.id DESC`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Attendance{}
	for rows.Next() {
		var a Attendance
		if err := rows.Scan(&a.ID, &a.EmployeeCode, &a.EmployeeName, &a.Date, &a.Status, &a.Notes, &a.TimeIn, &a.TimeOut); err != nil {
			return nil, err
		}
		a.Minutes = minutesBetween(a.TimeIn, a.TimeOut)
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *Repository) CreateAttendance(a *Attendance) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO teacher_attendance (employee_code, date, status, notes, time_in, time_out) VALUES (?, ?, ?, ?, ?, ?)`,
		a.EmployeeCode, a.Date, a.Status, a.Notes, a.TimeIn, a.TimeOut)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateAttendance(a *Attendance) error {
	_, err := r.db.Exec(`UPDATE teacher_attendance SET status=?, notes=?, time_in=?, time_out=? WHERE id=?`,
		a.Status, a.Notes, a.TimeIn, a.TimeOut, a.ID)
	return err
}

func (r *Repository) DeleteAttendance(id int) error {
	_, err := r.db.Exec(`DELETE FROM teacher_attendance WHERE id=?`, id)
	return err
}

func (r *Repository) PerGuruSummary(code, from, to string) (*PerGuruSummary, *[]Attendance, error) {
	list, err := r.ListAttendance(code, from, to)
	if err != nil {
		return nil, nil, err
	}
	s := &PerGuruSummary{}
	for _, a := range list {
		s.Count++
		s.TotalMin += a.Minutes
		switch a.Status {
		case "Masuk":
			s.Present++
		case "Sakit":
			s.Sick++
		case "Ijin":
			s.Permit++
		default:
			s.WithoutInfo++
		}
	}
	return s, &list, nil
}

func (r *Repository) Rekap(from, to string, dayCount int) ([]RekapRow, error) {
	emps, err := r.ListEmployees(true, "")
	if err != nil {
		return nil, err
	}
	out := []RekapRow{}
	for _, e := range emps {
		list, err := r.ListAttendance(e.Code, from, to)
		if err != nil {
			return nil, err
		}
		row := RekapRow{Code: e.Code, Name: e.Name, Days: dayCount}
		for _, a := range list {
			switch a.Status {
			case "Masuk":
				row.Present++
			case "Sakit":
				row.Sick++
			case "Ijin":
				row.Permit++
			default:
				row.Alpha++
			}
		}
		recorded := row.Present + row.Sick + row.Permit + row.Alpha
		if dayCount > 0 {
			unrecorded := dayCount - recorded
			if unrecorded > 0 {
				row.Alpha += unrecorded
			}
			row.Percent = float64(row.Present) / float64(dayCount) * 100
		} else if recorded > 0 {
			row.Percent = float64(row.Present) / float64(recorded) * 100
		}
		out = append(out, row)
	}
	return out, nil
}
