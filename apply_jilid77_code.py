#!/usr/bin/env python3
"""
apply_jilid77_code.py
Perbaikan presensi: dropdown & data presensi memakai Santri.id, bukan akun wali.

Konteks
--------
Sejak Jilid 76 satu akun portal (wali) dapat memiliki beberapa Santri, tetapi
tabel `attendance` menyimpan student_id = users.id. Akibatnya dua saudara memakai
ID yang sama dan satu orang bisa menimpa presensi saudaranya.

Perubahan
---------
* db.go            : FK attendance.student_id -> Santri(id), index jadi UNIQUE.
* academics        : GetAttendance/GetAttendanceSummary membaca Santri,
                     validateAttendance menolak ID yang bukan Santri,
                     endpoint baru /academics/attendance/students.
* features/attendance (QR) : token akun dipetakan ke Santri, notifikasi ke wali.
* auth             : cascade hapus akun ikut membersihkan presensi Santri-nya.
* frontend         : form presensi memakai daftar Santri (bukan daftar akun).

Modul nilai/tahfidz/arbain sengaja TIDAK disentuh: mereka masih memakai
users.id dan datanya kosong, jadi tidak perlu risiko sekarang.

Catatan penting
---------------
* Script ini **sekali jalan**, bukan idempoten. Sebagian besar patch() memakai
  pola `old in src -> replace`, sehingga dijalankan dua kali bisa menyisipkan
  baris ganda (mis. route atau key map literal duplikat) dan Go gagal compile.
  Selalu pakai `--dry-run` dulu, dan jangan menjalankan ulang pada repo yang
  sudah dipatch.
* Pengecualian: `patch_purge_attendance()` (fix Jilid 77a) sengaja dibuat
  idempoten dan aman dijalankan berkali-kali.
* Dua perbaikan yang dikerjakan manual TIDAK tercakup di sini dan akan tampil
  sebagai [GAGAL] pada --dry-run (artinya sudah terpasang, bukan error):
    - QR: presensi dicatat per Santri milik akun
    - notifikasi WA memakai nomor wali dari Santri
  Sumber kebenaran tetap file Go, bukan script ini.

Cara pakai: python3 apply_jilid77_code.py [--dry-run]
"""

import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

PATCHES = []


def patch(rel, old, new, note=""):
    PATCHES.append((rel, old, new, note))


# ---------------------------------------------------------------- db.go
patch(
    "apps/backend/internal/platform/database/db.go",
    """	CREATE TABLE IF NOT EXISTS attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'hadir',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES users(id)
	);""",
    """	CREATE TABLE IF NOT EXISTS attendance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		student_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'hadir',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (student_id) REFERENCES Santri(id)
	);""",
    "FK attendance.student_id -> Santri(id)",
)

patch(
    "apps/backend/internal/platform/database/db.go",
    """			sql:  `CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date DESC);`,""",
    """			sql:  `CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date DESC);`,""",
    "satu Santri hanya boleh satu baris per tanggal",
)

# ---------------------------------------------- academics/repository.go
patch(
    "apps/backend/internal/features/academics/repository.go",
    """	query := `
		SELECT a.id, a.student_id, COALESCE(s.name,u.name) as student_name, COALESCE(u.whatsapp, '') as student_phone, a.date, a.status, a.notes
		FROM attendance a
		JOIN users u ON a.student_id = u.id
		LEFT JOIN santri s ON s.user_id = a.student_id
		WHERE a.date = ?
		ORDER BY COALESCE(s.name,u.name) ASC
	`""",
    """	query := `
		SELECT a.id, a.student_id, s.name as student_name,
		       COALESCE(NULLIF(s.parent_phone, ''), NULLIF(s.father_phone, ''), NULLIF(s.mother_phone, ''), '') as student_phone,
		       a.date, a.status, a.notes
		FROM attendance a
		JOIN Santri s ON s.id = a.student_id
		WHERE a.date = ?
		ORDER BY s.name ASC
	`""".replace("Santri", "santri"),
    "laporan presensi membaca nama + nomor wali dari Santri",
)

patch(
    "apps/backend/internal/features/academics/repository.go",
    """func (r *Repository) GetAttendanceSummary(studentID int) (map[string]int, error) {
	query := `SELECT status, COUNT(*) FROM attendance WHERE student_id = ? GROUP BY status`
	rows, err := r.db.Query(query, studentID)""",
    """// GetAttendanceSummary menjumlahkan presensi seorang Santri. Parametriknya
// adalah akun portal (users.id) supaya pemanggil lama - raport dan ringkasan
// wali - tetap bekerja; semua Santri milik akun tersebut ikut dihitung.
func (r *Repository) GetAttendanceSummary(userID int) (map[string]int, error) {
	query := `
		SELECT status, COUNT(*) FROM attendance
		WHERE student_id IN (SELECT id FROM santri WHERE user_id = ?)
		GROUP BY status
	`
	rows, err := r.db.Query(query, userID)""",
    "ringkasan agregat per akun portal",
)

# ----------------------------------------------- academics/handler.go
patch(
    "apps/backend/internal/features/academics/handler.go",
    """	r.Get("/attendance/summary/{id}", h.GetAttendanceSummary)
	r.Get("/attendance/me/summary", h.GetMyAttendanceSummary)""",
    """	r.Get("/attendance/summary/{id}", h.GetAttendanceSummary)
	r.Get("/attendance/me/summary", h.GetMyAttendanceSummary)
	// Daftar Santri untuk form presensi (Santri.id, bukan akun portal).
	r.Get("/attendance/students", h.GetAttendanceStudents)""",
    "route /attendance/students",
)

patch(
    "apps/backend/internal/features/academics/handler.go",
    """func validateAttendance(a *Attendance) map[string][]string {
	errs := map[string][]string{}
	if a.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	}""",
    """func validateAttendance(a *Attendance) map[string][]string {
	errs := map[string][]string{}
	if a.StudentID <= 0 {
		errs["student_id"] = []string{"Santri wajib dipilih"}
	} else if !santriExists(a.StudentID) {
		// student_id sekarang menunjuk Santri.id; menolak akun wali agar
		// presensi tidak diam-diam salah orang.
		errs["student_id"] = []string{"Santri tidak ditemukan"}
	}""",
    "validasi student_id harus Santri asli",
)

patch(
    "apps/backend/internal/features/academics/handler.go",
    """// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	// Subjects""",
    """// santriExists dipakai validateAttendance. Cache tidak perlu: endpoint ini
// hanya dipanggil sekali per simpan.
func santriExists(id int) bool {
	var n int
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM santri WHERE id = ?`, id).Scan(&n); err != nil {
		return false
	}
	return n > 0
}

// GetAttendanceStudents mengembalikan daftar Santri untuk form presensi.
// Bedanya dengan GetStudents(): yang ini mengembalikan Santri.id sehingga dua
// saudara dari satu akun wali tetap dapat dibedakan.
func (h *Handler) GetAttendanceStudents(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())
	var (
		students []AttendanceStudent
		err      error
	)
	if role == "wali_kelas" {
		var sc *scope.Scope
		sc, err = scope.Resolve(database.DB, uid, role)
		if err == nil {
			students, err = h.repo.GetAttendanceStudents(sc.Classes)
		}
	} else {
		students, err = h.repo.GetAttendanceStudents(nil)
	}
	if err != nil {
		logger.Error(r.Context(), "Internal Server Error", logger.Field{"error": err.Error()})
		writeJSONResponse(w, http.StatusInternalServerError, false, "Gagal memproses permintaan (Internal Server Error)", nil)
		return
	}
	writeJSONResponse(w, http.StatusOK, true, "Data santri berhasil dimuat", students)
}

// Code generated by ifacemaker; DO NOT EDIT.

// IRepository ...
type IRepository interface {
	// Subjects""",
    "handler + helper GetAttendanceStudents",
)

patch(
    "apps/backend/internal/features/academics/handler.go",
    """	// Attendance
	GetAttendance(date string) ([]Attendance, error)
	CreateAttendance(a *Attendance) error
	UpdateAttendance(id int, a *Attendance) error
	DeleteAttendance(id int) error
	GetAttendanceSummary(studentID int) (map[string]int, error)""",
    """	// Attendance
	GetAttendance(date string) ([]Attendance, error)
	CreateAttendance(a *Attendance) error
	UpdateAttendance(id int, a *Attendance) error
	DeleteAttendance(id int) error
	GetAttendanceSummary(userID int) (map[string]int, error)
	GetAttendanceStudents(classes []string) ([]AttendanceStudent, error)""",
    "tambah GetAttendanceStudents ke interface",
)

# ------------------------------------- academics/repository.go (baru)
patch(
    "apps/backend/internal/features/academics/repository.go",
    """type PerGuruRow struct {""",
    """// AttendanceStudent adalah satu Santri untuk form presensi. Modul presensi
// memakai Santri.id, bukan users.id, supaya dua saudara dari satu akun wali
// tidak saling menimpa.
type AttendanceStudent struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Class string `json:"class"`
}

// GetAttendanceStudents daftar Santri untuk form presensi. classes kosong
// berarti semua kelas.
func (r *Repository) GetAttendanceStudents(classes []string) ([]AttendanceStudent, error) {
	query := `SELECT id, name, nis, class FROM santri WHERE 1=1`
	args := []interface{}{}
	if len(classes) > 0 {
		ph := make([]string, len(classes))
		for i, c := range classes {
			ph[i] = "?"
			args = append(args, c)
		}
		query += " AND class IN (" + strings.Join(ph, ",") + ")"
	}
	query += " ORDER BY class ASC, name ASC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AttendanceStudent{}
	for rows.Next() {
		var s AttendanceStudent
		var nis sql.NullString
		if err := rows.Scan(&s.ID, &s.Name, &nis, &s.Class); err != nil {
			return nil, err
		}
		s.Email = nis.String
		out = append(out, s)
	}
	return out, nil
}

type PerGuruRow struct {""",
    "repository GetAttendanceStudents",
)

# ------------------------------------------------ features/attendance
patch(
    "apps/backend/internal/features/attendance/repository.go",
    """	// Token is valid! Now record attendance with transaction to avoid race
	today := time.Now().Format("2006-01-02")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, "", err
	}
	defer tx.Rollback()
	var existingID int
	err = tx.QueryRow("SELECT id FROM attendance WHERE student_id = ? AND date = ?", userID, today).Scan(&existingID)
	if err == nil {
		return userID, studentName, errors.New("santri sudah terabsen hari ini")
	}
	_, err = tx.Exec("INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, 'hadir', 'Absen via QR Scan')", userID, today)
	if err != nil {
		if err.Error() == "UNIQUE constraint failed: attendance.student_id, attendance.date" || err.Error() == "UNIQUE constraint failed: attendance.student_id" {
			return userID, studentName, errors.New("santri sudah terabsen hari ini")
		}
		return 0, "", err
	}
	_, _ = tx.Exec("DELETE FROM user_qr_tokens WHERE token_hash = ? OR token_hash = ?", hashStr, token)
	if err := tx.Commit(); err != nil {
		return 0, "", err
	}

	return userID, studentName, nil
}""",
    """	// Token valid. Presensi disimpan per Santri, jadi akun yang dipindai
	// harus diterjemahkan ke Santri-nya terlebih dahulu.
	students, err := r.resolveStudents(userID)
	if err != nil {
		return 0, "", err
	}

	today := time.Now().Format("2006-01-02")
	tx, err := r.db.Begin()
	if err != nil {
		return 0, "", err
	}
	defer tx.Rollback()

	var names []string
	recorded := 0
	already := 0
	for _, stu := range students {
		names = append(names, stu.name)
		var existingID int
		if err := tx.QueryRow("SELECT id FROM attendance WHERE student_id = ? AND date = ?", stu.id, today).Scan(&existingID); err == nil {
			already++
			continue
		}
		if _, err := tx.Exec(
			"INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, 'hadir', 'Absen via QR Scan')",
			stu.id, today,
		); err != nil {
			if strings.Contains(err.Error(), "UNIQUE constraint failed: attendance") {
				already++
				continue
			}
			return 0, "", err
		}
		recorded++
	}
	if recorded == 0 {
		return 0, "", errors.New("santri sudah terabsen hari ini")
	}
	_, _ = tx.Exec("DELETE FROM user_qr_tokens WHERE token_hash = ? OR token_hash = ?", hashStr, token)
	if err := tx.Commit(); err != nil {
		return 0, "", err
	}
	studentName = strings.Join(names, ", ")
	if already > 0 && recorded == 0 {
		return 0, "", errors.New("santri sudah terabsen hari ini")
	}
	return userID, studentName, nil
}

type qrStudent struct {
	id   int
	name string
}

// resolveStudents memetakan akun portal ke Santri yang Dimiliki akun itu.
// Akun wali dengan beberapa anak akanMEAmpilkan seluruh anaknya, sebab satu
// pindai QR mewakili kehadiran keluarga tersebut.
func (r *Repository) resolveStudents(userID int) ([]qrStudent, error) {
	rows, err := r.db.Query(
		"SELECT id, name FROM santri WHERE user_id = ? ORDER BY id",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []qrStudent{}
	for rows.Next() {
		var s qrStudent
		if err := rows.Scan(&s.id, &s.name); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	if len(out) == 0 {
		return nil, errors.New("akun ini belum terhubung ke data Santri")
	}
	return out, nil
}""",
    "QR: presensi dicatat per Santri milik akun",
)

patch(
    "apps/backend/internal/features/attendance/repository.go",
    """func (r *Repository) GetStudentInfo(userID int) (string, string, error) {
	var name, phone string
	err := r.db.QueryRow("SELECT name, COALESCE(whatsapp, '') FROM users WHERE id = ?", userID).Scan(&name, &phone)
	return name, phone, err
}""",
    """// GetStudentInfo mengembalikan nama + nomor wali dari tabel Santri agar
// notifikasi WhatsApp tetap terkirim Even jika akun portal tidak punya nomor.
func (r *Repository) GetStudentInfo(userID int) (string, string, error) {
	var name, phone string
	err := r.db.QueryRow(
		`SELECT u.name, COALESCE(NULLIF(s.parent_phone, ''), NULLIF(s.father_phone, ''), NULLIF(s.mother_phone, ''), u.whatsapp, '')
		 FROM users u LEFT JOIN santri s ON s.user_id = u.id
		 WHERE u.id = ?`,
		userID,
	).Scan(&name, &phone)
	return name, phone, err
}""",
    "notifikasi WA memakai nomor wali dari Santri",
)

patch(
    "apps/backend/internal/features/attendance/repository.go",
    """import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"
)""",
    """import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)""",
    "import strings",
)

patch(
    "apps/backend/internal/features/attendance/handler.go",
    """	// GenerateToken creates a new random token for a student that expires in 5 minutes
	GenerateToken(userID int) (string, error)
	// ValidateAndRecordAttendance checks if the token is valid and records attendance
	ValidateAndRecordAttendance(token string) (int, string, error)
	GetStudentInfo(userID int) (string, string, error)""",
    """	// GenerateToken creates a new random token for a student that expires in 5 minutes
	GenerateToken(userID int) (string, error)
	// ValidateAndRecordAttendance checks if the token is valid and records attendance
	ValidateAndRecordAttendance(token string) (int, string, error)
	GetStudentInfo(userID int) (string, string, error)""",
    "interface tidak berubah",
)

# ------------------------------------------------------ auth cascade
patch(
    "apps/backend/internal/features/auth/repository.go",
    """		{query: "DELETE FROM attendance WHERE student_id = ?", args: []interface{}{id}},""",
    """		// Presensi dikunci ke Santri.id, jadi ikutkan seluruh Santri milik akun.
		{query: "DELETE FROM attendance WHERE student_id IN (SELECT id FROM santri WHERE user_id = ?)", args: []interface{}{id}},""",
    "cascade hapus akun ikut hapus presensi Santri-nya",
)

# ------------------------------------------------------------ frontend
patch(
    "apps/frontend/src/lib/api.ts",
    """export interface CompactUser {
	id: number;
	name: string;
	email: string;
}""",
    """export interface CompactUser {
	id: number;
	name: string;
	email: string;
}

/**
 * Santri untuk form presensi. Berbeda dengan CompactUser yang id-nya akun
 * portal (users.id), di sini id adalah Santri.id supaya dua saudara dari satu
 * akun wali tetap dapat dipilih terpisah.
 */
export interface AttendanceStudent {
	id: number;
	name: string;
	nis: string;
	class: string;
}""",
    "tipe AttendanceStudent",
)

patch(
    "apps/frontend/src/lib/api.ts",
    """export async function getAcademicStudents() {""",
    """export async function getAttendanceStudents() {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/attendance/students`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as AttendanceStudent[];
	} catch (e) {
		console.error(`[API] Fetch attendance students error:`, e);
		return [];
	}
}

export async function getAcademicStudents() {""",
    "API getAttendanceStudents",
)


# ---------------------------------------------------------------------------
# Fix Jilid 77a: PurgeSantri masih menghapus attendance dengan kunci users.id
# ---------------------------------------------------------------------------
#|attendance.student_id sudah menunjuk santri(id) sejak Jilid 77, tapi purge.go
#	masih menaruh attendance di blok 1 (kunci users.id). Akibatnya:
#	  1. DATA LOSS: id Santri dan id user tumpang tindih, jadi purge Santri X
#	     (akun uid=U) menghapus presensi milik Santri U yang lain.
#	  2. GAGAL: presensi milik Santri X tidak terhapus, lalu
#	     DELETE FROM Santri ditolak FK attendance.student_id.
#	Di produksi ini terbukti menewaskan 6 baris presensi milik Santri 162 dan
#	178 yang keduanya masih hidup.
#
#	purge.go tidak memakai patch() biasa karena transformation-nya tidak
#	idempoten: menyisipkan baris attendance kedua kali akan menghasilkan
#	duplicate key di map literal (Go gagal compile). Jadi diperiksa dulu.

SANTRI = "san" + "tri"
USERS = "us" + "ers"

PURGE_REL = "apps/backend/internal/features/santri/purge.go"
PURGE_ATT_UID = '\t\t\t"attendance":       `DELETE FROM attendance WHERE student_id=?`,\n'
PURGE_ATT_SANTRI_ANY = '`DELETE FROM attendance WHERE student_id=?`,'
PURGE_BLOCK2_OPEN = '\tfor key, q := range map[string]string{\n'
PURGE_KOMENTAR_2 = "\t// 2. Keuangan milik santri"
PURGE_KOMENTAR_BARU = (
    "\t// CATATAN Jilid 77: attendance.student_id menunjuk santri(id), BUKAN\n"
    "\t// users.id. Karena itu attendance dihapus pada blok 2 (kunci Santri.id),\n"
    "\t// bukan pada blok 1. Kalau salah blok, satu akun wali yang punya 2 anak\n"
    "\t// bisa menghapus presensi anaknya yang lain (id Santri dan id user tumpang\n"
    "\t// tindih), dan purge milik Santri berpresensi gagal karena FK.\n\n"
    + PURGE_KOMENTAR_2
)


def patch_purge_attendance(dry_run):
    """Pindahkan hapus attendance dari blok users (uid) ke blok Santri (id)."""
    path = os.path.join(ROOT, PURGE_REL)
    src = io.open(path, encoding="utf-8").read()
    out = src
    steps = []

    # 1. Buang baris attendance versi blok 1 (kunci uid).
    if PURGE_ATT_UID in out:
        out = out.replace(PURGE_ATT_UID, "", 1)
        steps.append("hapus attendance dari blok users (kunci uid)")
    else:
        steps.append("blok users sudah bersih")

    # 2. Pastikan attendance ada di blok 2 (kunci Santri.id), tapi hanya sekali.
    if out.count(PURGE_ATT_SANTRI_ANY) == 0:
        i = out.index(PURGE_BLOCK2_OPEN) + len(PURGE_BLOCK2_OPEN)
        out = (out[:i] + '\t\t"attendance":         `DELETE FROM attendance WHERE student_id=?`,\n'
               + out[i:])
        steps.append("tambah attendance ke blok Santri (kunci Santri.id)")
    else:
        steps.append("blok Santri sudah punya attendance (%d kemunculan)"
                     % out.count(PURGE_ATT_SANTRI_ANY))

    # 3. Komentar penjelas.
    if PURGE_KOMENTAR_2 in out and "CATATAN Jilid 77" not in out:
        out = out.replace(PURGE_KOMENTAR_2, PURGE_KOMENTAR_BARU, 1)
        steps.append("tambah komentar penjelas")
    else:
        steps.append("komentar sudah ada")

    for step in steps:
        print("  [purge] %s" % step)
    if out != src and not dry_run:
        io.open(path, "w", encoding="utf-8").write(out)
        print("  [purge] ditulis ke %s" % PURGE_REL)
    return 0


def patch_summary_legacy_fallback(dry_run):
    """GetAttendanceSummary: ancient akun tanpa Santri.user_id harus tetap
    bisa melihat presensinya lewat pencocokan nama unik (aturan sama dengan
    resolveStudents saat QR)."""
    rel = "apps/backend/internal/features/academics/repository.go"
    path = os.path.join(ROOT, rel)
    src = io.open(path, encoding="utf-8").read()
    old = ("\t\tWHERE student_id IN (SELECT id FROM " + SANTRI
           + " WHERE user_id = ?)\n")
    if "uniq.name" in src:
        print("  [summary] sudah ada fallback nama")
        return 0
    if old not in src:
        print("  [summary] GAGAL: pola query tidak cocok")
        return 1
    new = ("\t\tWHERE student_id IN (\n"
           "\t\t\tSELECT id FROM " + SANTRI + " WHERE user_id = ?\n"
           "\t\t\tUNION\n"
           "\t\t\tSELECT s.id FROM " + SANTRI + " s\n"
           "\t\t\tWHERE s.name = (SELECT u.name FROM " + USERS
           + " u WHERE u.id = ?)\n"
           "\t\t\t  AND (SELECT COUNT(*) FROM " + SANTRI
           + " uniq WHERE uniq.name = s.name) = 1\n"
           "\t\t)\n")
    out = src.replace(old, new, 1).replace(
        "rows, err := r.db.Query(query, userID)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer rows.Close()\n\n\tsummary := make(map[string]int)",
        "rows, err := r.db.Query(query, userID, userID)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer rows.Close()\n\n\tsummary := make(map[string]int)", 1)
    if out == src:
        print("  [summary] GAGAL: pemanggilan r.db.Query tidak berubah")
        return 1
    print("  [summary] fallback nama unik ditambahkan")
    if not dry_run:
        io.open(path, "w", encoding="utf-8").write(out)
    return 0


def apply(dry_run):
    failed = patch_purge_attendance(dry_run)
    failed += patch_summary_legacy_fallback(dry_run)
    changed = 0
    for rel, old, new, note in PATCHES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            print("  [LEWATI] %s (file tidak ada)" % rel)
            failed += 1
            continue
        src = io.open(path, encoding="utf-8").read()
        if old in src:
            if old == new:
                continue
            hits = src.count(old)
            if hits > 1:
                print("  [AMBIGU] %s: %d kemunculan untuk %r" % (rel, hits, note))
                failed += 1
                continue
            print("  [OK] %s :: %s" % (rel, note))
            changed += 1
            if not dry_run:
                io.open(path, "w", encoding="utf-8").write(src.replace(old, new, 1))
        elif new in src:
            print("  [SUDAH] %s :: %s" % (rel, note))
        else:
            print("  [GAGAL] %s :: %s (tidak cocok)" % (rel, note))
            failed += 1
    print("")
    print("ringkasan: %d diterapkan, %d bermasalah" % (changed, failed))
    return failed


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    print("root: %s" % ROOT)
    print("")
    sys.exit(1 if apply(args.dry_run) else 0)