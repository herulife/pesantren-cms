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

func (r *Repository) VerifyPIN(userID int, pin string) (bool, error) {
	var pinHash string
	err := r.db.QueryRow("SELECT pin_hash FROM user_wallets WHERE user_id = ?", userID).Scan(&pinHash)
	if err != nil {
		return false, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(pinHash), []byte(pin))
	return err == nil, nil
}

func (r *Repository) ProcessTransaction(userID int, tr *Transaction) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Get Wallet
	var wID int
	var balance float64
	err = tx.QueryRow("SELECT id, balance FROM user_wallets WHERE user_id = ?", userID).Scan(&wID, &balance)
	if errors.Is(err, sql.ErrNoRows) {
		result, createErr := tx.Exec("INSERT INTO user_wallets (user_id) VALUES (?)", userID)
		if createErr != nil {
			return createErr
		}

		insertID, idErr := result.LastInsertId()
		if idErr != nil {
			return idErr
		}
		wID = int(insertID)
		balance = 0
		err = nil
	}
	if err != nil {
		return err
	}

	// 2. Adjust Balance
	newBalance := balance
	if tr.Type == "deposit" {
		newBalance += tr.Amount
	} else {
		if balance < tr.Amount {
			return errors.New("saldo tidak mencukupi")
		}
		newBalance -= tr.Amount
	}

	// 3. Update Wallet
	_, err = tx.Exec("UPDATE user_wallets SET balance = ?, updated_at = ? WHERE id = ?", newBalance, time.Now(), wID)
	if err != nil {
		return err
	}

	// 4. Log Transaction
	_, err = tx.Exec(`INSERT INTO wallet_transactions (wallet_id, type, amount, reference_id, description) 
	                  VALUES (?, ?, ?, ?, ?)`, wID, tr.Type, tr.Amount, tr.ReferenceID, tr.Description)
	if err != nil {
		return err
	}

	return tx.Commit()
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
