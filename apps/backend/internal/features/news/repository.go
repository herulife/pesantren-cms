package news

import (
	"context"
	"darussunnah-api/internal/platform/logger"
	"database/sql"
	"strconv"
	"strings"
	"time"
)

type News struct {
	ID           int            `json:"id"`
	Title        string         `json:"title"`
	Slug         string         `json:"slug"`
	Content      string         `json:"content"`
	Excerpt      string         `json:"excerpt"`
	CategoryID   sql.NullInt64  `json:"category_id"`
	CategoryName sql.NullString `json:"category_name"`
	ImageURL     sql.NullString `json:"image_url"`
	Status       string         `json:"status"`
	AuthorID     int            `json:"author_id"`
	CreatedAt    string         `json:"created_at"`
	UpdatedAt    string         `json:"updated_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) slugExists(slug string, excludeID int) (bool, error) {
	query := "SELECT COUNT(*) FROM news WHERE slug = ?"
	args := []interface{}{slug}
	if excludeID > 0 {
		query += " AND id != ?"
		args = append(args, excludeID)
	}

	var count int
	if err := r.db.QueryRow(query, args...).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) EnsureUniqueSlug(baseSlug string, excludeID int) (string, error) {
	slug := strings.TrimSpace(baseSlug)
	if slug == "" {
		slug = "berita"
	}

	exists, err := r.slugExists(slug, excludeID)
	if err != nil {
		return "", err
	}
	if !exists {
		return slug, nil
	}

	for suffix := 2; suffix < 10000; suffix++ {
		candidate := slug + "-" + strconv.Itoa(suffix)
		exists, err := r.slugExists(candidate, excludeID)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}

	return "", sql.ErrNoRows
}

func (r *Repository) FindAll(status, category, search string, limit, offset int) ([]News, int, error) {
	query := `
		SELECT n.id, n.title, n.slug, n.content, n.excerpt, n.category_id, c.name, n.image_url, n.status, COALESCE(n.author_id, 0), n.created_at, n.updated_at
		FROM news n
		LEFT JOIN categories c ON n.category_id = c.id
	`
	whereClauses := make([]string, 0, 4)
	args := make([]interface{}, 0, 8)

	if status != "" && status != "trash" {
		whereClauses = append(whereClauses, "n.status = ?")
		args = append(args, status)
	}

	if status == "trash" {
		whereClauses = append(whereClauses, "n.status = 'trash'")
	} else if status == "" {
		whereClauses = append(whereClauses, "n.status != 'trash'")
	}

	if trimmedCategory := strings.TrimSpace(category); trimmedCategory != "" {
		whereClauses = append(whereClauses, "n.category_id = (SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1)")
		args = append(args, trimmedCategory, trimmedCategory)
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		whereClauses = append(whereClauses, "(n.title LIKE ? OR n.content LIKE ?)")
		args = append(args, searchTerm, searchTerm)
	}

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?"
	params := append(append([]interface{}{}, args...), limit, offset)

	rows, err := r.db.Query(query, params...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var newsList []News
	for rows.Next() {
		var n News
		err := rows.Scan(
			&n.ID, &n.Title, &n.Slug, &n.Content, &n.Excerpt, &n.CategoryID, &n.CategoryName,
			&n.ImageURL, &n.Status, &n.AuthorID, &n.CreatedAt, &n.UpdatedAt,
		)
		if err != nil {
			logger.Info(context.Background(), "news repo: error scanning row", logger.Field{"error": err.Error()})
			continue
		}
		newsList = append(newsList, n)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	countQuery := "SELECT COUNT(*) FROM news n"
	if len(whereClauses) > 0 {
		countQuery += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	err = r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return newsList, total, nil
}

func (r *Repository) FindByID(id int) (*News, error) {
	var n News
	err := r.db.QueryRow(`
		SELECT id, title, slug, content, excerpt, category_id, NULL as category_name, image_url, status, COALESCE(author_id, 0), created_at, updated_at
		FROM news WHERE id = ?
	`, id).Scan(
		&n.ID, &n.Title, &n.Slug, &n.Content, &n.Excerpt, &n.CategoryID, &n.CategoryName,
		&n.ImageURL, &n.Status, &n.AuthorID, &n.CreatedAt, &n.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *Repository) FindBySlug(slug string) (*News, error) {
	var n News
	err := r.db.QueryRow(`
		SELECT id, title, slug, content, excerpt, category_id, NULL as category_name, image_url, status, COALESCE(author_id, 0), created_at, updated_at
		FROM news WHERE slug = ? AND status = 'published'
	`, slug).Scan(
		&n.ID, &n.Title, &n.Slug, &n.Content, &n.Excerpt, &n.CategoryID, &n.CategoryName,
		&n.ImageURL, &n.Status, &n.AuthorID, &n.CreatedAt, &n.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *Repository) Create(n *News) error {
	query := `
		INSERT INTO news (title, slug, content, excerpt, category_id, image_url, status, author_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now().Format("2006-01-02 15:04:05")
	var authorID interface{}
	if n.AuthorID > 0 {
		authorID = n.AuthorID
	}
	var categoryID interface{}
	if n.CategoryID.Valid && n.CategoryID.Int64 > 0 {
		categoryID = n.CategoryID.Int64
	}
	var imageURL interface{}
	if n.ImageURL.Valid && strings.TrimSpace(n.ImageURL.String) != "" {
		imageURL = n.ImageURL.String
	}
	imageValue := "<null>"
	if n.ImageURL.Valid {
		imageValue = n.ImageURL.String
	}
	categoryValue := "<null>"
	if n.CategoryID.Valid {
		categoryValue = strconv.FormatInt(n.CategoryID.Int64, 10)
	}
	logger.Info(context.Background(), "news repo create", logger.Field{
		"title": n.Title, "slug": n.Slug, "status": n.Status, "image": imageValue, "category": categoryValue, "author": authorID,
	})
	_, err := r.db.Exec(query, n.Title, n.Slug, n.Content, n.Excerpt, categoryID, imageURL, n.Status, authorID, now, now)
	return err
}

func (r *Repository) Update(id int, n *News) error {
	query := `
		UPDATE news SET title = ?, slug = ?, content = ?, excerpt = ?, category_id = ?, image_url = ?, status = ?, author_id = COALESCE(author_id, ?), updated_at = ?
		WHERE id = ?
	`
	now := time.Now().Format("2006-01-02 15:04:05")
	var categoryID interface{}
	if n.CategoryID.Valid && n.CategoryID.Int64 > 0 {
		categoryID = n.CategoryID.Int64
	}
	var imageURL interface{}
	if n.ImageURL.Valid && strings.TrimSpace(n.ImageURL.String) != "" {
		imageURL = n.ImageURL.String
	}
	imageValue := "<null>"
	if n.ImageURL.Valid {
		imageValue = n.ImageURL.String
	}
	categoryValue := "<null>"
	if n.CategoryID.Valid {
		categoryValue = strconv.FormatInt(n.CategoryID.Int64, 10)
	}
	var authorID interface{}
	if n.AuthorID > 0 {
		authorID = n.AuthorID
	}
	logger.Info(context.Background(), "news repo update", logger.Field{
		"id": id, "title": n.Title, "slug": n.Slug, "status": n.Status, "image": imageValue, "category": categoryValue, "author": authorID,
	})
	result, err := r.db.Exec(query, n.Title, n.Slug, n.Content, n.Excerpt, categoryID, imageURL, n.Status, authorID, now, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *Repository) SoftDelete(id int) error {
	_, err := r.db.Exec("UPDATE news SET status = 'trash' WHERE id = ?", id)
	return err
}

func (r *Repository) Restore(id int) error {
	_, err := r.db.Exec("UPDATE news SET status = 'draft' WHERE id = ?", id)
	return err
}

func (r *Repository) ForceDelete(id int) error {
	_, err := r.db.Exec("DELETE FROM news WHERE id = ?", id)
	return err
}
