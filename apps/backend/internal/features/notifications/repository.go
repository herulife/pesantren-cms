package notifications

import (
	"database/sql"
)

type TagihanTarget struct {
	Amount      int
	Description string
	Name        string
	Phone       string
}

type NilaiTarget struct {
	Name        string
	Phone       string
	Semester    string
	Year        string
	FinalScore  float64
	GradeLetter string
}

type PSBTarget struct {
	Name   string
	Phone  string
	Status string
}

type WARecipient struct {
	SantriID     int    `json:"santri_id"`
	Name         string `json:"name"`
	Nickname     string `json:"nickname"`
	Class        string `json:"class"`
	Status       string `json:"status"`
	ParentName   string `json:"parent_name"`
	ParentPhone  string `json:"parent_phone"`
	FatherName   string `json:"father_name"`
	FatherPhone  string `json:"father_phone"`
	MotherName   string `json:"mother_name"`
	MotherPhone  string `json:"mother_phone"`
	ReceiptNo    string `json:"receipt_no"`
	Period       string `json:"period"`
	ReceiptTotal int    `json:"receipt_total"`
	Method       string `json:"method"`
	ReceiptDate  string `json:"receipt_date"`
}

type Repository interface {
	GetPendingTagihan() ([]TagihanTarget, error)
	GetNilai() ([]NilaiTarget, error)
	GetPSBStatus() ([]PSBTarget, error)
	GetWARecipients() ([]WARecipient, error)
	GetSetting(key string) (string, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

// GetPendingTagihan mengambil tagihan AKTIF dari spp/iuran (sisa = amount-paid)
// plus baris pending tabel payments legacy. Diurut agar broadcast stabil.
func (r *repository) GetPendingTagihan() ([]TagihanTarget, error) {
	query := `
		SELECT amount - paid_amount, 'SPP ' || period, s.name, s.parent_phone
		FROM spp_bills b JOIN santri s ON s.id = b.santri_id
		WHERE b.status IN ('unpaid', 'partial', 'pending')
		  AND (b.amount - b.paid_amount) > 0
		  AND TRIM(COALESCE(s.parent_phone, '')) != ''
		UNION ALL
		SELECT amount - paid_amount, b.name || ' ' || period, s.name, s.parent_phone
		FROM iuran_bills b JOIN santri s ON s.id = b.santri_id
		WHERE b.status IN ('unpaid', 'partial', 'pending')
		  AND (b.amount - b.paid_amount) > 0
		  AND TRIM(COALESCE(s.parent_phone, '')) != ''
		UNION ALL
		SELECT p.amount, p.description, u.name, u.whatsapp
		FROM payments p
		JOIN users u ON p.user_id = u.id
		WHERE p.status = 'pending' AND TRIM(COALESCE(u.whatsapp, '')) != ''
		ORDER BY 2, 3
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []TagihanTarget
	for rows.Next() {
		var t TagihanTarget
		if err := rows.Scan(&t.Amount, &t.Description, &t.Name, &t.Phone); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *repository) GetNilai() ([]NilaiTarget, error) {
	query := `
		SELECT u.name, u.whatsapp, g.semester, g.academic_year, g.final_score, g.grade_letter
		FROM grades g
		JOIN users u ON g.student_id = u.id
		WHERE u.whatsapp != '' AND u.whatsapp IS NOT NULL
		ORDER BY u.id, g.subject_id
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []NilaiTarget
	for rows.Next() {
		var t NilaiTarget
		if err := rows.Scan(&t.Name, &t.Phone, &t.Semester, &t.Year, &t.FinalScore, &t.GradeLetter); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

func (r *repository) GetPSBStatus() ([]PSBTarget, error) {
	query := `
		SELECT full_name,
			COALESCE(NULLIF(TRIM(parent_phone), ''), NULLIF(TRIM(father_phone), ''), NULLIF(TRIM(mother_phone), '')),
			status
		FROM registrations
		WHERE COALESCE(NULLIF(TRIM(parent_phone), ''), NULLIF(TRIM(father_phone), ''), NULLIF(TRIM(mother_phone), '')) IS NOT NULL
		AND status IN ('pending', 'accepted', 'rejected')
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []PSBTarget
	for rows.Next() {
		var t PSBTarget
		if err := rows.Scan(&t.Name, &t.Phone, &t.Status); err == nil {
			targets = append(targets, t)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

// GetWARecipients mengambil seluruh santri beserta nama/nomor wali dan kwitansi
// terakhir (receipts) untuk dropdown "kirim pesan" yang cepat.
func (r *repository) GetWARecipients() ([]WARecipient, error) {
	query := `
		SELECT s.id, s.name, s.nickname, s.class, s.status,
			COALESCE(NULLIF(TRIM(s.parent_name), ''), ''),
			COALESCE(NULLIF(TRIM(s.parent_phone), ''), ''),
			COALESCE(NULLIF(TRIM(s.father_name), ''), ''),
			COALESCE(NULLIF(TRIM(s.father_phone), ''), ''),
			COALESCE(NULLIF(TRIM(s.mother_name), ''), ''),
			COALESCE(NULLIF(TRIM(s.mother_phone), ''), ''),
			COALESCE(r.receipt_no, ''), COALESCE(r.period, ''),
			COALESCE(r.total, 0), COALESCE(r.method, ''), COALESCE(r.created_at, '')
		FROM santri s
		LEFT JOIN receipts r ON r.id = (
			SELECT r2.id FROM receipts r2 WHERE r2.santri_id = s.id ORDER BY r2.id DESC LIMIT 1
		)
		ORDER BY s.name
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []WARecipient
	for rows.Next() {
		var it WARecipient
		if err := rows.Scan(
			&it.SantriID, &it.Name, &it.Nickname, &it.Class, &it.Status,
			&it.ParentName, &it.ParentPhone,
			&it.FatherName, &it.FatherPhone,
			&it.MotherName, &it.MotherPhone,
			&it.ReceiptNo, &it.Period, &it.ReceiptTotal, &it.Method, &it.ReceiptDate,
		); err == nil {
			items = append(items, it)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// GetSetting membaca satu key dari tabel settings ('' bila tidak ada).
func (r *repository) GetSetting(key string) (string, error) {
	var v string
	err := r.db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&v)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return v, nil
}
