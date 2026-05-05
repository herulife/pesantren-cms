package validators

import "strings"

type RegistrationStatusRequest struct {
	Status string `json:"status"`
}

type RegistrationPaymentStatusRequest struct {
	PaymentStatus string `json:"payment_status"`
	PaymentNote   string `json:"payment_note"`
}

func ValidateRegistrationStatusRequest(req *RegistrationStatusRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Status = strings.ToLower(NormalizeText(req.Status))
	switch req.Status {
	case "pending", "review", "accepted", "rejected":
	default:
		errs.Add("status", "Status harus salah satu dari pending, review, accepted, rejected")
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
