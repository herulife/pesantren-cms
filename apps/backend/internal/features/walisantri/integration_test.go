package walisantri

import (
	"database/sql"
	"os"
	"testing"

	_ "modernc.org/sqlite"
)

// TestListAllAgainstRealDatabase adalah test integrasi yang HANYA jalan kalau
// WALI_TEST_DB diisi dengan path ke SQLite (mis. salinan WAL-aware produksi).
// Tujuannya: memastikan query ListAll benar-benar nyambung ke skema nyata,
// bukan cuma ke schema buangan di unit test.
//
// Contoh:
//   WALI_TEST_DB=/home/heru/alma-parung/data/scratch.db go test ./internal/features/walisantri/ -run ListAll -v
func TestListAllAgainstRealDatabase(t *testing.T) {
	dbPath := os.Getenv("WALI_TEST_DB")
	if dbPath == "" {
		t.Skip("WALI_TEST_DB tidak diisi - lewati test integrasi")
	}
	if _, err := os.Stat(dbPath); err != nil {
		t.Skipf("WALI_TEST_DB tidak bisa dibaca: %v", err)
	}

	// Mode read-only supaya test ini tidak mungkin mengubah data produksi.
	db, err := sql.Open("sqlite", "file:"+dbPath+"?mode=ro")
	if err != nil {
		t.Fatalf("gagal buka db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)

	repo := NewRepository(db)
	out, err := repo.ListAll()
	if err != nil {
		t.Fatalf("ListAll gagal: %v", err)
	}

	if out.Stats.TotalAccounts != len(out.Accounts) {
		t.Errorf("Stats.TotalAccounts (%d) != len(Accounts) (%d)",
			out.Stats.TotalAccounts, len(out.Accounts))
	}
	if out.Stats.Orphan != len(out.Orphans) {
		t.Errorf("Stats.Orphan (%d) != len(Orphans) (%d)", out.Stats.Orphan, len(out.Orphans))
	}

	totalSantri := 0
	multi := 0
	for _, a := range out.Accounts {
		if len(a.Santri) == 0 {
			t.Errorf("akun %d (%s) tidak punya Santri padahal masuk daftar wali", a.UserID, a.Email)
		}
		totalSantri += len(a.Santri)
		if len(a.Santri) > 1 {
			multi++
		}
	}
	if out.Stats.TotalSantri != totalSantri {
		t.Errorf("Stats.TotalSantri (%d) != jumlah anak (%d)", out.Stats.TotalSantri, totalSantri)
	}
	if out.Stats.MultiSantri != multi {
		t.Errorf("Stats.MultiSantri (%d) != jumlah akun >1 anak (%d)", out.Stats.MultiSantri, multi)
	}

	t.Logf("akun wali      : %d", out.Stats.TotalAccounts)
	t.Logf("santri tertaut : %d", out.Stats.TotalSantri)
	t.Logf("keluarga       : %d", out.Stats.MultiSantri)
	t.Logf("perlu dilengkapi: %d", out.Stats.Placeholder)
	t.Logf("akun yatim     : %d", out.Stats.Orphan)
}