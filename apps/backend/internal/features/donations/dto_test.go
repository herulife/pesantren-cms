package donations

import (
	"encoding/json"
	"testing"
	"time"
)

func sampleDonation() Donation {
	donorID := 7
	verifiedAt := time.Date(2026, 10, 5, 10, 0, 0, 0, time.UTC)
	return Donation{
		ID: 42, CampaignID: 10, CampaignTitle: "Oven Donasi Beras",
		DonorID: &donorID, DonorName: "Bpk Feri", DonorPhone: "081281718972",
		Amount: 564545, Type: "Infak", PaymentMethod: "transfer",
		ProofURL: "proof-rahasia.jpg", Notes: "transfer bca",
		Status: "pending", CreatedAt: verifiedAt,
	}
}

// Admin WAJIB lihat pending — inilah regresi yang membuat tab "Log Transaksi"
// kosong (Jilid 79).
func TestAdminListIncludesPending(t *testing.T) {
	out := toAdminList([]Donation{sampleDonation()})
	if len(out) != 1 {
		t.Fatalf("admin list must not filter status, got %d rows", len(out))
	}
	if out[0].Status != "pending" {
		t.Fatalf("status mangled: %q", out[0].Status)
	}
}

// Field yang form edit admin bulatkan-balik harus ikut, kalau tidak mengedit
// transaksi akan menghapus nomor HP & catatan donatur.
func TestAdminDTOCarriesEditFields(t *testing.T) {
	d := toAdmin(sampleDonation())
	if d.DonorPhone != "081281718972" {
		t.Fatalf("donor_phone missing, admin edit would wipe it: %+v", d)
	}
	if d.PaymentMethod != "transfer" {
		t.Fatalf("payment_method missing: %+v", d)
	}
	if d.Notes != "transfer bca" {
		t.Fatalf("notes missing: %+v", d)
	}
	if d.DonorID == nil || *d.DonorID != 7 {
		t.Fatalf("donor_id missing: %+v", d)
	}
}

// proof_url tetap TIDAK keluar dari DTO — bukti transfer hanya lewat route
// berauth /uploads/proofs/{file} (commit 37ddd16). Dicek di level JSON karena
// field-nya memang sengaja tidak ada di struct.
func TestAdminDTOOmitsProofURL(t *testing.T) {
	raw, err := json.Marshal(toAdmin(sampleDonation()))
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var fields map[string]interface{}
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, banned := range []string{"proof_url", "verified_by"} {
		if _, ok := fields[banned]; ok {
			t.Fatalf("%s must not be in admin DTO, got %s", banned, raw)
		}
	}
	if fields["donor_name"] != "Bpk Feri" {
		t.Fatalf("unexpected JSON: %s", raw)
	}
}

// Publik: pending disembunyikan, PII tidak bocor.
func TestPublicListHidesPendingAndPII(t *testing.T) {
	pending := sampleDonation()
	verified := sampleDonation()
	verified.ID = 43
	verified.Status = "verified"

	out := toPublicList([]Donation{pending, verified})
	if len(out) != 1 {
		t.Fatalf("public list must expose only verified, got %d rows", len(out))
	}
	if out[0].ID != 43 {
		t.Fatalf("public list returned the pending row: %+v", out[0])
	}
}
