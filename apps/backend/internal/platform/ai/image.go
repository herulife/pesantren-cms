package ai

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func GenerateAndDownloadImage(topic string) (string, error) {
	engPrompt := "islamic boarding school realistic photography " + strings.ReplaceAll(topic, " ", "%20")
	polliURL := fmt.Sprintf("https://image.pollinations.ai/prompt/%s?width=800&height=450&nologo=true", engPrompt)

	uploadDir := "./public/uploads/ai"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	newFileName := fmt.Sprintf("ai_%d.jpg", time.Now().UnixNano())
	filePath := filepath.Join(uploadDir, newFileName)

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	res, err := client.Get(polliURL)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", fmt.Errorf("gagal mengunduh gambar AI, status: %d", res.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(res.Body, 10<<20))
	if err != nil {
		return "", err
	}

	// Validate the downloaded content is actually an image before persisting.
	if err := validateImageBytes(body); err != nil {
		return "", err
	}

	if err := os.WriteFile(filePath, body, 0o644); err != nil {
		return "", err
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:8080"
	}
	imageUrl := fmt.Sprintf("%s/uploads/ai/%s", appURL, newFileName)

	return imageUrl, nil
}

// validateImageBytes ensures the payload is a real image (JPEG/PNG/GIF/WEBP)
// by inspecting its magic bytes, preventing non-image content from being stored.
func validateImageBytes(b []byte) error {
	if len(b) < 12 {
		return fmt.Errorf("konten gambar tidak valid")
	}
	switch {
	case bytes.HasPrefix(b, []byte{0xFF, 0xD8, 0xFF}):
		return nil
	case bytes.HasPrefix(b, []byte{0x89, 0x50, 0x4E, 0x47}):
		return nil
	case bytes.HasPrefix(b, []byte("GIF87a")) || bytes.HasPrefix(b, []byte("GIF89a")):
		return nil
	case bytes.HasPrefix(b, []byte("RIFF")) && len(b) > 11 && string(b[8:12]) == "WEBP":
		return nil
	default:
		return fmt.Errorf("tipe gambar tidak didukung")
	}
}
