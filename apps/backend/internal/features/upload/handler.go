package upload

import (
	"bytes"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const maxUploadSize = 5 << 20

func sendJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

func HandleUpload(w http.ResponseWriter, r *http.Request) {
	correlationID := logger.CorrelationID(r)
	userID, _ := auth.CurrentUserID(r.Context())
	startedAt := time.Now()

	logger.Info(r.Context(), "upload started", logger.Field{
		"operation":      "upload_image",
		"correlation_id": correlationID,
		"user_id":        userID,
		"path":           r.URL.Path,
	})

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		logger.Warn(r.Context(), "upload rejected invalid multipart payload", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "Ukuran file terlalu besar. Maksimal 5MB.", nil)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		logger.Warn(r.Context(), "upload rejected missing file", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada file yang diunggah", nil)
		return
	}
	defer file.Close()

	source, format, err := sanitizeImage(file)
	if err != nil {
		logger.Warn(r.Context(), "upload rejected unsupported image", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"filename":       header.Filename,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "File harus berupa gambar JPG, PNG, atau GIF yang valid", nil)
		return
	}

	uploadDir := "./public/uploads"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		logger.Error(r.Context(), "upload failed creating directory", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Tidak dapat menyiapkan penyimpanan file", nil)
		return
	}

	ext := "." + format
	if format == "jpeg" {
		ext = ".jpg"
	}
	newFileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, newFileName)

	out, err := os.Create(filePath)
	if err != nil {
		logger.Error(r.Context(), "upload failed creating file", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"filename":       header.Filename,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Tidak dapat menyimpan file", nil)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, bytes.NewReader(source))
	if err != nil {
		logger.Error(r.Context(), "upload failed writing file", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"filename":       header.Filename,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menulis file", nil)
		return
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:8080"
	}

	publicURL := fmt.Sprintf("%s/uploads/%s", appURL, newFileName)

	logger.Info(r.Context(), "upload completed", logger.Field{
		"operation":      "upload_image",
		"correlation_id": correlationID,
		"user_id":        userID,
		"filename":       newFileName,
		"duration_ms":    time.Since(startedAt).Milliseconds(),
	})

	sendJSONResponse(w, http.StatusCreated, true, "Upload berhasil", map[string]interface{}{
		"url": publicURL,
	})
}

func sanitizeImage(file io.Reader) ([]byte, string, error) {
	limited := io.LimitReader(file, maxUploadSize)
	raw, err := io.ReadAll(limited)
	if err != nil {
		return nil, "", err
	}
	if len(raw) == 0 {
		return nil, "", errors.New("empty file")
	}

	contentType := http.DetectContentType(raw)
	if !strings.HasPrefix(contentType, "image/") {
		return nil, "", fmt.Errorf("unsupported content type: %s", contentType)
	}

	img, format, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, "", err
	}

	var buf bytes.Buffer
	switch format {
	case "jpeg":
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
	case "png":
		err = png.Encode(&buf, img)
	case "gif":
		err = gif.Encode(&buf, img, nil)
	default:
		return nil, "", fmt.Errorf("unsupported image format: %s", format)
	}
	if err != nil {
		return nil, "", err
	}

	return buf.Bytes(), format, nil
}
