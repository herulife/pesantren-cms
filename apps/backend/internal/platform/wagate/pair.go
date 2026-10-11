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
func (m *Manager) RequestQR(reqCtx context.Context) ([]byte, time.Duration, error) {
	if st := m.StatusNow(); st.Connected {
		return nil, 0, fmt.Errorf("sudah terhubung")
	}
	// PENTING: cek cache DULU tanpa menyentuh pairing ctx/lock.
	// Polling/refresh UI tidak boleh membatalkan ctx pairing yang hidup —
	// pembatalan = socket mati = HP gagal taut di tengah scan.
	m.mu.Lock()
	cached, at, exp := m.lastQR, m.lastQRAt, m.lastQRExp
	m.mu.Unlock()
	if cached != "" && time.Now().Before(exp.Add(-3*time.Second)) {
		png, err := qrcode.Encode(cached, qrcode.Medium, 280)
		if err != nil {
			return nil, 0, err
		}
		log.Printf("[WAGATE] serve QR cache (umur %ds, sisa %ds)", int(time.Since(at).Seconds()), int(time.Until(exp).Seconds()))
		return png, time.Until(exp), nil
	}
	// Satu alur pairing dalam satu waktu. Kalah lomba -> sajikan cache
	// apa adanya (biarpun mepet) daripada error yang memicu klik brutal.
	if !m.tryPairLock() {
		if cached != "" {
			png, err := qrcode.Encode(cached, qrcode.Medium, 280)
			if err == nil {
				log.Printf("[WAGATE] serve QR saat pairing berjalan")
				return png, time.Until(exp), nil
			}
		}
		return nil, 0, fmt.Errorf("pairing sedang berjalan, tunggu sebentar")
	}
	defer m.unlockPair()
	// PENTING: context pairing hidup terlepas dari request HTTP dan TIDAK
	// dibatalkan saat response terkirim — pembatalan = socket mati.
	// Dibuat SETELAH lock didapat agar tidak membunuh sesi yang handshake.
	ctx := m.startPairCtx()
	_ = reqCtx
	// Reset sesi hanya bila tidak ada handshake aktif; QR yang sedang
	// discan tidak boleh mati di tengah jalan.
	m.resetSessionGuarded()
	client, err := m.ensureClient(ctx)
	if err != nil {
		return nil, 0, err
	}
	if client.IsLoggedIn() {
		m.refreshIdentity()
		return nil, 0, fmt.Errorf("sudah terhubung")
	}
	qrChan, err := client.GetQRChannel(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("gagal memulai pairing QR: %w", err)
	}
	if err := client.Connect(); err != nil {
		return nil, 0, fmt.Errorf("gagal connect: %w", err)
	}
	// Tunggu kode pertama, lalu serahkan channel ke goroutine drain agar
	// rotasi kode server selalu diikuti (QR basi = gagal taut).
	select {
	case item := <-qrChan:
		if item.Event != "code" {
			log.Printf("[WAGATE] QR channel event: %s", item.Event)
			if item.Error != nil {
				return nil, 0, fmt.Errorf("pairing QR gagal: %w", item.Error)
			}
			return nil, 0, fmt.Errorf("pairing QR gagal: %s", item.Event)
		}
		m.rememberQR(item.Code, item.Timeout)
		go m.drainQRChannel(qrChan)
		png, err := qrcode.Encode(item.Code, qrcode.Medium, 280)
		if err != nil {
			return nil, 0, err
		}
		return png, effectiveQRTTL(item.Timeout), nil
	case <-time.After(25 * time.Second):
		return nil, 0, fmt.Errorf("batas waktu menunggu QR habis, coba lagi")
	case <-ctx.Done():
		return nil, 0, ctx.Err()
	}
}

// rememberQR menyimpan kode terbaru beserta masa berlakunya.
func (m *Manager) rememberQR(code string, timeout time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lastQR, m.lastQRAt, m.lastQRErr = code, time.Now(), ""
	m.lastQRExp = time.Now().Add(effectiveQRTTL(timeout))
}

// effectiveQRTTL membatasi umur cache mengikuti rotasi server.
func effectiveQRTTL(serverTimeout time.Duration) time.Duration {
	if serverTimeout > 0 && serverTimeout < QRTTL {
		return serverTimeout
	}
	return QRTTL
}

// drainQRChannel mengikuti rotasi kode sampai channel tutup/sukses.
func (m *Manager) drainQRChannel(qrChan <-chan whatsmeow.QRChannelItem) {
	m.mu.Lock()
	m.pairActive = true
	m.mu.Unlock()
	defer func() {
		m.mu.Lock()
		m.pairActive = false
		m.mu.Unlock()
		m.endPairCtx()
	}()
	for item := range qrChan {
		if item.Event == "code" {
			m.rememberQR(item.Code, item.Timeout)
			log.Printf("[WAGATE] rotasi QR diikuti")
			continue
		}
		log.Printf("[WAGATE] QR channel event: %s", item.Event)
		if item.Event == "success" {
			m.mu.Lock()
			m.lastQR, m.lastQRErr = "", ""
			m.mu.Unlock()
			return
		}
		if item.Error != nil {
			m.mu.Lock()
			m.lastQRErr = item.Error.Error()
			m.mu.Unlock()
			return
		}
	}
}

// RequestPairCode meminta kode taut 8 digit (format XXXX-XXXX) untuk nomor HP.
// Nomor harus format internasional tanpa + (cth: 62812xxxxxxx).
func (m *Manager) RequestPairCode(reqCtx context.Context, phone string) (string, error) {
	if st := m.StatusNow(); st.Connected {
		return "", fmt.Errorf("sudah terhubung")
	}
	// Detached context seperti alur QR (lihat atas).
	ctx := m.startPairCtx()
	_ = reqCtx
	if !m.tryPairLock() {
		return "", fmt.Errorf("pairing sedang berjalan, tunggu sebentar")
	}
	defer m.unlockPair()
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
	// State bersih total seperti alur QR (dibatasi agar tak spam reset).
	m.resetSessionGuarded()
	client, err := m.ensureClient(ctx)
	if err != nil {
		return "", err
	}
	if client.IsLoggedIn() {
		m.refreshIdentity()
		return "", fmt.Errorf("sudah terhubung")
	}
	if err := client.Connect(); err != nil {
		return "", fmt.Errorf("gagal connect: %w", err)
	}
	// Tunggu socket siap sebelum meminta kode (lihat catatan PairPhone).
	time.Sleep(2 * time.Second)
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
	m.endPairCtx()
	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client != nil {
		client.Disconnect()
	}
	m.setStatus(false, "", "")
}
