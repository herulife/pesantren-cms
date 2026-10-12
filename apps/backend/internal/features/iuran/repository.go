package iuran

import (
	"darussunnah-api/internal/platform/finance"
	"darussunnah-api/internal/platform/audit"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	errBillAmountBelowPaid = errors.New("nominal tagihan tidak boleh lebih kecil dari yang sudah dibayar")
	errBillHasPayments     = errors.New("tagihan yang sudah ada pembayaran tidak bisa dihapus")
	errBillAlreadyPaid     = errors.New("tagihan sudah lunas")
	errBillOverpay         = errors.New("jumlah bayar melebihi sisa tagihan")
)

type IuranBill struct {
	ID            int       `json:"id"`
	SantriID      int       `json:"santri_id"`
	SantriName    string    `json:"santri_name,omitempty"`
	SantriNIS     string    `json:"santri_nis,omitempty"`
	SantriClass   string    `json:"santri_class,omitempty"`
	Name          string    `json:"name"`
	Period        string    `json:"period"`
	Amount        int       `json:"amount"`
	PaidAmount    int       `json:"paid_amount"`
	Status        string    `json:"status"` // unpaid, partial, paid, pending
	DueDate       string    `json:"due_date"`
	PaidMethod    string    `json:"paid_method"`
	PaidAt        string    `json:"paid_at,omitempty"`
	Notes         string    `json:"notes"`
	PaymentProof  string    `json:"payment_proof,omitempty"`
	PendingAmount int       `json:"pending_amount,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type IuranSantri struct {
	ID    int    `json:"id"`
	NIS   string `json:"nis"`
	Name  string `json:"name"`
	Class string `json:"class"`
}

type IuranSummary struct {
	Period       string `json:"period"`
	Billed       int    `json:"billed"`
	Collected    int    `json:"collected"`
	Outstanding  int    `json:"outstanding"`
	CountTotal   int    `json:"count_total"`
	CountPaid    int    `json:"count_paid"`
	CountPartial int    `json:"count_partial"`
	CountUnpaid  int    `json:"count_unpaid"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func scanBill(rows *sql.Rows) (IuranBill, error) {
	var b IuranBill
	var paidAt sql.NullString
	var createdAt, updatedAt string
	err := rows.Scan(&b.ID, &b.SantriID, &b.SantriName, &b.SantriNIS, &b.SantriClass,
		&b.Name, &b.Period, &b.Amount, &b.PaidAmount, &b.Status, &b.DueDate,
		&b.PaidMethod, &paidAt, &b.Notes, &b.PaymentProof, &b.PendingAmount, &createdAt, &updatedAt)
	if err != nil {
		return b, err
	}
	if paidAt.Valid {
		b.PaidAt = paidAt.String
	}
	b.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	b.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return b, nil
}

const billSelect = `
	SELECT b.id, b.santri_id, s.name, s.nis, s.class,
	       b.name, b.period, b.amount, b.paid_amount, b.status, b.due_date,
	       b.paid_method, b.paid_at, b.notes, b.payment_proof, b.pending_amount, b.created_at, b.updated_at
	FROM iuran_bills b
	JOIN santri s ON s.id = b.santri_id
`

func (r *Repository) ListBills(period, status string, santriID int, name string) ([]IuranBill, error) {
	query := billSelect + ` WHERE 1=1`
	var args []interface{}
	if name != "" {
		query += ` AND b.name = ?`
		args = append(args, name)
	}
	if period != "" {
		query += ` AND b.period = ?`
		args = append(args, period)
	}
	if status != "" {
		query += ` AND b.status = ?`
		args = append(args, status)
	}
	if santriID > 0 {
		query += ` AND b.santri_id = ?`
		args = append(args, santriID)
	}
	query += ` ORDER BY b.period DESC, s.name ASC`
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bills := []IuranBill{}
	for rows.Next() {
		b, err := scanBill(rows)
		if err != nil {
			return nil, err
		}
		bills = append(bills, b)
	}
	return bills, nil
}

func (r *Repository) GetBill(id int) (*IuranBill, error) {
	rows, err := r.db.Query(billSelect+` WHERE b.id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	b, err := scanBill(rows)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func IsDuplicateError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func (r *Repository) CreateBill(b *IuranBill) error {
	_, err := r.db.Exec(
		`INSERT INTO iuran_bills (santri_id, name, period, amount, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
		b.SantriID, b.Name, b.Period, b.Amount, b.DueDate, b.Notes,
	)
	return err
}

func (r *Repository) GenerateBills(name, period string, amount int, dueDate, class string, santriIDs []int) (created int, skipped int, err error) {
	var ids []int
	if len(santriIDs) > 0 {
		ids = santriIDs
	} else if class != "" {
		rows, err := r.db.Query(`SELECT id FROM santri WHERE status = 'aktif' AND class = ? ORDER BY id`, class)
		if err != nil {
			return 0, 0, err
		}
		for rows.Next() {
			var id int
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return 0, 0, err
			}
			ids = append(ids, id)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return 0, 0, err
		}
	} else {
		rows, err := r.db.Query(`SELECT id FROM santri WHERE status = 'aktif' ORDER BY id`)
		if err != nil {
			return 0, 0, err
		}
		for rows.Next() {
			var id int
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return 0, 0, err
			}
			ids = append(ids, id)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return 0, 0, err
		}
	}

	for _, id := range ids {
		res, err := r.db.Exec(
			`INSERT OR IGNORE INTO iuran_bills (santri_id, name, period, amount, due_date) VALUES (?, ?, ?, ?, ?)`,
			id, name, period, amount, dueDate,
		)
		if err != nil {
			return created, skipped, err
		}
		if n, _ := res.RowsAffected(); n > 0 {
			created++
		} else {
			skipped++
		}
	}
	return created, skipped, nil
}

func (r *Repository) UpdateBill(id, amount int, dueDate, notes string) error {
	var paid int
	err := r.db.QueryRow(`SELECT paid_amount FROM iuran_bills WHERE id = ?`, id).Scan(&paid)
	if err != nil {
		return err
	}
	if amount < paid {
		return errBillAmountBelowPaid
	}
	_, err = r.db.Exec(
		`UPDATE iuran_bills SET amount = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		amount, dueDate, notes, id,
	)
	return err
}

func (r *Repository) DeleteBill(id int) error {
	var paid int
	err := r.db.QueryRow(`SELECT paid_amount FROM iuran_bills WHERE id = ?`, id).Scan(&paid)
	if err != nil {
		return err
	}
	if paid > 0 {
		return errBillHasPayments
	}
	_, err = r.db.Exec(`DELETE FROM iuran_bills WHERE id = ?`, id)
	return err
}

func (r *Repository) DeleteBySantri(santriID int, name, period string) (int64, error) {
	q := `DELETE FROM iuran_bills WHERE santri_id = ? AND paid_amount = 0`
	args := []interface{}{santriID}
	if name != "" {
		q += ` AND name = ?`
		args = append(args, name)
	}
	if period != "" {
		q += ` AND period = ?`
		args = append(args, period)
	}
	res, err := r.db.Exec(q, args...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *Repository) DeleteByPeriod(name, period string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM iuran_bills WHERE name = ? AND period = ? AND paid_amount = 0`, name, period)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *Repository) PayBill(id, amount int, method, paidAt, notes string, byID int) error {
	return finance.RetryOnBusy(func() error {
		return r.payBillTx(id, amount, method, paidAt, notes, byID, "")
	}, 10)
}

// PayBillWithKey varian idempoten: retry dengan key sama TIDAK menulis ulang.
func (r *Repository) PayBillWithKey(id, amount int, method, paidAt, notes string, byID int, idemKey string) error {
	return finance.RetryOnBusy(func() error {
		return r.payBillTx(id, amount, method, paidAt, notes, byID, idemKey)
	}, 10)
}

func (r *Repository) payBillTx(id, amount int, method, paidAt, notes string, byID int, idemKey string) error {
	if amount <= 0 {
		return errBillOverpay
	}
	if paidAt == "" {
		paidAt = time.Now().Format("2006-01-02 15:04:05")
	}
	if method == "" {
		method = "manual"
	}
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

	var beforeTotal, beforePaid int
	var beforeStatus string
	_ = tx.QueryRow(`SELECT amount, paid_amount, status FROM iuran_bills WHERE id = ?`, id).Scan(&beforeTotal, &beforePaid, &beforeStatus)
	if idemKey != "" {		found, err := finance.FindLedgerByKey(tx, idemKey)
		if err != nil {
			return err
		}
		if found {
			_ = tx.Rollback()
			committed = true
			return finance.ErrIdempotentReplay
		}
	}

	res, err := tx.Exec(
		`UPDATE iuran_bills SET paid_amount = paid_amount + ?, status = CASE WHEN paid_amount + ? >= amount THEN 'paid' ELSE 'partial' END,
		 paid_method = ?, paid_at = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND status IN ('unpaid', 'partial', 'pending') AND paid_amount + ? <= amount`,
		amount, amount, method, paidAt, notes, notes, id, amount,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		var total, paid int
		qerr := tx.QueryRow(`SELECT amount, paid_amount FROM iuran_bills WHERE id = ?`, id).Scan(&total, &paid)
		if qerr != nil {
			return qerr
		}
		if paid >= total {
			return errBillAlreadyPaid
		}
		return errBillOverpay
	}

	var santriID int
	var iname, period string
	if err := tx.QueryRow(`SELECT santri_id, name, period FROM iuran_bills WHERE id = ?`, id).Scan(&santriID, &iname, &period); err != nil {
		return err
	}
	if err := insertLedger(tx, "IURAN", id, santriID, amount, method, paidAt, iname, period, byID, idemKey); err != nil {
		if IsDuplicateError(err) {
			return finance.ErrIdempotentReplay
		}
		return err
	}
	if err := upsertRekap(tx, santriID, period, amount, method, byID, "Rekap pembayaran "+iname); err != nil {
	afterPaid := beforePaid + amount
	afterStatus := "partial"
	if afterPaid >= beforeTotal && beforeTotal > 0 {
		afterStatus = "paid"
	}
	if err := audit.RecordMoneyTx(tx, byID, "PAY_IURAN", "iuran_bill", id, beforePaid, afterPaid, beforeStatus, afterStatus); err != nil {
		return err
	}
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func (r *Repository) WAKwitansiEnabled() bool {
	return waKwitansiEnabled(r.db)
}

func (r *Repository) KwitansiInfoByBill(billID int) (*KwitansiInfo, error) {
	var info KwitansiInfo
	var period string
	err := r.db.QueryRow(`SELECT s.parent_phone, s.name, b.period FROM iuran_bills b JOIN santri s ON s.id = b.santri_id WHERE b.id = ?`, billID).Scan(&info.Phone, &info.SantriName, &period)
	if err != nil {
		return nil, err
	}
	if len(period) >= 7 {
		period = period[:7]
	}
	info.Period = period
	err = r.db.QueryRow(`SELECT receipt_no, total FROM receipts WHERE santri_id = (SELECT santri_id FROM iuran_bills WHERE id = ?) AND period = ?`, billID, period).Scan(&info.ReceiptNo, &info.Total)
	if err != nil {
		return nil, err
	}
	return &info, nil
}

var errProofConflict = errors.New("tagihan sedang menunggu verifikasi")

func (r *Repository) SubmitProof(billID, uid, amount int, method, paidAt, proof string) error {
	return finance.RetryOnBusy(func() error {
		return r.SubmitProofOnce(billID, uid, amount, method, paidAt, proof)
	}, 10)
}

func (r *Repository) SubmitProofOnce(billID, uid, amount int, method, paidAt, proof string) error {
	if paidAt == "" {
		paidAt = time.Now().Format("2006-01-02 15:04:05")
	}
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
	var total, paid int
	var status string
	var owner int
	err = tx.QueryRow(`SELECT b.amount, b.paid_amount, b.status, COALESCE(s.user_id, 0)
		FROM iuran_bills b JOIN santri s ON s.id = b.santri_id WHERE b.id = ?`, billID).Scan(&total, &paid, &status, &owner)
	if err != nil {
		return err
	}
	if owner != uid {
		return sql.ErrNoRows
	}
	if status == "paid" || status == "pending" {
		return errProofConflict
	}
	if amount <= 0 || paid+amount > total {
		return errBillOverpay
	}
	if method == "" {
		method = "Transfer"
	}
	res, err := tx.Exec(`UPDATE iuran_bills SET status = 'pending', paid_method = ?, paid_at = ?, payment_proof = ?, pending_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status NOT IN ('paid', 'pending')`,
		method, paidAt, proof, amount, billID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return errProofConflict
	}
	if err := audit.RecordMoneyTx(tx, uid, "PROOF_SUBMIT_IURAN", "iuran_bill", billID, paid, paid, status, "pending"); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func (r *Repository) VerifyBill(billID int, approve bool, note string, byID int) error {
	return finance.RetryOnBusy(func() error {
		return r.verifyBillTx(billID, approve, note, byID, "")
	}, 10)
}

// VerifyBillWithKey varian idempoten untuk approve (retry aman).
func (r *Repository) VerifyBillWithKey(billID int, approve bool, note string, byID int, idemKey string) error {
	return finance.RetryOnBusy(func() error {
		return r.verifyBillTx(billID, approve, note, byID, idemKey)
	}, 10)
}

func (r *Repository) verifyBillTx(billID int, approve bool, note string, byID int, idemKey string) error {
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
	var amount, pendingPaid int
	var method, paidAt string
	err = tx.QueryRow(`SELECT pending_amount, paid_method, paid_at, paid_amount FROM iuran_bills WHERE id = ? AND status = 'pending'`, billID).Scan(&amount, &method, &paidAt, &pendingPaid)
	if err != nil {
		return err
	}
	if !approve {
		_, err = tx.Exec(`UPDATE iuran_bills SET status = CASE WHEN paid_amount > 0 THEN 'partial' ELSE 'unpaid' END, payment_proof = '', pending_amount = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`, billID)
		if err != nil {
			return err
		}
				afterStatus := "unpaid"
		if pendingPaid > 0 {
			afterStatus = "partial"
		}
		if err := audit.RecordMoneyTx(tx, byID, "VERIFY_REJECT_IURAN", "iuran_bill", billID, pendingPaid, pendingPaid, "pending", afterStatus); err != nil {
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
		committed = true
		return nil
	}
	if amount <= 0 {
		return errBillOverpay
	}
	if note != "" {
		note = "Verifikasi: " + note
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return r.payBillTx(billID, amount, method, paidAt, note, byID, idemKey)
}

func (r *Repository) CancelBill(id, byID int) error {
	return finance.RetryOnBusy(func() error {
		return r.CancelBillOnce(id, byID)
	}, 10)
}

func (r *Repository) CancelBillOnce(id, byID int) error {
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
	var santriID, paid int
	var period, method, cancelStatus string
	err = tx.QueryRow(`SELECT santri_id, paid_amount, period, COALESCE(paid_method,''), status FROM iuran_bills WHERE id = ? AND status != 'unpaid'`, id).Scan(&santriID, &paid, &period, &method, &cancelStatus)
	if err != nil {
		return err
	}
	if paid > 0 {
		revKey := fmt.Sprintf("reversal-IURAN-%d-%d", id, paid)
		found, err := finance.FindLedgerByKey(tx, revKey)
		if err != nil {
			return err
		}
		if !found {
			if _, err := tx.Exec(`INSERT INTO payment_transactions (date, santri_id, bill_type, bill_id, bill_period, description, amount, method, created_by, idempotency_key) VALUES (CURRENT_TIMESTAMP, ?, 'IURAN', ?, ?, ?, ?, ?, ?, ?)`,
				santriID, id, period, "REVERSAL IURAN "+period, -paid, normPayMethod(method), 0, revKey); err != nil {
				return err
			}
			month := period
			if len(month) >= 7 {
				month = month[:7]
			}
			_, _ = tx.Exec(`UPDATE receipts SET total = total - ?, updated_at = CURRENT_TIMESTAMP WHERE santri_id = ? AND period = ?`, paid, santriID, month)
		}
	}
	res, err := tx.Exec(
		`UPDATE iuran_bills SET paid_amount = 0, status = 'unpaid', paid_method = '', paid_at = NULL, payment_proof = '', pending_amount = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'unpaid'`,
		id,
	)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	if err := audit.RecordMoneyTx(tx, byID, "CANCEL_IURAN", "iuran_bill", id, paid, 0, cancelStatus, "unpaid"); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func (r *Repository) Summary(period, name string) (*IuranSummary, error) {
	s := &IuranSummary{Period: period}
	query := `SELECT COALESCE(SUM(amount),0), COALESCE(SUM(paid_amount),0), COUNT(*),
		SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END)
		FROM iuran_bills WHERE period = ?`
	args := []interface{}{period}
	if name != "" {
		query += ` AND name = ?`
		args = append(args, name)
	}
	err := r.db.QueryRow(query, args...).Scan(
		&s.Billed, &s.Collected, &s.CountTotal, &s.CountPaid, &s.CountPartial, &s.CountUnpaid,
	)
	if err != nil {
		return nil, err
	}
	s.Outstanding = s.Billed - s.Collected
	return s, nil
}

type IuranReportRow struct {
	SantriID    int    `json:"santri_id"`
	NIS         string `json:"nis"`
	Name        string `json:"name"`
	Class       string `json:"class"`
	Billed      int    `json:"billed"`
	Collected   int    `json:"collected"`
	Outstanding int    `json:"outstanding"`
	CountBills  int    `json:"count_bills"`
	Status      string `json:"status"`
}

func (r *Repository) Report(periodStart, periodEnd, class string, santriID int) ([]IuranReportRow, error) {
	query := `
		SELECT s.id, s.nis, s.name, s.class,
		       COALESCE(SUM(b.amount),0), COALESCE(SUM(b.paid_amount),0), COUNT(b.id)
		FROM santri s
		LEFT JOIN iuran_bills b ON b.santri_id = s.id AND b.period >= ? AND b.period <= ?
		WHERE s.status = 'aktif'
	`
	args := []interface{}{periodStart, periodEnd}
	if class != "" {
		query += ` AND s.class = ?`
		args = append(args, class)
	}
	if santriID > 0 {
		query += ` AND s.id = ?`
		args = append(args, santriID)
	}
	query += ` GROUP BY s.id, s.nis, s.name, s.class ORDER BY s.name ASC`
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []IuranReportRow{}
	for rows.Next() {
		var row IuranReportRow
		if err := rows.Scan(&row.SantriID, &row.NIS, &row.Name, &row.Class,
			&row.Billed, &row.Collected, &row.CountBills); err != nil {
			return nil, err
		}
		row.Outstanding = row.Billed - row.Collected
		switch {
		case row.CountBills == 0:
			row.Status = "none"
		case row.Outstanding <= 0:
			row.Status = "paid"
		case row.Collected > 0:
			row.Status = "partial"
		default:
			row.Status = "unpaid"
		}
		list = append(list, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *Repository) ListActiveSantri() ([]IuranSantri, error) {
	rows, err := r.db.Query(`SELECT id, nis, name, class FROM santri WHERE status = 'aktif' ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []IuranSantri{}
	for rows.Next() {
		var s IuranSantri
		if err := rows.Scan(&s.ID, &s.NIS, &s.Name, &s.Class); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

var idMonths = []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

func monthYearID(period string) string {
	if len(period) < 7 {
		return period
	}
	y, m := period[0:4], period[5:7]
	mi := int(m[0]-'0')*10 + int(m[1]-'0')
	if mi < 1 || mi > 12 {
		return period
	}
	return idMonths[mi] + " " + y
}

func normPayMethod(m string) string {
	switch m {
	case "manual", "tunai", "Tunai", "":
		return "Tunai"
	case "transfer", "Transfer":
		return "Transfer"
	default:
		return m
	}
}

func insertLedger(tx *sql.Tx, billType string, billID, santriID, amount int, method, paidAt, desc, billPeriod string, byID int, idemKey string) error {
	res, err := tx.Exec(`INSERT INTO payment_transactions (date, santri_id, bill_type, bill_id, bill_period, description, amount, method, created_by, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		paidAt, santriID, billType, billID, billPeriod, desc, amount, normPayMethod(method), byID, sql.NullString{String: idemKey, Valid: idemKey != ""})
	if err != nil {
		return err
	}
	lid, _ := res.LastInsertId()
	code := "KTR" + padLedger(lid)
	_, err = tx.Exec(`UPDATE payment_transactions SET code=? WHERE id=?`, code, lid)
	return err
}

func padLedger(id int64) string {
	n := ""
	for v := id; v > 0; v /= 10 {
		n = string(rune('0'+v%10)) + n
	}
	if n == "" {
		n = "0"
	}
	for len(n) < 6 {
		n = "0" + n
	}
	return n
}

func upsertRekap(tx *sql.Tx, santriID int, billPeriod string, amount int, method string, byID int, label string) error {
	month := billPeriod
	if len(month) >= 7 {
		month = month[:7]
	} else {
		return nil
	}
	var rid int64
	var rno string
	err := tx.QueryRow(`SELECT id, receipt_no FROM receipts WHERE santri_id = ? AND period = ?`, santriID, month).Scan(&rid, &rno)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == sql.ErrNoRows {
		year := month[:4]
		rno, err := finance.NextReceiptNo(tx, year)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`INSERT INTO receipts (receipt_no, santri_id, period, description, total, method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			rno, santriID, month, label, amount, method, byID)
		return err
	}
	_, err = tx.Exec(`UPDATE receipts SET total = total + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, amount, rid)
	return err
}

type KwitansiInfo struct {
	Phone      string `json:"phone"`
	SantriName string `json:"santri_name"`
	ReceiptNo  string `json:"receipt_no"`
	Total      int    `json:"total"`
	Period     string `json:"period"`
}

func waKwitansiEnabled(db *sql.DB) bool {
	var v string
	if err := db.QueryRow(`SELECT value FROM settings WHERE key = 'wa_kwitansi_enabled'`).Scan(&v); err != nil {
		return false
	}
	v = strings.ToLower(strings.TrimSpace(v))
	return v == "1" || v == "true" || v == "aktif" || v == "ya" || v == "on"
}
