package gstorage

import "testing"

func TestNormalizeSlug(t *testing.T) {
	cases := map[string]string{
		"Album Wisuda 2026":       "album-wisuda-2026",
		"  Santri Baru (PSB)  #1 ": "santri-baru-psb-1",
		"__HAHA__":                "haha",
		"123":                     "123",
		"":                        "",
		"----":                    "",
		"Kegiatan: 17 Agustusan!": "kegiatan-17-agustusan",
	}
	for in, want := range cases {
		if got := normalizeSlug(in); got != want {
			t.Errorf("normalizeSlug(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestExtByMime(t *testing.T) {
	if got := extByMime("image/jpeg"); got != ".jpg" {
		t.Errorf("jpeg => %q", got)
	}
	if got := extByMime("image/png"); got != ".png" {
		t.Errorf("png => %q", got)
	}
	if got := extByMime("application/pdf"); got != "" {
		t.Errorf("pdf should be unsupported, got %q", got)
	}
}

func TestEncryptDecrypt(t *testing.T) {
	cfg := &Config{EncryptionKey: []byte("0123456789abcdef0123456789abcdef")}
	blob, err := cfg.EncryptCredentials("super-secret-refresh-token")
	if err != nil {
		t.Fatal(err)
	}
	got, err := cfg.DecryptCredentials(blob)
	if err != nil {
		t.Fatal(err)
	}
	if got != "super-secret-refresh-token" {
		t.Errorf("roundtrip mismatch: %q", got)
	}

	// wrong key must fail cleanly
	other := &Config{EncryptionKey: []byte("ffffffffffffffffffffffffffffffff")}
	if _, err := other.DecryptCredentials(blob); err == nil {
		t.Error("expected decryption failure with wrong key")
	}
}

func TestSlugFallbackEmpty(t *testing.T) {
	if got := normalizeSlug("───"); got != "" {
		t.Errorf("expected empty fallback, got %q", got)
	}
}