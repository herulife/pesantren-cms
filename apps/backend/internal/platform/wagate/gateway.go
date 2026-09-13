package wagate

// Gateway WhatsApp mandiri (pengganti Fonnte) berbasis whatsmeow.
// Sesi tersimpan di SQLite persisten sehingga selamat dari restart.

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/log"
	_ "modernc.org/sqlite"
)

var (
	mgr     *Manager
	mgrOnce sync.Once
)

// GetManager mengembalikan singleton gateway.
func GetManager() *Manager {
	mgrOnce.Do(func() {
		mgr = NewManager(sessionPath())
	})
	return mgr
}

func sessionPath() string {
	if p := strings.TrimSpace(os.Getenv("WA_SESSION_PATH")); p != "" {
		return p
	}
	return filepath.Join("data", "wagate", "wa_session.db")
}

// Manager mengelola satu koneksi WhatsApp multi-device.
type Manager struct {
	mu        sync.Mutex
	dbPath    string
	container *sqlstore.Container
	client    *whatsmeow.Client

	connected bool
	phone     string
	pushName  string

	lastQR      string
	lastQRAt    time.Time
	lastQRErr   string
	pairCode    string
	pairCodeAt  time.Time
	pairPhone   string
}

// Status adalah snapshot status koneksi untuk API/UI.
type Status struct {
	Connected bool   `json:"connected"`
	Phone     string `json:"phone,omitempty"`
	PushName  string `json:"pushname,omitempty"`
}

func NewManager(dbPath string) *Manager {
	return &Manager{dbPath: dbPath}
}

// StatusNow mengembalikan status terakhir yang diketahui tanpa I/O.
func (m *Manager) StatusNow() Status {
	m.mu.Lock()
	defer m.mu.Unlock()
	return Status{Connected: m.connected, Phone: m.phone, PushName: m.pushName}
}

func (m *Manager) setStatus(connected bool, phone, pushName string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connected = connected
	m.phone = phone
	m.pushName = pushName
}

// openStore membuka container sesi (membuat direktori bila perlu).
func (m *Manager) openStore(ctx context.Context) error {
	if m.container != nil {
		return nil
	}
	if dir := filepath.Dir(m.dbPath); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("gagal menyiapkan direktori sesi: %w", err)
		}
	}
	dsn := "file:" + m.dbPath + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
	container, err := sqlstore.New(ctx, "sqlite", dsn, waLog.Stdout("WAStore", "WARN", true))
	if err != nil {
		return fmt.Errorf("gagal membuka sesi WA: %w", err)
	}
	m.container = container
	return nil
}

// ensureClient memastikan client ada (belum tentu terhubung).
func (m *Manager) ensureClient(ctx context.Context) (*whatsmeow.Client, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.client != nil {
		return m.client, nil
	}
	if err := m.openStore(ctx); err != nil {
		return nil, err
	}
	device, err := m.container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal memuat sesi WA: %w", err)
	}
	m.client = whatsmeow.NewClient(device, waLog.Stdout("WAClient", "WARN", true))
	m.client.AddEventHandler(m.handleEvent)
	return m.client, nil
}

// Start dipanggil saat boot: hubungkan ulang bila sesi tersimpan ada.
func (m *Manager) Start(ctx context.Context) {
	client, err := m.ensureClient(ctx)
	if err != nil {
		log.Printf("[WAGATE] sesi belum siap: %v", err)
		return
	}
	if client.Store.ID == nil {
		log.Printf("[WAGATE] belum ada sesi tersimpan, menunggu pairing dari admin")
		return
	}
	if err := client.Connect(); err != nil {
		log.Printf("[WAGATE] gagal connect saat boot: %v", err)
		return
	}
	// Status final ditentukan lewat event Connected.
	go func() {
		deadline := time.Now().Add(30 * time.Second)
		for time.Now().Before(deadline) {
			if client.IsConnected() {
				m.refreshIdentity()
				return
			}
			time.Sleep(500 * time.Millisecond)
		}
	}()
}

// refreshIdentity membaca nomor + nama dari store setelah terhubung.
func (m *Manager) refreshIdentity() {
	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client == nil || client.Store.ID == nil {
		return
	}
	phone := strings.TrimSuffix(client.Store.ID.User, "@"+client.Store.ID.Server)
	push := client.Store.PushName
	m.setStatus(true, phone, push)
}
