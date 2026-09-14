package upload

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSanitizeImageAcceptsPNG(t *testing.T) {
	// Fixture 200x200: aturan intended minimal 100x100 (DESIGN.md).
	img := image.NewRGBA(image.Rect(0, 0, 200, 200))
	for y := 0; y < 200; y++ {
		for x := 0; x < 200; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x), G: uint8(y), B: 128, A: 255})
		}
	}

	var src bytes.Buffer
	if err := png.Encode(&src, img); err != nil {
		t.Fatalf("encode png: %v", err)
	}

	sanitized, format, err := sanitizeImage(bytes.NewReader(src.Bytes()))
	if err != nil {
		t.Fatalf("sanitizeImage returned error: %v", err)
	}
	if format != "png" {
		t.Fatalf("expected png format, got %q", format)
	}
	if len(sanitized) == 0 {
		t.Fatal("expected sanitized image bytes")
	}
}

func TestSanitizeImageRejectsNonImagePayload(t *testing.T) {
	_, _, err := sanitizeImage(strings.NewReader("<html>not an image</html>"))
	if err == nil {
		t.Fatal("expected sanitizeImage to reject non-image payload")
	}
}

func TestSanitizeImageRejectsTooSmall(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.RGBA{R: 255, A: 255})

	var src bytes.Buffer
	if err := png.Encode(&src, img); err != nil {
		t.Fatalf("encode png: %v", err)
	}
	if _, _, err := sanitizeImage(bytes.NewReader(src.Bytes())); err == nil {
		t.Fatal("expected sanitizeImage to reject 1x1 image")
	}
}

func TestSanitizeImageAcceptsWEBP(t *testing.T) {
	webpPath := filepath.Join("testdata", "sample.webp")
	webpPayload, err := os.ReadFile(webpPath)
	if err != nil {
		t.Fatalf("read webp fixture: %v", err)
	}

	sanitized, format, err := sanitizeImage(bytes.NewReader(webpPayload))
	if err != nil {
		t.Fatalf("sanitizeImage returned error for webp: %v", err)
	}
	if format != "png" {
		t.Fatalf("expected webp uploads to be normalized as png, got %q", format)
	}
	if len(sanitized) == 0 {
		t.Fatal("expected sanitized image bytes for webp")
	}
}

func TestValidateProofURL(t *testing.T) {
	valid := []string{
		"/uploads/proofs/abc123.png",
		"/uploads/xyz.jpg",
		"/uploads/a.JPEG",
	}
	for _, u := range valid {
		if err := ValidateProofURL(u); err != nil {
			t.Errorf("expected %q valid, got %v", u, err)
		}
	}
	invalid := []string{
		"",
		"https://evil.example/p.png",
		"/uploads/../../etc/passwd",
		`/uploads\evil.png`,
		"/uploads/evil.php",
		"/uploads/evil.svg",
		"/other/x.png",
		strings.Repeat("a", 300),
	}
	for _, u := range invalid {
		if err := ValidateProofURL(u); err == nil {
			t.Errorf("expected %q invalid", u)
		}
	}
}
