// Package invoices menyediakan scaffold tagihan provider-agnostik
// (PRD 10-27,52 / TAGIHAN_OPMODE): tabel invoices + webhook idempoten
// dengan verifikasi signature HMAC-SHA256. Nomor invoice memakai skema
// KWI-yyyy/seq yang sama dengan kwitansi (receipt_sequences).
package invoices

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"almaparung-api/internal/platform/finance"
)

var (
	ErrInvalidTransition = errors.New("transisi status invoice tidak diizinkan")
	ErrConflictTx        = errors.New("gateway_tx_id sudah tercatat (idempotency)")
)

// Invoice adalah tagihan yang diterbitkan panitia untuk satu registrasi.
type Invoice struct {
	ID                int    `json:"id"`
	RegistrationID    int    `json:"registration_id"`
	Code              string `json:"code"`
	Amount            int    `json:"amount"`
	Method            string `json:"method"`
	Status            string `json:"status"`
	GatewayTxID       string `json:"gateway_tx_id"`
	WebhookReceivedAt string `json:"webhook_received_at"`
	CreatedAt         string `json:"created_at"`
}

// Repository akses tabel invoices (dibuat otomatis di database.createTables).
type Repository struct {
	db *sql.DB
}

// NewRepository membuat repository invoice.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// invoiceTransitions: paid terminal; gagal/kedaluwarsa boleh diaktifkan lagi.
var invoiceTransitions = map[string][]string{
	"":        {"pending"},
	"pending": {"pending", "paid", "failed", "expired"},
	"failed":  {"pending", "paid"},
	"expired": {"pending"},
	"paid":    {"paid"},
}

func transitionAllowed(cur, next string) bool {
	for _, n := range invoiceTransitions[cur] {
		if n == next {
			return true
		}
	}
	return false
}

func scanInvoice(row *sql.Row) (*Invoice, error) {
	var inv Invoice
	err := row.Scan(&inv.ID, &inv.RegistrationID, &inv.Code, &inv.Amount,
		&inv.Method, &inv.Status, &inv.GatewayTxID, &inv.WebhookReceivedAt, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

const invoiceColumns = `id, registration_id, code, amount, method, status,
	COALESCE(gateway_tx_id, ''), COALESCE(webhook_received_at, ''), COALESCE(created_at, '')`

func (r *Repository) findByID(ctx context.Context, id int64) (*Invoice, error) {
	return scanInvoice(r.db.QueryRowContext(ctx,
		`SELECT `+invoiceColumns+` FROM invoices WHERE id = ?`, id))
}

// Create menerbitkan invoice pending dengan nomor KWI-yyyy/seq.
func (r *Repository) Create(ctx context.Context, registrationID, amount int, method string) (*Invoice, error) {
	method = strings.TrimSpace(method)
	if method == "" {
		method = "transfer"
	}
	tx, err := finance.BeginTx(r.db)
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	code, err := finance.NextReceiptNo(tx, time.Now().Format("2006"))
	if err != nil {
		return nil, err
	}
	res, err := tx.ExecContext(ctx, `
		INSERT INTO invoices (registration_id, code, amount, method, status)
		VALUES (?, ?, ?, ?, 'pending')
	`, registrationID, code, amount, method)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true
	return r.findByID(ctx, id)
}

// WebhookResult hasil penerapan event gateway.
type WebhookResult struct {
	Invoice *Invoice `json:"invoice"`
	Replay  bool     `json:"replay"`
}

// ApplyWebhook menerapkan event gateway secara idempoten dalam satu transaksi:
//   - replay (gateway_tx_id sama) -> sukses tanpa efek ganda,
//   - gateway_tx_id milik invoice lain / transisi ilegal -> error,
//   - paid -> payment_status registrasi terkait ikut lunas (conditional,
//     tidak menimpa yang sudah paid). Ledger kwitansi tetap ditulis oleh
//     alur verifikasi panitia (psb.recordPsbLedgerTx), bukan di sini.
func (r *Repository) ApplyWebhook(ctx context.Context, code, gatewayTxID, status string, amount int) (*WebhookResult, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	tx, err := finance.BeginTx(r.db)
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	var id int64
	var regID, amt int
	var invCode, curStatus, curTx string
	err = tx.QueryRowContext(ctx, `
		SELECT id, registration_id, code, amount, status, COALESCE(gateway_tx_id, '')
		FROM invoices WHERE code = ?
	`, strings.TrimSpace(code)).Scan(&id, &regID, &invCode, &amt, &curStatus, &curTx)
	if err != nil {
		return nil, err
	}
	if curTx != "" && curTx == gatewayTxID {
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		committed = true
		inv, err := r.findByID(ctx, id)
		if err != nil {
			return nil, err
		}
		return &WebhookResult{Invoice: inv, Replay: true}, nil
	}
	if curTx != "" {
		return nil, ErrConflictTx
	}
	if !transitionAllowed(curStatus, status) {
		return nil, ErrInvalidTransition
	}

	res, err := tx.ExecContext(ctx, `
		UPDATE invoices
		SET status = ?, gateway_tx_id = ?, webhook_received_at = CURRENT_TIMESTAMP,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND status = ?
	`, status, gatewayTxID, id, curStatus)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrConflictTx
	}

	if status == "paid" && regID > 0 {
		if _, err := tx.ExecContext(ctx, `
			UPDATE registrations
			SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND COALESCE(payment_status, '') <> 'paid'
		`, regID); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true
	inv, err := r.findByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return &WebhookResult{Invoice: inv, Replay: false}, nil
}
