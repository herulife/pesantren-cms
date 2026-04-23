---
trigger: always_on
---

## Prinsip Organisasi Kode

- Hasilkan fungsi kecil dan terfokus dengan tujuan tunggal yang jelas (biasanya 10-50 baris)
- Pertahankan kompleksitas kognitif yang rendah (kompleksitas siklomatik < 10 untuk sebagian besar fungsi)
- Pertahankan batasan yang jelas antara layer yang berbeda (presentasi, logika bisnis, akses data)
- Rancang untuk testabilitas sejak awal, hindari kopling ketat yang mencegah pengujian
- Terapkan konvensi penamaan yang konsisten yang mengungkapkan maksud tanpa memerlukan komentar

### Batasan Modul
**Masalah:** Kopling lintas-modul membuat perubahan merambat ke seluruh codebase.

**Solusi:** Organisasi berbasis fitur dengan antarmuka publik yang jelas:
- Satu fitur = satu direktori
- Setiap modul mengekspos API publik (fungsi/kelas yang diekspor)
- Detail implementasi internal bersifat privat
- Panggilan lintas-modul hanya melalui API publik

**Struktur Direktori (Agnostik Bahasa):**

> Path di bawah ini adalah contoh ilustrasi yang mengikuti `project-structure.md` — sumber kebenaran tunggal untuk tata letak proyek.

```
/task

- public_api.{ext}      # Antarmuka yang diekspor
- business.{ext}        # Logika murni
- store.{ext}           # Abstraksi I/O (interface)
- postgres.{ext}        # Implementasi I/O
- mock.{ext}            # Implementasi pengujian
- test.{ext}            # Unit test (I/O di-mock)
- integration.test.{ext} # Test integrasi (I/O nyata)
```

**Contoh Go:**
```
/apps/backend/task

- task.go               # Endpoint API (publik)
- business.go           # Logika domain murni
- store.go              # interface UserStore
- postgres.go           # mengimplementasikan UserStore
- task_test.go          # Unit test dengan MockStore
- task_integration_test.go # Test integrasi dengan Testcontainers untuk dependensi nyata
```

**Contoh Vue:**
```
/apps/frontend/src/features/task

- index.ts              # Ekspor publik
- task.service.ts       # Logika bisnis
- task.api.ts           # interface TaskAPI
- task.api.backend.ts   # mengimplementasikan TaskAPI
- task.store.ts         # Store Pinia (menggunakan TaskAPI)
- task.service.spec.ts  # Unit test (mock API)
```

### Pola Interaksi Fitur

**Impor Langsung**

Ketika sebuah fitur membutuhkan kemampuan fitur lain, impor Service-nya secara langsung:

```go
// Di features/order/logic.go
import "yourapp/internal/features/task"

type Logic struct {
    taskService *task.Service  // Injeksi dependensi langsung
}

func (l *Logic) CreateOrder(ctx context.Context, req CreateOrderRequest) error {
    // Gunakan task service secara langsung
    task, err := l.taskService.GetTask(ctx, req.TaskID)
    // ... sisa logika
}

**Aturan**

- Hanya impor Service (API publik), jangan pernah file internal seperti logic.go atau storage.go
- Deklarasikan dependensi di konstruktor Service fitur yang bergantung
- Hubungkan dependensi di cmd/api/main.go

**Contoh Penghubungan**
```
// cmd/api/main.go
taskService := task.NewService(taskStorage)
orderService := order.NewService(orderStorage, taskService) // Berikan task service
```