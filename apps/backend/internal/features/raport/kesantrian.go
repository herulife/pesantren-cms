package raport

import (
	"strings"
	"time"
)

// KesantrianAspect represents a student's score in one aspect (1-4 scale).
type KesantrianAspect struct {
	ID           int     `json:"id"`
	StudentID    int     `json:"student_id"`
	StudentName  string  `json:"student_name"`
	Aspek        string  `json:"aspek"`
	Semester     string  `json:"semester"`
	AcademicYear string  `json:"academic_year"`
	Score        float64 `json:"score"`
	UpdatedAt    string  `json:"updated_at"`
}

func (r *Repository) SetKesantrianAspect(studentID int, aspek, semester, ay string, score float64) error {
	now := time.Now().UTC()
	_, err := r.db.Exec(`
		INSERT INTO kesantrian_aspek (student_id, aspek, semester, academic_year, score, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(student_id, aspek, semester, academic_year) DO UPDATE SET
			score = excluded.score,
			updated_at = excluded.updated_at
	`, studentID, strings.ToLower(aspek), semester, ay, score, now, now)
	return err
}

func (r *Repository) GetKesantrianAspects(studentID int, semester, ay string) ([]KesantrianAspect, error) {
	rows, err := r.db.Query(`
		SELECT ka.id, ka.student_id, u.name, ka.aspek, ka.semester, ka.academic_year, ka.score, ka.updated_at
		FROM kesantrian_aspek ka JOIN users u ON u.id = ka.student_id
		WHERE ka.student_id = ? AND ka.semester = ? AND ka.academic_year = ?
		ORDER BY ka.aspek ASC
	`, studentID, semester, ay)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []KesantrianAspect
	for rows.Next() {
		var k KesantrianAspect
		if err := rows.Scan(&k.ID, &k.StudentID, &k.StudentName, &k.Aspek, &k.Semester, &k.AcademicYear, &k.Score, &k.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, k)
	}
	return list, nil
}