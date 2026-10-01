package upload

import (
	"bytes"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"golang.org/x/image/draw"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "golang.org/x/image/webp"
)

const maxUploadSize = 5 << 20

// Sisi terpanjang gambar hasil upload (piksel). Foto lebih besar diperkecil proporsional.
const maxUploadDimension = 1600

func fitWithin(img image.Image, max int) image.Image {
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w <= max && h <= max {
		return img
	}
	var nw, nh int
	if w >= h {
		nw = max
		nh = h * max / w
	} else {
		nh = max
		nw = w * max / h
	}
	if nw < 1 {
		nw = 1
	}
	if nh < 1 {
		nh = 1
	}
	dst := image.NewRGBA(image.Rect(0, 0, nw, nh))
	draw.ApproxBiLinear.Scale(dst, dst.Bounds(), img, b, draw.Src, nil)
	return dst
}

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

	// Bukti pembayaran (kind=proof) ikut lewat endpoint ini, jadi PDF harus
	// diterima. Sanitasi gambar tetap milik SaveSanitizedImage.
	isProof := r.FormValue("kind") == "proof"
	subdir := ""
	if isProof {
		subdir = "proofs"
	}

	publicURL, err := saveUploadPayload(r, subdir, isProof)
	if err != nil {
		logger.Warn(r.Context(), "upload rejected", logger.Field{
			"operation":      "upload_image",
			"correlation_id": correlationID,
			"user_id":        userID,
			"error":          err.Error(),
		})
		status := http.StatusBadRequest
		if errors.Is(err, ErrAvatarTooLarge) {
			status = http.StatusRequestEntityTooLarge
		}
		sendJSONResponse(w, status, false, err.Error(), nil)
		return
	}

	logger.Info(r.Context(), "upload completed", logger.Field{
		"operation":      "upload_image",
		"correlation_id": correlationID,
		"user_id":        userID,
		"filename":       filepath.Base(publicURL),
		"duration_ms":    time.Since(startedAt).Milliseconds(),
	})

	sendJSONResponse(w, http.StatusCreated, true, "Upload berhasil", map[string]interface{}{
		"url": publicURL,
	})
}

// saveUploadPayload menyimpan satu file dari field "image". Kalau allowPDF, PDF
// disimpan apa adanya (tanpa decode gambar); selain itu disanitasi sebagai gambar.
func saveUploadPayload(r *http.Request, subdir string, allowPDF bool) (string, error) {
	file, header, err := r.FormFile("image")
	if err != nil {
		return "", errors.New("Tidak ada file yang diunggah")
	}
	defer file.Close()

	raw, err := io.ReadAll(io.LimitReader(file, maxUploadSize+1))
	if err != nil || len(raw) == 0 {
		return "", errors.New("File tidak terbaca")
	}
	if int64(len(raw)) > maxUploadSize {
		return "", ErrAvatarTooLarge
	}

	var source []byte
	var format, ext string
	isPDF := allowPDF &&
		strings.EqualFold(filepath.Ext(header.Filename), ".pdf") &&
		len(raw) > 5 && string(raw[:5]) == "%PDF-" &&
		http.DetectContentType(raw) == "application/pdf"
	if isPDF {
		source, format, ext = raw, "pdf", ".pdf"
	} else {
		source, format, err = sanitizeImage(bytes.NewReader(raw))
		if err != nil {
			return "", fmt.Errorf("%w: %s", ErrAvatarUnsupported, sanitizeMessage(err))
		}
		ext = "." + format
		if format == "jpeg" {
			ext = ".jpg"
		}
	}

	uploadDir := "./public/uploads"
	if subdir != "" {
		uploadDir = filepath.Join(uploadDir, subdir)
	}
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		logger.Error(r.Context(), "upload failed creating directory", logger.Field{
			"operation": "upload_image", "error": err.Error(),
		})
		return "", errors.New("Tidak dapat menyiapkan penyimpanan file")
	}
	name, err := randomFileName(ext)
	if err != nil {
		return "", errors.New("Tidak dapat menyimpan file")
	}
	if err := os.WriteFile(filepath.Join(uploadDir, name), source, 0o644); err != nil {
		logger.Error(r.Context(), "upload failed writing file", logger.Field{
			"operation": "upload_image", "error": err.Error(),
		})
		return "", errors.New("Gagal menulis file")
	}
	// Path relatif (bukan URL absolut) agar tidak mengikat satu host; frontend
	// menulis ulang ke origin API via normalizeApiAssetUrl.
	return "/uploads/" + subdir + "/" + name, nil
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

	// Validasi dimensi (DESIGN.md tokens: min 100x100, max 5000x5000)
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w < 100 || h < 100 {
		return nil, "", fmt.Errorf("gambar terlalu kecil, minimal 100x100 piksel (dapat %dx%d)", w, h)
	}
	if w > 5000 || h > 5000 {
		return nil, "", fmt.Errorf("gambar terlalu besar, maksimal 5000x5000 piksel (dapat %dx%d)", w, h)
	}

	// Kompresi otomatis: foto HP besar diperkecil agar ringan dibuka pengunjung.
	img = fitWithin(img, maxUploadDimension)

	var buf bytes.Buffer
	switch format {
	case "jpeg":
		err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
	case "png":
		err = png.Encode(&buf, img)
	case "gif":
		err = gif.Encode(&buf, img, nil)
	case "webp":
		// PHASE 4: WebP di-decode lalu re-encode PNG (normalisasi, buang chunk asing).
		format = "png"
		err = png.Encode(&buf, img)
	default:
		return nil, "", fmt.Errorf("unsupported image format: %s", format)
	}
	if err != nil {
		return nil, "", err
	}

	return buf.Bytes(), format, nil
}
