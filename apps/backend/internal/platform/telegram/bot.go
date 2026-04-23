package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type Update struct {
	UpdateID int     `json:"update_id"`
	Message  Message `json:"message"`
}

type Message struct {
	MessageID int    `json:"message_id"`
	Text      string `json:"text"`
	Chat      Chat   `json:"chat"`
	From      User   `json:"from"`
}

type Chat struct {
	ID int64 `json:"id"`
}

type User struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
}

type sendMessageRequest struct {
	ChatID int64  `json:"chat_id"`
	Text   string `json:"text"`
}

func IsConfigured(botToken string) bool {
	botToken = strings.TrimSpace(botToken)
	if botToken == "" {
		return false
	}

	placeholders := []string{
		"your_telegram_bot_token_here",
		"changeme",
		"your_bot_token_here",
	}

	lowerToken := strings.ToLower(botToken)
	for _, placeholder := range placeholders {
		if lowerToken == placeholder {
			return false
		}
	}

	return true
}

func SendMessage(chatID int64, text string) error {
	botToken := strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN"))
	if !IsConfigured(botToken) {
		return fmt.Errorf("telegram bot not configured")
	}

	payload, err := json.Marshal(sendMessageRequest{
		ChatID: chatID,
		Text:   text,
	})
	if err != nil {
		return err
	}

	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[TG] gagal kirim ke %d: %v", chatID, err)
		return err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	bodyText := strings.TrimSpace(string(bodyBytes))

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[TG] Telegram API menolak pesan ke %d (status: %d, body: %s)", chatID, resp.StatusCode, bodyText)
		return fmt.Errorf("telegram api error: HTTP %d", resp.StatusCode)
	}

	log.Printf("[TG] pesan berhasil dikirim ke %d", chatID)
	return nil
}

func IsAllowedChat(chatID int64) bool {
	raw := strings.TrimSpace(os.Getenv("TELEGRAM_ALLOWED_CHAT_IDS"))
	if raw == "" {
		return false
	}

	for _, part := range strings.Split(raw, ",") {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}

		parsed, err := strconv.ParseInt(trimmed, 10, 64)
		if err == nil && parsed == chatID {
			return true
		}
	}

	return false
}

func WebhookSecretMatches(headerValue string) bool {
	expected := strings.TrimSpace(os.Getenv("TELEGRAM_WEBHOOK_SECRET"))
	if expected == "" {
		return true
	}
	return strings.TrimSpace(headerValue) == expected
}
