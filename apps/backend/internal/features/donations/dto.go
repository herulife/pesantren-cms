package donations

import "time"

// PHASE 4: DTO publik — PII donatur (telepon, bukti) TIDAK PERNAH keluar API publik.

type DonationPublicDTO struct {
	ID            int         `json:"id"`
	CampaignID    int         `json:"campaign_id"`
	CampaignTitle string      `json:"campaign_title"`
	DonorName     string      `json:"donor_name"`
	Amount        float64     `json:"amount"`
	Type          string      `json:"type"`
	Status        string      `json:"status"`
	CreatedAt     interface{} `json:"created_at"`
}

// toPublic memproyeksikan donasi ke DTO publik (tanpa phone/proof/donor_id).
func toPublic(d Donation) DonationPublicDTO {
	return DonationPublicDTO{
		ID:            d.ID,
		CampaignID:    d.CampaignID,
		CampaignTitle: d.CampaignTitle,
		DonorName:     d.DonorName,
		Amount:        d.Amount,
		Type:          d.Type,
		Status:        d.Status,
		CreatedAt:     d.CreatedAt,
	}
}

// toPublicList HANYA untuk endpoint publik. Dua aturan yang tidak boleh bocor ke sini:
//
//  1. filter `status != verified` — donasi pending disembunyikan dari publik
//     (privasi + anti-gaduh: nama & nominal orang yang belum konfirmasi tidak
//     boleh tayang sebelum dana benar-benar dicek bendahara).
//  2. PII (donor_phone, proof_url, donor_id) tidak ikut.
//
// JANGAN pakai toPublicList untuk endpoint admin — itulah bug Jilid 79 yang
// membuat tab "Log Transaksi" kosong padahal ada 4 donasi pending.
func toPublicList(list []Donation) []DonationPublicDTO {
	out := make([]DonationPublicDTO, 0, len(list))
	for _, d := range list {
		if d.Status != "verified" {
			continue
		}
		out = append(out, toPublic(d))
	}
	return out
}

// DonationAdminDTO untuk endpoint admin/role-gated (superadmin + bendahara).
//
// Semua status ikut (pending + verified) karena admin justru butuh bekerja
// dengan antrean pending: verifikasi, ubah, hapus.
//
// Field PII TETAP-boleh di sini karena pemanggilnya wajib auth + role
// bendahara/superadmin (main.go:422, di balik auth.RequireRole). Yang tetap
// TIDAK ikut: proof_url — bukti transfer cukup lewat route berauth
// `/uploads/proofs/{file}` (upload.ServeProof) sesuai commit 37ddd16, dan
// form edit admin tidak pernah mengirim balik proof_url.
//
// DonorPhone/PaymentMethod/Notes wajib ada di sini: form edit admin
// membulatkan-balik field-field itu (page.tsx openTxModal) dan
// Repository.UpdateDonation menimpa seluruh kolom. Kalau DTO tidak
// mengirimkannya, mengedit satu transaksi akan MENGHAPUS nomor HP & catatan
// donatur tanpa sengaja.
type DonationAdminDTO struct {
	ID            int        `json:"id"`
	CampaignID    int        `json:"campaign_id"`
	CampaignTitle string     `json:"campaign_title"`
	DonorID       *int       `json:"donor_id"`
	DonorName     string     `json:"donor_name"`
	DonorPhone    string     `json:"donor_phone"`
	Amount        float64    `json:"amount"`
	Type          string     `json:"type"`
	PaymentMethod string     `json:"payment_method"`
	Notes         string     `json:"notes"`
	Status        string     `json:"status"`
	VerifiedAt    *time.Time `json:"verified_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

func toAdmin(d Donation) DonationAdminDTO {
	return DonationAdminDTO{
		ID:            d.ID,
		CampaignID:    d.CampaignID,
		CampaignTitle: d.CampaignTitle,
		DonorID:       d.DonorID,
		DonorName:     d.DonorName,
		DonorPhone:    d.DonorPhone,
		Amount:        d.Amount,
		Type:          d.Type,
		PaymentMethod: d.PaymentMethod,
		Notes:         d.Notes,
		Status:        d.Status,
		VerifiedAt:    d.VerifiedAt,
		CreatedAt:     d.CreatedAt,
	}
}

// toAdminList memproyeksikan daftar penuh TANPA filter status.
func toAdminList(list []Donation) []DonationAdminDTO {
	out := make([]DonationAdminDTO, 0, len(list))
	for _, d := range list {
		out = append(out, toAdmin(d))
	}
	return out
}
