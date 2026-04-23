package agendas

import (
	"database/sql"
)

type Agenda struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	StartDate   string  `json:"start_date"`
	EndDate     *string `json:"end_date"`
	TimeInfo    *string `json:"time_info"`
	Location    *string `json:"location"`
	Description *string `json:"description"`
	Category    string  `json:"category"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(search string) ([]Agenda, error) {
	query := `SELECT id, title, start_date, end_date, time_info, location, description, category FROM agendas WHERE 1=1`
	var args []interface{}

	if search != "" {
		query += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	query += " ORDER BY start_date ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agendas []Agenda
	for rows.Next() {
		var a Agenda
		if err := rows.Scan(&a.ID, &a.Title, &a.StartDate, &a.EndDate, &a.TimeInfo, &a.Location, &a.Description, &a.Category); err != nil {
			return nil, err
		}
		agendas = append(agendas, a)
	}
	return agendas, nil
}

func (r *Repository) Create(a *Agenda) error {
	query := `INSERT INTO agendas (title, start_date, end_date, time_info, location, description, category) VALUES (?, ?, ?, ?, ?, ?, ?)`
	result, err := r.db.Exec(query, a.Title, a.StartDate, a.EndDate, a.TimeInfo, a.Location, a.Description, a.Category)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	a.ID = int(id)
	return nil
}

func (r *Repository) Update(id int, a *Agenda) error {
	query := `UPDATE agendas SET title = ?, start_date = ?, end_date = ?, time_info = ?, location = ?, description = ?, category = ? WHERE id = ?`
	_, err := r.db.Exec(query, a.Title, a.StartDate, a.EndDate, a.TimeInfo, a.Location, a.Description, a.Category, id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM agendas WHERE id = ?", id)
	return err
}
