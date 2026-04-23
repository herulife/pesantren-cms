package facilities

import (
	"database/sql"
)

type Facility struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	Category    string `json:"category"`
	IsHighlight bool   `json:"is_highlight"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(category, search string) ([]Facility, error) {
	query := `SELECT id, name, description, image_url, category, is_highlight FROM facilities WHERE 1=1`
	var args []interface{}

	if category != "" {
		query += " AND category = ?"
		args = append(args, category)
	}
	if search != "" {
		query += " AND (name LIKE ? OR description LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	query += " ORDER BY is_highlight DESC, id DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []Facility
	for rows.Next() {
		var f Facility
		if err := rows.Scan(&f.ID, &f.Name, &f.Description, &f.ImageURL, &f.Category, &f.IsHighlight); err != nil {
			return nil, err
		}
		facilities = append(facilities, f)
	}
	return facilities, nil
}

func (r *Repository) Create(f *Facility) error {
	query := `INSERT INTO facilities (name, description, image_url, category, is_highlight) VALUES (?, ?, ?, ?, ?)`
	result, err := r.db.Exec(query, f.Name, f.Description, f.ImageURL, f.Category, f.IsHighlight)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	f.ID = int(id)
	return nil
}

func (r *Repository) Update(id int, f *Facility) error {
	query := `UPDATE facilities SET name = ?, description = ?, image_url = ?, category = ?, is_highlight = ? WHERE id = ?`
	_, err := r.db.Exec(query, f.Name, f.Description, f.ImageURL, f.Category, f.IsHighlight, id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM facilities WHERE id = ?", id)
	return err
}
