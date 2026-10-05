package kas

import (
	"fmt"
	"strings"
)

// Jilid 75 - Papan Kas.
//
// Untuk BENDahara, bukan untuk developer. Pertanyaan yang harus bisa dijawab
// satu layar: "Uang masuk periode ini berapa, dari mana, dan ada yang
// tidak beres?"
//
// Semua angka di sini berasal dari SATU query per sumber, lalu dijumlahkan di
// satu tempat (total_income). Frontend tidak boleh menghitung ulang sendiri —
// kalau frontend menjumlahkan, daftar sumber di sini dan tampilan bisa berbeda.

// AuditSource adalah satu sumber pemasukan, lengkap dengan asal tabelnya.
type AuditSource struct {
	Key     string `json:"key"`
	Label   string `json:"label"`
	Amount  int    `json:"amount"`
	Count   int    `json:"count"`
	Origin  string `json:"origin"` // "otomatis" | "manual"
	Table   string `json:"table"`  // sumber tabel, ditampilkan ke user
	Warning string `json:"warning,omitempty"`
}

// AuditRow adalah baris pendukung sebuah sumber (untuk drill-down).
type AuditRow struct {
	ID     int    `json:"id"`
	Date   string `json:"date"`
	Label  string `json:"label"`
	Detail string `json:"detail"`
	Amount int    `json:"amount"`
}

// AuditExpenseGroup = pengeluaran dikelompokkan per kategori kas.
//
// Jilid 80 (laporan Laba Rugi). Sebelumnyafrontend harus menjumlahkan
// pengeluaran sendiri dari /kas/transactions — padahal endpoint itu limited
// 50 baris, jadi Laba Rugi bisa meleset begitu data tumbuh. Angka resmi
// sekarang dihitung di sini, satu sumber kebenaran bersama Audit.Expense.
type AuditExpenseGroup struct {
	CategoryID int    `json:"category_id"` // 0 = transaksi tanpa kategori
	Label      string `json:"label"`
	Amount     int    `json:"amount"`
	Count      int    `json:"count"`
}

type AuditAnomaly struct {
	Severity string `json:"severity"` // "warning" | "info"
	Title    string `json:"title"`
	Detail   string `json:"detail"`
	Amount   int    `json:"amount,omitempty"` // nominal rupiah, 0 kalau tidak relevan
	Count    int    `json:"count,omitempty"`  // jumlah baris, 0 kalau tidak relevan
	Scope    string `json:"scope"`            // "periode ini" | "seluruh riwayat"
}

type Audit struct {
	DateFrom    string        `json:"date_from,omitempty"`
	DateTo      string        `json:"date_to,omitempty"`
	Sources     []AuditSource `json:"sources"`
	TotalIncome int           `json:"total_income"`
	Expense     int           `json:"expense"`
	Balance     int           `json:"balance"`
	CountIn     int           `json:"count_in"`
	CountOut    int           `json:"count_out"`
	// ExcludedAmount = nominal yang sengaja TIDAK masuk total_income karena
	// kategori kas-nya auto_source (sudah terhitung di sumber aslinya).
	// Ditampilkan terpisah supaya bendahara tidak mengira uangnya hilang.
	ExcludedAmount int                   `json:"excluded_amount"`
	ExcludedCount  int                   `json:"excluded_count"`
	ExcludedRows   []AuditRow            `json:"excluded_rows"`
	Rows           map[string][]AuditRow `json:"rows"`
	Anomalies      []AuditAnomaly        `json:"anomalies"`
	// ExpenseGroups = pengeluaran per kategori, bahan laporan Laba Rugi.
	ExpenseGroups []AuditExpenseGroup `json:"expense_groups"`
}

func (r *Repository) Audit(dateFrom, dateTo string) (*Audit, error) {
	a := &Audit{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Rows:     map[string][]AuditRow{},
	}

	sum := func(sql string, args ...interface{}) (int, int, error) {
		var amount, count int
		err := r.db.QueryRow(sql, args...).Scan(&amount, &count)
		return amount, count, err
	}

	// --- 1. SPP (otomatis dari spp_bills) ---
	sppF, sppA := dateFilter("paid_at", dateFrom, dateTo)
	sppAmount, sppCount, err := sum(
		`SELECT COALESCE(SUM(paid_amount),0), COUNT(*) FROM spp_bills WHERE paid_amount>0`+sppF, sppA...)
	if err != nil {
		return nil, err
	}

	// --- 2. Iuran (otomatis dari iuran_bills) ---
	iurF, iurA := dateFilter("paid_at", dateFrom, dateTo)
	iurAmount, iurCount, err := sum(
		`SELECT COALESCE(SUM(paid_amount),0), COUNT(*) FROM iuran_bills WHERE paid_amount>0`+iurF, iurA...)
	if err != nil {
		return nil, err
	}

	// --- 3. Donasi terverifikasi (otomatis dari donations) ---
	// donF HARUS pakai alias "d." karena donation_campaigns juga punya kolom
	// created_at; tanpa ini query drill-down donasi gagal "ambiguous column".
	donF, donA := dateFilter("d.created_at", dateFrom, dateTo)
	var donFloat float64
	var donCount int
	if err := r.db.QueryRow(
		`SELECT COALESCE(SUM(d.amount),0), COUNT(*) FROM donations d WHERE d.status='verified'`+donF, donA...).
		Scan(&donFloat, &donCount); err != nil {
		return nil, err
	}
	donAmount := int(donFloat)

	// --- 4. Kas manual (otomatis dari kas_transactions, bukan kategori auto) ---
	manWhere := []string{"COALESCE(t.voided,0) = 0", "t.kind='masuk'",
		`COALESCE(t.category_id,0) NOT IN (SELECT id FROM kas_categories WHERE COALESCE(is_auto_source,0)=1)`}
	manArgs := []interface{}{}
	if dateFrom != "" {
		manWhere = append(manWhere, "t.date >= ?")
		manArgs = append(manArgs, dateFrom)
	}
	if dateTo != "" {
		manWhere = append(manWhere, "t.date <= ?")
		manArgs = append(manArgs, dateTo)
	}
	manAmount, manCount, err := sum(
		`SELECT COALESCE(SUM(t.amount),0), COUNT(*) FROM kas_transactions t WHERE `+
			strings.Join(manWhere, " AND "), manArgs...)
	if err != nil {
		return nil, err
	}

	a.Sources = []AuditSource{
		{Key: "spp", Label: "SPP", Amount: sppAmount, Count: sppCount,
			Origin: "otomatis", Table: "spp_bills"},
		{Key: "iuran", Label: "Iuran", Amount: iurAmount, Count: iurCount,
			Origin: "otomatis", Table: "iuran_bills"},
		{Key: "donasi", Label: "Donasi", Amount: donAmount, Count: donCount,
			Origin: "otomatis", Table: "donations"},
		{Key: "manual", Label: "Kas manual", Amount: manAmount, Count: manCount,
			Origin: "manual", Table: "kas_transactions"},
	}

	for _, s := range a.Sources {
		a.TotalIncome += s.Amount
		a.CountIn += s.Count
	}

	// Pengeluaran: semua kategori, tidak ada pengecualian (tidak ada sumber
	// otomatis untuk pengeluaran).
	expWhere := []string{"COALESCE(voided,0) = 0", "kind='keluar'"}
	expArgs := []interface{}{}
	if dateFrom != "" {
		expWhere = append(expWhere, "date >= ?")
		expArgs = append(expArgs, dateFrom)
	}
	if dateTo != "" {
		expWhere = append(expWhere, "date <= ?")
		expArgs = append(expArgs, dateTo)
	}
	if err := r.db.QueryRow(
		`SELECT COALESCE(SUM(amount),0), COUNT(*) FROM kas_transactions WHERE `+
			strings.Join(expWhere, " AND "), expArgs...).
		Scan(&a.Expense, &a.CountOut); err != nil {
		return nil, err
	}
	a.Balance = a.TotalIncome - a.Expense

	// Pengeluaran per kategori (Laba Rugi). Pakai expWhere/expArgs yang SAMA
	// dengan total di atas supaya penjumlahan baris selalu cocok dengan
	// a.Expense. Kalau difilter berbeda, Laba Rugi bisa tidak balance.
	a.ExpenseGroups = []AuditExpenseGroup{}
	expGroupQuery := `SELECT COALESCE(t.category_id,0), COALESCE(c.name,'Tanpa kategori'), ` +
		`COALESCE(SUM(t.amount),0), COUNT(*) FROM kas_transactions t ` +
		`LEFT JOIN kas_categories c ON c.id=t.category_id WHERE ` +
		strings.Join(expWhere, " AND ") + ` GROUP BY COALESCE(t.category_id,0), c.name ` +
		`ORDER BY 3 DESC, 2 ASC`
	expGroupRows, err := r.db.Query(expGroupQuery, expArgs...)
	if err != nil {
		return nil, err
	}
	for expGroupRows.Next() {
		var g AuditExpenseGroup
		if err := expGroupRows.Scan(&g.CategoryID, &g.Label, &g.Amount, &g.Count); err != nil {
			expGroupRows.Close()
			return nil, err
		}
		a.ExpenseGroups = append(a.ExpenseGroups, g)
	}
	if err := expGroupRows.Err(); err != nil {
		expGroupRows.Close()
		return nil, err
	}
	expGroupRows.Close()

	// --- Baris pendukung: SPP ---
	if rows, err := r.auditRowsSpp(sppF, sppA); err == nil {
		a.Rows["spp"] = rows
	} else {
		return nil, err
	}
	// --- Baris pendukung: Iuran ---
	if rows, err := r.auditRowsIuran(iurF, iurA); err == nil {
		a.Rows["iuran"] = rows
	} else {
		return nil, err
	}
	// --- Baris pendukung: Donasi ---
	if rows, err := r.auditRowsDonasi(donF, donA); err == nil {
		a.Rows["donasi"] = rows
	} else {
		return nil, err
	}
	// --- Baris pendukung: Kas manual ---
	if rows, err := r.auditRowsManual(manWhere, manArgs); err == nil {
		a.Rows["manual"] = rows
	} else {
		return nil, err
	}
	// --- Transaksi yang dikecualikan (bukan hilang) ---
	exRows, exAmount, exCount, err := r.auditRowsExcluded(dateFrom, dateTo)
	if err != nil {
		return nil, err
	}
	a.ExcludedRows, a.ExcludedAmount, a.ExcludedCount = exRows, exAmount, exCount

	if err := r.collectAnomalies(a, dateFrom, dateTo); err != nil {
		return nil, err
	}
	return a, nil
}

func (r *Repository) auditRowsSpp(f string, args []interface{}) ([]AuditRow, error) {
	q := `SELECT b.id, COALESCE(b.paid_at,''), COALESCE(s.name,'(santri terhapus)'), COALESCE(b.period,''), COALESCE(b.paid_amount,0)
		FROM spp_bills b LEFT JOIN santri s ON s.id=b.santri_id
		WHERE b.paid_amount>0` + f
	if f != "" {
		q += ` ORDER BY b.paid_at ASC`
	}
	return r.scanRows(q, args)
}

func (r *Repository) auditRowsIuran(f string, args []interface{}) ([]AuditRow, error) {
	q := `SELECT b.id, COALESCE(b.paid_at,''), COALESCE(s.name,'(santri terhapus)'), COALESCE(b.name,''), COALESCE(b.paid_amount,0)
		FROM iuran_bills b LEFT JOIN santri s ON s.id=b.santri_id
		WHERE b.paid_amount>0` + f
	if f != "" {
		q += ` ORDER BY b.paid_at ASC`
	}
	return r.scanRows(q, args)
}

func (r *Repository) auditRowsDonasi(f string, args []interface{}) ([]AuditRow, error) {
	q := `SELECT d.id, COALESCE(d.created_at,''), COALESCE(d.donor_name,'(anonim)'),
		COALESCE(c.title,'(tanpa campaign)'), CAST(COALESCE(d.amount,0) AS INTEGER)
		FROM donations d LEFT JOIN donation_campaigns c ON c.id=d.campaign_id
		WHERE d.status='verified'` + f
	if f != "" {
		q += ` ORDER BY d.created_at ASC`
	}
	return r.scanRows(q, args)
}

func (r *Repository) auditRowsManual(where []string, args []interface{}) ([]AuditRow, error) {
	q := `SELECT t.id, COALESCE(t.date,''), COALESCE(c.name,'(tanpa kategori)'),
		COALESCE(NULLIF(t.notes,''), COALESCE(u.name,'')), COALESCE(t.amount,0)
		FROM kas_transactions t
		LEFT JOIN kas_categories c ON c.id=t.category_id
		LEFT JOIN users u ON u.id=t.created_by
		WHERE ` + strings.Join(where, " AND ") + ` ORDER BY t.date ASC, t.id ASC`
	return r.scanRows(q, args)
}

// auditRowsExcluded mengambil transaksi kas yang TIDAK dihitung karena
// kategorinya auto_source. Ini justru bagian yang paling rawan bikin
// bendahara bingung ("kenapa Rp5 juta ini tidak muncul?"), jadi harus
// ditampilkan, bukan disembunyikan.
func (r *Repository) auditRowsExcluded(dateFrom, dateTo string) ([]AuditRow, int, int, error) {
	where := []string{"COALESCE(t.voided,0) = 0", "t.kind='masuk'",
		`COALESCE(t.category_id,0) IN (SELECT id FROM kas_categories WHERE COALESCE(is_auto_source,0)=1)`}
	args := []interface{}{}
	if dateFrom != "" {
		where = append(where, "t.date >= ?")
		args = append(args, dateFrom)
	}
	if dateTo != "" {
		where = append(where, "t.date <= ?")
		args = append(args, dateTo)
	}
	q := `SELECT t.id, COALESCE(t.date,''), COALESCE(c.name,''), COALESCE(t.notes,''), COALESCE(t.amount,0)
		FROM kas_transactions t LEFT JOIN kas_categories c ON c.id=t.category_id
		WHERE ` + strings.Join(where, " AND ") + ` ORDER BY t.date ASC, t.id ASC`
	rows, err := r.scanRows(q, args)
	if err != nil {
		return nil, 0, 0, err
	}
	total := 0
	for _, row := range rows {
		total += row.Amount
	}
	return rows, total, len(rows), nil
}

func (r *Repository) scanRows(q string, args []interface{}) ([]AuditRow, error) {
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AuditRow{}
	for rows.Next() {
		var row AuditRow
		if err := rows.Scan(&row.ID, &row.Date, &row.Label, &row.Detail, &row.Amount); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

// collectAnomalies mencari hal yang perlu dilihat manusia. Semuanya dalam
// bahasa sehari-hari, bukan istilah database.
func (r *Repository) collectAnomalies(a *Audit, dateFrom, dateTo string) error {
	a.Anomalies = []AuditAnomaly{}

	// 1. Transaksi manual di kategori auto_source -> rawan dobel hitung.
	if a.ExcludedCount > 0 {
		catNames := map[string]bool{}
		qCat := `SELECT DISTINCT c.name FROM kas_transactions t
			JOIN kas_categories c ON c.id=t.category_id
			WHERE COALESCE(t.voided,0)=0 AND t.kind='masuk'
			  AND COALESCE(t.category_id,0) IN (SELECT id FROM kas_categories WHERE COALESCE(is_auto_source,0)=1)`
		catArgs := []interface{}{}
		// Scope sama dengan ExcludedCount supaya judul dan daftar kategori
		// tidak saling berbeda saat periode dipakai.
		if dateFrom != "" {
			qCat += " AND t.date >= ?"
			catArgs = append(catArgs, dateFrom)
		}
		if dateTo != "" {
			qCat += " AND t.date <= ?"
			catArgs = append(catArgs, dateTo)
		}
		rows, err := r.db.Query(qCat, catArgs...)
		if err != nil {
			return err
		}
		for rows.Next() {
			var n string
			if rows.Scan(&n) == nil {
				catNames[strings.ToLower(n)] = true
			}
		}
		rows.Close()
		list := make([]string, 0, len(catNames))
		for n := range catNames {
			list = append(list, strings.ToUpper(n))
		}
		a.Anomalies = append(a.Anomalies, AuditAnomaly{
			Severity: "warning",
			Title:    fmt.Sprintf("%d transaksi dicatat di kategori \"%s\"", a.ExcludedCount, strings.Join(list, ", ")),
			Detail:   "Kategori ini punya nama yang sama dengan sumber di atas, jadi nomornya TIDAK dijumlahkan lagi supaya tidak terhitung 2x. Kalau ini memang uang yang sama dengan SPP/donasi, sudah aman. Kalau uang lain yang belum masuk hitungan mana pun, catat ulang di kategori biasa.",
			Amount:   a.ExcludedAmount,
			Count:    a.ExcludedCount,
			Scope:    "periode ini",
		})
	}

	// 2. Donasi menunggu verifikasi -> belum masuk total, tapi uangnya mungkin sudah masuk.
	var pendAmount float64
	var pendCount int
	if err := r.db.QueryRow(`SELECT COALESCE(SUM(amount),0), COUNT(*) FROM donations WHERE status='pending'`).
		Scan(&pendAmount, &pendCount); err != nil {
		return err
	}
	if pendCount > 0 {
		a.Anomalies = append(a.Anomalies, AuditAnomaly{
			Severity: "info",
			Title:    fmt.Sprintf("%d donasi menunggu verifikasi", pendCount),
			Detail:   "Belum masuk total pemasukan. Verifikasi di menu Donasi agar ikut terhitung.",
			Amount:   int(pendAmount),
			Count:    pendCount,
			Scope:    "seluruh riwayat",
		})
	}

	// 3. Pembayaran PSB Rp0 / status tidak wajar.
	var zeroCount int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM psb_payments WHERE COALESCE(amount,0)<=0`).Scan(&zeroCount); err != nil {
		return err
	}
	if zeroCount > 0 {
		a.Anomalies = append(a.Anomalies, AuditAnomaly{
			Severity: "warning",
			Title:    fmt.Sprintf("%d pembayaran PSB bernilai Rp0", zeroCount),
			Detail:   "Nominal nol tidak bisa jadi bukti lunas. Periksa di menu PSB.",
			Count:    zeroCount,
			Scope:    "seluruh riwayat",
		})
	}

	// 4. Tagihan lunas tapi belum ada pembayarannya (inkonsisten internal).
	var mismatch int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM spp_bills
		WHERE (status='paid' AND COALESCE(paid_amount,0)<=0)
		   OR (status<>'paid' AND COALESCE(paid_amount,0)>0)`).Scan(&mismatch); err != nil {
		return err
	}
	if mismatch > 0 {
		a.Anomalies = append(a.Anomalies, AuditAnomaly{
			Severity: "warning",
			Title:    fmt.Sprintf("%d tagihan SPP statusnya tidak cocok dengan pembayarannya", mismatch),
			Detail:   "Status \"lunas\" tapi belum ada pembayaran, atau sebaliknya. Perlu diperiksa manual.",
			Count:    mismatch,
			Scope:    "seluruh riwayat",
		})
	}

	// 5. Lebih bayar.
	var over int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM spp_bills WHERE COALESCE(paid_amount,0) > COALESCE(amount,0)`).Scan(&over); err != nil {
		return err
	}
	if over > 0 {
		a.Anomalies = append(a.Anomalies, AuditAnomaly{
			Severity: "info",
			Title:    fmt.Sprintf("%d tagihan SPP melebihi nominal tagihan", over),
			Detail:   "Biasanya karena uang bulat dibulatkan ke atas. Tidak salah, tapi perlu diketahui.",
			Count:    over,
			Scope:    "seluruh riwayat",
		})
	}

	return nil
}
