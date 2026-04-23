package videos

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

type mockRepository struct {
	createFn func(v *Video) error
}

func (m *mockRepository) FindAll(search string, limit, offset int) ([]Video, int, error) {
	return nil, 0, nil
}

func (m *mockRepository) Create(v *Video) error {
	if m.createFn != nil {
		return m.createFn(v)
	}
	return nil
}

func (m *mockRepository) Update(id int, v *Video) error {
	return nil
}

func (m *mockRepository) Delete(id int) error {
	return nil
}

func TestCreateVideo_Validation(t *testing.T) {
	repo := &mockRepository{}
	h := &Handler{repo: repo}
	reqBody := map[string]string{"title": "", "url": "", "thumbnail": ""}
	b, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(b))
	w := httptest.NewRecorder()
	h.Create(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

func TestCreateVideo_Success(t *testing.T) {
	repo := &mockRepository{createFn: func(v *Video) error { return nil }}
	h := &Handler{repo: repo}
	reqBody := map[string]string{"title": "Judul", "url": "http://example.com/video", "thumbnail": "http://example.com/thumb.jpg"}
	b, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(b))
	w := httptest.NewRecorder()
	h.Create(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}
}
