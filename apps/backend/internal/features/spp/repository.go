package spp

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

type SppBill struct {
	ID            int       `json:"id"`
	SantriID      int       `json:"santri_id"`
	SantriName    string    `json:"santri_name,omitempty"`
	SantriNIS     string    `json:"santri_nis,omitempty"`
	SantriClass   string    `json:"santri_class,omitempty"`
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

type SppSantri struct {
	ID    int    `json:"id"`
	NIS   string `json:"nis"`
	Name  string `json:"name"`
	Class string `json:"class"`
}

type SppSummary struct {
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

func scanBill(rows *sql.Rows) (SppBill, error) {
	var b SppBill
	var paidAt sql.NullString
	var createdAt, updatedAt string
	err := rows.Scan(&b.ID, &b.SantriID, &b.SantriName, &b.SantriNIS, &b.SantriClass,
		&b.Period, &b.Amount, &b.PaidAmount, &b.Status, &b.DueDate,
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
	       b.period, b.amount, b.paid_amount, b.status, b.due_date,
	       b.paid_method, b.paid_at, b.notes, b.payment_proof, b.pending_amount, b.created_at, b.updated_at
	FROM spp_bills b
	JOIN santri s ON s.id = b.santri_id
`

func (r *Repository) ListBills(period, status string, santriID int) ([]SppBill, error) {
	query := billSelect + ` WHERE 1=1`
	var args []interface{}
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

	bills := []SppBill{}
	for rows.Next() {
		b, err := scanBill(rows)
		if err != nil {
			return nil, err
		}
		bills = append(bills, b)
	}
	return bills, nil
}

func (r *Repository) GetBill(id int) (*SppBill, error) {
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

func (r *Repository) CreateBill(b *SppBill) error {
	_, err := r.db.Exec(
		`INSERT INTO spp_bills (santri_id, period, amount, due_date, notes) VALUES (?, ?, ?, ?, ?)`,
		b.SantriID, b.Period, b.Amount, b.DueDate, b.Notes,
	)
	return err
}

func monthsBetween(start, end string) []string {
	if end == "" {
		end = start
	}
	if end < start {
		return nil
	}
	out := []string{}
	cur := start
	for cur <= end && len(out) < 24 {
		out = append(out, cur)
		var yi, mi int
		_, _ = fmt.Sscanf(cur, "%d-%d", &yi, &mi)
		mi++
		if mi > 12 {
			mi = 1
			yi++
		}
		cur = fmt.Sprintf("%04d-%02d", yi, mi)
	}
	return out
}

func (r *Repository) GenerateBills(period, periodEnd string, amount int, dueDate, class string, santriIDs []int) (created int, skipped int, err error) {
	months := monthsBetween(period, periodEnd)
	if len(months) == 0 {
		return 0, 0, nil
	}
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
		for _, per := range months {
			res, err := r.db.Exec(
				`INSERT OR IGNORE INTO spp_bills (santri_id, period, amount, due_date) VALUES (?, ?, ?, ?)`,
				id, per, amount, dueDate,
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
	}
	return created, skipped, nil
}

func (r *Repository) DeleteBySantri(santriID int, period string) (int64, error) {
	q := `DELETE FROM spp_bills WHERE santri_id = ? AND paid_amount = 0`
	args := []interface{}{santriID}
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

func (r *Repository) DeleteByPeriod(period string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM spp_bills WHERE period = ? AND paid_amount = 0`, period)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

type CombinedRow struct {
	SantriID    int    `json:"santri_id"`
	NIS         string `json:"nis"`
	Name        string `json:"name"`
	Class       string `json:"class"`
	SppBilled   int    `json:"spp_billed"`
	IuranBilled int    `json:"iuran_billed"`
	Billed      int    `json:"billed"`
	Collected   int    `json:"collected"`
	Outstanding int    `json:"outstanding"`
	Status      string `json:"status"`
}

func (r *Repository) CombinedReport(periodStart, periodEnd, class string, santriID int) ([]CombinedRow, error) {
	q := `SELECT s.id, s.nis, s.name, s.class,
		COALESCE((SELECT SUM(amount) FROM spp_bills b WHERE b.santri_id=s.id AND b.period>=? AND b.period<=?),0),
		COALESCE((SELECT SUM(amount) FROM iuran_bills b WHERE b.santri_id=s.id AND b.period>=? AND b.period<=?),0),
		COALESCE((SELECT SUM(paid_amount) FROM spp_bills b WHERE b.santri_id=s.id AND b.period>=? AND b.period<=?),0)
		+ COALESCE((SELECT SUM(paid_amount) FROM iuran_bills b WHERE b.santri_id=s.id AND b.period>=? AND b.period<=?),0)
		FROM santri s WHERE s.status='aktif'`
	args := []interface{}{periodStart, periodEnd, periodStart, periodEnd, periodStart, periodEnd, periodStart, periodEnd}
	if class != "" {
		q += ` AND s.class=?`
		args = append(args, class)
	}
	if santriID > 0 {
		q += ` AND s.id=?`
		args = append(args, santriID)
	}
	q += ` ORDER BY s.name`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []CombinedRow{}
	for rows.Next() {
		var c CombinedRow
		if err := rows.Scan(&c.SantriID, &c.NIS, &c.Name, &c.Class, &c.SppBilled, &c.IuranBilled, &c.Collected); err != nil {
			return nil, err
		}
		c.Billed = c.SppBilled + c.IuranBilled
		c.Outstanding = c.Billed - c.Collected
		switch {
		case c.Billed == 0:
			c.Status = "none"
		case c.Outstanding <= 0:
			c.Status = "paid"
		case c.Collected > 0:
			c.Status = "partial"
		default:
			c.Status = "unpaid"
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateBill(id, amount int, dueDate, notes string) error {
	var paid int
	err := r.db.QueryRow(`SELECT paid_amount FROM spp_bills WHERE id = ?`, id).Scan(&paid)
	if err != nil {
		return err
	}
	if amount < paid {
		return errBillAmountBelowPaid
	}
	_, err = r.db.Exec(
		`UPDATE spp_bills SET amount = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		amount, dueDate, notes, id,
	)
	return err
}

func (r *Repository) DeleteBill(id int) error {
	var paid int
	err := r.db.QueryRow(`SELECT paid_amount FROM spp_bills WHERE id = ?`, id).Scan(&paid)
	if err != nil {
		return err
	}
	if paid > 0 {
		return errBillHasPayments
	}
	_, err = r.db.Exec(`DELETE FROM spp_bills WHERE id = ?`, id)
	return err
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

// payBillTx: conditional UPDATE dahulu (RESERVED lock via BEGIN IMMEDIATE),
// verifikasi RowsAffected, baru ledger + receipt + commit.
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
	_ = tx.QueryRow(`SELECT amount, paid_amount, status FROM spp_bills WHERE id = ?`, id).Scan(&beforeTotal, &beforePaid, &beforeStatus)
	if idemKey != "" {		found, err := finance.FindLedgerByKey(tx, idemKey)
		if err != nil {
			return err
		}
		if found {
			_ = tx.Rollback()
			committed = true // rollback manual, cegah double-rollback
			return finance.ErrIdempotentReplay
		}
	}

	res, err := tx.Exec(
		`UPDATE spp_bills SET paid_amount = paid_amount + ?, status = CASE WHEN paid_amount + ? >= amount THEN 'paid' ELSE 'partial' END,
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
		var status string
		qerr := tx.QueryRow(`SELECT amount, paid_amount, status FROM spp_bills WHERE id = ?`, id).Scan(&total, &paid, &status)
		if qerr != nil {
			return qerr
		}
		if paid >= total {
			return errBillAlreadyPaid
		}
		return errBillOverpay
	}

	var santriID int
	var period string
	if err := tx.QueryRow(`SELECT santri_id, period FROM spp_bills WHERE id = ?`, id).Scan(&santriID, &period); err != nil {
		return err
	}
	if err := insertLedger(tx, "SPP", id, santriID, amount, method, paidAt, "SPP "+monthYearID(period), period, byID, idemKey); err != nil {
		if IsDuplicateError(err) {
			return finance.ErrIdempotentReplay
		}
		return err
	}
	if err := upsertRekap(tx, santriID, period, amount, method, byID, "Rekap pembayaran "+monthYearID(period)); err != nil {
	afterPaid := beforePaid + amount
	afterStatus := "partial"
	if afterPaid >= beforeTotal && beforeTotal > 0 {
		afterStatus = "paid"
	}
	if err := audit.RecordMoneyTx(tx, byID, "PAY_SPP", "spp_bill", id, beforePaid, afterPaid, beforeStatus, afterStatus); err != nil {
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
	err := r.db.QueryRow(`SELECT s.parent_phone, s.name, b.period FROM spp_bills b JOIN santri s ON s.id = b.santri_id WHERE b.id = ?`, billID).Scan(&info.Phone, &info.SantriName, &period)
	if err != nil {
		return nil, err
	}
	if len(period) >= 7 {
		period = period[:7]
	}
	info.Period = period
	err = r.db.QueryRow(`SELECT receipt_no, total FROM receipts WHERE santri_id = (SELECT santri_id FROM spp_bills WHERE id = ?) AND period = ?`, billID, period).Scan(&info.ReceiptNo, &info.Total)
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
	var santriID, total, paid int
	var status string
	var owner int
	err = tx.QueryRow(`SELECT b.santri_id, b.amount, b.paid_amount, b.status, COALESCE(s.user_id, 0)
		FROM spp_bills b JOIN santri s ON s.id = b.santri_id WHERE b.id = ?`, billID).Scan(&santriID, &total, &paid, &status, &owner)
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
	// Conditional update: kalah race (verify/cancel/pay bersamaan) -> conflict, bukan state rusak.
	res, err := tx.Exec(`UPDATE spp_bills SET status = 'pending', paid_method = ?, paid_at = ?, payment_proof = ?, pending_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status NOT IN ('paid', 'pending')`,
		method, paidAt, proof, amount, billID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return errProofConflict
	}
	if err := audit.RecordMoneyTx(tx, uid, "PROOF_SUBMIT_SPP", "spp_bill", billID, paid, paid, status, "pending"); err != nil {
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
	err = tx.QueryRow(`SELECT pending_amount, paid_method, paid_at, paid_amount FROM spp_bills WHERE id = ? AND status = 'pending'`, billID).Scan(&amount, &method, &paidAt, &pendingPaid)
	if err != nil {
		return err
	}
	if !approve {
		_, err = tx.Exec(`UPDATE spp_bills SET status = CASE WHEN paid_amount > 0 THEN 'partial' ELSE 'unpaid' END, payment_proof = '', pending_amount = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`, billID)
		if err != nil {
			return err
		}
				afterStatus := "unpaid"
		if pendingPaid > 0 {
			afterStatus = "partial"
		}
		if err := audit.RecordMoneyTx(tx, byID, "VERIFY_REJECT_SPP", "spp_bill", billID, pendingPaid, pendingPaid, "pending", afterStatus); err != nil {
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
	// Approve = PayBill atomik (idempoten bila key diisi).
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
	err = tx.QueryRow(`SELECT santri_id, paid_amount, period, COALESCE(paid_method,''), status FROM spp_bills WHERE id = ? AND status != 'unpaid'`, id).Scan(&santriID, &paid, &period, &method, &cancelStatus)
	if err != nil {
		return err
	}
	if paid > 0 {
		// REVERSAL: jangan hapus jejak uang. Baris reversal + kurangi rekap.
		revKey := fmt.Sprintf("reversal-SPP-%d-%d", id, paid)
		found, err := finance.FindLedgerByKey(tx, revKey)
		if err != nil {
			return err
		}
		if !found {
			if _, err := tx.Exec(`INSERT INTO payment_transactions (date, santri_id, bill_type, bill_id, bill_period, description, amount, method, created_by, idempotency_key) VALUES (CURRENT_TIMESTAMP, ?, 'SPP', ?, ?, ?, ?, ?, ?, ?)`,
				santriID, id, period, fmt.Sprintf("REVERSAL SPP %s", monthYearID(period)), -paid, normPayMethod(method), 0, revKey); err != nil {
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
		`UPDATE spp_bills SET paid_amount = 0, status = 'unpaid', paid_method = '', paid_at = NULL, payment_proof = '', pending_amount = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'unpaid'`,
		id,
	)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	if err := audit.RecordMoneyTx(tx, byID, "CANCEL_SPP", "spp_bill", id, paid, 0, cancelStatus, "unpaid"); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func (r *Repository) Summary(period string) (*SppSummary, error) {
	s := &SppSummary{Period: period}
	query := `SELECT COALESCE(SUM(amount),0), COALESCE(SUM(paid_amount),0), COUNT(*),
		SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END)
		FROM spp_bills WHERE period = ?`
	err := r.db.QueryRow(query, period).Scan(
		&s.Billed, &s.Collected, &s.CountTotal, &s.CountPaid, &s.CountPartial, &s.CountUnpaid,
	)
	if err != nil {
		return nil, err
	}
	s.Outstanding = s.Billed - s.Collected
	return s, nil
}

type SppReportRow struct {
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

func (r *Repository) Report(periodStart, periodEnd, class string, santriID int) ([]SppReportRow, error) {
	query := `
		SELECT s.id, s.nis, s.name, s.class,
		       COALESCE(SUM(b.amount),0), COALESCE(SUM(b.paid_amount),0), COUNT(b.id)
		FROM santri s
		LEFT JOIN spp_bills b ON b.santri_id = s.id AND b.period >= ? AND b.period <= ?
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

	list := []SppReportRow{}
	for rows.Next() {
		var row SppReportRow
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

func (r *Repository) ListActiveSantri() ([]SppSantri, error) {
	rows, err := r.db.Query(`SELECT id, nis, name, class FROM santri WHERE status = 'aktif' ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []SppSantri{}
	for rows.Next() {
		var s SppSantri
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
