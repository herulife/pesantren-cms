package ai

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func isConfiguredGeminiKey(value string) bool {
	key := strings.TrimSpace(value)
	if key == "" {
		return false
	}

	placeholders := []string{
		"your_gemini_api_key_here",
		"changeme",
		"change_me",
		"dummy",
		"mock",
	}

	lowerKey := strings.ToLower(key)
	for _, placeholder := range placeholders {
		if lowerKey == placeholder {
			return false
		}
	}

	return true
}

func GenerateArticle(topic string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if !isConfiguredGeminiKey(apiKey) {
		// Mock logic directly if no API key
		mockArticle := "<h2>Pentingnya " + topic + "</h2><p>Artikel otomatis ini muncul karena Google Gemini API Key belum dikonfigurasi di server Anda.</p>"
		return mockArticle, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		logger.Error(ctx, "failed creating gemini client", logger.Field{"error": err.Error()})
		return "", fmt.Errorf("layanan AI sedang bermasalah")
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.7)

	prompt := "Tulis sebuah artikel profesional dan rapi dalam format HTML murni tanpa awalan markdown bersarang untuk website Yayasan Pondok Pesantren Tahfidz Darussunnah tentang topik: " + topic + ". Artikel harus lengkap memiliki tag <h2> untuk subjudul dan <p> untuk paragraf. Hindari penggunaan \\n yang tidak wajib dan jangan berikan format markdown HTML."

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil || len(resp.Candidates) == 0 {
		if err != nil {
			logger.Error(ctx, "failed generating ai article", logger.Field{
				"detail": fmt.Sprintf("topic=%s error=%v", topic, err),
			})
		}
		return "", fmt.Errorf("gagal membuat draft berita AI")
	}

	articleText := ""
	if resp.Candidates[0].Content != nil && len(resp.Candidates[0].Content.Parts) > 0 {
		if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
			articleText = string(textPart)
		}
	}

	articleText = strings.TrimPrefix(articleText, "```html")
	articleText = strings.TrimPrefix(articleText, "```")
	articleText = strings.TrimSuffix(articleText, "```")
	articleText = strings.TrimSpace(articleText)

	return articleText, nil
}
