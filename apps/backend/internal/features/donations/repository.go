package donations

import (
	"database/sql"
	"errors"
	"time"
)

var errDonationLocked = errors.New("transaksi yang sudah terverifikasi tidak bisa diubah/dihapus")

type Campaign struct {
	ID              int        `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	TargetAmount    float64    `json:"target_amount"`
	CollectedAmount float64    `json:"collected_amount"`
	DonorCount      int        `json:"donor_count"`
	ImageURL        string     `json:"image_url"`
	IsActive        int        `json:"is_active"`
	EndDate         *time.Time `json:"end_date"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type Donation struct {
	ID            int        `json:"id"`
	CampaignID    int        `json:"campaign_id"`
	CampaignTitle string     `json:"campaign_title"`
	DonorID       *int       `json:"donor_id"`
	DonorName     string     `json:"donor_name"`
	DonorPhone    string     `json:"donor_phone"`
	Amount        float64    `json:"amount"`
	Type          string     `json:"type"`
	PaymentMethod string     `json:"payment_method"`
	ProofURL      string     `json:"proof_url"`
	Notes         string     `json:"notes"`
	Status        string     `json:"status"`
	VerifiedAt    *time.Time `json:"verified_at"`
	VerifiedBy    *int       `json:"verified_by"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Donor struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAllCampaigns(activeOnly bool, search string) ([]Campaign, error) {
	query := "SELECT id, title, description, target_amount, collected_amount, image_url, is_active, end_date, created_at, updated_at," +
		"(SELECT COUNT(*) FROM donations d WHERE d.campaign_id = donation_campaigns.id AND d.status = 'verified') AS donor_count " +
		"FROM donation_campaigns WHERE 1=1"
	var args []interface{}

	if activeOnly {
		query += " AND is_active = 1"
	}
	if search != "" {
		query += " AND (title LIKE ? OR description LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Campaign
	for rows.Next() {
		var c Campaign
		var endDate sql.NullString
		var createdAt, updatedAt string
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TargetAmount, &c.CollectedAmount, &c.ImageURL, &c.IsActive, &endDate, &createdAt, &updatedAt, &c.DonorCount)
		if err != nil {
			return nil, err
		}
		c.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		c.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		if endDate.Valid && endDate.String != "" {
			t, _ := time.Parse("2006-01-02 15:04:05", endDate.String)
			c.EndDate = &t
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) FindAllDonations(campaignID int, status, search, donationType string) ([]Donation, error) {
	query := `
		SELECT d.id, d.campaign_id, c.title as campaign_title, d.donor_id, d.donor_name, d.donor_phone, d.amount, d.type, d.payment_method, d.proof_url, d.notes, d.status, d.verified_at, d.verified_by, d.created_at
		FROM donations d
		LEFT JOIN donation_campaigns c ON d.campaign_id = c.id
		WHERE 1=1`
	var args []interface{}

	if campaignID > 0 {
		query += " AND d.campaign_id = ?"
		args = append(args, campaignID)
	}
	if status != "" {
		query += " AND d.status = ?"
		args = append(args, status)
	}
	if donationType != "" {
		query += " AND d.type = ?"
		args = append(args, donationType)
	}
	if search != "" {
		query += " AND (d.donor_name LIKE ? OR d.donor_phone LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	query += " ORDER BY d.created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Donation
	for rows.Next() {
		var d Donation
		var campaignTitle sql.NullString
		var donorID sql.NullInt64
		var verifiedAt sql.NullString
		var createdAt string
		var verifiedBy sql.NullInt64
		err := rows.Scan(&d.ID, &d.CampaignID, &campaignTitle, &donorID, &d.DonorName, &d.DonorPhone, &d.Amount, &d.Type, &d.PaymentMethod, &d.ProofURL, &d.Notes, &d.Status, &verifiedAt, &verifiedBy, &createdAt)
		if err != nil {
			return nil, err
		}
		if campaignTitle.Valid {
			d.CampaignTitle = campaignTitle.String
		}
		if donorID.Valid {
			v := int(donorID.Int64)
			d.DonorID = &v
		}
		if verifiedBy.Valid {
			v := int(verifiedBy.Int64)
			d.VerifiedBy = &v
		}
		d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		if verifiedAt.Valid && verifiedAt.String != "" {
			t, _ := time.Parse("2006-01-02 15:04:05", verifiedAt.String)
			d.VerifiedAt = &t
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *Repository) CreateDonation(d *Donation) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO donations (campaign_id, donor_id, donor_name, donor_phone, amount, type, payment_method, proof_url, notes, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
		d.CampaignID, nullableInt(d.DonorID), d.DonorName, d.DonorPhone, d.Amount, d.Type, d.PaymentMethod, d.ProofURL, d.Notes)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func nullableInt(v *int) interface{} {
	if v == nil {
		return nil
	}
	return *v
}

func (r *Repository) UpdateDonation(d *Donation) error {
	var status string
	err := r.db.QueryRow(`SELECT status FROM donations WHERE id = ?`, d.ID).Scan(&status)
	if err != nil {
		return err
	}
	if status == "verified" {
		return errDonationLocked
	}
	// proof_url tidak pernah dihapus diam-diam: form edit admin tidak mengirim
	// balik proof_url, jadi string kosong berarti "tidak diubah", bukan "hapus".
	// Bukti transfer sakral — begitu hilang tidak ada sumbernya lagi.
	_, err = r.db.Exec(`
		UPDATE donations SET campaign_id = ?, donor_id = ?, donor_name = ?, donor_phone = ?, amount = ?, type = ?, payment_method = ?,
			proof_url = CASE WHEN ? = '' THEN proof_url ELSE ? END,
			notes = ?
		WHERE id = ?`,
		d.CampaignID, nullableInt(d.DonorID), d.DonorName, d.DonorPhone, d.Amount, d.Type, d.PaymentMethod,
		d.ProofURL, d.ProofURL, d.Notes, d.ID)
	return err
}

func (r *Repository) DeleteDonation(id int) error {
	var status string
	err := r.db.QueryRow(`SELECT status FROM donations WHERE id = ?`, id).Scan(&status)
	if err != nil {
		return err
	}
	if status == "verified" {
		return errDonationLocked
	}
	_, err = r.db.Exec(`DELETE FROM donations WHERE id = ?`, id)
	return err
}

func (r *Repository) FindAllDonors(search string) ([]Donor, error) {
	query := `SELECT id, name, address, phone, notes, created_at, updated_at FROM donors WHERE 1=1`
	var args []interface{}
	if search != "" {
		query += ` AND (name LIKE ? OR phone LIKE ?)`
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	query += ` ORDER BY name ASC`
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Donor
	for rows.Next() {
		var d Donor
		var createdAt, updatedAt string
		if err := rows.Scan(&d.ID, &d.Name, &d.Address, &d.Phone, &d.Notes, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		d.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		list = append(list, d)
	}
	return list, nil
}

func (r *Repository) FindDonorByID(id int) (*Donor, error) {
	var d Donor
	var createdAt, updatedAt string
	err := r.db.QueryRow(`SELECT id, name, address, phone, notes, created_at, updated_at FROM donors WHERE id = ?`, id).
		Scan(&d.ID, &d.Name, &d.Address, &d.Phone, &d.Notes, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	d.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return &d, nil
}

func (r *Repository) CreateDonor(d *Donor) error {
	_, err := r.db.Exec(`INSERT INTO donors (name, address, phone, notes) VALUES (?, ?, ?, ?)`,
		d.Name, d.Address, d.Phone, d.Notes)
	return err
}

func (r *Repository) UpdateDonor(d *Donor) error {
	_, err := r.db.Exec(`UPDATE donors SET name = ?, address = ?, phone = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		d.Name, d.Address, d.Phone, d.Notes, d.ID)
	return err
}

func (r *Repository) DeleteDonor(id int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`UPDATE donations SET donor_id = NULL WHERE donor_id = ?`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM donors WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *Repository) FindDonationByID(id int) (*Donation, error) {
	query := `
		SELECT d.id, d.campaign_id, c.title as campaign_title, d.donor_id, d.donor_name, d.donor_phone, d.amount, d.type, d.payment_method, d.proof_url, d.notes, d.status, d.verified_at, d.verified_by, d.created_at
		FROM donations d
		LEFT JOIN donation_campaigns c ON d.campaign_id = c.id
		WHERE d.id = ?`

	var d Donation
	var campaignTitle sql.NullString
	var donorID sql.NullInt64
	var verifiedAt sql.NullString
	var createdAt string
	var verifiedBy sql.NullInt64
	err := r.db.QueryRow(query, id).Scan(&d.ID, &d.CampaignID, &campaignTitle, &donorID, &d.DonorName, &d.DonorPhone, &d.Amount, &d.Type, &d.PaymentMethod, &d.ProofURL, &d.Notes, &d.Status, &verifiedAt, &verifiedBy, &createdAt)
	if err != nil {
		return nil, err
	}
	if campaignTitle.Valid {
		d.CampaignTitle = campaignTitle.String
	}
	if donorID.Valid {
		v := int(donorID.Int64)
		d.DonorID = &v
	}
	if verifiedBy.Valid {
		v := int(verifiedBy.Int64)
		d.VerifiedBy = &v
	}
	d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	if verifiedAt.Valid && verifiedAt.String != "" {
		t, _ := time.Parse("2006-01-02 15:04:05", verifiedAt.String)
		d.VerifiedAt = &t
	}
	return &d, nil
}

func (r *Repository) VerifyDonation(id int, verifiedBy int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Get donation details
	var amount float64
	var campaignID int
	var currentStatus string
	err = tx.QueryRow("SELECT amount, campaign_id, status FROM donations WHERE id = ?", id).Scan(&amount, &campaignID, &currentStatus)
	if err != nil {
		return err
	}

	if currentStatus == "verified" {
		return nil // Already verified
	}

	// 2. Update donation status
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = tx.Exec("UPDATE donations SET status = 'verified', verified_at = ?, verified_by = ? WHERE id = ?", now, verifiedBy, id)
	if err != nil {
		return err
	}

	// 3. Update campaign collected amount
	_, err = tx.Exec("UPDATE donation_campaigns SET collected_amount = collected_amount + ? WHERE id = ?", amount, campaignID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *Repository) FindCampaignByID(id int) (*Campaign, error) {
	var c Campaign
	var endDate sql.NullString
	var createdAt, updatedAt string
	query := "SELECT id, title, description, target_amount, collected_amount, image_url, is_active, end_date, created_at, updated_at," +
		"(SELECT COUNT(*) FROM donations d WHERE d.campaign_id = donation_campaigns.id AND d.status = 'verified') AS donor_count " +
		"FROM donation_campaigns WHERE id = ?"
	err := r.db.QueryRow(query, id).Scan(&c.ID, &c.Title, &c.Description, &c.TargetAmount, &c.CollectedAmount, &c.ImageURL, &c.IsActive, &endDate, &createdAt, &updatedAt, &c.DonorCount)
	if err != nil {
		return nil, err
	}
	c.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	c.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	if endDate.Valid && endDate.String != "" {
		t, _ := time.Parse("2006-01-02 15:04:05", endDate.String)
		c.EndDate = &t
	}
	return &c, nil
}

func (r *Repository) CreateCampaign(c *Campaign) error {
	_, err := r.db.Exec(`
		INSERT INTO donation_campaigns (title, description, target_amount, image_url, is_active, end_date)
		VALUES (?, ?, ?, ?, ?, ?)`,
		c.Title, c.Description, c.TargetAmount, c.ImageURL, c.IsActive, c.EndDate)
	return err
}

func (r *Repository) UpdateCampaign(c *Campaign) error {
	_, err := r.db.Exec(`
		UPDATE donation_campaigns SET title = ?, description = ?, target_amount = ?, image_url = ?, is_active = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		c.Title, c.Description, c.TargetAmount, c.ImageURL, c.IsActive, c.EndDate, c.ID)
	return err
}

var ErrCampaignHasTransactions = errors.New("program donasi memiliki transaksi, gunakan arsip/nonaktif")

func (r *Repository) DeleteCampaign(id int) error {
	var n int
	if err := r.db.QueryRow("SELECT COUNT(*) FROM donations WHERE campaign_id = ?", id).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return ErrCampaignHasTransactions
	}
	_, err := r.db.Exec("DELETE FROM donation_campaigns WHERE id = ?", id)
	return err
}

func (r *Repository) UpdateCampaignAmount(id int, amount float64) error {
	_, err := r.db.Exec("UPDATE donation_campaigns SET collected_amount = collected_amount + ? WHERE id = ?", amount, id)
	return err
}

type DonationStats struct {
	TotalDonors         int     `json:"total_donors"`
	TotalVerifiedAmount float64 `json:"total_verified_amount"`
	TotalCampaigns      int     `json:"total_campaigns"`
}

func (r *Repository) GetDonationStats() (*DonationStats, error) {
	var s DonationStats
	q := `SELECT
		(SELECT COUNT(DISTINCT CASE WHEN TRIM(COALESCE(donor_phone, '')) <> '' THEN donor_phone ELSE NULL END) FROM donations WHERE status = 'verified'),
		(SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'verified'),
		(SELECT COUNT(*) FROM donation_campaigns WHERE is_active = 1)`
	err := r.db.QueryRow(q).Scan(&s.TotalDonors, &s.TotalVerifiedAmount, &s.TotalCampaigns)
	if err != nil {
		return nil, err
	}
	return &s, nil
}
