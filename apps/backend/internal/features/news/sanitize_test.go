package news

import (
	"strings"
	"testing"
)

func TestSanitizeNewsHTML_RemovesDangerousMarkup(t *testing.T) {
	raw := `<p onclick="alert(1)">Halo</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">klik</a><a href="https://darussunnahparung.com/info" target="_blank">aman</a>`

	got := sanitizeNewsHTML(raw)

	for _, fragment := range []string{"script", "iframe", "onclick", "javascript:"} {
		if strings.Contains(got, fragment) {
			t.Fatalf("sanitized html still contains %q: %s", fragment, got)
		}
	}

	if !strings.Contains(got, "<p>Halo</p>") {
		t.Fatalf("expected paragraph to remain, got %s", got)
	}

	if !strings.Contains(got, `<a>klik</a>`) {
		t.Fatalf("expected unsafe anchor href to be stripped, got %s", got)
	}

	if !strings.Contains(got, `href="https://darussunnahparung.com/info"`) {
		t.Fatalf("expected safe anchor href to remain, got %s", got)
	}
}

func TestSanitizeNewsModel_AppliesToContentAndExcerpt(t *testing.T) {
	n := &News{
		Content: `<h2>Judul</h2><div><p>Isi</p></div><style>body{display:none}</style>`,
		Excerpt: `<p onload="x()">Ringkas</p>`,
	}

	sanitizeNewsModel(n)

	if strings.Contains(n.Content, "style") || strings.Contains(n.Excerpt, "onload") {
		t.Fatalf("expected dangerous markup removed, got content=%q excerpt=%q", n.Content, n.Excerpt)
	}

	if !strings.Contains(n.Content, "<h2>Judul</h2>") || !strings.Contains(n.Content, "<p>Isi</p>") {
		t.Fatalf("expected safe markup to remain, got %q", n.Content)
	}
}
