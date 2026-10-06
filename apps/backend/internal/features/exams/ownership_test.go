package exams

import (
	"database/sql"
	"errors"
	"testing"

	_ "modernc.org/sqlite"
)

// newIDORTestDB builds a minimal exam schema and returns a repository over it.
func newIDORTestDB(t *testing.T, db *sql.DB) *Repository {
	t.Helper()

	stmts := []string{
		`CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT)`,
		`CREATE TABLE subjects (id INTEGER PRIMARY KEY)`,
		`CREATE TABLE exams (
			id INTEGER PRIMARY KEY,
			subject_id INTEGER,
			title TEXT,
			academic_year TEXT,
			semester TEXT,
			duration_minutes INTEGER,
			start_time DATETIME,
			end_time DATETIME
		)`,
		`CREATE TABLE exam_questions (
			id INTEGER PRIMARY KEY,
			exam_id INTEGER,
			question_text TEXT,
			correct_answer_key INTEGER,
			points INTEGER
		)`,
		`CREATE TABLE exam_sessions (
			id INTEGER PRIMARY KEY,
			student_id INTEGER,
			exam_id INTEGER,
			status TEXT,
			score REAL,
			started_at DATETIME,
			finished_at DATETIME
		)`,
		`CREATE TABLE exam_answers (
			id INTEGER PRIMARY KEY,
			session_id INTEGER,
			question_id INTEGER,
			selected_answer INTEGER,
			is_correct INTEGER
		)`,
		`CREATE TABLE grades (
			id INTEGER PRIMARY KEY,
			student_id INTEGER,
			subject_id INTEGER,
			semester TEXT,
			academic_year TEXT,
			uas_score REAL,
			final_score REAL,
			notes TEXT,
			UNIQUE(student_id, subject_id, semester, academic_year)
		)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("schema: %v", err)
		}
	}
	return &Repository{db: db}
}

// TestExamSessionOwnershipIsEnforced is the regression test for the IDOR found in
// the audit: session_id came straight from the request body and was never checked
// against the authenticated student, so any student could write answers into
// another student's session and overwrite their grades row.
func TestExamSessionOwnershipIsEnforced(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	repo := newIDORTestDB(t, db)

	if _, err := db.Exec(`INSERT INTO subjects (id) VALUES (1)`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO exams (id, subject_id, title, academic_year, semester) VALUES (1, 1, 'UAS', '2026', '1')`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO exam_questions (id, exam_id, question_text, correct_answer_key, points) VALUES (1, 1, 'q1', 0, 10)`); err != nil {
		t.Fatal(err)
	}

	// Victim (student 100) starts an exam and gets session 1.
	victimSession, err := repo.StartSession(100, 1)
	if err != nil {
		t.Fatal(err)
	}
	if victimSession == 0 {
		t.Fatal("expected a session id")
	}

	// The attacker (student 200) must not be able to touch it.
	err = repo.SubmitAnswer(200, victimSession, 1, 0)
	if !errors.Is(err, ErrSessionNotOwned) {
		t.Fatalf("attacker SubmitAnswer: got %v, want ErrSessionNotOwned", err)
	}
	if _, err := repo.FinishSession(200, victimSession); !errors.Is(err, ErrSessionNotOwned) {
		t.Fatalf("attacker FinishSession: got %v, want ErrSessionNotOwned", err)
	}

	// Nothing must have been written into the victim's session or grades.
	var answerCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM exam_answers WHERE session_id = ?`, victimSession).Scan(&answerCount); err != nil {
		t.Fatal(err)
	}
	if answerCount != 0 {
		t.Fatalf("attacker wrote %d answers into the victim's session", answerCount)
	}
	var gradeCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM grades`).Scan(&gradeCount); err != nil {
		t.Fatal(err)
	}
	if gradeCount != 0 {
		t.Fatalf("attacker created %d grade rows", gradeCount)
	}
	var status string
	if err := db.QueryRow(`SELECT status FROM exam_sessions WHERE id = ?`, victimSession).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != "ongoing" {
		t.Fatalf("victim session status = %q, want ongoing", status)
	}

	// The owner can still use it normally.
	if err := repo.SubmitAnswer(100, victimSession, 1, 0); err != nil {
		t.Fatalf("owner SubmitAnswer: %v", err)
	}
	score, err := repo.FinishSession(100, victimSession)
	if err != nil {
		t.Fatalf("owner FinishSession: %v", err)
	}
	if score != 100 {
		t.Fatalf("owner score = %v, want 100", score)
	}
}

// TestFinishedSessionCannotBeReused guards the other half of the IDOR: once a
// session is finished, replaying the same session_id must not rewrite grades.
func TestFinishedSessionCannotBeReused(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	repo := newIDORTestDB(t, db)
	db.Exec(`INSERT INTO subjects (id) VALUES (1)`)
	db.Exec(`INSERT INTO exams (id, subject_id, title, academic_year, semester) VALUES (1, 1, 'UAS', '2026', '1')`)
	db.Exec(`INSERT INTO exam_questions (id, exam_id, question_text, correct_answer_key, points) VALUES (1, 1, 'q1', 0, 10)`)

	sid, err := repo.StartSession(100, 1)
	if err != nil {
		t.Fatal(err)
	}
	if err := repo.SubmitAnswer(100, sid, 1, 0); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.FinishSession(100, sid); err != nil {
		t.Fatal(err)
	}

	if err := repo.SubmitAnswer(100, sid, 1, 0); !errors.Is(err, ErrSessionNotOwned) {
		t.Fatalf("reusing a finished session: got %v, want ErrSessionNotOwned", err)
	}
}