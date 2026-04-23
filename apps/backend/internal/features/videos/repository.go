package videos

import (
	"database/sql"
	"time"
)

func parseCreatedAt(createdAt string) time.Time {
	if createdAt != "" {
		t, err := time.Parse("2006-01-02 15:04:05", createdAt)
		if err != nil {
			t, err = time.Parse(time.RFC3339, createdAt)
		}
		if err == nil {
			return t
		}
	}
	return time.Now()
}

type Video struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	SeriesName string    `json:"series_name"`
	SeriesSlug string    `json:"series_slug"`
	EventDate  string    `json:"event_date"`
	IsFeatured bool      `json:"is_featured"`
	URL        string    `json:"url"`
	Thumbnail  string    `json:"thumbnail"`
	CreatedAt  time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll(search string, limit, offset int) ([]Video, int, error) {
	query := "SELECT id, title, series_name, series_slug, event_date, is_featured, url, thumbnail, created_at FROM videos WHERE 1=1"
	var args []interface{}

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

	var list []Video
	for rows.Next() {
		var v Video
		var createdAt string
		err := rows.Scan(&v.ID, &v.Title, &v.SeriesName, &v.SeriesSlug, &v.EventDate, &v.IsFeatured, &v.URL, &v.Thumbnail, &createdAt)
		if err != nil {
			return nil, 0, err
		}
		v.CreatedAt = parseCreatedAt(createdAt)
		list = append(list, v)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM videos WHERE 1=1"
	var countArgs []interface{}
	if search != "" {
		countQuery += " AND title LIKE ?"
		countArgs = append(countArgs, "%"+search+"%")
	}
	r.db.QueryRow(countQuery, countArgs...).Scan(&total)

	return list, total, nil
}

func (r *Repository) Create(v *Video) error {
	_, err := r.db.Exec("INSERT INTO videos (title, series_name, series_slug, event_date, is_featured, url, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)",
		v.Title, v.SeriesName, v.SeriesSlug, v.EventDate, v.IsFeatured, v.URL, v.Thumbnail)
	return err
}

func (r *Repository) Update(id int, v *Video) error {
	_, err := r.db.Exec("UPDATE videos SET title = ?, series_name = ?, series_slug = ?, event_date = ?, is_featured = ?, url = ?, thumbnail = ? WHERE id = ?",
		v.Title, v.SeriesName, v.SeriesSlug, v.EventDate, v.IsFeatured, v.URL, v.Thumbnail, id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM videos WHERE id = ?", id)
	return err
}
