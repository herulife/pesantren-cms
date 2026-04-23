---
trigger: model_decision
description: Saat mengimplementasikan logging, bekerja dengan logger, atau menyiapkan observabilitas untuk operasi (handler API, query database, pekerjaan latar belakang, panggilan API eksternal)
---

## Prinsip Logging dan Observabilitas

> **⚠️ Prasyarat:** Semua operasi HARUS di-log sesuai Mandat Logging dan Observabilitas @logging-and-observability-mandate.md. Panduan ini menyediakan detail implementasi.

### Referensi Cepat: Persyaratan Wajib

Sebelum mendalami detail implementasi, ingat persyaratan ini dari Mandat Logging dan Observabilitas @logging-and-observability-mandate.md:

✅ **Setiap operasi harus me-log:**
1. Mulai (dengan correlationId, nama operasi, konteks)
2. Sukses (dengan durasi, identifier hasil)
3. Kegagalan (dengan detail error, stack trace)

✅ **Field wajib:** correlationId, operation, duration, userId (jika berlaku), error (saat gagal)

✅ **Gunakan middleware/interceptor** untuk cakupan otomatis


### Standar Logging

#### Level Log (Prioritas Standar)

Gunakan level log yang konsisten di semua layanan:

| Level | Kapan Digunakan | Contoh |
|-------|-----------------|--------|
| **TRACE** | Info diagnostik yang sangat detail | Masuk/keluar fungsi, status variabel (dev saja) |
| **DEBUG** | Alur detail untuk debugging | Eksekusi query, cache hit/miss, transisi status |
| **INFO** | Pesan informasional umum | Permintaan dimulai, tugas dibuat, pengguna login |
| **WARN** | Situasi yang berpotensi berbahaya | Penggunaan API yang deprecated, fallback dipicu, percobaan ulang |
| **ERROR** | Event error yang memungkinkan aplikasi melanjutkan | Permintaan gagal, timeout API eksternal, kegagalan validasi |
| **FATAL** | Error parah yang menyebabkan shutdown | Database tidak dapat dijangkau, konfigurasi kritis hilang |

#### Aturan Logging

**1. Setiap permintaan/operasi harus me-log:**
```

// Awal operasi
log.Info("membuat tugas",
"correlationId", correlationID,
"userId", userID,
"title", task.Title,
)

// Sukses
log.Info("tugas berhasil dibuat",
"correlationId", correlationID,
"taskId", task.ID,
"duration", time.Since(start),
)

// Error
log.Error("gagal membuat tugas",
"correlationId", correlationID,
"error", err,
"userId", userID,
)

```

**2. Selalu sertakan konteks:**
- `correlationId`: Melacak permintaan lintas layanan (UUID)
- `userId`: Siapa yang memicu aksi
- `duration`: Waktu eksekusi operasi (milidetik)
- `error`: Detail error (jika gagal)


**3. Hanya logging terstruktur** (tanpa format string):
```

// ✅ Terstruktur
log.Info("login pengguna", "userId", userID, "ip", clientIP)

// ❌ Format string
log.Info(fmt.Sprintf("Pengguna %s login dari %s", userID, clientIP))

```

**4. Keamanan - Jangan pernah me-log:**
- Kata sandi atau hash kata sandi
- Kunci API atau token
- Nomor kartu kredit
- PII di log produksi (email/telepon hanya jika diperlukan dan disanitasi)
- Body permintaan/respons lengkap (kecuali level DEBUG di non-prod)

**5. Performa - Jangan pernah me-log di jalur panas (hot path):**
- Di dalam loop yang ketat
- Pemrosesan per-item dalam operasi batch (gunakan ringkasan sebagai gantinya)
- Logging sinkron di jalur yang kritis terhadap latensi

**Praktik Terbaik:** "Gunakan redaksi middleware logger (misalnya, pino-redact, zap masking) daripada manipulasi string manual."

#### Implementasi Spesifik Bahasa

##### Go (menggunakan pustaka standar slog)
```

import "log/slog"

// Konfigurasi logger
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
  Level: slog.LevelInfo, // Default produksi
}))

// Penggunaan
logger.Info("operasi dimulai",
  "correlationId", correlationID,
  "userId", userID,
)

logger.Error("operasi gagal",
  "correlationId", correlationID,
  "error", err,
  "retryCount", retries,
)

```

##### TypeScript/Node.js (menggunakan pino)
```

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({
  correlationId,
  userId,
  duration: Date.now() - startTime,
}, 'tugas berhasil dibuat');

logger.error({
  correlationId,
  error: err.message,
  stack: err.stack,
}, 'gagal membuat tugas');

```

#### Python (menggunakan structlog)
```

import structlog

logger = structlog.get_logger()

logger.info("task_created",
correlation_id=correlation_id,
user_id=user_id,
task_id=task.id,
)

logger.error("task_creation_failed",
correlation_id=correlation_id,
error=str(err),
user_id=user_id,
)

```

#### Pola Log Berdasarkan Tipe Operasi

##### Permintaan/Respons API
```

// Permintaan diterima
log.Info("permintaan diterima",
  "method", r.Method,
  "path", r.URL.Path,
  "correlationId", correlationID,
  "userId", userID,
)

// Permintaan selesai
log.Info("permintaan selesai",
  "correlationId", correlationID,
  "status", statusCode,
  "duration", duration,
)

```

##### Operasi Database
```

// Query mulai (level DEBUG)
log.Debug("menjalankan query",
  "correlationId", correlationID,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

// Query sukses (level DEBUG)
log.Debug("query selesai",
  "correlationId", correlationID,
  "rowsReturned", len(results),
  "duration", duration,
)

// Query error (level ERROR)
log.Error("query gagal",
  "correlationId", correlationID,
  "error", err,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

```

##### Panggilan API Eksternal
```

// Panggilan mulai
log.Info("memanggil API eksternal",
  "correlationId", correlationID,
  "service", "email-provider",
  "endpoint", "/send",
)

// Percobaan ulang (level WARN)
log.Warn("mencoba ulang panggilan API eksternal",
  "correlationId", correlationID,
  "service", "email-provider",
  "attempt", retryCount,
  "error", err,
)

// Circuit breaker terbuka (level WARN)
log.Warn("circuit breaker terbuka",
  "correlationId", correlationID,
  "service", "email-provider",
  "failureCount", failures,
)

```

##### Pekerjaan Latar Belakang
```

// Pekerjaan mulai
log.Info("pekerjaan dimulai",
  "jobId", jobID,
  "jobType", "email-digest",
)

// Progres (level INFO - periodik, bukan per-item)
log.Info("progres pekerjaan",
  "jobId", jobID,
  "processed", 1000,
  "total", 5000,
  "percentComplete", 20,
)

// Pekerjaan selesai
log.Info("pekerjaan selesai",
  "jobId", jobID,
  "duration", duration,
  "itemsProcessed", count,
)

```

##### Skenario Error
```

// Error yang dapat dipulihkan (level ERROR)
log.Error("validasi gagal",
  "correlationId", correlationID,
  "userId", userID,
  "error", "format email tidak valid",
  "input", sanitizedInput, // Disanitasi!
)

// Error fatal (level FATAL)
log.Fatal("dependensi kritis tidak tersedia",
  "error", err,
  "dependency", "database",
  "action", "mematikan sistem",
)

```

#### Konfigurasi Spesifik Lingkungan

| Lingkungan | Level | Format | Tujuan |
|------------|-------|--------|--------|
| **Development** | DEBUG | Rapi (berwarna) | Console |
| **Staging** | INFO | JSON | Stdout → CloudWatch/GCP |
| **Production** | INFO | JSON | Stdout → CloudWatch/GCP |

**Konfigurasi (contoh Go):**
```

func configureLogger() *slog.Logger {
var handler slog.Handler

    level := slog.LevelInfo
    if os.Getenv("ENV") == "development" {
        level = slog.LevelDebug
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    } else {
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    }
    
    return slog.New(handler)
    }

```

#### Pengujian Log

**Unit test:** Tangkap dan assert pada output log
```

// Contoh Go
func TestUserLogin(t *testing.T) {
var buf bytes.Buffer
logger := slog.New(slog.NewJSONHandler(&buf, nil))

    // Operasi test
    service := NewUserService(logger, mockStore)
    err := service.Login(ctx, email, password)
    
    // Assert log
    require.NoError(t, err)
    logs := buf.String()
    assert.Contains(t, logs, "login pengguna berhasil")
    assert.Contains(t, logs, email)
    }

```

#### Integrasi Monitoring

**ID Korelasi (Correlation ID):**
- Hasilkan di titik masuk (API gateway, handler pertama)
- Propagasikan melalui semua layanan
- Sertakan di semua log, error, dan trace
- Format: UUID v4

**Agregasi log:**
- Kirim ke sistem terpusat (CloudWatch, GCP Logs, Datadog)
- Indeks berdasarkan: correlationId, userId, level, timestamp
- Alert pada pola ERROR/FATAL
- Dashboard: tingkat permintaan, tingkat error, latensi

#### Daftar Periksa untuk Setiap Fitur

- [ ] Semua operasi publik me-log INFO saat mulai
- [ ] Semua operasi me-log INFO/ERROR saat selesai/gagal
- [ ] Semua log menyertakan correlationId
- [ ] Tidak ada data sensitif di log
- [ ] Logging terstruktur (pasangan key-value)
- [ ] Level log yang sesuai digunakan
- [ ] Log error menyertakan detail error
- [ ] Jalur yang kritis terhadap performa menggunakan level DEBUG

### Strategi Observabilitas

**Tiga Pilar:**

1. **Log:** Apa yang terjadi (event, error, perubahan status)
2. **Metrik:** Berapa banyak (pengukuran kuantitatif)
3. **Trace:** Bagaimana hal itu terjadi (alur permintaan melalui sistem)

**Metrik Kunci:**

- **RED (untuk layanan):**

  - Rate: Permintaan per detik
  - Errors: Tingkat/jumlah error
  - Duration: Latensi (p50, p95, p99)


- **USE (untuk sumber daya):**

  - Utilization: % sumber daya yang digunakan (CPU, memori, disk)
  - Saturation: Seberapa penuh (kedalaman antrian, waktu tunggu)
  - Errors: Jumlah error

**Health Check:**

- `/health`: Sederhana "apakah saya hidup?" (kesehatan proses saja)
- `/ready`: "Apakah saya siap melayani?" (termasuk dependensi)

### Prinsip Terkait
- Prinsip Penanganan Error @error-handling-principles.md
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md
- Prinsip Desain API @api-design-principles.md
