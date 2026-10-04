// Command importwali menyatukan akun wali: satu akun portal per keluarga
// (grup parent_phone yang sama), atau satu akun per Santri bila nomor HP kosong.
//
// Keamanan /'idempotensi':
//   - Default DRY-RUN.uve Wajib -apply untuk menulis.
//   - Semua penulisan dalam SATU transaksi: gagal di tengah = tidak ada perubahan.
//   - Password awal TIDAK disimpan di repo. Wajib lewat env WALI_INITIAL_PASSWORD
//     (atau -password-file). Laporan kredensial ditulis mode 0600.
//   - Hanya menyentuh akun role='user' yang tertaut ke Santri. Akun yatim tidak
//     dihapus. Akun non-user (staff) tidak pernah disentuh.
package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	_ "modernc.org/sqlite"
)

// emailDomain dipakai untuk semua akun wali hasil import. Domain .local tidak
// bisa di-resolve ke internet, jadi walau placeholder ini bocor ke luar tidak
// bisa dipakai untuk menerima mail.
const emailDomain = "@almaparung.local"

var nonDigit = regexp.MustCompile(`\D+`)

func digits(s string) string { return nonDigit.ReplaceAllString(s, "") }

type Santri struct {
	ID       int
	NIS      string
	Name     string
	Class    string
	UserID   sql.NullInt64
	Phone    string
	ParentNm string
}

type Account struct {
	Email   string
	Name    string
	Phone   string
	Santri  []Santri
	KeepID  int    // akun yang dipertahankan (primary)
	FreeIDs []int  // akun lama OTHER yang jadi yatim
	HasName bool   // nama wali asli tersedia di DB
	Note    string // catatan untuk laporan
}

type Stats struct {
	TotalSantri   int
	TotalAccounts int
	WithPhone     int
	NoPhone       int
	MultiSantri   int
	Families      int
	OrphanCreated int
	Linked        int
}

func fail(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, "ERROR: "+format+"\n", args...)
	os.Exit(1)
}

func main() {
	var (
		dbPath     = flag.String("db", "", "path ke SQLite (default: $DB_PATH)")
		apply      = flag.Bool("apply", false, "tulis perubahan (default: dry-run)")
		reportPath = flag.String("report", "", "tulis laporan kredensial CSV (mode 0600)")
		pwFile     = flag.String("password-file", "", "file berisi password awal")
	)
	flag.Parse()

	if *dbPath == "" {
		*dbPath = os.Getenv("DB_PATH")
	}
	if *dbPath == "" {
		*dbPath = "./data/alma-parung.db"
	}
	abs, err := filepath.Abs(*dbPath)
	if err != nil {
		fail("path db tidak valid: %v", err)
	}
	*dbPath = abs
	if _, err := os.Stat(*dbPath); err != nil {
		fail("db tidak ditemukan: %s (%v)", *dbPath, err)
	}

	password := readPassword(*pwFile)
	if *apply && password == "" {
		fail("password awal wajib diisi (env WALI_INITIAL_PASSWORD atau -password-file)")
	}
	if password != "" && len(password) < 8 {
		fail("password awal minimal 8 karakter")
	}

	// WAL-aware: modernc sqlite membaca -wal/-shm otomatis. Buka dengan
	// _txlock=immediate supaya transaksi apply tidak menunggu lama.
	db, err := sql.Open("sqlite", *dbPath+"?_txlock=immediate")
	if err != nil {
		fail("gagal membuka db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		fail("gagal ping db: %v", err)
	}

	accounts, stats, err := buildPlan(db)
	if err != nil {
		fail("gagal menyusun rencana: %v", err)
	}

	printPlan(accounts, stats)

	if !*apply {
		fmt.Println("")
		fmt.Println("=== DRY-RUN. Tidak ada perubahan. Jalankan dengan -apply untuk menulis. ===")
		return
	}

	if err := applyPlan(db, accounts, password); err != nil {
		fail("import dibatalkan (rollback): %v", err)
	}

	fmt.Println("")
	fmt.Println("=== IMPORT SELESAI (dry-run: tidak) ===")

	if *reportPath != "" {
		if err := writeReport(*reportPath, accounts, password); err != nil {
			fmt.Fprintf(os.Stderr, "WARN: gagal menulis laporan: %v\n", err)
		} else {
			fmt.Printf("Laporan kredensial: %s (mode 0600)\n", *reportPath)
		}
	}
	verify(db, stats)
}

func readPassword(pwFile string) string {
	if pwFile != "" {
		b, err := os.ReadFile(pwFile)
		if err != nil {
			fail("gagal baca password file: %v", err)
		}
		return strings.TrimSpace(string(b))
	}
	if v := strings.TrimSpace(os.Getenv("WALI_INITIAL_PASSWORD")); v != "" {
		return v
	}
	return ""
}

// buildPlan mengelompokkan Santri jadi akun wali tanpa menyentuh DB.
func buildPlan(db *sql.DB) ([]Account, Stats, error) {
	rows, err := db.Query(`SELECT id, nis, name, COALESCE(class,''),
		user_id, COALESCE(parent_phone,''), COALESCE(parent_name,'')
		FROM santri ORDER BY id`)
	if err != nil {
		return nil, Stats{}, fmt.Errorf("query santri: %w", err)
	}
	defer rows.Close()

	var all []Santri
	for rows.Next() {
		var s Santri
		var uid sql.NullInt64
		if err := rows.Scan(&s.ID, &s.NIS, &s.Name, &s.Class, &uid, &s.Phone, &s.ParentNm); err != nil {
			return nil, Stats{}, err
		}
		s.UserID = uid
		all = append(all, s)
	}
	if err := rows.Err(); err != nil {
		return nil, Stats{}, err
	}

	// Grouping by nomor HP penuh. HP kosong = satu akun per Santri (tidak
	// boleh digabung: nama wali kebetulan sama bukan bukti satu keluarga).
	groups := map[string][]Santri{}
	var order []string
	for _, s := range all {
		key := digits(s.Phone)
		if key == "" {
			key = "solo:" + strconv.Itoa(s.ID)
		}
		if _, seen := groups[key]; !seen {
			order = append(order, key)
		}
		groups[key] = append(groups[key], s)
	}
	sort.Strings(order)

	var accounts []Account
	var st Stats
	st.TotalSantri = len(all)

	usedEmail := map[string]string{}
	for _, key := range order {
		members := groups[key]

		// Email: HP -> 9 digit terakhir; tanpa HP -> id Santri terkecil.
		var email string
		if strings.HasPrefix(key, "solo:") {
			email = "wali-santri" + strconv.Itoa(members[0].ID) + emailDomain
		} else {
			email = "wali" + key[len(key)-9:] + emailDomain
		}
		if prev, dup := usedEmail[email]; dup {
			return nil, st, fmt.Errorf("email bentrok internal: %s (%s vs %s)", email, prev, key)
		}
		usedEmail[email] = key

		// Nama wali: pakai data asli bila ada di salah satu anggota keluarga.
		name, hasName := "", false
		for _, m := range members {
			if n := strings.TrimSpace(m.ParentNm); n != "" {
				name, hasName = n, true
				break
			}
		}
		if !hasName {
			if len(members) == 1 {
				name = "Wali " + members[0].Name
			} else {
				names := make([]string, 0, len(members))
				for _, m := range members {
					names = append(names, m.Name)
				}
				name = "Wali " + strings.Join(names, "/")
			}
		}

		// Akun yang dipertahankan = user_id terkecil (stabil & idempoten).
		// Santri tanpa user_id mendapat akun lama milik anggota lain / baru dibuat.
		keep := 0
		free := []int{}
		for _, m := range members {
			if m.UserID.Valid && m.UserID.Int64 > 0 {
				if keep == 0 || m.UserID.Int64 < int64(keep) {
					if keep != 0 {
						free = append(free, keep)
					}
					keep = int(m.UserID.Int64)
				} else {
					free = append(free, int(m.UserID.Int64))
				}
			}
		}

		phone := ""
		if !strings.HasPrefix(key, "solo:") {
			phone = members[0].Phone
			st.WithPhone++
		} else {
			st.NoPhone++
		}
		if len(members) > 1 {
			st.MultiSantri++
			st.Families++
		}

		note := "pakai nama wali dari DB"
		if !hasName {
			note = "NAMA PLACEHOLDER - ganti dari /admin/akun/walisantri"
		}
		if len(members) > 1 {
			note += " | keluarga %d Santri" % len(members)
		}

		accounts = append(accounts, Account{
			Email: email, Name: name, Phone: phone,
			Santri: members, KeepID: keep, FreeIDs: free,
			HasName: hasName, Note: note,
		})
		st.TotalAccounts++
		st.OrphanCreated += len(free)
	}
	return accounts, st, nil
}

func printPlan(accounts []Account, st Stats) {
	fmt.Println("=== RENCANA IMPORT AKUN WALI ===")
	fmt.Println("total Santri          :", st.TotalSantri)
	fmt.Println("akun wali hasil       :", st.TotalAccounts)
	fmt.Println("  keluarga (>1 anak)  :", st.Families)
	fmt.Println("  satuan tanpa HP     :", st.NoPhone)
	fmt.Println("akun lama jadi yatim  :", st.OrphanCreated)
	fmt.Println("nama wali asli tersedia:", st.TotalAccounts-countNoName(accounts), "dari", st.TotalAccounts)

	fmt.Println("")
	fmt.Println("--- KELUARGA SAUDARA (gabung) ---")
	n := 0
	for _, a := range accounts {
		if len(a.Santri) < 2 {
			continue
		}
		n++
		fmt.Printf("[%d] %s  nama=%q  keepUser=%d  orphan=%v\n", n, a.Email, a.Name, a.KeepID, a.FreeIDs)
		for _, s := range a.Santri {
			fmt.Printf("      - #%d %s (%s) nis=%s\n", s.ID, s.Name, s.Class, s.NIS)
		}
	}

	fmt.Println("")
	fmt.Println("--- AKUN TANPA NAMA WALI (perlu diganti) ---")
	m := 0
	for _, a := range accounts {
		if a.HasName {
			continue
		}
		m++
		if m > 45 {
			fmt.Printf("  ... (%d total)\n", countNoName(accounts))
			break
		}
		fmt.Printf("  %-44s %-34s %s\n", a.Email, a.Name, a.Note)
	}
}

func countNoName(accounts []Account) int {
	c := 0
	for _, a := range accounts {
		if !a.HasName {
			c++
		}
	}
	return c
}

// applyPlan menulis semua perubahan dalam satu transaksi.
func applyPlan(db *sql.DB, accounts []Account, password string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Kosongkan dulu semua user_id Santri agar tidak melanggar constraint
	// "satu akun = satu Santri" saat relink.
	linkedTotal := 0
	for _, a := range accounts {
		keepID := a.KeepID
		if keepID == 0 {
			// Semua anggota tanpa akun: pakai akun milik wali lain? tidak.
			// Buat akun baru di bawah (dijahit ke keepID).
			continue
		}
		for _, s := range a.Santri {
			if _, err := tx.Exec(`UPDATE santri SET user_id=NULL WHERE id=?`, s.ID); err != nil {
				return fmt.Errorf("clear user_id Santri %d: %w", s.ID, err)
			}
		}
		for _, s := range a.Santri {
			if _, err := tx.Exec(`UPDATE santri SET user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, keepID, s.ID); err != nil {
				return fmt.Errorf("relink Santri %d: %w", s.ID, err)
			}
			linkedTotal++
		}
	}

	// Akun tanpa user_id sama sekali ( Santri yatim total) tidak ada di data
	// sekarang, tapi tetap ditangani agar aman.
	for _, a := range accounts {
		if a.KeepID != 0 {
			continue
		}
		res, err := tx.Exec(`INSERT INTO users (email, password_hash, name, role, whatsapp, token_version)
			VALUES (?,?,?,'user',?,0)`, a.Email, string(hash), a.Name, a.Phone)
		if err != nil {
			return fmt.Errorf("buat akun wali %s: %w", a.Email, err)
		}
		newID, err := res.LastInsertId()
		if err != nil {
			return err
		}
		for _, s := range a.Santri {
			if _, err := tx.Exec(`UPDATE santri SET user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, newID, s.ID); err != nil {
				return fmt.Errorf("relink Santri %d ke akun baru: %w", s.ID, err)
			}
			linkedTotal++
		}
	}

	// Perbarui akun utama: nama, email, whatsapp, password awal.
	for _, a := range accounts {
		if a.KeepID == 0 {
			continue
		}
		if err := assertPortalAccount(tx, a.KeepID); err != nil {
			return err
		}
		res, err := tx.Exec(`UPDATE users SET name=?, email=?, whatsapp=?, password_hash=?, token_version=0 WHERE id=?`,
			a.Name, a.Email, a.Phone, string(hash), a.KeepID)
		if err != nil {
			return fmt.Errorf("update akun %d: %w", a.KeepID, err)
		}
		if n, _ := res.RowsAffected(); n != 1 {
			return fmt.Errorf("update akun %d: %d baris terpengaruh (hiapkan 1)", a.KeepID, n)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	fmt.Println("relink Santri          :", linkedTotal)
	return nil
}

// assertPortalAccount jadiCommentsudo: akun yang dipakai harus role='user'.
// Kalau bukan, abort supaya import tidak diam-diam menimpa akun staff.
func assertPortalAccount(tx *sql.Tx, userID int) error {
	var role string
	err := tx.QueryRow(`SELECT role FROM users WHERE id=?`, userID).Scan(&role)
	if err == sql.ErrNoRows {
		return fmt.Errorf("akun %d tidak ada", userID)
	}
	if err != nil {
		return err
	}
	if role != "user" {
		return fmt.Errorf("akun %d bukan role=user (%s) - import dibatalkan demi keamanan", userID, role)
	}
	return nil
}

func writeReport(path string, accounts []Account, password string) error {
	var b strings.Builder
	b.WriteString("email,nama_wali,no_hp,password_awal,jumlah_santri,nama_santri,catatan\n")
	for _, a := range accounts {
		names := make([]string, 0, len(a.Santri))
		for _, s := range a.Santri {
			names = append(names, s.Name)
		}
		b.WriteString(strings.Join([]string{
			a.Email,
			quote(a.Name),
			a.Phone,
			password,
			strconv.Itoa(len(a.Santri)),
			quote(strings.Join(names, " | ")),
			quote(a.Note),
		}, ","))
		b.WriteString("\n")
	}
	if err := os.WriteFile(path, []byte(b.String()), 0o600); err != nil {
		return err
	}
	return os.Chmod(path, 0o600)
}

func quote(s string) string {
	if strings.ContainsAny(s, ",\"\n") {
		return "\"" + strings.ReplaceAll(s, "\"", "\"\"") + "\""
	}
	return s
}

// verify membaca ulang setelah commit untuk memastikan invariant.
func verify(db *sql.DB, st Stats) {
	var linked int
	db.QueryRow(`SELECT COUNT(*) FROM santri WHERE user_id IS NOT NULL`).Scan(&linked)
	fmt.Println("")
	fmt.Println("=== VERIFIKASI ===")
	fmt.Println("Santri tertaut akun   :", linked)
	q := `SELECT COUNT(*) FROM users u WHERE u.role='user' AND EXISTS (SELECT 1 FROM santri s WHERE s.user_id=u.id)`
	var wali int
	db.QueryRow(q).Scan(&wali)
	fmt.Println("akun wali tertaut     :", wali, "(target", st.TotalAccounts, ")")
	q2 := `SELECT COUNT(*) FROM users u WHERE u.role='user' AND NOT EXISTS (SELECT 1 FROM santri s WHERE s.user_id=u.id)`
	var orph int
	db.QueryRow(q2).Scan(&orph)
	fmt.Println("akun user yatim       :", orph, "(naik", st.OrphanCreated, ")")
	var dup int
	db.QueryRow(`SELECT COUNT(*) FROM (SELECT email FROM users GROUP BY email HAVING COUNT(*)>1)`).Scan(&dup)
	fmt.Println("email duplikat        :", dup, "(target 0)")
}

var _ = time.Now