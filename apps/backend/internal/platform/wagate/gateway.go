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
	waLog "go.mau.fi/whatsmeow/util/log"
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
	// Absolut agar tidak tergantung working directory proses
	// (container jalan di /app/apps/backend, volume di /data).
	if _, err := os.Stat("/data"); err == nil {
		return "/data/wagate/wa_session.db"
	}
	return filepath.Join("data", "wagate", "wa_session.db")
}

// Manager mengelola satu koneksi WhatsApp multi-device.
type Manager struct {
	mu        sync.Mutex
	pairMu    sync.Mutex
	dbPath    string
	container *sqlstore.Container
	client    *whatsmeow.Client

	connected bool
	phone     string
	pushName  string

	lastQR      string
	lastQRAt    time.Time
	lastQRExp   time.Time
	lastQRErr   string
	lastResetAt time.Time
	pairActive  bool
	pairCancel  context.CancelFunc
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

// tryPairLock mengunci alur pairing; gagal bila ada pairing berjalan.
func (m *Manager) tryPairLock() bool {
	return m.pairMu.TryLock()
}

func (m *Manager) unlockPair() {
	m.pairMu.Unlock()
}

// resetSessionGuarded: reset hanya bila terakhir >45 dtk lalu (anti-spam klik).
// Mengembalikan true bila reset benar-benar dilakukan.
func (m *Manager) resetSessionGuarded() bool {
	m.mu.Lock()
	since := time.Since(m.lastResetAt)
	m.mu.Unlock()
	if since < 45*time.Second {
		return false
	}
	if m.isPairActive() {
		log.Printf("[WAGATE] reset ditunda: handshake pairing sedang aktif")
		return false
	}
	m.resetSession()
	m.mu.Lock()
	m.lastResetAt = time.Now()
	m.mu.Unlock()
	return true
}

// startPairCtx memulai masa pairing baru: batalkan yang lama, buat
// context 3 menit yang hidup terlepas dari request HTTP. Context HANYA
// dibatalkan saat pairing selesai/gagal/baru atau logout eksplisit —
// TIDAK PERNAH saat HTTP response terkirim (itu yang dulu membunuh socket).
func (m *Manager) startPairCtx() context.Context {
	m.endPairCtx()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	m.mu.Lock()
	m.pairCancel = cancel
	m.mu.Unlock()
	return ctx
}

// endPairCtx membatalkan masa pairing berjalan (jika ada).
func (m *Manager) endPairCtx() {
	m.mu.Lock()
	cancel := m.pairCancel
	m.pairCancel = nil
	m.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}

// isPairActive true bila drain channel QR masih hidup (handshake mungkin jalan).
func (m *Manager) isPairActive() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.pairActive
}

// resetSession membuang seluruh state pairing lama agar percobaan
// berikutnya mulai dari kunci/device yang benar-benar baru.
// TIDAK PERNAH dipanggil saat sudah terhubung.
func (m *Manager) resetSession() {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.connected {
		return
	}
	if m.client != nil {
		m.client.Disconnect()
		m.client = nil
	}
	if m.container != nil {
		_ = m.container.Close()
		m.container = nil
	}
	for _, suffix := range []string{"", "-wal", "-shm", "-journal"} {
		_ = os.Remove(m.dbPath + suffix)
	}
	m.lastQR, m.lastQRErr = "", ""
	m.lastQRExp = time.Time{}
	m.pairCode = ""
	log.Printf("[WAGATE] state pairing direset, siap percobaan bersih")
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
	level := "WARN"
	if strings.TrimSpace(os.Getenv("WA_DEBUG")) != "" {
		level = "DEBUG"
	}
	m.client = whatsmeow.NewClient(device, waLog.Stdout("WAClient", level, true))
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
