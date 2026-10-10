package wallet

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Wallet struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Balance   float64   `json:"balance"`
	HasPIN    bool      `json:"has_pin"`
	IsActive  bool      `json:"is_active"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Transaction struct {
	ID          int       `json:"id"`
	WalletID    int       `json:"wallet_id"`
	Type        string    `json:"type"` // deposit, withdrawal, purchase, transfer
	Amount      float64   `json:"amount"`
	ReferenceID string    `json:"reference_id"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetOrCreateByUserID(userID int) (*Wallet, error) {
	var w Wallet
	var pinHash sql.NullString
	query := `SELECT id, user_id, balance, pin_hash, is_active, updated_at FROM user_wallets WHERE user_id = ?`
	err := r.db.QueryRow(query, userID).Scan(&w.ID, &w.UserID, &w.Balance, &pinHash, &w.IsActive, &w.UpdatedAt)

	if err == sql.ErrNoRows {
		// Create new wallet
		res, err := r.db.Exec("INSERT INTO user_wallets (user_id) VALUES (?)", userID)
		if err != nil {
			return nil, err
		}
		id, _ := res.LastInsertId()
		return &Wallet{ID: int(id), UserID: userID, Balance: 0, HasPIN: false, IsActive: true}, nil
	}

	if err != nil {
		return nil, err
	}

	w.HasPIN = pinHash.Valid && pinHash.String != ""
	return &w, nil
}

var ErrPINMismatch = errors.New("PIN lama tidak cocok")

// ErrInsufficientBalance dipakai saat penarikan/refund melebihi saldo.
var ErrInsufficientBalance = errors.New("saldo tidak mencukupi")

func (r *Repository) SetPIN(userID int, pin string) error {
	if _, err := r.GetOrCreateByUserID(userID); err != nil {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	result, err := r.db.Exec("UPDATE user_wallets SET pin_hash = ?, updated_at = ? WHERE user_id = ?", string(hash), time.Now(), userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("wallet not found")
	}
	return nil
}

// SetPINWithCheck mewajibkan PIN lama bila dompet sudah punya PIN.
func (r *Repository) SetPINWithCheck(userID int, oldPIN, newPIN string) error {
	var hash sql.NullString
	if err := r.db.QueryRow("SELECT pin_hash FROM user_wallets WHERE user_id = ?", userID).Scan(&hash); err != nil && err != sql.ErrNoRows {
		return err
	}
	if hash.Valid && hash.String != "" {
		ok, err := r.VerifyPIN(userID, oldPIN)
		if err != nil || !ok {
			return ErrPINMismatch
		}
	}
	return r.SetPIN(userID, newPIN)
}

func (r *Repository) VerifyPIN(userID int, pin string) (bool, error) {
	var pinHash string
	err := r.db.QueryRow("SELECT pin_hash FROM user_wallets WHERE user_id = ?", userID).Scan(&pinHash)
	if err != nil {
		return false, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(pinHash), []byte(pin))
	return err == nil, nil
}

func (r *Repository) ProcessTransaction(userID int, tr *Transaction) (int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Get Wallet
	var wID int
	var balance float64
	err = tx.QueryRow("SELECT id, balance FROM user_wallets WHERE user_id = ?", userID).Scan(&wID, &balance)
	if errors.Is(err, sql.ErrNoRows) {
		result, createErr := tx.Exec("INSERT INTO user_wallets (user_id) VALUES (?)", userID)
		if createErr != nil {
			return 0, createErr
		}

		insertID, idErr := result.LastInsertId()
		if idErr != nil {
			return 0, idErr
		}
		wID = int(insertID)
		balance = 0
		err = nil
	}
	if err != nil {
		return 0, err
	}

	// 2. Adjust Balance
	newBalance := balance
	if tr.Type == "deposit" {
		newBalance += tr.Amount
	} else {
		if balance < tr.Amount {
			return 0, ErrInsufficientBalance
		}
		newBalance -= tr.Amount
	}

	// 3. Update Wallet
	_, err = tx.Exec("UPDATE user_wallets SET balance = ?, updated_at = ? WHERE id = ?", newBalance, time.Now(), wID)
	if err != nil {
		return 0, err
	}

	// 4. Log Transaction
	res, err := tx.Exec(`INSERT INTO wallet_transactions (wallet_id, type, amount, reference_id, description) 
	                  VALUES (?, ?, ?, ?, ?)`, wID, tr.Type, tr.Amount, tr.ReferenceID, tr.Description)
	if err != nil {
		return 0, err
	}
	txID, _ := res.LastInsertId()

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return int(txID), nil
}

func (r *Repository) GetHistory(userID int, limit int) ([]Transaction, error) {
	query := `
		SELECT t.id, t.wallet_id, t.type, t.amount, COALESCE(t.reference_id, ''), COALESCE(t.description, ''), t.created_at
		FROM wallet_transactions t
		JOIN user_wallets w ON t.wallet_id = w.id
		WHERE w.user_id = ?
		ORDER BY t.created_at DESC
		LIMIT ?
	`
	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.WalletID, &t.Type, &t.Amount, &t.ReferenceID, &t.Description, &t.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, t)
	}
	return history, nil
}

// AdminWalletRow adalah satu baris daftar dompet untuk panel admin/bendahara.
type AdminWalletRow struct {
	UserID     int     `json:"user_id"`
	Name       string  `json:"name"`
	Email      string  `json:"email"`
	NIS        string  `json:"nis"`
	SantriName string  `json:"santri_name"`
	Balance    float64 `json:"balance"`
	HasPIN     bool    `json:"has_pin"`
	IsActive   bool    `json:"is_active"`
	UpdatedAt  string  `json:"updated_at"`
}

// AdminList menampilkan seluruh pemilik dompet (role='user') beserta saldo,
// status PIN, dan status aktif. Dompet yang belum ada dianggap saldo 0 & aktif.
func (r *Repository) AdminList(search string, limit, offset int) ([]AdminWalletRow, int, error) {
	where := "u.role = 'user'"
	args := []interface{}{}
	if strings.TrimSpace(search) != "" {
		like := "%" + strings.TrimSpace(search) + "%"
		where += ` AND (u.name LIKE ? OR u.email LIKE ? OR COALESCE(s.nis,'') LIKE ?)`
		args = append(args, like, like, like)
	}

	var total int
	countQ := `SELECT COUNT(*) FROM users u LEFT JOIN santri s ON s.user_id = u.id WHERE ` + where
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := `SELECT u.id, COALESCE(u.name,''), COALESCE(u.email,''), COALESCE(s.nis,''), COALESCE(s.name,''),
	        COALESCE(w.balance,0),
	        CASE WHEN w.pin_hash IS NOT NULL AND w.pin_hash <> '' THEN 1 ELSE 0 END,
	        COALESCE(w.is_active,1),
	        COALESCE(w.updated_at, '')
	      FROM users u
	      LEFT JOIN user_wallets w ON w.user_id = u.id
	      LEFT JOIN santri s ON s.user_id = u.id
	      WHERE ` + where + ` ORDER BY u.name ASC, u.id ASC LIMIT ? OFFSET ?`
	rows, err := r.db.Query(q, append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []AdminWalletRow{}
	for rows.Next() {
		var x AdminWalletRow
		var hasPin, isActive int
		if err := rows.Scan(&x.UserID, &x.Name, &x.Email, &x.NIS, &x.SantriName, &x.Balance, &hasPin, &isActive, &x.UpdatedAt); err != nil {
			return nil, 0, err
		}
		x.HasPIN = hasPin == 1
		x.IsActive = isActive == 1
		out = append(out, x)
	}
	return out, total, rows.Err()
}

// SetActive membekukan (false) atau mengaktifkan (true) dompet pengguna.
func (r *Repository) SetActive(userID int, active bool) error {
	if _, err := r.GetOrCreateByUserID(userID); err != nil {
		return err
	}
	v := 0
	if active {
		v = 1
	}
	_, err := r.db.Exec("UPDATE user_wallets SET is_active = ?, updated_at = ? WHERE user_id = ?", v, time.Now(), userID)
	return err
}

// ResetPIN mengganti PIN pengguna. PIN kosong berarti menghapus PIN (reset).
func (r *Repository) ResetPIN(userID int, pin string) error {
	if _, err := r.GetOrCreateByUserID(userID); err != nil {
		return err
	}
	if strings.TrimSpace(pin) == "" {
		_, err := r.db.Exec("UPDATE user_wallets SET pin_hash = NULL, updated_at = ? WHERE user_id = ?", time.Now(), userID)
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("UPDATE user_wallets SET pin_hash = ?, updated_at = ? WHERE user_id = ?", string(hash), time.Now(), userID)
	return err
}

// DeleteWallet menghapus dompet beserta seluruhmutasinya. Akun pengguna tetap.
func (r *Repository) DeleteWallet(userID int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec("DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM user_wallets WHERE user_id = ?)", userID); err != nil {
		return err
	}
	if _, err := tx.Exec("DELETE FROM user_wallets WHERE user_id = ?", userID); err != nil {
		return err
	}
	return tx.Commit()
}
