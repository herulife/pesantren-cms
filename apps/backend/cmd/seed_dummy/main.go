package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"darussunnah-api/internal/platform/database"
	"golang.org/x/crypto/bcrypt"
)

type categorySeed struct {
	Name string
	Slug string
}

type newsSeed struct {
	Title        string
	Slug         string
	Content      string
	Excerpt      string
	CategorySlug string
	ImageURL     string
	CreatedAt    time.Time
}

type videoSeed struct {
	Title      string
	SeriesName string
	SeriesSlug string
	EventDate  string
	IsFeatured bool
	URL        string
	Thumbnail  string
}

type agendaSeed struct {
	Title       string
	StartDate   string
	EndDate     string
	TimeInfo    string
	Location    string
	Description string
	Category    string
}

type facilitySeed struct {
	Name        string
	Description string
	ImageURL    string
	Category    string
	IsHighlight bool
}

type teacherSeed struct {
	Name     string
	Subject  string
	Bio      string
	ImageURL string
}

type programSeed struct {
	Title      string
	Slug       string
	Category   string
	Excerpt    string
	Content    string
	ImageURL   string
	IsFeatured bool
	OrderIndex int
}

type gallerySeed struct {
	Title        string
	Category     string
	AlbumName    string
	AlbumSlug    string
	EventDate    string
	IsAlbumCover bool
	ImageURL     string
}

type donationCampaignSeed struct {
	Title        string
	Description  string
	TargetAmount float64
	ImageURL     string
	IsActive     int
	EndDate      string
}

type donationSeed struct {
	CampaignTitle string
	DonorName     string
	DonorPhone    string
	Amount        float64
	PaymentMethod string
	ProofURL      string
	Status        string
}

type messageSeed struct {
	Name      string
	Email     string
	Whatsapp  string
	Message   string
	IsRead    bool
	CreatedAt time.Time
}

type subjectSeed struct {
	Name     string
	Category string
}

type gradeSeed struct {
	StudentID    int64
	SubjectID    int64
	Semester     string
	AcademicYear string
	UTS          float64
	UAS          float64
	Task         float64
	Final        float64
	Letter       string
	Notes        string
	CreatedAt    time.Time
}

type attendanceSeed struct {
	StudentID int64
	Date      string
	Status    string
	Notes     string
	CreatedAt time.Time
}

type tahfidzSeed struct {
	StudentID      int64
	SurahName      string
	Juz            int
	StartAyat      int
	EndAyat        int
	Status         string
	MusyrifNotes   string
	EvaluationDate string
	CreatedAt      time.Time
}

type activityLogSeed struct {
	UserID    int64
	Action    string
	Details   string
	IPAddress string
	UserAgent string
	CreatedAt time.Time
}

type registrationSeed struct {
	FullName      string
	Nickname      string
	Gender        string
	NIK           string
	BirthPlace    string
	BirthDate     string
	Address       string
	SchoolOrigin  string
	ParentName    string
	ParentPhone   string
	ProgramChoice string
	KKURL         string
	IjazahURL     string
	PasfotoURL    string
	Status        string
	CreatedAt     time.Time
}

func main() {
	dbPath := strings.TrimSpace(os.Getenv("DB_PATH"))
	if dbPath == "" {
		dbPath = "./darussunnah.db"
	}

	database.Connect(dbPath)
	db := database.DB
	defer db.Close()

	newsCount := getEnvInt("DUMMY_NEWS", 15)
	videoCount := getEnvInt("DUMMY_VIDEOS", 10)
	agendaCount := getEnvInt("DUMMY_AGENDAS", 6)
	facilityCount := getEnvInt("DUMMY_FACILITIES", 6)
	programCount := getEnvInt("DUMMY_PROGRAMS", 6)
	teacherCount := getEnvInt("DUMMY_TEACHERS", 6)
	galleryCount := getEnvInt("DUMMY_GALLERY", 12)
	campaignCount := getEnvInt("DUMMY_DONATION_CAMPAIGNS", 3)
	donationCount := getEnvInt("DUMMY_DONATIONS", 6)
	messageCount := getEnvInt("DUMMY_MESSAGES", 6)
	studentCount := getEnvInt("DUMMY_STUDENTS", 6)
	subjectCount := getEnvInt("DUMMY_SUBJECTS", 5)
	gradeCount := getEnvInt("DUMMY_GRADES", 12)
	attendanceCount := getEnvInt("DUMMY_ATTENDANCE", 20)
	tahfidzCount := getEnvInt("DUMMY_TAHFIDZ", 12)
	logCount := getEnvInt("DUMMY_WA_LOGS", 6)
	registrationCount := getEnvInt("DUMMY_PSB", 6)

	if err := seedDummyContent(
		db,
		newsCount,
		videoCount,
		agendaCount,
		facilityCount,
		programCount,
		teacherCount,
		galleryCount,
		campaignCount,
		donationCount,
		messageCount,
		studentCount,
		subjectCount,
		gradeCount,
		attendanceCount,
		tahfidzCount,
		logCount,
		registrationCount,
	); err != nil {
		log.Fatalf("seed dummy content failed: %v", err)
	}

	fmt.Printf(
		"Dummy content created successfully: %d news + %d videos + %d agendas + %d facilities + %d programs + %d teachers + %d gallery + %d donation campaigns + %d donations + %d inbox messages + %d students + %d subjects + %d grades + %d attendance + %d tahfidz + %d WA logs + %d registrations.\n",
		newsCount,
		videoCount,
		agendaCount,
		facilityCount,
		programCount,
		teacherCount,
		galleryCount,
		campaignCount,
		donationCount,
		messageCount,
		studentCount,
		subjectCount,
		gradeCount,
		attendanceCount,
		tahfidzCount,
		logCount,
		registrationCount,
	)
}

func seedDummyContent(
	db *sql.DB,
	newsCount int,
	videoCount int,
	agendaCount int,
	facilityCount int,
	programCount int,
	teacherCount int,
	galleryCount int,
	campaignCount int,
	donationCount int,
	messageCount int,
	studentCount int,
	subjectCount int,
	gradeCount int,
	attendanceCount int,
	tahfidzCount int,
	logCount int,
	registrationCount int,
) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err = ensureCategories(tx); err != nil {
		return err
	}

	categoryIDs, err := getCategoryIDs(tx)
	if err != nil {
		return err
	}

	authorID, err := getFirstAuthorID(tx)
	if err != nil {
		return err
	}

	if newsCount > 0 {
		if _, err = tx.Exec(`DELETE FROM news WHERE slug LIKE 'dummy-berita-%'`); err != nil {
			return err
		}
		if err = insertNews(tx, categoryIDs, authorID, newsCount); err != nil {
			return err
		}
	}

	if videoCount > 0 {
		if _, err = tx.Exec(`DELETE FROM videos WHERE series_slug LIKE 'dummy-video-%' OR title LIKE '[Dummy] %'`); err != nil {
			return err
		}
		if err = insertVideos(tx, videoCount); err != nil {
			return err
		}
	}

	if agendaCount > 0 && tableExists(tx, "agendas") {
		if _, err = tx.Exec(`DELETE FROM agendas WHERE title LIKE 'Dummy Agenda %'`); err != nil {
			return err
		}
		if err = insertAgendas(tx, agendaCount); err != nil {
			return err
		}
	}

	if facilityCount > 0 && tableExists(tx, "facilities") {
		if _, err = tx.Exec(`DELETE FROM facilities WHERE name LIKE 'Dummy Fasilitas %'`); err != nil {
			return err
		}
		if err = insertFacilities(tx, facilityCount); err != nil {
			return err
		}
	}

	if programCount > 0 && tableExists(tx, "programs") {
		if _, err = tx.Exec(`DELETE FROM programs WHERE slug LIKE 'dummy-program-%'`); err != nil {
			return err
		}
		if err = insertPrograms(tx, programCount); err != nil {
			return err
		}
	}

	if teacherCount > 0 && tableExists(tx, "teachers") {
		if _, err = tx.Exec(`DELETE FROM teachers WHERE name LIKE 'Dummy Ustadz %'`); err != nil {
			return err
		}
		if err = insertTeachers(tx, teacherCount); err != nil {
			return err
		}
	}

	if galleryCount > 0 && tableExists(tx, "gallery") {
		if _, err = tx.Exec(`DELETE FROM gallery WHERE album_slug LIKE 'dummy-album-%' OR title LIKE 'Dummy Foto %'`); err != nil {
			return err
		}
		if err = insertGallery(tx, galleryCount); err != nil {
			return err
		}
	}

	if campaignCount > 0 && tableExists(tx, "donation_campaigns") {
		if _, err = tx.Exec(`DELETE FROM donation_campaigns WHERE title LIKE 'Dummy Donasi %'`); err != nil {
			return err
		}
		if err = insertDonationCampaigns(tx, campaignCount); err != nil {
			return err
		}
	}

	if donationCount > 0 && tableExists(tx, "donations") && tableExists(tx, "donation_campaigns") {
		if _, err = tx.Exec(`DELETE FROM donations WHERE donor_name LIKE 'Dummy Donatur %'`); err != nil {
			return err
		}
		if err = insertDonations(tx, donationCount); err != nil {
			return err
		}
	}

	if messageCount > 0 && tableExists(tx, "messages") {
		if _, err = tx.Exec(`DELETE FROM messages WHERE email LIKE 'dummy.inbox.%@example.test'`); err != nil {
			return err
		}
		if err = insertMessages(tx, messageCount); err != nil {
			return err
		}
	}

	var studentIDs []int64
	if studentCount > 0 && tableExists(tx, "users") {
		studentIDs, err = ensureDummyStudents(tx, studentCount)
		if err != nil {
			return err
		}
	}

	var subjectIDs []int64
	if subjectCount > 0 && tableExists(tx, "subjects") {
		if _, err = tx.Exec(`DELETE FROM subjects WHERE name LIKE 'Dummy Pelajaran %'`); err != nil {
			return err
		}
		subjectIDs, err = insertSubjects(tx, authorID, subjectCount)
		if err != nil {
			return err
		}
	}

	if gradeCount > 0 && tableExists(tx, "grades") && len(studentIDs) > 0 && len(subjectIDs) > 0 {
		if _, err = tx.Exec(`DELETE FROM grades WHERE notes LIKE 'Dummy Nilai %'`); err != nil {
			return err
		}
		if err = insertGrades(tx, studentIDs, subjectIDs, gradeCount); err != nil {
			return err
		}
	}

	if attendanceCount > 0 && tableExists(tx, "attendance") && len(studentIDs) > 0 {
		if _, err = tx.Exec(`DELETE FROM attendance WHERE notes LIKE 'Dummy Absensi %'`); err != nil {
			return err
		}
		if err = insertAttendance(tx, studentIDs, attendanceCount); err != nil {
			return err
		}
	}

	if tahfidzCount > 0 && tableExists(tx, "tahfidz_progress") && len(studentIDs) > 0 {
		if _, err = tx.Exec(`DELETE FROM tahfidz_progress WHERE musyrif_notes LIKE 'Dummy Tahfidz %'`); err != nil {
			return err
		}
		if err = insertTahfidz(tx, studentIDs, tahfidzCount); err != nil {
			return err
		}
	}

	if logCount > 0 && tableExists(tx, "activity_logs") {
		if _, err = tx.Exec(`DELETE FROM activity_logs WHERE details LIKE 'Dummy WA %'`); err != nil {
			return err
		}
		if authorID != nil {
			if err = insertActivityLogs(tx, *authorID, logCount); err != nil {
				return err
			}
		}
	}

	if registrationCount > 0 && tableExists(tx, "registrations") {
		if _, err = tx.Exec(`DELETE FROM registrations WHERE full_name LIKE 'Dummy PSB %'`); err != nil {
			return err
		}
		if err = insertRegistrations(tx, registrationCount); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func ensureCategories(tx *sql.Tx) error {
	categories := []categorySeed{
		{Name: "Kegiatan", Slug: "kegiatan"},
		{Name: "Akademik", Slug: "akademik"},
		{Name: "Prestasi", Slug: "prestasi"},
		{Name: "Pengumuman", Slug: "pengumuman"},
		{Name: "Pesantren", Slug: "pesantren"},
	}

	for _, category := range categories {
		if _, err := tx.Exec(
			`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`,
			category.Name,
			category.Slug,
		); err != nil {
			return err
		}
	}

	return nil
}

func getCategoryIDs(tx *sql.Tx) (map[string]int64, error) {
	rows, err := tx.Query(`SELECT id, slug FROM categories`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int64)
	for rows.Next() {
		var id int64
		var slug string
		if err := rows.Scan(&id, &slug); err != nil {
			return nil, err
		}
		result[slug] = id
	}

	return result, rows.Err()
}

func getFirstAuthorID(tx *sql.Tx) (*int64, error) {
	var authorID sql.NullInt64
	if err := tx.QueryRow(`SELECT id FROM users ORDER BY id ASC LIMIT 1`).Scan(&authorID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if !authorID.Valid {
		return nil, nil
	}
	return &authorID.Int64, nil
}

func ensureDummyStudents(tx *sql.Tx, count int) ([]int64, error) {
	if count <= 0 {
		return nil, nil
	}

	rows, err := tx.Query(`SELECT id FROM users WHERE email LIKE 'dummy.student.%@example.test'`)
	if err != nil {
		return nil, err
	}
	var existingIDs []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			_ = rows.Close()
			return nil, err
		}
		existingIDs = append(existingIDs, id)
	}
	rows.Close()

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
		if err := deleteByIDs(tx, "users", "id", existingIDs); err != nil {
			return nil, err
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("12345678"), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var ids []int64
	for i := 1; i <= count; i++ {
		email := fmt.Sprintf("dummy.student.%02d@example.test", i)
		name := fmt.Sprintf("Dummy Santri %02d", i)
		whatsapp := fmt.Sprintf("628123450%02d", i)
		res, err := tx.Exec(
			`INSERT INTO users (email, password_hash, name, role, whatsapp, created_at)
			 VALUES (?, ?, ?, 'user', ?, ?)`,
			email,
			string(hashedPassword),
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

	return ids, nil
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

func insertMessages(tx *sql.Tx, count int) error {
	baseDate := time.Now().AddDate(0, 0, -5)
	seeds := []messageSeed{
		{Name: "Dummy Wali 01", Email: "dummy.inbox.01@example.test", Whatsapp: "62812344001", Message: "Assalamu'alaikum, saya ingin menanyakan jadwal kunjungan wali santri bulan ini.", IsRead: false, CreatedAt: baseDate},
		{Name: "Dummy Wali 02", Email: "dummy.inbox.02@example.test", Whatsapp: "62812344002", Message: "Mohon info persyaratan tambahan untuk PSB gelombang berikutnya.", IsRead: true, CreatedAt: baseDate.Add(3 * time.Hour)},
		{Name: "Dummy Wali 03", Email: "dummy.inbox.03@example.test", Whatsapp: "62812344003", Message: "Apakah tersedia program beasiswa untuk santri berprestasi?", IsRead: false, CreatedAt: baseDate.Add(6 * time.Hour)},
		{Name: "Dummy Wali 04", Email: "dummy.inbox.04@example.test", Whatsapp: "62812344004", Message: "Saya ingin mengonfirmasi biaya masuk dan rincian SPP.", IsRead: true, CreatedAt: baseDate.AddDate(0, 0, 1)},
		{Name: "Dummy Wali 05", Email: "dummy.inbox.05@example.test", Whatsapp: "62812344005", Message: "Mohon jadwal tes tahfidz untuk calon santri baru.", IsRead: false, CreatedAt: baseDate.AddDate(0, 0, 2)},
		{Name: "Dummy Wali 06", Email: "dummy.inbox.06@example.test", Whatsapp: "62812344006", Message: "Apakah bisa konsultasi langsung terkait program tahfidz intensif?", IsRead: true, CreatedAt: baseDate.AddDate(0, 0, 3)},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO messages (name, email, whatsapp, message, is_read, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			item.Name,
			item.Email,
			item.Whatsapp,
			item.Message,
			item.IsRead,
			item.CreatedAt.Format("2006-01-02 15:04:05"),
		); err != nil {
			return err
		}
	}
	return nil
}

func insertSubjects(tx *sql.Tx, teacherID *int64, count int) ([]int64, error) {
	seeds := []subjectSeed{
		{Name: "Dummy Pelajaran 01 - Tahfidz", Category: "tahfidz"},
		{Name: "Dummy Pelajaran 02 - Kitab Kuning", Category: "diniyah"},
		{Name: "Dummy Pelajaran 03 - Bahasa Arab", Category: "bahasa"},
		{Name: "Dummy Pelajaran 04 - Fiqih", Category: "diniyah"},
		{Name: "Dummy Pelajaran 05 - Akhlak", Category: "karakter"},
		{Name: "Dummy Pelajaran 06 - Hadits", Category: "diniyah"},
	}

	var ids []int64
	for _, item := range sliceSeeds(seeds, count) {
		var teacherValue interface{}
		if teacherID != nil {
			teacherValue = *teacherID
		} else {
			teacherValue = nil
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

func insertGrades(tx *sql.Tx, studentIDs []int64, subjectIDs []int64, count int) error {
	if count <= 0 || len(studentIDs) == 0 || len(subjectIDs) == 0 {
		return nil
	}
	semester := "Ganjil"
	year := "2026/2027"
	index := 0
	for _, studentID := range studentIDs {
		for _, subjectID := range subjectIDs {
			scoreBase := 70 + (index * 5 % 21)
			uts := float64(scoreBase)
			uas := float64(scoreBase + 5)
			task := float64(scoreBase - 3)
			final := (uts + uas + task) / 3
			letter := gradeLetter(final)
			note := fmt.Sprintf("Dummy Nilai %02d", index+1)
			if _, err := tx.Exec(
				`INSERT INTO grades (student_id, subject_id, semester, academic_year, uts_score, uas_score, task_score, final_score, grade_letter, notes, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				studentID,
				subjectID,
				semester,
				year,
				uts,
				uas,
				task,
				final,
				letter,
				note,
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

func insertAttendance(tx *sql.Tx, studentIDs []int64, count int) error {
	if count <= 0 || len(studentIDs) == 0 {
		return nil
	}
	statuses := []string{"hadir", "izin", "sakit", "alpha"}
	index := 0
	for _, studentID := range studentIDs {
		for day := 0; day < 10; day++ {
			status := statuses[(index+day)%len(statuses)]
			note := fmt.Sprintf("Dummy Absensi %02d", index+1)
			if _, err := tx.Exec(
				`INSERT INTO attendance (student_id, date, status, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
				studentID,
				time.Now().AddDate(0, 0, -day).Format("2006-01-02"),
				status,
				note,
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

func insertTahfidz(tx *sql.Tx, studentIDs []int64, count int) error {
	if count <= 0 || len(studentIDs) == 0 {
		return nil
	}

	surahSeeds := []struct {
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
	}

	index := 0
	for _, studentID := range studentIDs {
		for _, seed := range surahSeeds {
			note := fmt.Sprintf("Dummy Tahfidz %02d - Setoran %s menunjukkan progres yang baik dan perlu menjaga murojaah harian.", index+1, seed.name)
			evaluationDate := time.Now().AddDate(0, 0, -index).Format("2006-01-02")
			if _, err := tx.Exec(
				`INSERT INTO tahfidz_progress (student_id, surah_name, juz, start_ayat, end_ayat, status, musyrif_notes, evaluation_date, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				studentID,
				seed.name,
				seed.juz,
				seed.startAyat,
				seed.endAyat,
				seed.status,
				note,
				evaluationDate,
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

func insertActivityLogs(tx *sql.Tx, adminID int64, count int) error {
	if count <= 0 {
		return nil
	}
	seeds := []activityLogSeed{
		{UserID: adminID, Action: "SEND_WA", Details: "Dummy WA manual ke wali santri", IPAddress: "127.0.0.1", UserAgent: "seed_dummy", CreatedAt: time.Now().AddDate(0, 0, -2)},
		{UserID: adminID, Action: "SEND_WA_BROADCAST", Details: "Dummy WA broadcast tagihan SPP", IPAddress: "127.0.0.1", UserAgent: "seed_dummy", CreatedAt: time.Now().AddDate(0, 0, -1)},
		{UserID: adminID, Action: "SEND_WA_BROADCAST_NILAI", Details: "Dummy WA broadcast nilai raport ke wali santri", IPAddress: "127.0.0.1", UserAgent: "seed_dummy", CreatedAt: time.Now().AddDate(0, 0, -1).Add(2 * time.Hour)},
		{UserID: adminID, Action: "SEND_WA_BROADCAST_PSB", Details: "Dummy WA broadcast status PSB", IPAddress: "127.0.0.1", UserAgent: "seed_dummy", CreatedAt: time.Now().AddDate(0, 0, -1).Add(4 * time.Hour)},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			item.UserID,
			item.Action,
			item.Details,
			item.IPAddress,
			item.UserAgent,
			item.CreatedAt.Format("2006-01-02 15:04:05"),
		); err != nil {
			return err
		}
	}

	return nil
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

func insertRegistrations(tx *sql.Tx, count int) error {
	imagePool := []string{
		"/assets/img/gedung.webp",
		"/assets/img/tahfidz.jpg",
		"/assets/img/khalaqoh.jpg",
	}
	baseDate := time.Now().AddDate(0, 0, -10)
	seeds := []registrationSeed{
		{FullName: "Dummy PSB 01 - Ahmad Naufal", Nickname: "Naufal", Gender: "L", NIK: "3201010101010001", BirthPlace: "Bogor", BirthDate: "2012-04-12", Address: "Kp. Sukamaju, Parung", SchoolOrigin: "SDIT Al-Falah", ParentName: "Bapak Hasan", ParentPhone: "628123455001", ProgramChoice: "Tahfidz", KKURL: imagePool[0], IjazahURL: imagePool[1], PasfotoURL: imagePool[2], Status: "pending", CreatedAt: baseDate},
		{FullName: "Dummy PSB 02 - Aisyah Rahma", Nickname: "Aisyah", Gender: "P", NIK: "3201010101010002", BirthPlace: "Depok", BirthDate: "2012-06-20", Address: "Jl. Melati 3, Parung", SchoolOrigin: "SDN Parung 02", ParentName: "Ibu Siti", ParentPhone: "628123455002", ProgramChoice: "Diniyah", KKURL: imagePool[1], IjazahURL: imagePool[2], PasfotoURL: imagePool[0], Status: "review", CreatedAt: baseDate.AddDate(0, 0, 1)},
		{FullName: "Dummy PSB 03 - Muhammad Faqih", Nickname: "Faqih", Gender: "L", NIK: "3201010101010003", BirthPlace: "Tangerang", BirthDate: "2011-11-03", Address: "Komplek Darussalam, Parung", SchoolOrigin: "SDIT Darul Hikmah", ParentName: "Bapak Karim", ParentPhone: "628123455003", ProgramChoice: "Tahfidz", KKURL: imagePool[2], IjazahURL: imagePool[0], PasfotoURL: imagePool[1], Status: "accepted", CreatedAt: baseDate.AddDate(0, 0, 2)},
		{FullName: "Dummy PSB 04 - Nurul Huda", Nickname: "Nurul", Gender: "P", NIK: "3201010101010004", BirthPlace: "Bogor", BirthDate: "2012-02-18", Address: "Perumahan Hijau, Parung", SchoolOrigin: "SDIT Nurul Huda", ParentName: "Ibu Maryam", ParentPhone: "628123455004", ProgramChoice: "Bahasa Arab", KKURL: imagePool[0], IjazahURL: imagePool[1], PasfotoURL: imagePool[2], Status: "pending", CreatedAt: baseDate.AddDate(0, 0, 3)},
		{FullName: "Dummy PSB 05 - Abdul Aziz", Nickname: "Aziz", Gender: "L", NIK: "3201010101010005", BirthPlace: "Bogor", BirthDate: "2011-08-09", Address: "Kp. Mekar, Parung", SchoolOrigin: "SDN Parung 01", ParentName: "Bapak Firdaus", ParentPhone: "628123455005", ProgramChoice: "Kader Dakwah", KKURL: imagePool[1], IjazahURL: imagePool[2], PasfotoURL: imagePool[0], Status: "rejected", CreatedAt: baseDate.AddDate(0, 0, 4)},
		{FullName: "Dummy PSB 06 - Zahra Anisa", Nickname: "Zahra", Gender: "P", NIK: "3201010101010006", BirthPlace: "Depok", BirthDate: "2012-12-01", Address: "Jl. Anggrek 9, Parung", SchoolOrigin: "SDIT Bina Ummah", ParentName: "Ibu Hana", ParentPhone: "628123455006", ProgramChoice: "Tahfidz", KKURL: imagePool[2], IjazahURL: imagePool[0], PasfotoURL: imagePool[1], Status: "review", CreatedAt: baseDate.AddDate(0, 0, 5)},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO registrations (full_name, nickname, gender, nik, birth_place, birth_date, address, parent_name, parent_phone, school_origin, program_choice, kk_url, ijazah_url, pasfoto_url, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			item.FullName,
			item.Nickname,
			item.Gender,
			item.NIK,
			item.BirthPlace,
			item.BirthDate,
			item.Address,
			item.ParentName,
			item.ParentPhone,
			item.SchoolOrigin,
			item.ProgramChoice,
			item.KKURL,
			item.IjazahURL,
			item.PasfotoURL,
			item.Status,
			item.CreatedAt.Format("2006-01-02 15:04:05"),
			item.CreatedAt.Format("2006-01-02 15:04:05"),
		); err != nil {
			return err
		}
	}
	return nil
}

func insertNews(tx *sql.Tx, categoryIDs map[string]int64, authorID *int64, count int) error {
	imagePool := []string{
		"/assets/img/gedung.webp",
		"/assets/img/tahfidz.jpg",
		"/assets/img/khalaqoh.jpg",
		"/assets/img/manasik.jpg",
		"/assets/img/belajar-kitab.jpg",
	}

	baseDate := time.Now().AddDate(0, 0, -14)
	seeds := []newsSeed{
		{Title: "Pembukaan Pekan Bahasa Arab Santri Darussunnah", Slug: "dummy-berita-01", CategorySlug: "kegiatan", Excerpt: "Santri memulai pekan bahasa dengan muhadharah, kuis, dan praktik percakapan harian.", Content: "Pekan Bahasa Arab dibuka dengan apel pagi bersama dewan asatidz. Kegiatan ini difokuskan untuk meningkatkan keberanian santri dalam berkomunikasi, memperkaya mufradat, dan membiasakan lingkungan berbahasa di area pesantren. Selama satu pekan, santri mengikuti lomba pidato, percakapan, dan presentasi kelompok dengan suasana yang tertib dan penuh semangat.", ImageURL: imagePool[0], CreatedAt: baseDate},
		{Title: "Program Tahfidz Pagi Mencapai Target Setoran Baru", Slug: "dummy-berita-02", CategorySlug: "akademik", Excerpt: "Target setoran hafalan santri pekan ini meningkat dengan pendampingan musyrif yang lebih intensif.", Content: "Program tahfidz pagi menunjukkan perkembangan yang positif. Santri mampu menambah capaian hafalan secara bertahap berkat evaluasi harian, murojaah berpasangan, dan pembagian target yang realistis. Tim pengajar menilai pola pendampingan yang konsisten menjadi faktor penting dalam menjaga kualitas hafalan dan ketelitian bacaan.", ImageURL: imagePool[1], CreatedAt: baseDate.AddDate(0, 0, 1)},
		{Title: "Darussunnah Gelar Kajian Adab Penuntut Ilmu untuk Santri Baru", Slug: "dummy-berita-03", CategorySlug: "pesantren", Excerpt: "Kajian ini menguatkan fondasi adab, kedisiplinan, dan niat santri dalam belajar.", Content: "Kajian adab penuntut ilmu diberikan kepada santri baru sebagai bekal awal dalam menjalani kehidupan pesantren. Materi meliputi pentingnya menjaga niat, menghormati guru, memuliakan ilmu, dan membangun kebiasaan ibadah berjamaah. Kegiatan ini diharapkan menumbuhkan budaya belajar yang santun dan istiqamah sejak awal masa pendidikan.", ImageURL: imagePool[2], CreatedAt: baseDate.AddDate(0, 0, 2)},
		{Title: "Latihan Manasik Haji Santri Berjalan Tertib dan Antusias", Slug: "dummy-berita-04", CategorySlug: "kegiatan", Excerpt: "Praktik manasik menjadi sarana pembelajaran ibadah yang aplikatif dan menyenangkan.", Content: "Santri mengikuti simulasi manasik haji dengan tertib dan antusias. Mereka mempraktikkan tahapan ihram, thawaf, sa'i, hingga lempar jumrah secara berurutan dengan bimbingan ustadz pembina. Kegiatan ini tidak hanya menguatkan pemahaman fikih ibadah, tetapi juga melatih kedisiplinan dan kekompakan dalam mengikuti arahan.", ImageURL: imagePool[3], CreatedAt: baseDate.AddDate(0, 0, 3)},
		{Title: "Kelas Kitab Kuning Fokus pada Penguatan Pemahaman Nahwu", Slug: "dummy-berita-05", CategorySlug: "akademik", Excerpt: "Materi nahwu dasar diperkuat melalui latihan membaca dan pembahasan contoh kalimat.", Content: "Pembelajaran kitab kuning pekan ini menitikberatkan pada pemahaman nahwu dasar yang sering digunakan dalam pembacaan teks Arab gundul. Guru mengombinasikan penjelasan teori, contoh kalimat, dan latihan mandiri agar santri memahami struktur i'rab secara bertahap. Evaluasi menunjukkan minat belajar meningkat ketika pembelajaran dibuat terarah dan kontekstual.", ImageURL: imagePool[4], CreatedAt: baseDate.AddDate(0, 0, 4)},
		{Title: "Tim Darussunnah Raih Juara Lomba Pidato Antar Pesantren", Slug: "dummy-berita-06", CategorySlug: "prestasi", Excerpt: "Prestasi ini menjadi motivasi baru bagi santri untuk terus berlatih public speaking.", Content: "Santri Darussunnah berhasil meraih juara dalam lomba pidato antar pesantren tingkat daerah. Keberhasilan ini diraih melalui latihan rutin, pembinaan materi, dan simulasi tampil di depan umum. Pihak pesantren mengapresiasi kerja keras peserta sekaligus menjadikan capaian ini sebagai dorongan bagi santri lain untuk mengembangkan potensi dakwah dan komunikasi.", ImageURL: imagePool[0], CreatedAt: baseDate.AddDate(0, 0, 5)},
		{Title: "Pengumuman Jadwal Ujian Tengah Semester Telah Diterbitkan", Slug: "dummy-berita-07", CategorySlug: "pengumuman", Excerpt: "Santri diminta mempersiapkan diri sesuai jadwal dan ketentuan ujian yang berlaku.", Content: "Panitia akademik telah menerbitkan jadwal ujian tengah semester untuk seluruh jenjang. Jadwal ini disusun agar seluruh mata pelajaran dapat terlaksana dengan tertib tanpa mengganggu kegiatan pondok lainnya. Santri diimbau memperhatikan ruang ujian, waktu pelaksanaan, serta aturan kedisiplinan yang berlaku selama masa ujian.", ImageURL: imagePool[1], CreatedAt: baseDate.AddDate(0, 0, 6)},
		{Title: "Kerja Bakti Asrama Menumbuhkan Kepedulian dan Kerapian", Slug: "dummy-berita-08", CategorySlug: "pesantren", Excerpt: "Kegiatan rutin ini melatih tanggung jawab santri terhadap kebersihan lingkungan.", Content: "Kerja bakti asrama dilaksanakan secara rutin untuk menanamkan kepedulian terhadap kebersihan dan kenyamanan tempat tinggal. Santri dibagi ke beberapa kelompok kecil untuk membersihkan area kamar, halaman, dan fasilitas umum. Dengan pendampingan musyrif, kegiatan berlangsung tertib serta membangun budaya gotong royong yang kuat di lingkungan pesantren.", ImageURL: imagePool[2], CreatedAt: baseDate.AddDate(0, 0, 7)},
		{Title: "Pelatihan Desain Media Dakwah untuk Tim Kreatif Santri", Slug: "dummy-berita-09", CategorySlug: "kegiatan", Excerpt: "Santri dikenalkan pada prinsip desain sederhana untuk kebutuhan media dakwah digital.", Content: "Tim kreatif santri mengikuti pelatihan desain media dakwah sebagai bagian dari pengembangan keterampilan komunikasi visual. Materi meliputi penyusunan teks yang efektif, penggunaan warna yang proporsional, dan pemilihan elemen visual untuk konten dakwah. Pelatihan ini diharapkan membantu santri menghasilkan media yang informatif, rapi, dan menarik.", ImageURL: imagePool[3], CreatedAt: baseDate.AddDate(0, 0, 8)},
		{Title: "Pembinaan Karakter Santri Melalui Muhasabah Malam Jumat", Slug: "dummy-berita-10", CategorySlug: "pesantren", Excerpt: "Muhasabah diarahkan untuk memperkuat disiplin ibadah dan akhlak keseharian santri.", Content: "Muhasabah malam Jumat menjadi agenda pembinaan karakter yang rutin diikuti oleh santri. Dalam suasana yang khidmat, santri diajak mengevaluasi kedisiplinan shalat berjamaah, adab terhadap guru, serta tanggung jawab pribadi selama sepekan. Program ini dipandang efektif untuk membangun kesadaran spiritual sekaligus memperkuat ukhuwah antarsantri.", ImageURL: imagePool[4], CreatedAt: baseDate.AddDate(0, 0, 9)},
		{Title: "Santri Kelas Akhir Ikuti Pembekalan Pengabdian Masyarakat", Slug: "dummy-berita-11", CategorySlug: "akademik", Excerpt: "Pembekalan ini menyiapkan santri agar siap terjun berdakwah dan berinteraksi di masyarakat.", Content: "Santri kelas akhir mendapatkan pembekalan khusus sebelum mengikuti program pengabdian masyarakat. Materi yang diberikan mencakup etika bermuamalah, teknik komunikasi dakwah, penyusunan kegiatan, dan adaptasi sosial. Pesantren berharap program ini menjadi ajang latihan kepemimpinan dan penguatan peran santri sebagai agen kebaikan di tengah masyarakat.", ImageURL: imagePool[0], CreatedAt: baseDate.AddDate(0, 0, 10)},
		{Title: "Darussunnah Resmikan Program Literasi Pagi di Perpustakaan", Slug: "dummy-berita-12", CategorySlug: "kegiatan", Excerpt: "Program baru ini mendorong budaya membaca sebelum aktivitas belajar dimulai.", Content: "Program literasi pagi resmi diluncurkan sebagai upaya menumbuhkan kebiasaan membaca di kalangan santri. Setiap pagi, santri diberi waktu khusus untuk membaca buku pilihan di perpustakaan atau pojok baca asrama. Guru pembina menilai langkah ini penting untuk memperluas wawasan sekaligus melatih konsentrasi sebelum masuk ke agenda pembelajaran inti.", ImageURL: imagePool[1], CreatedAt: baseDate.AddDate(0, 0, 11)},
		{Title: "Prestasi Tahfidz Santri Meningkat dalam Ujian Tasmi Pekanan", Slug: "dummy-berita-13", CategorySlug: "prestasi", Excerpt: "Sejumlah santri berhasil menuntaskan target tasmi dengan kualitas bacaan yang baik.", Content: "Ujian tasmi pekanan mencatat peningkatan capaian hafalan santri di beberapa halaqah. Selain jumlah setoran yang bertambah, kualitas kelancaran dan ketepatan tajwid juga menunjukkan perkembangan yang menggembirakan. Pengurus tahfidz akan terus menjaga ritme pembinaan agar capaian ini dapat dipertahankan pada pekan-pekan berikutnya.", ImageURL: imagePool[2], CreatedAt: baseDate.AddDate(0, 0, 12)},
		{Title: "Pengumuman Libur Kunjungan Wali Santri Pekan Ini", Slug: "dummy-berita-14", CategorySlug: "pengumuman", Excerpt: "Penyesuaian jadwal kunjungan dilakukan untuk mendukung kelancaran agenda internal pesantren.", Content: "Manajemen pesantren mengumumkan penyesuaian jadwal kunjungan wali santri pada pekan ini. Kebijakan ini diambil untuk mendukung kelancaran beberapa agenda internal yang memerlukan fokus penuh dari santri dan pengasuh. Informasi lanjutan mengenai jadwal pengganti akan disampaikan melalui kanal resmi pesantren.", ImageURL: imagePool[3], CreatedAt: baseDate.AddDate(0, 0, 13)},
		{Title: "Pembinaan Bahasa Inggris Aktif Digelar dengan Metode Percakapan", Slug: "dummy-berita-15", CategorySlug: "akademik", Excerpt: "Metode conversation dipilih agar santri lebih percaya diri menggunakan bahasa Inggris.", Content: "Program pembinaan bahasa Inggris aktif kembali digelar dengan pendekatan percakapan praktis. Santri dibiasakan menggunakan ungkapan sehari-hari dalam konteks yang sederhana dan relevan dengan kehidupan pondok. Pengajar menilai metode ini efektif untuk meningkatkan kepercayaan diri dan membangun kebiasaan berkomunikasi secara bertahap.", ImageURL: imagePool[4], CreatedAt: baseDate.AddDate(0, 0, 14)},
	}

	for _, item := range sliceSeeds(seeds, count) {
		categoryID := categoryIDs[item.CategorySlug]
		var authorValue interface{}
		if authorID != nil {
			authorValue = *authorID
		} else {
			authorValue = nil
		}

		if _, err := tx.Exec(
			`INSERT INTO news (title, slug, content, excerpt, category_id, image_url, status, author_id, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
			item.Title,
			item.Slug,
			item.Content,
			item.Excerpt,
			categoryID,
			item.ImageURL,
			authorValue,
			item.CreatedAt.Format("2006-01-02 15:04:05"),
			item.CreatedAt.Format("2006-01-02 15:04:05"),
		); err != nil {
			return err
		}
	}

	return nil
}

func insertVideos(tx *sql.Tx, count int) error {
	seeds := []videoSeed{
		{Title: "[Dummy] Pembukaan Dauroh Tahfidz 2026", SeriesName: "Dauroh Tahfidz 2026", SeriesSlug: "dummy-video-dauroh-tahfidz-2026", EventDate: "2026-03-15", IsFeatured: true, URL: "https://www.youtube.com/watch?v=ysz5S6PUM-U", Thumbnail: "https://img.youtube.com/vi/ysz5S6PUM-U/hqdefault.jpg"},
		{Title: "[Dummy] Murojaah Bersama Santri", SeriesName: "Dauroh Tahfidz 2026", SeriesSlug: "dummy-video-dauroh-tahfidz-2026", EventDate: "2026-03-15", IsFeatured: false, URL: "https://www.youtube.com/watch?v=jNQXAC9IVRw", Thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg"},
		{Title: "[Dummy] Penutupan Dauroh Tahfidz", SeriesName: "Dauroh Tahfidz 2026", SeriesSlug: "dummy-video-dauroh-tahfidz-2026", EventDate: "2026-03-16", IsFeatured: false, URL: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", Thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg"},
		{Title: "[Dummy] Dokumentasi Mabit Santri", SeriesName: "Mabit Santri Ramadhan", SeriesSlug: "dummy-video-mabit-santri-ramadhan", EventDate: "2026-03-21", IsFeatured: true, URL: "https://www.youtube.com/watch?v=ScMzIvxBSi4", Thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg"},
		{Title: "[Dummy] Tausiyah Malam Ramadhan", SeriesName: "Mabit Santri Ramadhan", SeriesSlug: "dummy-video-mabit-santri-ramadhan", EventDate: "2026-03-21", IsFeatured: false, URL: "https://www.youtube.com/watch?v=E7wJTI-1dvQ", Thumbnail: "https://img.youtube.com/vi/E7wJTI-1dvQ/hqdefault.jpg"},
		{Title: "[Dummy] Praktik Manasik Haji", SeriesName: "Manasik Santri", SeriesSlug: "dummy-video-manasik-santri", EventDate: "2026-02-10", IsFeatured: true, URL: "https://www.youtube.com/watch?v=M7lc1UVf-VE", Thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg"},
		{Title: "[Dummy] Edukasi Rukun Haji", SeriesName: "Manasik Santri", SeriesSlug: "dummy-video-manasik-santri", EventDate: "2026-02-10", IsFeatured: false, URL: "https://www.youtube.com/watch?v=ysz5S6PUM-U", Thumbnail: "https://img.youtube.com/vi/ysz5S6PUM-U/hqdefault.jpg"},
		{Title: "[Dummy] Wisuda Tahfidz Sesi 1", SeriesName: "Wisuda Tahfidz", SeriesSlug: "dummy-video-wisuda-tahfidz", EventDate: "2026-01-28", IsFeatured: true, URL: "https://www.youtube.com/watch?v=jNQXAC9IVRw", Thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg"},
		{Title: "[Dummy] Wisuda Tahfidz Sesi 2", SeriesName: "Wisuda Tahfidz", SeriesSlug: "dummy-video-wisuda-tahfidz", EventDate: "2026-01-28", IsFeatured: false, URL: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", Thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg"},
		{Title: "[Dummy] Profil Santri dan Orang Tua", SeriesName: "Profil Kegiatan Pesantren", SeriesSlug: "dummy-video-profil-kegiatan-pesantren", EventDate: "2026-03-05", IsFeatured: true, URL: "https://www.youtube.com/watch?v=ScMzIvxBSi4", Thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg"},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO videos (title, series_name, series_slug, event_date, is_featured, url, thumbnail, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			item.Title,
			item.SeriesName,
			item.SeriesSlug,
			item.EventDate,
			item.IsFeatured,
			item.URL,
			item.Thumbnail,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertAgendas(tx *sql.Tx, count int) error {
	baseDate := time.Now().AddDate(0, 0, 3)
	seeds := []agendaSeed{
		{Title: "Dummy Agenda 01 - Kajian Rutin", StartDate: baseDate.Format("2006-01-02"), EndDate: "", TimeInfo: "07.30 - 09.00", Location: "Aula Utama", Description: "Kajian rutin pekanan untuk penguatan adab dan akhlak santri.", Category: "Kegiatan"},
		{Title: "Dummy Agenda 02 - Muhadharah Santri", StartDate: baseDate.AddDate(0, 0, 2).Format("2006-01-02"), EndDate: "", TimeInfo: "19.30 - 21.00", Location: "Masjid Pondok", Description: "Latihan pidato dan public speaking santri kelas akhir.", Category: "Kesantrian"},
		{Title: "Dummy Agenda 03 - Rapat Wali Santri", StartDate: baseDate.AddDate(0, 0, 5).Format("2006-01-02"), EndDate: "", TimeInfo: "09.00 - 11.00", Location: "Aula Pertemuan", Description: "Pemaparan progres akademik dan program semester berjalan.", Category: "Informasi"},
		{Title: "Dummy Agenda 04 - Lomba Tahfidz", StartDate: baseDate.AddDate(0, 0, 9).Format("2006-01-02"), EndDate: "", TimeInfo: "08.00 - 12.00", Location: "Lapangan Utama", Description: "Seleksi lomba tahfidz antar santri dengan penilaian tajwid dan hafalan.", Category: "Prestasi"},
		{Title: "Dummy Agenda 05 - Rihlah Edukasi", StartDate: baseDate.AddDate(0, 0, 12).Format("2006-01-02"), EndDate: "", TimeInfo: "06.00 - 16.00", Location: "Luar Pondok", Description: "Kegiatan rihlah edukatif untuk menambah wawasan dan kebersamaan santri.", Category: "Kegiatan"},
		{Title: "Dummy Agenda 06 - Ujian Tengah Semester", StartDate: baseDate.AddDate(0, 0, 15).Format("2006-01-02"), EndDate: baseDate.AddDate(0, 0, 20).Format("2006-01-02"), TimeInfo: "08.00 - 13.00", Location: "Ruang Kelas", Description: "Pelaksanaan ujian tengah semester untuk seluruh jenjang.", Category: "Akademik"},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO agendas (title, start_date, end_date, time_info, location, description, category) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			item.Title,
			item.StartDate,
			item.EndDate,
			item.TimeInfo,
			item.Location,
			item.Description,
			item.Category,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertFacilities(tx *sql.Tx, count int) error {
	imagePool := []string{
		"/assets/img/gedung.webp",
		"/assets/img/manasik.jpg",
		"/assets/img/belajar-kitab.jpg",
		"/assets/img/khalaqoh.jpg",
	}
	seeds := []facilitySeed{
		{Name: "Dummy Fasilitas 01 - Asrama Nyaman", Description: "Asrama santri dengan fasilitas tempat tidur bertingkat dan area belajar bersama.", ImageURL: imagePool[0], Category: "Asrama", IsHighlight: true},
		{Name: "Dummy Fasilitas 02 - Masjid Pondok", Description: "Masjid utama sebagai pusat ibadah, halaqah, dan kajian rutin.", ImageURL: imagePool[1], Category: "Ibadah", IsHighlight: true},
		{Name: "Dummy Fasilitas 03 - Perpustakaan", Description: "Perpustakaan dengan koleksi kitab, buku referensi, dan literasi modern.", ImageURL: imagePool[2], Category: "Pendidikan", IsHighlight: false},
		{Name: "Dummy Fasilitas 04 - Ruang Kelas", Description: "Ruang belajar modern dengan fasilitas pendukung pembelajaran aktif.", ImageURL: imagePool[3], Category: "Pendidikan", IsHighlight: false},
		{Name: "Dummy Fasilitas 05 - Lapangan Serbaguna", Description: "Lapangan untuk olahraga, apel, dan kegiatan outdoor santri.", ImageURL: imagePool[0], Category: "Olahraga", IsHighlight: false},
		{Name: "Dummy Fasilitas 06 - Kantin Sehat", Description: "Kantin dengan menu sehat untuk kebutuhan konsumsi harian santri.", ImageURL: imagePool[1], Category: "Layanan", IsHighlight: false},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO facilities (name, description, image_url, category, is_highlight) VALUES (?, ?, ?, ?, ?)`,
			item.Name,
			item.Description,
			item.ImageURL,
			item.Category,
			item.IsHighlight,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertTeachers(tx *sql.Tx, count int) error {
	seeds := []teacherSeed{
		{Name: "Dummy Ustadz 01 - Ahmad Fauzi", Subject: "Tahfidz", Bio: "Pembina tahfidz dengan fokus pembinaan adab dan kualitas hafalan.", ImageURL: "/assets/img/kepsek.png"},
		{Name: "Dummy Ustadz 02 - Abdullah Karim", Subject: "Kitab Kuning", Bio: "Pengajar kitab kuning dengan pendekatan turats dan pemahaman bertahap.", ImageURL: "/assets/img/belajar-kitab.jpg"},
		{Name: "Dummy Ustadzah 03 - Siti Aminah", Subject: "Bahasa Arab", Bio: "Pengampu bahasa Arab dan mufradat harian santri.", ImageURL: "/assets/img/khalaqoh.jpg"},
		{Name: "Dummy Ustadz 04 - Hasan Basri", Subject: "Fiqih", Bio: "Menguatkan pemahaman fiqih ibadah santri secara praktis.", ImageURL: "/assets/img/manasik.jpg"},
		{Name: "Dummy Ustadzah 05 - Nur Hidayah", Subject: "Akhlaq", Bio: "Fokus pada pembinaan karakter dan adab harian santri.", ImageURL: "/assets/img/tahfidz.jpg"},
		{Name: "Dummy Ustadz 06 - Ali Rahman", Subject: "Tahsin", Bio: "Pembina tahsin untuk meningkatkan kualitas bacaan Al-Qur'an.", ImageURL: "/assets/img/gedung.webp"},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO teachers (name, subject, bio, image_url) VALUES (?, ?, ?, ?)`,
			item.Name,
			item.Subject,
			item.Bio,
			item.ImageURL,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertPrograms(tx *sql.Tx, count int) error {
	seeds := []programSeed{
		{Title: "Program Tahfidz Intensif", Slug: "dummy-program-01", Category: "Tahfidz", Excerpt: "Program fokus hafalan dengan target bertahap dan bimbingan musyrif.", Content: "Program tahfidz intensif dirancang untuk memperkuat hafalan Al-Qur'an santri dengan sistem setoran harian dan evaluasi berkala. Pembinaan dilakukan melalui halaqah kecil agar kualitas bacaan terjaga.", ImageURL: "/assets/img/tahfidz.jpg", IsFeatured: true, OrderIndex: 1},
		{Title: "Kelas Kitab Kuning", Slug: "dummy-program-02", Category: "Diniyah", Excerpt: "Penguatan pemahaman kitab turats dengan metode yang sistematis.", Content: "Program kitab kuning memadukan metode sorogan dan bandongan agar santri memahami struktur bahasa Arab gundul. Materi disusun bertahap sesuai jenjang.", ImageURL: "/assets/img/belajar-kitab.jpg", IsFeatured: true, OrderIndex: 2},
		{Title: "Bahasa Arab Harian", Slug: "dummy-program-03", Category: "Bahasa", Excerpt: "Pembiasaan percakapan Arab di lingkungan pondok.", Content: "Santri dibimbing menggunakan bahasa Arab di area pondok melalui program mufradat harian, muhadharah, dan percakapan aktif.", ImageURL: "/assets/img/khalaqoh.jpg", IsFeatured: false, OrderIndex: 3},
		{Title: "Pembinaan Akhlak", Slug: "dummy-program-04", Category: "Karakter", Excerpt: "Kegiatan pembentukan karakter dan adab santri.", Content: "Program ini menekankan pembinaan adab terhadap guru, sesama, dan lingkungan. Kegiatan meliputi mentoring, muhasabah, dan pembiasaan ibadah.", ImageURL: "/assets/img/manasik.jpg", IsFeatured: false, OrderIndex: 4},
		{Title: "Life Skill Santri", Slug: "dummy-program-05", Category: "Keterampilan", Excerpt: "Pelatihan keterampilan praktis untuk kemandirian santri.", Content: "Santri dibekali keterampilan dasar seperti kewirausahaan, kepemimpinan, dan tata kelola kegiatan agar siap terjun ke masyarakat.", ImageURL: "/assets/img/gedung.webp", IsFeatured: false, OrderIndex: 5},
		{Title: "Ekstrakurikuler Olahraga", Slug: "dummy-program-06", Category: "Ekstra", Excerpt: "Program olahraga untuk menjaga kesehatan dan kekompakan santri.", Content: "Olahraga rutin meliputi futsal, badminton, dan kebugaran agar santri tetap sehat dan bugar.", ImageURL: "/assets/img/gedung.webp", IsFeatured: false, OrderIndex: 6},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO programs (title, slug, category, excerpt, content, image_url, is_featured, order_index, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
			item.Title,
			item.Slug,
			item.Category,
			item.Excerpt,
			item.Content,
			item.ImageURL,
			item.IsFeatured,
			item.OrderIndex,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertGallery(tx *sql.Tx, count int) error {
	imagePool := []string{
		"/assets/img/gedung.webp",
		"/assets/img/tahfidz.jpg",
		"/assets/img/khalaqoh.jpg",
		"/assets/img/manasik.jpg",
		"/assets/img/belajar-kitab.jpg",
	}
	albums := []struct {
		Name     string
		Slug     string
		Category string
		Date     string
	}{
		{Name: "Dokumentasi Dauroh Tahfidz", Slug: "dummy-album-dauroh-tahfidz", Category: "Tahfidz", Date: time.Now().AddDate(0, -1, 0).Format("2006-01-02")},
		{Name: "Mabit Santri Ramadhan", Slug: "dummy-album-mabit-ramadhan", Category: "Kegiatan", Date: time.Now().AddDate(0, -2, 0).Format("2006-01-02")},
		{Name: "Manasik Haji Santri", Slug: "dummy-album-manasik", Category: "Ibadah", Date: time.Now().AddDate(0, -3, 0).Format("2006-01-02")},
	}

	var seeds []gallerySeed
	for i, album := range albums {
		for j := 0; j < 4; j++ {
			index := (i*4 + j) % len(imagePool)
			seeds = append(seeds, gallerySeed{
				Title:        fmt.Sprintf("Dummy Foto %02d", i*4+j+1),
				Category:     album.Category,
				AlbumName:    album.Name,
				AlbumSlug:    album.Slug,
				EventDate:    album.Date,
				IsAlbumCover: j == 0,
				ImageURL:     imagePool[index],
			})
		}
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO gallery (title, category, album_name, album_slug, event_date, is_album_cover, image_url)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			item.Title,
			item.Category,
			item.AlbumName,
			item.AlbumSlug,
			item.EventDate,
			item.IsAlbumCover,
			item.ImageURL,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertDonationCampaigns(tx *sql.Tx, count int) error {
	seeds := []donationCampaignSeed{
		{Title: "Dummy Donasi 01 - Renovasi Masjid", Description: "Penggalangan dana untuk renovasi masjid pondok.", TargetAmount: 250000000, ImageURL: "/assets/img/gedung.webp", IsActive: 1, EndDate: time.Now().AddDate(0, 2, 0).Format("2006-01-02 15:04:05")},
		{Title: "Dummy Donasi 02 - Beasiswa Santri", Description: "Program beasiswa untuk santri berprestasi.", TargetAmount: 150000000, ImageURL: "/assets/img/tahfidz.jpg", IsActive: 1, EndDate: time.Now().AddDate(0, 3, 0).Format("2006-01-02 15:04:05")},
		{Title: "Dummy Donasi 03 - Fasilitas Asrama", Description: "Pengembangan fasilitas asrama yang lebih nyaman.", TargetAmount: 100000000, ImageURL: "/assets/img/khalaqoh.jpg", IsActive: 1, EndDate: time.Now().AddDate(0, 4, 0).Format("2006-01-02 15:04:05")},
	}

	for _, item := range sliceSeeds(seeds, count) {
		if _, err := tx.Exec(
			`INSERT INTO donation_campaigns (title, description, target_amount, image_url, is_active, end_date)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			item.Title,
			item.Description,
			item.TargetAmount,
			item.ImageURL,
			item.IsActive,
			item.EndDate,
		); err != nil {
			return err
		}
	}

	return nil
}

func insertDonations(tx *sql.Tx, count int) error {
	seeds := []donationSeed{
		{CampaignTitle: "Dummy Donasi 01 - Renovasi Masjid", DonorName: "Dummy Donatur 01", DonorPhone: "081234567890", Amount: 2500000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-01.jpg", Status: "pending"},
		{CampaignTitle: "Dummy Donasi 01 - Renovasi Masjid", DonorName: "Dummy Donatur 02", DonorPhone: "081234567891", Amount: 1500000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-02.jpg", Status: "verified"},
		{CampaignTitle: "Dummy Donasi 02 - Beasiswa Santri", DonorName: "Dummy Donatur 03", DonorPhone: "081234567892", Amount: 1000000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-03.jpg", Status: "pending"},
		{CampaignTitle: "Dummy Donasi 02 - Beasiswa Santri", DonorName: "Dummy Donatur 04", DonorPhone: "081234567893", Amount: 2000000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-04.jpg", Status: "verified"},
		{CampaignTitle: "Dummy Donasi 03 - Fasilitas Asrama", DonorName: "Dummy Donatur 05", DonorPhone: "081234567894", Amount: 500000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-05.jpg", Status: "pending"},
		{CampaignTitle: "Dummy Donasi 03 - Fasilitas Asrama", DonorName: "Dummy Donatur 06", DonorPhone: "081234567895", Amount: 750000, PaymentMethod: "transfer", ProofURL: "/uploads/dummy-proof-06.jpg", Status: "verified"},
	}

	for _, item := range sliceSeeds(seeds, count) {
		var campaignID int
		if err := tx.QueryRow(`SELECT id FROM donation_campaigns WHERE title = ? LIMIT 1`, item.CampaignTitle).Scan(&campaignID); err != nil {
			return err
		}

		if _, err := tx.Exec(
			`INSERT INTO donations (campaign_id, donor_name, donor_phone, amount, payment_method, proof_url, status, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			campaignID,
			item.DonorName,
			item.DonorPhone,
			item.Amount,
			item.PaymentMethod,
			item.ProofURL,
			item.Status,
		); err != nil {
			return err
		}
	}

	return nil
}

func getEnvInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	if value < 0 {
		return 0
	}
	return value
}

func sliceSeeds[T any](seeds []T, count int) []T {
	if count <= 0 || len(seeds) == 0 {
		return []T{}
	}
	if count >= len(seeds) {
		return seeds
	}
	return seeds[:count]
}

func tableExists(tx *sql.Tx, table string) bool {
	var name string
	err := tx.QueryRow(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, table).Scan(&name)
	return err == nil && name == table
}
