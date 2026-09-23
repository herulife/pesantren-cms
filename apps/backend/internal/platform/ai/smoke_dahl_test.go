package ai

import (
	"os"
	"strings"
	"testing"
)

func TestSmokeDahlArticle(t *testing.T) {
	os.Setenv("DAHL_API_KEY", "dahl_LWJ8L7SpgoHbzHAB4j4DPtoc9s1jbebVn")
	os.Setenv("DAHL_API_URL", "https://inference.dahl.global/v1")
	os.Setenv("AI_MODEL", "deepseek-ai/DeepSeek-V4-Flash-0731")
	txt, err := GenerateArticle("Peringatan Maulid Nabi di Pondok Pesantren")
	if err != nil {
		t.Fatalf("GenerateArticle error: %v", err)
	}
	if txt == "" {
		t.Fatal("article kosong")
	}
	if strings.Contains(txt, "belum dikonfigurasi") {
		t.Fatalf("masih mock fallback (semua model dahl ditolak): %s", txt)
	}
	short := txt
	if len(short) > 300 {
		short = short[:300]
	}
	t.Logf("OK generated (%d bytes):\n%s", len(txt), short)
}