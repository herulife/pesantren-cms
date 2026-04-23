package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"darussunnah-api/internal/platform/database"
	"golang.org/x/crypto/bcrypt"
)

type subjectSeed struct {
	Name     string
	Category string
}

func main() {
	dbPath := strings.TrimSpace(os.Getenv("DB_PATH"))
	if dbPath == "" {
		dbPath = "./darussunnah.db"
	}

	database.Connect(dbPath)
	db := database.DB
	defer db.Close()

	studentCount := getEnvInt("DUMMY_STUDENTS", 8)
	subjectCount := getEnvInt("DUMMY_SUBJECTS", 6)
	gradeCount := getEnvInt("DUMMY_GRADES", 96)
	attendanceCount := getEnvInt("DUMMY_ATTENDANCE", 96)
	tahfidzCount := getEnvInt("DUMMY_TAHFIDZ", 40)

	if err := seedAcademics(db, studentCount, subjectCount, gradeCount, attendanceCount, tahfidzCount); err != nil {
		log.Fatalf("seed academics failed: %v", err)
	}

	fmt.Printf(
		"Academic dummy created successfully: %d students + %d subjects + %d grades + %d attendance + %d tahfidz.\n",
		studentCount,
		subjectCount,
		gradeCount,
		attendanceCount,
		tahfidzCount,
	)
}

func seedAcademics(db *sql.DB, studentCount, subjectCount, gradeCount, attendanceCount, tahfidzCount int) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	teacherID, err := getFirstUserID(tx)
	if err != nil {
		return err
	}

	studentIDs, err := ensureDummyStudents(tx, studentCount)
	if err != nil {
		return err
	}

	subjectIDs, err := resetSubjects(tx, teacherID, subjectCount)
	if err != nil {
		return err
	}

	if err = resetGrades(tx, studentIDs, subjectIDs, gradeCount); err != nil {
		return err
	}

	if err = resetAttendance(tx, studentIDs, attendanceCount); err != nil {
		return err
	}

	if err = resetTahfidz(tx, studentIDs, tahfidzCount); err != nil {
		return err
	}

	return tx.Commit()
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	var result int
	if _, err := fmt.Sscanf(value, "%d", &result); err != nil || result < 0 {
		return fallback
	}

	return result
}

func getFirstUserID(tx *sql.Tx) (*int64, error) {
	var userID sql.NullInt64
	if err := tx.QueryRow(`SELECT id FROM users ORDER BY id ASC LIMIT 1`).Scan(&userID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if !userID.Valid {
		return nil, nil
	}

	return &userID.Int64, nil
}

func ensureDummyStudents(tx *sql.Tx, count int) ([]int64, error) {
	rows, err := tx.Query(`SELECT id FROM users WHERE email LIKE 'dummy.student.%@example.test'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var existingIDs []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		existingIDs = append(existingIDs, id)
	}

	if len(existingIDs) > 0 {
		if err := deleteByIDs(tx, "grades", "student_id", existingIDs); err != nil {
			return nil, err
		}
		if err := deleteByIDs(tx, "attendance", "student_id", existingIDs); err != nil {
			return nil, err
		}
		if err := deleteByIDs(tx, "tahfidz_progress", "student_id", existingIDs); err != nil {
			return nil, err
		}
	}

	hashedPassword, err := hashDummyPassword()
	if err != nil {
		return nil, err
	}

	for index, id := range existingIDs {
		email := fmt.Sprintf("dummy.student.%02d@example.test", index+1)
		name := fmt.Sprintf("Dummy Santri %02d", index+1)
		whatsapp := fmt.Sprintf("628123450%02d", index+1)
		if _, err := tx.Exec(
			`UPDATE users SET email = ?, password_hash = ?, name = ?, role = 'user', whatsapp = ? WHERE id = ?`,
			email,
			hashedPassword,
			name,
			whatsapp,
			id,
		); err != nil {
			return nil, err
		}
	}

	ids := make([]int64, 0, count)
	ids = append(ids, existingIDs...)

	for i := len(existingIDs) + 1; i <= count; i++ {
		email := fmt.Sprintf("dummy.student.%02d@example.test", i)
		name := fmt.Sprintf("Dummy Santri %02d", i)
		whatsapp := fmt.Sprintf("628123450%02d", i)
		res, err := tx.Exec(
			`INSERT INTO users (email, password_hash, name, role, whatsapp, created_at)
			 VALUES (?, ?, ?, 'user', ?, ?)`,
			email,
			hashedPassword,
			name,
			whatsapp,
			time.Now().AddDate(0, 0, -i).Format("2006-01-02 15:04:05"),
		)
		if err != nil {
			return nil, err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	if len(ids) > count {
		ids = ids[:count]
	}

	return ids, nil
}

func hashDummyPassword() (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte("12345678"), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func resetSubjects(tx *sql.Tx, teacherID *int64, count int) ([]int64, error) {
	if _, err := tx.Exec(`DELETE FROM grades WHERE notes LIKE 'Dummy Nilai Akademik %'`); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(`DELETE FROM subjects WHERE name LIKE 'Dummy Pelajaran Akademik %'`); err != nil {
		return nil, err
	}

	seeds := []subjectSeed{
		{Name: "Dummy Pelajaran Akademik 01 - Tahfidz", Category: "tahfidz"},
		{Name: "Dummy Pelajaran Akademik 02 - Fiqih", Category: "diniyah"},
		{Name: "Dummy Pelajaran Akademik 03 - Bahasa Arab", Category: "bahasa"},
		{Name: "Dummy Pelajaran Akademik 04 - Hadits", Category: "diniyah"},
		{Name: "Dummy Pelajaran Akademik 05 - Akhlak", Category: "karakter"},
		{Name: "Dummy Pelajaran Akademik 06 - Kitab Kuning", Category: "diniyah"},
	}

	var ids []int64
	for _, item := range sliceSubjects(seeds, count) {
		var teacherValue interface{}
		if teacherID != nil {
			teacherValue = *teacherID
		}
		res, err := tx.Exec(
			`INSERT INTO subjects (name, category, teacher_id, created_at) VALUES (?, ?, ?, ?)`,
			item.Name,
			item.Category,
			teacherValue,
			time.Now().Format("2006-01-02 15:04:05"),
		)
		if err != nil {
			return nil, err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, nil
}

func resetGrades(tx *sql.Tx, studentIDs, subjectIDs []int64, count int) error {
	if _, err := tx.Exec(`DELETE FROM grades WHERE notes LIKE 'Dummy Nilai Akademik %'`); err != nil {
		return err
	}

	terms := []struct {
		Semester string
		Year     string
	}{
		{Semester: "Ganjil", Year: "2024/2025"},
		{Semester: "Genap", Year: "2024/2025"},
	}

	index := 0
	for _, studentID := range studentIDs {
		for termIndex, term := range terms {
			for subjectOffset, subjectID := range subjectIDs {
				uts := float64(74 + ((index + termIndex + subjectOffset) % 14))
				uas := float64(78 + ((index + subjectOffset) % 12))
				task := float64(76 + ((index + termIndex) % 13))
				final := (uts + uas + task) / 3
				letter := gradeLetter(final)
				if _, err := tx.Exec(
					`INSERT INTO grades (student_id, subject_id, semester, academic_year, uts_score, uas_score, task_score, final_score, grade_letter, notes, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					studentID,
					subjectID,
					term.Semester,
					term.Year,
					uts,
					uas,
					task,
					final,
					letter,
					fmt.Sprintf("Dummy Nilai Akademik %02d", index+1),
					time.Now().AddDate(0, 0, -index).Format("2006-01-02 15:04:05"),
				); err != nil {
					return err
				}

				index++
				if index >= count {
					return nil
				}
			}
		}
	}

	return nil
}

func resetAttendance(tx *sql.Tx, studentIDs []int64, count int) error {
	if _, err := tx.Exec(`DELETE FROM attendance WHERE notes LIKE 'Dummy Absensi Akademik %'`); err != nil {
		return err
	}

	statuses := []string{"hadir", "hadir", "izin", "sakit", "alpha"}
	index := 0
	for _, studentID := range studentIDs {
		for day := 0; day < 16; day++ {
			status := statuses[(index+day)%len(statuses)]
			if _, err := tx.Exec(
				`INSERT INTO attendance (student_id, date, status, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
				studentID,
				time.Now().AddDate(0, 0, -day).Format("2006-01-02"),
				status,
				fmt.Sprintf("Dummy Absensi Akademik %02d", index+1),
				time.Now().AddDate(0, 0, -day).Format("2006-01-02 15:04:05"),
			); err != nil {
				return err
			}

			index++
			if index >= count {
				return nil
			}
		}
	}

	return nil
}

func resetTahfidz(tx *sql.Tx, studentIDs []int64, count int) error {
	if _, err := tx.Exec(`DELETE FROM tahfidz_progress WHERE musyrif_notes LIKE 'Dummy Tahfidz Akademik %'`); err != nil {
		return err
	}

	seeds := []struct {
		name      string
		juz       int
		startAyat int
		endAyat   int
		status    string
	}{
		{name: "An-Naba", juz: 30, startAyat: 1, endAyat: 20, status: "proses"},
		{name: "An-Nazi'at", juz: 30, startAyat: 1, endAyat: 26, status: "setor"},
		{name: "Abasa", juz: 30, startAyat: 1, endAyat: 42, status: "lulus"},
		{name: "At-Takwir", juz: 30, startAyat: 1, endAyat: 29, status: "setor"},
		{name: "Al-Infithar", juz: 30, startAyat: 1, endAyat: 19, status: "proses"},
		{name: "Al-Mutaffifin", juz: 30, startAyat: 1, endAyat: 36, status: "setor"},
		{name: "Al-Insyiqaq", juz: 30, startAyat: 1, endAyat: 25, status: "lulus"},
		{name: "Al-Buruj", juz: 30, startAyat: 1, endAyat: 22, status: "setor"},
	}

	index := 0
	for _, studentID := range studentIDs {
		for _, item := range seeds {
			if _, err := tx.Exec(
				`INSERT INTO tahfidz_progress (student_id, surah_name, juz, start_ayat, end_ayat, status, musyrif_notes, evaluation_date, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				studentID,
				item.name,
				item.juz,
				item.startAyat,
				item.endAyat,
				item.status,
				fmt.Sprintf("Dummy Tahfidz Akademik %02d - Progres hafalan berjalan baik dan perlu murojaah terjadwal.", index+1),
				time.Now().AddDate(0, 0, -index).Format("2006-01-02"),
				time.Now().AddDate(0, 0, -index).Format("2006-01-02 15:04:05"),
			); err != nil {
				return err
			}

			index++
			if index >= count {
				return nil
			}
		}
	}

	return nil
}

func deleteByIDs(tx *sql.Tx, table string, column string, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}

	placeholders := make([]string, 0, len(ids))
	args := make([]interface{}, 0, len(ids))
	for _, id := range ids {
		placeholders = append(placeholders, "?")
		args = append(args, id)
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s IN (%s)", table, column, strings.Join(placeholders, ","))
	_, err := tx.Exec(query, args...)
	return err
}

func gradeLetter(score float64) string {
	switch {
	case score >= 90:
		return "A"
	case score >= 80:
		return "B"
	case score >= 70:
		return "C"
	default:
		return "D"
	}
}

func sliceSubjects(items []subjectSeed, count int) []subjectSeed {
	if count <= 0 || len(items) == 0 {
		return nil
	}
	if count >= len(items) {
		return items
	}
	return items[:count]
}
