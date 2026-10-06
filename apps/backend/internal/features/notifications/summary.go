package notifications

import (
	"fmt"
	"strings"
	"time"
)

// SummaryItem is a single notification row shown inside the admin bell dropdown.
type SummaryItem struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Time  string `json:"time"`
}

// SummarySection groups notification rows by source type.
type SummarySection struct {
	Type  string        `json:"type"`
	Label string        `json:"label"`
	Count int           `json:"count"`
	Items []SummaryItem `json:"items"`
}

// Summary is the aggregated bell payload returned to authenticated staff.
type Summary struct {
	Total    int              `json:"total"`
	Sections []SummarySection `json:"sections"`
}

func relativeTime(t time.Time) string {
	now := time.Now()
	if t.After(now) {
		t = now
	}
	d := now.Sub(t)
	switch {
	case d < time.Minute:
		return "Baru saja"
	case d < time.Hour:
		return fmt.Sprintf("%d menit lalu", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%d jam lalu", int(d.Hours()))
	default:
		days := int(d.Hours() / 24)
		if days == 1 {
			return "Kemarin"
		}
		if days < 7 {
			return fmt.Sprintf("%d hari lalu", days)
		}
		return t.Format("02 Jan 2006")
	}
}

func parseSummaryTime(raw string) time.Time {
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if t, err := time.Parse(layout, raw); err == nil {
			return t
		}
	}
	return time.Time{}
}

func formatRupiah(amount float64) string {
	integral := int64(amount)
	if integral < 0 {
		integral = 0
	}
	digits := fmt.Sprintf("%d", integral)
	var b strings.Builder
	n := len(digits)
	for i, c := range digits {
		b.WriteRune(c)
		if i < n-1 && (n-i-1)%3 == 0 {
			b.WriteByte('.')
		}
	}
	return b.String()
}

func (r *repository) GetPendingRegistrations() (int, []SummaryItem, error) {
	var count int
	if err := r.db.QueryRow("SELECT COUNT(*) FROM registrations WHERE status = 'pending'").Scan(&count); err != nil {
		return 0, nil, err
	}
	rows, err := r.db.Query("SELECT id, full_name, created_at FROM registrations WHERE status = 'pending' ORDER BY id DESC LIMIT 5")
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	items := make([]SummaryItem, 0, 5)
	for rows.Next() {
		var id int64
		var name, createdAt string
		if err := rows.Scan(&id, &name, &createdAt); err != nil {
			continue
		}
		items = append(items, SummaryItem{
			ID:    id,
			Title: "Registrasi PSB: " + name,
			Time:  relativeTime(parseSummaryTime(createdAt)),
		})
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return count, items, nil
}

func (r *repository) GetUnreadMessages() (int, []SummaryItem, error) {
	var count int
	if err := r.db.QueryRow("SELECT COUNT(*) FROM messages WHERE is_read = 0").Scan(&count); err != nil {
		return 0, nil, err
	}
	rows, err := r.db.Query("SELECT id, name, created_at FROM messages WHERE is_read = 0 ORDER BY id DESC LIMIT 5")
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	items := make([]SummaryItem, 0, 5)
	for rows.Next() {
		var id int64
		var name, createdAt string
		if err := rows.Scan(&id, &name, &createdAt); err != nil {
			continue
		}
		items = append(items, SummaryItem{
			ID:    id,
			Title: "Pesan dari " + name,
			Time:  relativeTime(parseSummaryTime(createdAt)),
		})
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return count, items, nil
}

func (r *repository) GetPendingDonations() (int, []SummaryItem, error) {
	var count int
	if err := r.db.QueryRow("SELECT COUNT(*) FROM donations WHERE status = 'pending'").Scan(&count); err != nil {
		return 0, nil, err
	}
	rows, err := r.db.Query("SELECT id, donor_name, amount, created_at FROM donations WHERE status = 'pending' ORDER BY id DESC LIMIT 5")
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	items := make([]SummaryItem, 0, 5)
	for rows.Next() {
		var id int64
		var name, createdAt string
		var amount float64
		if err := rows.Scan(&id, &name, &amount, &createdAt); err != nil {
			continue
		}
		items = append(items, SummaryItem{
			ID:    id,
			Title: fmt.Sprintf("Donasi Rp%s dari %s", formatRupiah(amount), name),
			Time:  relativeTime(parseSummaryTime(createdAt)),
		})
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return count, items, nil
}