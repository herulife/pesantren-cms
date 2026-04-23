---
trigger: always_on
---

## Pola Arsitektur - Desain yang Mengutamakan Testabilitas

### Prinsip Inti
Semua kode harus dapat diuji secara independen tanpa menjalankan aplikasi lengkap atau infrastruktur eksternal.

### Aturan Arsitektur Universal

#### Aturan 1: Isolasi I/O
**Masalah:** I/O yang terikat erat membuat pengujian lambat, tidak stabil, dan bergantung pada lingkungan.

**Solusi:** Abstraksi semua I/O di balik interface/kontrak:
- Query database
- Panggilan HTTP (ke API eksternal)
- Operasi sistem file
- Waktu/keacakan (untuk determinisme)
- Message queue

**Penemuan Implementasi:**
1. Cari pola abstraksi yang ada: `find_symbol("Interface")`, `find_symbol("Mock")`, `find_symbol("Repository")`
2. Cocokkan gayanya (interface di Go, Protocol di Python, interface di TypeScript)
3. Implementasikan adapter produksi DAN adapter pengujian

**Contoh (Go):**

```Go

// Kontrak
type UserStore interface {
  Create(ctx context.Context, user User) error
  GetByEmail(ctx context.Context, email string) (*User, error)
}

// Adapter produksi
type PostgresUserStore struct { /* ... */ }

// Adapter pengujian
type MockUserStore struct { /* ... */ }
```

**Contoh (TypeScript/Vue):**
```typescript

// Kontrak (layer layanan)
export interface TaskAPI {
  createTask(title: string): Promise<Task>;
  getTasks(): Promise<Task[]>;
}

// Adapter produksi
export class BackendTaskAPI implements TaskAPI { /* ... */ }

// Adapter pengujian (vi.mock atau manual)
export class MockTaskAPI implements TaskAPI { /* ... */ }

```

#### Aturan 2: Logika Bisnis Murni
**Masalah:** Aturan bisnis yang tercampur dengan I/O tidak mungkin diuji tanpa infrastruktur.

**Solusi:** Ekstrak kalkulasi, validasi, transformasi ke dalam fungsi murni:
- Input → Output, tanpa efek samping
- Deterministik: input yang sama = output yang sama
- Tidak ada I/O di dalam aturan bisnis

**Contoh:**
```

// ✅ Fungsi murni - mudah diuji
func calculateDiscount(items []Item, coupon Coupon) (float64, error) {
// Kalkulasi murni, mengembalikan nilai
}

// ❌ Tidak murni - panggilan database di dalam
func calculateDiscount(ctx context.Context, items []Item, coupon Coupon) (float64, error) {
validCoupon, err := db.GetCoupon(ctx, coupon.ID) // TIDAK!
}

```

**Pendekatan yang benar:**
```

// 1. Ambil dependensi terlebih dahulu (di handler/service)
validCoupon, err := store.GetCoupon(ctx, coupon.ID)

// 2. Berikan ke logika murni
discount, err := calculateDiscount(items, validCoupon)

// 3. Simpan hasil
err = store.SaveOrder(ctx, order)

```

#### Aturan 3: Arah Dependensi
**Prinsip:** Dependensi mengarah ke dalam menuju logika bisnis.

```

┌──────────────────────────────────────┐
│  Layer Infrastruktur                 │
│  (DB, HTTP, File, API Eksternal)     │
│                                      │
│  Bergantung pada ↓                   │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Layer Kontrak/Interface             │
│  (Port abstrak - tanpa implementasi) │
│                                      │
│  Bergantung pada ↓                   │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Layer Logika Bisnis                 │
│  (Fungsi murni, aturan domain)       │
│  TANPA dependensi pada infrastruktur │
└──────────────────────────────────────┘

```

**Jangan pernah:**
- Logika bisnis mengimpor driver database
- Entitas domain mengimpor framework HTTP
- Kalkulasi inti mengimpor file konfigurasi

**Selalu:**
- Infrastruktur mengimplementasikan interface yang didefinisikan oleh layer bisnis
- Logika bisnis menerima dependensi melalui injeksi

### Protokol Penemuan Pola

**Sebelum mengimplementasikan FITUR APAPUN:**

1. **Cari pola yang ada** (WAJIB):
```

find_symbol("Interface") OR find_symbol("Repository") OR find_symbol("Service")

```

2. **Periksa 3 modul yang ada** untuk konsistensi:
- Bagaimana mereka menangani akses database?
- Di mana fungsi murni vs operasi I/O?
- Pola pengujian apa yang ada?

3. **Dokumentasikan pola** (konsistensi >80% diperlukan):
- "Mengikuti pola dari modul [task, user, auth]"
- "X/Y modul menggunakan store berbasis interface"
- "Semua test menggunakan pola [MockStore, vi.mock, TestingPinia]"

4. **Jika konsistensi <80%**: BERHENTI dan laporkan fragmentasi ke manusia.

### Persyaratan Pengujian

**Unit Test (harus berjalan tanpa infrastruktur):**
- Mock semua dependensi I/O
- Uji logika bisnis secara terisolasi
- Cepat (<100ms per test)
- Cakupan >85% jalur bisnis

**Test Integrasi (Testcontainers):**
- Gunakan dependensi nyata (melalui Testcontainers, emulator Firebase)
- Uji implementasi adapter
- Verifikasi kontrak bekerja end-to-end
- Cakup semua adapter I/O

**Organisasi Test:**
- Test unit/integrasi: Ditempatkan bersama implementasi
- Test E2E: Direktori `/e2e` terpisah

### Idiom Spesifik Bahasa

**Cara mencapai testabilitas di setiap ekosistem:**

| Bahasa/Framework | Pola Abstraksi | Strategi Test |
|-------------------|---------------------|---------------|
| **Go** | Tipe interface, injeksi dependensi | Test berbasis tabel, implementasi mock |
| **TypeScript/Vue** | Tipe interface, layer layanan, store Pinia | Vitest dengan `vi.mock`, `createTestingPinia` |
| **TypeScript/React** | Tipe interface, layer layanan, Context/hooks | Jest dengan mock factory, React Testing Library |
| **Python** | `typing.Protocol` atau abstract base class | pytest dengan fixture, monkeypatch |
| **Rust** | Trait, injeksi dependensi | Unit test dengan implementasi mock, `#[cfg(test)]` |
| **Flutter/Dart** | Kelas abstrak, injeksi dependensi | Paket `mockito`, widget test |

### Daftar Periksa Penegakan

Sebelum menandai kode sebagai selesai, verifikasi:
- [ ] Bisakah saya menjalankan unit test tanpa menjalankan database/layanan eksternal?
- [ ] Apakah semua operasi I/O berada di balik abstraksi?
- [ ] Apakah logika bisnis murni (tanpa efek samping)?
- [ ] Apakah test integrasi ada untuk semua adapter?
- [ ] Apakah pola sesuai dengan codebase yang ada (konsistensi >80%)?

### Prinsip Terkait
- Prinsip Desain Inti @core-design-principles.md
- Strategi Pengujian @testing-strategy.md
- Hindari Dependensi Melingkar @avoid-circular-dependencies.md
- Prinsip Organisasi Kode @code-organization-principles.md
- Struktur Proyek @project-structure.md