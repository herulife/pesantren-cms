package project

import (
	"database/sql"
	"time"
)

type SubProject struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Code        string  `json:"code"`
	Description string  `json:"description"`
	Weight      float64 `json:"weight"`
	OrderIndex  int     `json:"order_index"`
	IsActive    bool    `json:"is_active"`
	IsDemo      bool    `json:"is_demo"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type Activity struct {
	ID           int     `json:"id"`
	SubProjectID int     `json:"sub_project_id"`
	Name         string  `json:"name"`
	Code         string  `json:"code"`
	Description  string  `json:"description"`
	Tujuan       string  `json:"tujuan"`
	Indikator    string  `json:"indikator"`
	Weight       float64 `json:"weight"`
	OrderIndex   int     `json:"order_index"`
	IsActive     bool    `json:"is_active"`
	Periode      string  `json:"periode"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type Indicator struct {
	ID         int     `json:"id"`
	ActivityID int     `json:"activity_id"`
	Name       string  `json:"name"`
	Weight     float64 `json:"weight"`
	CreatedAt  string  `json:"created_at"`
}

type IRepository interface {
	GetAllSubProjects() ([]SubProject, error)
	CreateSubProject(s *SubProject) error
	UpdateSubProject(s *SubProject) error
	DeleteSubProject(id int) error
	GetActivities(subProjectID int) ([]Activity, error)
	CreateActivity(a *Activity) error
	UpdateActivity(a *Activity) error
	DeleteActivity(id int) error
	GetIndicators(activityID int) ([]Indicator, error)
	CreateIndicator(i *Indicator) error
	DeleteIndicator(id int) error
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAllSubProjects() ([]SubProject, error) {
	rows, err := r.db.Query(`SELECT id, name, code, description, weight, order_index, is_active, is_demo, created_at, updated_at FROM project_subprojects ORDER BY order_index ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []SubProject
	for rows.Next() {
		var s SubProject
		var isActive, isDemo int
		if err := rows.Scan(&s.ID, &s.Name, &s.Code, &s.Description, &s.Weight, &s.OrderIndex, &isActive, &isDemo, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		s.IsActive = isActive == 1
		s.IsDemo = isDemo == 1
		list = append(list, s)
	}
	return list, nil
}

func (r *Repository) CreateSubProject(s *SubProject) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(`INSERT INTO project_subprojects (name, code, description, weight, order_index, is_active, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, s.Name, s.Code, s.Description, s.Weight, s.OrderIndex, boolToInt(s.IsActive), boolToInt(s.IsDemo), now, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	s.ID = int(id)
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (r *Repository) UpdateSubProject(s *SubProject) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(`UPDATE project_subprojects SET name=?, code=?, description=?, weight=?, order_index=?, is_active=?, updated_at=? WHERE id=?`, s.Name, s.Code, s.Description, s.Weight, s.OrderIndex, boolToInt(s.IsActive), now, s.ID)
	return err
}

func (r *Repository) DeleteSubProject(id int) error {
	_, err := r.db.Exec(`DELETE FROM project_subprojects WHERE id=?`, id)
	return err
}

func (r *Repository) GetActivities(subProjectID int) ([]Activity, error) {
	query := `SELECT id, sub_project_id, name, code, description, tujuan, indikator, weight, order_index, is_active, periode, created_at, updated_at FROM project_activities WHERE 1=1`
	args := []interface{}{}
	if subProjectID > 0 {
		query += " AND sub_project_id = ?"
		args = append(args, subProjectID)
	}
	query += " ORDER BY order_index ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Activity
	for rows.Next() {
		var a Activity
		var isActive int
		if err := rows.Scan(&a.ID, &a.SubProjectID, &a.Name, &a.Code, &a.Description, &a.Tujuan, &a.Indikator, &a.Weight, &a.OrderIndex, &isActive, &a.Periode, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		a.IsActive = isActive == 1
		list = append(list, a)
	}
	return list, nil
}

func (r *Repository) CreateActivity(a *Activity) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(`INSERT INTO project_activities (sub_project_id, name, code, description, tujuan, indikator, weight, order_index, is_active, periode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, a.SubProjectID, a.Name, a.Code, a.Description, a.Tujuan, a.Indikator, a.Weight, a.OrderIndex, boolToInt(a.IsActive), a.Periode, now, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	a.ID = int(id)
	a.CreatedAt = now
	a.UpdatedAt = now
	return nil
}

func (r *Repository) UpdateActivity(a *Activity) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(`UPDATE project_activities SET sub_project_id=?, name=?, code=?, description=?, tujuan=?, indikator=?, weight=?, order_index=?, is_active=?, periode=?, updated_at=? WHERE id=?`, a.SubProjectID, a.Name, a.Code, a.Description, a.Tujuan, a.Indikator, a.Weight, a.OrderIndex, boolToInt(a.IsActive), a.Periode, now, a.ID)
	return err
}

func (r *Repository) DeleteActivity(id int) error {
	_, err := r.db.Exec(`DELETE FROM project_activities WHERE id=?`, id)
	return err
}

func (r *Repository) GetIndicators(activityID int) ([]Indicator, error) {
	var rows *sql.Rows
	var err error
	if activityID > 0 {
		rows, err = r.db.Query(`SELECT id, activity_id, name, weight, created_at FROM project_indicators WHERE activity_id = ? ORDER BY id ASC`, activityID)
	} else {
		rows, err = r.db.Query(`SELECT id, activity_id, name, weight, created_at FROM project_indicators ORDER BY id ASC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Indicator
	for rows.Next() {
		var i Indicator
		if err := rows.Scan(&i.ID, &i.ActivityID, &i.Name, &i.Weight, &i.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, i)
	}
	return list, nil
}

func (r *Repository) CreateIndicator(ind *Indicator) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(`INSERT INTO project_indicators (activity_id, name, weight, created_at) VALUES (?, ?, ?, ?)`, ind.ActivityID, ind.Name, ind.Weight, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	ind.ID = int(id)
	ind.CreatedAt = now
	return nil
}

func (r *Repository) DeleteIndicator(id int) error {
	_, err := r.db.Exec(`DELETE FROM project_indicators WHERE id=?`, id)
	return err
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
