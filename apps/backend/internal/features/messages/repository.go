package messages

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

func (r *Repository) FindAll(isRead *bool, search string, limit, offset int) ([]Message, error) {
	query := "SELECT id, name, email, whatsapp, message, is_read, created_at FROM messages WHERE 1=1"
	var args []interface{}

	if isRead != nil {
		query += " AND is_read = ?"
		args = append(args, *isRead)
	}

	if search != "" {
		query += " AND (name LIKE ? OR email LIKE ? OR whatsapp LIKE ? OR message LIKE ?)"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	query += " ORDER BY created_at DESC"
	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		var email, whatsapp sql.NullString
		err := rows.Scan(&m.ID, &m.Name, &email, &whatsapp, &m.Message, &m.IsRead, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		m.Email = email.String
		m.Whatsapp = whatsapp.String
		messages = append(messages, m)
	}

	return messages, nil
}

func (r *Repository) FindByID(id string) (*Message, error) {
	query := "SELECT id, name, email, whatsapp, message, is_read, created_at FROM messages WHERE id = ?"
	var m Message
	var email, whatsapp sql.NullString

	err := r.db.QueryRow(query, id).Scan(&m.ID, &m.Name, &email, &whatsapp, &m.Message, &m.IsRead, &m.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("message not found")
		}
		return nil, err
	}

	m.Email = email.String
	m.Whatsapp = whatsapp.String
	return &m, nil
}

func (r *Repository) Create(m *Message) error {
	query := "INSERT INTO messages (name, email, whatsapp, message) VALUES (?, ?, ?, ?)"
	_, err := r.db.Exec(query, m.Name, m.Email, m.Whatsapp, m.Message)
	return err
}

func (r *Repository) MarkAsRead(id string) error {
	query := "UPDATE messages SET is_read = 1 WHERE id = ?"
	_, err := r.db.Exec(query, id)
	return err
}

func (r *Repository) Delete(id string) error {
	query := "DELETE FROM messages WHERE id = ?"
	_, err := r.db.Exec(query, id)
	return err
}
