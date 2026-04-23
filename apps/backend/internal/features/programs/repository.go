package programs

import (
	"database/sql"
	"fmt"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(category, search string) ([]Program, error) {
	query := "SELECT id, title, slug, category, excerpt, content, image_url, is_featured, order_index, created_at, updated_at FROM programs WHERE 1=1"
	var args []interface{}

	if category != "" {
		query += " AND category = ?"
		args = append(args, category)
	}
	if search != "" {
		query += " AND (title LIKE ? OR excerpt LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	query += " ORDER BY order_index ASC, created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programs []Program
	for rows.Next() {
		var p Program
		var excerpt, content, imageUrl sql.NullString
		err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Category,
			&excerpt, &content, &imageUrl,
			&p.IsFeatured, &p.OrderIndex, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		p.Excerpt = excerpt.String
		p.Content = content.String
		p.ImageURL = imageUrl.String
		programs = append(programs, p)
	}
	return programs, nil
}

func (r *Repository) FindByID(id string) (*Program, error) {
	query := "SELECT id, title, slug, category, excerpt, content, image_url, is_featured, order_index, created_at, updated_at FROM programs WHERE id = ? OR slug = ?"
	var p Program
	var excerpt, content, imageUrl sql.NullString

	err := r.db.QueryRow(query, id, id).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Category,
		&excerpt, &content, &imageUrl,
		&p.IsFeatured, &p.OrderIndex, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("program not found")
		}
		return nil, err
	}

	p.Excerpt = excerpt.String
	p.Content = content.String
	p.ImageURL = imageUrl.String

	return &p, nil
}

func (r *Repository) Create(p *Program) (int64, error) {
	query := `INSERT INTO programs (title, slug, category, excerpt, content, image_url, is_featured, order_index) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := r.db.Exec(query,
		p.Title, p.Slug, p.Category, p.Excerpt, p.Content, p.ImageURL, p.IsFeatured, p.OrderIndex,
	)
	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

func (r *Repository) Update(id string, p *Program) error {
	query := `UPDATE programs 
			  SET title=?, slug=?, category=?, excerpt=?, content=?, image_url=?, is_featured=?, order_index=?, updated_at=CURRENT_TIMESTAMP 
			  WHERE id=?`

	_, err := r.db.Exec(query,
		p.Title, p.Slug, p.Category, p.Excerpt, p.Content, p.ImageURL, p.IsFeatured, p.OrderIndex, id,
	)
	return err
}

func (r *Repository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM programs WHERE id = ?", id)
	return err
}
