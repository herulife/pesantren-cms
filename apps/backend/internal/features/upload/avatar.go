package upload

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/logger"
)

// avatarSubdir memisahkan avatar user dari fotoSantri/pasfoto dan bukti
// pembayaran, supaya file avatar bisa dianggarkan sendiri (satu user = satu file)
// dan tidak pernah tertukar dengan dokumen lain.
const avatarSubdir = "avatars"

// ErrAvatarTooLarge dipetakan ke 400 + pesan spesifik (bukan 413 generik) agar
// form di /admin/akun bisa menampilkannya apa adanya.
var ErrAvatarTooLarge = errors.New("Ukuran foto terlalu besar. Maksimal 5MB.")

// ErrAvatarUnsupported dipetakan ke 400 dengan pesan dari sanitizer.
var ErrAvatarUnsupported = errors.New("Foto tidak valid")

// SaveSanitizedImage membaca satu field multipart, sanitize (decode -> resize ->
// re-encode, sehingga metadata EXIF termasuk koordinat GPS hilang), lalu
// menyimpannya di subdir yang diminta dan mengembalikan path publik relatif.
//
// Dipakai bersama oleh HandleUpload (pasfoto/bukti) dan HandleMyPhoto (avatar)
// supaya tidak ada dua implementasi sanitasi yang bisa berbeda-drift.
func SaveSanitizedImage(r *http.Request, field, subdir string) (string, error) {
	file, header, err := r.FormFile(field)
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

	source, format, err := sanitizeImage(bytes.NewReader(raw))
	if err != nil {
		return "", fmt.Errorf("%w: %s", ErrAvatarUnsupported, sanitizeMessage(err))
	}
	_ = header // nama file asli tidak dipakai: simpan sebagai nama acak

	uploadDir := "./public/uploads"
	if subdir != "" {
		uploadDir = filepath.Join(uploadDir, subdir)
	}
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", errors.New("Tidak dapat menyiapkan penyimpanan file")
	}

	ext := "." + format
	if format == "jpeg" {
		ext = ".jpg"
	}
	name, err := randomFileName(ext)
	if err != nil {
		return "", errors.New("Tidak dapat menyimpan file")
	}
	if err := os.WriteFile(filepath.Join(uploadDir, name), source, 0o644); err != nil {
		return "", errors.New("Gagal menulis file")
	}
	return "/uploads/" + subdir + "/" + name, nil
}

// sanitizeMessage mengubah error teknis sanitizer menjadi kalimat yang enak
// dibaca user, tanpa membocorkan detail internal.
func sanitizeMessage(err error) string {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "content type"):
		return "File harus berupa gambar JPG, JPEG, PNG, GIF, atau WEBP"
	case strings.Contains(msg, "too small"):
		return "Foto terlalu kecil, minimal 100x100 piksel"
	case strings.Contains(msg, "unsupported image format"):
		return "Format foto tidak didukung"
	default:
		return "Foto tidak valid atau rusak"
	}
}

// deleteOwnedAvatar menghapus file avatar milik user. Path harus persis di
// /uploads/avatars/<nama-acak> — semua kondisi lain diabaikan supaya path
// dari database yang rusak/disunting manual tidak bisa menghapus file lain.
func deleteOwnedAvatar(publicPath string) {
	const prefix = "/uploads/avatars/"
	if !strings.HasPrefix(publicPath, prefix) {
		return
	}
	name := strings.TrimPrefix(publicPath, prefix)
	if name == "" || strings.ContainsAny(name, "/\\") || strings.Contains(name, "..") {
		return
	}
	_ = os.Remove(filepath.Join("./public/uploads/avatars", name))
}

// HandleMyPhoto adalah endpoint avatar milik user yang sedang login.
//
// Dipisah dari package auth karena auth tidak boleh import package upload
// (upload sudah import auth untuk CurrentUserID, jadi import balik = siklus).
// Semua logika sanitasi gambar tetap milik package upload.
func HandleMyPhoto(repo auth.IRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		me, ok := auth.GetAuthenticatedUser(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, false, "Sesi tidak valid. Silakan login ulang.", nil)
			return
		}

		// Ambil URL lama LEBIH DAHULU: kalau simpan yang baru gagal, user tidak
		// boleh kehilangan avatar lamanya.
		current, err := repo.FindByID(me.ID)
		if err != nil {
			logger.Error(r.Context(), "avatar failed loading user", logger.Field{
				"operation": "upload_avatar", "user_id": me.ID, "error": err.Error(),
			})
			writeJSON(w, http.StatusInternalServerError, false, "Gagal memuat data akun", nil)
			return
		}
		oldPath := ""
		if current.PhotoURL != nil {
			oldPath = *current.PhotoURL
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+(1<<20))
		publicURL, err := SaveSanitizedImage(r, "image", avatarSubdir)
		if err != nil {
			status := http.StatusBadRequest
			if errors.Is(err, ErrAvatarTooLarge) {
				status = http.StatusRequestEntityTooLarge
			}
			logger.Warn(r.Context(), "avatar upload rejected", logger.Field{
				"operation": "upload_avatar", "user_id": me.ID, "error": err.Error(),
			})
			writeJSON(w, status, false, err.Error(), nil)
			return
		}

		if err := repo.SetPhotoURL(me.ID, &publicURL); err != nil {
			// DB gagal: Jangan tinggalkan file yatim di disk.
			deleteOwnedAvatar(publicURL)
			logger.Error(r.Context(), "avatar failed saving photo_url", logger.Field{
				"operation": "upload_avatar", "user_id": me.ID, "error": err.Error(),
			})
			writeJSON(w, http.StatusInternalServerError, false, "Gagal menyimpan foto", nil)
			return
		}

		// File baru sudah terpasang & tercatat -> file lama boleh dihapus.
		if oldPath != "" && oldPath != publicURL {
			deleteOwnedAvatar(oldPath)
		}

		logger.Info(r.Context(), "avatar uploaded", logger.Field{
			"operation": "upload_avatar", "user_id": me.ID, "path": publicURL,
		})
		writeJSON(w, http.StatusOK, true, "Foto profil berhasil diperbarui", map[string]interface{}{
			"photo_url": publicURL,
		})
	}
}

// HandleDeleteMyPhoto melepas avatar (kembali ke inisial).
func HandleDeleteMyPhoto(repo auth.IRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		me, ok := auth.GetAuthenticatedUser(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, false, "Sesi tidak valid. Silakan login ulang.", nil)
			return
		}
		current, err := repo.FindByID(me.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, false, "Gagal memuat data akun", nil)
			return
		}
		if err := repo.SetPhotoURL(me.ID, nil); err != nil {
			logger.Error(r.Context(), "avatar failed clearing photo_url", logger.Field{
				"operation": "delete_avatar", "user_id": me.ID, "error": err.Error(),
			})
			writeJSON(w, http.StatusInternalServerError, false, "Gagal menghapus foto", nil)
			return
		}
		if current.PhotoURL != nil {
			deleteOwnedAvatar(*current.PhotoURL)
		}
		logger.Info(r.Context(), "avatar removed", logger.Field{
			"operation": "delete_avatar", "user_id": me.ID,
		})
		writeJSON(w, http.StatusOK, true, "Foto profil dihapus", map[string]interface{}{
			"photo_url": nil,
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
		"data":    data,
	})
}
