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

// NormalizeSemester memetakan penulisan semester ke bentuk kanonik "1"/"2".
// Sistem lain (grades, raports, kesantrian_aspek) memakai "1"/"2", sedangkan
// input UI bisa "ganjil"/"genap". Tanpa normalisasi, nilai CBT/grades tersimpan
// sebagai string berbeda sehingga tidak saling ditemukan saat hitung rapor.
func NormalizeSemester(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "ganjil", "semester 1", "satu":
		return "1"
	case "2", "genap", "semester 2", "dua":
		return "2"
	default:
		return strings.TrimSpace(value)
	}
}

// Kategori scheme bantuan (kategori pendaftar & kategori Santri).
// Satu-satunya daftar nilai yang sah untuk KEDUA tabel, supaya
// registrations.category dan santri.category tidak pernah berbeda ejaan:
// "yatim" (anak yatim) dan "dhuafa" (domba miskin). Nilai kosong dianggap
// "reguler". Ejaan "duafa" diterima sebagai alias lalu dinormalkan menjadi
// "dhuafa" supaya data dari sheet/API lama tidak ditolak.
const (
	CategoryReguler = "reguler"
	CategoryYatim   = "yatim"
	CategoryDhuafa  = "dhuafa"
)

// CategoryOptions adalah daftar nilai sah dalam urutan tampil untuk UI.
var CategoryOptions = []string{CategoryReguler, CategoryYatim, CategoryDhuafa}

// NormalizeCategory menormalkan input kategori (lowercase + trim), memetakan
// alias "duafa" -> "dhuafa", dan mengembalikan "" kalau nilainya di luar
// daftar sah. Pemanggil yang butuh default memakai CategoryOrDefault.
func NormalizeCategory(value string) string {
	switch v := strings.ToLower(strings.TrimSpace(value)); v {
	case "":
		return ""
	case CategoryReguler, CategoryYatim, CategoryDhuafa:
		return v
	case "duafa", "dhufa", "poor":
		return CategoryDhuafa
	default:
		return ""
	}
}

// CategoryOrDefault seperti NormalizeCategory, tapi nilai kosong (atau tidak
// dikenal) menjadi "reguler".
func CategoryOrDefault(value string) string {
	if v := NormalizeCategory(value); v != "" {
		return v
	}
	return CategoryReguler
}

// IsValidCategory melapor apakah nilai sudah berupa kategori kanonik.
func IsValidCategory(value string) bool {
	return NormalizeCategory(value) != ""
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

func ValidateNIK(raw string) bool {
	nik := strings.TrimSpace(raw)
	if len(nik) != 16 {
		return false
	}
	for _, c := range nik {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func ValidatePhone(raw string) bool {
	phone := strings.TrimSpace(raw)
	if phone == "" {
		return false
	}
	// allow digits, +, -, space, 8-15 chars
	clean := strings.ReplaceAll(phone, " ", "")
	clean = strings.ReplaceAll(clean, "-", "")
	clean = strings.TrimPrefix(clean, "+")
	if len(clean) < 8 || len(clean) > 15 {
		return false
	}
	for _, c := range clean {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
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
