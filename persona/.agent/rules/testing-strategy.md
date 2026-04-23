---
trigger: model_decision
description: Saat menulis test, mengorganisir file test, mengimplementasikan test double, atau menyiapkan infrastruktur pengujian
---

## Strategi Pengujian

### Piramida Test

**Unit Test (70% dari test):**

- **Apa:** Menguji logika domain secara terisolasi dengan dependensi yang di-mock
- **Kecepatan:** Cepat (<100ms per test)
- **Cakupan:** Satu fungsi, kelas, atau modul
- **Dependensi:** Semua dependensi eksternal di-mock (repositori, API, waktu, acak)
- **Target Cakupan:** >85% logika domain

**Test Integrasi (20% dari test):**

- **Apa:** Menguji adapter terhadap infrastruktur nyata
- **Kecepatan:** Sedang (100ms-5s per test)
- **Cakupan:** Interaksi komponen dengan infrastruktur (database, cache, message queue)
- **Dependensi:** Infrastruktur nyata melalui Testcontainers
- **Target Cakupan:** Semua implementasi adapter, titik integrasi kritis

**Test End-to-End (10% dari test):**

- **Apa:** Menguji perjalanan pengguna lengkap melalui semua layer
- **Kecepatan:** Lambat (5s-30s per test)
- **Cakupan:** Sistem penuh dari permintaan HTTP ke database dan kembali
- **Dependensi:** Seluruh sistem berjalan (atau perkiraan yang mendekati)
- **Target Cakupan:** Jalur bahagia (happy path), alur bisnis kritis

### Test-Driven Development (TDD)

**Siklus Merah-Hijau-Refaktor:**

1. **Merah:** Tulis test yang gagal untuk fungsionalitas berikutnya
2. **Hijau:** Tulis kode minimal agar test lulus
3. **Refaktor:** Bersihkan kode sambil mempertahankan test tetap hijau
4. **Ulangi:** Test berikutnya

**Manfaat:**

- Test yang ditulis lebih dulu memastikan desain yang dapat diuji
- Cakupan test yang komprehensif (kode tanpa test tidak ada)
- Pengembangan lebih cepat (tangkap bug segera, bukan di QA)
- Desain lebih baik (memaksa berpikir tentang interface sebelum implementasi)

### Strategi Test Double

**Unit Test:** Gunakan mock/stub untuk semua driven port

- Mock repositori mengembalikan data yang telah ditentukan
- Mock API eksternal mengembalikan respons yang berhasil
- Mock waktu/acak untuk test yang deterministik
- Kontrol lingkungan test sepenuhnya

**Test Integrasi:** Gunakan infrastruktur nyata

- Testcontainers menjalankan PostgreSQL, Redis, message queue
- Emulator Firebase menjalankan Firebase Authentication, Cloud Firestore, Realtime Database, Cloud Storage for Firebase, Firebase Hosting, Cloud Functions, Pub/Sub, dan Firebase Extensions
- Uji query database aktual, penanganan koneksi, transaksi
- Verifikasi implementasi adapter bekerja dengan layanan nyata

**Praktik Terbaik:**

- Hasilkan setidaknya 2 implementasi per driven port:
  1. Adapter produksi (PostgreSQL, GCP GCS, dll.)
  2. Adapter test (in-memory, implementasi palsu)

### Organisasi Test

**Aturan Universal: Tempatkan test implementasi bersama; Pisahkan test sistem.**

**1. Unit & Test Integrasi (Ditempatkan Bersama)**
- **Aturan:** Letakkan test **di samping file** yang diuji.
- **Mengapa:** Menjaga test tetap terlihat, mendorong pemeliharaan, dan mendukung refactoring (memindahkan file memindahkan test-nya).
- **Contoh Konvensi Penamaan:**
  - **TS/JS:** `*.spec.ts` (Unit), `*.integration.spec.ts` (Integrasi)
  - **Go:** `*_test.go` (Unit), `*_integration_test.go` (Integrasi)
  - **Python:** `test_*.py` (Unit), `test_*_integration.py` (Integrasi)
  - **Java:** `*Test.java` (Unit), `*IT.java` (Integrasi)
  > Anda harus secara ketat mengikuti konvensi untuk bahasa target. Jangan mencampur sufiks `test` dan `spec` dalam konteks aplikasi yang sama.

**2. Test End-to-End (Terpisah)**
- **Aturan:** Letakkan di folder `e2e/` yang didedikasikan
  - **Layanan Tunggal:** `e2e/` di root proyek
  - **Monorepo:** `apps/e2e/` dibagi berdasarkan cakupan test:
    - `apps/e2e/api/` untuk test E2E alur API penuh (HTTP → Database)
    - `apps/e2e/ui/` untuk test E2E full-stack (Browser → Backend → Database)
- **Mengapa:** Test E2E melintas batas dan tidak milik satu fitur tunggal.
- **Penamaan:** Ikuti `{fitur}-{ui/api}.e2e.test.{ext}` (Universal - konfigurasikan test runner untuk mencocokkan pola ini `**/*.e2e.test.*`)
  - Contoh:
    - `user-registration-api.e2e.test.ts`       # Alur API penuh: HTTP → DB
    - `user-registration-ui.e2e.test.ts`        # Full-stack: Browser → Backend → DB

**Menggunakan Playwright MCP untuk Test E2E UI:**

Saat menjalankan test E2E secara interaktif (selama pengembangan atau verifikasi), gunakan Playwright MCP:

```
# Navigasi ke halaman
mcp_playwright_browser_navigate(url="http://localhost:5173/login")

# Tangkap status aksesibel (lebih baik dari screenshot untuk assertion)
mcp_playwright_browser_snapshot()

# Berinteraksi dengan elemen berdasarkan ref dari snapshot
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")

# Tunggu hasil
mcp_playwright_browser_wait_for(text="Selamat Datang")

# Ambil screenshot untuk dokumentasi walkthrough
mcp_playwright_browser_take_screenshot(filename="login-berhasil.png")
```

**Persyaratan Test E2E:**
- Ambil screenshot di setiap langkah utama
- Simpan screenshot ke walkthrough sebagai bukti fungsionalitas
- Uji jalur bahagia (happy path) DAN setidaknya satu jalur error
- Bersihkan data test setelah test (atau gunakan identifier unik)

**Prinsip Utama:**
- **Unit/Test integrasi**: Ditempatkan bersama implementasi
- **Test E2E**: Direktori terpisah (melintas batas)
- **Test double**: Ditempatkan bersama interface (mock_store.go, taskAPI.mock.ts)
- **Konsistensi pola**: Semua fitur mengikuti struktur yang sama

### Standar Kualitas Test

**Pola AAA (Arrange-Act-Assert / Siapkan-Jalankan-Verifikasi):**
```
// Siapkan: Atur data test dan mock
const user = { id: '123', email: 'test@example.com' };
const mockRepo = createMockRepository();

// Jalankan: Eksekusi kode yang diuji
const result = await userService.createUser(user);

// Verifikasi: Pastikan hasil yang diharapkan
expect(result.id).toBe('123');
expect(mockRepo.save).toHaveBeenCalledWith(user);
```
**Penamaan Test:**

- Deskriptif: `should [perilaku yang diharapkan] when [kondisi]`
- Contoh:
  - `should return 404 when user not found`
  - `should hash password before saving to database`
  - `should reject email with invalid format`

**Persyaratan Cakupan:**

- Unit test: cakupan kode >85%
- Test integrasi: Semua implementasi adapter
- Test E2E: Perjalanan pengguna kritis

### Prinsip Terkait
- Pola Arsitektur - Desain yang Mengutamakan Testabilitas @architectural-pattern.md
- Prinsip Penanganan Error @error-handling-principles.md
- Struktur Proyek @project-structure.md