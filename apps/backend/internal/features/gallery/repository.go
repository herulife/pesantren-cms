package gallery

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

type GalleryItem struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Category     string    `json:"category"`
	AlbumName    string    `json:"album_name"`
	AlbumSlug    string    `json:"album_slug"`
	EventDate    string    `json:"event_date"`
	IsAlbumCover bool      `json:"is_album_cover"`
	ImageURL     string    `json:"image_url"`
	CreatedAt    time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

var ErrDuplicateGalleryItem = errors.New("gallery item already exists in album")

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(category, search string, limit, offset int) ([]GalleryItem, int, error) {
	query := "SELECT id, title, category, album_name, album_slug, event_date, is_album_cover, image_url, created_at FROM gallery WHERE 1=1"
	var args []interface{}

	if category != "" {
		query += " AND category = ?"
		args = append(args, category)
	}
	if search != "" {
		query += " AND title LIKE ?"
		args = append(args, "%"+search+"%")
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []GalleryItem
	for rows.Next() {
		var item GalleryItem
		var createdAt string
		err := rows.Scan(&item.ID, &item.Title, &item.Category, &item.AlbumName, &item.AlbumSlug, &item.EventDate, &item.IsAlbumCover, &item.ImageURL, &createdAt)
		if err != nil {
			return nil, 0, err
		}

		// Robust date parsing
		if createdAt != "" {
			// Try standard SQL format first
			t, err := time.Parse("2006-01-02 15:04:05", createdAt)
			if err != nil {
				// Try RFC3339 (T and Z)
				t, err = time.Parse(time.RFC3339, createdAt)
			}
			if err == nil {
				item.CreatedAt = t
			} else {
				item.CreatedAt = time.Now() // Fallback if parsing fails
			}
		} else {
			item.CreatedAt = time.Now()
		}
		list = append(list, item)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM gallery WHERE 1=1"
	countArgs := []interface{}{}
	if category != "" {
		countQuery += " AND category = ?"
		countArgs = append(countArgs, category)
	}
	if search != "" {
		countQuery += " AND title LIKE ?"
		countArgs = append(countArgs, "%"+search+"%")
	}
	r.db.QueryRow(countQuery, countArgs...).Scan(&total)

	return list, total, nil
}

func (r *Repository) Create(item *GalleryItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	albumSlug := strings.TrimSpace(item.AlbumSlug)
	albumName := strings.TrimSpace(item.AlbumName)
	imageURL := strings.TrimSpace(item.ImageURL)

	var existingCount int
	err = tx.QueryRow(`
		SELECT COUNT(*)
		FROM gallery
		WHERE IFNULL(album_slug, '') = ?
		  AND IFNULL(album_name, '') = ?
		  AND image_url = ?
	`, albumSlug, albumName, imageURL).Scan(&existingCount)
	if err != nil {
		return err
	}
	if existingCount > 0 {
		return ErrDuplicateGalleryItem
	}

	if item.IsAlbumCover {
		_, err = tx.Exec(`
			UPDATE gallery
			SET is_album_cover = 0
			WHERE IFNULL(album_slug, '') = ?
			  AND IFNULL(album_name, '') = ?
		`, albumSlug, albumName)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec("INSERT INTO gallery (title, category, album_name, album_slug, event_date, is_album_cover, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
		item.Title, item.Category, item.AlbumName, item.AlbumSlug, item.EventDate, item.IsAlbumCover, item.ImageURL)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM gallery WHERE id = ?", id)
	return err
}
