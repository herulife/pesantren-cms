package validators

import "strings"

type RegistrationStatusRequest struct {
	Status string `json:"status"`
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
