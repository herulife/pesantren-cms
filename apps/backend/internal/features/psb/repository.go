package psb

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/finance"
)

type Registration struct {
	ID                 int       `json:"id"`
	UserID             int       `json:"user_id"`
	FullName           string    `json:"full_name"`
	Nickname           string    `json:"nickname"`
	Gender             string    `json:"gender"`
	NIK                string    `json:"nik"`
	BirthPlace         string    `json:"birth_place"`
	BirthDate          string    `json:"birth_date"`
	Address            string    `json:"address"`
	ParentName         string    `json:"parent_name"`
	ParentPhone        string    `json:"parent_phone"`
	FatherName         string    `json:"father_name"`
	FatherJob          string    `json:"father_job"`
	FatherPhone        string    `json:"father_phone"`
	MotherName         string    `json:"mother_name"`
	MotherJob          string    `json:"mother_job"`
	MotherPhone        string    `json:"mother_phone"`
	SchoolOrigin       string    `json:"school_origin"`
	ProgramChoice      string    `json:"program_choice"`
	Jenjang            string    `json:"jenjang"`
	Category           string    `json:"category"`
	YatimDocURL        string    `json:"yatim_doc_url"`
	SktmDocURL         string    `json:"sktm_doc_url"`
	KKURL              string    `json:"kk_url"`
	IjazahURL          string    `json:"ijazah_url"`
	PasfotoURL         string    `json:"pasfoto_url"`
	AktaURL            string    `json:"akta_url"`
	KtpOrtuURL         string    `json:"ktp_ortu_url"`
	SuratKelulusanURL  string    `json:"surat_kelulusan_url"`
	FotoPendaftaranURL string    `json:"foto_pendaftaran_url"`
	PaymentProofURL    string    `json:"payment_proof_url"`
	PaymentAmount      int       `json:"payment_amount"`
	PaymentDate        string    `json:"payment_date"`
	PaymentStatus      string    `json:"payment_status"`
	PaymentNote        string    `json:"payment_note"`
	Status             string    `json:"status"`
	RejectionNote      string    `json:"rejection_note"`
	TestDate           string    `json:"test_date"`
	TestLocation       string    `json:"test_location"`
	TestScore          int       `json:"test_score"`
	TestNote           string    `json:"test_note"`
	ReRegDeadline      string    `json:"re_registration_deadline"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// PsbPayment adalah entri ledger terpisah untuk biaya pendaftaran PSB yang
// sudah lunas & terverifikasi (status 'paid'). Satu baris per registrasi.
type PsbPayment struct {
	ID             int       `json:"id"`
	RegistrationID int       `json:"registration_id"`
	UserID         int       `json:"user_id"`
	Code           string    `json:"code"`
	Amount         int       `json:"amount"`
	PaidAt         string    `json:"paid_at"`
	Method         string    `json:"method"`
	ProofURL       string    `json:"proof_url"`
	Status         string    `json:"status"`
	Notes          string    `json:"notes"`
	CreatedBy      int       `json:"created_by"`
	SantriName     string    `json:"santri_name,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

const registrationSelectColumns = `
	id,
	COALESCE(user_id, 0),
	COALESCE(full_name, ''),
	COALESCE(nickname, ''),
	COALESCE(gender, ''),
	COALESCE(nik, ''),
	COALESCE(birth_place, ''),
	COALESCE(birth_date, ''),
	COALESCE(address, ''),
	COALESCE(parent_name, ''),
	COALESCE(parent_phone, ''),
	COALESCE(father_name, ''),
	COALESCE(father_job, ''),
	COALESCE(father_phone, ''),
	COALESCE(mother_name, ''),
	COALESCE(mother_job, ''),
	COALESCE(mother_phone, ''),
	COALESCE(school_origin, ''),
	COALESCE(program_choice, ''),
	COALESCE(jenjang, ''),
	COALESCE(kk_url, ''),
	COALESCE(ijazah_url, ''),
	COALESCE(pasfoto_url, ''),
	COALESCE(akta_url, ''),
	COALESCE(ktp_ortu_url, ''),
	COALESCE(surat_kelulusan_url, ''),
	COALESCE(foto_pendaftaran_url, ''),
	COALESCE(payment_proof_url, ''),
	COALESCE(payment_amount, 0),
	COALESCE(payment_date, ''),
	COALESCE(payment_status, 'unpaid'),
	COALESCE(payment_note, ''),
	COALESCE(status, 'pending'),
	COALESCE(rejection_note, ''),
	COALESCE(test_date, ''),
	COALESCE(test_location, ''),
	COALESCE(test_score, 0),
	COALESCE(test_note, ''),
	COALESCE(re_registration_deadline, ''),
	COALESCE(category, 'reguler'),
	COALESCE(yatim_doc_url, ''),
	COALESCE(sktm_doc_url, ''),
	COALESCE(created_at, CURRENT_TIMESTAMP),
	COALESCE(updated_at, COALESCE(created_at, CURRENT_TIMESTAMP))
`

func scanRegistration(scanner interface {
	Scan(dest ...any) error
}) (*Registration, error) {
	var reg Registration
	var createdAt string
	var updatedAt string

	err := scanner.Scan(
		&reg.ID,
		&reg.UserID,
		&reg.FullName,
		&reg.Nickname,
		&reg.Gender,
		&reg.NIK,
		&reg.BirthPlace,
		&reg.BirthDate,
		&reg.Address,
		&reg.ParentName,
		&reg.ParentPhone,
		&reg.FatherName,
		&reg.FatherJob,
		&reg.FatherPhone,
		&reg.MotherName,
		&reg.MotherJob,
		&reg.MotherPhone,
		&reg.SchoolOrigin,
		&reg.ProgramChoice,
		&reg.Jenjang,
		&reg.KKURL,
		&reg.IjazahURL,
		&reg.PasfotoURL,
		&reg.AktaURL,
		&reg.KtpOrtuURL,
		&reg.SuratKelulusanURL,
		&reg.FotoPendaftaranURL,
		&reg.PaymentProofURL,
		&reg.PaymentAmount,
		&reg.PaymentDate,
		&reg.PaymentStatus,
		&reg.PaymentNote,
		&reg.Status,
		&reg.RejectionNote,
		&reg.TestDate,
		&reg.TestLocation,
		&reg.TestScore,
		&reg.TestNote,
		&reg.ReRegDeadline,
		&reg.Category,
		&reg.YatimDocURL,
		&reg.SktmDocURL,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return nil, err
	}

	reg.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	reg.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &reg, nil
}

func (r *Repository) FindAll(ctx context.Context, status string, limit, offset int) ([]Registration, int, error) {
	query := "SELECT " + registrationSelectColumns + " FROM registrations"
	var args []interface{}

	if status != "" {
		query += " WHERE status = ?"
		args = append(args, status)
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []Registration
	for rows.Next() {
		reg, err := scanRegistration(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, *reg)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM registrations"
	if status != "" {
		countQuery += " WHERE status = ?"
		err = r.db.QueryRowContext(ctx, countQuery, status).Scan(&total)
	} else {
		err = r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	}
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

// ExpectedPSBAmount membaca nominal resmi dari settings (0 bila belum dikonfigurasi).
func (r *Repository) ExpectedPSBAmount(ctx context.Context) int {
	var v string
	if err := r.db.QueryRowContext(ctx, `SELECT COALESCE(value, '') FROM settings WHERE key = 'psb_payment_amount'`).Scan(&v); err != nil {
		return 0
	}
	var n int
	fmt.Sscanf(strings.TrimSpace(v), "%d", &n)
	if n < 0 {
		return 0
	}
	return n
}

// JenjangQuota membaca kuota per jenjang dari settings (0 = tanpa batas).
func (r *Repository) JenjangQuota(ctx context.Context, jenjang string) int {
	key := "psb_quota_smp"
	if strings.ToLower(strings.TrimSpace(jenjang)) == "smk" {
		key = "psb_quota_smk"
	}
	var v string
	if err := r.db.QueryRowContext(ctx, `SELECT COALESCE(value, '') FROM settings WHERE key = ?`, key).Scan(&v); err != nil {
		return 0
	}
	var n int
	fmt.Sscanf(strings.TrimSpace(v), "%d", &n)
	if n < 0 {
		return 0
	}
	return n
}

// JenjangQuotaTx versi transaksi (dipakai saat SaveByUserID agar konsisten).
func (r *Repository) JenjangQuotaTx(ctx context.Context, tx *sql.Tx, jenjang string) int {
	key := "psb_quota_smp"
	if strings.ToLower(strings.TrimSpace(jenjang)) == "smk" {
		key = "psb_quota_smk"
	}
	var v string
	if err := tx.QueryRowContext(ctx, `SELECT COALESCE(value, '') FROM settings WHERE key = ?`, key).Scan(&v); err != nil {
		return 0
	}
	var n int
	fmt.Sscanf(strings.TrimSpace(v), "%d", &n)
	if n < 0 {
		return 0
	}
	return n
}

func (r *Repository) FindByID(ctx context.Context, id int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE id = ?", id)
	return scanRegistration(row)
}

func (r *Repository) CountByNIK(ctx context.Context, nik string, excludeUserID int) (int, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM registrations
		WHERE TRIM(nik) = ? AND user_id != ? AND TRIM(nik) <> ''
	`, strings.TrimSpace(nik), excludeUserID).Scan(&n)
	return n, err
}

func (r *Repository) FindByUserID(ctx context.Context, userID int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE user_id = ? LIMIT 1", userID)
	return scanRegistration(row)
}

// FindByPublicNumber mengembalikan data minimal untuk pengumuman publik
// (tanpa NIK/nomor HP/dokumen). Nomor pendaftaran = id registrasi.
func (r *Repository) FindByPublicNumber(ctx context.Context, id int) (*PublicPSBResult, error) {
	var res PublicPSBResult
	var status string
	var name string
	var program string
	var jenjang string
	var testDate string
	var rejectionNote string
	err := r.db.QueryRowContext(ctx, `
		SELECT id, COALESCE(full_name, ''), COALESCE(status, 'pending'),
		       COALESCE(program_choice, ''), COALESCE(jenjang, ''), COALESCE(test_date, ''), COALESCE(rejection_note, '')
		FROM registrations WHERE id = ?`, id).Scan(&id, &name, &status, &program, &jenjang, &testDate, &rejectionNote)
	if err != nil {
		return nil, err
	}
	res.ID = id
	res.No = fmt.Sprintf("PSB-%04d", id)
	res.FullName = name
	res.Status = status
	res.StatusLabel = psbStatusLabel(status)
	res.ProgramChoice = program
	res.Jenjang = jenjang
	res.TestDate = testDate
	if status == "rejected" && strings.TrimSpace(rejectionNote) != "" {
		res.RejectionNote = rejectionNote
	}
	return &res, nil
}

func (r *Repository) SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error) {
	existing, err := r.FindByUserID(ctx, userID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	if nik := strings.TrimSpace(reg.NIK); nik != "" {
		n, err := r.CountByNIK(ctx, nik, userID)
		if err != nil {
			return nil, err
		}
		if n > 0 {
			return nil, ErrDuplicateNIK
		}
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	parentName := reg.ParentName
	if parentName == "" {
		parentName = reg.FatherName
	}
	parentPhone := reg.ParentPhone
	if parentPhone == "" {
		parentPhone = reg.FatherPhone
	}
	reg.Category = strings.ToLower(strings.TrimSpace(reg.Category))
	if reg.Category == "" {
		reg.Category = "reguler"
	}
	if reg.Category != "reguler" && reg.Category != "yatim" && reg.Category != "dhuafa" {
		return nil, ErrInvalidCategory
	}
	reg.ProgramChoice = strings.ToLower(strings.TrimSpace(reg.ProgramChoice))
	if reg.ProgramChoice != "" && reg.ProgramChoice != "tahfidz" && reg.ProgramChoice != "bahasa" {
		return nil, ErrInvalidProgram
	}
	reg.Jenjang = strings.ToLower(strings.TrimSpace(reg.Jenjang))
	if reg.Jenjang != "" && reg.Jenjang != "smp" && reg.Jenjang != "smk" {
		return nil, ErrInvalidJenjang
	}
	if reg.Jenjang != "" {
		if q := r.JenjangQuotaTx(ctx, tx, reg.Jenjang); q > 0 {
			var jn int
			if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM registrations WHERE lower(jenjang) = ? AND lower(status) != 'rejected' AND user_id != ?`, reg.Jenjang, userID).Scan(&jn); err != nil {
				return nil, err
			}
			if jn >= q {
				return nil, ErrJenjangQuotaFull
			}
		}
	}
	if reg.Category == "yatim" {
		var yn int
		if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM registrations WHERE category = 'yatim' AND lower(status) != 'rejected' AND user_id != ?`, userID).Scan(&yn); err != nil {
			return nil, err
		}
		if yn >= MaxYatimQuota {
			return nil, ErrYatimQuotaFull
		}
	}

	// PRD36: kunci edit biodata portal setelah status review/tes/accepted/re_registration.
	// pending + rejected tetap boleh edit (revisi -> review ulang oleh panitia).
	if existing != nil {
		switch strings.ToLower(strings.TrimSpace(existing.Status)) {
		case "review", "tes", "accepted", "re_registration", "santri":
			return nil, ErrEditLocked
		}
	}

	if existing != nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE registrations
			SET full_name = ?, nickname = ?, gender = ?, nik = ?, birth_place = ?, birth_date = ?, address = ?,
			    parent_name = ?, parent_phone = ?, father_name = ?, father_job = ?, father_phone = ?,
			    mother_name = ?, mother_job = ?, mother_phone = ?, school_origin = ?, program_choice = ?, jenjang = ?, category = ?, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`,
			reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice, reg.Jenjang, reg.Category, userID,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO registrations (
				user_id, full_name, nickname, gender, nik, birth_place, birth_date, address,
				parent_name, parent_phone, father_name, father_job, father_phone,
				mother_name, mother_job, mother_phone, school_origin, program_choice, jenjang, category, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
			userID, reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice, reg.Jenjang, reg.Category,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByUserID(ctx, userID)
}

func (r *Repository) UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL, yatimDocURL, sktmDocURL, aktaURL, ktpOrtuURL, suratKelulusanURL, fotoPendaftaranURL string) (*Registration, error) {
	existing, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if kkURL == "" {
		kkURL = existing.KKURL
	}
	if ijazahURL == "" {
		ijazahURL = existing.IjazahURL
	}
	if pasfotoURL == "" {
		pasfotoURL = existing.PasfotoURL
	}
	if yatimDocURL == "" {
		yatimDocURL = existing.YatimDocURL
	}
	if sktmDocURL == "" {
		sktmDocURL = existing.SktmDocURL
	}
	if aktaURL == "" {
		aktaURL = existing.AktaURL
	}
	if ktpOrtuURL == "" {
		ktpOrtuURL = existing.KtpOrtuURL
	}
	if suratKelulusanURL == "" {
		suratKelulusanURL = existing.SuratKelulusanURL
	}
	if fotoPendaftaranURL == "" {
		fotoPendaftaranURL = existing.FotoPendaftaranURL
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE registrations
		SET kk_url = ?, ijazah_url = ?, pasfoto_url = ?, yatim_doc_url = ?, sktm_doc_url = ?,
		    akta_url = ?, ktp_ortu_url = ?, surat_kelulusan_url = ?, foto_pendaftaran_url = ?, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`, kkURL, ijazahURL, pasfotoURL, yatimDocURL, sktmDocURL, aktaURL, ktpOrtuURL, suratKelulusanURL, fotoPendaftaranURL, userID)
	if err != nil {
		return nil, err
	}

	return r.FindByUserID(ctx, userID)
}

var (
	ErrPaymentLocked     = errors.New("pembayaran sudah lunas, unggahan baru ditolak")
	ErrInvalidTransition = errors.New("transisi status tidak diizinkan")
	ErrDuplicateNIK      = errors.New("NIK sudah terdaftar atas nama pendaftar lain")
	ErrEditLocked        = errors.New("biodata terkunci karena sudah masuk tahap verifikasi panitia")
	ErrInvalidCategory   = errors.New("kategori pendaftar tidak valid")
	ErrInvalidJenjang    = errors.New("jenjang harus SMP atau SMK")
	ErrJenjangQuotaFull  = errors.New("kuota jenjang sudah penuh")
	ErrInvalidProgram    = errors.New("program pilihan tidak valid")
	ErrYatimQuotaFull    = errors.New("kuota beasiswa yatim sudah penuh")
	ErrYatimDocMissing   = errors.New("surat keterangan kematian wajib diunggah untuk kategori yatim")
	ErrDhuafaDocMissing  = errors.New("SKTM wajib diunggah untuk kategori dhuafa")
)

// MaxYatimQuota: beasiswa yatim dibatasi 5 penerima aktif (non-rejected).
const MaxYatimQuota = 5

func (r *Repository) UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error) {
	reg, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if reg.PaymentStatus == "paid" {
		return nil, ErrPaymentLocked
	}

	err = finance.RetryOnBusy(func() error {
		return r.updatePaymentByUserIDTx(ctx, reg, proofURL, amount, paymentDate)
	}, 10)
	if err != nil {
		if errors.Is(err, finance.ErrConflict) {
			return nil, ErrPaymentLocked
		}
		return nil, err
	}
	return r.FindByUserID(ctx, userID)
}

// updatePaymentByUserIDTx menyimpan bukti pembayaran wali (status pending) dan
// dalam transaksi yang sama membuat/memperbarui entri ledger psb_payments agar
// kwitansi sementara langsung tersedia bagi wali sebelum diverifikasi panitia.
func (r *Repository) updatePaymentByUserIDTx(ctx context.Context, reg *Registration, proofURL string, amount int, paymentDate string) error {
	tx, err := finance.BeginTx(r.db)
	if err != nil {
		return err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	res, err := tx.ExecContext(ctx, `
		UPDATE registrations
		SET payment_proof_url = ?, payment_amount = ?, payment_date = ?, payment_status = 'pending', payment_note = '', updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND COALESCE(payment_status, '') <> 'paid'
	`, proofURL, amount, paymentDate, reg.ID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return finance.ErrConflict
	}

	if err := r.upsertPaymentProofLedger(ctx, tx, reg.ID, reg.UserID, amount, paymentDate, proofURL); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

// upsertPaymentProofLedger membuat entri ledger psb_payments berstatus pending
// saat wali mengunggah bukti (kwitansi sementara), atau memperbarui baris yang
// sudah ada (mis. upload ulang saat rejected) dengan kode kwitansi tetap.
func (r *Repository) upsertPaymentProofLedger(ctx context.Context, tx *sql.Tx, registrationID, userID, amount int, paidAt, proofURL string) error {
	var id int
	err := tx.QueryRowContext(ctx, `SELECT id FROM psb_payments WHERE registration_id = ?`, registrationID).Scan(&id)
	if err == nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE psb_payments
			SET user_id = ?, amount = ?, paid_at = ?, proof_url = ?, status = 'pending', notes = ''
			WHERE id = ?`, userID, amount, paidAt, proofURL, id)
		return err
	}
	if err != sql.ErrNoRows {
		return err
	}

	code, err := finance.NextReceiptNo(tx, time.Now().Format("2006"))
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO psb_payments (registration_id, user_id, code, amount, paid_at, method, proof_url, status, notes, created_by)
		VALUES (?, ?, ?, ?, ?, 'transfer', ?, 'pending', '', ?)
	`, registrationID, userID, code, amount, paidAt, proofURL, userID)
	return err
}

// psbPaymentTransitions: paid terminal (lunas + tercatat di ledger). Regresi
// diperbolehkan selama belum lunas (mis. rejected -> pending untuk upload ulang).
var psbPaymentTransitions = map[string][]string{
	"":         {"unpaid", "pending", "paid", "rejected"},
	"unpaid":   {"pending", "paid", "rejected"},
	"pending":  {"paid", "rejected", "unpaid"},
	"rejected": {"pending", "paid", "unpaid"},
	"paid":     {"paid"},
}

func psbTransitionAllowed(cur, next string, table map[string][]string) bool {
	nexts, ok := table[cur]
	if !ok {
		return false
	}
	for _, n := range nexts {
		if n == next {
			return true
		}
	}
	return false
}

// psbStatusTransitions: accepted/re_registration boleh dikembalikan ke review
// bila perlu; santri (acceptToSantri) tidak represent status registrasi lagi.
var psbStatusTransitions = map[string][]string{
	"":                {"pending", "review", "tes", "accepted", "re_registration", "rejected"},
	"pending":         {"pending", "review", "tes", "accepted", "re_registration", "rejected"},
	"review":          {"pending", "review", "tes", "accepted", "re_registration", "rejected"},
	"tes":             {"tes", "review", "accepted", "re_registration", "rejected"},
	"rejected":        {"pending", "review", "tes", "accepted", "re_registration", "rejected"},
	"accepted":        {"accepted", "re_registration", "review", "rejected"},
	"re_registration": {"re_registration", "accepted", "rejected"},
}

// UpdatePaymentStatus mengubah status pembayaran secara atomik (BEGIN IMMEDIATE
// + conditional UPDATE). Saat transisi ke 'paid', entri ledger psb_payments
// ditulis sekali (idempotent — re-mark tidak menduplikasi baris).
func (r *Repository) UpdatePaymentStatus(ctx context.Context, id int, status string, note string, actorID int) error {
	if err := finance.RetryOnBusy(func() error {
		return r.updatePaymentStatusTx(ctx, id, status, note, actorID)
	}, 10); err != nil {
		return err
	}
	r.tryAutoAcceptToSantri(ctx, id)
	return nil
}

func (r *Repository) updatePaymentStatusTx(ctx context.Context, id int, status string, note string, actorID int) error {
	tx, err := finance.BeginTx(r.db)
	if err != nil {
		return err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	var cur string
	var userID int
	var amount int
	var paidAt string
	var proof string
	err = tx.QueryRowContext(ctx, `
		SELECT COALESCE(payment_status, ''), COALESCE(user_id, 0), COALESCE(payment_amount, 0),
		       COALESCE(payment_date, ''), COALESCE(payment_proof_url, '')
		FROM registrations WHERE id = ?`, id).Scan(&cur, &userID, &amount, &paidAt, &proof)
	if err != nil {
		return err
	}
	if !psbTransitionAllowed(cur, status, psbPaymentTransitions) {
		return ErrInvalidTransition
	}

	res, err := tx.ExecContext(ctx, `
		UPDATE registrations
		SET payment_status = ?, payment_note = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND COALESCE(payment_status, '') = ?
	`, status, note, id, cur)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return finance.ErrConflict
	}

	if status == "paid" {
		if err := r.recordPsbLedgerTx(ctx, tx, id, userID, amount, paidAt, proof, note, actorID); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

// recordPsbLedgerTx menulis/memperbarui entri ledger psb_payments untuk
// registrasi yang lunas. Jika baris sudah ada (kwitansi sementara dari upload
// bukti wali), baris diperbarui ke paid dengan kode kwitansi yang sama.
func (r *Repository) recordPsbLedgerTx(ctx context.Context, tx *sql.Tx, registrationID, userID, amount int, paidAt, proof, note string, actorID int) error {
	var id int
	err := tx.QueryRowContext(ctx, `SELECT id FROM psb_payments WHERE registration_id = ?`, registrationID).Scan(&id)
	if err == nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE psb_payments
			SET status = 'paid', amount = ?, paid_at = ?, proof_url = ?, notes = ?
			WHERE id = ?`, amount, paidAt, proof, note, id)
		return err
	}
	if err != sql.ErrNoRows {
		return err
	}

	code, err := finance.NextReceiptNo(tx, time.Now().Format("2006"))
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO psb_payments (registration_id, user_id, code, amount, paid_at, method, proof_url, status, notes, created_by)
		VALUES (?, ?, ?, ?, ?, 'transfer', ?, 'paid', ?, ?)
	`, registrationID, userID, code, amount, paidAt, proof, note, actorID)
	return err
}

// GetMyReceipt mengembalikan entri ledger pembayaran PSB milik user (kwitansi
// wali). Tersedia sejak bukti pembayaran dikirim (status pending) sampai lunas.
// Error sql.ErrNoRows dibiarkan bila belum ada kwitansi sama sekali.
func (r *Repository) GetMyReceipt(ctx context.Context, userID int) (*PsbPayment, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT p.id, p.registration_id, p.user_id, p.code, p.amount, p.paid_at, p.method, p.proof_url,
		       p.status, p.notes, p.created_by, COALESCE(reg.full_name, ''), p.created_at
		FROM psb_payments p
		LEFT JOIN registrations reg ON reg.id = p.registration_id
		WHERE p.user_id = ? LIMIT 1`, userID)
	var p PsbPayment
	var createdAt string
	err := row.Scan(&p.ID, &p.RegistrationID, &p.UserID, &p.Code, &p.Amount, &p.PaidAt, &p.Method,
		&p.ProofURL, &p.Status, &p.Notes, &p.CreatedBy, &p.SantriName, &createdAt)
	if err != nil {
		return nil, err
	}
	p.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	return &p, nil
}

// StatusUpdateOptions membawa data pelengkap saat admin mengubah status
// registrasi: jadwal/lokasi/nilai tes, batas daftar ulang, dst.
type StatusUpdateOptions struct {
	TestDate      string
	TestLocation  string
	TestScore     *int
	TestNote      string
	ReRegDeadline string
}

// UpdateStatus mengubah status registrasi secara atomik (conditional UPDATE
// terhadap status saat ini sehingga dua admin tidak bisa menimpa satu sama lain).
func (r *Repository) UpdateStatus(ctx context.Context, id int, status string, note string, opts *StatusUpdateOptions) error {
	if err := finance.RetryOnBusy(func() error {
		return r.updateStatusTx(ctx, id, status, note, opts)
	}, 10); err != nil {
		return err
	}
	r.tryAutoAcceptToSantri(ctx, id)
	return nil
}

func (r *Repository) updateStatusTx(ctx context.Context, id int, status string, note string, opts *StatusUpdateOptions) error {
	tx, err := finance.BeginTx(r.db)
	if err != nil {
		return err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	var cur string
	if err := tx.QueryRowContext(ctx, `SELECT COALESCE(status,'') FROM registrations WHERE id = ?`, id).Scan(&cur); err != nil {
		return err
	}
	if !psbTransitionAllowed(cur, status, psbStatusTransitions) {
		return ErrInvalidTransition
	}

	v := StatusUpdateOptions{}
	if opts != nil {
		v = *opts
	}

	scoreFlag := 0
	scoreVal := 0
	if v.TestScore != nil {
		scoreFlag = 1
		scoreVal = *v.TestScore
	}

	// rejection_note diisi hanya saat menolak; status lain membiarkannya utuh.
	// Field tes & daftar ulang hanya ditimpa jika diisi (biarkan nilai lama utuh).
	res, err := tx.ExecContext(ctx, `
		UPDATE registrations
		SET status = ?, updated_at = CURRENT_TIMESTAMP,
		    rejection_note = CASE WHEN ? = 'rejected' THEN ? ELSE rejection_note END,
		    test_date = CASE WHEN ? <> '' THEN ? ELSE test_date END,
		    test_location = CASE WHEN ? <> '' THEN ? ELSE test_location END,
		    test_note = CASE WHEN ? <> '' THEN ? ELSE test_note END,
		    re_registration_deadline = CASE WHEN ? <> '' THEN ? ELSE re_registration_deadline END,
		    test_score = CASE WHEN ? = 1 THEN ? ELSE test_score END
		WHERE id = ? AND COALESCE(status,'') = ?
	`,
		status, status, note,
		v.TestDate, v.TestDate,
		v.TestLocation, v.TestLocation,
		v.TestNote, v.TestNote,
		v.ReRegDeadline, v.ReRegDeadline,
		scoreFlag, scoreVal,
		id, cur)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return finance.ErrConflict
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

// Delete menghapus registrasi + ledger kwitansinya dalam satu transaksi.
// Ditolak bila pendaftar sudah dipindahkan menjadi santri.
func (r *Repository) Delete(ctx context.Context, id int) error {
	return finance.RetryOnBusy(func() error {
		tx, err := finance.BeginTx(r.db)
		if err != nil {
			return err
		}
		committed := false
		defer func() {
			if !committed {
				_ = tx.Rollback()
			}
		}()
		var userID int
		var status string
		if err := tx.QueryRowContext(ctx, `SELECT COALESCE(user_id, 0), COALESCE(status, '') FROM registrations WHERE id = ?`, id).Scan(&userID, &status); err != nil {
			return err
		}
		if strings.ToLower(strings.TrimSpace(status)) == "santri" {
			return ErrAlreadySantri
		}
		if userID > 0 {
			var n int
			if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM santri WHERE user_id = ?`, userID).Scan(&n); err != nil {
				return err
			}
			if n > 0 {
				return ErrAlreadySantri
			}
		}
		if _, err := tx.ExecContext(ctx, `DELETE FROM psb_payments WHERE registration_id = ?`, id); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `DELETE FROM registrations WHERE id = ?`, id); err != nil {
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
		committed = true
		return nil
	}, 10)
}

var (
	ErrNotAccepted     = errors.New("pendaftar harus berstatus diterima/daftar ulang sebelum dipindahkan")
	ErrPaymentNotLunas = errors.New("pembayaran pendaftaran belum lunas")
	ErrAlreadySantri   = errors.New("pendaftar ini sudah menjadi santri")
)

type SantriResult struct {
	ID   int    `json:"id"`
	NIS  string `json:"nis"`
	Name string `json:"name"`
}

// AcceptToSantri memindahkan pendaftar yang sudah accepted & paid menjadi
// data santri (transaksi atomik, idempotent via UNIQUE nis + cek user_id).
func (r *Repository) AcceptToSantri(ctx context.Context, id int) (*SantriResult, error) {
	var result *SantriResult
	err := finance.RetryOnBusy(func() error {
		tx, err := finance.BeginTx(r.db)
		if err != nil {
			return err
		}
		committed := false
		defer func() {
			if !committed {
				_ = tx.Rollback()
			}
		}()

		reg, err := scanRegistration(tx.QueryRowContext(ctx, `SELECT `+registrationSelectColumns+` FROM registrations WHERE id = ?`, id))
		if err != nil {
			return err
		}

		if strings.ToLower(strings.TrimSpace(reg.PaymentStatus)) != "paid" {
			return ErrPaymentNotLunas
		}
		if strings.ToLower(strings.TrimSpace(reg.Category)) == "yatim" {
			if strings.TrimSpace(reg.YatimDocURL) == "" {
				return ErrYatimDocMissing
			}
			var yn int
			if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM registrations WHERE category = 'yatim' AND lower(status) != 'rejected' AND id != ?`, id).Scan(&yn); err != nil {
				return err
			}
			if yn >= MaxYatimQuota {
				return ErrYatimQuotaFull
			}
		}
		if strings.ToLower(strings.TrimSpace(reg.Category)) == "dhuafa" && strings.TrimSpace(reg.SktmDocURL) == "" {
			return ErrDhuafaDocMissing
		}
		st := strings.ToLower(strings.TrimSpace(reg.Status))
		if st != "accepted" && st != "re_registration" {
			return ErrNotAccepted
		}
		if reg.UserID > 0 {
			var exist int
			if err := tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM santri WHERE user_id = ?`, reg.UserID).Scan(&exist); err != nil {
				return err
			}
			if exist > 0 {
				return ErrAlreadySantri
			}
		}

		var maxID int
		if err := tx.QueryRowContext(ctx, `SELECT COALESCE(MAX(id), 0) FROM santri`).Scan(&maxID); err != nil {
			return err
		}
		year := time.Now().Format("2006")
		jenjang := strings.ToLower(strings.TrimSpace(reg.Jenjang))
		if jenjang != "smp" && jenjang != "smk" {
			return ErrInvalidJenjang
		}
		parentName := firstNonEmpty(reg.ParentName, reg.FatherName, reg.MotherName)
		parentPhone := firstNonEmpty(reg.ParentPhone, reg.FatherPhone, reg.MotherPhone)
		initialClass := "VII"
		if jenjang == "smk" {
			initialClass = "X"
		}

		var santriID int64
		var santriNIS string
		found := false
		for nextID := maxID + 1; nextID <= maxID+1+999 && !found; nextID++ {
			nis := fmt.Sprintf("%s%04d", year, nextID)
			res, err := tx.ExecContext(ctx, `
				INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, nik, father_name, father_phone, mother_name, mother_phone, registration_id, photo_url, user_id, jenjang, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`, nis, reg.FullName, reg.Nickname, reg.Gender, reg.BirthPlace, reg.BirthDate,
				reg.Address, initialClass, year, parentName, parentPhone, reg.NIK, reg.FatherName, reg.FatherPhone, reg.MotherName, reg.MotherPhone, id, reg.PasfotoURL, nullableUserID(reg.UserID), jenjang)
			if err != nil {
				if strings.Contains(strings.ToLower(err.Error()), "unique") {
					continue
				}
				return err
			}
			santriID, _ = res.LastInsertId()
			santriNIS = nis
			found = true
		}
		if !found {
			return errors.New("gagal menghasilkan NIS unik")
		}

		// AUDIT-PSB1: tandai registrasi sebagai santri agar tidak bisa dipindahkan ulang.
		// Status 'santri' terminal (tidak ada di psbStatusTransitions -> perubahan lanjut ditolak).
		if _, err := tx.ExecContext(ctx, `UPDATE registrations SET status = 'santri', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, id); err != nil {
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}
		committed = true
		result = &SantriResult{ID: int(santriID), NIS: santriNIS, Name: reg.FullName}
		return nil
	}, 10)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}

func nullableUserID(uid int) interface{} {
	if uid <= 0 {
		return nil
	}
	return uid
}

// tryAutoAcceptToSantri memindahkan pendaftar menjadi santri secara otomatis
// begitu syarat terpenuhi (accepted/re_registration + lunas). Best-effort:
// kondisi belum terpenuhi -> diam; error tak terduga -> catat audit gagal,
// operasi pemanggil tetap sukses (panitia bisa pindahkan manual via tombol).
func (r *Repository) tryAutoAcceptToSantri(ctx context.Context, id int) {
	res, err := r.AcceptToSantri(ctx, id)
	if err != nil {
		if errors.Is(err, ErrNotAccepted) || errors.Is(err, ErrPaymentNotLunas) ||
			errors.Is(err, ErrAlreadySantri) || errors.Is(err, sql.ErrNoRows) {
			return
		}
		audit.Record(ctx, audit.Entry{ActorRole: "system", Action: "AUTO_ACCEPT_PSB_TO_SANTRI", Entity: "registration", EntityID: strconv.Itoa(id), Result: "failed: " + err.Error()})
		return
	}
	audit.Record(ctx, audit.Entry{ActorRole: "system", Action: "AUTO_ACCEPT_PSB_TO_SANTRI", Entity: "registration", EntityID: strconv.Itoa(id), After: map[string]interface{}{"santri_id": res.ID, "nis": res.NIS, "name": res.Name}})
}
