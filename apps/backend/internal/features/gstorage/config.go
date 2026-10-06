package gstorage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"

	"darussunnah-api/internal/platform/logger"
)

const (
	driveScope = "https://www.googleapis.com/auth/drive.readonly"
	// defaultRedirect is used when GOOGLE_REDIRECT_URI is not provided. It must
	// match the registered URI in the Google OAuth console for the project.
	defaultRedirect = "https://darussunnahparung.com/api/auth/storage/google/callback"
)

// Config holds the OAuth + encryption settings loaded from environment.
type Config struct {
	ClientID           string
	ClientSecret       string
	RedirectURL        string
	AppURL             string
	EncryptionKey      []byte
	EncryptionKeyMissing bool
	OAuthConfigOmitted bool
}

// LoadConfig reads storage-related environment variables. OAuth for Drive can
// be toggled off by leaving GOOGLE_CLIENT_SECRET empty: the API then reports
// "not configured" instead of crashing.
func LoadConfig() *Config {
	cfg := &Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URI"),
		AppURL:       os.Getenv("APP_URL"),
	}
	if cfg.RedirectURL == "" {
		cfg.RedirectURL = defaultRedirect
	}
	if cfg.AppURL == "" {
		cfg.AppURL = "https://darussunnahparung.com"
	}

	// EncryptionKey material for the Google Drive OAuth refresh token.
	//
	// STORAGE_ENCRYPTION_KEY is required. It previously fell back to JWT_SECRET,
	// which meant rotating the signing key (to recover from a token forgery)
	// silently made every stored Drive refresh token undecryptable, and it
	// coupled two secrets that should never share a failure domain.
	secret := os.Getenv("STORAGE_ENCRYPTION_KEY")
	if secret == "" {
		logger.Error(context.Background(), "STORAGE_ENCRYPTION_KEY is not set; Drive integration is disabled", nil)
		// Derive a key that no real token can match, so encrypted values fail to
		// decrypt instead of becoming decryptable with an unintended key.
		cfg.EncryptionKey = nil
		cfg.EncryptionKeyMissing = true
	} else {
		hash := sha256.Sum256([]byte(secret))
		cfg.EncryptionKey = hash[:]
	}

	cfg.OAuthConfigOmitted = cfg.ClientID == "" || cfg.ClientSecret == ""
	return cfg
}

// Configured reports whether a full OAuth app (client id + secret) is present.
func (c *Config) Configured() bool {
	return !c.OAuthConfigOmitted
}

// ConfiguredUnless returns an error describing why OAuth is unavailable.
func (c *Config) ConfiguredUnless() error {
	if c.Configured() {
		return nil
	}
	return errors.New("Google OAuth belum dikonfigurasi pada backend (GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET diperlukan)")
}

func (c *Config) ConfiguredIDMasked() string {
	if !c.Configured() || len(c.ClientID) < 8 {
		if len(c.ClientID) == 0 {
			return ""
		}
		return c.ClientID
	}
	return c.ClientID[:4] + "…" + c.ClientID[len(c.ClientID)-4:]
}

func encodeHex(d []byte) string {
	return hex.EncodeToString(d)
}

func decodeHex(s string) ([]byte, error) {
	return hex.DecodeString(s)
}