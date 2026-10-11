// Package audit — audit log forensik konsisten (PHASE 7).
//
// Skema: audit_logs(id, request_id, actor_id, actor_role, action,
// entity_type, entity_id, before_json, after_json, ip_address, user_agent,
// result, created_at). TIDAK PERNAH dihapus (retensi, termasuk saat user
// dihapus — lihat auth.DeleteUser yang me-NULL-kan, bukan menghapus).
package audit

import (
	"darussunnah-api/internal/platform/logger"
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
)

// Entry adalah satu baris audit.
type Entry struct {
	RequestID string
	ActorID   int
	ActorRole string
	Action    string
	Entity    string
	EntityID  string
	Before    interface{}
	After     interface{}
	IP        string
	UserAgent string
	Result    string
}

func toJSON(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	b, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	return string(b)
}

// auditDB diisi via Configure (dipanggil main setelah database.Connect).
var auditDB *sql.DB

// Configure mengaktifkan audit standalone di handler.
func Configure(db *sql.DB) { auditDB = db }

// RecordMoneyTx menulis audit mutasi uang DALAM transaksi (sebelum commit).
func RecordMoneyTx(tx *sql.Tx, actor int, action, entity string, id, beforePaid, afterPaid int, beforeStatus, afterStatus string) error {
	return RecordTx(context.Background(), tx, Entry{
		ActorID:  actor,
		Action:   action,
		Entity:   entity,
		EntityID: strconv.Itoa(id),
		Before:   map[string]interface{}{"paid_amount": beforePaid, "status": beforeStatus},
		After:    map[string]interface{}{"paid_amount": afterPaid, "status": afterStatus},
	})
}

// RecordTx menulis audit DALAM transaksi bisnis (gagal -> rollback pemanggil).
func RecordTx(ctx context.Context, tx *sql.Tx, e Entry) error {
	if e.Result == "" {
		e.Result = "ok"
	}
	_, err := tx.Exec(
		`INSERT INTO audit_logs (request_id, actor_id, actor_role, action, entity_type, entity_id, before_json, after_json, ip_address, user_agent, result)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		e.RequestID, sql.NullInt64{Int64: int64(e.ActorID), Valid: e.ActorID > 0},
		e.ActorRole, e.Action, e.Entity, e.EntityID,
		toJSON(e.Before), toJSON(e.After), e.IP, e.UserAgent, e.Result,
	)
	return err
}

// Record menulis audit standalone (best-effort: gagal hanya di-log, bukan
// menggagalkan operasi non-transaksional pemanggil).
func Record(ctx context.Context, e Entry) {
	if auditDB == nil {
		return
	}
	if e.Result == "" {
		e.Result = "ok"
	}
	_, err := auditDB.Exec(
		`INSERT INTO audit_logs (request_id, actor_id, actor_role, action, entity_type, entity_id, before_json, after_json, ip_address, user_agent, result)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		e.RequestID, sql.NullInt64{Int64: int64(e.ActorID), Valid: e.ActorID > 0},
		e.ActorRole, e.Action, e.Entity, e.EntityID,
		toJSON(e.Before), toJSON(e.After), e.IP, e.UserAgent, e.Result,
	)
	if err != nil {
		logger.Warn(ctx, "audit record failed", logger.Field{"action": e.Action, "error": err.Error()})
	}
}
