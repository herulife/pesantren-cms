package payments

import (
	"darussunnah-api/internal/platform/finance"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

type Payment struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	UserName    string    `json:"user_name,omitempty"`
	UserEmail   string    `json:"user_email,omitempty"`
	Amount      int       `json:"amount"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // pending, success, failed
	Method      string    `json:"method"`
	PaymentDate string    `json:"payment_date"`
	CreatedAt   time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAll() ([]Payment, error) {
	query := `
		SELECT p.id, p.user_id, u.name as user_name, u.email as user_email, 
		       p.amount, p.description, p.status, p.method, p.payment_date, p.created_at
		FROM payments p
		JOIN users u ON p.user_id = u.id
		ORDER BY p.payment_date DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ps []Payment
	for rows.Next() {
		var p Payment
		var createdAt string
		if err := rows.Scan(&p.ID, &p.UserID, &p.UserName, &p.UserEmail,
			&p.Amount, &p.Description, &p.Status, &p.Method, &p.PaymentDate, &createdAt); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		ps = append(ps, p)
	}
	return ps, nil
}

func (r *Repository) GetByUserID(userID int) ([]Payment, error) {
	query := `
		SELECT id, user_id, amount, description, status, method, payment_date, created_at
		FROM payments
		WHERE user_id = ?
		ORDER BY payment_date DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ps []Payment
	for rows.Next() {
		var p Payment
		var createdAt string
		if err := rows.Scan(&p.ID, &p.UserID, &p.Amount, &p.Description, &p.Status, &p.Method, &p.PaymentDate, &createdAt); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		ps = append(ps, p)
	}
	return ps, nil
}

func (r *Repository) Create(p *Payment) error {
	query := `
		INSERT INTO payments (user_id, amount, description, status, method, payment_date)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	if p.PaymentDate == "" {
		p.PaymentDate = time.Now().Format("2006-01-02 15:04:05")
	}
	_, err := r.db.Exec(query, p.UserID, p.Amount, p.Description, p.Status, p.Method, p.PaymentDate)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM payments WHERE id = ?", id)
	return err
}

func (r *Repository) Update(p *Payment) error {
	query := `UPDATE payments SET user_id = ?, amount = ?, description = ?, status = ?, method = ?, payment_date = ? WHERE id = ?`
	if p.PaymentDate == "" {
		p.PaymentDate = time.Now().Format("2006-01-02 15:04:05")
	}
	_, err := r.db.Exec(query, p.UserID, p.Amount, p.Description, p.Status, p.Method, p.PaymentDate, p.ID)
	return err
}

func (r *Repository) GetUsers() ([]struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}, error) {
	query := "SELECT id, name, email FROM users WHERE role = 'user' ORDER BY name ASC"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	for rows.Next() {
		var u struct {
			ID    int    `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

type PayTx struct {
	ID          int    `json:"id"`
	Code        string `json:"code"`
	Date        string `json:"date"`
	SantriID    int    `json:"santri_id"`
	SantriNIS   string `json:"santri_nis,omitempty"`
	SantriName  string `json:"santri_name,omitempty"`
	BillType    string `json:"bill_type"`
	BillID      int    `json:"bill_id"`
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Method      string `json:"method"`
	Petugas     string `json:"petugas,omitempty"`
}

type UnpaidBill struct {
	BillType string `json:"bill_type"`
	BillID   int    `json:"bill_id"`
	Period   string `json:"period"`
	Name     string `json:"name"`
	Amount   int    `json:"amount"`
	Paid     int    `json:"paid"`
	Remain   int    `json:"remain"`
	DueDate  string `json:"due_date"`
}

func (r *Repository) ListPayTx(from, to, search string, limit, offset int) ([]PayTx, error) {
	q := `SELECT t.id, t.code, t.date, t.santri_id, s.nis, s.name, t.bill_type, t.bill_id, t.description, t.amount, t.method, COALESCE(u.name,'')
		FROM payment_transactions t JOIN santri s ON s.id=t.santri_id LEFT JOIN users u ON u.id=t.created_by WHERE 1=1`
	args := []interface{}{}
	if from != "" {
		q += ` AND substr(t.date,1,10)>=?`
		args = append(args, from)
	}
	if to != "" {
		q += ` AND substr(t.date,1,10)<=?`
		args = append(args, to)
	}
	if search != "" {
		q += ` AND (s.nis LIKE ? OR s.name LIKE ? OR t.description LIKE ? OR t.code LIKE ?)`
		like := "%" + search + "%"
		args = append(args, like, like, like, like)
	}
	q += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []PayTx{}
	for rows.Next() {
		var t PayTx
		if err := rows.Scan(&t.ID, &t.Code, &t.Date, &t.SantriID, &t.SantriNIS, &t.SantriName, &t.BillType, &t.BillID, &t.Description, &t.Amount, &t.Method, &t.Petugas); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repository) UnpaidBills(santriID int) ([]UnpaidBill, error) {
	q := `SELECT 'SPP', id, period, '', amount, paid_amount, amount-paid_amount, due_date FROM spp_bills WHERE santri_id=? AND status!='paid'
		UNION ALL
		SELECT 'IURAN', id, period, name, amount, paid_amount, amount-paid_amount, due_date FROM iuran_bills WHERE santri_id=? AND status!='paid'
		ORDER BY 3, 1`
	rows, err := r.db.Query(q, santriID, santriID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UnpaidBill{}
	for rows.Next() {
		var b UnpaidBill
		if err := rows.Scan(&b.BillType, &b.BillID, &b.Period, &b.Name, &b.Amount, &b.Paid, &b.Remain, &b.DueDate); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

type Receipt struct {
	ID          int    `json:"id"`
	ReceiptNo   string `json:"receipt_no"`
	SantriID    int    `json:"santri_id"`
	SantriNIS   string `json:"santri_nis,omitempty"`
	SantriName  string `json:"santri_name,omitempty"`
	SantriClass string `json:"santri_class,omitempty"`
	ParentName  string `json:"parent_name,omitempty"`
	Period      string `json:"period"`
	Description string `json:"description"`
	Total       int    `json:"total"`
	Method      string `json:"method"`
	Petugas     string `json:"petugas,omitempty"`
	CreatedBy   int    `json:"created_by,omitempty"`
	CreatedAt   string `json:"created_at,omitempty"`
}

type ReceiptDetail struct {
	Receipt Receipt `json:"receipt"`
	Items   []PayTx `json:"items"`
}

var ErrNoReceiptData = errors.New("belum ada pembayaran pada periode ini")

func (r *Repository) GetOrCreateReceipt(santriID int, period string, byID, ownerUID int) (*ReceiptDetail, error) {
	if len(period) < 7 {
		return nil, ErrNoReceiptData
	}
	month := period[:7]
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var santriIDCheck int
	var nis, name, class, parent string
	err = tx.QueryRow(`SELECT id, nis, name, class, parent_name FROM santri WHERE id = ?`, santriID).Scan(&santriIDCheck, &nis, &name, &class, &parent)
	if err != nil {
		return nil, err
	}
	if ownerUID > 0 {
		var owner int
		err = tx.QueryRow(`SELECT COALESCE(user_id, 0) FROM santri WHERE id = ?`, santriID).Scan(&owner)
		if err != nil {
			return nil, err
		}
		if owner != ownerUID {
			return nil, sql.ErrNoRows
		}
	}

	rows, err := tx.Query(`SELECT t.id, t.code, t.date, t.santri_id, s.nis, s.name, t.bill_type, t.bill_id, t.description, t.amount, t.method, COALESCE(u.name,'')
		FROM payment_transactions t JOIN santri s ON s.id=t.santri_id LEFT JOIN users u ON u.id=t.created_by
		WHERE t.santri_id = ? AND (t.bill_period = ? OR (t.bill_period = '' AND substr(t.date,1,7) = ?)) ORDER BY t.date, t.id`, santriID, month, month)
	if err != nil {
		return nil, err
	}
	items := []PayTx{}
	var total int
	var methods []string
	seenMethod := map[string]bool{}
	var petugas string
	for rows.Next() {
		var t PayTx
		if err := rows.Scan(&t.ID, &t.Code, &t.Date, &t.SantriID, &t.SantriNIS, &t.SantriName, &t.BillType, &t.BillID, &t.Description, &t.Amount, &t.Method, &t.Petugas); err != nil {
			rows.Close()
			return nil, err
		}
		items = append(items, t)
		total += t.Amount
		if !seenMethod[t.Method] {
			seenMethod[t.Method] = true
			methods = append(methods, t.Method)
		}
		if petugas == "" {
			petugas = t.Petugas
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) == 0 {
		_ = tx.Rollback()
		return nil, ErrNoReceiptData
	}

	var rec Receipt
	err = tx.QueryRow(`SELECT id, receipt_no, santri_id, period, description, total, method, created_by, created_at FROM receipts WHERE santri_id = ? AND period = ?`, santriID, month).Scan(
	&rec.ID, &rec.ReceiptNo, &rec.SantriID, &rec.Period, &rec.Description, &rec.Total, &rec.Method, &rec.CreatedBy, &rec.CreatedAt)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if err == sql.ErrNoRows {
		year := month[:4]
		no, err := finance.NextReceiptNo(tx, year)
		if err != nil {
			return nil, err
		}
		desc := fmt.Sprintf("Rekap pembayaran %s periode %s", name, month)
		res, err := tx.Exec(`INSERT INTO receipts (receipt_no, santri_id, period, description, total, method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			no, santriID, month, desc, total, strings.Join(methods, "+"), byID)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE") {
				_ = tx.Rollback()
				return r.GetOrCreateReceipt(santriID, period, byID, ownerUID)
			}
			return nil, err
		}
		id, _ := res.LastInsertId()
		err = tx.QueryRow(`SELECT id, receipt_no, santri_id, period, description, total, method, created_by, created_at FROM receipts WHERE id = ?`, id).Scan(
		&rec.ID, &rec.ReceiptNo, &rec.SantriID, &rec.Period, &rec.Description, &rec.Total, &rec.Method, &rec.CreatedBy, &rec.CreatedAt)
		if err != nil {
			return nil, err
		}
	}
	rec.SantriNIS = nis
	rec.SantriName = name
	rec.SantriClass = class
	rec.ParentName = parent
	rec.Petugas = petugas
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &ReceiptDetail{Receipt: rec, Items: items}, nil
}

type MyBill struct {
	BillType     string `json:"bill_type"`
	BillID       int    `json:"bill_id"`
	SantriID     int    `json:"santri_id"`
	SantriName   string `json:"santri_name"`
	Period       string `json:"period"`
	Name         string `json:"name"`
	Amount       int    `json:"amount"`
	Paid         int    `json:"paid"`
	Remain       int    `json:"remain"`
	Status       string `json:"status"`
	DueDate      string `json:"due_date"`
	PaymentProof string `json:"payment_proof,omitempty"`
}

func (r *Repository) MyBills(uid int) ([]MyBill, error) {
	q := `SELECT 'SPP', b.id, b.santri_id, s.name, b.period, '', b.amount, b.paid_amount, b.amount-b.paid_amount, b.status, b.due_date, b.payment_proof
		FROM spp_bills b JOIN santri s ON s.id = b.santri_id WHERE s.user_id = ? AND b.status != 'paid'
		UNION ALL
		SELECT 'IURAN', b.id, b.santri_id, s.name, b.period, b.name, b.amount, b.paid_amount, b.amount-b.paid_amount, b.status, b.due_date, b.payment_proof
		FROM iuran_bills b JOIN santri s ON s.id = b.santri_id WHERE s.user_id = ? AND b.status != 'paid'
		ORDER BY 5, 1`
	rows, err := r.db.Query(q, uid, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []MyBill{}
	for rows.Next() {
		var b MyBill
		if err := rows.Scan(&b.BillType, &b.BillID, &b.SantriID, &b.SantriName, &b.Period, &b.Name, &b.Amount, &b.Paid, &b.Remain, &b.Status, &b.DueDate, &b.PaymentProof); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (r *Repository) MyLedger(uid int, limit int) ([]PayTx, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := r.db.Query(`SELECT t.id, t.code, t.date, t.santri_id, s.nis, s.name, t.bill_type, t.bill_id, t.description, t.amount, t.method, COALESCE(u.name,'')
		FROM payment_transactions t JOIN santri s ON s.id=t.santri_id LEFT JOIN users u ON u.id=t.created_by
		WHERE s.user_id = ? ORDER BY t.date DESC, t.id DESC LIMIT ?`, uid, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []PayTx{}
	for rows.Next() {
		var t PayTx
		if err := rows.Scan(&t.ID, &t.Code, &t.Date, &t.SantriID, &t.SantriNIS, &t.SantriName, &t.BillType, &t.BillID, &t.Description, &t.Amount, &t.Method, &t.Petugas); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
