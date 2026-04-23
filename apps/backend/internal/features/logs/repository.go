package logs

import (
	"database/sql"
	"fmt"
	"strings"
)

type ActivityLog struct {
	ID        int    `json:"id"`
	UserID    int    `json:"user_id"`
	UserName  string `json:"user_name,omitempty"`
	Action    string `json:"action"`
	Details   string `json:"details"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
	CreatedAt string `json:"created_at"`
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAll(limit, offset int, search string) ([]ActivityLog, int, error) {
	query := `
		SELECT l.id, l.user_id, l.action, l.details, l.ip_address, l.user_agent, l.created_at
		FROM activity_logs l
	`
	whereClauses := make([]string, 0, 2)
	params := make([]interface{}, 0, 6)
	trimmedSearch := strings.TrimSpace(search)

	if trimmedSearch != "" {
		searchTerm := "%" + trimmedSearch + "%"
		whereClauses = append(whereClauses, "(l.action LIKE ? OR l.details LIKE ? OR l.user_id IN (SELECT id FROM users WHERE name LIKE ?))")
		params = append(params, searchTerm, searchTerm, searchTerm)
	}

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	query += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?"
	params = append(params, limit, offset)

	rows, err := r.db.Query(query, params...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []ActivityLog
	for rows.Next() {
		var l ActivityLog
		var userID sql.NullInt64
		if err := rows.Scan(&l.ID, &userID, &l.Action, &l.Details, &l.IPAddress, &l.UserAgent, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		if userID.Valid {
			l.UserID = int(userID.Int64)
		}
		logs = append(logs, l)
	}

	countQuery := "SELECT COUNT(*) FROM activity_logs l"
	if len(whereClauses) > 0 {
		countQuery += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	err = r.db.QueryRow(countQuery, params[:len(params)-2]...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error counting logs: %v", err)
	}

	if err := r.attachUserNames(logs); err != nil {
		return nil, 0, fmt.Errorf("error loading usernames: %v", err)
	}

	return logs, total, nil
}

func (r *Repository) attachUserNames(logs []ActivityLog) error {
	if len(logs) == 0 {
		return nil
	}

	userSet := make(map[int]struct{})
	for _, l := range logs {
		if l.UserID > 0 {
			userSet[l.UserID] = struct{}{}
		}
	}
	if len(userSet) == 0 {
		return nil
	}

	ids := make([]int, 0, len(userSet))
	placeholders := make([]string, 0, len(userSet))
	args := make([]interface{}, 0, len(userSet))
	for id := range userSet {
		ids = append(ids, id)
		placeholders = append(placeholders, "?")
		args = append(args, id)
	}

	query := "SELECT id, name FROM users WHERE id IN (" + strings.Join(placeholders, ",") + ")"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()

	userNames := make(map[int]string, len(ids))
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return err
		}
		userNames[id] = name
	}

	for i := range logs {
		if logs[i].UserID > 0 {
			logs[i].UserName = userNames[logs[i].UserID]
		}
	}
	return nil
}
