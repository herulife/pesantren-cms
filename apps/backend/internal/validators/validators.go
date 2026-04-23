package validators

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var (
	whitespacePattern = regexp.MustCompile(`\s+`)
	slugPattern       = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
)

type ValidationErrors map[string]string

func (v ValidationErrors) Add(field, message string) {
	if _, exists := v[field]; !exists {
		v[field] = message
	}
}

func (v ValidationErrors) Err() error {
	if len(v) == 0 {
		return nil
	}
	return errors.New("validation failed")
}

func NormalizeText(value string) string {
	return whitespacePattern.ReplaceAllString(strings.TrimSpace(value), " ")
}

func NormalizeEmail(value string) string {
	return strings.ToLower(NormalizeText(value))
}

func ValidateEmail(value string) bool {
	if value == "" {
		return false
	}
	_, err := mail.ParseAddress(value)
	return err == nil
}

func ValidateURL(raw string) bool {
	if raw == "" {
		return false
	}
	parsed, err := url.ParseRequestURI(raw)
	return err == nil && parsed.Scheme != "" && parsed.Host != ""
}

func ValidateMediaURL(raw string) bool {
	if raw == "" {
		return false
	}

	trimmed := strings.TrimSpace(raw)
	if strings.HasPrefix(trimmed, "/uploads/") || strings.HasPrefix(trimmed, "/assets/") || strings.HasPrefix(trimmed, "/api/uploads/") {
		return true
	}

	return ValidateURL(trimmed)
}

func ValidateDate(raw string) bool {
	if raw == "" {
		return false
	}
	_, err := time.Parse("2006-01-02", raw)
	return err == nil
}

func NormalizeSlug(raw string) string {
	normalized := strings.ToLower(NormalizeText(raw))
	normalized = strings.ReplaceAll(normalized, " ", "-")
	normalized = regexp.MustCompile(`-+`).ReplaceAllString(normalized, "-")
	return strings.Trim(normalized, "-")
}

func ValidateSlug(raw string) bool {
	return slugPattern.MatchString(raw)
}

func DecodeStrictJSON(data []byte, dst any) error {
	if len(strings.TrimSpace(string(data))) == 0 {
		return errors.New("request body is required")
	}

	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return err
	}

	if decoder.More() {
		return fmt.Errorf("request body must contain a single JSON object")
	}

	return nil
}

func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return err
	}
	return nil
}
