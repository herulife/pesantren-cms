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
	MotherName    string `json:"mother_name"`
	MotherPhone   string `json:"mother_phone"`
	TagihanPeriod string `json:"tagihan_period"`
	TagihanAmount int    `json:"tagihan_amount"`
	TagihanPaid   int    `json:"tagihan_paid"`
	TagihanStatus string `json:"tagihan_status"`
	TagihanDue    string `json:"tagihan_due"`
	TagihanKind   string `json:"tagihan_kind"`
	LunasReceiptNo string `json:"lunas_receipt_no"`
	LunasPeriod    string `json:"lunas_period"`
	LunasTotal     int    `json:"lunas_total"`
	LunasMethod    string `json:"lunas_method"`
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
			COALESCE(t.period, ''), COALESCE(t.amount, 0), COALESCE(t.paid_amount, 0),
			COALESCE(t.status, ''), COALESCE(t.due_date, ''), COALESCE(t.kind, ''),
			COALESCE(l.receipt_no, ''), COALESCE(l.period, ''),
			COALESCE(l.total, 0), COALESCE(l.method, '')
		FROM santri s
		LEFT JOIN (
			SELECT b.santri_id, b.period, b.amount, b.paid_amount, b.status, b.due_date, b.kind
			FROM (
				SELECT santri_id, period, amount, paid_amount, status, due_date, 'SPP' AS kind, created_at FROM spp_bills
				UNION ALL
				SELECT santri_id, period, amount, paid_amount, status, due_date, name AS kind, created_at FROM iuran_bills
			) b
			JOIN (
				SELECT santri_id, MAX(created_at) AS mct FROM (
					SELECT santri_id, created_at FROM spp_bills
					UNION ALL
					SELECT santri_id, created_at FROM iuran_bills
				) GROUP BY santri_id
			) m ON m.santri_id = b.santri_id AND m.mct = b.created_at
			GROUP BY b.santri_id
		) t ON t.santri_id = s.id
		LEFT JOIN receipts l ON l.id = (
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
			&it.TagihanPeriod, &it.TagihanAmount, &it.TagihanPaid, &it.TagihanStatus, &it.TagihanDue, &it.TagihanKind,
			&it.LunasReceiptNo, &it.LunasPeriod, &it.LunasTotal, &it.LunasMethod,
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
