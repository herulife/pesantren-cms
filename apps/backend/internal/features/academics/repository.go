package academics

import (
	"database/sql"
	"time"
)

type Subject struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Category  string `json:"category"`
	TeacherID int    `json:"teacher_id"`
	CreatedAt string `json:"created_at"`
}

type Grade struct {
	ID           int     `json:"id"`
	StudentID    int     `json:"student_id"`
	StudentName  string  `json:"student_name,omitempty"`
	SubjectID    int     `json:"subject_id"`
	SubjectName  string  `json:"subject_name,omitempty"`
	Semester     string  `json:"semester"`
	AcademicYear string  `json:"academic_year"`
	UTSScore     float64 `json:"uts_score"`
	UASScore     float64 `json:"uas_score"`
	TaskScore    float64 `json:"task_score"`
	FinalScore   float64 `json:"final_score"`
	GradeLetter  string  `json:"grade_letter"`
	Notes        string  `json:"notes"`
	CreatedAt    string  `json:"created_at"`
}

type Attendance struct {
	ID           int    `json:"id"`
	StudentID    int    `json:"student_id"`
	StudentName  string `json:"student_name,omitempty"`
	StudentPhone string `json:"student_phone,omitempty"`
	Date         string `json:"date"`
	Status       string `json:"status"` // hadir, sakit, izin, alpha
	Notes        string `json:"notes"`
}

type TahfidzProgress struct {
	ID             int    `json:"id"`
	StudentID      int    `json:"student_id"`
	StudentName    string `json:"student_name,omitempty"`
	SurahName      string `json:"surah_name"`
	Juz            int    `json:"juz"`
	StartAyat      int    `json:"start_ayat"`
	EndAyat        int    `json:"end_ayat"`
	Status         string `json:"status"` // proses, setor, lulus
	MusyrifNotes   string `json:"musyrif_notes"`
	EvaluationDate string `json:"evaluation_date"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Subjects
func (r *Repository) GetAllSubjects() ([]Subject, error) {
	query := `SELECT id, name, category, teacher_id, created_at FROM subjects ORDER BY name`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ss []Subject
	for rows.Next() {
		var s Subject
		var teacherID sql.NullInt64
		if err := rows.Scan(&s.ID, &s.Name, &s.Category, &teacherID, &s.CreatedAt); err != nil {
			return nil, err
		}
		if teacherID.Valid {
			s.TeacherID = int(teacherID.Int64)
		}
		ss = append(ss, s)
	}
	return ss, nil
}

func (r *Repository) CreateSubject(s *Subject) error {
	query := `INSERT INTO subjects (name, category, teacher_id) VALUES (?, ?, ?)`
	var teacherID interface{}
	if s.TeacherID > 0 {
		teacherID = s.TeacherID
	}
	_, err := r.db.Exec(query, s.Name, s.Category, teacherID)
	return err
}

func (r *Repository) DeleteSubject(id int) error {
	_, err := r.db.Exec("DELETE FROM subjects WHERE id = ?", id)
	return err
}

// Grades
func (r *Repository) GetAllGrades(semester, year string) ([]Grade, error) {
	query := `
		SELECT g.id, g.student_id, u.name as student_name, g.subject_id, s.name as subject_name,
		       g.semester, g.academic_year, g.uts_score, g.uas_score, g.task_score, 
		       g.final_score, g.grade_letter, g.notes, g.created_at
		FROM grades g
		JOIN users u ON g.student_id = u.id
		JOIN subjects s ON g.subject_id = s.id
	`
	var args []interface{}
	if semester != "" || year != "" {
		query += " WHERE 1=1"
		if semester != "" {
			query += " AND g.semester = ?"
			args = append(args, semester)
		}
		if year != "" {
			query += " AND g.academic_year = ?"
			args = append(args, year)
		}
	}
	query += " ORDER BY u.name ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gs []Grade
	for rows.Next() {
		var g Grade
		if err := rows.Scan(&g.ID, &g.StudentID, &g.StudentName, &g.SubjectID, &g.SubjectName,
			&g.Semester, &g.AcademicYear, &g.UTSScore, &g.UASScore, &g.TaskScore,
			&g.FinalScore, &g.GradeLetter, &g.Notes, &g.CreatedAt); err != nil {
			return nil, err
		}
		gs = append(gs, g)
	}
	return gs, nil
}

func (r *Repository) GetGradesByStudent(studentID int) ([]Grade, error) {
	query := `
		SELECT g.id, g.student_id, g.subject_id, s.name as subject_name,
		       g.semester, g.academic_year, g.uts_score, g.uas_score, g.task_score, 
		       g.final_score, g.grade_letter, g.notes, g.created_at
		FROM grades g
		JOIN subjects s ON g.subject_id = s.id
		WHERE g.student_id = ?
		ORDER BY g.academic_year DESC, g.semester DESC
	`
	rows, err := r.db.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gs []Grade
	for rows.Next() {
		var g Grade
		if err := rows.Scan(&g.ID, &g.StudentID, &g.SubjectID, &g.SubjectName,
			&g.Semester, &g.AcademicYear, &g.UTSScore, &g.UASScore, &g.TaskScore,
			&g.FinalScore, &g.GradeLetter, &g.Notes, &g.CreatedAt); err != nil {
			return nil, err
		}
		gs = append(gs, g)
	}
	return gs, nil
}

func (r *Repository) CreateGrade(g *Grade) error {
	g.FinalScore = (g.UTSScore*30 + g.UASScore*40 + g.TaskScore*30) / 100
	if g.FinalScore >= 85 {
		g.GradeLetter = "A"
	} else if g.FinalScore >= 75 {
		g.GradeLetter = "B"
	} else if g.FinalScore >= 60 {
		g.GradeLetter = "C"
	} else if g.FinalScore >= 45 {
		g.GradeLetter = "D"
	} else {
		g.GradeLetter = "E"
	}

	query := `
		INSERT INTO grades (student_id, subject_id, semester, academic_year, uts_score, uas_score, task_score, final_score, grade_letter, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, g.StudentID, g.SubjectID, g.Semester, g.AcademicYear, g.UTSScore, g.UASScore, g.TaskScore, g.FinalScore, g.GradeLetter, g.Notes)
	return err
}

func (r *Repository) UpdateGrade(id int, g *Grade) error {
	g.FinalScore = (g.UTSScore*30 + g.UASScore*40 + g.TaskScore*30) / 100
	if g.FinalScore >= 85 {
		g.GradeLetter = "A"
	} else if g.FinalScore >= 75 {
		g.GradeLetter = "B"
	} else if g.FinalScore >= 60 {
		g.GradeLetter = "C"
	} else if g.FinalScore >= 45 {
		g.GradeLetter = "D"
	} else {
		g.GradeLetter = "E"
	}

	query := `
		UPDATE grades SET subject_id=?, semester=?, academic_year=?, uts_score=?, uas_score=?, task_score=?, final_score=?, grade_letter=?, notes=?
		WHERE id=?
	`
	_, err := r.db.Exec(query, g.SubjectID, g.Semester, g.AcademicYear, g.UTSScore, g.UASScore, g.TaskScore, g.FinalScore, g.GradeLetter, g.Notes, id)
	return err
}

func (r *Repository) DeleteGrade(id int) error {
	_, err := r.db.Exec("DELETE FROM grades WHERE id = ?", id)
	return err
}

// Attendance
func (r *Repository) GetAttendance(date string) ([]Attendance, error) {
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	query := `
		SELECT a.id, a.student_id, u.name as student_name, COALESCE(u.whatsapp, '') as student_phone, a.date, a.status, a.notes
		FROM attendance a
		JOIN users u ON a.student_id = u.id
		WHERE a.date = ?
		ORDER BY u.name ASC
	`
	rows, err := r.db.Query(query, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var as []Attendance
	for rows.Next() {
		var a Attendance
		if err := rows.Scan(&a.ID, &a.StudentID, &a.StudentName, &a.StudentPhone, &a.Date, &a.Status, &a.Notes); err != nil {
			return nil, err
		}
		as = append(as, a)
	}
	return as, nil
}

func (r *Repository) CreateAttendance(a *Attendance) error {
	query := `INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, ?, ?)`
	_, err := r.db.Exec(query, a.StudentID, a.Date, a.Status, a.Notes)
	return err
}

func (r *Repository) UpdateAttendance(id int, a *Attendance) error {
	query := `UPDATE attendance SET student_id = ?, date = ?, status = ?, notes = ? WHERE id = ?`
	_, err := r.db.Exec(query, a.StudentID, a.Date, a.Status, a.Notes, id)
	return err
}

func (r *Repository) DeleteAttendance(id int) error {
	_, err := r.db.Exec("DELETE FROM attendance WHERE id = ?", id)
	return err
}

func (r *Repository) GetAttendanceSummary(studentID int) (map[string]int, error) {
	query := `SELECT status, COUNT(*) FROM attendance WHERE student_id = ? GROUP BY status`
	rows, err := r.db.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summary := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		summary[status] = count
	}
	return summary, nil
}

// Tahfidz
func (r *Repository) GetAllTahfidz() ([]TahfidzProgress, error) {
	query := `
		SELECT t.id, t.student_id, u.name as student_name, t.surah_name, t.juz, t.start_ayat, t.end_ayat, t.status, t.musyrif_notes, t.evaluation_date
		FROM tahfidz_progress t
		JOIN users u ON t.student_id = u.id
		ORDER BY t.evaluation_date DESC
	`
	rows, err := r.db.Query(query)
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

func (r *Repository) GetTahfidzByStudent(studentID int) ([]TahfidzProgress, error) {
	query := `
		SELECT t.id, t.student_id, u.name as student_name, t.surah_name, t.juz, t.start_ayat, t.end_ayat, t.status, t.musyrif_notes, t.evaluation_date
		FROM tahfidz_progress t
		JOIN users u ON t.student_id = u.id
		WHERE t.student_id = ?
		ORDER BY t.evaluation_date DESC
	`
	rows, err := r.db.Query(query, studentID)
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

func (r *Repository) CreateTahfidz(t *TahfidzProgress) error {
	query := `INSERT INTO tahfidz_progress (student_id, surah_name, juz, start_ayat, end_ayat, status, musyrif_notes, evaluation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, t.StudentID, t.SurahName, t.Juz, t.StartAyat, t.EndAyat, t.Status, t.MusyrifNotes, t.EvaluationDate)
	return err
}

func (r *Repository) UpdateTahfidz(id int, t *TahfidzProgress) error {
	query := `UPDATE tahfidz_progress SET student_id=?, surah_name=?, juz=?, start_ayat=?, end_ayat=?, status=?, musyrif_notes=?, evaluation_date=? WHERE id=?`
	_, err := r.db.Exec(query, t.StudentID, t.SurahName, t.Juz, t.StartAyat, t.EndAyat, t.Status, t.MusyrifNotes, t.EvaluationDate, id)
	return err
}

func (r *Repository) DeleteTahfidz(id int) error {
	_, err := r.db.Exec("DELETE FROM tahfidz_progress WHERE id = ?", id)
	return err
}

func (r *Repository) GetStudents() ([]struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}, error) {
	query := "SELECT id, name, email FROM users WHERE role = 'user' ORDER BY name ASC"
	rows, err := r.db.Query(query)
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
