package spp

// AutoBillRecipient adalah data santri + nomor WA wali untuk pengiriman
// notifikasi tagihan SPP otomatis.
type AutoBillRecipient struct {
	Name   string
	Phone  string
	Period string
	Amount int
}

// CountBillsByPeriod menghitung tagihan SPP yang sudah ada pada periode YYYY-MM.
// Dipakai scheduler otomatis supaya tidak membuat tagihan dobel.
func (r *Repository) CountBillsByPeriod(period string) (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM spp_bills WHERE period = ?`, period).Scan(&count)
	return count, err
}

// GenerateAutoBills membuat tagihan SPP untuk semua santri aktif pada satu
// periode (INSERT OR IGNORE, tidak mendobelkan yang sudah ada). Mengembalikan
// jumlah tagihan baru + daftar penerima WA (nama + nomor HP wali).
func (r *Repository) GenerateAutoBills(period string, amount int, dueDate string) (int, []AutoBillRecipient, error) {
	rows, err := r.db.Query(`
		SELECT id,
		       COALESCE(NULLIF(TRIM(name), ''), 'Santri'),
		       COALESCE(NULLIF(TRIM(parent_phone), ''), NULLIF(TRIM(father_phone), ''), NULLIF(TRIM(mother_phone), ''), '')
		FROM santri
		WHERE status = 'aktif'
		  AND NOT EXISTS (
		      SELECT 1 FROM spp_bills b WHERE b.santri_id = santri.id AND b.period = ?
		  )
		ORDER BY id`, period)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	var santris []struct {
		ID    int
		Name  string
		Phone string
	}
	for rows.Next() {
		var s struct {
			ID    int
			Name  string
			Phone string
		}
		if err := rows.Scan(&s.ID, &s.Name, &s.Phone); err != nil {
			return 0, nil, err
		}
		santris = append(santris, s)
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}

	created := 0
	var recipients []AutoBillRecipient
	for _, s := range santris {
		res, err := r.db.Exec(
			`INSERT OR IGNORE INTO spp_bills (santri_id, period, amount, due_date) VALUES (?, ?, ?, ?)`,
			s.ID, period, amount, dueDate,
		)
		if err != nil {
			return created, recipients, err
		}
		if n, _ := res.RowsAffected(); n > 0 {
			created++
			if s.Phone != "" {
				recipients = append(recipients, AutoBillRecipient{
					Name:   s.Name,
					Phone:  s.Phone,
					Period: period,
					Amount: amount,
				})
			}
		}
	}
	return created, recipients, nil
}