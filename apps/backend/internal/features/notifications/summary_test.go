package notifications

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"darussunnah-api/internal/features/auth"

	"github.com/golang-jwt/jwt/v5"
)

type stubSummaryRepo struct {
	psbCount int
	psbItems []SummaryItem
	psbErr   error
	msgCount int
	msgItems []SummaryItem
	msgErr   error
	donCount int
	donItems []SummaryItem
	donErr   error
}

func (s *stubSummaryRepo) GetPendingTagihan() ([]TagihanTarget, error) { return nil, nil }
func (s *stubSummaryRepo) GetNilai() ([]NilaiTarget, error)            { return nil, nil }
func (s *stubSummaryRepo) GetPSBStatus() ([]PSBTarget, error)          { return nil, nil }
func (s *stubSummaryRepo) GetPendingRegistrations() (int, []SummaryItem, error) {
	return s.psbCount, s.psbItems, s.psbErr
}
func (s *stubSummaryRepo) GetUnreadMessages() (int, []SummaryItem, error) {
	return s.msgCount, s.msgItems, s.msgErr
}
func (s *stubSummaryRepo) GetPendingDonations() (int, []SummaryItem, error) {
	return s.donCount, s.donItems, s.donErr
}

func summaryRequest(role string, repo Repository) *httptest.ResponseRecorder {
	claims := jwt.MapClaims{"id": float64(1), "role": role}
	ctx := context.WithValue(context.Background(), auth.UserContextKey, claims)
	r := httptest.NewRequest(http.MethodGet, "http://localhost/api/admin/notifications/summary", nil).WithContext(ctx)
	w := httptest.NewRecorder()
	NewHandler(repo).NotificationsSummary(w, r)
	return w
}

func TestNotificationsSummary_RoleScoping(t *testing.T) {
	repo := &stubSummaryRepo{
		psbCount: 2,
		psbItems: []SummaryItem{{ID: 1, Title: "Registrasi PSB: Ahmad", Time: "Baru saja"}},
		msgCount: 1,
		msgItems: []SummaryItem{{ID: 4, Title: "Pesan dari Budi", Time: "Kemarin"}},
		donCount: 3,
		donItems: []SummaryItem{{ID: 7, Title: "Donasi Rp500.000 dari Siti", Time: "3 hari lalu"}},
	}

	tests := []struct {
		role string
		want []string
	}{
		{"superadmin", []string{"psb", "message", "donation"}},
		{"panitia_psb", []string{"psb", "message"}},
		{"bendahara", []string{"donation"}},
		{"tim_media", nil},
	}
	for _, tt := range tests {
		w := summaryRequest(tt.role, repo)
		if w.Code != http.StatusOK {
			t.Fatalf("role %s: status = %d", tt.role, w.Code)
		}
		body := w.Body.String()
		var summary Summary
		if err := jsonUnmarshal(body, &summary); err != nil {
			t.Fatalf("role %s: decode summary: %v", tt.role, err)
		}
		for i, typeName := range tt.want {
			if i >= len(summary.Sections) || summary.Sections[i].Type != typeName {
				t.Errorf("role %s: section[%d] = %+v, want type %s", tt.role, i, summary.Sections, typeName)
			}
		}
		if len(tt.want) == 0 && len(summary.Sections) != 0 {
			t.Errorf("role %s: expected no sections, got %+v", tt.role, summary.Sections)
		}
	}
}

func TestNotificationsSummary_Empty(t *testing.T) {
	w := summaryRequest("superadmin", &stubSummaryRepo{})
	var summary Summary
	if err := jsonUnmarshal(w.Body.String(), &summary); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if summary.Total != 0 || len(summary.Sections) != 0 {
		t.Errorf("empty summary = %+v", summary)
	}
}

func TestNotificationsSummary_RepoErrorHidesSection(t *testing.T) {
	repo := &stubSummaryRepo{psbErr: context.DeadlineExceeded, donCount: 1}
	w := summaryRequest("superadmin", repo)
	var summary Summary
	if err := jsonUnmarshal(w.Body.String(), &summary); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if summary.Total != 1 || len(summary.Sections) != 1 || summary.Sections[0].Type != "donation" {
		t.Errorf("summary on repo error = %+v", summary)
	}
}

func TestRelativeTime(t *testing.T) {
	now := time.Now()
	cases := []struct {
		t    time.Time
		want string
	}{
		{now.Add(-30 * time.Second), "Baru saja"},
		{now.Add(-5 * time.Minute), "5 menit lalu"},
		{now.Add(-3 * time.Hour), "3 jam lalu"},
		{now.Add(-26 * time.Hour), "Kemarin"},
		{now.Add(-72 * time.Hour), "3 hari lalu"},
	}
	for _, c := range cases {
		if got := relativeTime(c.t); got != c.want {
			t.Errorf("relativeTime(%v) = %q, want %q", c.t, got, c.want)
		}
	}
}

func TestFormatRupiah(t *testing.T) {
	cases := []struct {
		in   float64
		want string
	}{
		{500000, "500.000"},
		{1500000, "1.500.000"},
		{75000, "75.000"},
		{0, "0"},
	}
	for _, c := range cases {
		if got := formatRupiah(c.in); got != c.want {
			t.Errorf("formatRupiah(%v) = %q, want %q", c.in, got, c.want)
		}
	}
}

func jsonUnmarshal(s string, v interface{}) error {
	decoded := struct {
		Data Summary `json:"data"`
	}{}
	if err := json.Unmarshal([]byte(s), &decoded); err != nil {
		return err
	}
	*v.(*Summary) = decoded.Data
	return nil
}