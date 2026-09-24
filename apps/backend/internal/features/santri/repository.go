package santri

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(search, class, status string, limit, offset int) ([]Santri, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	if search != "" {
		where = append(where, "(nis LIKE ? OR name LIKE ? OR nickname LIKE ?)")
		like := "%" + search + "%"
		args = append(args, like, like, like)
	}
	if class != "" {
		where = append(where, "class = ?")
		args = append(args, class)
	}
	if status != "" {
		where = append(where, "status = ?")
		args = append(args, status)
	}
	whereStr := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM santri WHERE %s", whereStr)
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, created_at, updated_at FROM santri WHERE %s ORDER BY created_at DESC LIMIT ? OFFSET ?`, whereStr)
	args = append(args, limit, offset)
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []Santri
	for rows.Next() {
		var s Santri
		var userID sql.NullInt64
		var createdAt, updatedAt sql.NullString
		if err := rows.Scan(&s.ID, &s.NIS, &s.Name, &s.Nickname, &s.Gender, &s.BirthPlace, &s.BirthDate, &s.Address, &s.Class, &s.Angkatan, &s.Status, &s.ParentName, &s.ParentPhone, &s.NIK, &s.FatherName, &s.FatherPhone, &s.MotherName, &s.MotherPhone, &s.RegistrationID, &s.PhotoURL, &userID, &createdAt, &updatedAt); err != nil {
			return nil, 0, err
		}
		if userID.Valid {
			uid := int(userID.Int64)
			s.UserID = &uid
		}
		s.CreatedAt = createdAt.String
		s.UpdatedAt = updatedAt.String
		list = append(list, s)
	}
	return list, total, nil
}

func (r *Repository) FindByID(id int) (*Santri, error) {
	var s Santri
	var userID sql.NullInt64
	var createdAt, updatedAt sql.NullString
	err := r.db.QueryRow(`SELECT id, nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, created_at, updated_at FROM santri WHERE id = ?`, id).Scan(&s.ID, &s.NIS, &s.Name, &s.Nickname, &s.Gender, &s.BirthPlace, &s.BirthDate, &s.Address, &s.Class, &s.Angkatan, &s.Status, &s.ParentName, &s.ParentPhone, &s.NIK, &s.FatherName, &s.FatherPhone, &s.MotherName, &s.MotherPhone, &s.RegistrationID, &s.PhotoURL, &userID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	if userID.Valid {
		uid := int(userID.Int64)
		s.UserID = &uid
	}
	s.CreatedAt = createdAt.String
	s.UpdatedAt = updatedAt.String
	return &s, nil
}

func (r *Repository) Create(s *Santri) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	if s.Status == "" {
		s.Status = "aktif"
	}
	res, err := r.db.Exec(`INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Angkatan, s.Status, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.RegistrationID, s.PhotoURL, s.UserID, now, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	s.ID = int(id)
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (r *Repository) BulkCreate(items []Santri) (int, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	stmt, err := tx.Prepare(`INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	inserted := 0
	for i := range items {
		s := &items[i]
		if s.Status == "" {
			s.Status = "aktif"
		}
		_, err := stmt.Exec(s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Angkatan, s.Status, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.RegistrationID, s.PhotoURL, s.UserID, now, now)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE") {
				continue
			}
			tx.Rollback()
			return inserted, err
		}
		inserted++
		s.CreatedAt = now
		s.UpdatedAt = now
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return inserted, nil
}

func (r *Repository) Update(s *Santri) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(`UPDATE santri SET nis=?, name=?, nickname=?, gender=?, birth_place=?, birth_date=?, address=?, class=?, angkatan=?, status=?, parent_name=?, parent_phone=?, nik=?, father_name=?, father_phone=?, mother_name=?, mother_phone=?, registration_id=?, photo_url=?, updated_at=? WHERE id=?`,
		s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Angkatan, s.Status, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.RegistrationID, s.PhotoURL, now, s.ID)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM santri WHERE id=?`, id)
	return err
}

func (r *Repository) LinkUser(santriID, userID int) error {
	var exists int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE id = ?`, userID).Scan(&exists); err != nil {
		return err
	}
	if exists == 0 {
		return sql.ErrNoRows
	}
	_, err := r.db.Exec(`UPDATE santri SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, userID, santriID)
	return err
}

func (r *Repository) UnlinkUser(santriID int) error {
	res, err := r.db.Exec(`UPDATE santri SET user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, santriID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) FindByUserID(userID int) ([]Santri, error) {
	rows, err := r.db.Query(`SELECT id, nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, created_at, updated_at FROM santri WHERE user_id = ? ORDER BY name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Santri{}
	for rows.Next() {
		var x Santri
		var userID sql.NullInt64
		var createdAt, updatedAt string
		if err := rows.Scan(&x.ID, &x.NIS, &x.Name, &x.Nickname, &x.Gender, &x.BirthPlace, &x.BirthDate, &x.Address, &x.Class, &x.Angkatan, &x.Status, &x.ParentName, &x.ParentPhone, &x.NIK, &x.FatherName, &x.FatherPhone, &x.MotherName, &x.MotherPhone, &x.RegistrationID, &x.PhotoURL, &userID, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		if userID.Valid {
			v := int(userID.Int64)
			x.UserID = &v
		}
		x.CreatedAt = createdAt
		x.UpdatedAt = updatedAt
		out = append(out, x)
	}
	return out, rows.Err()
}

func (r *Repository) SetClassBulk(items map[int]string) (int, error) {
	if len(items) == 0 {
		return 0, nil
	}
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	n := 0
	for id, class := range items {
		res, err := tx.Exec(`UPDATE santri SET class=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, strings.TrimSpace(class), id)
		if err != nil {
			return n, err
		}
		if c, _ := res.RowsAffected(); c > 0 {
			n++
		}
	}
	if err := tx.Commit(); err != nil {
		return n, err
	}
	return n, nil
}

func (r *Repository) BulkDelete(ids []int) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}
	query := fmt.Sprintf("DELETE FROM santri WHERE id IN (%s)", strings.Join(placeholders, ","))
	res, err := r.db.Exec(query, args...)
	if err != nil {
		return 0, err
	}
	deleted, _ := res.RowsAffected()
	return int(deleted), nil
}
