package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Message struct {
	Target  string `json:"target"`  // nomor tujuan: 628xxxxxxxxxx
	Message string `json:"message"` // isi pesan
}

// SendMessage mengirim pesan WA via Fonnte API
func SendMessage(target string, message string) error {
	apiKey := os.Getenv("FONNTE_API_KEY")
	apiURL := os.Getenv("FONNTE_API_URL")
	if !IsConfigured(apiKey, apiURL) {
		log.Println("[WA] FONNTE_API_KEY atau FONNTE_API_URL belum diset di .env")
		return fmt.Errorf("WhatsApp gateway not configured")
	}

	payload, _ := json.Marshal(map[string]string{
		"target":  target,
		"message": message,
	})

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[WA] Gagal kirim ke %s: %v", target, err)
		return err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	bodyText := strings.TrimSpace(string(bodyBytes))

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[WA] Gateway menolak pesan ke %s (status: %d, body: %s)", target, resp.StatusCode, bodyText)
		return fmt.Errorf("WhatsApp gateway error: HTTP %d", resp.StatusCode)
	}

	if bodyText != "" {
		var payload map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &payload); err == nil {
			if ok, exists := payload["status"]; exists {
				if statusBool, isBool := ok.(bool); isBool && !statusBool {
					msg := extractGatewayMessage(payload)
					log.Printf("[WA] Gateway membalas gagal ke %s: %s", target, msg)
					return fmt.Errorf("WhatsApp gateway rejected message: %s", msg)
				}
			}

			if ok, exists := payload["success"]; exists {
				if successBool, isBool := ok.(bool); isBool && !successBool {
					msg := extractGatewayMessage(payload)
					log.Printf("[WA] Gateway membalas gagal ke %s: %s", target, msg)
					return fmt.Errorf("WhatsApp gateway rejected message: %s", msg)
				}
			}
		}
	}

	log.Printf("[WA] Pesan diterima gateway untuk %s (status: %d, body: %s)", target, resp.StatusCode, bodyText)
	return nil
}

func extractGatewayMessage(payload map[string]interface{}) string {
	for _, key := range []string{"message", "detail", "reason"} {
		if value, ok := payload[key]; ok {
			if msg, ok := value.(string); ok && strings.TrimSpace(msg) != "" {
				return msg
			}
		}
	}
	return "unknown gateway error"
}

func IsConfigured(apiKey, apiURL string) bool {
	apiKey = strings.TrimSpace(apiKey)
	apiURL = strings.TrimSpace(apiURL)

	if apiKey == "" || apiURL == "" {
		return false
	}

	placeholders := []string{
		"your_fonnte_api_key_here",
		"changeme",
		"your_api_key_here",
	}

	lowerKey := strings.ToLower(apiKey)
	for _, placeholder := range placeholders {
		if lowerKey == placeholder {
			return false
		}
	}

	return true
}

// Template pesan
func FormatTagihanSPP(namaSantri string, bulan string, jumlah int) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Kami mengingatkan bahwa tagihan SPP bulan *%s* sebesar *Rp %s* belum terbayarkan.\n\n"+
			"Mohon segera melakukan pembayaran melalui portal atau transfer ke rekening pondok.\n\n"+
			"Jazakumullahu khairan.\n"+
			"_Admin Darussunnah_",
		namaSantri, bulan, formatRupiah(jumlah))
}

func FormatDonasiSukses(namaDonatur string, jumlah int, kampanye string) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Terima kasih *%s*!\n"+
			"Donasi Anda sebesar *Rp %s* untuk kampanye *\"%s\"* telah kami verifikasi.\n\n"+
			"Semoga menjadi amal jariyah yang berkah.\n\n"+
			"_Pondok Pesantren Darussunnah_",
		namaDonatur, formatRupiah(jumlah), kampanye)
}

func FormatPSBStatus(namaCalon string, status string) string {
	statusText := "sedang diproses"
	if status == "accepted" {
		statusText = "DITERIMA"
	} else if status == "rejected" {
		statusText = "belum dapat diterima"
	}
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Kepada Yth. Wali dari *%s*,\n"+
			"Status pendaftaran santri baru Anda: *%s*\n\n"+
			"Silakan cek detail di Portal Wali Santri Darussunnah.\n\n"+
			"_Panitia PSB Darussunnah_",
		namaCalon, statusText)
}

func FormatNilaiRaport(namaSantri string, semester string, tahunAjaran string, nilaiAkhir float64, gradeLetter string) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Berikut informasi nilai raport semester *%s* tahun ajaran *%s*:\n\n"+
			"Nilai Akhir: *%.1f* (Grade: *%s*)\n\n"+
			"Untuk detail lengkap, silakan hubungi wali kelas atau cek di Portal Wali Santri Darussunnah.\n\n"+
			"Jazakumullahu khairan.\n"+
			"_Admin Darussunnah_",
		namaSantri, semester, tahunAjaran, nilaiAkhir, gradeLetter)
}

func FormatAbsensiAlert(namaSantri string, tanggal string, totalAlpha int) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Kami informasikan bahwa ananda tercatat *TIDAK HADIR (Alpha)* pada tanggal *%s*.\n\n"+
			"Total Alpha bulan ini: *%d* hari.\n\n"+
			"Mohon perhatiannya agar ananda dapat hadir kembali di pondok.\n\n"+
			"Jazakumullahu khairan.\n"+
			"_Admin Darussunnah_",
		namaSantri, tanggal, totalAlpha)
}

func formatRupiah(amount int) string {
	// Format sederhana dengan titik ribuan
	s := fmt.Sprintf("%d", amount)
	n := len(s)
	if n <= 3 {
		return s
	}
	result := ""
	for i, c := range s {
		if (n-i)%3 == 0 && i != 0 {
			result += "."
		}
		result += string(c)
	}
	return result
}
