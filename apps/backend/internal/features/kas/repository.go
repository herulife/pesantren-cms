package kas

import (
	"database/sql"
	"strings"
	"time"
)

type Category struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Kind      string    `json:"kind"`
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID         int       `json:"id"`
	Date       string    `json:"date"`
	Kind       string    `json:"kind"`
	CategoryID int       `json:"category_id"`
	Category   string    `json:"category,omitempty"`
	Amount     int       `json:"amount"`
	Method     string    `json:"method"`
	Notes      string    `json:"notes"`
	CreatedBy  int       `json:"created_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type Summary struct {
	Income   int `json:"income"`
	Expense  int `json:"expense"`
	Balance  int `json:"balance"`
	CountIn  int `json:"count_in"`
	CountOut int `json:"count_out"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) ListCategories(kind string) ([]Category, error) {
	q := `SELECT id, name, kind, created_at FROM kas_categories`
	args := []interface{}{}
	if kind == "masuk" || kind == "keluar" {
		q += ` WHERE kind=?`
		args = append(args, kind)
	}
	q += ` ORDER BY kind, name`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Category{}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Kind, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) CreateCategory(name, kind string) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO kas_categories (name, kind) VALUES (?, ?)`, strings.TrimSpace(name), kind)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) DeleteCategory(id int) error {
	_, err := r.db.Exec(`DELETE FROM kas_categories WHERE id=?`, id)
	return err
}

func (r *Repository) ListTransactions(dateFrom, dateTo, kind string, categoryID int, limit, offset int) ([]Transaction, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	if dateFrom != "" {
		where = append(where, "t.date >= ?")
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		where = append(where, "t.date <= ?")
		args = append(args, dateTo)
	}
	if kind == "masuk" || kind == "keluar" {
		where = append(where, "t.kind = ?")
		args = append(args, kind)
	}
	if categoryID > 0 {
		where = append(where, "t.category_id = ?")
		args = append(args, categoryID)
	}
	q := `SELECT t.id, t.date, t.kind, t.category_id, COALESCE(c.name,''), t.amount, t.method, t.notes, t.created_by, t.created_at
		FROM kas_transactions t LEFT JOIN kas_categories c ON c.id=t.category_id WHERE ` + strings.Join(where, " AND ") + ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Transaction{}
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Date, &t.Kind, &t.CategoryID, &t.Category, &t.Amount, &t.Method, &t.Notes, &t.CreatedBy, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repository) CreateTransaction(t *Transaction) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO kas_transactions (date, kind, category_id, amount, method, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		t.Date, t.Kind, t.CategoryID, t.Amount, t.Method, t.Notes, t.CreatedBy)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) DeleteTransaction(id int) error {
	_, err := r.db.Exec(`DELETE FROM kas_transactions WHERE id=?`, id)
	return err
}

func (r *Repository) Summary(dateFrom, dateTo string) (*Summary, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	if dateFrom != "" {
		where = append(where, "date >= ?")
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		where = append(where, "date <= ?")
		args = append(args, dateTo)
	}
	s := &Summary{}
	q := `SELECT COALESCE(SUM(CASE WHEN kind='masuk' THEN amount ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='keluar' THEN amount ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='masuk' THEN 1 ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='keluar' THEN 1 ELSE 0 END),0) FROM kas_transactions WHERE ` + strings.Join(where, " AND ")
	if err := r.db.QueryRow(q, args...).Scan(&s.Income, &s.Expense, &s.CountIn, &s.CountOut); err != nil {
		return nil, err
	}
	s.Balance = s.Income - s.Expense
	return s, nil
}
