package disciplines

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"fmt"
	"net/http"
	"time"
)

type RequestLogger struct {
	method string
	path   string
	start  time.Time
	ctx    context.Context
}

func NewRequestLogger(r *http.Request) *RequestLogger {
	return &RequestLogger{
		method: r.Method,
		path:   r.URL.Path,
		start:  time.Now(),
		ctx:    r.Context(),
	}
}

func (l *RequestLogger) LogInfo(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	logger.Info(l.ctx, msg, logger.Field{"method": l.method, "path": l.path})
}

func (l *RequestLogger) LogWarning(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	logger.Warn(l.ctx, msg, logger.Field{"method": l.method, "path": l.path})
}

func (l *RequestLogger) LogError(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	logger.Error(l.ctx, msg, logger.Field{"method": l.method, "path": l.path})
}

func (l *RequestLogger) LogDuration(message string) {
	duration := time.Since(l.start)
	logger.Info(l.ctx, message, logger.Field{"method": l.method, "path": l.path, "duration": duration.String()})
}
