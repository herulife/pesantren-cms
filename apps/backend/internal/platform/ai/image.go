package ai

import (
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

	out, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, res.Body); err != nil {
		return "", err
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:8080"
	}
	imageUrl := fmt.Sprintf("%s/uploads/ai/%s", appURL, newFileName)

	return imageUrl, nil
}
