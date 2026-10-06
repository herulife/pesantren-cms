package gstorage

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

// googleOAuthState is stored server-side (memory) for the OAuth dance. It binds
// the callback to the authenticated admin session to prevent login CSRF and
// keeps the browser-cookie dependency out of the token exchange.
type googleOAuthState struct {
	AdminID   int
	ExpiresAt time.Time
}

// Service drives the whole storage feature: OAuth state tracking, Drive client
// construction and background sync jobs.
type Service struct {
	cfg    *Config
	repo   *Repository
	statesMu sync.Mutex
	states   map[string]googleOAuthState
	jobsMu   sync.Mutex
	jobs     map[int64]*SyncJob
}

func NewService(cfg *Config, repo *Repository) *Service {
	return &Service{
		cfg:    cfg,
		repo:   repo,
		states: make(map[string]googleOAuthState),
		jobs:   make(map[int64]*SyncJob),
	}
}

func (s *Service) oauthConfig() (*oauth2.Config, error) {
	if !s.cfg.Configured() {
		return nil, errors.New("storage oauth belum dikonfigurasi (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)")
	}
	return &oauth2.Config{
		ClientID:     s.cfg.ClientID,
		ClientSecret: s.cfg.ClientSecret,
		RedirectURL:  s.cfg.RedirectURL,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
		Scopes: []string{
			driveScope,
			"https://www.googleapis.com/auth/userinfo.email",
		},
	}, nil
}

// BeginOAuth returns the consent URL for a given admin.
func (s *Service) BeginOAuth(adminID int) (string, error) {
	conf, err := s.oauthConfig()
	if err != nil {
		return "", err
	}
	state := newStateToken()
	s.statesMu.Lock()
	s.states[state] = googleOAuthState{AdminID: adminID, ExpiresAt: time.Now().Add(10 * time.Minute)}
	s.statesMu.Unlock()

	url := conf.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return url, nil
}

func (s *Service) validateState(state string) (int, bool) {
	s.statesMu.Lock()
	defer s.statesMu.Unlock()
	st, ok := s.states[state]
	if !ok || time.Now().After(st.ExpiresAt) {
		delete(s.states, state)
		return 0, false
	}
	delete(s.states, state) // single-use
	return st.AdminID, true
}

func newStateToken() string {
	return fmt.Sprintf("ds_%d_%d", time.Now().UnixNano(), randomInt())
}

func randomInt() int64 {
	return time.Now().UnixNano() % 1_000_000_000
}

// ExchangeCode trades the Google authorization code for a stored account.
// Returns the new account id (reuses an existing account by email).
func (s *Service) ExchangeCode(ctx context.Context, code string) (int64, *Account, error) {
	conf, err := s.oauthConfig()
	if err != nil {
		return 0, nil, err
	}
	tok, err := conf.Exchange(ctx, code, oauth2.AccessTypeOffline)
	if err != nil {
		return 0, nil, fmt.Errorf("exchange token: %w", err)
	}

	svc, err := s.driveServiceFromToken(ctx, tok)
	if err != nil {
		return 0, nil, fmt.Errorf("buat client drive: %w", err)
	}
	about, err := svc.About.Get().Fields("user(emailAddress,displayName,photoLink)").Do()
	if err != nil {
		return 0, nil, fmt.Errorf("ambil info akun google: %w", err)
	}
	email := ""
	name := ""
	avatar := ""
	if about.User != nil {
		email = about.User.EmailAddress
		name = about.User.DisplayName
		avatar = about.User.PhotoLink
	}
	if email == "" {
		return 0, nil, errors.New("gagal mendapatkan email akun Google")
	}

	enc, err := s.cfg.EncryptCredentials(tok.RefreshToken)
	if err != nil {
		return 0, nil, fmt.Errorf("enkripsi token: %w", err)
	}

	var account *Account
	if existing, err := s.repo.GetAccountByEmail(email); err == nil {
		account = existing
		account.Name = name
		account.AvatarURL = avatar
		account.Status = "active"
		account.ErrorMessage = ""
		account.EncryptedRefreshTkn = enc
		if tok.RefreshToken != "" {
			if err := s.repo.UpdateAccountToken(account.ID, enc, name, avatar); err != nil {
				return 0, nil, fmt.Errorf("simpan token akun: %w", err)
			}
		} else {
			_ = s.repo.UpdateAccount(account.ID, name, "active", "", false)
		}
		return account.ID, account, nil
	}

	account = &Account{
		Provider:            "google",
		Name:                name,
		AccountEmail:        email,
		AvatarURL:           avatar,
		EncryptedRefreshTkn: enc,
		Status:              "active",
	}
	id, err := s.repo.CreateAccount(account)
	if err != nil {
		return 0, nil, fmt.Errorf("simpan akun storage: %w", err)
	}
	account.ID = id
	return id, account, nil
}

// driveServiceFromToken builds a Drive client from an oauth2.Token.
func (s *Service) driveServiceFromToken(ctx context.Context, tok *oauth2.Token) (*drive.Service, error) {
	conf, err := s.oauthConfig()
	if err != nil {
		return nil, err
	}
	src := conf.TokenSource(ctx, tok)
	return drive.NewService(ctx, option.WithTokenSource(src), option.WithHTTPClient(&http.Client{Timeout: 90 * time.Second}))
}

// DriveServiceForAccount decrypts the stored refresh token and returns a live
// (auto-refreshing) Drive client for the account.
func (s *Service) DriveServiceForAccount(ctx context.Context, acc *Account) (*drive.Service, error) {
	rt, err := s.cfg.DecryptCredentials(acc.EncryptedRefreshTkn)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka kredensial: %w", err)
	}
	if rt == "" {
		return nil, errors.New("akun belum memiliki refresh token yang valid")
	}
	conf, err := s.oauthConfig()
	if err != nil {
		return nil, err
	}
	src := conf.TokenSource(ctx, &oauth2.Token{RefreshToken: rt})
	return drive.NewService(ctx, option.WithTokenSource(src), option.WithHTTPClient(&http.Client{Timeout: 120 * time.Second}))
}

// TestConnection checks token validity, the account email and folder access.
func (s *Service) TestConnection(ctx context.Context, acc *Account, folderID string) error {
	svc, err := s.DriveServiceForAccount(ctx, acc)
	if err != nil {
		return err
	}
	about, err := svc.About.Get().Fields("user(emailAddress)").Do()
	if err != nil {
		return fmt.Errorf("koneksi Google gagal: %w", err)
	}
	if about.User != nil && about.User.EmailAddress != "" && about.User.EmailAddress != acc.AccountEmail {
		acc.AccountEmail = about.User.EmailAddress
	}
	if folderID == "" {
		return nil
	}
	folder, err := svc.Files.Get(folderID).Fields("id,name,mimeType").Do()
	if err != nil {
		return fmt.Errorf("folder tidak dapat diakses: %w", err)
	}
	if folder.MimeType != "application/vnd.google-apps.folder" {
		return fmt.Errorf("ID bukan folder (mimeType: %s)", folder.MimeType)
	}
	return nil
}

// ListFolders returns immediate child folders of a Drive folder.
func (s *Service) ListFolders(ctx context.Context, acc *Account, parentID string) ([]FolderEntry, error) {
	svc, err := s.DriveServiceForAccount(ctx, acc)
	if err != nil {
		return nil, err
	}
	q := "trashed = false and mimeType = 'application/vnd.google-apps.folder'"
	if parentID != "" {
		q += fmt.Sprintf(" and %q in parents", parentID)
	}
	res, err := svc.Files.List().
		Q(q).
		PageSize(200).
		OrderBy("folder asc, name_natural").
		Fields("nextPageToken, files(id,name,mimeType)").Do()
	if err != nil {
		return nil, fmt.Errorf("list folder Google Drive gagal: %w", err)
	}
	var list []FolderEntry
	for _, f := range res.Files {
		list = append(list, FolderEntry{ID: f.Id, Name: f.Name, MimeType: f.MimeType})
	}
	return list, nil
}

// GetFolderName resolves a folder's display name.
func (s *Service) GetFolderName(ctx context.Context, acc *Account, folderID string) (string, error) {
	svc, err := s.DriveServiceForAccount(ctx, acc)
	if err != nil {
		return "", err
	}
	f, err := svc.Files.Get(folderID).Fields("name").Do()
	if err != nil {
		return "", fmt.Errorf("folder tidak dapat diakses: %w", err)
	}
	return f.Name, nil
}

// GetDriveService exposes the Drive client for the sync engine.
func (s *Service) GetDriveService(ctx context.Context, acc *Account) (*drive.Service, error) {
	return s.DriveServiceForAccount(ctx, acc)
}