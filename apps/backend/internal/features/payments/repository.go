package payments

import (
	"database/sql"
	"time"
)

type Payment struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	UserName    string    `json:"user_name,omitempty"`
	UserEmail   string    `json:"user_email,omitempty"`
	Amount      int       `json:"amount"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // pending, success, failed
	Method      string    `json:"method"`
	PaymentDate string    `json:"payment_date"`
	CreatedAt   time.Time `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAll() ([]Payment, error) {
	query := `
		SELECT p.id, p.user_id, u.name as user_name, u.email as user_email, 
		       p.amount, p.description, p.status, p.method, p.payment_date, p.created_at
		FROM payments p
		JOIN users u ON p.user_id = u.id
		ORDER BY p.payment_date DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ps []Payment
	for rows.Next() {
		var p Payment
		var createdAt string
		if err := rows.Scan(&p.ID, &p.UserID, &p.UserName, &p.UserEmail,
			&p.Amount, &p.Description, &p.Status, &p.Method, &p.PaymentDate, &createdAt); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		ps = append(ps, p)
	}
	return ps, nil
}

func (r *Repository) GetByUserID(userID int) ([]Payment, error) {
	query := `
		SELECT id, user_id, amount, description, status, method, payment_date, created_at
		FROM payments
		WHERE user_id = ?
		ORDER BY payment_date DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ps []Payment
	for rows.Next() {
		var p Payment
		var createdAt string
		if err := rows.Scan(&p.ID, &p.UserID, &p.Amount, &p.Description, &p.Status, &p.Method, &p.PaymentDate, &createdAt); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		ps = append(ps, p)
	}
	return ps, nil
}

func (r *Repository) Create(p *Payment) error {
	query := `
		INSERT INTO payments (user_id, amount, description, status, method, payment_date)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	if p.PaymentDate == "" {
		p.PaymentDate = time.Now().Format("2006-01-02 15:04:05")
	}
	_, err := r.db.Exec(query, p.UserID, p.Amount, p.Description, p.Status, p.Method, p.PaymentDate)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM payments WHERE id = ?", id)
	return err
}

func (r *Repository) GetUsers() ([]struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}, error) {
	query := "SELECT id, name, email FROM users WHERE role = 'user' ORDER BY name ASC"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	for rows.Next() {
		var u struct {
			ID    int    `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
