package exams

import (
	"database/sql"
	"encoding/json"
	"time"
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

func (r *Repository) SubmitAnswer(sessionID, questionID, selectedAnswer int) error {
	// 1. Get correct key
	var correctKey int
	err := r.db.QueryRow("SELECT correct_answer_key FROM exam_questions WHERE id = ?", questionID).Scan(&correctKey)
	if err != nil {
		return err
	}

	isCorrect := (selectedAnswer == correctKey)

	// SQLite specific: need unique index for ON CONFLICT
	// For simplicity in this env, we use DELETE then INSERT
	_, _ = r.db.Exec("DELETE FROM exam_answers WHERE session_id = ? AND question_id = ?", sessionID, questionID)

	_, err = r.db.Exec("INSERT INTO exam_answers (session_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)",
		sessionID, questionID, selectedAnswer, isCorrect)
	return err
}

func (r *Repository) FinishSession(sessionID int) (float64, error) {
	var totalPoints, earnedPoints int

	// Sum points
	queryPoints := `
		SELECT SUM(q.points), SUM(CASE WHEN a.is_correct = 1 THEN q.points ELSE 0 END)
		FROM exam_questions q
		JOIN exam_answers a ON q.id = a.question_id
		WHERE a.session_id = ?
	`
	err := r.db.QueryRow(queryPoints, sessionID).Scan(&totalPoints, &earnedPoints)
	if err != nil {
		return 0, err
	}

	score := 0.0
	if totalPoints > 0 {
		score = (float64(earnedPoints) / float64(totalPoints)) * 100.0
	}

	// Update session
	finishTime := time.Now()
	_, err = r.db.Exec("UPDATE exam_sessions SET status = 'finished', score = ?, finished_at = ? WHERE id = ?",
		score, finishTime, sessionID)
	if err != nil {
		return 0, err
	}

	// SYNC TO GRADES
	var studentID, examID int
	r.db.QueryRow("SELECT student_id, exam_id FROM exam_sessions WHERE id = ?", sessionID).Scan(&studentID, &examID)

	var subjectID int
	var semester, year string
	r.db.QueryRow("SELECT subject_id, semester, academic_year FROM exams WHERE id = ?", examID).Scan(&subjectID, &semester, &year)

	// Insert into grades (as UAS or UTS based on title or default to UAS)
	// We'll check if entry exists
	_, _ = r.db.Exec(`
		INSERT INTO grades (student_id, subject_id, semester, academic_year, uas_score, final_score, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(student_id, subject_id) DO UPDATE SET uas_score = excluded.uas_score
	`, studentID, subjectID, semester, year, score, score, "Generated from CBT")

	return score, nil
}
