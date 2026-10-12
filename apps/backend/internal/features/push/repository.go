package push

import "database/sql"

// Repository menyimpan subscription push di SQLite.
type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Upsert(s *Subscription) error {
	_, err := r.db.Exec(`
		INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(endpoint) DO UPDATE SET
			p256dh = excluded.p256dh,
			auth = excluded.auth,
			user_agent = excluded.user_agent,
			updated_at = CURRENT_TIMESTAMP
	`, s.Endpoint, s.P256DH, s.Auth, s.UserAgent)
	return err
}

func (r *Repository) DeleteByEndpoint(endpoint string) (bool, error) {
	result, err := r.db.Exec(`DELETE FROM push_subscriptions WHERE endpoint = ?`, endpoint)
	if err != nil {
		return false, err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

func (r *Repository) List() ([]Subscription, error) {
	rows, err := r.db.Query(`
		SELECT id, endpoint, p256dh, auth, user_agent, created_at
		FROM push_subscriptions
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []Subscription
	for rows.Next() {
		var s Subscription
		if err := rows.Scan(&s.ID, &s.Endpoint, &s.P256DH, &s.Auth, &s.UserAgent, &s.CreatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}