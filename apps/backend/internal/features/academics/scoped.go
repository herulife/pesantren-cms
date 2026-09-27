package academics

import (
	"strings"
)

// GetScopedGrades = GetAllGrades + filter mapel (guru) dan/atau kelas (wali).
func (r *Repository) GetScopedGrades(semester, year string, subjectIDs []int, classes []string, limit, offset int) ([]Grade, error) {
	query := `
		SELECT g.id, g.student_id, u.name as student_name, g.subject_id, s.name as subject_name,
		       g.semester, g.academic_year, g.uts_score, g.uas_score, g.task_score, g.uh_score,
		       g.final_score, g.grade_letter, g.notes, g.created_at
		FROM grades g
		JOIN users u ON g.student_id = u.id
		JOIN subjects s ON g.subject_id = s.id
		LEFT JOIN santri st ON st.user_id = g.student_id
		WHERE 1=1
	`
	var args []interface{}
	if semester != "" {
		query += " AND g.semester = ?"
		args = append(args, semester)
	}
	if year != "" {
		query += " AND g.academic_year = ?"
		args = append(args, year)
	}
	if len(subjectIDs) > 0 {
		ph := make([]string, len(subjectIDs))
		for i, id := range subjectIDs {
			ph[i] = "?"
			args = append(args, id)
		}
		query += " AND g.subject_id IN (" + strings.Join(ph, ",") + ")"
	}
	if len(classes) > 0 {
		ph := make([]string, len(classes))
		for i, c := range classes {
			ph[i] = "?"
			args = append(args, c)
		}
		query += " AND st.class IN (" + strings.Join(ph, ",") + ")"
	}
	query += " ORDER BY u.name ASC"
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, limit, offset)
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gs []Grade
	for rows.Next() {
		var g Grade
		if err := rows.Scan(&g.ID, &g.StudentID, &g.StudentName, &g.SubjectID, &g.SubjectName,
			&g.Semester, &g.AcademicYear, &g.UTSScore, &g.UASScore, &g.TaskScore, &g.UHScore,
			&g.FinalScore, &g.GradeLetter, &g.Notes, &g.CreatedAt); err != nil {
			return nil, err
		}
		gs = append(gs, g)
	}
	return gs, nil
}

// GetStudentsByClasses = GetStudents yang dibatasi kelas tertentu.
func (r *Repository) GetStudentsByClasses(classes []string) ([]struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}, error) {
	if len(classes) == 0 {
		return []struct {
			ID    int    `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}{}, nil
	}
	ph := make([]string, len(classes))
	args := make([]interface{}, len(classes))
	for i, c := range classes {
		ph[i] = "?"
		args[i] = c
	}
	query := "SELECT u.id, u.name, u.email FROM santri s JOIN users u ON u.id = s.user_id WHERE u.role = 'user' AND s.class IN (" + strings.Join(ph, ",") + ") ORDER BY u.name ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	for rows.Next() {
		var s struct {
			ID    int    `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := rows.Scan(&s.ID, &s.Name, &s.Email); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

// GetScopedTahfidz = GetAllTahfidz yang dibatasi kelas tertentu.
func (r *Repository) GetScopedTahfidz(classes []string, limit, offset int) ([]TahfidzProgress, error) {
	if len(classes) == 0 {
		return []TahfidzProgress{}, nil
	}
	ph := make([]string, 0, len(classes))
	args := []interface{}{}
	for _, c := range classes {
		ph = append(ph, "?")
		args = append(args, c)
	}
	query := `
		SELECT t.id, t.student_id, u.name as student_name, t.surah_name, t.juz, t.start_ayat, t.end_ayat, t.status, t.musyrif_notes, t.evaluation_date
		FROM tahfidz_progress t
		JOIN users u ON t.student_id = u.id
		LEFT JOIN santri st ON st.user_id = t.student_id
		WHERE st.class IN (` + strings.Join(ph, ",") + `)
		ORDER BY t.evaluation_date DESC
	`
	return r.queryTahfidzScoped(query, args, limit, offset)
}

func (r *Repository) queryTahfidzScoped(query string, args []interface{}, limit, offset int) ([]TahfidzProgress, error) {
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, limit, offset)
	}
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ts []TahfidzProgress
	for rows.Next() {
		var t TahfidzProgress
		if err := rows.Scan(&t.ID, &t.StudentID, &t.StudentName, &t.SurahName, &t.Juz, &t.StartAyat, &t.EndAyat, &t.Status, &t.MusyrifNotes, &t.EvaluationDate); err != nil {
			return nil, err
		}
		ts = append(ts, t)
	}
	return ts, nil
}

// ReportPerGuruFor = ReportPerGuru yang dibatasi guru tertentu.
func (r *Repository) ReportPerGuruFor(semester, year string, teacherID int) ([]PerGuruRow, error) {
	args := []interface{}{teacherID}
	gradeFilter := ""
	if semester != "" {
		gradeFilter += " AND g.semester = ?"
		args = append(args, semester)
	}
	if year != "" {
		gradeFilter += " AND g.academic_year = ?"
		args = append(args, year)
	}
	query := `
		SELECT s.teacher_id, COALESCE(u.name, 'Belum ada pengampu'),
			COUNT(DISTINCT s.id),
			GROUP_CONCAT(DISTINCT s.name),
			COUNT(DISTINCT g.student_id),
			COUNT(g.id),
			COALESCE(AVG(g.final_score), 0)
		FROM subjects s
		LEFT JOIN users u ON u.id = s.teacher_id
		LEFT JOIN grades g ON g.subject_id = s.id` + gradeFilter + `
		WHERE s.teacher_id = ?
		GROUP BY s.teacher_id
		ORDER BY COALESCE(u.name, 'zzz')`
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []PerGuruRow{}
	for rows.Next() {
		var row PerGuruRow
		if err := rows.Scan(&row.TeacherID, &row.TeacherName, &row.SubjectCount, &row.Subjects, &row.StudentCount, &row.GradeCount, &row.AvgFinal); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, nil
}
