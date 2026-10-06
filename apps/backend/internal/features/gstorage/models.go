package gstorage

type Account struct {
	ID                  int64     `json:"id"`
	Provider            string    `json:"provider"`
	Name                string    `json:"name"`
	AccountEmail        string    `json:"account_email"`
	AvatarURL           string    `json:"avatar_url"`
	Status              string    `json:"status"`
	ErrorMessage        string    `json:"error_message"`
	LastTestedAt        string    `json:"last_tested_at"`
	CreatedAt           string    `json:"created_at"`
	UpdatedAt           string    `json:"updated_at"`
	EncryptedRefreshTkn []byte    `json:"-"`
}

type Source struct {
	ID               int64  `json:"id"`
	StorageAccountID int64  `json:"storage_account_id"`
	Name             string `json:"name"`
	Slug             string `json:"slug"`
	RootFolderID     string `json:"root_folder_id"`
	Category         string `json:"category"`
	SyncEnabled      bool   `json:"sync_enabled"`
	Status           string `json:"status"`
	LastError        string `json:"last_error"`
	LastSyncAt       string `json:"last_sync_at"`
	LastSyncStatus   string `json:"last_sync_status"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
	// MediaCount is filled by the repository when listing.
	MediaCount int `json:"media_count"`
	// FolderName is the resolved Drive folder display name (when known).
	FolderName string `json:"folder_name,omitempty"`
}

type SyncRun struct {
	ID         int64  `json:"id"`
	SourceID   int64  `json:"source_id"`
	Status     string `json:"status"`
	StartedAt  string `json:"started_at"`
	FinishedAt string `json:"finished_at"`
	Added      int    `json:"added"`
	Updated    int    `json:"updated"`
	Unchanged  int    `json:"unchanged"`
	Deleted    int    `json:"deleted"`
	Errors     int    `json:"errors"`
	FilesTotal int    `json:"files_total"`
	DurationMS int    `json:"duration_ms"`
	Message    string `json:"message"`
}

type AccountDetail struct {
	Account
	Sources []Source `json:"sources"`
}

type SourceDetail struct {
	Source
	LastRun    *SyncRun `json:"last_run"`
	RecentRun  *SyncRun `json:"recent_run"`
	RunHistory []SyncRun `json:"run_history"`
}

type Totals struct {
	Accounts      int `json:"accounts"`
	Sources       int `json:"sources"`
	Enabled       int `json:"enabled"`
	Media         int `json:"media"`
	SyncedMedia   int `json:"synced_media"`
	TotalFilesSynced int `json:"total_files_synced"`
}

type FolderEntry struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	MimeType string `json:"mime_type"`
}