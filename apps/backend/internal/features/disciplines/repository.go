package disciplines

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type StudentPoint struct {
	ID            int       `json:"id"`
	StudentID     int       `json:"student_id"`
	StudentName   string    `json:"student_name"`
	ParentPhone   string    `json:"parent_phone"`
	CurrentPoints int       `json:"current_points"`
	AcademicYear  string    `json:"academic_year"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ViolationLog struct {
	ID                int       `json:"id"`
	StudentID         int       `json:"student_id"`
	StudentName       string    `json:"student_name"`
	ParentPhone       string    `json:"parent_phone"`
	ReporterName      string    `json:"reporter_name"`
	ViolationCategory string    `json:"violation_category"`
	ViolationDetail   string    `json:"violation_detail"`
	PointsDeducted    int       `json:"points_deducted"`
	ActionTaken       string    `json:"action_taken"`
	CreatedAt         time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// EnsureStudentPointExists creates a 100-point entry if the student doesn't have one yet.
func (r *Repository) EnsureStudentPointExists(ctx context.Context, studentID int, academicYear string) error {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM student_points WHERE student_id = ?", studentID).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		_, err = r.db.ExecContext(ctx, "INSERT Into student_points (student_id, current_points, academic_year) VALUES (?, 100, ?)", studentID, academicYear)
		return err
	}
	return nil
}

func (r *Repository) FindAllPoints(ctx context.Context, limit, offset int) ([]StudentPoint, int, error) {
	query := `
		SELECT sp.id, sp.student_id, u.name as student_name, COALESCE(reg.parent_phone, '') as parent_phone, 
		       sp.current_points, sp.academic_year, sp.updated_at
		FROM student_points sp
		JOIN users u ON u.id = sp.student_id
		LEFT JOIN registrations reg ON reg.user_id = u.id
		ORDER BY sp.updated_at DESC LIMIT ? OFFSET ?
	`
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []StudentPoint
	for rows.Next() {
		var sp StudentPoint
		var updatedAt string
		if err := rows.Scan(&sp.ID, &sp.StudentID, &sp.StudentName, &sp.ParentPhone, &sp.CurrentPoints, &sp.AcademicYear, &updatedAt); err != nil {
			return nil, 0, err
		}
		sp.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
		list = append(list, sp)
	}

	var total int
	r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM student_points").Scan(&total)

	return list, total, nil
}

func (r *Repository) GetStudentPoint(ctx context.Context, studentID int) (*StudentPoint, error) {
	query := `
		SELECT sp.id, sp.student_id, u.name as student_name, COALESCE(reg.parent_phone, '') as parent_phone,
		       sp.current_points, sp.academic_year, sp.updated_at
		FROM student_points sp
		JOIN users u ON u.id = sp.student_id
		LEFT JOIN registrations reg ON reg.user_id = u.id
		WHERE sp.student_id = ?
	`
	row := r.db.QueryRowContext(ctx, query, studentID)
	var sp StudentPoint
	var updatedAt string
	err := row.Scan(&sp.ID, &sp.StudentID, &sp.StudentName, &sp.ParentPhone, &sp.CurrentPoints, &sp.AcademicYear, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Not an error if completely unrecorded, just returns nil.
		}
		return nil, err
	}
	sp.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &sp, nil
}

func (r *Repository) FindAllLogs(ctx context.Context, studentID int, limit, offset int) ([]ViolationLog, int, error) {
	baseQuery := `
		SELECT vl.id, vl.student_id, u.name as student_name, COALESCE(reg.parent_phone, '') as parent_phone,
		       vl.reporter_name, vl.violation_category, vl.violation_detail, vl.points_deducted, 
		       vl.action_taken, vl.created_at
		FROM violation_logs vl
		JOIN users u ON u.id = vl.student_id
		LEFT JOIN registrations reg ON reg.user_id = u.id
	`
	args := []interface{}{}
	if studentID > 0 {
		baseQuery += " WHERE vl.student_id = ?"
		args = append(args, studentID)
	}
	baseQuery += " ORDER BY vl.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []ViolationLog
	for rows.Next() {
		var vl ViolationLog
		var createdAt string
		var actionTaken sql.NullString
		if err := rows.Scan(&vl.ID, &vl.StudentID, &vl.StudentName, &vl.ParentPhone, &vl.ReporterName, &vl.ViolationCategory,
			&vl.ViolationDetail, &vl.PointsDeducted, &actionTaken, &createdAt); err != nil {
			return nil, 0, err
		}
		vl.ActionTaken = actionTaken.String
		vl.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
		list = append(list, vl)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM violation_logs"
	if studentID > 0 {
		countQuery += " WHERE student_id = ?"
		r.db.QueryRowContext(ctx, countQuery, studentID).Scan(&total)
	} else {
		r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}

	return list, total, nil
}

func (r *Repository) RecordViolation(ctx context.Context, log ViolationLog) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	// Double check user exists
	var count int
	if err := tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE id = ?", log.StudentID).Scan(&count); err != nil || count == 0 {
		tx.Rollback()
		return errors.New("student not found in users table")
	}

	// 1. Insert the violation log
	_, err = tx.ExecContext(ctx, `
		INSERT INTO violation_logs (student_id, reporter_name, violation_category, violation_detail, points_deducted, action_taken)
		VALUES (?, ?, ?, ?, ?, ?)
	`, log.StudentID, log.ReporterName, log.ViolationCategory, log.ViolationDetail, log.PointsDeducted, log.ActionTaken)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 2. Decrement the student_points
	var currentPoints int
	err = tx.QueryRowContext(ctx, "SELECT current_points FROM student_points WHERE student_id = ?", log.StudentID).Scan(&currentPoints)
	if err != nil {
		if err == sql.ErrNoRows {
			// create it first
			_, err = tx.ExecContext(ctx, "INSERT INTO student_points (student_id, current_points, academic_year) VALUES (?, 100, ?)", log.StudentID, time.Now().Format("2006"))
			if err != nil {
				tx.Rollback()
				return err
			}
			currentPoints = 100
		} else {
			tx.Rollback()
			return err
		}
	}

	newPoints := currentPoints - log.PointsDeducted
	if newPoints < 0 {
		newPoints = 0
	}

	_, err = tx.ExecContext(ctx, "UPDATE student_points SET current_points = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?", newPoints, log.StudentID)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}
