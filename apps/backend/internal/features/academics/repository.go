package academics

import (
	"database/sql"
	"time"

	"almaparung-api/internal/platform/weight"
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
	UHScore      float64 `json:"uh_score"`
	FinalScore   float64 `json:"final_score"`
	GradeLetter  string  `json:"grade_letter"`
	Notes        string  `json:"notes"`
	CreatedAt    string  `json:"created_at"`
}

// SubjectWeight adalah bobot prosentase komponen nilai per mapel.
type SubjectWeight struct {
	SubjectID   int     `json:"subject_id"`
	SubjectName string  `json:"subject_name,omitempty"`
	UtsWeight   float64 `json:"uts_weight"`
	UasWeight   float64 `json:"uas_weight"`
	TaskWeight  float64 `json:"task_weight"`
	UhWeight    float64 `json:"uh_weight"`
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
func (r *Repository) GetAllGrades(semester, year string, limit, offset int) ([]Grade, error) {
	query := `
		SELECT g.id, g.student_id, u.name as student_name, g.subject_id, s.name as subject_name,
		       g.semester, g.academic_year, g.uts_score, g.uas_score, g.task_score, g.uh_score,
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

func (r *Repository) GetGradesByStudent(studentID int) ([]Grade, error) {
	query := `
		SELECT g.id, g.student_id, g.subject_id, s.name as subject_name,
		       g.semester, g.academic_year, g.uts_score, g.uas_score, g.task_score, g.uh_score, 
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
			&g.Semester, &g.AcademicYear, &g.UTSScore, &g.UASScore, &g.TaskScore, &g.UHScore,
			&g.FinalScore, &g.GradeLetter, &g.Notes, &g.CreatedAt); err != nil {
			return nil, err
		}
		gs = append(gs, g)
	}
	return gs, nil
}

func (r *Repository) CreateGrade(g *Grade) error {
	weights, err := r.GetSubjectWeights(g.SubjectID)
	if err != nil {
		return err
	}
	final, err := weight.CalculateGradeFinal(g.UTSScore, g.UASScore, g.TaskScore, g.UHScore, weights)
	if err != nil {
		return err
	}
	g.FinalScore = final
	g.GradeLetter = weight.GradeLetter100(g.FinalScore)

	query := `
		INSERT INTO grades (student_id, subject_id, semester, academic_year, uts_score, uas_score, task_score, uh_score, final_score, grade_letter, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = r.db.Exec(query, g.StudentID, g.SubjectID, g.Semester, g.AcademicYear, g.UTSScore, g.UASScore, g.TaskScore, g.UHScore, g.FinalScore, g.GradeLetter, g.Notes)
	return err
}

func (r *Repository) UpdateGrade(id int, g *Grade) error {
	weights, err := r.GetSubjectWeights(g.SubjectID)
	if err != nil {
		return err
	}
	final, err := weight.CalculateGradeFinal(g.UTSScore, g.UASScore, g.TaskScore, g.UHScore, weights)
	if err != nil {
		return err
	}
	g.FinalScore = final
	g.GradeLetter = weight.GradeLetter100(g.FinalScore)

	query := `
		UPDATE grades SET subject_id=?, semester=?, academic_year=?, uts_score=?, uas_score=?, task_score=?, uh_score=?, final_score=?, grade_letter=?, notes=?
		WHERE id=?
	`
	_, err = r.db.Exec(query, g.SubjectID, g.Semester, g.AcademicYear, g.UTSScore, g.UASScore, g.TaskScore, g.UHScore, g.FinalScore, g.GradeLetter, g.Notes, id)
	return err
}

func (r *Repository) DeleteGrade(id int) error {
	_, err := r.db.Exec("DELETE FROM grades WHERE id = ?", id)
	return err
}

// GetSubjectWeights mengambil bobot komponen nilai subjek; fallback ke default.
// Bila tabel bobot belum termigrasi atau baris belum diset, selalu kembalikan
// default (UTS 25 / UAS 30 / Tugas 25 / UH 20) supaya input nilai guru tidak
// pernah gagal hanya karena pengaturan bobot belum siap.
func (r *Repository) GetSubjectWeights(subjectID int) (weight.GradeWeights, error) {
	fallback := weight.DefaultGradeWeights()
	var uts, uas, task, uh float64
	err := r.db.QueryRow(`SELECT uts_weight, uas_weight, task_weight, uh_weight FROM subject_grade_weights WHERE subject_id = ?`, subjectID).
		Scan(&uts, &uas, &task, &uh)
	if err != nil {
		return fallback, nil
	}
	if uts == 0 && uas == 0 && task == 0 && uh == 0 {
		return fallback, nil
	}
	return weight.GradeWeights{UTS: uts, UAS: uas, Task: task, UH: uh}, nil
}

// GetAllSubjectWeights mengambil daftar bobot per mapel (diisi default bila belum diset).
func (r *Repository) GetAllSubjectWeights() ([]SubjectWeight, error) {
	query := `
		SELECT s.id, s.name,
		       COALESCE(w.uts_weight, 25), COALESCE(w.uas_weight, 30),
		       COALESCE(w.task_weight, 25), COALESCE(w.uh_weight, 20)
		FROM subjects s
		LEFT JOIN subject_grade_weights w ON w.subject_id = s.id
		ORDER BY s.name
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []SubjectWeight
	for rows.Next() {
		var sw SubjectWeight
		if err := rows.Scan(&sw.SubjectID, &sw.SubjectName, &sw.UtsWeight, &sw.UasWeight, &sw.TaskWeight, &sw.UhWeight); err != nil {
			return nil, err
		}
		out = append(out, sw)
	}
	return out, rows.Err()
}

// UpsertSubjectWeights menyimpan bobot komponen nilai per mapel (satu transaksi).
func (r *Repository) UpsertSubjectWeights(items []SubjectWeight) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, item := range items {
		if _, err := tx.Exec(`
			INSERT INTO subject_grade_weights (subject_id, uts_weight, uas_weight, task_weight, uh_weight, updated_at)
			VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT(subject_id) DO UPDATE SET
				uts_weight=excluded.uts_weight,
				uas_weight=excluded.uas_weight,
				task_weight=excluded.task_weight,
				uh_weight=excluded.uh_weight,
				updated_at=CURRENT_TIMESTAMP
		`, item.SubjectID, item.UtsWeight, item.UasWeight, item.TaskWeight, item.UhWeight); err != nil {
			return err
		}
	}
	return tx.Commit()
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
func (r *Repository) GetAllTahfidz(limit, offset int) ([]TahfidzProgress, error) {
	query := `
		SELECT t.id, t.student_id, u.name as student_name, t.surah_name, t.juz, t.start_ayat, t.end_ayat, t.status, t.musyrif_notes, t.evaluation_date
		FROM tahfidz_progress t
		JOIN users u ON t.student_id = u.id
		ORDER BY t.evaluation_date DESC
	`
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
		rows, err := r.db.Query(query, limit, offset)
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
	query := "SELECT u.id, s.name, u.email FROM santri s JOIN users u ON u.id = s.user_id WHERE u.role = 'user' ORDER BY s.name ASC"
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

type PerGuruRow struct {
	TeacherID    int     `json:"teacher_id"`
	TeacherName  string  `json:"teacher_name"`
	SubjectCount int     `json:"subject_count"`
	Subjects     string  `json:"subjects"`
	StudentCount int     `json:"student_count"`
	GradeCount   int     `json:"grade_count"`
	AvgFinal     float64 `json:"avg_final"`
}

func (r *Repository) ReportPerGuru(semester, year string) ([]PerGuruRow, error) {
	args := []interface{}{}
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
		var tid sql.NullInt64
		if err := rows.Scan(&tid, &row.TeacherName, &row.SubjectCount, &row.Subjects, &row.StudentCount, &row.GradeCount, &row.AvgFinal); err != nil {
			return nil, err
		}
		if tid.Valid {
			row.TeacherID = int(tid.Int64)
		}
		if row.Subjects == "" {
			row.Subjects = "-"
		}
		out = append(out, row)
	}
	return out, rows.Err()
}
