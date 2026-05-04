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
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.RGBA{R: 255, A: 255})

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

func TestSanitizeImageAcceptsWEBP(t *testing.T) {
	webpPath := filepath.Join("..", "..", "..", "public", "uploads", "1776405414851972300.webp")
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
