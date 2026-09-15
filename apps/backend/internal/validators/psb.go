package validators

import "strings"

type RegistrationStatusRequest struct {
	Status                 string `json:"status"`
	Note                   string `json:"note"`
	TestDate               string `json:"test_date"`
	TestLocation           string `json:"test_location"`
	TestScore              *int   `json:"test_score"`
	TestNote               string `json:"test_note"`
	ReRegistrationDeadline string `json:"re_registration_deadline"`
}

type RegistrationPaymentStatusRequest struct {
	PaymentStatus string `json:"payment_status"`
	PaymentNote   string `json:"payment_note"`
}

func ValidateRegistrationStatusRequest(req *RegistrationStatusRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Status = strings.ToLower(NormalizeText(req.Status))
	req.Note = strings.TrimSpace(req.Note)
	req.TestDate = NormalizeText(req.TestDate)
	req.TestLocation = NormalizeText(req.TestLocation)
	req.TestNote = strings.TrimSpace(req.TestNote)
	req.ReRegistrationDeadline = NormalizeText(req.ReRegistrationDeadline)
	switch req.Status {
	case "pending", "review", "tes", "accepted", "re_registration", "rejected":
	default:
		errs.Add("status", "Status harus salah satu dari pending, review, tes, accepted, re_registration, rejected")
	}
	if req.TestDate != "" && !ValidateDate(req.TestDate) {
		errs.Add("test_date", "Tanggal tes harus format YYYY-MM-DD (boleh kosong)")
	}
	if req.TestScore != nil && (*req.TestScore < 0 || *req.TestScore > 100) {
		errs.Add("test_score", "Nilai tes harus 0-100")
	}
	if req.ReRegistrationDeadline != "" && !ValidateDate(req.ReRegistrationDeadline) {
		errs.Add("re_registration_deadline", "Batas daftar ulang harus format YYYY-MM-DD")
	}
	if len(req.Note) > 1000 {
		errs.Add("note", "Catatan maksimal 1000 karakter")
	}
	if len(req.TestNote) > 1000 {
		errs.Add("test_note", "Catatan tes maksimal 1000 karakter")
	}
	return errs
}

func ValidateRegistrationPaymentStatusRequest(req *RegistrationPaymentStatusRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.PaymentStatus = strings.ToLower(NormalizeText(req.PaymentStatus))
	req.PaymentNote = NormalizeText(req.PaymentNote)
	switch req.PaymentStatus {
	case "unpaid", "pending", "paid", "rejected":
	default:
		errs.Add("payment_status", "Status pembayaran harus salah satu dari unpaid, pending, paid, rejected")
	}
	return errs
}
