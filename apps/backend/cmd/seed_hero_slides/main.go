package main

import (
	"database/sql"
	"encoding/json"
	"log"

	_ "modernc.org/sqlite"
)

type heroSlide struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Subtitle   string `json:"subtitle"`
	ImageURL   string `json:"image_url"`
	ButtonText string `json:"button_text"`
	ButtonURL  string `json:"button_url"`
}

func main() {
	db, err := sql.Open("sqlite", "darussunnah.db")
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	slides := []heroSlide{
		{
			ID:         "hero-slide-1",
			Title:      "Merekam Jejak Intelektual & Spiritual",
			Subtitle:   "Menyatukan dzikir dan fikir untuk membangun peradaban Rabbani di lingkungan tahfidz yang hangat dan terarah.",
			ImageURL:   "/assets/img/gedung.webp",
			ButtonText: "Daftar Sekarang",
			ButtonURL:  "/psb",
		},
		{
			ID:         "hero-slide-2",
			Title:      "Mencetak Generasi Penghafal Al-Qur'an",
			Subtitle:   "Metode hafalan intensif bersama asatidz berpengalaman untuk menumbuhkan hafalan yang mutqin, adab yang baik, dan semangat dakwah.",
			ImageURL:   "/assets/img/tahfidz.jpg",
			ButtonText: "Lihat Program Tahfidz",
			ButtonURL:  "/program",
		},
		{
			ID:         "hero-slide-3",
			Title:      "Pembelajaran Berbasis Kitab Kuning",
			Subtitle:   "Kurikulum terpadu yang memadukan pemahaman agama, bahasa Arab, wawasan kebangsaan, dan pembinaan karakter santri.",
			ImageURL:   "/assets/img/belajar-kitab.jpg",
			ButtonText: "Info PSB",
			ButtonURL:  "/psb",
		},
	}

	payload, err := json.Marshal(slides)
	if err != nil {
		log.Fatalf("marshal slides: %v", err)
	}

	settings := map[string]string{
		"hero_slides":        string(payload),
		"banner_title":       slides[0].Title,
		"banner_subtitle":    slides[0].Subtitle,
		"banner_image_url":   slides[0].ImageURL,
		"banner_button_text": slides[0].ButtonText,
		"banner_button_url":  slides[0].ButtonURL,
	}

	for key, value := range settings {
		if _, err := db.Exec("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", value, key); err != nil {
			log.Fatalf("update setting %s: %v", key, err)
		}

		var exists int
		if err := db.QueryRow("SELECT COUNT(1) FROM settings WHERE key = ?", key).Scan(&exists); err != nil {
			log.Fatalf("check setting %s: %v", key, err)
		}
		if exists == 0 {
			if _, err := db.Exec("INSERT INTO settings (key, value, description) VALUES (?, ?, '')", key, value); err != nil {
				log.Fatalf("insert setting %s: %v", key, err)
			}
		}
	}

	log.Println("hero slides updated successfully")
}
