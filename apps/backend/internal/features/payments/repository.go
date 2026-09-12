package payments

import (
	"database/sql"
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
		ORDER BY period, bill_type`
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
