package faqs

import (
	"database/sql"
)

type Faq struct {
	ID       int    `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	OrderNum int    `json:"order_num"`
	IsActive bool   `json:"is_active"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(search string) ([]Faq, error) {
	query := "SELECT id, question, answer, order_num, is_active FROM faqs WHERE 1=1"
	var args []interface{}

	if search != "" {
		query += " AND (question LIKE ? OR answer LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	query += " ORDER BY order_num ASC, id DESC"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var faqs []Faq
	for rows.Next() {
		var f Faq
		if err := rows.Scan(&f.ID, &f.Question, &f.Answer, &f.OrderNum, &f.IsActive); err != nil {
			return nil, err
		}
		faqs = append(faqs, f)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return faqs, nil
}

func (r *Repository) Create(f *Faq) error {
	var maxOrder int
	r.db.QueryRow("SELECT COALESCE(MAX(order_num), 0) FROM faqs").Scan(&maxOrder)

	query := `INSERT INTO faqs (question, answer, order_num, is_active) VALUES (?, ?, ?, ?)`
	result, err := r.db.Exec(query, f.Question, f.Answer, maxOrder+1, f.IsActive)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	f.ID = int(id)
	f.OrderNum = maxOrder + 1
	return nil
}

func (r *Repository) Update(id int, f *Faq) error {
	query := `UPDATE faqs SET question = ?, answer = ?, is_active = ? WHERE id = ?`
	_, err := r.db.Exec(query, f.Question, f.Answer, f.IsActive, id)
	return err
}

func (r *Repository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM faqs WHERE id = ?", id)
	return err
}

func (r *Repository) UpdateOrder(id int, increment bool) error {
	var currentOrder int
	err := r.db.QueryRow("SELECT order_num FROM faqs WHERE id = ?", id).Scan(&currentOrder)
	if err != nil {
		return err
	}

	var swapID, swapOrder int
	var query string
	if increment {
		// Move down in the list means it will take the spot of the next higher order_num
		query = "SELECT id, order_num FROM faqs WHERE order_num > ? ORDER BY order_num ASC LIMIT 1"
	} else {
		// Move up means taking the spot of lower order_num
		query = "SELECT id, order_num FROM faqs WHERE order_num < ? ORDER BY order_num DESC LIMIT 1"
	}

	err = r.db.QueryRow(query, currentOrder).Scan(&swapID, &swapOrder)
	if err == sql.ErrNoRows {
		return nil // Nothing to swap with
	} else if err != nil {
		return err
	}

	// Begin swap
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	_, err = tx.Exec("UPDATE faqs SET order_num = ? WHERE id = ?", swapOrder, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	_, err = tx.Exec("UPDATE faqs SET order_num = ? WHERE id = ?", currentOrder, swapID)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}
