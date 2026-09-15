package psb

import (
	"errors"
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"almaparung-api/internal/platform/finance"
)

type Registration struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	FullName        string    `json:"full_name"`
	Nickname        string    `json:"nickname"`
	Gender          string    `json:"gender"`
	NIK             string    `json:"nik"`
	BirthPlace      string    `json:"birth_place"`
	BirthDate       string    `json:"birth_date"`
	Address         string    `json:"address"`
	ParentName      string    `json:"parent_name"`
	ParentPhone     string    `json:"parent_phone"`
	FatherName      string    `json:"father_name"`
	FatherJob       string    `json:"father_job"`
	FatherPhone     string    `json:"father_phone"`
	MotherName      string    `json:"mother_name"`
	MotherJob       string    `json:"mother_job"`
	MotherPhone     string    `json:"mother_phone"`
	SchoolOrigin    string    `json:"school_origin"`
	ProgramChoice   string    `json:"program_choice"`
	KKURL           string    `json:"kk_url"`
	IjazahURL       string    `json:"ijazah_url"`
	PasfotoURL      string    `json:"pasfoto_url"`
	PaymentProofURL string    `json:"payment_proof_url"`
	PaymentAmount   int       `json:"payment_amount"`
	PaymentDate     string    `json:"payment_date"`
	PaymentStatus   string    `json:"payment_status"`
	PaymentNote     string    `json:"payment_note"`
	Status          string    `json:"status"`
	RejectionNote   string    `json:"rejection_note"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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
	COALESCE(kk_url, ''),
	COALESCE(ijazah_url, ''),
	COALESCE(pasfoto_url, ''),
	COALESCE(payment_proof_url, ''),
	COALESCE(payment_amount, 0),
	COALESCE(payment_date, ''),
	COALESCE(payment_status, 'unpaid'),
	COALESCE(payment_note, ''),
	COALESCE(status, 'pending'),
	COALESCE(rejection_note, ''),
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
		&reg.KKURL,
		&reg.IjazahURL,
		&reg.PasfotoURL,
		&reg.PaymentProofURL,
		&reg.PaymentAmount,
		&reg.PaymentDate,
		&reg.PaymentStatus,
		&reg.PaymentNote,
		&reg.Status,
		&reg.RejectionNote,
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

func (r *Repository) FindByID(ctx context.Context, id int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE id = ?", id)
	return scanRegistration(row)
}

func (r *Repository) FindByUserID(ctx context.Context, userID int) (*Registration, error) {
	row := r.db.QueryRowContext(ctx, "SELECT "+registrationSelectColumns+" FROM registrations WHERE user_id = ? LIMIT 1", userID)
	return scanRegistration(row)
}

func (r *Repository) SaveByUserID(ctx context.Context, userID int, reg Registration) (*Registration, error) {
	existing, err := r.FindByUserID(ctx, userID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
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

	if existing != nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE registrations
			SET full_name = ?, nickname = ?, gender = ?, nik = ?, birth_place = ?, birth_date = ?, address = ?,
			    parent_name = ?, parent_phone = ?, father_name = ?, father_job = ?, father_phone = ?,
			    mother_name = ?, mother_job = ?, mother_phone = ?, school_origin = ?, program_choice = ?, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?
		`,
			reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice, userID,
		)
		if err != nil {
			return nil, err
		}
	} else {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO registrations (
				user_id, full_name, nickname, gender, nik, birth_place, birth_date, address,
				parent_name, parent_phone, father_name, father_job, father_phone,
				mother_name, mother_job, mother_phone, school_origin, program_choice, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
			userID, reg.FullName, reg.Nickname, reg.Gender, reg.NIK, reg.BirthPlace, reg.BirthDate, reg.Address,
			parentName, parentPhone, reg.FatherName, reg.FatherJob, reg.FatherPhone,
			reg.MotherName, reg.MotherJob, reg.MotherPhone, reg.SchoolOrigin, reg.ProgramChoice,
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

func (r *Repository) UpdateDocumentsByUserID(ctx context.Context, userID int, kkURL, ijazahURL, pasfotoURL string) (*Registration, error) {
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

	_, err = r.db.ExecContext(ctx, `
		UPDATE registrations
		SET kk_url = ?, ijazah_url = ?, pasfoto_url = ?, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`, kkURL, ijazahURL, pasfotoURL, userID)
	if err != nil {
		return nil, err
	}

	return r.FindByUserID(ctx, userID)
}

var (
	ErrPaymentLocked = errors.New("pembayaran sudah lunas, unggahan baru ditolak")
	ErrInvalidTransition = errors.New("transisi status tidak diizinkan")
)

func (r *Repository) UpdatePaymentByUserID(ctx context.Context, userID int, proofURL string, amount int, paymentDate string) (*Registration, error) {
	if _, err := r.FindByUserID(ctx, userID); err != nil {
		return nil, err
	}

	res, err := r.db.ExecContext(ctx, `
		UPDATE registrations
		SET payment_proof_url = ?, payment_amount = ?, payment_date = ?, payment_status = 'pending', payment_note = '', updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ? AND COALESCE(payment_status, '') <> 'paid'
	`, proofURL, amount, paymentDate, userID)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		cur, ferr := r.FindByUserID(ctx, userID)
		if ferr != nil {
			return nil, ferr
		}
		if cur.PaymentStatus == "paid" {
			return nil, ErrPaymentLocked
		}
		return nil, ErrPaymentLocked
	}

	return r.FindByUserID(ctx, userID)
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

// psbStatusTransitions: accepted terminal kecuali pencabutan eksplisit.
var psbStatusTransitions = map[string][]string{
	"":         {"pending", "review", "accepted", "rejected"},
	"pending":  {"pending", "review", "accepted", "rejected"},
	"review":   {"pending", "review", "accepted", "rejected"},
	"rejected": {"pending", "review", "accepted", "rejected"},
	"accepted": {"accepted", "rejected"},
}

// UpdatePaymentStatus mengubah status pembayaran secara atomik (BEGIN IMMEDIATE
// + conditional UPDATE). Saat transisi ke 'paid', entri ledger psb_payments
// ditulis sekali (idempotent — re-mark tidak menduplikasi baris).
func (r *Repository) UpdatePaymentStatus(ctx context.Context, id int, status string, note string, actorID int) error {
	return finance.RetryOnBusy(func() error {
		return r.updatePaymentStatusTx(ctx, id, status, note, actorID)
	}, 10)
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

// recordPsbLedgerTx menulis entri ledger psb_payments untuk registrasi yang
// lunas. Idempotent: jika baris sudah ada, eksekusi dibiarkan sukses tanpa
// menulis ulang (replay aman).
func (r *Repository) recordPsbLedgerTx(ctx context.Context, tx *sql.Tx, registrationID, userID, amount int, paidAt, proof, note string, actorID int) error {
	var exists int
	if err := tx.QueryRowContext(ctx, `SELECT 1 FROM psb_payments WHERE registration_id = ?`, registrationID).Scan(&exists); err == nil {
		return nil
	} else if err != sql.ErrNoRows {
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
// wali). Dibiarkan error sql.ErrNoRows bila belum lunas.
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

// UpdateStatus mengubah status registrasi secara atomik (conditional UPDATE
// terhadap status saat ini sehingga dua admin tidak bisa menimpa satu sama lain).
func (r *Repository) UpdateStatus(ctx context.Context, id int, status string, note string) error {
	return finance.RetryOnBusy(func() error {
		return r.updateStatusTx(ctx, id, status, note)
	}, 10)
}

func (r *Repository) updateStatusTx(ctx context.Context, id int, status string, note string) error {
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

	// rejection_note diisi hanya saat menolak; status lain membiarkannya utuh.
	res, err := tx.ExecContext(ctx, `
		UPDATE registrations
		SET status = ?, updated_at = CURRENT_TIMESTAMP,
		    rejection_note = CASE WHEN ? = 'rejected' THEN ? ELSE rejection_note END
		WHERE id = ? AND COALESCE(status,'') = ?
	`, status, status, note, id, cur)
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

func (r *Repository) Delete(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM registrations WHERE id = ?", id)
	return err
}

var (
	ErrNotAccepted     = errors.New("pendaftar harus berstatus accepted sebelum dipindahkan")
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
		if strings.ToLower(strings.TrimSpace(reg.Status)) != "accepted" {
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
		parentName := firstNonEmpty(reg.ParentName, reg.FatherName, reg.MotherName)
		parentPhone := firstNonEmpty(reg.ParentPhone, reg.FatherPhone, reg.MotherPhone)
		class := firstNonEmpty(reg.ProgramChoice, "Baru")

		var santriID int64
		found := false
		for nextID := maxID + 1; nextID <= maxID+1+999 && !found; nextID++ {
			nis := fmt.Sprintf("%s%04d", year, nextID)
			res, err := tx.ExecContext(ctx, `
				INSERT INTO santri (nis, name, nickname, gender, birth_place, birth_date, address, class, angkatan, status, parent_name, parent_phone, user_id, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`, nis, reg.FullName, reg.Nickname, reg.Gender, reg.BirthPlace, reg.BirthDate,
				reg.Address, class, year, parentName, parentPhone, nullableUserID(reg.UserID))
			if err != nil {
				if strings.Contains(strings.ToLower(err.Error()), "unique") {
					continue
				}
				return err
			}
			santriID, _ = res.LastInsertId()
			found = true
		}
		if !found {
			return errors.New("gagal menghasilkan NIS unik")
		}

		if err := tx.Commit(); err != nil {
			return err
		}
		committed = true
		result = &SantriResult{ID: int(santriID), Name: reg.FullName}
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
