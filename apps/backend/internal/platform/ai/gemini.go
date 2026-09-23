package ai

import (
	"bytes"
	"context"
	"almaparung-api/internal/platform/logger"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

// isOpenAICompatibleKey mengenali kunci API untuk endpoint OpenAI-compatible
// (Token Harbor thk_..., OpenAI sk-..., Dahl API dahl_...).
func isOpenAICompatibleKey(value string) bool {
	v := strings.TrimSpace(value)
	return strings.HasPrefix(v, "sk-") || strings.HasPrefix(v, "thk_") || strings.HasPrefix(v, "dahl_")
}

// openAIKeyEnvPrefixes: urutan env yang dicek untuk kunci OpenAI-compatible.
func openAIKey() string {
	for _, key := range []string{"DAHL_API_KEY", "XKIRO_API_KEY", "OPENAI_API_KEY", "AI_OPENAI_KEY", "AI_API_KEY"} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" && isConfiguredGeminiKey(v) {
			return v
		}
	}
	return ""
}

// openAIBaseURL: urutan env untuk base URL OpenAI-compatible; fallback Dahl API.
func openAIBaseURL() string {
	for _, key := range []string{"DAHL_API_URL", "XKIRO_API_URL", "OPENAI_API_URL", "AI_API_URL"} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	return "https://inference.dahl.global/v1"
}

// openAIModel: model default Dahl (DeepSeek V4 Flash) atau AI_MODEL.
func openAIModel() string {
	if m := strings.TrimSpace(os.Getenv("AI_MODEL")); m != "" {
		return m
	}
	return "deepseek-ai/DeepSeek-V4-Flash-0731"
}

func openAIChatURL() string {
	baseURL := openAIBaseURL()
	if !strings.HasSuffix(baseURL, "/v1") && !strings.Contains(baseURL, "/chat") {
		baseURL = strings.TrimSuffix(baseURL, "/") + "/v1"
	}
	return baseURL + "/chat/completions"
}

func generateWithOpenAI(ctx context.Context, apiKey, topic string) (string, error) {
	url := openAIChatURL()
	prompt := "Tulis artikel HTML murni untuk Yayasan Pondok Pesantren Tahfidz Al-Maa tentang topik: " + topic + ". Hanya gunakan tag <h2> untuk subjudul (2-3 buah) dan <p> untuk paragraf (4-6 paragraf). Jangan pakai <!DOCTYPE>, <html>, <head>, <body>, markdown, atau ```. Langsung mulai dengan <h2>."
	body := map[string]interface{}{
		"model":       openAIModel(),
		"messages":    []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}
	b, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(apiKey))
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	bb, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("openai-compatible api %d: %s", resp.StatusCode, string(bb))
	}
	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(bb, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("empty choices")
	}
	txt := strings.TrimSpace(out.Choices[0].Message.Content)
	txt = strings.TrimPrefix(txt, "```html")
	txt = strings.TrimPrefix(txt, "```")
	txt = strings.TrimSuffix(txt, "```")
	return strings.TrimSpace(txt), nil
}

func GenerateArticle(topic string) (string, error) {
	openAICompatibleKey := openAIKey()
	if openAICompatibleKey != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()
		if txt, err := generateWithOpenAI(ctx, openAICompatibleKey, topic); err == nil && txt != "" {
			// bersihkan jika model mengembalikan full HTML document
			if strings.Contains(strings.ToLower(txt), "<!doctype") {
				// extract only <h2> and <p> blocks
				var parts []string
				for _, tag := range []string{"<h2", "<p"} {
					idx := 0
					for {
						s := strings.Index(strings.ToLower(txt[idx:]), tag)
						if s == -1 {
							break
						}
						start := idx + s
						endTag := "</" + strings.TrimPrefix(tag, "<")
						e := strings.Index(strings.ToLower(txt[start:]), endTag)
						if e == -1 {
							break
						}
						end := start + e + len(endTag)
						parts = append(parts, txt[start:end])
						idx = end
					}
				}
				if len(parts) > 0 {
					txt = strings.Join(parts, "\n")
				}
			}
			return strings.TrimSpace(txt), nil
		} else if err != nil {
			logger.Error(ctx, "openai-compatible generate failed, fallback to gemini", logger.Field{"error": err.Error()})
		}
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	if !isConfiguredGeminiKey(apiKey) {
		mockArticle := "<h2>Pentingnya " + topic + "</h2><p>Artikel otomatis ini muncul karena API Key belum dikonfigurasi di server Anda.</p>"
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
	prompt := "Tulis sebuah artikel profesional dan rapi dalam format HTML murni tanpa awalan markdown bersarang untuk website Yayasan Pondok Pesantren Tahfidz Al-Maa tentang topik: " + topic + ". Artikel harus lengkap memiliki tag <h2> untuk subjudul dan <p> untuk paragraf. Hindari penggunaan \\n yang tidak wajib dan jangan berikan format markdown HTML."
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil || len(resp.Candidates) == 0 {
		if err != nil {
			logger.Error(ctx, "failed generating ai article", logger.Field{"detail": fmt.Sprintf("topic=%s error=%v", topic, err)})
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
	return strings.TrimSpace(articleText), nil
}

// GenerateWAMessage menghasilkan draft pesan WhatsApp (plain text) via
// endpoint OpenAI-compatible (Xkiro) bila key tersedia; fallback Gemini;
// terakhir template aman tanpa error agar UI tetap terisi.
func GenerateWAMessage(prompt string) (string, error) {
	openAICompatibleKey := openAIKey()
	if openAICompatibleKey != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()
		if txt, err := generateChatText(ctx, openAICompatibleKey, prompt); err == nil && txt != "" {
			return txt, nil
		}
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if !isConfiguredGeminiKey(apiKey) {
		return strings.TrimSpace(prompt + "\n\n_Jazakumullahu khairan._\n_Admin Al-Maa_"), nil
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
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil || len(resp.Candidates) == 0 {
		if err != nil {
			logger.Error(ctx, "failed generating wa message", logger.Field{"error": err.Error()})
		}
		return "", fmt.Errorf("gagal membuat draft pesan AI")
	}
	if resp.Candidates[0].Content != nil && len(resp.Candidates[0].Content.Parts) > 0 {
		if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
			return strings.TrimSpace(string(textPart)), nil
		}
	}
	return "", fmt.Errorf("gagal membuat draft pesan AI")
}

func generateChatText(ctx context.Context, apiKey, prompt string) (string, error) {
	url := openAIChatURL()
	body := map[string]interface{}{
		"model":       openAIModel(),
		"messages":    []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}
	b, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(apiKey))
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	bb, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("ai api %d: %s", resp.StatusCode, string(bb))
	}
	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(bb, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("empty choices")
	}
	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}
