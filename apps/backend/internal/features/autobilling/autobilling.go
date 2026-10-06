package autobilling

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"almaparung-api/internal/features/spp"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/sysnotif"
	"almaparung-api/internal/platform/wanotif"
	"almaparung-api/internal/platform/whatsapp"
)

// SettingsReader membaca setting key/value (tabel settings).
type SettingsReader interface {
	GetByKey(key string) (string, error)
}

// SPPRepo operasi pembuatan tagihan SPP yang dipakai scheduler otomatis.
type SPPRepo interface {
	CountBillsByPeriod(period string) (int, error)
	GenerateAutoBills(period string, amount int, dueDate string) (int, []spp.AutoBillRecipient, error)
}

const (
	keyEnabled = "spp_auto_enabled"
	keyAmount  = "spp_auto_amount"
	keyDueDay  = "spp_auto_due_day"
	keyWA      = "spp_auto_wa"
)

// Runner membuat tagihan SPP otomatis tiap awal bulan.
type Runner struct {
	settings SettingsReader
	spp      SPPRepo
	interval time.Duration
}

// New membuat Runner baru. interval = seberapa sering dicek (mis. 6 jam).
func New(settings SettingsReader, sppRepo SPPRepo, interval time.Duration) *Runner {
	return &Runner{settings: settings, spp: sppRepo, interval: interval}
}

// Start menjalankan pengecekan sekali saat startup, lalu berkala hingga ctx selesai.
func (rn *Runner) Start(ctx context.Context) {
	go func() {
		rn.RunOnce()
		ticker := time.NewTicker(rn.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				rn.RunOnce()
			}
		}
	}()
}

var idMonths = []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

func monthYearID(period string) string {
	if len(period) == 7 && period[4] == '-' {
		month, err := strconv.Atoi(period[5:7])
		if err == nil && month >= 1 && month <= 12 {
			return idMonths[month] + " " + period[:4]
		}
	}
	return period
}

// nowWIB mengembalikan waktu saat ini dalam zona waktu Asia/Jakarta (WIB).
// Server bisa berjalan di UTC; seluruh penagihan menggunakan WIB agar
// konsisten dengan zona waktu pengguna (frontend browser).
func (rn *Runner) nowWIB() time.Time {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Now()
	}
	return time.Now().In(loc)
}

func (rn *Runner) stringSetting(key, fallback string) string {
	v, err := rn.settings.GetByKey(key)
	if err != nil {
		return fallback
	}
	if v == "" {
		return fallback
	}
	return v
}

func (rn *Runner) boolSetting(key string) bool {
	return strings.EqualFold(rn.stringSetting(key, ""), "true")
}

func (rn *Runner) intSetting(key string, fallback int) int {
	n, err := strconv.Atoi(rn.stringSetting(key, ""))
	if err != nil {
		return fallback
	}
	return n
}

// RunOnce mengecek dan membuat tagihan SPP bulan berjalan bila belum ada.
func (rn *Runner) RunOnce() {
	if !rn.boolSetting(keyEnabled) {
		return
	}
	amount := rn.intSetting(keyAmount, 0)
	if amount <= 0 {
		log.Printf("[AutoSPP] skip: besar SPP belum diatur (spp_auto_amount)")
		return
	}
	dueDay := rn.intSetting(keyDueDay, 10)
	if dueDay < 1 || dueDay > 28 {
		dueDay = 10
	}
	waEnabled := rn.boolSetting(keyWA)

	now := rn.nowWIB()
	period := now.Format("2006-01")
	// Guard: jangan buat tagihan dengan jatuh tempo di masa lalu. Jika hari
	// ini sudah lewat tanggal jatuh tempo bulan berjalan, lewati (admin bisa
	// generate manual bila perlu).
	if now.Day() > dueDay {
		log.Printf("[AutoSPP] skip: jatuh tempo tgl %d periode %s sudah lewat (hari ini tgl %d)", dueDay, monthYearID(period), now.Day())
		return
	}

	dueDate := fmt.Sprintf("%s-%02d", period, dueDay)
	created, recipients, err := rn.spp.GenerateAutoBills(period, amount, dueDate)
	if err != nil {
		logger.Error(context.Background(), "AutoSPP generate failed", logger.Field{"error": err.Error(), "period": period})
		return
	}
	logger.Info(context.Background(), "AutoSPP generate selesai", logger.Field{"period": period, "created": created, "wa": waEnabled})
	log.Printf("[AutoSPP] periode %s: %d tagihan dibuat", period, created)

	// Jilid 83: beri tahu semua admin bahwa tagihan SPP otomatis dibuat.
	if created > 0 {
		if err := sysnotif.Emit(context.Background(), database.DB, "tagihan", "Tagihan SPP otomatis dibuat",
			fmt.Sprintf("%d tagihan SPP periode %s dibuat otomatis", created, monthYearID(period)), "/admin/spp"); err != nil {
			logger.Warn(context.Background(), "sysnotif emit failed", logger.Field{"operation": "sysnotif_autobilling", "error": err.Error()})
		}
	}

	if !waEnabled || created == 0 {
		return
	}
	for _, rc := range recipients {
		phone := whatsapp.NormalizePhone(rc.Phone)
		if phone == "" {
			continue
		}
		msg := whatsapp.FormatTagihanSPP(rc.Name, monthYearID(rc.Period), rc.Amount)
		if _, err := wanotif.Enqueue(context.Background(), nil, "spp_auto", phone, msg); err != nil {
			log.Printf("[AutoSPP] WA gagal diantre ke %s: %v", phone, err)
			continue
		}
		logger.Info(context.Background(), "AutoSPP WA terkirim", logger.Field{"phone": phone, "period": rc.Period})
	}
}