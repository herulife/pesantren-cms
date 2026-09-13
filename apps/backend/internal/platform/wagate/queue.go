package wagate

// Antrean pengiriman: pacing antar pesan + pengiriman sinkron dengan timeout.

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/types"
	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"
)

// SendTimeout: batas tunggu satu pesan (termasuk antre).
const SendTimeout = 30 * time.Second

// PaceDelay: jeda antar pesan berurutan (anti-spam, penting untuk broadcast).
const PaceDelay = 3 * time.Second

// MaxText: batas aman panjang pesan.
const MaxText = 60000

type sendJob struct {
	phone  string
	text   string
	result chan error
}

var (
	sendQueue = make(chan sendJob, 1000)
	queueOnce = make(chan struct{})
)

func init() {
	close(queueOnce)
	go sendWorker()
}

func sendWorker() {
	<-queueOnce
	for job := range sendQueue {
		job.result <- sendDirect(job.phone, job.text)
		time.Sleep(PaceDelay)
	}
}

// normalizePhone: 08xx / +62xx / spasi-strip -> 628xx.
func normalizePhone(raw string) string {
	digits := ""
	for _, ch := range raw {
		if ch >= '0' && ch <= '9' {
			digits += string(ch)
		}
	}
	if strings.HasPrefix(digits, "62") {
		return digits
	}
	if strings.HasPrefix(digits, "0") {
		return "62" + digits[1:]
	}
	return digits
}

// SendText mengirim satu pesan teks (masuk antrean, menunggu hasil).
func SendText(phone, text string) error {
	phone = normalizePhone(phone)
	if phone == "" {
		return fmt.Errorf("nomor tujuan kosong")
	}
	runes := []rune(text)
	if len(runes) > MaxText {
		text = string(runes[:MaxText])
	}
	job := sendJob{phone: phone, text: text, result: make(chan error, 1)}
	select {
	case sendQueue <- job:
	default:
		return fmt.Errorf("antrean pengiriman penuh, coba lagi")
	}
	select {
	case err := <-job.result:
		return err
	case <-time.After(SendTimeout):
		return fmt.Errorf("batas waktu pengiriman habis")
	}
}

// sendDirect mengirim langsung tanpa antre (dipakai worker).
func sendDirect(phone, text string) error {
	m := GetManager()
	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client == nil {
		return fmt.Errorf("gateway belum terhubung (belum pairing)")
	}
	if !client.IsConnected() {
		if err := client.Connect(); err != nil {
			return fmt.Errorf("gateway terputus dan gagal connect ulang: %w", err)
		}
		deadline := time.Now().Add(15 * time.Second)
		for !client.IsConnected() && time.Now().Before(deadline) {
			time.Sleep(300 * time.Millisecond)
		}
	}
	if !client.IsLoggedIn() {
		return fmt.Errorf("gateway belum terhubung (belum pairing)")
	}
	jid := types.NewJID(phone, types.DefaultUserServer)
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	_, err := client.SendMessage(ctx, jid, &waProto.Message{
		Conversation: proto.String(text),
	})
	if err != nil {
		return fmt.Errorf("gagal kirim WA: %w", err)
	}
	return nil
}
