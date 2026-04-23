package teachers

import (
	"database/sql"
	"time"
)

type Teacher struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Subject   string    `json:"subject"`
	Bio       string    `json:"bio"`
	ImageURL  string    `json:"image_url"`
	Email     string    `json:"email"`
	WhatsApp  string    `json:"whatsapp"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(search string) ([]Teacher, error) {
	query := "SELECT id, name, subject, bio, image_url, email, whatsapp, created_at, updated_at FROM teachers WHERE 1=1"
	var args []interface{}

	if search != "" {
		query += " AND (name LIKE ? OR subject LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	query += " ORDER BY name ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Teacher
	for rows.Next() {
		var t Teacher
		var createdAt, updatedAt string
		err := rows.Scan(&t.ID, &t.Name, &t.Subject, &t.Bio, &t.ImageURL, &t.Email, &t.WhatsApp, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}
		t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		t.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		list = append(list, t)
	}
	return list, nil
}

func (r *Repository) FindByID(id int) (*Teacher, error) {
	var t Teacher
	var createdAt, updatedAt string
	err := r.db.QueryRow("SELECT id, name, subject, bio, image_url, email, whatsapp, created_at, updated_at FROM teachers WHERE id = ?", id).Scan(
		&t.ID, &t.Name, &t.Subject, &t.Bio, &t.ImageURL, &t.Email, &t.WhatsApp, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	t.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return &t, nil
}

func (r *Repository) Create(t *Teacher) error {
	_, err := r.db.Exec("INSERT INTO teachers (name, subject, bio, image_url, email, whatsapp) VALUES (?, ?, ?, ?, ?, ?)",
		t.Name, t.Subject, t.Bio, t.ImageURL, t.Email, t.WhatsApp)
	return err
}

func (r *Repository) Update(id int, t *Teacher) error {
	_, err := r.db.Exec("UPDATE teachers SET name = ?, subject = ?, bio = ?, image_url = ?, email = ?, whatsapp = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		t.Name, t.Subject, t.Bio, t.ImageURL, t.Email, t.WhatsApp, id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM teachers WHERE id = ?", id)
	return err
}
