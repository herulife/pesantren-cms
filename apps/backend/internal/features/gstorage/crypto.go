package gstorage

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
)

// EncryptCredentials encrypts a plaintext secret (refresh token) with the
// configured AES-256-GCM key. Never leave tokens in plaintext at rest.
func (c *Config) EncryptCredentials(plaintext string) ([]byte, error) {
	block, err := aes.NewCipher(c.EncryptionKey)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, []byte(plaintext), nil), nil
}

// DecryptCredentials returns the plaintext secret from an encrypted blob.
func (c *Config) DecryptCredentials(blob []byte) (string, error) {
	if len(blob) == 0 {
		return "", errors.New("encrypted credential is empty")
	}
	block, err := aes.NewCipher(c.EncryptionKey)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(blob) < gcm.NonceSize() {
		return "", errors.New("encrypted credential is malformed")
	}
	nonce, ciphertext := blob[:gcm.NonceSize()], blob[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", errors.New("unable to decrypt credential (encryption key changed?)")
	}
	return string(plaintext), nil
}