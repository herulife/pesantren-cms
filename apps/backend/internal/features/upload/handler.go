package upload

import (
	"bytes"
	"crypto/rand"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/platform/logger"
	"encoding/hex"
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
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	_ "golang.org/x/image/webp"
)

const maxUploadSize = 5 << 20

// Decompression-bomb limits. A 5MB cap does not bound decoded size, so the
// decoded geometry is checked as well: 20000px per side and 40 megapixels total
// (roughly a 6000x6600 photo) is far above any legitimate campus photo.
const (
	maxImageDimension = 20000
	maxImagePixels    = 40_000_000
	// maxImageFrames bounds animated GIFs: the header only declares the first
	// frame's canvas, so a small-canvas multi-frame GIF is the remaining bomb.
	maxImageFrames = 50
)

const (
	// publicUploadDir is served by the static file server, so anything written
	// here is world-readable. Only staff content images belong in it.
	publicUploadDir = "./public/uploads"
	// privateUploadDir is never registered with the static file server. Student
	// documents (KK, birth certificates, ijazah) land here and are only reachable
	// through ServeDocument, which checks the caller owns the file.
	privateUploadDir = "./private/uploads"
)

func sendJSONResponse(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}

// HandleUpload stores a content image for staff-authored material (news,
// programs, facilities, gallery, banners). It is role-gated in cmd/api/main.go.
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

	newFileName, source, ok := receiveSanitizedImage(w, r, "upload_image", userID, correlationID)
	if !ok {
		return
	}

	stored, err := writeUploadFile(filepath.Join(publicUploadDir, newFileName), source, 0o644)
	if err != nil {
		logger.Error(r.Context(), "upload failed writing file", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan file", nil)
		return
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:8080"
	}

	logger.Info(r.Context(), "upload completed", logger.Field{
		"operation":      "upload_image",
		"correlation_id": correlationID,
		"user_id":        userID,
		"filename":       newFileName,
		"duration_ms":    time.Since(startedAt).Milliseconds(),
	})

	sendJSONResponse(w, http.StatusCreated, true, "Upload berhasil", map[string]interface{}{
		"url": fmt.Sprintf("%s/uploads/%s", appURL, stored),
	})
}

// HandleDocumentUpload stores a student document. Unlike HandleUpload the file
// never enters the publicly served directory: it is written under a directory
// named after the uploader, and the returned URL requires authentication.
//
// This is the PSB document path (KK, akta kelahiran, ijazah). Previously these
// went through the same public /upload endpoint as news images, so minors'
// identity documents were fetchable by anyone who guessed or crawled the URL.
func HandleDocumentUpload(w http.ResponseWriter, r *http.Request) {
	correlationID := logger.CorrelationID(r)
	userID, _ := auth.CurrentUserID(r.Context())

	if userID <= 0 {
		sendJSONResponse(w, http.StatusUnauthorized, false, "Silakan masuk terlebih dahulu", nil)
		return
	}

	newFileName, source, ok := receiveSanitizedImage(w, r, "upload_document", userID, correlationID)
	if !ok {
		return
	}

	ownerDir := filepath.Join(privateUploadDir, strconv.Itoa(userID))
	stored, err := writeUploadFile(filepath.Join(ownerDir, newFileName), source, 0o600)
	if err != nil {
		logger.Error(r.Context(), "document upload failed", logger.Field{
			"operation":      "upload_document",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal menyimpan dokumen", nil)
		return
	}

	logger.Info(r.Context(), "document upload completed", logger.Field{
		"operation":      "upload_document",
		"correlation_id": correlationID,
		"user_id":        userID,
		"filename":       stored,
	})

	// The path carries the /api prefix because the frontend resolves these URLs
	// against API_BASE_URL, which already ends in /api. Returning "/documents/..."
	// made the frontend look for /documents/... on the site origin, where nginx
	// serves the Next.js app and answers 404.
	sendJSONResponse(w, http.StatusCreated, true, "Upload berhasil", map[string]interface{}{
		// Relative URL: resolved against the API origin by the frontend. It is not
		// a public CDN path, it must be fetched with an Authorization header.
		"url": fmt.Sprintf("/api/documents/%d/%s", userID, stored),
	})
}

// ServeDocument streams a privately stored document to its owner, or to staff.
func ServeDocument(w http.ResponseWriter, r *http.Request) {
	correlationID := logger.CorrelationID(r)
	userID, _ := auth.CurrentUserID(r.Context())
	role, _ := auth.CurrentUserRole(r.Context())

	ownerID, err := strconv.Atoi(chi.URLParam(r, "userID"))
	if err != nil || ownerID <= 0 {
		sendJSONResponse(w, http.StatusBadRequest, false, "Permintaan tidak valid", nil)
		return
	}

	if ownerID != userID && !isStaff(role) {
		logger.Warn(r.Context(), "document access denied", logger.Field{
			"operation":      "serve_document",
			"correlation_id": correlationID,
			"user_id":        userID,
			"requested_owner": ownerID,
		})
		// 404 rather than 403 so a caller cannot probe which owner IDs exist.
		sendJSONResponse(w, http.StatusNotFound, false, "Dokumen tidak ditemukan", nil)
		return
	}

	name := path.Base(chi.URLParam(r, "filename"))
	if name == "." || name == "/" || name == "" {
		sendJSONResponse(w, http.StatusBadRequest, false, "Permintaan tidak valid", nil)
		return
	}

	full := filepath.Join(privateUploadDir, strconv.Itoa(ownerID), name)
	f, err := os.Open(full)
	if err != nil {
		sendJSONResponse(w, http.StatusNotFound, false, "Dokumen tidak ditemukan", nil)
		return
	}
	defer f.Close()

	w.Header().Set("Content-Type", detectContentTypeForName(name))
	w.Header().Set("Content-Disposition", "inline")
	// Private documents must never be cached by shared caches or CDNs.
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	io.Copy(w, f)
}

func isStaff(role string) bool {
	switch role {
	case "superadmin", "tim_media", "panitia_psb", "bendahara":
		return true
	}
	return false
}

func detectContentTypeForName(name string) string {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

// receiveSanitizedImage parses the multipart body, re-encodes the image and
// returns a cryptographically random filename plus the sanitised bytes.
//
// The previous filename scheme used time.Now().UnixNano(), a monotonically
// increasing counter: an attacker who learned one upload timestamp could walk
// neighbouring values and probe for other people's files.
func receiveSanitizedImage(w http.ResponseWriter, r *http.Request, operation string, userID int, correlationID string) (string, []byte, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		logger.Warn(r.Context(), "upload rejected invalid multipart payload", logger.Field{
			"operation":      operation,
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "Ukuran file terlalu besar. Maksimal 5MB.", nil)
		return "", nil, false
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		logger.Warn(r.Context(), "upload rejected missing file", logger.Field{
			"operation":      operation,
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "Tidak ada file yang diunggah", nil)
		return "", nil, false
	}
	defer file.Close()

	source, format, err := sanitizeImage(file)
	if err != nil {
		logger.Warn(r.Context(), "upload rejected unsupported image", logger.Field{
			"operation":      operation,
			"correlation_id": correlationID,
			"user_id":        userID,
			"filename":       header.Filename,
			"error":          err.Error(),
		})
		sendJSONResponse(w, http.StatusBadRequest, false, "File harus berupa gambar JPG, JPEG, PNG, GIF, atau WEBP yang valid", nil)
		return "", nil, false
	}

	ext := "." + format
	if format == "jpeg" {
		ext = ".jpg"
	}

	var nameBytes [16]byte
	if _, err := rand.Read(nameBytes[:]); err != nil {
		logger.Error(r.Context(), "upload failed generating filename", logger.Field{
			"operation":      operation,
			"correlation_id": correlationID,
			"user_id":        userID,
		})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Tidak dapat menyimpan file", nil)
		return "", nil, false
	}

	return hex.EncodeToString(nameBytes[:]) + ext, source, true
}

// writeUploadFile writes atomically: a temp file first, then rename, so a
// crashed or aborted upload never leaves a truncated file behind that another
// request could read.
func writeUploadFile(dest string, data []byte, perm os.FileMode) (string, error) {
	if err := os.MkdirAll(filepath.Dir(dest), 0o750); err != nil {
		return "", err
	}

	tmp, err := os.CreateTemp(filepath.Dir(dest), ".upload-*")
	if err != nil {
		return "", err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)

	if _, err := io.Copy(tmp, bytes.NewReader(data)); err != nil {
		tmp.Close()
		return "", err
	}
	if err := tmp.Close(); err != nil {
		return "", err
	}
	if err := os.Chmod(tmpName, perm); err != nil {
		return "", err
	}
	if err := os.Rename(tmpName, dest); err != nil {
		return "", err
	}
	return filepath.Base(dest), nil
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

	// DecodeConfig only reads the header, so it must run BEFORE image.Decode.
	// image.Decode allocates width*height*4 bytes up front, which means checking
	// the dimensions afterwards is useless: a few-KB PNG declaring 40000x40000
	// would already have tried to allocate ~6TB and OOM the container. The 5MB
	// upload cap does not help, PNG and GIF compress extremely well.
	cfg, format, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil {
		return nil, "", err
	}
	if cfg.Width <= 0 || cfg.Height <= 0 {
		return nil, "", fmt.Errorf("invalid image dimensions: %dx%d", cfg.Width, cfg.Height)
	}
	if cfg.Width > maxImageDimension || cfg.Height > maxImageDimension {
		return nil, "", fmt.Errorf("image dimensions too large: %dx%d (max %d)", cfg.Width, cfg.Height, maxImageDimension)
	}
	if int64(cfg.Width)*int64(cfg.Height) > maxImagePixels {
		return nil, "", fmt.Errorf("image pixel count too large: %dx%d (max %d pixels)", cfg.Width, cfg.Height, maxImagePixels)
	}

	// An animated GIF declares only its first frame's canvas in the header, so the
	// width*height check above cannot see the rest of the frames. A 200x200 GIF
	// with 10000 frames still allocates ~1.2GB once decoded, which is the same
	// denial-of-service the pixel guard is meant to prevent. Count the frames
	// before decoding and reject anything animated beyond a small ceiling.
	if format == "gif" {
		frameCount, err := countGIFFrames(raw)
		if err != nil {
			return nil, "", err
		}
		if frameCount > maxImageFrames {
			return nil, "", fmt.Errorf("animated image has too many frames: %d (max %d)", frameCount, maxImageFrames)
		}
	}

	// Dimensions are now known to be within bounds, so allocating and decoding
	// the pixels is safe.
	img, _, err := image.Decode(bytes.NewReader(raw))
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
	case "webp":
		err = png.Encode(&buf, img)
		format = "png"
	default:
		return nil, "", fmt.Errorf("unsupported image format: %s", format)
	}
	if err != nil {
		return nil, "", err
	}

	return buf.Bytes(), format, nil
}
// countGIFFrames counts image descriptors in a GIF without decoding pixels.
//
// It walks the byte stream over the GIF block structure (header, logical screen
// descriptor, then a chain of sub-blocks terminated by 0x3B). Only the frame count
// is needed, so nothing is allocated beyond the input slice we already hold.
func countGIFFrames(raw []byte) (int, error) {
	const (
		blockTerminator  = 0x00
		blockExtension   = 0x21
		imageSeparator   = 0x2C
		trailer          = 0x3B
		)

	if len(raw) < 13 {
		return 0, errors.New("truncated gif")
	}
	if !bytes.HasPrefix(raw, []byte("GIF8")) {
		return 0, errors.New("not a gif")
	}

	// Packed field: bit 7 is the global colour table flag.
	i := 13
	if raw[10]&0x80 != 0 {
		i += 3 * (1 << ((raw[10] & 0x07) + 1))
	}
	if i > len(raw) {
		return 0, errors.New("truncated gif global colour table")
	}

	frames := 0
	for i < len(raw) {
		switch raw[i] {
		case trailer:
			return frames, nil

		case blockExtension:
			// Extension block: 0x21, label, then sub-blocks.
			i += 2
			for i < len(raw) {
				size := int(raw[i])
				i++
				if size == blockTerminator {
					break
				}
				i += size
			}

		case imageSeparator:
			// Image descriptor: separator(1) + left(2) + top(2) + width(2) +
			// height(2) + packed(1) = 10 bytes. The packed byte's high bit
			// signals a Local Color Table that must be skipped before the LZW
			// minimum code size, otherwise the walk desynchronises and stops at
			// the first frame.
			if i+10 > len(raw) {
				return frames, errors.New("truncated gif image descriptor")
			}
			packed := raw[i+9]
			i += 10
			if packed&0x80 != 0 {
				i += 3 * (1 << ((packed & 0x07) + 1))
			}
			frames++
			if i >= len(raw) {
				return frames, errors.New("truncated gif before lzw code size")
			}
			i++ // LZW minimum code size
			for i < len(raw) {
				size := int(raw[i])
				i++
				if size == blockTerminator {
					break
				}
				if i > len(raw) {
					break
				}
				i += size
			}

		case blockTerminator:
			// Stray terminator outside a sub-block chain; stop rather than loop.
			return frames, nil

		default:
			return frames, errors.New("malformed gif block structure")
		}
	}

	return frames, nil
}
