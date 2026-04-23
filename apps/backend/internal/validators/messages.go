package validators

import "regexp"

var phonePattern = regexp.MustCompile(`^[0-9+\-\s]{8,20}$`)

type MessageRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Whatsapp string `json:"whatsapp"`
	Message  string `json:"message"`
}

func ValidateMessageRequest(req *MessageRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Name = NormalizeText(req.Name)
	req.Email = NormalizeEmail(req.Email)
	req.Whatsapp = NormalizeText(req.Whatsapp)
	req.Message = NormalizeText(req.Message)

	if len(req.Name) < 3 {
		errs.Add("name", "Nama minimal 3 karakter")
	}
	if req.Email != "" && !ValidateEmail(req.Email) {
		errs.Add("email", "Format email tidak valid")
	}
	if req.Whatsapp != "" && !phonePattern.MatchString(req.Whatsapp) {
		errs.Add("whatsapp", "Nomor WhatsApp tidak valid")
	}
	if len(req.Message) < 10 {
		errs.Add("message", "Pesan minimal 10 karakter")
	}
	return errs
}
