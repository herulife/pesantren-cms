// Package scope menyelesaikan hak akses berbasis peran untuk modul akademik
// dan e-raport sesuai struktur: pimpinan (read-only), admin (full),
// wali_kelas (kelasnya), guru (mapel yang diampu), ustadz (tahfidz &
// kesantrian semua santri).
package scope

import (
	"database/sql"
)

// Scope adalah hasil resolusi hak akses seorang pengguna.
type Scope struct {
	UserID     int
	Role       string
	SubjectIDs []int    // guru: id mapel yang diampu
	Classes    []string // wali_kelas: nama kelas yang diampu
}

// FullAccess berlaku untuk superadmin dan admin (tak terbatas).
func FullAccess(role string) bool {
	return role == "superadmin" || role == "admin"
}

// ReadOnly berlaku untuk pimpinan (baca + export, tanpa ubah).
func ReadOnly(role string) bool {
	return role == "pimpinan"
}

// Resolve membangun Scope dari role + penugasan di database.
func Resolve(db *sql.DB, userID int, role string) (*Scope, error) {
	sc := &Scope{UserID: userID, Role: role}
	if FullAccess(role) || ReadOnly(role) {
		return sc, nil
	}
	if role == "guru" {
		rows, err := db.Query(`SELECT id FROM subjects WHERE teacher_id = ?`, userID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		for rows.Next() {
			var id int
			if err := rows.Scan(&id); err != nil {
				continue
			}
			sc.SubjectIDs = append(sc.SubjectIDs, id)
		}
		if err := rows.Err(); err != nil {
			return nil, err
		}
	}
	if role == "wali_kelas" {
		rows, err := db.Query(`SELECT name FROM classes WHERE wali_user_id = ? AND is_active = 1`, userID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				continue
			}
			sc.Classes = append(sc.Classes, name)
		}
		if err := rows.Err(); err != nil {
			return nil, err
		}
	}
	return sc, nil
}

// HasSubject benar bila mapel termasuk yang diampu (atau akses penuh).
func (s *Scope) HasSubject(subjectID int) bool {
	if FullAccess(s.Role) || ReadOnly(s.Role) {
		return true
	}
	for _, id := range s.SubjectIDs {
		if id == subjectID {
			return true
		}
	}
	return false
}

// HasClass benar bila kelas termasuk yang diampu (atau akses penuh).
func (s *Scope) HasClass(className string) bool {
	if FullAccess(s.Role) || ReadOnly(s.Role) {
		return true
	}
	for _, c := range s.Classes {
		if c == className {
			return true
		}
	}
	return false
}

// StudentClass mengembalikan nama kelas santri dari users.id-nya.
func StudentClass(db *sql.DB, studentUserID int) (string, error) {
	var className sql.NullString
	err := db.QueryRow(`SELECT class FROM santri WHERE user_id = ?`, studentUserID).Scan(&className)
	if err != nil {
		return "", err
	}
	return className.String, nil
}

// GradeSubjectID mengembalikan subject_id sebuah baris nilai.
func GradeSubjectID(db *sql.DB, gradeID int) (int, error) {
	var subjectID int
	err := db.QueryRow(`SELECT subject_id FROM grades WHERE id = ?`, gradeID).Scan(&subjectID)
	if err != nil {
		return 0, err
	}
	return subjectID, nil
}

// ExamSubjectID mengembalikan subject_id sebuah ujian.
func ExamSubjectID(db *sql.DB, examID int) (int, error) {
	var subjectID int
	err := db.QueryRow(`SELECT subject_id FROM exams WHERE id = ?`, examID).Scan(&subjectID)
	if err != nil {
		return 0, err
	}
	return subjectID, nil
}

// TahfidzStudentID mengembalikan student_id sebuah baris tahfidz.
func TahfidzStudentID(db *sql.DB, tahfidzID int) (int, error) {
	var studentID int
	err := db.QueryRow(`SELECT student_id FROM tahfidz_progress WHERE id = ?`, tahfidzID).Scan(&studentID)
	if err != nil {
		return 0, err
	}
	return studentID, nil
}
