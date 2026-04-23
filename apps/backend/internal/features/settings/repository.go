package settings

import (
	"database/sql"
	"time"
)

type Setting struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll() ([]Setting, error) {
	rows, err := r.db.Query("SELECT key, value, description, updated_at FROM settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Setting
	for rows.Next() {
		var s Setting
		var value sql.NullString
		var description sql.NullString
		var updatedAt sql.NullString
		err := rows.Scan(&s.Key, &value, &description, &updatedAt)
		if err != nil {
			return nil, err
		}
		if value.Valid {
			s.Value = value.String
		}
		if description.Valid {
			s.Description = description.String
		}
		if updatedAt.Valid {
			// Support common SQLite timestamp layouts found in existing data.
			if t, parseErr := time.Parse("2006-01-02 15:04:05", updatedAt.String); parseErr == nil {
				s.UpdatedAt = t
			} else if t, parseErr := time.Parse(time.RFC3339, updatedAt.String); parseErr == nil {
				s.UpdatedAt = t
			}
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *Repository) Update(key, value string) error {
	res, err := r.db.Exec("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", value, key)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		_, err = r.db.Exec("INSERT INTO settings (key, value, description) VALUES (?, ?, '')", key, value)
		return err
	}

	return nil
}

func (r *Repository) GetByKey(key string) (string, error) {
	var value string
	err := r.db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	return value, err
}
