package iuran

import (
	"database/sql"
	"errors"
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
	ID          int       `json:"id"`
	SantriID    int       `json:"santri_id"`
	SantriName  string    `json:"santri_name,omitempty"`
	SantriNIS   string    `json:"santri_nis,omitempty"`
	SantriClass string    `json:"santri_class,omitempty"`
	Period      string    `json:"period"`
	Amount      int       `json:"amount"`
	PaidAmount  int       `json:"paid_amount"`
	Status      string    `json:"status"` // unpaid, partial, paid
	DueDate     string    `json:"due_date"`
	PaidMethod  string    `json:"paid_method"`
	PaidAt      string    `json:"paid_at,omitempty"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type IuranSantri struct {
	ID    int    `json:"id"`
	NIS   string `json:"nis"`
	Name  string `json:"name"`
	Class string `json:"class"`
}

type IuranSummary struct {
	Period      string `json:"period"`
	Billed      int    `json:"billed"`
	Collected   int    `json:"collected"`
	Outstanding int    `json:"outstanding"`
	CountTotal  int    `json:"count_total"`
	CountPaid   int    `json:"count_paid"`
	CountPartial int   `json:"count_partial"`
	CountUnpaid int    `json:"count_unpaid"`
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
		&b.Period, &b.Amount, &b.PaidAmount, &b.Status, &b.DueDate,
		&b.PaidMethod, &paidAt, &b.Notes, &createdAt, &updatedAt)
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
	       b.paid_method, b.paid_at, b.notes, b.created_at, b.updated_at
	FROM iuran_bills b
	JOIN santri s ON s.id = b.santri_id
`

func (r *Repository) ListBills(period, status string, santriID int) ([]IuranBill, error) {
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
		`INSERT INTO iuran_bills (santri_id, period, amount, due_date, notes) VALUES (?, ?, ?, ?, ?)`,
		b.SantriID, b.Period, b.Amount, b.DueDate, b.Notes,
	)
	return err
}

func (r *Repository) GenerateBills(period string, amount int, dueDate string) (created int, skipped int, err error) {
	var ids []int
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

	for _, id := range ids {
		res, err := r.db.Exec(
			`INSERT OR IGNORE INTO iuran_bills (santri_id, period, amount, due_date) VALUES (?, ?, ?, ?)`,
			id, period, amount, dueDate,
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

func (r *Repository) PayBill(id, amount int, method, paidAt, notes string) error {
	if paidAt == "" {
		paidAt = time.Now().Format("2006-01-02 15:04:05")
	}
	if method == "" {
		method = "manual"
	}
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var total, paid int
	err = tx.QueryRow(`SELECT amount, paid_amount FROM iuran_bills WHERE id = ?`, id).Scan(&total, &paid)
	if err != nil {
		return err
	}
	if paid >= total {
		_ = tx.Rollback()
		return errBillAlreadyPaid
	}
	if paid+amount > total {
		_ = tx.Rollback()
		return errBillOverpay
	}
	newPaid := paid + amount
	status := "partial"
	if newPaid == total {
		status = "paid"
	}
	_, err = tx.Exec(
		`UPDATE iuran_bills SET paid_amount = ?, status = ?, paid_method = ?, paid_at = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		newPaid, status, method, paidAt, notes, notes, id,
	)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *Repository) CancelBill(id int) error {
	res, err := r.db.Exec(
		`UPDATE iuran_bills SET paid_amount = 0, status = 'unpaid', paid_method = '', paid_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'unpaid'`,
		id,
	)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) Summary(period string) (*IuranSummary, error) {
	s := &IuranSummary{Period: period}
	query := `SELECT COALESCE(SUM(amount),0), COALESCE(SUM(paid_amount),0), COUNT(*),
		SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END),
		SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END)
		FROM iuran_bills WHERE period = ?`
	err := r.db.QueryRow(query, period).Scan(
		&s.Billed, &s.Collected, &s.CountTotal, &s.CountPaid, &s.CountPartial, &s.CountUnpaid,
	)
	if err != nil {
		return nil, err
	}
	s.Outstanding = s.Billed - s.Collected
	return s, nil
}

type IuranReportRow struct {
	SantriID  int    `json:"santri_id"`
	NIS       string `json:"nis"`
	Name      string `json:"name"`
	Class     string `json:"class"`
	Billed    int    `json:"billed"`
	Collected int    `json:"collected"`
	Outstanding int  `json:"outstanding"`
	CountBills int   `json:"count_bills"`
	Status    string `json:"status"`
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
