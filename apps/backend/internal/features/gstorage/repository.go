package gstorage

import (
	"database/sql"
	"fmt"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func nullStr(s sql.NullString) string {
	if s.Valid {
		return s.String
	}
	return ""
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// ── Accounts ──────────────────────────────────────────────

func (r *Repository) CreateAccount(acc *Account) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO storage_accounts (provider, name, account_email, avatar_url, encrypted_refresh_token, status)
		VALUES (?, ?, ?, ?, ?, ?)`,
		acc.Provider, acc.Name, acc.AccountEmail, acc.AvatarURL, acc.EncryptedRefreshTkn, acc.Status)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) GetAccount(id int64) (*Account, error) {
	row := r.db.QueryRow(`
		SELECT id, provider, name, account_email, avatar_url, encrypted_refresh_token,
		       COALESCE(status,'active'), COALESCE(error_message,''),
		       COALESCE(last_tested_at,''), created_at, updated_at
		FROM storage_accounts WHERE id = ?`, id)
	var a Account
	var enc []byte
	var status, errMsg, lastTested, createdAt, updatedAt sql.NullString
	if err := row.Scan(&a.ID, &a.Provider, &a.Name, &a.AccountEmail, &a.AvatarURL, &enc, &status, &errMsg, &lastTested, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	a.EncryptedRefreshTkn = enc
	a.Status = nullStr(status)
	a.ErrorMessage = nullStr(errMsg)
	a.LastTestedAt = nullStr(lastTested)
	a.CreatedAt = nullStr(createdAt)
	a.UpdatedAt = nullStr(updatedAt)
	return &a, nil
}

func (r *Repository) GetAccountByEmail(email string) (*Account, error) {
	row := r.db.QueryRow(`SELECT id, provider, name, account_email, avatar_url, encrypted_refresh_token, COALESCE(status,'active'), COALESCE(error_message,''), COALESCE(last_tested_at,''), created_at, updated_at FROM storage_accounts WHERE account_email = ?`, email)
	var a Account
	var enc []byte
	var status, errMsg, lastTested, createdAt, updatedAt sql.NullString
	if err := row.Scan(&a.ID, &a.Provider, &a.Name, &a.AccountEmail, &a.AvatarURL, &enc, &status, &errMsg, &lastTested, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	a.EncryptedRefreshTkn = enc
	a.Status = nullStr(status)
	a.ErrorMessage = nullStr(errMsg)
	a.LastTestedAt = nullStr(lastTested)
	a.CreatedAt = nullStr(createdAt)
	a.UpdatedAt = nullStr(updatedAt)
	return &a, nil
}

func (r *Repository) ListAccounts() ([]Account, error) {
	rows, err := r.db.Query(`
		SELECT id, provider, name, account_email, avatar_url, COALESCE(status,'active'),
		       COALESCE(error_message,''), COALESCE(last_tested_at,''), created_at, updated_at
		FROM storage_accounts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Account
	for rows.Next() {
		var a Account
		var status, errMsg, lastTested, createdAt, updatedAt sql.NullString
		if err := rows.Scan(&a.ID, &a.Provider, &a.Name, &a.AccountEmail, &a.AvatarURL, &status, &errMsg, &lastTested, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		a.Status = nullStr(status)
		a.ErrorMessage = nullStr(errMsg)
		a.LastTestedAt = nullStr(lastTested)
		a.CreatedAt = nullStr(createdAt)
		a.UpdatedAt = nullStr(updatedAt)
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *Repository) UpdateAccount(id int64, name, status, errorMessage string, lastTested bool) error {
	query := "UPDATE storage_accounts SET name = ?, status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{name, status, errorMessage}
	if lastTested {
		query += ", last_tested_at = CURRENT_TIMESTAMP"
	}
	query += " WHERE id = ?"
	args = append(args, id)
	_, err := r.db.Exec(query, args...)
	return err
}

func (r *Repository) UpdateAccountToken(id int64, enc []byte, name, avatar string) error {
	_, err := r.db.Exec(`UPDATE storage_accounts SET encrypted_refresh_token = ?, name = ?, avatar_url = ?, status = 'active', error_message = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, enc, name, avatar, id)
	return err
}

func (r *Repository) DeleteAccount(id int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM storage_sync_runs WHERE source_id IN (SELECT id FROM storage_sources WHERE storage_account_id = ?)`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM storage_sources WHERE storage_account_id = ?`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM storage_accounts WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

// ── Sources ───────────────────────────────────────────────

func (r *Repository) CreateSource(src *Source) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO storage_sources (storage_account_id, name, slug, root_folder_id, category, sync_enabled, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		src.StorageAccountID, src.Name, src.Slug, src.RootFolderID, src.Category, boolToInt(src.SyncEnabled), "idle")
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func scanSource(row interface{ Scan(...interface{}) error }) (*Source, error) {
	var s Source
	var syncEnabled int
	var status, lastError, lastSyncAt, lastSyncStatus, createdAt, updatedAt sql.NullString
	if err := row.Scan(&s.ID, &s.StorageAccountID, &s.Name, &s.Slug, &s.RootFolderID, &s.Category, &syncEnabled, &status, &lastError, &lastSyncAt, &lastSyncStatus, &createdAt, &updatedAt); err != nil {
		return nil, err
	}
	s.SyncEnabled = syncEnabled == 1
	s.Status = nullStr(status)
	s.LastError = nullStr(lastError)
	s.LastSyncAt = nullStr(lastSyncAt)
	s.LastSyncStatus = nullStr(lastSyncStatus)
	s.CreatedAt = nullStr(createdAt)
	s.UpdatedAt = nullStr(updatedAt)
	return &s, nil
}

const sourceColumns = `id, storage_account_id, name, slug, root_folder_id, category, sync_enabled, COALESCE(status,'idle'), COALESCE(last_error,''), COALESCE(last_sync_at,''), COALESCE(last_sync_status,''), created_at, updated_at`

func (r *Repository) GetSource(id int64) (*Source, error) {
	row := r.db.QueryRow(`SELECT `+sourceColumns+` FROM storage_sources WHERE id = ?`, id)
	return scanSource(row)
}

func (r *Repository) GetSourceBySlug(slug string) (*Source, error) {
	row := r.db.QueryRow(`SELECT `+sourceColumns+` FROM storage_sources WHERE slug = ?`, slug)
	return scanSource(row)
}

func (r *Repository) ListSources(accountID int64) ([]Source, error) {
	rows, err := r.db.Query(`SELECT `+sourceColumns+` FROM storage_sources WHERE storage_account_id = ? ORDER BY created_at DESC`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Source
	for rows.Next() {
		s, err := scanSource(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *s)
	}
	return list, rows.Err()
}

func (r *Repository) ListAllSources() ([]Source, error) {
	rows, err := r.db.Query(`SELECT `+sourceColumns+` FROM storage_sources ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Source
	for rows.Next() {
		s, err := scanSource(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *s)
	}
	return list, rows.Err()
}

func (r *Repository) UpdateSource(id int64, name, slug, category string, syncEnabled, setSync bool) error {
	query := "UPDATE storage_sources SET name = ?, slug = ?, category = ?"
	args := []interface{}{name, slug, category}
	if setSync {
		query += ", sync_enabled = ?"
		args = append(args, boolToInt(syncEnabled))
	}
	query += ", updated_at = CURRENT_TIMESTAMP WHERE id = ?"
	args = append(args, id)
	_, err := r.db.Exec(query, args...)
	return err
}

func (r *Repository) SetSourceSyncState(id int64, status, lastSyncStatus, lastError string) error {
	_, err := r.db.Exec(`
		UPDATE storage_sources
		SET status = ?, last_sync_status = ?, last_error = ?, last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`, status, lastSyncStatus, lastError, id)
	return err
}

// SetSourceState records a sync outcome (status + last sync status + error).
func (r *Repository) SetSourceState(id int64, status, lastSyncStatus, lastError string) error {
	return r.SetSourceSyncState(id, status, lastSyncStatus, lastError)
}

func (r *Repository) SetSourceStatus(id int64, status, lastError string) error {
	_, err := r.db.Exec(`UPDATE storage_sources SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, status, lastError, id)
	return err
}

func (r *Repository) DeleteSource(id int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM storage_sync_runs WHERE source_id = ?`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM storage_sources WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

// DeleteGalleryBySource removes synced gallery entries for a source slug.
func (r *Repository) DeleteGalleryBySource(slug string) (int64, error) {
	res, err := r.db.Exec(`DELETE FROM gallery WHERE album_slug = ? AND source = 'gdrive'`, slug)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// ── Sync runs ─────────────────────────────────────────────

func (r *Repository) CreateRun(sourceID int64) (int64, error) {
	res, err := r.db.Exec(`INSERT INTO storage_sync_runs (source_id, status) VALUES (?, 'running')`, sourceID)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) FinishRun(id int64, status, message string, added, updated, unchanged, deleted, errorsN, filesTotal, durationMS int) error {
	_, err := r.db.Exec(`
		UPDATE storage_sync_runs SET status = ?, message = ?,
			added = ?, updated = ?, unchanged = ?, deleted = ?, errors = ?, files_total = ?, duration_ms = ?,
			finished_at = CURRENT_TIMESTAMP
		WHERE id = ?`, status, message, added, updated, unchanged, deleted, errorsN, filesTotal, durationMS, id)
	return err
}

func scanRun(row interface{ Scan(...interface{}) error }) (*SyncRun, error) {
	var run SyncRun
	var startedAt, finishedAt sql.NullString
	if err := row.Scan(&run.ID, &run.SourceID, &run.Status, &startedAt, &finishedAt, &run.Added, &run.Updated, &run.Unchanged, &run.Deleted, &run.Errors, &run.FilesTotal, &run.DurationMS, &run.Message); err != nil {
		return nil, err
	}
	run.StartedAt = nullStr(startedAt)
	run.FinishedAt = nullStr(finishedAt)
	return &run, nil
}

func (r *Repository) LatestRun(sourceID int64) (*SyncRun, error) {
	row := r.db.QueryRow(`SELECT id, source_id, status, started_at, COALESCE(finished_at,''), added, updated, unchanged, deleted, errors, files_total, duration_ms, COALESCE(message,'') FROM storage_sync_runs WHERE source_id = ? ORDER BY id DESC LIMIT 1`, sourceID)
	return scanRun(row)
}

func (r *Repository) ListRuns(sourceID int64, limit int) ([]SyncRun, error) {
	rows, err := r.db.Query(`SELECT id, source_id, status, started_at, COALESCE(finished_at,''), added, updated, unchanged, deleted, errors, files_total, duration_ms, COALESCE(message,'') FROM storage_sync_runs WHERE source_id = ? ORDER BY id DESC LIMIT ?`, sourceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []SyncRun
	for rows.Next() {
		run, err := scanRun(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *run)
	}
	return list, rows.Err()
}

// ── Gallery integration ───────────────────────────────────

func (r *Repository) GalleryCountByRef(albumSlug, ref string) (int, error) {
	var n int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM gallery WHERE album_slug = ? AND source = 'gdrive' AND source_ref = ?`, albumSlug, ref).Scan(&n)
	return n, err
}

func (r *Repository) HasAlbumCover(albumSlug string) (bool, error) {
	var n int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM gallery WHERE album_slug = ? AND is_album_cover = 1`, albumSlug).Scan(&n)
	return n > 0, err
}

func (r *Repository) InsertGalleryMedia(title, category, albumName, albumSlug, eventDate string, isCover bool, imageURL, ref string) error {
	_, err := r.db.Exec(`
		INSERT INTO gallery (title, category, album_name, album_slug, event_date, is_album_cover, image_url, source, source_ref)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'gdrive', ?)`,
		title, category, albumName, albumSlug, eventDate, boolToInt(isCover), imageURL, ref)
	return err
}

// EnsureAlbumMeta mirrors gallery.UpsertMeta but also stores drive_folder_id
// and category so the public album page can link back to the source folder.
func (r *Repository) EnsureAlbumMeta(slug, name, category, driveFolderID string) error {
	_, err := r.db.Exec(`
		INSERT INTO gallery_albums (album_slug, album_name, category, drive_folder_id, drive_url, is_active)
		VALUES (?, ?, ?, ?, '', 1)
		ON CONFLICT(album_slug) DO UPDATE SET
			album_name = excluded.album_name,
			category = excluded.category,
			drive_folder_id = excluded.drive_folder_id`,
		slug, name, category, driveFolderID)
	return err
}

// GalleryRowsForSource lists synced gallery items for an album so the sync job
// can detect files that disappeared from Drive.
type GalleryRow struct {
	ID       int64
	SourceRef string
	ImageURL string
}

func (r *Repository) GalleryRowsForSource(albumSlug string) ([]GalleryRow, error) {
	rows, err := r.db.Query(`SELECT id, source_ref, image_url FROM gallery WHERE album_slug = ? AND source = 'gdrive'`, albumSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []GalleryRow
	for rows.Next() {
		var g GalleryRow
		if err := rows.Scan(&g.ID, &g.SourceRef, &g.ImageURL); err != nil {
			return nil, err
		}
		list = append(list, g)
	}
	return list, rows.Err()
}

func (r *Repository) DeleteGalleryRows(ids []int64) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}
	res, err := r.db.Exec(fmt.Sprintf("DELETE FROM gallery WHERE id IN (%s)", strings.Join(placeholders, ",")), args...)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func (r *Repository) UpdateGalleryRowByRef(albumSlug, ref, title, imageURL string) error {
	_, err := r.db.Exec(`UPDATE gallery SET title = ?, image_url = ? WHERE album_slug = ? AND source = 'gdrive' AND source_ref = ?`, title, imageURL, albumSlug, ref)
	return err
}

func (r *Repository) UpdateGalleryRow(id int64, title, imageURL string) error {
	_, err := r.db.Exec(`UPDATE gallery SET title = ?, image_url = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`, title, imageURL, id)
	return err
}