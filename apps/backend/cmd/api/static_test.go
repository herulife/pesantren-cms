package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

// TestSingleFileStaticRefusesDirectoryListing is a regression test for an
// information-disclosure finding: /uploads/ responded with a full listing of
// every uploaded filename (news images, staff uploads) to anonymous visitors.
func TestSingleFileStaticRefusesDirectoryListing(t *testing.T) {
	root := t.TempDir()

	if err := os.WriteFile(filepath.Join(root, "photo.webp"), []byte("image-bytes"), 0o644); err != nil {
		t.Fatalf("seed file: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(root, "nested"), 0o755); err != nil {
		t.Fatalf("seed dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "nested", "inner.jpg"), []byte("inner"), 0o644); err != nil {
		t.Fatalf("seed nested file: %v", err)
	}

	h := singleFileStatic("/uploads/", http.Dir(root))

	cases := []struct {
		name string
		path string
		want int
	}{
		{"directory listing refused", "/uploads/", http.StatusNotFound},
		{"nested directory refused", "/uploads/nested", http.StatusNotFound},
		{"traversal to parent refused", "/uploads/../", http.StatusNotFound},
		{"missing file 404", "/uploads/absent.webp", http.StatusNotFound},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != tc.want {
				t.Fatalf("path %s: got %d want %d (body=%q)", tc.path, rec.Code, tc.want, rec.Body.String())
			}
		})
	}
}

// TestSingleFileStaticStillServesFiles confirms the hardening did not break the
// legitimate case: staff-uploaded news and facility images must remain public.
func TestSingleFileStaticStillServesFiles(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "photo.webp"), []byte("image-bytes"), 0o644); err != nil {
		t.Fatalf("seed file: %v", err)
	}

	h := singleFileStatic("/uploads/", http.Dir(root))

	req := httptest.NewRequest(http.MethodGet, "/uploads/photo.webp", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("got %d want 200", rec.Code)
	}
	if rec.Body.String() != "image-bytes" {
		t.Fatalf("unexpected body %q", rec.Body.String())
	}
}