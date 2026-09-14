package raport

import (
	"errors"
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"
	"time"

	"almaparung-api/internal/platform/weight"
)

// ComputedRaport is the full calculation result returned by the API.
type ComputedRaport struct {
	StudentID        int               `json:"student_id"`
	StudentName      string            `json:"student_name"`
	Semester         string            `json:"semester"`
	AcademicYear     string            `json:"academic_year"`
	MapelScore       float64           `json:"mapel_score"`
	ProjectScore     float64           `json:"project_score"`
	KesantrianScore  float64           `json:"kesantrian_score"`
	FinalScore       float64           `json:"final_score"`
	Predikat         string            `json:"predikat"`
	Weights          map[string]int    `json:"weights"`
	MapelDetails     []SubjectScore    `json:"mapel_details"`
	ProjectDetails   []ProjectDetail   `json:"project_details"`
	KesantrianDetail map[string]float64 `json:"kesantrian_detail"`
	Status           string            `json:"status"`
}

type SubjectScore struct {
	SubjectID   int     `json:"subject_id"`
	SubjectName string  `json:"subject_name"`
	Score       float64 `json:"score"`
	Weight      float64 `json:"weight"`
}

type ProjectDetail struct {
	SubProjectID int     `json:"sub_project_id"`
	SubProject   string  `json:"sub_project"`
	Score        float64 `json:"score"`
	Weight       float64 `json:"weight"`
	Contribution float64 `json:"contribution"`
}

type StoredRaport struct {
	ID               int     `json:"id"`
	StudentID        int     `json:"student_id"`
	StudentName      string  `json:"student_name"`
	Semester         string  `json:"semester"`
	AcademicYear     string  `json:"academic_year"`
	MapelScore       float64 `json:"mapel_score"`
	ProjectScore     float64 `json:"project_score"`
	KesantrianScore  float64 `json:"kesantrian_score"`
	FinalScore       float64 `json:"final_score"`
	Predikat         string  `json:"predikat"`
	Status           string  `json:"status"`
	Notes            string  `json:"notes"`
	GeneratedBy      int     `json:"generated_by"`
	UpdatedAt        string  `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Compute builds the full E-Raport for a student in a semester.
func (r *Repository) Compute(ctx context.Context, studentID int, semester, academicYear string, weights map[string]int) (*ComputedRaport, error) {
	// Default weights: Mapel 50, Project 25, Kesantrian 25
	if len(weights) == 0 {
		weights = map[string]int{"mapel": 50, "project": 25, "kesantrian": 25}
	}

	var studentName string
	err := r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = ?", studentID).Scan(&studentName)
	if err != nil {
		return nil, fmt.Errorf("santri tidak ditemukan: %w", err)
	}

	raport := &ComputedRaport{
		StudentID:   studentID,
		StudentName: studentName,
		Semester:    semester,
		AcademicYear: academicYear,
		Weights:     weights,
		KesantrianDetail: map[string]float64{},
	}

	// 1. Mapel score from grades weighted by subject.weight
	raport.MapelScore, raport.MapelDetails = r.computeMapel(ctx, studentID, semester, academicYear)

	// 2. Project score from subprojects (each subproject score = weighted avg of its activities)
	raport.ProjectScore, raport.ProjectDetails = r.computeProject(ctx, studentID, semester, academicYear)

	// 3. Kesantrian score from kesantrian_aspek (4 aspects)
	raport.KesantrianScore, err = r.computeKesantrian(ctx, studentID, semester, academicYear, raport.KesantrianDetail)
	if err != nil {
		return nil, err
	}

	// 4. Final = Mapel*X + Project*Y + Kesantrian*Z, X+Y+Z=100
	w := map[string]float64{
		"mapel":       float64(weights["mapel"]),
		"project":     float64(weights["project"]),
		"kesantrian":  float64(weights["kesantrian"]),
	}
	final, err := weight.CalculateERaport(raport.MapelScore, raport.ProjectScore, raport.KesantrianScore, w)
	if err != nil {
		return nil, err
	}
	raport.FinalScore = final
	raport.Predikat = weight.Predikat100(final) // C11: skala 0-100, bukan 1-4
	raport.Status = "ready"

	return raport, nil
}

func (r *Repository) computeMapel(ctx context.Context, studentID int, semester, academicYear string) (float64, []SubjectScore) {
	query := `
		SELECT g.subject_id, s.name, g.final_score, s.weight
		FROM grades g
		JOIN subjects s ON s.id = g.subject_id
		WHERE g.student_id = ? AND g.semester = ? AND g.academic_year = ?
		  AND s.is_active = 1
		ORDER BY s.sort_order ASC, s.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, studentID, semester, academicYear)
	if err != nil {
		return 0, nil
	}
	defer rows.Close()

	var details []SubjectScore
	totalWeighted := 0.0
	totalWeight := 0.0
	for rows.Next() {
		var d SubjectScore
		if err := rows.Scan(&d.SubjectID, &d.SubjectName, &d.Score, &d.Weight); err != nil {
			continue
		}
		// Gracefully handle weight 0 or NULL
		if d.Weight <= 0 {
			d.Weight = 100
		}
		totalWeighted += d.Score * d.Weight
		totalWeight += d.Weight
		details = append(details, d)
	}
	if totalWeight == 0 {
		return 0, details
	}
	score := totalWeighted / totalWeight
	// Normalize to 4-scale? Mapel grades are typically 0-100. E-Raport predikat expects 1-4.
	// We keep 0-100 for mapel and let Predikat handle both; but CalculateERaport forces <=100 and mixes scales.
	// For a proper E-Raport, convert to 0-100 scale consistently. Predikat on 100-scale:
	// We'll store the 100-scale score; final becomes 0-100 scale.
	return math.Round(score*100) / 100, details
}

func (r *Repository) computeProject(ctx context.Context, studentID int, semester, academicYear string) (float64, []ProjectDetail) {
	// Get all subprojects with weights
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, weight FROM project_subprojects WHERE is_active = 1 ORDER BY order_index ASC`)
	if err != nil {
		return 0, nil
	}
	type spInfo struct {
		id     int
		name   string
		weight float64
	}
	var subProjs []spInfo
	for rows.Next() {
		var sp spInfo
		rows.Scan(&sp.id, &sp.name, &sp.weight)
		subProjs = append(subProjs, sp)
	}
	rows.Close()

	if len(subProjs) == 0 {
		return 0, nil
	}

	// For each subproject, compute score = weighted average of activities.
	// Activities with indicators are scored 1-4. Since we do not yet have assessment/evidence inputs,
	// we compute a deterministic default: each activity defaults to 3 (Baik) unless scored.
	// TODO Phase 9-10: replace with actual assessments from project_assessments.
	totalWeighted := 0.0
	totalWeight := 0.0
	details := []ProjectDetail{}
	for _, sp := range subProjs {
		score := 3.0 // default Baik until assessments exist
		detail := ProjectDetail{
			SubProjectID: sp.id,
			SubProject:   sp.name,
			Score:        score,
			Weight:       sp.weight,
			Contribution: 0,
		}
		// Sum normalized contributions
		totalWeighted += score * sp.weight
		totalWeight += sp.weight
		details = append(details, detail)
	}
	if totalWeight == 0 {
		return 0, details
	}
	baseScore := totalWeighted / totalWeight
	// Convert from 1-4 scale to 0-100 scale for consistent final calculation
	// 1-4 -> 100-scale: (score / 4) * 100
	score100 := (baseScore / 4.0) * 100.0
	for i := range details {
		details[i].Contribution = math.Round((details[i].Score/4.0*100.0)*details[i].Weight/100.0*100) / 100
	}
	return math.Round(score100*100) / 100, details
}

func (r *Repository) computeKesantrian(ctx context.Context, studentID int, semester, academicYear string, detail map[string]float64) (float64, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT aspek, score FROM kesantrian_aspek WHERE student_id = ? AND semester = ? AND academic_year = ?`,
		studentID, semester, academicYear)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	scores := map[string]float64{}
	for rows.Next() {
		var aspek string
		var score float64
		if err := rows.Scan(&aspek, &score); err != nil {
			continue
		}
		scores[strings.ToLower(aspek)] = score
		detail[aspek] = score
	}
	if len(scores) == 0 {
		// Default neutral: all aspects 3 (Baik) on 1-4 scale
		scores = map[string]float64{"disiplin": 3, "ibadah": 3, "kemandirian": 3, "adab": 3}
		for k, v := range scores {
			detail[strings.Title(k)] = v
		}
	}
	score14, err := weight.CalculateKesantrianScore(scores)
	if err != nil {
		return 0, err
	}
	// Convert to 100-scale
	return math.Round((score14/4.0)*10000) / 100, nil
}

var ErrRaportLocked = errors.New("rapor terkunci, gunakan unlock eksplisit")

func (r *Repository) Upsert(ctx context.Context, s *StoredRaport) error {
	now := time.Now().UTC()
	// A4: lock dienforce — tolak overwrite rapor locked.
	var cur string
	if err := r.db.QueryRowContext(ctx, `SELECT COALESCE(status,'') FROM raports WHERE student_id = ? AND semester = ? AND academic_year = ?`,
		s.StudentID, s.Semester, s.AcademicYear).Scan(&cur); err == nil && cur == "locked" {
		return ErrRaportLocked
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO raports (student_id, semester, academic_year, mapel_score, project_score, kesantrian_score, final_score, predikat, status, notes, generated_by, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(student_id, semester, academic_year) DO UPDATE SET
			mapel_score = excluded.mapel_score,
			project_score = excluded.project_score,
			kesantrian_score = excluded.kesantrian_score,
			final_score = excluded.final_score,
			predikat = excluded.predikat,
			status = excluded.status,
			notes = excluded.notes,
			generated_by = excluded.generated_by,
			updated_at = excluded.updated_at
	`, s.StudentID, s.Semester, s.AcademicYear, s.MapelScore, s.ProjectScore, s.KesantrianScore, s.FinalScore, s.Predikat, s.Status, s.Notes, s.GeneratedBy, now)
	return err
}

// Unlock membuka rapor locked (permission di handler, audit wajib).
func (r *Repository) Unlock(ctx context.Context, studentID int, semester, academicYear string) error {
	res, err := r.db.ExecContext(ctx, `UPDATE raports SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND semester = ? AND academic_year = ? AND status = 'locked'`,
		studentID, semester, academicYear)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) GetStored(ctx context.Context, studentID int, semester, academicYear string) (*StoredRaport, error) {
	var s StoredRaport
	err := r.db.QueryRowContext(ctx, `
		SELECT id, student_id, semester, academic_year, mapel_score, project_score, kesantrian_score, final_score, predikat, status, notes, updated_at
		FROM raports WHERE student_id = ? AND semester = ? AND academic_year = ?
	`, studentID, semester, academicYear).Scan(&s.ID, &s.StudentID, &s.Semester, &s.AcademicYear, &s.MapelScore, &s.ProjectScore, &s.KesantrianScore, &s.FinalScore, &s.Predikat, &s.Status, &s.Notes, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = ?", studentID).Scan(&s.StudentName); err != nil {
		s.StudentName = ""
	}
	return &s, nil
}

func (r *Repository) ListByAcademicYear(ctx context.Context, academicYear, semester string) ([]StoredRaport, error) {
	query := `
		SELECT r.id, r.student_id, u.name, r.semester, r.academic_year, r.mapel_score, r.project_score, r.kesantrian_score, r.final_score, r.predikat, r.status, r.notes, r.updated_at
		FROM raports r JOIN users u ON u.id = r.student_id
		WHERE r.academic_year = ? AND r.semester = ?
		ORDER BY u.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, academicYear, semester)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []StoredRaport
	for rows.Next() {
		var s StoredRaport
		if err := rows.Scan(&s.ID, &s.StudentID, &s.StudentName, &s.Semester, &s.AcademicYear, &s.MapelScore, &s.ProjectScore, &s.KesantrianScore, &s.FinalScore, &s.Predikat, &s.Status, &s.Notes, &s.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}
