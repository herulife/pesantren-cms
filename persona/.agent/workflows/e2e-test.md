---
description: Pengujian end-to-end dengan Playwright MCP
---

# Alur Kerja Pengujian E2E

## Tujuan
Memvalidasi perjalanan pengguna lengkap melalui seluruh sistem menggunakan Playwright MCP.

> **Catatan:** Path di bawah mengikuti struktur proyek yang didefinisikan di `project-structure.md`.
> Sesuaikan path agar cocok dengan tata letak proyek yang sebenarnya.

## Kapan Digunakan
- Setelah menyelesaikan epic/milestone
- Sebelum rilis/deploy
- Saat menambahkan alur pengguna kritis

## Prasyarat
- Layanan berjalan (docker compose up atau dev lokal)
- Implementasi fitur selesai
- Unit dan test integrasi lulus

## Langkah-langkah

### 1. Jalankan Layanan
Pastikan seluruh stack berjalan:
```bash
docker compose up -d
# Tunggu health check
docker compose ps
```

Atau development lokal:
```bash
# Terminal 1: Backend
cd apps/backend && go run cmd/api/main.go

# Terminal 2: Frontend  
cd apps/frontend && pnpm run dev
```

### 2. Buat Rencana Test E2E
Dokumentasikan kasus test di `e2e/{fitur}-{ui|api}.e2e.test.ts`:
- Alur jalur bahagia
- Penanganan error
- Kasus tepi

### 3. Eksekusi dengan Playwright MCP

**Navigasi ke halaman:**
```
mcp_playwright_browser_navigate(url="http://localhost:5173/login")
```

**Tangkap status halaman:**
```
mcp_playwright_browser_snapshot()
```

**Berinteraksi dengan elemen (gunakan ref dari snapshot):**
```
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")
```

**Tunggu hasil:**
```
mcp_playwright_browser_wait_for(text="Selamat Datang")
```

**Ambil screenshot untuk dokumentasi:**
```
mcp_playwright_browser_take_screenshot(filename="docs/e2e-screenshots/{fitur}-{deskripsi}.png")
```

### 4. Dokumentasikan Hasil

**Lokasi screenshot:** `docs/e2e-screenshots/{fitur}-{deskripsi}.png`

1. Buat `docs/e2e-screenshots/` jika belum ada
2. Simpan semua screenshot di sana dengan nama deskriptif (misalnya, `auth-login-sukses.png`, `task-buat-formulir.png`)
3. Sematkan screenshot di artefak walkthrough menggunakan `![deskripsi](file:///path/ke/screenshot.png)`
4. Catat kegagalan atau masalah apapun
5. Perbarui file test jika diperlukan

## Struktur Test E2E

```
e2e/
├── api/
│   └── task-crud-api.e2e.test.ts    # E2E khusus API
└── ui/
    ├── auth-flow-ui.e2e.test.ts     # E2E Browser
    └── task-flow-ui.e2e.test.ts
```

## Contoh: E2E Alur Auth

```typescript
// e2e/ui/auth-flow-ui.e2e.test.ts
describe('Alur Autentikasi', () => {
  it('harus mendaftarkan pengguna baru', async () => {
    // Navigasi ke halaman daftar
    // Isi formulir
    // Kirim
    // Verifikasi redirect ke dashboard
  });

  it('harus login pengguna yang ada', async () => {
    // Navigasi ke halaman login
    // Isi kredensial
    // Kirim
    // Verifikasi dashboard dimuat
  });

  it('harus menampilkan error untuk kredensial tidak valid', async () => {
    // Navigasi ke halaman login
    // Isi kata sandi yang salah
    // Kirim
    // Verifikasi pesan error
  });
});
```

## Kriteria Penyelesaian
- [ ] Semua alur pengguna kritis diuji
- [ ] Screenshot ditangkap untuk walkthrough
- [ ] Tidak ada masalah yang memblokir ditemukan
