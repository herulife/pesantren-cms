# Lonceng Notifikasi Admin (Notification Bell) — Design

Tanggal: 2026-10-07
Repo: `darussunnah` (repo pesantren-cms, branch `feat/redesign-home`)
Area: apps/frontend, apps/backend

## 1. Ringkasan

Ganti tombol "X" (tutup menu cepat) yang selalu tampil di pojok kanan header Panel Admin
saat dilihat di HP, dengan **lonceng notifikasi**. Lonceng menampilkan badge jumlah item
yang masih menunggu diproses, dan panel berisi daftar item terbaru per jenis yang
menautkan ke halaman admin terkait. Tidak ada tabel notifikasi baru — jumlah dihitung
langsung dari data yang ada sehingga otomatis berkurang setelah item diproses.

## 2. Masalah

- `DashboardLayout.tsx` (apps/frontend/src/components/) menampilkan tombol `X` (baris ~60-67)
  hanya di layar `lg:hidden` (HP), berlabel aksesibilitas "Tutup menu cepat".
- Fungsinya redundan: sidebar sudah bisa ditutup lewat tombol hamburger (toggle) dan overlay.
- User ingin area pojok kanan tersebut menjadi lonceng notifikasi untuk:
  daftar PSB baru, pesan kontak baru, dan donasi baru.

## 3. Sumber Notifikasi (stateless, computed)

| Jenis            | Kondisi "belum diproses"      | Halaman tujuan admin      |
|------------------|-------------------------------|---------------------------|
| Daftar PSB baru  | `registrations.status = 'pending'` (Menunggu Verifikasi) | `/admin/psb`      |
| Pesan kontak baru| `messages.is_read = 0`         | `/admin/messages`         |
| Donasi baru      | `donations.status = 'pending'` (Menunggu) | `/admin/donations`   |

Badge total = penjumlahan seluruh section yang tampil untuk role user.

## 4. Akses per Role

Ringkasan hanya menyajikan section yang menjadi area kerja role tsb:

- `superadmin` → semua (PSB + pesan + donasi)
- `panitia_psb` → PSB + pesan
- `bendahara` → donasi
- `tim_media` → tidak ada section (badge tidak ditampilkan / kosong)

## 5. Backend

Endpoint baru: `GET /api/admin/notifications/summary`

- Auth: `auth.AuthMiddleware` + `auth.RequireRole("superadmin", "panitia_psb", "bendahara", "tim_media")`
- Lokasi: `apps/backend/internal/features/notifications/` (handler + repository baru)
- Query efisien: `SELECT COUNT(*)` + `LIMIT 5` terbaru per tabel, dengan indeks yang sudah
  ada atau cukup untuk skala kecil (SQLite lokal).
- Respons (200):
  ```json
  {
    "success": true,
    "data": {
      "total": 3,
      "sections": [
        {
          "type": "psb",
          "label": "Daftar PSB Baru",
          "count": 1,
          "items": [ { "id": 12, "title": "Registrasi PSB: Ahmad", "time": "2 jam lalu" } ]
        },
        {
          "type": "message",
          "label": "Pesan Kontak Baru",
          "count": 1,
          "items": [ { "id": 5, "title": "Pesan dari Budi", "time": "kemarin" } ]
        },
        {
          "type": "donation",
          "label": "Donasi Baru",
          "count": 1,
          "items": [ { "id": 3, "title": "Donasi Rp500.000 dari Siti", "time": "3 hari lalu" } ]
        }
      ]
    }
  }
  ```
- `time`: label relatif ringkas (Baru saja / N menit lalu / N jam lalu / kemarin / N hari lalu)
  dihasilkan backend — tanpa bundle lib tanggal di frontend.
- Error handling: ikuti pola JSON respons handler lain (`{success, message, data}`).

## 6. Frontend

- Komponen baru: `apps/frontend/src/components/admin/NotificationBell.tsx` (client component).
  - Icon `Bell` (lucide-react), badge merah dengan `total` bila > 0.
  - Klik → panel dropdown berisi tiap section: label + item (title, time), link ke halaman
    tujuan; akhir tiap section ada link "Lihat semua".
  - Tutup saat klik di luar / tekan Esc.
  - Polling tiap 30 detik (`setInterval`) + refetch saat `window` `focus`. Hentikan saat unmount.
  - Fetch pola `fetch(url, { cache: 'no-store' })` + cookie auth (sama dengan API helper lain).
  - Fetch gagal → sembunyikan badge/panel, log konsol; tidak mengganggu UI.
- `DashboardLayout.tsx`:
  - Hapus tombol X (baris ~60-67).
  - Render `<NotificationBell />` di header, tampil di semua ukuran layar (di samping nama/role).
- Route frontend ke backend: reuse proxy `/api/:path*` (rewrite ke `localhost:8080/api`) —
  panggil `/api/admin/notifications/summary`.

## 7. Data Flow

`DashboardLayout (client)` → `NotificationBell` → `GET /api/admin/notifications/summary` →
badge & panel → klik item → halaman admin (`/admin/psb` dsb.) → item diproses (status/read
diubah) → polling berikutnya badge berkurang otomatis.

## 8. Error Handling & Edge Case

- DB kosong / semua diproses → `total = 0`, badge tidak tampil, panel kosong ("Tidak ada
  notifikasi baru").
- Role `tim_media` → sections kosong, badge tersembunyi.
- Request gagal / 401 sesi habis → badge disembunyikan, tidak ada error keras.
- Polling tidak memblokir render; panel menampilkan data terakhir yang sukses.

## 9. Testing

- Backend: `go test ./...` hijau; unit test handler summary (return sections sesuai role,
  empty case).
- Frontend: `npx tsc --noEmit` hijau.
- Build & deploy (docker compose) frontend + backend.
- Live check: login admin → buka panel → badge 0; submit pesan via form Kontak publik →
  badge pesan naik; tandai dibaca → badge turun. Cek tampilan HP (X hilang, bell muncul).

## 10. Non-Goals

- Tidak ada tabel notifikasi baru / read-state per notifikasi.
- Tidak ada real-time push (websocket/SSE) — cukup polling 30 detik.
- Tidak menyentuh halaman publik (website shell) kecuali ekstraksi label notifikasi.
- Tidak menambahkan fitur "tandai semua dibaca" (badge otomatis turun saat item diproses).