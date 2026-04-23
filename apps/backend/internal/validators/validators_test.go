package validators

import "testing"

func TestNormalizeText(t *testing.T) {
	got := NormalizeText("  halo   dunia  ")
	if got != "halo dunia" {
		t.Fatalf("expected normalized text, got %q", got)
	}
}

func TestValidateEmail(t *testing.T) {
	if !ValidateEmail("test@example.com") {
		t.Fatal("expected valid email to pass")
	}
	if ValidateEmail("invalid-email") {
		t.Fatal("expected invalid email to fail")
	}
}

func TestDecodeStrictJSON(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
	}

	var p payload
	if err := DecodeStrictJSON([]byte(`{"name":"oke"}`), &p); err != nil {
		t.Fatalf("expected valid json, got error: %v", err)
	}

	if err := DecodeStrictJSON([]byte(`{"name":"oke","extra":"x"}`), &p); err == nil {
		t.Fatal("expected unknown field to fail")
	}
}

func TestValidateLoginRequest(t *testing.T) {
	req := &LoginRequest{
		Email:    "  ADMIN@Example.COM ",
		Password: "12345678",
	}
	errs := ValidateLoginRequest(req)
	if len(errs) != 0 {
		t.Fatalf("expected no validation errors, got: %+v", errs)
	}
	if req.Email != "admin@example.com" {
		t.Fatalf("expected normalized email, got %q", req.Email)
	}
}

func TestValidateRegisterRequest_Invalid(t *testing.T) {
	req := &RegisterRequest{
		Name:     "ab",
		Email:    "bad-email",
		Password: "123",
	}
	errs := ValidateRegisterRequest(req)
	if len(errs) < 3 {
		t.Fatalf("expected multiple errors, got: %+v", errs)
	}
}

func TestValidateNewsRequest_AutoSlug(t *testing.T) {
	req := &NewsRequest{
		Title:   "Berita Pondok Baru",
		Content: "Ini adalah konten berita yang cukup panjang.",
		Status:  "draft",
	}
	errs := ValidateNewsRequest(req)
	if len(errs) != 0 {
		t.Fatalf("expected no errors, got: %+v", errs)
	}
	if req.Slug == "" {
		t.Fatal("expected slug to be generated")
	}
}

func TestValidateMessageRequest(t *testing.T) {
	req := &MessageRequest{
		Name:     "Ahmad",
		Email:    "ahmad@example.com",
		Whatsapp: "08123456789",
		Message:  "Assalamu'alaikum, saya ingin bertanya.",
	}
	errs := ValidateMessageRequest(req)
	if len(errs) != 0 {
		t.Fatalf("expected no errors, got: %+v", errs)
	}
}

func TestValidateVideoRequest_InvalidURL(t *testing.T) {
	req := &VideoRequest{
		Title:     "Kajian",
		URL:       "not-url",
		Thumbnail: "https://example.com/thumb.jpg",
	}
	errs := ValidateVideoRequest(req)
	if _, ok := errs["url"]; !ok {
		t.Fatalf("expected url validation error, got: %+v", errs)
	}
}

func TestValidateAgendaRequest_InvalidDate(t *testing.T) {
	req := &AgendaRequest{
		Title:     "Agenda",
		StartDate: "09-04-2026",
	}
	errs := ValidateAgendaRequest(req)
	if _, ok := errs["start_date"]; !ok {
		t.Fatalf("expected start_date validation error, got: %+v", errs)
	}
}
