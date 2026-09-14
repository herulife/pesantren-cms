// Package finance — mesin transaksi keuangan atomik & idempoten (PHASE 6).
//
// Prinsip: VALIDATE -> AUTHORIZE (di handler) -> BEGIN IMMEDIATE -> LOCK via
// conditional UPDATE -> MUTATE -> VERIFY ROWS AFFECTED -> WRITE AUDIT (PHASE 7)
// -> COMMIT. Notifikasi eksternal TIDAK PERNAH di dalam transaksi.
package finance

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrAlreadyPaid      = errors.New("tagihan sudah lunas")
	ErrOverpay          = errors.New("jumlah bayar melebihi sisa tagihan")
	ErrConflict         = errors.New("status tagihan berubah, muat ulang dan coba lagi")
	ErrNotFound         = errors.New("tagihan tidak ditemukan")
	ErrIdempotentReplay = errors.New("permintaan sudah diproses sebelumnya")
)

// BeginTx membuka transaksi. Catatan: database.Connect memakai DSN
// _txlock=immediate sehingga BEGIN di sini selalu IMMEDIATE (RESERVED lock
// sejak awal, bukan saat tulis pertama) — wajib untuk pay-vs-pay,
// pay-vs-cancel, verify-vs-pay.
func BeginTx(db *sql.DB) (*sql.Tx, error) {
	return db.Begin()
}

// EnsureReceiptSequence memastikan tabel sequence kwitansi ada (aman di DB test).
func EnsureReceiptSequence(db *sql.DB) error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS receipt_sequences (
		year TEXT PRIMARY KEY,
		last_seq INTEGER NOT NULL DEFAULT 0
	)`)
	return err
}

// NextReceiptNo menghasilkan nomor kwitansi sequence-safe di dalam transaksi:
// INSERT OR IGNORE + UPDATE atomik + SELECT. Aman concurrent, multi-proses,
// retry (UNIQUE idx_receipts_no_unique sebagai backstop).
func NextReceiptNo(tx *sql.Tx, year string) (string, error) {
	if _, err := tx.Exec(`CREATE TABLE IF NOT EXISTS receipt_sequences (
		year TEXT PRIMARY KEY,
		last_seq INTEGER NOT NULL DEFAULT 0
	)`); err != nil {
		return "", err
	}
	if _, err := tx.Exec(`INSERT OR IGNORE INTO receipt_sequences (year, last_seq) VALUES (?, 0)`, year); err != nil {
		return "", err
	}
	res, err := tx.Exec(`UPDATE receipt_sequences SET last_seq = last_seq + 1 WHERE year = ?`, year)
	if err != nil {
		return "", err
	}
	if n, _ := res.RowsAffected(); n != 1 {
		return "", fmt.Errorf("receipt sequence update failed")
	}
	var seq int
	if err := tx.QueryRow(`SELECT last_seq FROM receipt_sequences WHERE year = ?`, year).Scan(&seq); err != nil {
		return "", err
	}
	return fmt.Sprintf("KWI-%s/%06d", year, seq), nil
}

// isBusyErr true untuk SQLITE_BUSY/locked (transien, aman di-retry karena
// tidak ada commit yang terjadi sebelum error ini).
func isBusyErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "sqlite_busy") ||
		strings.Contains(msg, "database is locked") ||
		strings.Contains(msg, "database table is locked") ||
		strings.Contains(msg, "database is busy")
}

// RetryOnBusy menjalankan op hingga attempts kali bila gagal karena lock
// SQLite transien. Aman karena operasi finansial di sini conditional
// (re-eksekusi melihat state terbaru, bukan menulis ulang).
func RetryOnBusy(op func() error, attempts int) error {
	if attempts < 1 {
		attempts = 1
	}
	var err error
	for i := 0; i < attempts; i++ {
		err = op()
		if !isBusyErr(err) {
			return err
		}
		time.Sleep(time.Duration(i*5+5) * time.Millisecond)
	}
	return err
}

// true = request ini sudah diproses (replay aman, JANGAN tulis ulang).
func FindLedgerByKey(tx *sql.Tx, key string) (bool, error) {
	if key == "" {
		return false, nil
	}
	var one int
	err := tx.QueryRow(`SELECT 1 FROM payment_transactions WHERE idempotency_key = ? LIMIT 1`, key).Scan(&one)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
