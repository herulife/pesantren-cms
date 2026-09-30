package bgn

import (
	"database/sql"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

const recipientCols = "id, identity, name, birth_date, gender, parent_name, position, status, created_at, updated_at"

func (r *Repository) FindAll(f Filter) ([]Recipient, error) {
	query := "SELECT " + recipientCols + " FROM bgn_recipients WHERE 1=1"
	var args []interface{}
	if f.Position != "" && f.Position != "all" {
		query += " AND position = ?"
		args = append(args, f.Position)
	}
	switch f.Status {
	case "aktif":
		query += " AND status = 1"
	case "nonaktif":
		query += " AND status = 0"
	}
	if f.Search != "" {
		query += " AND (name LIKE ? OR identity LIKE ? OR parent_name LIKE ?)"
		like := "%" + f.Search + "%"
		args = append(args, like, like, like)
	}
	query += " ORDER BY CASE position WHEN 'santri' THEN 0 WHEN 'guru' THEN 1 ELSE 2 END, name COLLATE NOCASE ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Recipient, 0)
	for rows.Next() {
		var rc Recipient
		var st int
		if err := rows.Scan(&rc.ID, &rc.Identity, &rc.Name, &rc.BirthDate, &rc.Gender, &rc.ParentName, &rc.Position, &st, &rc.CreatedAt, &rc.UpdatedAt); err != nil {
			return nil, err
		}
		rc.Status = st == 1
		list = append(list, rc)
	}
	return list, rows.Err()
}

func (r *Repository) Stats() (RecipientStats, error) {
	var s RecipientStats
	err := r.db.QueryRow(`
		SELECT
			COUNT(*),
			COALESCE(SUM(CASE WHEN position = 'santri' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN position = 'guru' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN position = 'tendik' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0)
		FROM bgn_recipients`).Scan(&s.Total, &s.Santri, &s.Guru, &s.Tendik, &s.Active, &s.Inactive)
	if err != nil {
		return s, err
	}
	return s, nil
}

func (r *Repository) Create(in *RecipientInput) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO bgn_recipients (identity, name, birth_date, gender, parent_name, position, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		in.Identity, in.Name, in.BirthDate, in.Gender, in.ParentName, in.Position, boolToInt(in.Status))
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) Update(id int, in *RecipientInput) error {
	_, err := r.db.Exec(`
		UPDATE bgn_recipients
		SET identity = ?, name = ?, birth_date = ?, gender = ?, parent_name = ?, position = ?, status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`,
		in.Identity, in.Name, in.BirthDate, in.Gender, in.ParentName, in.Position, boolToInt(in.Status), id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM bgn_recipients WHERE id = ?`, id)
	return err
}

// ImportUpsert menyisipkan batch penerima secara idempoten: baris dengan
// identity (=NISN/NIK) sama di-update; bila tanpa identity dicocokkan via
// (name, position). Duplikat dalam batch yang sama dilewati.
func (r *Repository) ImportUpsert(items []RecipientInput) (ImportResult, error) {
	var result ImportResult
	tx, err := r.db.Begin()
	if err != nil {
		return result, err
	}
	defer tx.Rollback()

	seenIdentity := make(map[string]bool)
	seenByName := make(map[string]bool)

	for _, it := range items {
		identity := strings.TrimSpace(it.Identity)
		nameKey := strings.ToLower(strings.TrimSpace(it.Name)) + "|" + it.Position

		var exists int
		if identity != "" {
			if seenIdentity[identity] {
				result.Skipped++
				continue
			}
			err = tx.QueryRow(`SELECT COUNT(*) FROM bgn_recipients WHERE identity = ?`, identity).Scan(&exists)
		} else {
			if seenByName[nameKey] {
				result.Skipped++
				continue
			}
			err = tx.QueryRow(`SELECT COUNT(*) FROM bgn_recipients WHERE name = ? AND position = ?`, it.Name, it.Position).Scan(&exists)
		}
		if err != nil {
			return result, err
		}

		if exists > 0 {
			if identity != "" {
				_, err = tx.Exec(`
					UPDATE bgn_recipients
					SET name = ?, birth_date = ?, gender = ?, parent_name = ?, position = ?, status = ?, updated_at = CURRENT_TIMESTAMP
					WHERE identity = ?`,
					it.Name, it.BirthDate, it.Gender, it.ParentName, it.Position, boolToInt(it.Status), identity)
			} else {
				_, err = tx.Exec(`
					UPDATE bgn_recipients
					SET name = ?, birth_date = ?, gender = ?, parent_name = ?, position = ?, status = ?, updated_at = CURRENT_TIMESTAMP
					WHERE name = ? AND position = ?`,
					it.Name, it.BirthDate, it.Gender, it.ParentName, it.Position, boolToInt(it.Status), it.Name, it.Position)
			}
			if err != nil {
				return result, err
			}
			result.Updated++
		} else {
			_, err = tx.Exec(`
				INSERT INTO bgn_recipients (identity, name, birth_date, gender, parent_name, position, status)
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
				it.Identity, it.Name, it.BirthDate, it.Gender, it.ParentName, it.Position, boolToInt(it.Status))
			if err != nil {
				return result, err
			}
			result.Added++
		}

		if identity != "" {
			seenIdentity[identity] = true
		} else {
			seenByName[nameKey] = true
		}
	}

	if err := tx.Commit(); err != nil {
		return result, err
	}
	return result, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	FindAll(f Filter) ([]Recipient, error)
	Stats() (RecipientStats, error)
	Create(in *RecipientInput) (int64, error)
	Update(id int, in *RecipientInput) error
	Delete(id int) error
	ImportUpsert(items []RecipientInput) (ImportResult, error)
}