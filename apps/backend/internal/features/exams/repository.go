package exams

import (
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"time"

	"almaparung-api/internal/validators"
)

type Exam struct {
	ID              int       `json:"id"`
	SubjectID       int       `json:"subject_id"`
	SubjectName     string    `json:"subject_name,omitempty"`
	Title           string    `json:"title"`
	AcademicYear    string    `json:"academic_year"`
	Semester        string    `json:"semester"`
	DurationMinutes int       `json:"duration_minutes"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	CreatedAt       time.Time `json:"created_at"`
}

type Question struct {
	ID               int      `json:"id"`
	ExamID           int      `json:"exam_id"`
	QuestionText     string   `json:"question_text"`
	Options          []string `json:"options"`
	CorrectAnswerKey int      `json:"correct_answer_key,omitempty"` // Omitted for students
	Points           int      `json:"points"`
}

type ExamSession struct {
	ID         int        `json:"id"`
	StudentID  int        `json:"student_id"`
	ExamID     int        `json:"exam_id"`
	Status     string     `json:"status"` // ongoing, finished
	Score      float64    `json:"score"`
	StartedAt  time.Time  `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at,omitempty"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Admin: CRUD for Exams
func (r *Repository) CreateExam(e *Exam) error {
	query := `INSERT INTO exams (subject_id, title, academic_year, semester, duration_minutes, start_time, end_time) 
	          VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, e.SubjectID, e.Title, e.AcademicYear, e.Semester, e.DurationMinutes, e.StartTime, e.EndTime)
	return err
}

func (r *Repository) AddQuestion(q *Question) error {
	optionsJSON, _ := json.Marshal(q.Options)
	query := `INSERT INTO exam_questions (exam_id, question_text, options_json, correct_answer_key, points) 
	          VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, q.ExamID, q.QuestionText, string(optionsJSON), q.CorrectAnswerKey, q.Points)
	return err
}

// Student: Get Exams
func (r *Repository) GetAvailableExams() ([]Exam, error) {
	now := time.Now()
	query := `
		SELECT e.id, e.subject_id, COALESCE(s.name, 'Tanpa Mata Pelajaran') as subject_name, e.title, e.academic_year, e.semester, 
		       e.duration_minutes, e.start_time, e.end_time
		FROM exams e
		LEFT JOIN subjects s ON e.subject_id = s.id
		WHERE (e.start_time IS NULL OR e.start_time <= ?) 
		  AND (e.end_time IS NULL OR e.end_time >= ?)
		ORDER BY e.start_time DESC
	`
	rows, err := r.db.Query(query, now, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exams []Exam
	for rows.Next() {
		var e Exam
		var start, end sql.NullString
		if err := rows.Scan(&e.ID, &e.SubjectID, &e.SubjectName, &e.Title, &e.AcademicYear, &e.Semester,
			&e.DurationMinutes, &start, &end); err != nil {
			return nil, err
		}
		if start.Valid {
			e.StartTime, _ = time.Parse(time.RFC3339, start.String)
		}
		if end.Valid {
			e.EndTime, _ = time.Parse(time.RFC3339, end.String)
		}
		exams = append(exams, e)
	}
	return exams, nil
}

// HasSession true bila student punya sesi untuk ujian ini.
func (r *Repository) HasSession(studentID, examID int) bool {
	var one int
	if err := r.db.QueryRow(`SELECT 1 FROM exam_sessions WHERE student_id = ? AND exam_id = ? LIMIT 1`, studentID, examID).Scan(&one); err != nil {
		return false
	}
	return true
}

func (r *Repository) GetExamQuestions(examID int, hideAnswers bool) ([]Question, error) {
	query := `SELECT id, exam_id, question_text, options_json, correct_answer_key, points 
	          FROM exam_questions WHERE exam_id = ?`
	rows, err := r.db.Query(query, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		var q Question
		var optionsStr string
		if err := rows.Scan(&q.ID, &q.ExamID, &q.QuestionText, &optionsStr, &q.CorrectAnswerKey, &q.Points); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(optionsStr), &q.Options)
		if hideAnswers {
			q.CorrectAnswerKey = -1 // Hide from students
		}
		questions = append(questions, q)
	}
	return questions, nil
}

// Student: Session Management
func (r *Repository) IsSessionOwnedBy(sessionID, userID int) bool {
	var owner int
	err := r.db.QueryRow("SELECT student_id FROM exam_sessions WHERE id = ?", sessionID).Scan(&owner)
	if err != nil {
		return false
	}
	return owner == userID
}

func (r *Repository) StartSession(studentID, examID int) (int, error) {
	// Check if already has a session
	var sessionID int
	queryCheck := `SELECT id FROM exam_sessions WHERE student_id = ? AND exam_id = ? AND status = 'ongoing'`
	err := r.db.QueryRow(queryCheck, studentID, examID).Scan(&sessionID)
	if err == nil {
		return sessionID, nil // Resume existing
	}

	query := `INSERT INTO exam_sessions (student_id, exam_id, status) VALUES (?, ?, 'ongoing')`
	res, err := r.db.Exec(query, studentID, examID)
	if err != nil {
		return 0, err
	}
	id, _ := res.LastInsertId()
	return int(id), nil
}

var (
	ErrAnswerForbidden = errors.New("soal tidak termasuk dalam sesi ujian ini")
	ErrSessionFinished = errors.New("sesi ujian sudah selesai")
)

func (r *Repository) SubmitAnswer(sessionID, questionID, selectedAnswer int) error {
	// 0. Ownership: soal harus milik ujian pada sesi ini (anti lintas-ujian).
	var ok int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM exam_questions q JOIN exam_sessions s ON s.exam_id = q.exam_id WHERE q.id = ? AND s.id = ? AND s.status != 'finished'`,
		questionID, sessionID).Scan(&ok); err != nil || ok == 0 {
		if err != nil {
			return err
		}
		return ErrAnswerForbidden
	}
	// 1. Get correct key
	var correctKey int
	err := r.db.QueryRow("SELECT correct_answer_key FROM exam_questions WHERE id = ?", questionID).Scan(&correctKey)
	if err != nil {
		return err
	}

	isCorrect := (selectedAnswer == correctKey)

	// Hapus jawaban lama (UNIQUE(session_id, question_id) mencegah ganda).
	if _, err := r.db.Exec("DELETE FROM exam_answers WHERE session_id = ? AND question_id = ?", sessionID, questionID); err != nil {
		return err
	}

	_, err = r.db.Exec("INSERT INTO exam_answers (session_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)",
		sessionID, questionID, selectedAnswer, isCorrect)
	return err
}

func gradeLetter(final float64) string {
	switch {
	case final >= 90:
		return "A"
	case final >= 80:
		return "B"
	case final >= 75:
		return "C"
	case final >= 60:
		return "D"
	default:
		return "E"
	}
}

func (r *Repository) FinishSession(sessionID int) (float64, error) {
	var totalPoints, earnedPoints sql.NullInt64

	// Sum points: total from all questions of the exam, earned from correct answers
	var examID int
	_ = r.db.QueryRow("SELECT exam_id FROM exam_sessions WHERE id = ?", sessionID).Scan(&examID)
	queryPoints := `
		SELECT 
			(SELECT COALESCE(SUM(points),0) FROM exam_questions WHERE exam_id = ?),
			COALESCE(SUM(CASE WHEN a.is_correct = 1 THEN q.points ELSE 0 END),0)
		FROM exam_questions q
		LEFT JOIN exam_answers a ON q.id = a.question_id AND a.session_id = ?
		WHERE q.exam_id = ?
	`
	err := r.db.QueryRow(queryPoints, examID, sessionID, examID).Scan(&totalPoints, &earnedPoints)
	if err != nil {
		return 0, err
	}

	score := 0.0
	tp := int64(0)
	ep := int64(0)
	if totalPoints.Valid {
		tp = totalPoints.Int64
	}
	if earnedPoints.Valid {
		ep = earnedPoints.Int64
	}
	if tp > 0 {
		score = (float64(ep) / float64(tp)) * 100.0
	}

	// Update session with transaction
	finishTime := time.Now()
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	res, err := tx.Exec("UPDATE exam_sessions SET status = 'finished', score = ?, finished_at = ? WHERE id = ? AND status != 'finished'",
		score, finishTime, sessionID)
	if err != nil {
		return 0, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return 0, ErrSessionFinished
	}
	// SYNC TO GRADES
	var studentID int
	tx.QueryRow("SELECT student_id, exam_id FROM exam_sessions WHERE id = ?", sessionID).Scan(&studentID, &examID)

	var subjectID int
	var semester, year string
	tx.QueryRow("SELECT subject_id, semester, academic_year FROM exams WHERE id = ?", examID).Scan(&subjectID, &semester, &year)

	// Samakan semester dengan kanonik sistem nilai ("1"/"2") agar nilai CBT
	// tidak terpisah dari nilai manual saat rapor dihitung.
	semester = validators.NormalizeSemester(semester)

	// CBT menulis komponen UAS. Ambil komponen UTS/tugas yang sudah ada (jika
	// guru sudah mengisi manual) lalu hitung ulang final dengan formula yang
	// SAMA seperti nilai manual: (UTS*30 + UAS*40 + Tugas*30)/100.
	var uts, task float64
	_ = tx.QueryRow(`SELECT COALESCE(uts_score,0), COALESCE(task_score,0) FROM grades
		WHERE student_id=? AND subject_id=? AND semester=? AND academic_year=?`,
		studentID, subjectID, semester, year).Scan(&uts, &task)
	finalScore := (uts*30 + score*40 + task*30) / 100
	finalScore = math.Round(finalScore*100) / 100
	letter := gradeLetter(finalScore)

	if _, err := tx.Exec(`
		INSERT INTO grades (student_id, subject_id, semester, academic_year, uts_score, uas_score, task_score, final_score, grade_letter, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(student_id, subject_id, semester, academic_year) DO UPDATE SET
			uas_score = excluded.uas_score,
			final_score = excluded.final_score,
			grade_letter = excluded.grade_letter,
			notes = excluded.notes
	`, studentID, subjectID, semester, year, uts, score, task, finalScore, letter, "Generated from CBT"); err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return score, nil
}
