package logger

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

type Field map[string]interface{}

type entry struct {
	Timestamp string      `json:"ts"`
	Level     string      `json:"level"`
	Message   string      `json:"msg"`
	Fields    interface{} `json:"fields,omitempty"`
}

var currentLevel = "info"

var levelWeight = map[string]int{
	"debug": 10,
	"info":  20,
	"warn":  30,
	"error": 40,
}

func Init(level string) {
	level = strings.ToLower(strings.TrimSpace(level))
	if _, ok := levelWeight[level]; !ok {
		level = "info"
	}
	currentLevel = level
}

func Info(ctx context.Context, message string, fields Field) {
	write(ctx, "info", message, fields)
}

func Warn(ctx context.Context, message string, fields Field) {
	write(ctx, "warn", message, fields)
}

func Error(ctx context.Context, message string, fields Field) {
	write(ctx, "error", message, fields)
}

func write(ctx context.Context, level, message string, fields Field) {
	if levelWeight[level] < levelWeight[currentLevel] {
		return
	}
	if fields == nil {
		fields = make(Field)
	}

	if ctx != nil {
		if rid := strings.TrimSpace(middleware.GetReqID(ctx)); rid != "" {
			fields["correlation_id"] = rid
		}
	}

	payload := entry{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Fields:    fields,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		log.Printf(`{"ts":"%s","level":"error","msg":"logger marshal failed","fields":{"error":"%s"}}`, time.Now().Format(time.RFC3339), err.Error())
		return
	}
	log.Println(string(b))
}

func CorrelationID(r *http.Request) string {
	if rid := strings.TrimSpace(r.Header.Get("X-Correlation-ID")); rid != "" {
		return rid
	}
	if rid := strings.TrimSpace(middleware.GetReqID(r.Context())); rid != "" {
		return rid
	}
	return ""
}

func LevelFromEnv() string {
	return strings.TrimSpace(os.Getenv("LOG_LEVEL"))
}
