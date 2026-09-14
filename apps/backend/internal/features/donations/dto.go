package donations

// PHASE 4: DTO publik — PII donatur (telepon, bukti) TIDAK PERNAH keluar API publik.

type DonationPublicDTO struct {
	ID            int    `json:"id"`
	CampaignID    int    `json:"campaign_id"`
	CampaignTitle string `json:"campaign_title"`
	DonorName     string `json:"donor_name"`
	Amount        float64 `json:"amount"`
	Type          string `json:"type"`
	Status        string `json:"status"`
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

func toPublicList(list []Donation) []DonationPublicDTO {
	out := make([]DonationPublicDTO, 0, len(list))
	for _, d := range list {
		// Hanya donasi terverifikasi yang tampil publik (pending = privasi + anti-gaduh).
		if d.Status != "verified" {
			continue
		}
		out = append(out, toPublic(d))
	}
	return out
}
