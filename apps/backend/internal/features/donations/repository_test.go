package donations

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newDonationsTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE donation_campaigns (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		target_amount REAL DEFAULT 0,
		collected_amount REAL DEFAULT 0,
		image_url TEXT DEFAULT '',
		is_active INTEGER DEFAULT 1,
		end_date DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE donors (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		address TEXT DEFAULT '',
		phone TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE donations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		campaign_id INTEGER,
		donor_id INTEGER,
		donor_name TEXT NOT NULL,
		donor_phone TEXT DEFAULT '',
		amount REAL NOT NULL,
		type TEXT DEFAULT '',
		payment_method TEXT DEFAULT 'transfer',
		proof_url TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		status TEXT DEFAULT 'pending',
		verified_at DATETIME,
		verified_by INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO donation_campaigns (title, target_amount, is_active) VALUES ('Wakaf Cat', 15000000, 1)`); err != nil {
		t.Fatalf("seed campaign: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return db
}

func TestDonorCRUD(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	if err := repo.CreateDonor(&Donor{Name: "Hamba Allah", Address: "Parung", Phone: "0812"}); err != nil {
		t.Fatalf("CreateDonor returned error: %v", err)
	}
	list, err := repo.FindAllDonors("")
	if err != nil || len(list) != 1 {
		t.Fatalf("FindAllDonors = %d, err=%v", len(list), err)
	}
	if list[0].Name != "Hamba Allah" {
		t.Fatalf("unexpected donor: %+v", list[0])
	}

	found, err := repo.FindDonorByID(list[0].ID)
	if err != nil || found.Phone != "0812" {
		t.Fatalf("FindDonorByID = %+v, err=%v", found, err)
	}

	found.Address = "Bogor"
	if err := repo.UpdateDonor(found); err != nil {
		t.Fatalf("UpdateDonor returned error: %v", err)
	}

	if err := repo.DeleteDonor(found.ID); err != nil {
		t.Fatalf("DeleteDonor returned error: %v", err)
	}
	list, _ = repo.FindAllDonors("")
	if len(list) != 0 {
		t.Fatalf("expected 0 donors after delete, got %d", len(list))
	}
}

func TestDonationLockedAfterVerify(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	id, err := repo.CreateDonation(&Donation{
		CampaignID: 1, DonorName: "Hamba Allah", Amount: 500000, Type: "Wakaf",
		PaymentMethod: "transfer", Notes: "test",
	})
	if err != nil {
		t.Fatalf("CreateDonation returned error: %v", err)
	}

	list, err := repo.FindAllDonations(0, "", "", "Wakaf")
	if err != nil || len(list) != 1 {
		t.Fatalf("FindAllDonations type filter = %d, err=%v", len(list), err)
	}
	if list[0].Notes != "test" {
		t.Fatalf("notes not persisted: %+v", list[0])
	}

	if err := repo.VerifyDonation(int(id), 1); err != nil {
		t.Fatalf("VerifyDonation returned error: %v", err)
	}
	if err := repo.UpdateDonation(&Donation{ID: int(id), CampaignID: 1, DonorName: "X", Amount: 1}); err != errDonationLocked {
		t.Fatalf("expected locked error on update, got %v", err)
	}
	if err := repo.DeleteDonation(int(id)); err != errDonationLocked {
		t.Fatalf("expected locked error on delete, got %v", err)
	}
}

func TestDeleteDonorNullsDonations(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	if err := repo.CreateDonor(&Donor{Name: "Donatur A"}); err != nil {
		t.Fatalf("CreateDonor returned error: %v", err)
	}
	donors, _ := repo.FindAllDonors("")
	donorID := donors[0].ID

	if _, err := repo.CreateDonation(&Donation{CampaignID: 1, DonorID: &donorID, DonorName: "Donatur A", Amount: 100000}); err != nil {
		t.Fatalf("CreateDonation returned error: %v", err)
	}
	if err := repo.DeleteDonor(donorID); err != nil {
		t.Fatalf("DeleteDonor returned error: %v", err)
	}
	list, err := repo.FindAllDonations(0, "", "", "")
	if err != nil || len(list) != 1 {
		t.Fatalf("donation should survive donor delete, got %d, err=%v", len(list), err)
	}
	if list[0].DonorID != nil {
		t.Fatalf("expected donor_id NULL after delete, got %+v", list[0].DonorID)
	}
}
