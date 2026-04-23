package donations

import (
	"database/sql"
	"time"
)

type Campaign struct {
	ID              int        `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	TargetAmount    float64    `json:"target_amount"`
	CollectedAmount float64    `json:"collected_amount"`
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
	DonorName     string     `json:"donor_name"`
	DonorPhone    string     `json:"donor_phone"`
	Amount        float64    `json:"amount"`
	PaymentMethod string     `json:"payment_method"`
	ProofURL      string     `json:"proof_url"`
	Status        string     `json:"status"`
	VerifiedAt    *time.Time `json:"verified_at"`
	VerifiedBy    *int       `json:"verified_by"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAllCampaigns(activeOnly bool, search string) ([]Campaign, error) {
	query := "SELECT id, title, description, target_amount, collected_amount, image_url, is_active, end_date, created_at, updated_at FROM donation_campaigns WHERE 1=1"
	var args []interface{}

	if activeOnly {
		query += " AND is_active = 1"
	}
	if search != "" {
		query += " AND (title LIKE ? OR description LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Campaign
	for rows.Next() {
		var c Campaign
		var endDate, createdAt, updatedAt string
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.TargetAmount, &c.CollectedAmount, &c.ImageURL, &c.IsActive, &endDate, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}
		c.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		c.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		if endDate != "" {
			t, _ := time.Parse("2006-01-02 15:04:05", endDate)
			c.EndDate = &t
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) FindAllDonations(campaignID int, status, search string) ([]Donation, error) {
	query := `
		SELECT d.id, d.campaign_id, c.title as campaign_title, d.donor_name, d.donor_phone, d.amount, d.payment_method, d.proof_url, d.status, d.verified_at, d.verified_by, d.created_at 
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
		var verifiedAt, createdAt string
		err := rows.Scan(&d.ID, &d.CampaignID, &d.CampaignTitle, &d.DonorName, &d.DonorPhone, &d.Amount, &d.PaymentMethod, &d.ProofURL, &d.Status, &verifiedAt, &d.VerifiedBy, &createdAt)
		if err != nil {
			return nil, err
		}
		d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		if verifiedAt != "" {
			t, _ := time.Parse("2006-01-02 15:04:05", verifiedAt)
			d.VerifiedAt = &t
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *Repository) FindDonationByID(id int) (*Donation, error) {
	query := `
		SELECT d.id, d.campaign_id, c.title as campaign_title, d.donor_name, d.donor_phone, d.amount, d.payment_method, d.proof_url, d.status, d.verified_at, d.verified_by, d.created_at 
		FROM donations d
		LEFT JOIN donation_campaigns c ON d.campaign_id = c.id
		WHERE d.id = ?`

	var d Donation
	var verifiedAt, createdAt string
	err := r.db.QueryRow(query, id).Scan(&d.ID, &d.CampaignID, &d.CampaignTitle, &d.DonorName, &d.DonorPhone, &d.Amount, &d.PaymentMethod, &d.ProofURL, &d.Status, &verifiedAt, &d.VerifiedBy, &createdAt)
	if err != nil {
		return nil, err
	}
	d.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	if verifiedAt != "" {
		t, _ := time.Parse("2006-01-02 15:04:05", verifiedAt)
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

func (r *Repository) CreateCampaign(c *Campaign) error {
	_, err := r.db.Exec(`
		INSERT INTO donation_campaigns (title, description, target_amount, image_url, is_active, end_date)
		VALUES (?, ?, ?, ?, ?, ?)`,
		c.Title, c.Description, c.TargetAmount, c.ImageURL, c.IsActive, c.EndDate)
	return err
}

func (r *Repository) DeleteCampaign(id int) error {
	_, err := r.db.Exec("DELETE FROM donation_campaigns WHERE id = ?", id)
	return err
}

func (r *Repository) UpdateCampaignAmount(id int, amount float64) error {
	_, err := r.db.Exec("UPDATE donation_campaigns SET collected_amount = collected_amount + ? WHERE id = ?", amount, id)
	return err
}
