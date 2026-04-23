package psb

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// RequestLogger menyimpan informasi logging per request
type RequestLogger struct {
	RequestID string
	Method    string
	Path      string
	StartTime time.Time
	ctx       context.Context
}

// LogInfo mencatat informasi normal
func (rl *RequestLogger) LogInfo(message string, args ...interface{}) {
	msg := fmt.Sprintf(message, args...)
	logger.Info(rl.ctx, msg, logger.Field{"request_id": rl.RequestID, "method": rl.Method, "path": rl.Path})
}

// LogError mencatat error
func (rl *RequestLogger) LogError(message string, args ...interface{}) {
	msg := fmt.Sprintf(message, args...)
	logger.Error(rl.ctx, msg, logger.Field{"request_id": rl.RequestID, "method": rl.Method, "path": rl.Path})
}

// LogWarning mencatat warning
func (rl *RequestLogger) LogWarning(message string, args ...interface{}) {
	msg := fmt.Sprintf(message, args...)
	logger.Warn(rl.ctx, msg, logger.Field{"request_id": rl.RequestID, "method": rl.Method, "path": rl.Path})
}

// LogDuration mencatat durasi execution
func (rl *RequestLogger) LogDuration(message string) {
	duration := time.Since(rl.StartTime)
	logger.Info(rl.ctx, message, logger.Field{"request_id": rl.RequestID, "method": rl.Method, "path": rl.Path, "duration": duration.String()})
}

// NewRequestLogger membuat request logger baru dengan unique ID
func NewRequestLogger(r *http.Request) *RequestLogger {
	requestID := r.Header.Get("X-Request-ID")
	if requestID == "" {
		requestID = uuid.New().String()
	}

	return &RequestLogger{
		RequestID: requestID,
		Method:    r.Method,
		Path:      r.URL.Path,
		StartTime: time.Now(),
		ctx:       r.Context(),
	}
}
