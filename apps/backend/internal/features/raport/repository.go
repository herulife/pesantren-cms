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
	IsComplete       bool              `json:"is_complete"`
	Missing          []string          `json:"missing,omitempty"`
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
// ActiveAcademicYear mengembalikan nama tahun ajaran aktif dari tabel
// academic_years; fallback ke tahun ajaran yang berjalan (Juli-Juni).
func (r *Repository) ActiveAcademicYear(ctx context.Context) string {
	var name string
	if err := r.db.QueryRowContext(ctx, `SELECT name FROM academic_years WHERE is_active=1 ORDER BY id DESC LIMIT 1`).Scan(&name); err == nil && strings.TrimSpace(name) != "" {
		return strings.TrimSpace(name)
	}
	now := time.Now()
	y := now.Year()
	if now.Month() < 7 {
		y--
	}
	return fmt.Sprintf("%d/%d", y, y+1)
}

func (r *Repository) Compute(ctx context.Context, studentID int, semester, academicYear string) (*ComputedRaport, error) {
	var studentName string
	err := r.db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = ?", studentID).Scan(&studentName)
	if err != nil {
		return nil, fmt.Errorf("santri tidak ditemukan: %w", err)
	}

	raport := &ComputedRaport{
		StudentID:        studentID,
		StudentName:      studentName,
		Semester:         semester,
		AcademicYear:     academicYear,
		KesantrianDetail: map[string]float64{},
	}

	// 1. Nilai mapel = rata-rata biasa semua mapel (tanpa bobot).
	var mapelOK bool
	raport.MapelScore, raport.MapelDetails, mapelOK = r.computeMapel(ctx, studentID, semester, academicYear)

	// 2. Nilai project = rata-rata biasa dari penilaian kegiatan.
	var projectOK bool
	raport.ProjectScore, raport.ProjectDetails, projectOK = r.computeProject(ctx, studentID, semester, academicYear)

	// 3. Nilai kesantrian = rata-rata aspek yang sudah dinilai.
	var kesOK bool
	raport.KesantrianScore, kesOK = r.computeKesantrian(ctx, studentID, semester, academicYear, raport.KesantrianDetail)

	// 4. Nilai akhir = rata-rata biasa ketiga komponen, HANYA bila ketiganya
	// sudah ada datanya. Komponen yang belum dinilai = kosong, bukan angka.
	if !mapelOK {
		raport.Missing = append(raport.Missing, "Nilai mapel")
	}
	if !projectOK {
		raport.Missing = append(raport.Missing, "Nilai project")
	}
	if !kesOK {
		raport.Missing = append(raport.Missing, "Nilai kesantrian")
	}
	if len(raport.Missing) > 0 {
		raport.IsComplete = false
		raport.Status = "incomplete"
		return raport, nil
	}
	raport.IsComplete = true
	raport.FinalScore = math.Round((raport.MapelScore+raport.ProjectScore+raport.KesantrianScore)/3*100) / 100
	raport.Predikat = weight.PredikatKKM(raport.FinalScore)
	raport.Status = "ready"

	return raport, nil
}

func (r *Repository) computeMapel(ctx context.Context, studentID int, semester, academicYear string) (float64, []SubjectScore, bool) {
	query := `
		SELECT g.subject_id, s.name, g.final_score
		FROM grades g
		JOIN subjects s ON s.id = g.subject_id
		WHERE g.student_id = ? AND g.semester = ? AND g.academic_year = ?
		  AND s.is_active = 1
		ORDER BY s.sort_order ASC, s.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query, studentID, semester, academicYear)
	if err != nil {
		return 0, nil, false
	}
	defer rows.Close()

	var details []SubjectScore
	total := 0.0
	for rows.Next() {
		var d SubjectScore
		if err := rows.Scan(&d.SubjectID, &d.SubjectName, &d.Score); err != nil {
			continue
		}
		total += d.Score
		details = append(details, d)
	}
	if len(details) == 0 {
		return 0, details, false
	}
	return math.Round(total/float64(len(details))*100) / 100, details, true
}

func (r *Repository) computeProject(ctx context.Context, studentID int, semester, academicYear string) (float64, []ProjectDetail, bool) {
	// Nilai project = rata-rata biasa kegiatan yang SUDAH dinilai (skala 1-4).
	// Kegiatan yang belum dinilai tidak ikut rata-rata dan membuat komponen
	// project belum lengkap (kosong, bukan angka default).
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.sub_project_id, sp.name, a.id, a.name, pa.score
		FROM project_activities a
		JOIN project_subprojects sp ON sp.id = a.sub_project_id AND sp.is_active = 1
		LEFT JOIN project_assessments pa ON pa.activity_id = a.id
			AND pa.student_id = ? AND pa.semester = ? AND pa.academic_year = ?
		WHERE a.is_active = 1
		ORDER BY sp.order_index ASC, sp.id ASC, a.order_index ASC, a.id ASC
	`, studentID, semester, academicYear)
	if err != nil {
		return 0, nil, false
	}
	defer rows.Close()

	type subAgg struct {
		id    int
		name  string
		total float64
		n     int
	}
	order := []int{}
	agg := map[int]*subAgg{}
	type actRow struct {
		subID   int
		name    string
		scored  bool
		score14 float64
	}
	var acts []actRow
	for rows.Next() {
		var subID, actID int
		var subName, actName string
		var sc sql.NullFloat64
		if err := rows.Scan(&subID, &subName, &actID, &actName, &sc); err != nil {
			continue
		}
		_ = actID
		_ = actName
		a := actRow{subID: subID, scored: sc.Valid}
		if sc.Valid {
			a.score14 = sc.Float64
		}
		acts = append(acts, a)
		if _, ok := agg[subID]; !ok {
			agg[subID] = &subAgg{id: subID, name: subName}
			order = append(order, subID)
		}
		if sc.Valid {
			agg[subID].total += sc.Float64
			agg[subID].n++
		}
	}
	if len(acts) == 0 {
		return 0, nil, false
	}

	details := []ProjectDetail{}
	subTotal := 0.0
	subCount := 0
	scoredAny := false
	for _, sid := range order {
		sa := agg[sid]
		d := ProjectDetail{SubProjectID: sa.id, SubProject: sa.name}
		if sa.n > 0 {
			avg14 := sa.total / float64(sa.n)
			d.Score = math.Round(avg14/4.0*10000) / 100
			subTotal += d.Score
			subCount++
			scoredAny = true
		}
		details = append(details, d)
	}
	if !scoredAny {
		return 0, details, false
	}
	return math.Round(subTotal/float64(subCount)*100) / 100, details, true
}

func (r *Repository) computeKesantrian(ctx context.Context, studentID int, semester, academicYear string, detail map[string]float64) (float64, bool) {
	rows, err := r.db.QueryContext(ctx, `SELECT aspek, score FROM kesantrian_aspek WHERE student_id = ? AND semester = ? AND academic_year = ?`,
		studentID, semester, academicYear)
	if err != nil {
		return 0, false
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
		return 0, false
	}
	score14, err := weight.CalculateKesantrianScore(scores)
	if err != nil {
		return 0, false
	}
	// Convert to 100-scale
	return math.Round((score14/4.0)*10000) / 100, true
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
