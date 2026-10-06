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
		wa_sent INTEGER NOT NULL DEFAULT 0,
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

	sendWA, err := repo.VerifyDonation(int(id), 1)
	if err != nil {
		t.Fatalf("VerifyDonation returned error: %v", err)
	}
	if !sendWA {
		t.Fatalf("first verification must be eligible for WA notification")
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

// Verifikasi donasi harus menaikkan collected_amount kampanye — itulah angka
// "% terkumpul" yang selama ini diam-diam 0 karena tak ada pending yang bisa
// pernah sampai ke UI (Jilid 79).
func TestVerifyDonationIncreasesCollectedAmount(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	campaigns, err := repo.FindAllCampaigns(true, "")
	if err != nil || len(campaigns) == 0 {
		t.Fatalf("FindAllCampaigns = %d, err=%v", len(campaigns), err)
	}
	campaignID := campaigns[0].ID
	if campaigns[0].CollectedAmount != 0 {
		t.Fatalf("precondition: collected_amount = %v, want 0", campaigns[0].CollectedAmount)
	}

	id, err := repo.CreateDonation(&Donation{CampaignID: campaignID, DonorName: "Bpk Feri", Amount: 564545, Type: "Infak"})
	if err != nil {
		t.Fatalf("CreateDonation returned error: %v", err)
	}
	sendWA, err := repo.VerifyDonation(int(id), 1)
	if err != nil {
		t.Fatalf("VerifyDonation returned error: %v", err)
	}
	if !sendWA {
		t.Fatalf("first verification must be eligible for WA notification")
	}

	after, _ := repo.FindAllCampaigns(true, "")
	if after[0].CollectedAmount != 564545 {
		t.Fatalf("collected_amount = %v, want 564545", after[0].CollectedAmount)
	}

	// Verifikasi ulang tidak boleh menambah dua kali.
	sendWA, err = repo.VerifyDonation(int(id), 1)
	if err != nil {
		t.Fatalf("second VerifyDonation returned error: %v", err)
	}
	if sendWA {
		t.Fatalf("re-verify of an already verified donation must not re-send WA")
	}
	after, _ = repo.FindAllCampaigns(true, "")
	if after[0].CollectedAmount != 564545 {
		t.Fatalf("collected_amount after re-verify = %v, want 564545 (idempotent)", after[0].CollectedAmount)
	}
}

// Form edit admin tidak mengirim balik proof_url. Kalau update menimpa kolom
// itu dengan string kosong, bukti transfer hilang permanen.
func TestUpdateDonationKeepsExistingProofURL(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	id, err := repo.CreateDonation(&Donation{
		CampaignID: 1, DonorName: "Bpk Feri", DonorPhone: "081281718972",
		Amount: 100000, Type: "Infak", PaymentMethod: "transfer",
		ProofURL: "bukti-transfer.jpg", Notes: "catatan asli",
	})
	if err != nil {
		t.Fatalf("CreateDonation returned error: %v", err)
	}

	// Payload form edit: tidak ada proof_url (ProofURL = "").
	if err := repo.UpdateDonation(&Donation{
		ID: int(id), CampaignID: 1, DonorName: "Bpk Feri (diedit)",
		DonorPhone: "081281718972", Amount: 150000, Type: "Infak", PaymentMethod: "transfer",
	}); err != nil {
		t.Fatalf("UpdateDonation returned error: %v", err)
	}

	list, _ := repo.FindAllDonations(0, "", "", "")
	if len(list) != 1 {
		t.Fatalf("expected 1 donation, got %d", len(list))
	}
	if list[0].ProofURL != "bukti-transfer.jpg" {
		t.Fatalf("proof_url wiped by edit: %q", list[0].ProofURL)
	}
	if list[0].Amount != 150000 || list[0].DonorName != "Bpk Feri (diedit)" {
		t.Fatalf("edit did not apply: %+v", list[0])
	}
}

// Jilid 81: "Batalkan Verifikasi" harus mengembalikan transaksi ke pending,
// mengembalikan collected_amount kampanye, DAN tidak mengirim WA lagi pada
// verifikasi ulang (donations.wa_sent tidak pernah di-reset).
func TestUnverifyDonationRestoresPendingState(t *testing.T) {
	repo := NewRepository(newDonationsTestDB(t))

	id, err := repo.CreateDonation(&Donation{CampaignID: 1, DonorName: "Bpk Feri", Amount: 250000, Type: "Infak"})
	if err != nil {
		t.Fatalf("CreateDonation returned error: %v", err)
	}

	if _, err := repo.VerifyDonation(int(id), 1); err != nil {
		t.Fatalf("VerifyDonation returned error: %v", err)
	}
	after, _ := repo.FindAllCampaigns(true, "")
	if after[0].CollectedAmount != 250000 {
		t.Fatalf("precondition collected_amount = %v, want 250000", after[0].CollectedAmount)
	}

	if err := repo.UnverifyDonation(int(id)); err != nil {
		t.Fatalf("UnverifyDonation returned error: %v", err)
	}

	list, err := repo.FindAllDonations(0, "", "", "")
	if err != nil || len(list) != 1 {
		t.Fatalf("FindAllDonations = %d, err=%v", len(list), err)
	}
	if list[0].Status != "pending" {
		t.Fatalf("status = %q, want pending", list[0].Status)
	}
	if list[0].VerifiedAt != nil || list[0].VerifiedBy != nil {
		t.Fatalf("verified_at/verified_by must be cleared, got %+v", list[0])
	}

	after, _ = repo.FindAllCampaigns(true, "")
	if after[0].CollectedAmount != 0 {
		t.Fatalf("collected_amount after unverify = %v, want 0", after[0].CollectedAmount)
	}

	// Kembali terbuka untuk edit & hapus.
	if err := repo.UpdateDonation(&Donation{ID: int(id), CampaignID: 1, DonorName: "Bpk Feri (koreksi)", Amount: 250000, Type: "Infak"}); err != nil {
		t.Fatalf("UpdateDonation after unverify returned error: %v", err)
	}

	// Unverify kedua kali harus ditolak.
	if err := repo.UnverifyDonation(int(id)); err != errDonationNotVerified {
		t.Fatalf("expected errDonationNotVerified, got %v", err)
	}

	// Verifikasi ulang: collected_amount naik lagi, tapi WA TIDAK dikirim.
	sendWA, err := repo.VerifyDonation(int(id), 1)
	if err != nil {
		t.Fatalf("re-verify returned error: %v", err)
	}
	if sendWA {
		t.Fatalf("re-verify after unverify must not send WA again")
	}
	after, _ = repo.FindAllCampaigns(true, "")
	if after[0].CollectedAmount != 250000 {
		t.Fatalf("collected_amount after re-verify = %v, want 250000", after[0].CollectedAmount)
	}
}
