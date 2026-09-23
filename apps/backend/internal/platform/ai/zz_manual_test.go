package ai

import (
	"os"
	"strings"
	"testing"
)

func TestManualArticleFailover(t *testing.T) {
	key := os.Getenv("DAHL_API_KEY")
	if key == "" {
		t.Skip("DAHL_API_KEY kosong")
	}
	txt, err := GenerateArticle("Kegiatan Maulid Nabi di Pondok Pesantren")
	if err != nil {
		t.Fatalf("GenerateArticle error: %v", err)
	}
	t.Logf("LEN=%d\n%s", len(txt), txt[:min(len(txt), 400)])
	if strings.Contains(txt, "belum dikonfigurasi") {
		t.Fatalf("masih mock/fallback: %s", txt[:80])
	}
	if strings.Contains(strings.ToLower(txt), "think") && strings.Contains(txt, "</p>") == false && len(txt) > 6000 {
		t.Fatalf("kemungkinan ada reasoning block menempel")
	}
	if !strings.Contains(txt, "<h2") {
		t.Fatalf("tidak ada tag h2: %s", txt[:120])
	}
}

func min(a, b int) int { if a < b { return a }; return b }
