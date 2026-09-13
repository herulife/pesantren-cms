package wagate

// Pairing: QR code + kode 8 digit, dan penanganan event koneksi.

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"
)

// PairDisplayName yang diterima server WhatsApp (format "Browser (OS)").
const PairDisplayName = "Chrome (Linux)"

// QRTTL: umur cache QR di sisi kita (server me-refresh sendiri).
const QRTTL = 50 * time.Second

// handleEvent menerima event koneksi whatsmeow.
func (m *Manager) handleEvent(evt interface{}) {
	switch v := evt.(type) {
	case *events.Connected:
		log.Printf("[WAGATE] terhubung")
		m.refreshIdentity()
	case *events.Disconnected:
		log.Printf("[WAGATE] terputus")
		m.setStatus(false, "", "")
	case *events.LoggedOut:
		log.Printf("[WAGATE] sesi logout dari HP, perlu pairing ulang (alasan: %s)", v.Reason)
		m.setStatus(false, "", "")
		_ = v
	case *events.QR:
		// Diabaikan: QR diambil via GetQRChannel.
		_ = v
	}
}

// RequestQR memulai/mengambil kode QR terbaru sebagai PNG.
// Mengembalikan PNG, sisa umur, dan pesan bila belum bisa.
func (m *Manager) RequestQR(ctx context.Context) ([]byte, time.Duration, error) {
	client, err := m.ensureClient(ctx)
	if err != nil {
		return nil, 0, err
	}
	if client.IsLoggedIn() {
		m.refreshIdentity()
		return nil, 0, fmt.Errorf("sudah terhubung")
	}
	// Pakai cache bila masih segar.
	m.mu.Lock()
	cached, at := m.lastQR, m.lastQRAt
	m.mu.Unlock()
	if cached != "" && time.Since(at) < QRTTL {
		png, err := qrcode.Encode(cached, qrcode.Medium, 280)
		if err != nil {
			return nil, 0, err
		}
		return png, QRTTL - time.Since(at), nil
	}
	qrChan, err := client.GetQRChannel(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal memulai pairing QR: %w", err)
	}
	if !client.IsConnected() {
		if err := client.Connect(); err != nil {
			return nil, 0, fmt.Errorf("gagal connect: %w", err)
		}
	}
	select {
	case item := <-qrChan:
		if item.Event == "code" {
			m.mu.Lock()
			m.lastQR, m.lastQRAt, m.lastQRErr = item.Code, time.Now(), ""
			m.mu.Unlock()
			png, err := qrcode.Encode(item.Code, qrcode.Medium, 280)
			if err != nil {
				return nil, 0, err
			}
			return png, item.Timeout, nil
		}
		if item.Error != nil {
			return nil, 0, fmt.Errorf("pairing QR gagal: %w", item.Error)
		}
		return nil, 0, fmt.Errorf("pairing QR gagal: %s", item.Event)
	case <-time.After(25 * time.Second):
		return nil, 0, fmt.Errorf("batas waktu menunggu QR habis, coba lagi")
	case <-ctx.Done():
		return nil, 0, ctx.Err()
	}
}

// RequestPairCode meminta kode taut 8 digit (format XXXX-XXXX) untuk nomor HP.
// Nomor harus format internasional tanpa + (cth: 62812xxxxxxx).
func (m *Manager) RequestPairCode(ctx context.Context, phone string) (string, error) {
	client, err := m.ensureClient(ctx)
	if err != nil {
		return "", err
	}
	if client.IsLoggedIn() {
		m.refreshIdentity()
		return "", fmt.Errorf("sudah terhubung")
	}
	digits := ""
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			digits += string(ch)
		}
	}
	digits = strings.TrimPrefix(digits, "+")
	if strings.HasPrefix(digits, "0") {
		return "", fmt.Errorf("gunakan format internasional, cth: 62812xxxxxxx")
	}
	if len(digits) < 9 {
		return "", fmt.Errorf("nomor tidak valid")
	}
	if !client.IsConnected() {
		if err := client.Connect(); err != nil {
			return "", fmt.Errorf("gagal connect: %w", err)
		}
		// Tunggu socket siap sebelum meminta kode (lihat catatan PairPhone).
		time.Sleep(2 * time.Second)
	}
	code, err := client.PairPhone(ctx, digits, true, whatsmeow.PairClientChrome, PairDisplayName)
	if err != nil {
		return "", fmt.Errorf("gagal meminta kode pairing: %w", err)
	}
	m.mu.Lock()
	m.pairCode, m.pairCodeAt, m.pairPhone = code, time.Now(), digits
	m.mu.Unlock()
	return code, nil
}

// Logout memutuskan + menghapus sesi (perlu pairing ulang).
func (m *Manager) Logout(ctx context.Context) error {
	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client == nil {
		return fmt.Errorf("belum pernah terhubung")
	}
	if err := client.Logout(ctx); err != nil {
		return err
	}
	m.setStatus(false, "", "")
	return nil
}

// Disconnect hanya memutus socket (sesi tersimpan, auto-connect saat boot).
func (m *Manager) Disconnect() {
	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client != nil {
		client.Disconnect()
	}
	m.setStatus(false, "", "")
}
