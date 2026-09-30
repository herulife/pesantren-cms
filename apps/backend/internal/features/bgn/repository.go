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

// SantriTable adalah nama tabel data Santri di aplikasi.
const SantriTable = "santri"

// colSantriID adalah kolom FK pada bgn_recipients yang menunjuk ke SantriTable.
const colSantriID = "santri_id"

// Kolom hasil select. `b` = bgn_recipients, `s` = Santri (LEFT JOIN, opsional).
const recipientCols = "b.id, b.identity, b.name, b.birth_date, b.gender, b.parent_name, b.position, b.status, b.created_at, b.updated_at, b.santri_id, COALESCE(s.name, ''), COALESCE(s.\"class\", '')"

const recipientFrom = " FROM bgn_recipients b LEFT JOIN " + SantriTable + " s ON s.id = b.santri_id"

const recipientOrder = " ORDER BY CASE b.position WHEN 'santri' THEN 0 WHEN 'guru' THEN 1 ELSE 2 END, b.name COLLATE NOCASE ASC"

// buildWhere menyusun klausa WHERE + argumen yang dipakai bersama oleh
// FindAll, CountFiltered dan ExportAll supaya hasil always konsisten.
func buildWhere(f Filter) (string, []interface{}) {
	where := " WHERE 1=1"
	var args []interface{}
	if f.Position != "" && f.Position != "all" {
		where += " AND b.position = ?"
		args = append(args, f.Position)
	}
	switch f.Status {
	case "aktif":
		where += " AND b.status = 1"
	case "nonaktif":
		where += " AND b.status = 0"
	}
	if f.Search != "" {
		where += " AND (b.name LIKE ? OR b.identity LIKE ? OR b.parent_name LIKE ?)"
		like := "%" + f.Search + "%"
		args = append(args, like, like, like)
	}
	return where, args
}

func scanRecipients(rows *sql.Rows) ([]Recipient, error) {
	list := make([]Recipient, 0)
	for rows.Next() {
		var rc Recipient
		var st int
		if err := rows.Scan(
			&rc.ID, &rc.Identity, &rc.Name, &rc.BirthDate, &rc.Gender,
			&rc.ParentName, &rc.Position, &st, &rc.CreatedAt, &rc.UpdatedAt,
			&rc.SantriID, &rc.SantriName, &rc.SantriClass,
		); err != nil {
			return nil, err
		}
		rc.Status = st == 1
		list = append(list, rc)
	}
	return list, rows.Err()
}

// FindAll mengembalikan satu halaman penerima beserta total baris yang cocok
// filter. Limit <= 0 berarti tanpa paginasi (dipakai untuk export kecil).
func (r *Repository) FindAll(f Filter) ([]Recipient, int, error) {
	where, args := buildWhere(f)

	var total int
	if err := r.db.QueryRow("SELECT COUNT(*)"+recipientFrom+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := "SELECT " + recipientCols + recipientFrom + where + recipientOrder
	queryArgs := args
	if f.Limit > 0 {
		query += " LIMIT ? OFFSET ?"
		queryArgs = append(append([]interface{}{}, args...), f.Limit, f.Offset)
	}

	rows, err := r.db.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	list, err := scanRecipients(rows)
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

// ExportAll mengembalikan SELURUH penerima yang cocok filter tanpa paginasi,
// untuk keperluan export Excel/PDF.
func (r *Repository) ExportAll(f Filter) ([]Recipient, error) {
	where, args := buildWhere(f)
	rows, err := r.db.Query("SELECT "+recipientCols+recipientFrom+where+recipientOrder, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRecipients(rows)
}

// FindSantriOptions mencari kandidat data Santri untuk dialog tautan.
func (r *Repository) FindSantriOptions(search string, limit int) ([]SantriOption, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	query := `SELECT id, COALESCE(nik, ''), name, COALESCE("class", '') FROM ` + SantriTable
	var args []interface{}
	if strings.TrimSpace(search) != "" {
		query += ` WHERE name LIKE ? OR COALESCE(nik, '') LIKE ?`
		like := "%" + strings.TrimSpace(search) + "%"
		args = append(args, like, like)
	}
	query += " ORDER BY name COLLATE NOCASE ASC LIMIT ?"
	args = append(args, limit)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]SantriOption, 0)
	for rows.Next() {
		var o SantriOption
		if err := rows.Scan(&o.ID, &o.NIK, &o.Name, &o.Class); err != nil {
			return nil, err
		}
		list = append(list, o)
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
			COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN COALESCE(santri_id, 0) > 0 THEN 1 ELSE 0 END), 0)
		FROM bgn_recipients`).Scan(&s.Total, &s.Santri, &s.Guru, &s.Tendik, &s.Active, &s.Inactive, &s.Linked)
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

// Link menautkan penerima BGN ke data Santri. Nilai 0 berarti belum ditautkan
// atau sengaja dilepas tautan.
func (r *Repository) Link(id int, value int) error {
	_, err := r.db.Exec(
		"UPDATE bgn_recipients SET "+colSantriID+" = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		value, id)
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
	FindAll(f Filter) ([]Recipient, int, error)
	ExportAll(f Filter) ([]Recipient, error)
	FindSantriOptions(search string, limit int) ([]SantriOption, error)
	Link(id int, value int) error
	Stats() (RecipientStats, error)
	Create(in *RecipientInput) (int64, error)
	Update(id int, in *RecipientInput) error
	Delete(id int) error
	ImportUpsert(items []RecipientInput) (ImportResult, error)
}
