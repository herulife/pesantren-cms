package psb

import (
	"context"
	"database/sql"
	"time"
)

type Registration struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	FullName      string    `json:"full_name"`
	Nickname      string    `json:"nickname"`
	Gender        string    `json:"gender"`
	NIK           string    `json:"nik"`
	BirthPlace    string    `json:"birth_place"`
	BirthDate     string    `json:"birth_date"`
	Address       string    `json:"address"`
	ParentName    string    `json:"parent_name"`
	ParentPhone   string    `json:"parent_phone"`
	FatherName    string    `json:"father_name"`
	FatherJob     string    `json:"father_job"`
	FatherPhone   string    `json:"father_phone"`
	MotherName    string    `json:"mother_name"`
	MotherJob     string    `json:"mother_job"`
	MotherPhone   string    `json:"mother_phone"`
	SchoolOrigin  string    `json:"school_origin"`
	ProgramChoice string    `json:"program_choice"`
	KKURL         string    `json:"kk_url"`
	IjazahURL     string    `json:"ijazah_url"`
	PasfotoURL    string    `json:"pasfoto_url"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

const registrationSelectColumns = `
	id,
	COALESCE(user_id, 0),
	COALESCE(full_name, ''),
	COALESCE(nickname, ''),
	COALESCE(gender, ''),
	COALESCE(nik, ''),
	COALESCE(birth_place, ''),
	COALESCE(birth_date, ''),
	COALESCE(address, ''),
	COALESCE(parent_name, ''),
	COALESCE(parent_phone, ''),
	COALESCE(father_name, ''),
	COALESCE(father_job, ''),
	COALESCE(father_phone, ''),
	COALESCE(mother_name, ''),
	COALESCE(mother_job, ''),
	COALESCE(mother_phone, ''),
	COALESCE(school_origin, ''),
	COALESCE(program_choice, ''),
	COALESCE(kk_url, ''),
	COALESCE(ijazah_url, ''),
	COALESCE(pasfoto_url, ''),
	COALESCE(status, 'pending'),
	COALESCE(created_at, CURRENT_TIMESTAMP),
	COALESCE(updated_at, COALESCE(created_at, CURRENT_TIMESTAMP))
`

func scanRegistration(scanner interface {
	Scan(dest ...any) error
}) (*Registration, error) {
	var reg Registration
	var createdAt string
	var updatedAt string

	err := scanner.Scan(
		&reg.ID,
		&reg.UserID,
		&reg.FullName,
		&reg.Nickname,
		&reg.Gender,
		&reg.NIK,
		&reg.BirthPlace,
		&reg.BirthDate,
		&reg.Address,
		&reg.ParentName,
		&reg.ParentPhone,
		&reg.FatherName,
		&reg.FatherJob,
		&reg.FatherPhone,
		&reg.MotherName,
		&reg.MotherJob,
		&reg.MotherPhone,
		&reg.SchoolOrigin,
		&reg.ProgramChoice,
		&reg.KKURL,
		&reg.IjazahURL,
		&reg.PasfotoURL,
		&reg.Status,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return nil, err
	}

	reg.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	reg.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &reg, nil
}

func (r *Repository) FindAll(ctx context.Context, status string, limit, offset int) ([]Registration, int, error) {
	query := "SELECT " + registrationSelectColumns + " FROM registrations"
	var args []interface{}

	if status != "" {
		query += " WHERE status = ?"
		args = append(args, status)
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []Registration
	for rows.Next() {
		reg, err := scanRegistration(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, *reg)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM registrations"
	if status != "" {
		countQuery += " WHERE status = ?"
		err = r.db.QueryRowContext(ctx, countQuery, status).Scan(&total)
	} else {
		err = r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

func (r *Repository) FindByID(ctx context.Context, id int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE id = ?", id)
	return scanRegistration(row)
}

func (r *Repository) FindByUserID(ctx context.Context, userID int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE user_id = ? LIMIT 1", userID)
	return scanRegistration(row)
}

func (r *Repository) SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error) {
	existing, err := r.FindByUserID(ctx, userID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	parentName := reg.ParentName
	if parentName == "" {
		parentName = reg.FatherName
	}
	parentPhone := reg.ParentPhone
	if parentPhone == "" {
		parentPhone = reg.FatherPhone
	}

	if existing != nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE registrations
			SET full_name = ?, nickname = ?, gender = ?, nik = ?, birth_place = ?, birth_date = ?, address = ?,
			    parent_name = ?, parent_phone = ?, father_name = ?, father_job = ?, father_phone = ?,
			    mother_name = ?, mother_job = ?, mother_phone = ?, school_origin = ?, program_choice = ?, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`,
			reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice, userID,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO registrations (
				user_id, full_name, nickname, gender, nik, birth_place, birth_date, address,
				parent_name, parent_phone, father_name, father_job, father_phone,
				mother_name, mother_job, mother_phone, school_origin, program_choice, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
			userID, reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByUserID(ctx, userID)
}

func (r *Repository) UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL string) (*Registration, error) {
	existing, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if kkURL == "" {
		kkURL = existing.KKURL
	}
	if ijazahURL == "" {
		ijazahURL = existing.IjazahURL
	}
	if pasfotoURL == "" {
		pasfotoURL = existing.PasfotoURL
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE registrations
		SET kk_url = ?, ijazah_url = ?, pasfoto_url = ?, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`, kkURL, ijazahURL, pasfotoURL, userID)
	if err != nil {
		return nil, err
	}

	return r.FindByUserID(ctx, userID)
}

func (r *Repository) UpdateStatus(ctx context.Context, id int, status string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", status, id)
	return err
}

func (r *Repository) Delete(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM registrations WHERE id = ?", id)
	return err
}
