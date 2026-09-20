package whatsapp

import (
	"fmt"
	"log"
	"os"
	"strings"

	"almaparung-api/internal/platform/wagate"
)

type Message struct {
	Target  string `json:"target"`  // nomor tujuan: 628xxxxxxxxxx
	Message string `json:"message"` // isi pesan
}

// SendMessage mengirim pesan WA via gateway mandiri (whatsmeow).
func SendMessage(target string, message string) error {
	if strings.TrimSpace(message) == "" {
		return fmt.Errorf("pesan kosong")
	}
	if err := wagate.SendText(target, message); err != nil {
		log.Printf("[WA] Gagal kirim ke %s: %v", target, err)
		return err
	}
	log.Printf("[WA] Terkirim ke %s", target)
	return nil
}

// IsConfigured melaporkan status koneksi gateway mandiri.
// Parameter apiKey/apiURL dipertahankan agar 3 call-site lama tak berubah.
func IsConfigured(apiKey, apiURL string) bool {
	_ = apiKey
	_ = apiURL
	return wagate.GetManager().StatusNow().Connected
}

// PortalBaseURL membaca APP_URL (default domain produksi) untuk link dashboard di pesan WA.
func PortalBaseURL() string {
	base := strings.TrimSpace(os.Getenv("APP_URL"))
	if base == "" {
		return "https://almaparung.com"
	}
	return strings.TrimRight(base, "/")
}

// Template pesan
func FormatTagihanSPP(namaSantri string, bulan string, jumlah int) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Kami mengingatkan bahwa tagihan SPP bulan *%s* sebesar *Rp %s* belum terbayarkan.\n\n"+
			"Mohon segera melakukan pembayaran melalui portal atau transfer ke rekening pondok.\n" +
			"Lihat & bayar di dashboard: " + PortalBaseURL() + "/portal/payment-spp\n\n" +
			"Jazakumullahu khairan.\n"+
			"_Admin Al-Maa_",
		namaSantri, bulan, formatRupiah(jumlah))
}

func FormatDonasiSukses(namaDonatur string, jumlah int, kampanye string) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Terima kasih *%s*!\n"+
			"Donasi Anda sebesar *Rp %s* untuk kampanye *\"%s\"* telah kami verifikasi.\n\n"+
			"Semoga menjadi amal jariyah yang berkah.\n\n"+
			"_Pondok Pesantren Al-Maa_",
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
			"Silakan cek detail di Portal Wali Santri Al-Maa.\n\n"+
			"_Panitia PSB Al-Maa_",
		namaCalon, statusText)
}

// FormatPSBUpdate adalah template notifikasi per transisi status pendaftaran
// (verifikasi → tes → diterima → daftar ulang / ditolak). detail boleh kosong.
func FormatPSBUpdate(namaCalon string, statusText string, detail string) string {
	msg := "Assalamu'alaikum Wr. Wb.\n\n" +
		"Kepada Yth. Wali dari *" + namaCalon + "*,\n\n" +
		"Status pendaftaran santri baru Al-Maa: *" + statusText + "*.\n"
	if strings.TrimSpace(detail) != "" {
		msg += "\n" + strings.TrimSpace(detail) + ".\n"
	}
	msg += "\nSilakan cek detail dan langkah berikutnya di Portal Wali Santri Al-Maa:\n" + PortalBaseURL() + "/portal/payment\n\n" +
		"_Panitia PSB Al-Maa_"
	return msg
}

func FormatNilaiRaport(namaSantri string, semester string, tahunAjaran string, nilaiAkhir float64, gradeLetter string) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Berikut informasi nilai raport semester *%s* tahun ajaran *%s*:\n\n"+
			"Nilai Akhir: *%.1f* (Grade: *%s*)\n\n"+
			"Untuk detail lengkap, silakan hubungi wali kelas atau cek di Portal Wali Santri Al-Maa.\n\n"+
			"Jazakumullahu khairan.\n"+
			"_Admin Al-Maa_",
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
			"_Admin Al-Maa_",
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

// NormalizePhone: 08xx / +62xx / spasi-strip -> 628xx
func NormalizePhone(raw string) string {
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

// FormatKwitansi: notifikasi kwitansi rekap bulanan ke wali
func FormatKwitansi(namaSantri, receiptNo, periode string, total int) string {
	return fmt.Sprintf(
		"Assalamu'alaikum Wr. Wb.\n\n"+
			"Yth. Wali Santri *%s*,\n"+
			"Alhamdulillah, pembayaran periode *%s* telah kami terima dengan rincian:\n\n"+
			"No. Kwitansi: *%s*\n"+
			"Total: *Rp %s*\n\n"+
			"Kwitansi rekap dapat dilihat/diunduh di dashboard pembayaran:\n" + PortalBaseURL() + "/portal/payment-spp\n\n" +
			"Jazakumullahu khairan.\n"+
			"_Bendahara Al-Maa_",
		namaSantri, periode, receiptNo, formatRupiah(total))
}
