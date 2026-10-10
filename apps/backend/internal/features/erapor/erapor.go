// Package erapor mendukung sinkronisasi E-Rapor menuju RDM/EMIS Kemenag
// (Jilid 84-86). RDM tidak menyediakan API tulis publik, jadi "sinkron"
// berbentuk: memastikan data pokok lengkap -> export file (data pokok & nilai
// per semester) -> mencatat log export/import di tabel erapor_sync -> admin
// memantau statusnya di /admin/erapor.
//
// Data pokok santri (NISN, NIK, nama, JK, TTL, rombel) adalah prasyarat EMIS.
package erapor

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/validators"

	"github.com/go-chi/chi/v5"
)

// KelengkapanRow adalah satu santri + status kelengkapan data pokok EMIS.
// EmisReady = semua kolom inti (nisn, nama, jk, ttl, rombel) terisi.
type KelengkapanRow struct {
	ID         int      `json:"id"`
	NIS        string   `json:"nis"`
	NISN       string   `json:"nisn"`
	NIK        string   `json:"nik"`
	Name       string   `json:"name"`
	Gender     string   `json:"gender"`
	BirthPlace string   `json:"birth_place"`
	BirthDate  string   `json:"birth_date"`
	Class      string   `json:"class"`
	Jenjang    string   `json:"jenjang"`
	Angkatan   string   `json:"angkatan"`
	Status     string   `json:"status"`
	Category   string   `json:"category"`
	HasNISN    bool     `json:"has_nisn"`
	HasNIK     bool     `json:"has_nik"`
	HasBirth   bool     `json:"has_birth"`
	HasClass   bool     `json:"has_class"`
	EmisReady  bool     `json:"emis_ready"`
	Missing    []string `json:"missing"`
}

// PokokRow adalah satu baris data pokok untuk export RDM/EMIS.
type PokokRow struct {
	ID         int    `json:"id"`
	NIS        string `json:"nis"`
	NISN       string `json:"nisn"`
	NIK        string `json:"nik"`
	Name       string `json:"name"`
	Gender     string `json:"gender"`
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Class      string `json:"class"`
	Jenjang    string `json:"jenjang"`
	Angkatan   string `json:"angkatan"`
	Status     string `json:"status"`
	Category   string `json:"category"`
	FatherName string `json:"father_name"`
	MotherName string `json:"mother_name"`
}

// NilaiRow adalah satu baris nilai E-Rapor per semester untuk format RDM.
// raports.student_id menunjuk users.id (sama dengan tabel raport lain);
// data identitas diambil dari santri lewat s.user_id, bila tersedia.
type NilaiRow struct {
	ID           int     `json:"id"`
	StudentID    int     `json:"student_id"`
	NIS          string  `json:"nis"`
	NISN         string  `json:"nisn"`
	Name         string  `json:"name"`
	Class        string  `json:"class"`
	Jenjang      string  `json:"jenjang"`
	Status       string  `json:"status"`
	Semester     string  `json:"semester"`
	AcademicYear string  `json:"academic_year"`
	MapelScore   float64 `json:"mapel_score"`
	ProjectScore float64 `json:"project_score"`
	Kesantrian   float64 `json:"kesantrian_score"`
	FinalScore   float64 `json:"final_score"`
	Predikat     string  `json:"predikat"`
	RaportStatus string  `json:"raport_status"`
}

// SyncRow adalah satu baris log sinkron (erapor_sync).
type SyncRow struct {
	ID           int    `json:"id"`
	StudentID    int    `json:"student_id"`
	Name         string `json:"name"`
	NIS          string `json:"nis"`
	NISN         string `json:"nisn"`
	Class        string `json:"class"`
	SyncType     string `json:"sync_type"`
	Status       string `json:"status"`
	Semester     string `json:"semester"`
	AcademicYear string `json:"academic_year"`
	Error        string `json:"error"`
	ExportedAt   string `json:"exported_at"`
	ImportedAt   string `json:"imported_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/kelengkapan", h.GetKelengkapan) // monitoring identitas data pokok
	r.Get("/pokok", h.GetPokok)             // export data pokok (RDM/EMIS)
	r.Get("/nilai", h.GetNilai)             // export nilai per semester (RDM)
	r.Post("/export", h.Export)             // catat log sinkron ke erapor_sync
	r.Get("/sync-status", h.GetSyncStatus)  // monitoring log sinkron
	return r
}

func writeJSON(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": status < 400, "message": message, "data": data})
}

// ── Repository ──────────────────────────────────────────

// ListKelengkapan mengembalikan semua santri + status kelengkapan data pokok.
// Filter class/jenjang dan pencarian nama/nis/nisn opsional.
func (r *Repository) ListKelengkapan(ctx context.Context, className, search string) ([]KelengkapanRow, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	if className != "" {
		where = append(where, "s.class = ?")
		args = append(args, className)
	}
	if search != "" {
		where = append(where, "(s.name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ?)")
		like := "%" + search + "%"
		args = append(args, like, like, like)
	}
	query := fmt.Sprintf(`SELECT s.id,
		COALESCE(s.nis,''), COALESCE(s.nisn,''), COALESCE(s.nik,''), COALESCE(s.name,''),
		COALESCE(s.gender,''), COALESCE(s.birth_place,''), COALESCE(s.birth_date,''),
		COALESCE(s.class,''), COALESCE(s.jenjang,''), COALESCE(s.angkatan,''),
		COALESCE(s.status,''), COALESCE(s.category,'')
		FROM santri s WHERE %s ORDER BY s.class, s.name`, strings.Join(where, " AND "))
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]KelengkapanRow, 0, 64)
	for rows.Next() {
		var k KelengkapanRow
		if err := rows.Scan(&k.ID, &k.NIS, &k.NISN, &k.NIK, &k.Name, &k.Gender, &k.BirthPlace, &k.BirthDate, &k.Class, &k.Jenjang, &k.Angkatan, &k.Status, &k.Category); err != nil {
			return nil, err
		}
		k.HasNISN = strings.TrimSpace(k.NISN) != ""
		k.HasNIK = strings.TrimSpace(k.NIK) != ""
		k.HasBirth = strings.TrimSpace(k.BirthPlace) != "" && strings.TrimSpace(k.BirthDate) != ""
		k.HasClass = strings.TrimSpace(k.Class) != ""
		k.EmisReady = k.HasNISN && strings.TrimSpace(k.Name) != "" && strings.TrimSpace(k.Gender) != "" && k.HasBirth && k.HasClass
		k.Missing = missingFields(k)
		list = append(list, k)
	}
	return list, rows.Err()
}

func missingFields(k KelengkapanRow) []string {
	m := []string{}
	if !k.HasNISN {
		m = append(m, "NISN")
	}
	if !k.HasNIK {
		m = append(m, "NIK")
	}
	if strings.TrimSpace(k.Name) == "" {
		m = append(m, "Nama")
	}
	if strings.TrimSpace(k.Gender) == "" {
		m = append(m, "Jenis kelamin")
	}
	if !k.HasBirth {
		m = append(m, "Tempat/ttl lahir")
	}
	if !k.HasClass {
		m = append(m, "Rombel")
	}
	if strings.TrimSpace(k.Angkatan) == "" {
		m = append(m, "Angkatan")
	}
	return m
}

// ListPokok mengembalikan data pokok semua santri untuk export.
func (r *Repository) ListPokok(ctx context.Context, className string) ([]PokokRow, error) {
	query := `SELECT s.id,
		COALESCE(s.nis,''), COALESCE(s.nisn,''), COALESCE(s.nik,''), COALESCE(s.name,''),
		COALESCE(s.gender,''), COALESCE(s.birth_place,''), COALESCE(s.birth_date,''),
		COALESCE(s.class,''), COALESCE(s.jenjang,''), COALESCE(s.angkatan,''),
		COALESCE(s.status,''), COALESCE(s.category,''),
		COALESCE(s.father_name,''), COALESCE(s.mother_name,'')
		FROM santri s WHERE 1=1`
	args := []interface{}{}
	if className != "" {
		query += " AND s.class = ?"
		args = append(args, className)
	}
	query += " ORDER BY s.class, s.name"
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]PokokRow, 0, 64)
	for rows.Next() {
		var p PokokRow
		if err := rows.Scan(&p.ID, &p.NIS, &p.NISN, &p.NIK, &p.Name, &p.Gender, &p.BirthPlace, &p.BirthDate, &p.Class, &p.Jenjang, &p.Angkatan, &p.Status, &p.Category, &p.FatherName, &p.MotherName); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

// ListNilai mengembalikan nilai E-Rapor per semester (format RDM).
func (r *Repository) ListNilai(ctx context.Context, semester, ay string) ([]NilaiRow, error) {
	query := `SELECT r.id, r.student_id, COALESCE(u.name,''), COALESCE(s.nis,''), COALESCE(s.nisn,''),
		COALESCE(s.class,''), COALESCE(s.jenjang,''), COALESCE(s.status,''),
		r.semester, r.academic_year, r.mapel_score, r.project_score, r.kesantrian_score, r.final_score, r.predikat, r.status
		FROM raports r
		JOIN users u ON u.id = r.student_id
		LEFT JOIN santri s ON s.user_id = u.id
		WHERE r.academic_year = ? AND r.semester = ?
		ORDER BY s.class, u.name`
	rows, err := r.db.QueryContext(ctx, query, ay, semester)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]NilaiRow, 0, 64)
	for rows.Next() {
		var n NilaiRow
		if err := rows.Scan(&n.ID, &n.StudentID, &n.Name, &n.NIS, &n.NISN, &n.Class, &n.Jenjang, &n.Status, &n.Semester, &n.AcademicYear, &n.MapelScore, &n.ProjectScore, &n.Kesantrian, &n.FinalScore, &n.Predikat, &n.RaportStatus); err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, rows.Err()
}

// ActiveAcademicYear mengembalikan tahun ajaran aktif dari tabel
// academic_years; fallback ke tahun ajaran berjalan (Juli-Juni).
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

// RecordExport mencatat satu baris log sinkron per santri/raport. Idempoten:
// baris lama untuk (sync_type, semester, ay) dibersihkan dulu lalu diisi
// ulang.
//
// syncType "pokok": semua santri (student_id = users.id bila ada akun, else 0).
// syncType "nilai": hanya santri yang punya raport tersimpan di semester itu.
func (r *Repository) RecordExport(ctx context.Context, syncType, semester, ay string) (int, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM erapor_sync WHERE sync_type = ? AND semester = ? AND academic_year = ?`, syncType, semester, ay); err != nil {
		return 0, err
	}

	var rows *sql.Rows
	if syncType == "nilai" {
		rows, err = tx.QueryContext(ctx, `SELECT r.student_id, COALESCE(s.nisn,'') FROM raports r LEFT JOIN users u ON u.id=r.student_id LEFT JOIN santri s ON s.user_id=u.id WHERE r.academic_year=? AND r.semester=?`, ay, semester)
	} else {
		rows, err = tx.QueryContext(ctx, `SELECT COALESCE(s.user_id,0), COALESCE(s.nisn,'') FROM santri s ORDER BY s.class, s.name`)
	}
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var sid int
		var nisn string
		if err := rows.Scan(&sid, &nisn); err != nil {
			return 0, err
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO erapor_sync (student_id, sync_type, status, semester, academic_year, nisn) VALUES (?, ?, 'exported', ?, ?, ?)`, sid, syncType, semester, ay, nisn); err != nil {
			return 0, err
		}
		count++
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	return count, tx.Commit()
}

// ListSyncStatus mengembalikan log sinkron E-Rapor.
func (r *Repository) ListSyncStatus(ctx context.Context, syncType, semester, ay string) ([]SyncRow, error) {
	where := []string{"e.academic_year = ?", "e.semester = ?"}
	args := []interface{}{ay, semester}
	if syncType != "" {
		where = append(where, "e.sync_type = ?")
		args = append(args, syncType)
	}
	query := fmt.Sprintf(`SELECT e.id, e.student_id, COALESCE(u.name,''), COALESCE(s.nis,''), COALESCE(e.nisn,''), COALESCE(s.class,''),
		e.sync_type, e.status, e.semester, e.academic_year, COALESCE(e.error,''),
		COALESCE(e.exported_at,''), COALESCE(e.imported_at,'')
		FROM erapor_sync e
		LEFT JOIN users u ON u.id = e.student_id
		LEFT JOIN santri s ON s.user_id = e.student_id
		WHERE %s ORDER BY e.sync_type, s.class, u.name`, strings.Join(where, " AND "))
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]SyncRow, 0, 64)
	for rows.Next() {
		var s SyncRow
		if err := rows.Scan(&s.ID, &s.StudentID, &s.Name, &s.NIS, &s.NISN, &s.Class, &s.SyncType, &s.Status, &s.Semester, &s.AcademicYear, &s.Error, &s.ExportedAt, &s.ImportedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

// ── Handler ─────────────────────────────────────────────

func (h *Handler) GetKelengkapan(w http.ResponseWriter, r *http.Request) {
	className := strings.TrimSpace(r.URL.Query().Get("class"))
	search := strings.TrimSpace(r.URL.Query().Get("q"))
	list, err := h.repo.ListKelengkapan(r.Context(), className, search)
	if err != nil {
		logger.Error(r.Context(), "erapor kelengkapan", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, "Gagal memuat kelengkapan data pokok", nil)
		return
	}
	if list == nil {
		list = []KelengkapanRow{}
	}
	writeJSON(w, http.StatusOK, "Kelengkapan data pokok E-Rapor", list)
}

func (h *Handler) GetPokok(w http.ResponseWriter, r *http.Request) {
	className := strings.TrimSpace(r.URL.Query().Get("class"))
	list, err := h.repo.ListPokok(r.Context(), className)
	if err != nil {
		logger.Error(r.Context(), "erapor pokok", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, "Gagal mengekspor data pokok", nil)
		return
	}
	if list == nil {
		list = []PokokRow{}
	}
	writeJSON(w, http.StatusOK, "Data pokok siswa (RDM/EMIS)", list)
}

func (h *Handler) GetNilai(w http.ResponseWriter, r *http.Request) {
	semester := validators.NormalizeSemester(r.URL.Query().Get("semester"))
	ay := strings.TrimSpace(r.URL.Query().Get("academic_year"))
	if ay == "" {
		ay = h.repo.ActiveAcademicYear(r.Context())
	}
	if semester == "" {
		writeJSON(w, http.StatusBadRequest, "semester wajib (1 atau 2)", nil)
		return
	}
	list, err := h.repo.ListNilai(r.Context(), semester, ay)
	if err != nil {
		logger.Error(r.Context(), "erapor nilai", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, "Gagal mengekspor nilai", nil)
		return
	}
	if list == nil {
		list = []NilaiRow{}
	}
	writeJSON(w, http.StatusOK, "Nilai E-Rapor (format RDM)", list)
}

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	syncType := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("type")))
	if syncType != "pokok" && syncType != "nilai" {
		writeJSON(w, http.StatusBadRequest, "type wajib 'pokok' atau 'nilai'", nil)
		return
	}
	semester := validators.NormalizeSemester(r.URL.Query().Get("semester"))
	ay := strings.TrimSpace(r.URL.Query().Get("academic_year"))
	if ay == "" {
		ay = h.repo.ActiveAcademicYear(r.Context())
	}
	if syncType == "nilai" && semester == "" {
		writeJSON(w, http.StatusBadRequest, "semester wajib untuk export nilai", nil)
		return
	}
	ctx := r.Context()
	count, err := h.repo.RecordExport(ctx, syncType, semester, ay)
	if err != nil {
		logger.Error(ctx, "erapor export", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, "Gagal mencatat sinkron: "+err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, fmt.Sprintf("Export %s tercatat (%d siswa)", syncType, count), map[string]interface{}{
		"type": syncType, "semester": semester, "academic_year": ay, "count": count,
	})
}

func (h *Handler) GetSyncStatus(w http.ResponseWriter, r *http.Request) {
	semester := validators.NormalizeSemester(r.URL.Query().Get("semester"))
	ay := strings.TrimSpace(r.URL.Query().Get("academic_year"))
	if ay == "" {
		ay = h.repo.ActiveAcademicYear(r.Context())
	}
	syncType := strings.TrimSpace(r.URL.Query().Get("type"))
	list, err := h.repo.ListSyncStatus(r.Context(), syncType, semester, ay)
	if err != nil {
		logger.Error(r.Context(), "erapor sync-status", logger.Field{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, "Gagal memuat status sinkron", nil)
		return
	}
	if list == nil {
		list = []SyncRow{}
	}
	writeJSON(w, http.StatusOK, "Status sinkron E-Rapor", list)
}