package audit

// PHASE 7: audit record + money-tx roundtrip.

import (
	"context"
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newAuditTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	db.SetMaxOpenConns(1)
	_, err = db.Exec(`CREATE TABLE audit_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT, actor_id INTEGER,
		actor_role TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id TEXT,
		before_json TEXT, after_json TEXT, ip_address TEXT, user_agent TEXT,
		result TEXT DEFAULT 'ok', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`)
	if err != nil {
		t.Fatalf("schema: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

func TestRecordAndMoneyTx(t *testing.T) {
	db := newAuditTestDB(t)
	Configure(db)

	Record(context.Background(), Entry{
		RequestID: "req-1", ActorID: 7, ActorRole: "bendahara",
		Action: "PAY_SPP", Entity: "spp_bill", EntityID: "42",
		After: map[string]interface{}{"paid_amount": 100000},
		IP:    "127.0.0.1", UserAgent: "test",
	})

	tx, err := db.Begin()
	if err != nil {
		t.Fatal(err)
	}
	if err := RecordMoneyTx(tx, 7, "CANCEL_SPP", "spp_bill", 42, 100000, 0, "paid", "unpaid"); err != nil {
		t.Fatal(err)
	}
	if err := tx.Commit(); err != nil {
		t.Fatal(err)
	}

	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM audit_logs`).Scan(&n); err != nil || n != 2 {
		t.Fatalf("expected 2 audit rows, got %d (err=%v)", n, err)
	}
	var action, after string
	if err := db.QueryRow(`SELECT action, after_json FROM audit_logs WHERE action='CANCEL_SPP'`).Scan(&action, &after); err != nil {
		t.Fatal(err)
	}
	if action != "CANCEL_SPP" || after == "" {
		t.Fatalf("unexpected audit content: %s %s", action, after)
	}
	// user dihapus -> audit tetap ada (retensi).
	var uid sql.NullInt64
	if err := db.QueryRow(`SELECT actor_id FROM audit_logs WHERE action='PAY_SPP'`).Scan(&uid); err != nil || !uid.Valid || uid.Int64 != 7 {
		t.Fatalf("actor not retained: %v %v", uid, err)
	}
}
