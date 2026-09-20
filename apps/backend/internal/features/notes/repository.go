package notes

import (
	"database/sql"
	"errors"
)

type Note struct {
	ID          int     `json:"id"`
	URLID       string  `json:"url_id"`
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	DeleteToken string  `json:"-"`
	CreatedAt   string  `json:"created_at"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(n *Note) error {
	query := "INSERT INTO notes (url_id, title, content, delete_token, expires_at) VALUES (?, ?, ?, ?, ?)"
	result, err := r.db.Exec(query, n.URLID, n.Title, n.Content, n.DeleteToken, n.ExpiresAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	n.ID = int(id)
	return nil
}

func (r *Repository) GetByURLID(urlID string) (*Note, error) {
	query := "SELECT id, url_id, title, content, delete_token, created_at, expires_at FROM notes WHERE url_id = ?"
	var n Note
	err := r.db.QueryRow(query, urlID).Scan(&n.ID, &n.URLID, &n.Title, &n.Content, &n.DeleteToken, &n.CreatedAt, &n.ExpiresAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *Repository) DeleteByURLIDAndToken(urlID, deleteToken string) (bool, error) {
	result, err := r.db.Exec("DELETE FROM notes WHERE url_id = ? AND delete_token = ?", urlID, deleteToken)
	if err != nil {
		return false, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return affected > 0, nil
}
