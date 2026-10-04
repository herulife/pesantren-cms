package kas

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

type Category struct {
	ID        int       `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Kind      string    `json:"kind"`
	Creator   string    `json:"creator,omitempty"`
	Updater   string    `json:"updater,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	// IsAutoSource = 1 berarti nama kategori ini sama dengan salah satu sumber
	// otomatis (SPP/Iuran/Donasi). Nominal di kategori ini SENGAJA tidak
	// dijumlahkan ke KasIncome supaya tidak dobel (Jilid 75). Frontend memakai
	// flag ini untuk memberi peringatan sebelum bendahara menyimpan transaksi.
	IsAutoSource int `json:"is_auto_source"`
}

var ErrKasDuplicate = errors.New("transaksi sudah dicatat sebelumnya")

type Transaction struct {
	ID             int       `json:"id"`
	Code           string    `json:"code"`
	Date           string    `json:"date"`
	Kind           string    `json:"kind"`
	CategoryID     int       `json:"category_id"`
	Category       string    `json:"category,omitempty"`
	Amount         int       `json:"amount"`
	Method         string    `json:"method"`
	Notes          string    `json:"notes"`
	CreatedBy      int       `json:"created_by"`
	IdempotencyKey string    `json:"idempotency_key,omitempty"`
	Creator        string    `json:"creator,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type Summary struct {
	Income       int `json:"income"`
	Expense      int `json:"expense"`
	Balance      int `json:"balance"`
	CountIn      int `json:"count_in"`
	CountOut     int `json:"count_out"`
	SppIncome    int `json:"spp_income"`
	IuranIncome  int `json:"iuran_income"`
	DonasiIncome int `json:"donasi_income"`
	KasIncome    int `json:"kas_income"`
}

type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) ListCategories(kind string) ([]Category, error) {
	q := `SELECT c.id, c.code, c.name, c.kind, COALESCE(u1.name,''), COALESCE(u2.name,''), c.created_at, COALESCE(c.is_auto_source,0) FROM kas_categories c LEFT JOIN users u1 ON u1.id=c.created_by LEFT JOIN users u2 ON u2.id=c.updated_by`
	args := []interface{}{}
	if kind == "masuk" || kind == "keluar" {
		q += ` WHERE kind=?`
		args = append(args, kind)
	}
	q += ` ORDER BY c.kind, c.name`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Category{}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Kind, &c.Creator, &c.Updater, &c.CreatedAt, &c.IsAutoSource); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) CreateCategory(name, kind string, byID int) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO kas_categories (name, kind, created_by, updated_by) VALUES (?, ?, ?, ?)`, strings.TrimSpace(name), kind, byID, byID)
	if err != nil {
		return 0, err
	}
	id, _ := res.LastInsertId()
	code := padCat(id)
	_, _ = r.db.Exec(`UPDATE kas_categories SET code=? WHERE id=?`, code, id)
	return id, nil
}

func padCat(id int64) string {
	n := ""
	for v := id; v > 0; v /= 10 {
		n = string(rune('0'+v%10)) + n
	}
	if n == "" {
		n = "0"
	}
	for len(n) < 3 {
		n = "0" + n
	}
	return n
}

func (r *Repository) UpdateCategory(id int, name, kind string, byID int) error {
	_, err := r.db.Exec(`UPDATE kas_categories SET name=?, kind=?, updated_by=? WHERE id=?`, strings.TrimSpace(name), kind, byID, id)
	return err
}

func (r *Repository) DeleteCategory(id int) error {
	_, err := r.db.Exec(`DELETE FROM kas_categories WHERE id=?`, id)
	return err
}

func (r *Repository) ListTransactions(dateFrom, dateTo, kind string, categoryID int, limit, offset int) ([]Transaction, error) {
	where := []string{"COALESCE(t.voided,0) = 0"}
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
	q := `SELECT t.id, t.code, t.date, t.kind, t.category_id, COALESCE(c.name,''), t.amount, t.method, t.notes, t.created_by, COALESCE(u.name,''), t.created_at
		FROM kas_transactions t LEFT JOIN kas_categories c ON c.id=t.category_id LEFT JOIN users u ON u.id=t.created_by WHERE ` + strings.Join(where, " AND ") + ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Transaction{}
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Code, &t.Date, &t.Kind, &t.CategoryID, &t.Category, &t.Amount, &t.Method, &t.Notes, &t.CreatedBy, &t.Creator, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repository) CreateTransaction(t *Transaction) (int64, error) {
	if t.IdempotencyKey != "" {
		var existing int64
		if err := r.db.QueryRow(`SELECT id FROM kas_transactions WHERE idempotency_key = ?`, t.IdempotencyKey).Scan(&existing); err == nil {
			return existing, ErrKasDuplicate
		}
	}
	res, err := r.db.Exec(`INSERT INTO kas_transactions (date, kind, category_id, amount, method, notes, created_by, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		t.Date, t.Kind, t.CategoryID, t.Amount, t.Method, t.Notes, t.CreatedBy, sql.NullString{String: t.IdempotencyKey, Valid: t.IdempotencyKey != ""})
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			var existing int64
			if qerr := r.db.QueryRow(`SELECT id FROM kas_transactions WHERE idempotency_key = ?`, t.IdempotencyKey).Scan(&existing); qerr == nil {
				return existing, ErrKasDuplicate
			}
		}
		return 0, err
	}
	id, _ := res.LastInsertId()
	code := "KA" + strings.ReplaceAll(t.Date, "-", "") + pad6(id)
	_, _ = r.db.Exec(`UPDATE kas_transactions SET code=? WHERE id=?`, code, id)
	return id, nil
}

func pad6(id int64) string {
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
	if len(n) > 6 {
		return n[len(n)-6:]
	}
	return n
}

// VoidTransaction membatalkan transaksi kas TANPA menghapus baris (retensi).
func (r *Repository) VoidTransaction(id int, reason string, byID int) error {
	res, err := r.db.Exec(`UPDATE kas_transactions SET voided = 1, void_reason = ?, created_by = ? WHERE id = ? AND COALESCE(voided,0) = 0`, reason, byID, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) Summary(dateFrom, dateTo string) (*Summary, error) {
	where := []string{"COALESCE(voided,0) = 0"}
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
	var kasCountIn int
	// Kategori kas yang ditandai auto_source (nama SPP/Iuran/Donasi) SENGAJA
	// dikeluarkan dari kas_income: nominal di situ sudah dihitung lewat
	// SppIncome/IuranIncome/DonasiIncome dari tabel aslinya. Kalau ikut
	// dihitung, Income = Spp + Iuran + Donasi + Kas akan dobel (Jilid 75).
	notAuto := ` AND COALESCE(category_id,0) NOT IN (SELECT id FROM kas_categories WHERE COALESCE(is_auto_source,0)=1)`
	q := `SELECT COALESCE(SUM(CASE WHEN kind='masuk' THEN amount ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='keluar' THEN amount ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='masuk' THEN 1 ELSE 0 END),0), COALESCE(SUM(CASE WHEN kind='keluar' THEN 1 ELSE 0 END),0) FROM kas_transactions WHERE ` + strings.Join(where, " AND ") + notAuto
	if err := r.db.QueryRow(q, args...).Scan(&s.KasIncome, &s.Expense, &kasCountIn, &s.CountOut); err != nil {
		return nil, err
	}
	// count_in dihitung ulang di bawah: kasCountIn hanya menghitung baris kas
	// manual (sudah dikurangi kategori auto_source). Kalau tidak ditambah
	// bill SPP/Iuran dan donasi terverifikasi, kartu dashboard akan menulis
	// "Pemasukan (0)" padahal Income-nya miliaran (Jilid 75).
	var sppCount, iuranCount, donasiCount int
	sppF, sppA := dateFilter("paid_at", dateFrom, dateTo)
	if err := r.db.QueryRow(`SELECT COALESCE(SUM(paid_amount),0), COUNT(*) FROM spp_bills WHERE paid_amount>0`+sppF, sppA...).Scan(&s.SppIncome, &sppCount); err != nil {
		return nil, err
	}
	iurF, iurA := dateFilter("paid_at", dateFrom, dateTo)
	if err := r.db.QueryRow(`SELECT COALESCE(SUM(paid_amount),0), COUNT(*) FROM iuran_bills WHERE paid_amount>0`+iurF, iurA...).Scan(&s.IuranIncome, &iuranCount); err != nil {
		return nil, err
	}
	donF, donA := dateFilter("created_at", dateFrom, dateTo)
	var donFloat float64
	if err := r.db.QueryRow(`SELECT COALESCE(SUM(amount),0), COUNT(*) FROM donations WHERE status='verified'`+donF, donA...).Scan(&donFloat, &donasiCount); err != nil {
		return nil, err
	}
	s.DonasiIncome = int(donFloat)
	s.CountIn = kasCountIn + sppCount + iuranCount + donasiCount
	s.Income = s.SppIncome + s.IuranIncome + s.DonasiIncome + s.KasIncome
	s.Balance = s.Income - s.Expense
	return s, nil
}

func dateFilter(col, from, to string) (string, []interface{}) {
	where := ""
	args := []interface{}{}
	if from != "" {
		where += " AND substr(" + col + ",1,10)>=?"
		args = append(args, from)
	}
	if to != "" {
		where += " AND substr(" + col + ",1,10)<=?"
		args = append(args, to)
	}
	return where, args
}
