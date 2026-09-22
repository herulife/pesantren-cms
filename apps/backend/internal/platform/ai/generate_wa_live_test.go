package ai

import "testing"

func TestGenerateWAMessageLive(t *testing.T) {
	msg, err := GenerateWAMessage("Tulis draft pesan WA bahasa Indonesia singkat dari pesantren Al-Maa kepada wali santri bernama Ahmad.\nTujuan: mengingatkan agenda rapat wali minggu depan.\nTutup dengan salam penutup.")
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if msg == "" {
		t.Fatal("empty message")
	}
	t.Logf("DRAFT_OK len=%d :: %s", len(msg), msg)
}