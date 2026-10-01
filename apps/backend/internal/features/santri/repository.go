package santri

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
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

	query := fmt.Sprintf(`SELECT id, COALESCE(nis,''), COALESCE(name,''), COALESCE(nickname,''), COALESCE(gender,''), COALESCE(birth_place,''), COALESCE(birth_date,''), COALESCE(address,''), COALESCE(class,''), COALESCE(jenjang,''), COALESCE(angkatan,''), COALESCE(status,''), COALESCE(parent_name,''), COALESCE(parent_phone,''), COALESCE(nik,''), COALESCE(father_name,''), COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_phone,''), COALESCE(father_occupation,''), COALESCE(mother_occupation,''), COALESCE(category,''), registration_id, COALESCE(photo_url,''), user_id, created_at, updated_at FROM santri WHERE %s ORDER BY created_at DESC LIMIT ? OFFSET ?`, whereStr)
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
		if err := rows.Scan(&s.ID, &s.NIS, &s.Name, &s.Nickname, &s.Gender, &s.BirthPlace, &s.BirthDate, &s.Address, &s.Class, &s.Jenjang, &s.Angkatan, &s.Status, &s.ParentName, &s.ParentPhone, &s.NIK, &s.FatherName, &s.FatherPhone, &s.MotherName, &s.MotherPhone, &s.FatherOccupation, &s.MotherOccupation, &s.Category, &s.RegistrationID, &s.PhotoURL, &userID, &createdAt, &updatedAt); err != nil {
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

func (r *Repository) FindPortalUsers(search string) ([]PortalUser, error) {
	query := `SELECT id, name, email FROM users WHERE role = 'user'`
	args := []interface{}{}
	if search != "" {
		query += " AND (name LIKE ? OR email LIKE ?)"
		like := "%" + search + "%"
		args = append(args, like, like)
	}
	query += " ORDER BY name ASC, id ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []PortalUser{}
	for rows.Next() {
		var user PortalUser
		if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			return nil, err
		}
		user.Role = "user"
		users = append(users, user)
	}
	return users, rows.Err()
}

func (r *Repository) FindByID(id int) (*Santri, error) {
	var s Santri
	var userID sql.NullInt64
	var createdAt, updatedAt sql.NullString
	err := r.db.QueryRow(`SELECT id, COALESCE(nis,''), COALESCE(name,''), COALESCE(nickname,''), COALESCE(gender,''), COALESCE(birth_place,''), COALESCE(birth_date,''), COALESCE(address,''), COALESCE(class,''), COALESCE(jenjang,''), COALESCE(angkatan,''), COALESCE(status,''), COALESCE(parent_name,''), COALESCE(parent_phone,''), COALESCE(nik,''), COALESCE(father_name,''), COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_phone,''), COALESCE(father_occupation,''), COALESCE(mother_occupation,''), COALESCE(category,''), registration_id, COALESCE(photo_url,''), user_id, created_at, updated_at FROM santri WHERE id = ?`, id).Scan(&s.ID, &s.NIS, &s.Name, &s.Nickname, &s.Gender, &s.BirthPlace, &s.BirthDate, &s.Address, &s.Class, &s.Jenjang, &s.Angkatan, &s.Status, &s.ParentName, &s.ParentPhone, &s.NIK, &s.FatherName, &s.FatherPhone, &s.MotherName, &s.MotherPhone, &s.FatherOccupation, &s.MotherOccupation, &s.Category, &s.RegistrationID, &s.PhotoURL, &userID, &createdAt, &updatedAt)
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
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	res, err := tx.Exec(`INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, jenjang, angkatan, status, category, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, father_occupation, mother_occupation, registration_id, photo_url, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Jenjang, s.Angkatan, s.Status, s.Category, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.FatherOccupation, s.MotherOccupation, s.RegistrationID, s.PhotoURL, s.UserID, now, now)
	if err != nil {
		_ = tx.Rollback()
		return err
	}
	id, _ := res.LastInsertId()
	s.ID = int(id)
	s.CreatedAt = now
	s.UpdatedAt = now
	if s.UserID == nil || *s.UserID == 0 {
		uid, err := r.ensureUserAccount(tx, s)
		if err != nil {
			_ = tx.Rollback()
			return err
		}
		s.UserID = &uid
		if _, err := tx.Exec(`UPDATE santri SET user_id=? WHERE id=?`, uid, s.ID); err != nil {
			_ = tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

// ensureUserAccount menjamin santri terhubung ke akun users role='user' yang
// dipakai seluruh sistem akademik (raport, nilai, presensi, exam). Jika santri
// berasal dari registrasi PSB (registration_id), ikat ke user_id pendaftar.
// Jika tidak, buat akun portal sintetis (email berbasis NIS + password acak)
// agar santri manual tetap tampil & dapat dihitung di e-raport.
func (r *Repository) ensureUserAccount(tx *sql.Tx, s *Santri) (int, error) {
	if s.RegistrationID > 0 {
		var uid sql.NullInt64
		if err := tx.QueryRow(`SELECT user_id FROM registrations WHERE id=?`, s.RegistrationID).Scan(&uid); err == nil && uid.Valid && uid.Int64 > 0 {
			return int(uid.Int64), nil
		}
	}
	base := strings.TrimSpace(s.NIS)
	if base == "" {
		base = fmt.Sprintf("santri-%d", s.ID)
	}
	email := base + "@almaparung.local"

	var existing sql.NullInt64
	err := tx.QueryRow(`SELECT id FROM users WHERE email=?`, email).Scan(&existing)
	if err == nil && existing.Valid {
		return int(existing.Int64), nil
	}

	hash, err := randomPlaceholderHash()
	if err != nil {
		return 0, err
	}
	res, err := tx.Exec(`INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?, 'user')`, email, hash, s.Name)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			err = tx.QueryRow(`SELECT id FROM users WHERE email=?`, email).Scan(&existing)
			if err == nil && existing.Valid {
				return int(existing.Int64), nil
			}
		}
		return 0, err
	}
	uid, _ := res.LastInsertId()
	return int(uid), nil
}

// randomPlaceholderHash menghasilkan hash password placeholder acak supaya
// akun sintetis tidak bisa dipakai login sembarangan (wal/i wajib reset
// password atau dihubungkan ke akun wali yang sudah ada).
func randomPlaceholderHash() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(raw)), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func (r *Repository) BulkCreate(items []Santri) (int, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	stmt, err := tx.Prepare(`INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, jenjang, angkatan, status, category, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, father_occupation, mother_occupation, registration_id, photo_url, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
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
		res, err := stmt.Exec(s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Jenjang, s.Angkatan, s.Status, s.Category, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.FatherOccupation, s.MotherOccupation, s.RegistrationID, s.PhotoURL, s.UserID, now, now)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE") {
				continue
			}
			_ = tx.Rollback()
			return inserted, err
		}
		id, _ := res.LastInsertId()
		s.ID = int(id)
		s.CreatedAt = now
		s.UpdatedAt = now
		if s.UserID == nil || *s.UserID == 0 {
			uid, err := r.ensureUserAccount(tx, s)
			if err != nil {
				_ = tx.Rollback()
				return inserted, err
			}
			s.UserID = &uid
			if _, err := tx.Exec(`UPDATE santri SET user_id=? WHERE id=?`, uid, s.ID); err != nil {
				_ = tx.Rollback()
				return inserted, err
			}
		}
		inserted++
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return inserted, nil
}

func (r *Repository) Update(s *Santri) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(`UPDATE santri SET nis=?, name=?, nickname=?, gender=?, birth_place=?, birth_date=?, address=?, class=?, jenjang=?, angkatan=?, status=?, parent_name=?, parent_phone=?, nik=?, father_name=?, father_phone=?, mother_name=?, mother_phone=?, father_occupation=?, mother_occupation=?, registration_id=?, photo_url=?, updated_at=? WHERE id=?`,
		s.NIS, s.Name, s.Nickname, s.Gender, s.BirthPlace, s.BirthDate, s.Address, s.Class, s.Jenjang, s.Angkatan, s.Status, s.ParentName, s.ParentPhone, s.NIK, s.FatherName, s.FatherPhone, s.MotherName, s.MotherPhone, s.FatherOccupation, s.MotherOccupation, s.RegistrationID, s.PhotoURL, now, s.ID)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM santri WHERE id=?`, id)
	return err
}

// FindAllScoped = FindAll yang dibatasi ke daftar kelas (untuk wali kelas).
func (r *Repository) FindAllScoped(search string, classes []string, status string, limit, offset int) ([]Santri, int, error) {
	if len(classes) == 0 {
		return []Santri{}, 0, nil
	}
	where := []string{"s.class IN (" + placeholders(len(classes)) + ")"}
	args := []interface{}{}
	for _, c := range classes {
		args = append(args, c)
	}
	if search != "" {
		where = append(where, "(s.nis LIKE ? OR s.name LIKE ? OR s.nickname LIKE ?)")
		like := "%" + search + "%"
		args = append(args, like, like, like)
	}
	if status != "" {
		where = append(where, "s.status = ?")
		args = append(args, status)
	}
	whereStr := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM santri s WHERE %s", whereStr)
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT s.id, COALESCE(s.nis,''), COALESCE(s.name,''), COALESCE(s.nickname,''), COALESCE(s.gender,''), COALESCE(s.birth_place,''), COALESCE(s.birth_date,''), COALESCE(s.address,''), COALESCE(s.class,''), COALESCE(s.jenjang,''), COALESCE(s.angkatan,''), COALESCE(s.status,''), COALESCE(s.parent_name,''), COALESCE(s.parent_phone,''), COALESCE(s.nik,''), COALESCE(s.father_name,''), COALESCE(s.father_phone,''), COALESCE(s.mother_name,''), COALESCE(s.mother_phone,''), COALESCE(s.father_occupation,''), COALESCE(s.mother_occupation,''), COALESCE(s.category,''), s.registration_id, COALESCE(s.photo_url,''), s.user_id, s.created_at, s.updated_at FROM santri s WHERE %s ORDER BY s.created_at DESC LIMIT ? OFFSET ?`, whereStr)
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
		if err := rows.Scan(&s.ID, &s.NIS, &s.Name, &s.Nickname, &s.Gender, &s.BirthPlace, &s.BirthDate, &s.Address, &s.Class, &s.Jenjang, &s.Angkatan, &s.Status, &s.ParentName, &s.ParentPhone, &s.NIK, &s.FatherName, &s.FatherPhone, &s.MotherName, &s.MotherPhone, &s.FatherOccupation, &s.MotherOccupation, &s.Category, &s.RegistrationID, &s.PhotoURL, &userID, &createdAt, &updatedAt); err != nil {
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

func placeholders(n int) string {
	ph := make([]string, n)
	for i := range ph {
		ph[i] = "?"
	}
	return strings.Join(ph, ",")
}

func (r *Repository) LinkUser(santriID, userID int) error {
	var exists int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE id = ? AND role = 'user'`, userID).Scan(&exists); err != nil {
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
	rows, err := r.db.Query(`SELECT id, COALESCE(nis,''), COALESCE(name,''), COALESCE(nickname,''), COALESCE(gender,''), COALESCE(birth_place,''), COALESCE(birth_date,''), COALESCE(address,''), COALESCE(class,''), COALESCE(jenjang,''), COALESCE(angkatan,''), COALESCE(status,''), COALESCE(parent_name,''), COALESCE(parent_phone,''), COALESCE(nik,''), COALESCE(father_name,''), COALESCE(father_phone,''), COALESCE(mother_name,''), COALESCE(mother_phone,''), COALESCE(father_occupation,''), COALESCE(mother_occupation,''), COALESCE(category,''), registration_id, COALESCE(photo_url,''), user_id, created_at, updated_at FROM santri WHERE user_id = ? ORDER BY name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Santri{}
	for rows.Next() {
		var x Santri
		var userID sql.NullInt64
		var createdAt, updatedAt string
		if err := rows.Scan(&x.ID, &x.NIS, &x.Name, &x.Nickname, &x.Gender, &x.BirthPlace, &x.BirthDate, &x.Address, &x.Class, &x.Jenjang, &x.Angkatan, &x.Status, &x.ParentName, &x.ParentPhone, &x.NIK, &x.FatherName, &x.FatherPhone, &x.MotherName, &x.MotherPhone, &x.FatherOccupation, &x.MotherOccupation, &x.RegistrationID, &x.PhotoURL, &userID, &createdAt, &updatedAt); err != nil {
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
