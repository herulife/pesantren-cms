package gstorage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"google.golang.org/api/drive/v3"
)

// SyncJob is the in-memory live state of one sync run exposed via the API.
type SyncJob struct {
	Running   bool   `json:"running"`
	SourceID  int64  `json:"source_id"`
	RunID     int64  `json:"run_id"`
	StartedAt string `json:"started_at"`
	LastError string `json:"last_error"`
	counters  RunCounters
}

type RunCounters struct {
	mu        sync.Mutex
	Added     int `json:"added"`
	Updated   int `json:"updated"`
	Unchanged int `json:"unchanged"`
	Deleted   int `json:"deleted"`
	Errors    int `json:"errors"`
	FilesTotal int `json:"files_total"`
}

func (c *RunCounters) add(added, updated, unchanged, deleted, errorsN int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Added += added
	c.Updated += updated
	c.Unchanged += unchanged
	c.Deleted += deleted
	c.Errors += errorsN
}

func (c *RunCounters) total(n int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.FilesTotal += n
}

func (j *SyncJob) snapshot() map[string]interface{} {
	j.counters.mu.Lock()
	defer j.counters.mu.Unlock()
	return map[string]interface{}{
		"running":      j.Running,
		"source_id":    j.SourceID,
		"run_id":       j.RunID,
		"started_at":   j.StartedAt,
		"last_error":   j.LastError,
		"added":        j.counters.Added,
		"updated":      j.counters.Updated,
		"unchanged":    j.counters.Unchanged,
		"deleted":      j.counters.Deleted,
		"errors":       j.counters.Errors,
		"files_total":  j.counters.FilesTotal,
	}
}

// StartSync begins a background sync for a storage source. Returns an error if
// a run is already in progress or the source/account is not usable.
func (s *Service) StartSync(sourceID int64) (*SyncJob, error) {
	if !s.cfg.Configured() {
		return nil, errors.New("storage oauth belum dikonfigurasi")
	}
	source, err := s.repo.GetSource(sourceID)
	if err != nil {
		return nil, errors.New("sumber data tidak ditemukan")
	}
	if !source.SyncEnabled {
		return nil, errors.New("sumber data sedang dinonaktifkan")
	}
	account, err := s.repo.GetAccount(source.StorageAccountID)
	if err != nil {
		return nil, errors.New("akun storage tidak ditemukan")
	}

	s.jobsMu.Lock()
	if existing, ok := s.jobs[sourceID]; ok && existing.Running {
		s.jobsMu.Unlock()
		return nil, errors.New("sinkronisasi sedang berjalan untuk sumber ini")
	}
	runID, err := s.repo.CreateRun(sourceID)
	if err != nil {
		s.jobsMu.Unlock()
		return nil, fmt.Errorf("gagal mencatat run: %w", err)
	}
	job := &SyncJob{
		Running:   true,
		SourceID:  sourceID,
		RunID:     runID,
		StartedAt: time.Now().Format("2006-01-02 15:04:05"),
	}
	s.jobs[sourceID] = job
	s.jobsMu.Unlock()

	go s.runSync(job, account, source)
	return job, nil
}

// GetSyncJob returns the live job for a source (nil if none started yet).
func (s *Service) GetSyncJob(sourceID int64) *SyncJob {
	s.jobsMu.Lock()
	defer s.jobsMu.Unlock()
	return s.jobs[sourceID]
}

func (s *Service) runSync(job *SyncJob, account *Account, source *Source) {
	defer func() {
		if r := recover(); r != nil {
			job.counters.add(0, 0, 0, 0, 1)
			job.LastError = fmt.Sprintf("panic: %v", r)
			_ = s.repo.FinishRun(job.RunID, "error", job.LastError, job.counters.Added, job.counters.Updated, job.counters.Unchanged, job.counters.Deleted, job.counters.Errors, job.counters.FilesTotal, 0)
			_ = s.repo.SetSourceState(source.ID, "error", "error", job.LastError)
		}
		s.jobsMu.Lock()
		job.Running = false
		s.jobsMu.Unlock()
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Minute)
	defer cancel()

	started := time.Now()
	svc, err := s.GetDriveService(ctx, account)
	if err != nil {
		job.LastError = err.Error()
		_ = s.finishWithError(job, source, started, err)
		return
	}

	_ = s.repo.EnsureAlbumMeta(source.Slug, source.Name, source.Category, source.RootFolderID)

	seen := map[string]bool{}
	pageToken := ""
	for {
		call := svc.Files.List().
			Q(fmt.Sprintf("%q in parents and trashed = false and mimeType contains 'image/'", source.RootFolderID)).
			PageSize(200).
			Fields("nextPageToken, files(id,name,mimeType,size,modifiedTime)")
		if pageToken != "" {
			call.PageToken(pageToken)
		}
		res, err := call.Do()
		if err != nil {
			job.LastError = err.Error()
			_ = s.finishWithError(job, source, started, err)
			return
		}
		for _, f := range res.Files {
			job.counters.total(1)
			seen[f.Id] = true
			s.processImage(ctx, job, source, svc, f)
		}
		pageToken = res.NextPageToken
		if pageToken == "" {
			break
		}
	}

	s.sweepDeleted(job, source, seen)

	elapsed := int(time.Since(started).Milliseconds())
	_ = s.repo.FinishRun(job.RunID, "success", "Sinkronisasi selesai",
		job.counters.Added, job.counters.Updated, job.counters.Unchanged, job.counters.Deleted, job.counters.Errors, job.counters.FilesTotal, elapsed)
	_ = s.repo.SetSourceState(source.ID, "success", "success", "")
}

func (s *Service) finishWithError(job *SyncJob, source *Source, started time.Time, err error) error {
	elapsed := int(time.Since(started).Milliseconds())
	_ = s.repo.FinishRun(job.RunID, "error", err.Error(),
		job.counters.Added, job.counters.Updated, job.counters.Unchanged, job.counters.Deleted, job.counters.Errors, job.counters.FilesTotal, elapsed)
	return s.repo.SetSourceState(source.ID, "error", "error", err.Error())
}

func (s *Service) processImage(ctx context.Context, job *SyncJob, source *Source, svc *drive.Service, f *drive.File) {
	ref := f.Id
	ext := extByMime(f.MimeType)
	if ext == "" {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}
	slug := source.Slug
	dir := filepath.Join("public", "uploads", "gdrive-"+strconv.FormatInt(source.ID, 10))
	if err := os.MkdirAll(dir, 0o755); err != nil {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}
	localPath := filepath.Join(dir, ref+ext)

	existsLocal := false
	if _, err := os.Stat(localPath); err == nil {
		existsLocal = true
	}
	existsDB, _ := s.repo.GalleryCountByRef(slug, ref)
	existsDBRow := existsDB > 0

	if existsDBRow && existsLocal {
		job.counters.add(0, 0, 1, 0, 0)
		return
	}

	resp, err := svc.Files.Get(ref).Context(ctx).Download()
	if err != nil {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}
	data, readErr := io.ReadAll(resp.Body)
	resp.Body.Close()
	if readErr != nil {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}

	tmp := localPath + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}
	if err := os.Rename(tmp, localPath); err != nil {
		job.counters.add(0, 0, 0, 0, 1)
		return
	}

	imageURL := "/uploads/gdrive-" + strconv.FormatInt(source.ID, 10) + "/" + ref + ext
	title := f.Name
	if title == "" {
		title = ref
	}

	if !existsDBRow {
		cover := false
		if hasCover, _ := s.repo.HasAlbumCover(slug); !hasCover {
			cover = true
		}
		if err := s.repo.InsertGalleryMedia(title, source.Category, source.Name, slug, "", cover, imageURL, ref); err != nil {
			job.counters.add(0, 0, 0, 0, 1)
			return
		}
		job.counters.add(1, 0, 0, 0, 0)
	} else {
		if err := s.repo.UpdateGalleryRowByRef(slug, ref, title, imageURL); err == nil {
			job.counters.add(0, 1, 0, 0, 0)
		} else {
			job.counters.add(0, 0, 0, 0, 1)
		}
	}
}

// sweepDeleted removes gallery rows (and local files) for images that no longer
// exist on Drive.
func (s *Service) sweepDeleted(job *SyncJob, source *Source, seen map[string]bool) {
	rows, err := s.repo.GalleryRowsForSource(source.Slug)
	if err != nil {
		return
	}
	var toDelete []int64
	for _, g := range rows {
		if seen[g.SourceRef] {
			continue
		}
		if g.ImageURL != "" {
			rel := strings.TrimPrefix(g.ImageURL, "/uploads/")
			if rel != g.ImageURL && !strings.Contains(rel, "..") {
				_ = os.Remove(filepath.Join("public", "uploads", rel))
			}
		}
		toDelete = append(toDelete, g.ID)
	}
	if len(toDelete) == 0 {
		return
	}
	if n, err := s.repo.DeleteGalleryRows(toDelete); err == nil {
		job.counters.add(0, 0, 0, int(n), 0)
	}
}

func extByMime(mime string) string {
	switch mime {
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	case "image/heic":
		return ".heic"
	case "image/bmp":
		return ".bmp"
	default:
		return ""
	}
}