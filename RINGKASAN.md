# RINGKASAN PROYEK ALMA-PARUNG — Handoff Antar Agen
> Terakhir diperbarui: 2026-10-01 (Jilid 70 - foto avatar tampil di Sidebar admin + menu cepat; Jilid 69 - unggah foto avatar profil di `/admin/akun`; Jilid 68 - avatar profil di header + halaman `/admin/akun` dengan ganti password sendiri; Jilid 67 Kategori Murid; Jilid 66 tombol No. Rekening deep-link; Jilid 65 hapus total BGN + import ulang Santri). Baca seluruh file ini SEBELUM menyentuh apa pun.

## 0. ATURAN WAJIB UNTUK AGEN PENERUS (baca dulu!)

> **Baru 28 Sep 2026:** file `HANDOFF.md` di root repo adalah serah terima lengkap — apa yang sudah selesai, 8 pekerjaan terbuka (A-H) + langkah eksekusinya, dan gotcha teknis. Baca `HANDOFF.md` kalau mau lanjut; daftar TODO singkat tetap di §5 bawah.
1. **Jangan timpa kerja agen lain.** Cek file `.bak-*` dan `git status` sebelum edit. Ada beberapa agen aktif di repo yang sama.
2. **Skema kerja "jilid":** tulis patch `apply_jilidNN.py` → `scp` ke server → dry-run di `/tmp/jNN_test` → cocok → apply → `tsc` (frontend) → `docker build` → deploy ganti container → verifikasi.
3. **Jangan pernah re-run patch script yang sudah di-apply** (tidak idempoten — anchor hilang, bisa duplikat kode). Selalu `--dry` dulu.
4. **Backup dulu** untuk perubahan destruktif (DB: copy `data/alma-parung.db` + catat; kode: catat git HEAD).
5. **WAJIB MENCATAT**: setiap selesai kerja, tambahkan entri baru di bagian **## RIWAYAT** di bawah (format sudah ada) + update **## STATUS LIVE** bila berubah. Agen yang tidak mencatat = kerjanya dianggap tidak ada.
6. Jangan commit/push/pull tanpa perintah user. Jangan ubah `.env`, password, atau secret.
7. Verifikasi via eksekusi (curl ke `https://almaparung.com`, cek `docker logs`, baca DB), bukan asumsi.

## 1. AKSES SERVER
- SSH: `SSHPASS='H3ru@2026' sshpass -e ssh -p 2480 heru@103.107.206.5` (password SSH **belum dirotasi** — TODO lama)
- SCP: `SSHPASS='H3ru@2026' sshpass -e scp -P 2480 <lokal> heru@103.107.206.5:<remote>`
- Repo: `~/alma-parung` (git). DB live: `/home/heru/alma-parung/data/alma-parung.db` (sqlite; **tidak ada** binary `sqlite3`/`go` → pakai `python3`, build via docker).
- Backup terakhir: `~/alma-parung/backups/pre-role-20260926-211855.db` (titik restore sebelum perombakan peran).

## 2. STATUS LIVE
| Layanan | Container | Image | Keterangan |
|---|---|---|---|
| Backend | `alma-parung-backend` | `alma-parung-backend:j69-avatar` | Jilid 69 (`PUT/DELETE /api/me/photo` + kolom `users.photo_url`), Jilid 68 (`PUT /api/me/password`), Jilid 67 (Kategori Murid + fix scan `FindByUserID`), Jilid 65. Healthy, **WAJIB `-p 8090:8080`** karena nginx mem-proxy `/api/` ke 8090. Rollback: `j68-akun`. |
| Frontend | `alma-parung-frontend-bobot` | `alma-parung-frontend:j70-avatar` | Jilid 70 (foto avatar tampil di sidebar admin + tombol bulat & panel menu cepat), Jilid 69 (unggah/potong/hapus foto avatar di `/admin/akun`), Jilid 68 (avatar profil di header + halaman `/admin/akun`), Jilid 67 (dropdown Kategori di `/admin/kesantrian/form`), Jilid 66. Healthy, **WAJIB `-p 3002:3000`**. Rollback: `j68-akun`. |
| Store | `alma-store` | `latest` | terpisah, jangan sentuh |
| Rollback tersedia | — | backend `j68-akun`(terbaru)+`jilid65-bgnclean`+`fix-nullsanti-v2`; frontend `j68-akun`(terbaru)+`psbrektab`+`arbain-bgn2` | container lama: `alma-parung-frontend-bobot-j69` (Jilid 70, image `alma-parung-frontend:j69-avatar`), `alma-parung-backend-pre-j69`, `alma-parung-frontend-bobot-pre-j69` (Jilid 69); `alma-parung-backend-pre-j68`, `alma-parung-frontend-bobot-pre-j68` (Jilid 68); `alma-parung-backend-pre-jilid65` (image `fix-nullsanti-v2`), `alma-parung-frontend-bobot-pre-psbrektab` (image `arbain-bgn2`) |
| DB | — | — | **Recount 1 Okt 2026 12:26 WIB (Jilid 69, python3 ke `data/alma-parung.db`): `santri` 103, `users` 122** — status: 76 `aktif`, 24 `lulus`, 3 `pindah` (TIDAK ada `cuti`); `category`: 102 `reguler`, 1 `yatim`. **Angka-angka lama di §5 item 1/1b/1c/2/3/4 (116/124, 113/2/1, 74/119) SUDAH KEDALUWARSA — jangan dipakai.** Penyebab penurunan hanya sebagian yang bisa dijelaskan: `docker logs` container lama mencatat `DELETE /api/santri/{id}/purge` 200 pada 09:37-09:45 (10x) dan 11:45-11:46 (2x), plus `DELETE /api/users/201` 200 pada 10:39 — jadi sebagian baris memang dihapus lewat UI/API, sisanya belum dijelaskan (lihat §5 item 2). `users.photo_url` **baru ada** (migrasi Jilid 69, TEXT nullable, semua NULL = semua masih pakai inisial). Folder upload avatar: `data/uploads/avatars/`. `registrations` tetap **kosong**; `bgn_recipients` + `bgn_recipients_archive` + kolom `santri.bgn_identity`/`bgn_recipient` **sudah di-DROP**; `santri.father_occupation`/`mother_occupation` dibuat Jilid 67 |

Deploy backend (catatan: JWT dari `.env`, DAHL key tetap):
```
cd ~/alma-parung && NEWJWT=$(grep "^JWT_SECRET=" .env|head -1|cut -d= -f2-) && docker stop alma-parung-backend && docker rm alma-parung-backend && docker run -d --name alma-parung-backend --restart always -p 8090:8080 -e DB_PATH=/data/alma-parung.db -e JWT_SECRET="$NEWJWT" -e API_PORT=8080 -e DAHL_API_KEY="$DAHLKEY" -e DAHL_API_URL=https://inference.dahl.global/v1 -v /home/heru/alma-parung/data:/data -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads alma-parung-backend:<TAG>
```

## 2.1 CATATAN SINGKAT UNTUK AGEN PENERUS (state 28 Sep 2026)
**Empat pekerjaan terakhir (paling baru: **jilid 45** tutorial `/admin/help` + pembersihan storage) — semuanya sudah live, sudah diverifikasi, sudah penuh di §4 dan `HANDOFF.md` §3:** — semuanya sudah live, sudah diverifikasi, sudah penuh di §4:**
1. Bobot nilai per mapel + kolom UH → image `bobot` (backend & frontend).
2. **Jilid 43** — RBAC: `GET /api/school/classes` + `/years` dibuka ke `wali_kelas` & `pimpinan` (dulu 403 → dropdown **Kelas** kosong di form Kesantrian). Image backend `jilid43`.
3. **Jilid 44** — field **Kelas** & **Status** di `/admin/kesantrian/form` diganti dropdown kustom (`SelectField`), bukan `<select>` native. Image frontend `jilid44`.

**Yang perlu dipantau:**
- Tunggu konfirmasi user di Android/Chrome untuk jilid 44 (TODO 8).
- Akun `wali_kelas`/`pimpinan` belum ada (Jilid C masih terblokir awaiting user) → bug RBAC kelas hanya terlihat setelah role itu dibuat; uji role cukup lewat container uji.
- Bobot UH: nilai lama tidak dihitung ulang (TODO 5 & 6).

**Peringatan operasional:**
- Nama container frontend masih `alma-parung-frontend-bobot` (nama tidak ikut tag image `jilid44`). Script deploy lama di lokal (`/tmp/opencode/bobot/deploy_frontend.sh`) menunjuk `alma-parung-frontend-kkm` yang sudah dihapus → akan gagal. Pakai `/tmp/deploy_front44.sh` (server) atau tulis ulang:
  `docker stop alma-parung-frontend-bobot && docker rm alma-parung-frontend-bobot && docker run -d --name alma-parung-frontend-bobot --restart unless-stopped -p 3002:3000 alma-parung-frontend:<TAG>`
- Backend WAJIB tetap `-p 8090:8080` (nginx proxy `/api/`), frontend WAJIB `-p 3002:3000`. Jangan ubah nama container/port tanpa cek nginx.
- `/admin/*` butuh sesi; tanpa cookie balas 307 ke `/login` (bukan error).

**Pola verifikasi cepat (dipakai jilid 43/44, tidak menyentuh produksi):**
- Build image → container uji di port cadangan + salinan DB → uji → baru ganti container produksi. Backend: `docker run -d --name j43test -p 8099:8080 --env-file /tmp/env-alma-backend.txt -v /tmp/j43data:/data alma-parung-backend:<TAG>`. Frontend: `docker run -d --name j44test -p 3003:3000 alma-parung-frontend:<TAG>` (rewrite `/api` di `next.config.ts` otomatis mengarah ke `https://almaparung.com`, jadi API tetap hidup tanpa konfigurasi tambahan).
- Uji API per-role: JWT HS256 buatan sendiri, claims `{id,email,role,token_version,iat,jti,exp}`; `role` + `token_version` WAJIB sama dengan DB (`validateSession`) → untuk role tanpa akun, buat user uji di DB **salinan**, jangan di DB produksi.
- Uji UI/DOM: playwright-core + chromium headless di server — binary `/home/heru/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`, wajib `LD_LIBRARY_PATH=/tmp/chromelibs/usr/lib/x86_64-linux-gnu`, contoh skrip di `/tmp/pgl/`. Login diinjeksi lewat cookie `alma_token`.

## 3. STRUKTUR PERAN (pekerjaan berjalan — baca ini!)
Keputusan user (final): `PIMPINAN (read-only) > ADMIN > WALI KELAS (kelasnya) / GURU (mapelnya) / USTADZ (tahfidz+kesantrian)`.
- **Jilid A (SELESAI, live):** backend + migrasi `users_role_check_v2`, `platform/scope`, guard nilai/rapor/kesantrian/tahfidz/project/exam/santri, grup route baru, CBT pindah ke grup guru. Uji 16/16 lolos. Dampak: `tim_media`/`bendahara` kini 403 di akademik.
- **Jilid B (SELESAI, live):** frontend per-role (roleMenus+guru picker+wali_user_id di school/kelas/mapel, tombol Kunci rapor disembunyikan utk pimpinan, default tab ustadz=kesantrian).
- **Jilid C (BELUM, butuh input user):** akun perdana + assignment. **BLOKIR: tunggu daftar nama+email+peran dari user.**
- File kunci: `platform/scope/scope.go`, migrasi di `platform/database/db.go`, guard di handler academics/raport/project/exams/santri. Detail lengkap: `CATATAN-JILID42.md` §25.

## 4. RIWAYAT (tambahkan entri baru di bawah, JANGAN hapus yang lama)
Format entri: `## Jilid NN — JUDUL (tanggal, status)` + apa diubah (file+fungsi) + cara verifikasi + dampak.

## Jilid 70 - Foto avatar tampil di Sidebar admin + menu cepat (1 Okt 2026, LIVE)

**Titik awal:** Jilid 69 membuat unggah/potong/hapus foto di `/admin/akun`, tapi
avatar hanya dipakai di header dashboard dan portal. Dua komponen masih
menampilkan inisial sendiri, dan satu klaim di §5 ternyata **salah**:

- `FloatingQuickMenu.tsx` benar-benar masih inisial manual di dua tempat —
  kepala panel saat menu dibuka, dan tombol bulat mengambang (FAB).
- `Sidebar.tsx` **tidak punya avatar user sama sekali**. Kotak `A` di header
  sidebar adalah logo aplikasi "Al-Maa"; footer hanya berisi tombol `Keluar`.
  Jadi ini fitur baru (blok identitas), bukan sekadar menyalakan foto yang
  sudah ada. Nama dan role user juga tidak terlihat di sidebar sebelumnya.

**Keputusan desain** (sudah dikonfirmasi user sebelum dikerjakan):
1. Foto ikut tampil di tombol bulat mengambang.
2. Sidebar dapat blok identitas baru di atas tombol Keluar.

**Perubahan:**
- `UserAvatar.tsx`: tambah dua ukuran, `h10` (40px, untuk kepala panel) dan
  `h14` (56px, untuk tombol bulat). Ukuran lama xs/sm/md/lg tidak cukup —
  panel dan FAB punya ukuran sendiri. Menambah kunci baru lebih dapat
  diprediksi daripada menyuruh `className` menimpa `h-8`/`h-9`: Tailwind
  menentukan MENANG berdasarkan urutan di file CSS, bukan urutan atribut,
  jadi timpaan seperti itu bisa berubah hasil tergantung urutan build.
- `FloatingQuickMenu.tsx`: `const initial` dihapus; kepala panel dan FAB
  sekarang `<UserAvatar>`. Tamu yang belum login tetap melihat ikon `LogIn`.
- `Sidebar.tsx`: blok identitas (avatar + nama + role) di atas tombol Keluar,
  hanya dirender kalau `user` ada.
- `DashboardLayout.tsx`: komentar "model User tidak punya kolom foto" basi
  sejak Jilid 69 — dikoreksi.

**Kenapa backend tidak disentuh:** semua perubahan di sisi frontend saja.
`users.photo_url` sudah ada, dan `GET /api/me` sudah mengirim `photo_url`.

**Catatan penting soal smoke test:** `FloatingQuickMenu` memakai kelas
`lg:hidden` kalau props `desktop` tidak diisi — di >=1024px tombol bulat
**sengaja tidak terlihat** di dashboard, dan smoke test harus mengeceknya di
viewport mobile (390x844). Dua jebakan yang sudah ketahuan saat menguji:
- Field multipart bernama **`image`**, bukan `file`
  (`SaveSanitizedImage(r, "image", avatarSubdir)`).
- Backend menolak gambar **di bawah 100x100** (DESIGN.md), jadi PNG uji harus
  dibuat >= 100x100.
- Chromium tidak bisa jalan di host (tidak ada `libatk`); smoke UI harus
  lewat container `mcr.microsoft.com/playwright:v1.49.0-jammy`.

**Verifikasi:** `tsc --noEmit` exit 0; `eslint` 4 berkas 0 error (2 warning
lama: `<img>` yang disengaja di `UserAvatar`, dan `exhaustive-deps` di
`Sidebar.tsx:109`); build image sukses; smoke UI **29/29 pass** — foto muncul
bersamaan di header + sidebar + tombol bulat + panel menu cepat (desktop dan
mobile), semua menunjuk file yang sama, ukuran avatar sesuai (36/40/56px),
nama & role tetap tampil, dan setelah `DELETE` semua kembali ke inisial tanpa
sisa file.

**Jejak test sudah bersih:** `users.photo_url` non-NULL = 0, folder
`data/uploads/avatars/` kosong, tidak ada `.tmp` yatim, container uji
`alma-parung-frontend-j70test` di-remove.

## Jilid 69 - Unggah foto avatar profil di `/admin/akun` (1 Okt 2026, LIVE)

**Titik awal:** Jilid 68 (agen sebelumnya) memilih avatar **inisial huruf** karena
model `User` tidak punya kolom foto sama sekali. Backend Jilid 69 sudah
lengkap dan tercommit (9 commit `cfad845`..`1aaf895`), tapi **tidak pernah di-build,
tidak pernah di-deploy, dan tidak pernah didokumentasikan** — working tree bersih
sambil menyisakan kode mati. Bagian frontend juga belum ada: tidak ada UI upload,
tidak ada helper API, `setUserPhoto()` di `AuthProvider` yatim tak terpakai.

Jilid 69 menutup keduanya: **avatar inisial tetap jadi fallback**, tapi sekarang
user bisa memasang foto sendiri.

### 1. Yang sudah ada dari agen sebelumnya (tinggal dibuild)

- `apps/backend/internal/features/upload/avatar.go` (baru) — `HandleMyPhoto` (PUT)
  & `HandleDeleteMyPhoto` (DELETE). Sanitasi gambar: decode → resize → re-encode,
  sehingga metadata EXIF (termasuk koordinat GPS) hilang. Disimpan random-name ke
  `public/uploads/avatars/`, path relatif dikembalikan (`/uploads/avatars/<nama>`).
- `apps/backend/internal/features/auth/repository.go` — `PhotoURL *string` di
  `User` (json `photo_url`, sengaja tanpa `omitempty` supaya frontend bisa bedakan
  `""` vs tidak ada), `SetPhotoURL(id, *string)`, dan scan di `FindByEmail` /
  `FindByID` / `GetAllUsers`.
- `apps/backend/internal/platform/database/db.go` — migrasi
  `addColumnIfNotExists("users", "photo_url", "TEXT")`.
- `apps/backend/cmd/api/main.go` — `PUT/DELETE /api/me/photo` (di grup auth,
  pakai `uploadLimiter`).
- `apps/backend/internal/features/upload/handler.go` — di-refactor supaya
  `HandleUpload` dan avatar berbagi `SaveSanitizedImage` (satu implementasi
  sanitasi, tidak bisa drift).(kind=proof tetap menerima PDF).
- `apps/frontend/src/components/UserAvatar.tsx` (baru) — foto + fallback inisial,
  dipakai `DashboardLayout` (header) & `portal/layout.tsx`.

### 2. Dua bug yang tertinggal di kode agen sebelumnya

Kode itu belum pernah di-tsc, jadi dua hal ini masih ada:

**a. `tsc` gagal — TS1016.** `UserAvatar.tsx:23` punya
`function initialsOf(name?: string | null, count: number)` — parameter wajib
(`count`)menusul parameter optional (`name`), tidak sah di TypeScript. Fix:
`name: string | null | undefined` (perilaku identik).

**b. `eslint` error — `react-hooks/set-state-in-effect`.** Pola lama
`useEffect(() => setFailed(false), [src])` untuk reset error saat foto berganti
adalah cascading render. Diganti pola tanpa effect: simpan **path yang gagal
dimuat**, bukan boolean — `const [failedSrc, setFailedSrc] = useState<string|null>(null)`
lalu `const failed = failedSrc === src`. Kalau `src` berganti, `failedSrc` lama
otomatis tidak sama dengan `src`, jadi tampil inisial tanpa reset manual.

### 3. Bagian frontend yang ditambahkan

**`lib/api.ts`** — dua helper (anchor: setelah `changeMyPassword`):

```ts
export async function uploadMyPhoto(file: File)   // PUT    /api/me/photo
export async function deleteMyPhoto()              // DELETE /api/me/photo
```

`uploadMyPhoto` pakai `rawFetch` + `credentials: 'include'` seperti `uploadImage`
(foto HP besar lewat koneksi lambat sering terputus bila ikut timeout 30 detik
`apiFetch`).

**`app/admin/akun/page.tsx`** — section **Foto Profil** di atas section Ganti Password:
input file tersembunyi (`accept="image/jpeg,image/png,image/webp"`) → validasi tipe
& ukuran 5MB di sisi klien → `ImageCropperModal` **aspect 1:1** (potong bujur
sangkar, konsisten dengan `teachers/form`) → `uploadMyPhoto`. Hasilnya dikirim ke
`setUserPhoto()` dari `AuthProvider`, jadi **header + sidebar ikut berubah tanpa
reload halaman**. Tombol **Hapus Foto** hanya muncul kalau `photo_url` terisi, dan
`DELETE` mengembalikan user ke inisial.

Avatar besar di section Identitas Akun juga diganti dari lingkaran inisial hardcode
jadi `<UserAvatar size="lg">`, supaya preview = avatar yang dipakai header.

### 4. Cara verifikasi

- `tsc --noEmit --incremental false` → **exit 0** (sebelumnya exit 2 karena TS1016).
- `eslint` 3 berkas berubah → **0 error** (2 warning sisa sudah ada sebelumnya:
  `no-img-element` di `UserAvatar.tsx` + `catch (e)` di `api.ts:3429`).
- **Smoke API 22/22**, dua kali: container uji (port 8099 + salinan DB di `/tmp`) lalu
  live. Cakupannya: 401 tanpa token (PUT & DELETE) → upload valid 200 + file benar-benar
  ada di disk + bisa diambil via HTTP → `GET /api/me` mengembalikan `photo_url` →
  400 file teks → 400 gambar 50x50 → **413 >5MB** → ganti foto: path berubah, file lama
  terhapus, **tidak ada file yatim** → DELETE 200 + `photo_url` null + folder kosong →
  DELETE lagi tetap 200 (tidak crash).
- **Smoke UI 22/22** via playwright (chromium headless, cookie `alma_token` di-inject,
  `LD_LIBRARY_PATH=/tmp/chromelibs/...`): modal crop terbuka → "Terapkan (Potong)" →
  `PUT 200` → avatar jadi `<img>` `naturalWidth > 0` → header berubah tanpa reload →
  ganti foto (path berubah) → "Hapus Foto" → `DELETE 200` → avatar & header balik
  ke inisial → nol 4xx/5xx, nol `pageerror`.
- Jejak smoke test dihapus: `users.photo_url` NULL semua, `data/uploads/avatars/` kosong.
  Container uji `j69test`/`j69front` sudah `docker rm -f`.

### 5. Dampak & catatan

- Migrasi bersifat aditif (kolom TEXT nullable) — aman, tapi **tidak bisa di-rollback
  lewat image lama**: image `j68-akun` tidak tahu `users.photo_url`, jadi kalau rollback
  ke `j68-akun` kolom itu tetap ada (harmless, diabaikan).
- `DELETE /api/me/photo` menghapus file milik user itu saja. `deleteOwnedAvatar`
  menolak path yang tidak persis `/uploads/avatars/<nama>` dan menolak `..`, jadi
  path rusak di DB tidak bisa menghapus file lain.
- Avatar **tidak** kompatibel dengan `next/image` (pakai `<img>` telanjang, 36-96px).
  Warning `no-img-element` muncul karena itu disengaja — sudah dijelaskan di
  komentar komponen.
- Nginx sudah benar: `location /uploads/` mem-proxy ke 8090, jadi file avatar
  (`/uploads/avatars/...`) disajikan tanpa perlu ubah config.
- **Pekerjaan lanjutan (§5 item 2z):** `components/Sidebar.tsx` dan
  `components/FloatingQuickMenu.tsx` masih menggambar inisial sendiri — foto yang
  baru diunggah **tidak muncul di sana**.

"""

## Jilid 68 - Avatar profil di header + halaman "Akun Saya" (ganti password sendiri) (1 Okt 2026, LIVE)

**Order user (setelah ditanya kenapa ada ikon X di pojok kanan dashboard):** user justru
**mau avatar profil** di titik itu. Setelah user ditanya, dipilih: **halaman baru
`/admin/akun`**, **avatar berupa inisial huruf**, dan **tombol X yang mati dihapus**.

### 1. Bug yang ditemukan & dibetulkan: tombol "X" di header

`components/DashboardLayout.tsx` punya tombol `aria-label="Tutup menu cepat"` di pojok kanan
header, `onClick={() => setIsMobileSidebarOpen(false)}`, `className="... lg:hidden"`. Tombol ini
**mati di semua kondisi**:

- Sidebar tertutup (kondisi saat X terlihat — `isMobileSidebarOpen === false`):
  `setFalse(false)` = no-op.
- Sidebar terbuka: backdrop `DashboardLayout.tsx:20` (`z-40`) menutupi header
  (`z-30`), jadi X tidak receive klik. Yang dipakai justru tombol X di dalam sidebar
  (`Sidebar.tsx:141-147`, `lg:hidden`, memanggil `onClose` yang sama).

Jadi ini duplikat yang tidak pernah kepakai. **Sidebar sudah punya tombol tutup sendiri** —
`DashboardLayout.tsx` cukup pakai hamburger (`Menu`, `lg:hidden`) untuk membuka.

### 2. Avatar profil (menggantikan X)

`components/DashboardLayout.tsx:56-74` — header kanan kini:

```tsx
<Link href="/admin/akun" aria-label="Akun saya" title="Akun Saya"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600
                 text-sm font-black text-white shadow-sm transition hover:bg-sky-700
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
  {(user?.name || 'A').trim().charAt(0).toUpperCase()}
</Link>
```

Import `X` dihapus dari baris 5 (sisanya `Menu` masih dipakai). Avatar **tidak** `lg:hidden`
— sengaja tampil di desktop juga, karena nama + role di sebelahnya disembunyikan di
`< sm` (`hidden sm:block`).

**Kenapa inisial, bukan foto:** model `User` (`features/auth/repository.go:30-39`) tidak punya
kolom foto sama sekali — bukan di DB, bukan di JSON API, bukan di `UserData` frontend. Menambah
fitur foto berarti kolom DB + endpoint upload + UI. Inisial sudah konsisten dipakai
`FloatingQuickMenu.tsx:73` (`initial`), jadi tidak ada pola baru.

### 3. Halaman baru `/admin/akun`

`apps/frontend/src/app/admin/akun/page.tsx` (baru, ~190 baris) — dua section:

1. **Identitas akun** (avatar inisial besar, nama, email, role dengan label Indonesia dari
   `roleLabels`) + catatan bahwa nama/email/role dikelola Super Admin di `/admin/users`.
2. **Ganti Password** — 3 field (`old_password`, `new_password`, `confirm_password`) +
   peringatan bahwa semua sesi akan keluar.

Helper API baru `changeMyPassword()` di `lib/api.ts:2002-2013`.

**Tidak ada entri sidebar untuk `/admin/akun`** — itu disengaja. Menu sidebar dibangun dari
`ROLE_MENU_DEFS` (`lib/roleMenus`) yang juga menggerakkan checkbox "Hak Akses" di Manajemen
Pengguna; halaman akun bersifat per-user, bukan modul per-role. `groupOfPath()`
(`Sidebar.tsx:78-88`) mengembalikan `null` untuk path di luar katalog → tidak ada grup yang
ter-highlight, tidak ada crash. Satu-satunya pintu masuk = avatar.

### 4. Backend: `PUT /api/me/password`

- `validators/auth.go` — `ChangePasswordRequest{old_password, new_password, confirm_password}`
  + `ValidateChangePasswordRequest` (≥8 karakter, harus beda dari password lama, konfirmasi
  harus cocok). Password **tidak** di-trim — spasi bisa bagian password yang sah.
- `features/auth/handler.go` — `ChangeMyPassword` (setelah `GetMe`): ambil user dari
  `GetAuthenticatedUser(r)`, cocokkan password lama dengan `repo.CheckPassword`, lalu
  `repo.UpdatePassword`. Semua method yang dipakai sudah ada di `IRepository` (`handler.go:816`)
  jadi tidak perlu ubah interface. Audit `CHANGE_OWN_PASSWORD` + `logger.RecordActivity`
  mengikuti pola `ResetUserPassword`.
- `cmd/api/main.go:377` — `r.Put("/me/password", ...)` di grup `auth.AuthMiddleware`.

**Dua keputusan yang perlu diingat agen penerus:**

- **Password lama salah dibalas 400, bukan 401.** `parseResponse()` di
  `frontend/src/lib/api.ts:365-372` me-redirect ke `/login` pada **SETIAP** 401. Kalau 401
  dipakai untuk "password lama salah", user catastrophic-nya terkeluar dari halaman dan
  kehilangan akses ke pesan error yang sebenarnya. Jadi ini ditulis sebagai validation error
  (`errors.old_password`) supaya form bisa menampilkannya inline.
- **Sukses = semua sesi ikut mati.** Handler memanggil `BumpTokenVersion(me.ID)` (sama seperti
  `ResetUserPassword`), jadi response membawa `"reauth": true` dan frontend memanggil
  `logout()`. Aman: `POST /api/logout` (`handler.go:350`) hanya memverifikasi signature JWT
  **tanpa** mengecek `token_version`, lalu `clearAuthCookie(w)` meng-expire cookie — jadi
  `logout()` tetap berhasil walaupun token sudah invalid.

### 5. Verifikasi

Backend (container uji `akuntest` + **salinan** DB, user uji `akun.test@almaparung.local`
dibuat hanya di salinan itu) — **10/10**:

| # | Kasus | Hasil |
|---|---|---|
| 1 | `PUT /api/me/password` tanpa auth | 401 (route ada, bukan 404) |
| 2 | password lama salah | 400 + `errors.old_password` |
| 3 | password baru < 8 char | 400 + `errors.new_password` |
| 4 | konfirmasi tidak cocok | 400 + `errors.confirm_password` |
| 5 | sama dengan password lama | 400 + `errors.new_password` |
| 6 | field JSON asing | 400 (`DecodeStrictJSON`) |
| 7 | ganti sukses | 200 + `reauth: true` |
| 8 | token lama setelah ganti | 401 (sesi benar-benar mati) |
| 9 | login dengan password lama | gagal |
| 10 | login dengan password baru | berhasil |

Frontend (playwright + chromium headless, `LD_LIBRARY_PATH=/tmp/chromelibs/...`):
- `/admin`: avatar `href=/admin/akun`, teks = inisial "A", `[aria-label="Tutup menu cepat"]`
  **tidak ada** lagi, 0 page error.
- Klik avatar → `/admin/akun`, `<h1>Akun Saya`, nama/email/role benar, 3 input password.
- Konfirmasi berbeda → **tidak ada** request ke server (validasi klien menahan).
- Password lama salah di form → pesan "Password lama tidak cocok" tampil **inline**,
  tidak ter-redirect.
- Geometri: avatar 36×36 px, `border-radius` penuh (lingkaran), di kanan header, di dalam
  viewport — desktop 1440px (x=1368) dan mobile 390px (x=338).
- `go build ./...` + `go vet` + `go test ./internal/validators/... ./internal/features/auth/...` → `ok`;
  `npx tsc --noEmit --incremental false` → exit 0.

Deploy: `alma-parung-backend:j68-akun` + `alma-parung-frontend:j68-akun`. Env backend
diambil ulang dari container yang sedang jalan (`docker inspect --format '{{range .Config.Env}}'`)
→ `/tmp/akun_be.env` — **jangan** mengetik ulang `JWT_SECRET` (insiden Jilid 65).
Verifikasi produksi: kedua container `healthy`, `/` 200, `/api/ready` 200,
`GET /admin/akun` tanpa cookie 307 (route ada), `PUT /api/me/password` tanpa auth 401,
bundle memuat "Akun saya" dan **tidak** lagi memuat "Tutup menu cepat", 0 error signature.
DB produksi **tidak** tersentuh: 116 Santri, 124 users, tidak ada user uji yang bocor.

Rollback: container `alma-parung-backend-pre-j68` + `alma-parung-frontend-bobot-pre-j68`
(keduanya image `jilid67-kategori`).

**Belum diuji:** pergantian password pada akun staff **sungguhan** di produksi (butuh kredensial
user, jadi sengaja tidak dicoba). Perilaku diuji penuh di container uji dengan user uji.

---

## Jilid 67 - Kategori Murid (`santri.category`) sebagai sumber tunggal, ikut dari PSB (1 Okt 2026, LIVE)

**Order user:** kategori (reguler/yatim/dhuafa) harus punya satu sumber kebenaran, tidak boleh
`registrations.category` dan `santri.category` jadi dua nilai yang bisa berbeda.

**Perubahan:**

1. **`internal/validators/validators.go`** — konstanta `CategoryReguler`/`CategoryYatim`/
   `CategoryDhuafa`, slice `CategoryOptions`, dan `NormalizeCategory` (lowercase + trim, alias
   `duafa`/`dhufa`/`poor` → `dhuafa`, nilai asing → `""`), plus `CategoryOrDefault` dan
   `IsValidCategory` (sekarang delegate ke `NormalizeCategory`). Sebelumnya tiap tempat punya
   daftar literal sendiri.
2. **`internal/platform/database/db.go`** — `addColumnIfNotExists` untuk `santri.category`
   (`TEXT DEFAULT 'reguler'`) plus **`father_occupation` + `mother_occupation`**. Dua kolom
   occupation itu sudah ada di model + form tapi **tidak pernah ada di skema** — parity fix,
   bukan fitur baru. Repeat-safe, data lama otomatis dapat `'reguler'`.
3. **`features/psb/handler.go:202`** — `validatePortalRegistration` memakai
   `NormalizeCategory` (sekarang menerima `Duafa`/`Dhuafa`, disimpan bentuk kanonik) dan blok
   validasi kategori yang tadinya terpisah dihapus dari bawah (sudah jadi satu jalur).
4. **`features/psb/repository.go`** — `SaveByUserID` (`:371`) pakai `NormalizeCategory` +
   `validators.CategoryReguler` sebagai default; **`AcceptToSantri` (`:974`)** menyalin
   `validators.CategoryOrDefault(reg.Category)` ke kolom `santri.category` saat PSB
   `accepted`. Kuota yatim/dhuafa + cek dokumen pendukung tetap membaca `registrations.category`
   seperti sebelumnya.
5. **`features/santri/handler.go:210`** — `validateSantri` normalkan kategori (kosong →
   `reguler`, asing → error key `category`), `SantriInput.Category` ikut ke `toSantri()`.
6. **`features/santri/repository.go:376`** — **fix bug `FindByUserID`**: `rows.Scan` punya 26
   argumen sementara query me-select 27 kolom (`category` terlewat) → `sql: expected 26
   destination arguments in Scan, not 27` (endpoint `GET` by user selalu 500). Sekarang scan
   `&x.Category` ditambahkan. ⚠️ Pola yang sama sudah benar di `FindAll`/`FindByID`/`Update`
   (`repository.go:61`, `:107`, `:320`) — kalau menambah kolom baru, **hitung ulang SEMUA
   query Santri**, bukan cuma yang gagal saat test.
7. **Frontend** — dropdown **Kategori** (`SelectField`, bukan `<select>` native) di
   `app/admin/kesantrian/form/page.tsx`; `category?: string` di `lib/api.ts:3520` pada
   interface `Santri`. Edit kirim eksplisit (`form.category || 'reguler'`) supaya `PUT`
   full-replace tidak pernah mengosongkan kolom; record lama tanpa kategori buka dengan
   `reguler` supaya dropdown tidak kosong.

**Skema:** `santri.category` **tidak** bisa difilter lewat query params API — hanya lewat
payload create/update (sengaja, supaya tidak ada dua jalur baca).

**Verifikasi:**
- `go test ./internal/features/psb/... ./internal/features/santri/... ./internal/validators/...`
  → `ok` semua (test baru: `TestAutoAcceptCarriesCategoryToSantri` (5 subtest),
  `TestAutoAcceptCategoryDefaultsToReguler`, `TestAutoAcceptCategoryAliasDuafa`,
  `TestValidateSantriCategory` (9 kasus), `TestSantriInputCarriesCategory`).
- `npx tsc --noEmit --incremental false` → exit 0.
- Deploy `alma-parung-backend:jilid67-kategori` + `alma-parung-frontend:jilid67-kategori`:
  keduanya `healthy`, `GET /` 200, `GET /api/health` 200, `/api/ready` 200.
- DB live: `PRAGMA table_info(santri)` → `category` (`DEFAULT 'reguler'`), `father_occupation`,
  `mother_occupation` ada; 116 baris semua `reguler` (migrasi memberi default, tidak ada
  kategori dari sheet yang diimpor Jilid 65).

---

## Jilid 66 - Tombol "No. Rekening" di Pengaturan PSB langsung ke tab No. Rekening (30 Sep 2026, LIVE)

**Order user:** "di `/admin/psb/pengaturan` waktu klik setting no rekening, arahkan langsung ke
`/admin/settings` **langsung ke tab rekening**".

**Perubahan (1 baris):** `apps/frontend/src/app/admin/psb/pengaturan/page.tsx` —
`href="/admin/settings"` → `href="/admin/settings?tab=No.%20Rekening"` pada tombol
"Buka Pengaturan No. Rekening →".

**Kenapa cukup pakai `?tab=`:** halaman `admin/settings/page.tsx` sudah punya inisialisasi tab dari
query string — `useState(() => new URLSearchParams(window.location.search).get('tab'))`, divalidasi
terhadap daftar `TABS`, jatuh ke `Umum` kalau tidak dikenal. Id tab rekening persis
`'No. Rekening'` (ADA TITIK dan SPASI), jadi harus di-encode. Pola ini sudah dipakai
`admin/teachers/page.tsx:525`, `admin/employees/page.tsx:142`, dan `lib/adminDocs.ts:587`
(`?tab=Staf%20Mengajar`) — konsisten, tidak perlu komponen/ID baru.

⚠️ `?tab=` hanya dibaca saat **mount**. Pindah dari `/admin/psb/pengaturan` aman (routennya beda,
selalu remount), tapi kalau nanti ada tombol similar yang menyasar tab dari **halaman settings
itu sendiri**, `Link` akan melakukan soft navigation dan tab **tidak** berganti — perlu
`router.replace` + `key`, bukan `Link`.

**Verifikasi:** `npx tsc --noEmit --incremental false` → exit 0. Deploy image
`alma-parung-frontend:psbrektab`, container `alma-parung-frontend-bobot` (`-p 3002:3000`,
tanpa mount/env), `curl /` 200, dan klik tombolnya → URL jadi
`/admin/settings?tab=No.%20Rekening` dengan tab **No. Rekening** langsung aktif.

---

## Jilid 65 - Hapus total fitur BGN + import ulang Santri dari master Google Sheet (30 Sep 2026, LIVE)

**Order user (30 Sep):** hapus data Santri lama, bersihkan semua BGN, lalu import ulang
Santri dari master Google Sheet.

**Konteks.** Jilid 63/64 membangun fitur BGN (Penerima Manfaat Beras Bergizi Nasional),
lalu agen sebelumnya menghapus source-nya di `7bcbf6e` (backend) & `f50912d` (frontend) —
tetapi meninggalkan artefak: tabel `bgn_recipients_archive` (71 baris), kolom
`santri.bgn_identity` + `santri.bgn_recipient`, dan `migrateSantriBgnColumns()` di `db.go`.

**Perilaku data Student lama (58 baris) sebelum dihapus:**
```
parent_phone 0/58, father_phone 0/58, mother_phone 0/58  →  TIDAK ADA No HP sama sekali
parent_name  57/58  →  wali ada, tapi hanya 1 field gabungan (tanpa pisah ayah/ibu)
user_id 0/58, registration_id>0 = 0  →  tidak tertaut ke user/PSB mana pun
semua tabel anak (spp_bills, iuran_bills, receipts, payment_transactions) = 0 baris
```
Jadi penghapusan tidak merusak nilai/tagihan/kuitansi apa pun. Backup pra-hapus:
`data/alma-parung.db.bak-preimport-20260930-211354`.

**Master sheet** (120 baris; `No | No Induk | Nama | Jenis Kelamin | Tempat,Tgl Lahir | No Telp | Email | Kelas | Status`).
Sheet **tidak punya kolom nama wali** → 34 wali & 34 gender dari DB lama **di-carry over**
berdasarkan pencocokan nama ternormalisasi, bukan diambil dari sheet.

**Jebakan data yang ditemukan (SEMUA sudah ditangani):**
1. **Kolom gender sheet terbalik** — 45 dari 46 baris yang cocok berbeda dengan DB lama
   (mis. `Alisa Adriana Putri` di sheet "Laki-laki", di DB `p`). Tampaknya kolom geser satu
   baris. → **tidak dipakai**; gender hanya dari DB lama (34 terisi), sisanya kosong.
2. **No Induk ≠ NIK.** DB lama `nis` berisi nomor mirip NIK (`3135814666`), sedangkan
   "No Induk" sheet bernomor sekolah (`212207015`), formatnya tidak seragam
   (9 digit hanya 34 dari 120 baris). → dipakai apa adanya setelah spasi dibuang.
3. **`BulkCreate` all-or-nothing** — 1 baris tidak valid → seluruh batch 400. Karena
   `validateSantri` mewajibkan `nis` 4-20 char + `class` terisi, **19 baris dilewati**
   (No Induk seperti `13`, `005`, `3`, `-`). Data bermasalah seperti ini **tidak boleh**
   ditulis langsung via SQL karena akan menggagalkan validasi saat diedit lewat UI nanti.
4. **`birth_date`**: `Tempat,Tanggal Lahir` dipecah; 2 baris tidak punya tempat lahir
   (hanya `,18-09-2012`) → regex dibuat tempatnya opsional.
5. **`jenjang`**: validator hanya menerima `smp`/`smk`, sedangkan data lama berisi `SMA`.
   → kolom `jenjang` dikosongkan untuk semua baris.
6. **`status`**: sheet "Tidak Aktif" tidak ada di whitelist (`aktif/lulus/pindah/cuti`) →
   dipetakan ke `cuti` (3 baris di sheet, 1 yang lolos filter).
7. **`class`**: sheet angka (`1`..`12`) → romawi (`I`..`XII`) mengikuti konvensi DB/tabel
   `classes`. `SEMENTARA` (12) & `PPDB` (1) dipakai apa adanya.

**Perubahan source (hanya 1 file):** `apps/backend/internal/platform/database/db.go`
— `migrateSantriBgnColumns()` diganti `migrateDropBgnArtifacts()` (drop
`bgn_recipients_archive` + `bgn_recipients` + kolom `bgn_identity`/`bgn_recipient`,
idempoten via `schema_migrations`). Image `alma-parung-backend:jilid65-bgnclean`.
**PENTING:** image backend lama masih berisi migrasi yang menambah kolom BGN —
setelah kolom di-drop, **restart backend dengan image lama akan menghidupkan kembali
kolom BGN**. Selalu deploy `jilid65-bgnclean`.

**Efek samping yang perlu diketahui:** `Repository.ensureUserAccount` (dipanggil
`BulkCreate`) membuat akun portal untuk tiap Santri. Import ini membuat **119 akun
`role='user'`** dengan email `<nis>@almaparung.local` dan `randomPlaceholderHash()`
(password acak → **tidak bisa login** sampai di-reset admin). `users` 7 → 126.

**Batch 2 — 19 baris sisa (order user: "bikin NIS sementara"):** No Indukinvalid diberi
NIS sementara `TEMP001`..`TEMP018` (prefix sengaja dibuat jelas-bukan-asli supaya tidak
tertukar dengan NIS sungguhan di rapor). Petakan balik No Induk asli → NIS sementara
tersimpan di `/tmp/apcheck/temp_nis_mapping.csv` (pindah ke repo kalau masih diperlukan).
Ada **1 duplikat di sheet**: `M.YUSUF RAMADHAN` (kelas 1) & `M. YUSUF RAMADHAN` (kelas 8)
— nama, tempat lahir, tgl lahir (25-08-2011), No HP (089513750782) **dan** wali
(`putri soleha`) identik, jadi 1 orang. Yang di-import satu saja (baris kelas 1).
⚠️ Kelas di sheet (1) tidak sama dengan kelas di DB lama (**X**) — perlu dikonfirmasi user.
2 baris tanpa kelas (`M DESTA PRATAMA`, `ZULFA FAKHRUNNISA`) → diisi `SEMENTARA`.

**Hasil akhir DB:** `santri` = **119** (= 120 baris sheet − 1 duplikat). **No HP 84/119
(sebelumnya 0/58)**, wali 45/119, gender 45/119, tanggal lahir 119/119. Semua `user_id`
tertaut ke akun portal.

**Verifikasi:** `DELETE /api/santri/bulk` → 58 terhapus; `POST /api/santri/bulk` → 201
`inserted: 101` lalu `inserted: 18`; `GET /api/santri/` → 200 data benar; `/api/bgn/*` → 404;
`sqlite_master` & `PRAGMA table_info(santri)` → nol sisa BGN; `schema_migrations` →
`bgn_artifacts_dropped`. Deploy `jilid65-bgnclean`: health `healthy`, `/api/me` 200, site 200.

**⚠️ INSIDEN (saya, 30 Sep ~21:53):** saat `docker run` pertama untuk `jilid65-bgnclean`
saya **salah ketik `JWT_SECRET`** (101 vs 96 karakter) dan container itu jalan ~40 detik.
Tercatat 0 error "signature is invalid" di container lama, sedangkan container baru mencatat
puluhan — artinya ada token yang **ditandatangani dengan secret yang salah**, diperoleh selama
jendela itu (kemungkinan user login / frontend auto-refresh). Secret-nya sendiri sudah
dikoreksi (dicek `sha256` identik dengan container lama) dan tidak ada efek lain —
password hash tidak bergantung pada `JWT_SECRET`. **Tapi sesi browser yang memakai token
lama itu akan 401 sampai user login ulang.** Pelajaran: jangan pernah mengetik ulang secret
manual, pakai `docker inspect ... --format` → `--env-file`.

**Deploy `jilid65-bgnclean`:**
```bash
docker run -d --name alma-parung-backend --restart always -p 8090:8080 \
  --env-file /tmp/apcheck/be.env \
  -v /home/heru/alma-parung/data:/data \
  -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads \
  alma-parung-backend:jilid65-bgnclean
```
Container lama disimpan sebagai `alma-parung-backend-pre-jilid65` (image `fix-nullsanti-v2`
tetap ada untuk rollback). `/tmp/apcheck/be.env` **harus dibuat ulang** kalau file hilang:
`docker inspect alma-parung-backend-pre-jilid65` → tulis `API_PORT`, `DB_PATH`,
`DAHL_API_KEY`, `DAHL_API_URL`, `JWT_SECRET` ke env-file.

---

## Jilid 64 - Fitur BGN P1: pagination + export Excel/PDF + tautan opsional ke data Santri (30 Sep 2026, LIVE)

**Latar belakang.** Jilid 63 sudah menambah menu Penerima BGN + import template, tetapi
halamannya memuat seluruh baris sekaligus dan belum bisa di-export. Data live saat itu:
71 penerima (santri 58 / guru 6 / tendik 7). Tabel `santri` di aplikasi hanya berisi 3 baris
dan tidak ada satu pun nama yang sama dengan data BGN, jadi auto-link tidak mungkin. Tautan
dibuat manual dan sifatnya opsional.

**Cakupan (P1 saja; P2/P3 tidak dikerjakan).**
1. Pagination `limit`/`offset` + `total` (default 50, maksimum 500).
2. Export Excel dan PDF dari tombol di UI, memakai utilitas repo yang sudah ada
   (`src/lib/export.ts` -> `xlsx` + `jspdf`). Backend hanya menyediakan data lengkap.
3. Tautan opsional `bgn_recipients.santri_id` ke tabel `santri`, plus statistik baru "Tertaut".

**Migrasi DB (otomatis saat container start).**
- `ALTER TABLE bgn_recipients ADD COLUMN santri_id INTEGER NOT NULL DEFAULT 0`
- Tercatat sebagai `bgn_recipients_santri_link` di `schema_migrations`, dan idempoten karena
  dicek lebih dulu lewat `pragma table_info`.
- Tidak ada foreign key (SQLite tidak bisa menambah FK lewat `ALTER TABLE`). Integritas
  dijaga di lapisan aplikasi; lihat bagian "Validasi tautan".
- Backup pra-deploy: `backups/pre-deploy-jilid64-bgnp1-20260930-113314.db` (integritas `ok`,
  71 baris). Backup awal pekerjaan: `backups/pre-bgn-p1-20260930-091735.db`.

**Endpoint baru.**

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/bgn?limit=&offset=` | paginasi; respons `{data, total, limit, offset}` |
| GET | `/api/bgn/export` | semua baris tanpa paginasi, tetap hormati filter |
| GET | `/api/bgn/santri-options?search=&limit=` | kandidat Santri untuk dialog tautan |
| POST | `/api/bgn/{id}/link` | body `{"santri_id":n}`; `0` berarti lepas tautan |

**Validasi tautan.** `Repository.Link` memakai satu `UPDATE` bersyarat lalu memeriksa
`RowsAffected`; bila nol baris, repository menelusuri penyebabnya dan handler memetakan
sentinel error ke HTTP yang sesuai.

| Kondisi | HTTP | Pesan |
|---|---|---|
| Santri sudah ditautkan ke penerima lain | 409 | Data Santri sudah ditautkan ke penerima BGN lain |
| ID BGN tidak ada | 404 | Penerima BGN tidak ditemukan |
| ID Santri tidak ada | 400 | Data Santri tidak ditemukan |
| Posisi penerima bukan `santri` | 400 | Hanya penerima BGN dengan posisi Santri yang dapat ditautkan |
| `santri_id` negatif | 400 | Data Santri tidak valid |

Tautan bersifat satu-ke-satu. Sebelumnya tanpa validasi, satu Santri bisa ditautkan ke banyak
baris dan ID BGN yang tidak ada tetap dijawab 200. Di UI tombol taut hanya muncul untuk baris
posisi Santri; guru dan tendik tidak punya tombol tersebut.

**Dua perbaikan yang ditemukan saat pengujian.**
- Search tidak pernah mencari nama Santri yang tertaut, padahal kolom itu ditampilkan di
  tabel. `buildWhere` kini menambah syarat `OR s.name LIKE ?`. Karena `buildWhere` dipakai
  bersama oleh list, count, dan export, ketiganya tetap konsisten.
- Field read-only baru (`santri_id`, `santri_name`, `santri_class`) dikecualikan dari
  `RecipientInput` supaya strict JSON tidak menolak payload yang memuatnya.

**Tampilan.** 25 baris per halaman; label rentang "Menampilkan 1-25 Dari 71 DATA"; tombol
Sebelumnya dan Selanjutnya, keduanya nonaktif di batas; blok paginasi disembunyikan bila
total tidak lebih dari 25. Data Santri tidak memakai kolom tersendiri, melainkan badge
`KELAS - NAMA SANTRI` di bawah nama penerima ketika tertaut. Kartu statistik bertambah
"Tertaut".

**Pengujian.**
- API pada container uji dengan salinan DB: 49 dari 49 PASS. Mencakup migrasi dari kondisi
  lama, pagination termasuk `limit` dibatasi 500 dan `offset` melewati akhir data, filter,
  export 71 baris dan penghormatan filter, seluruh kasus validasi tautan, strict JSON, serta
  RBAC 401 tanpa token.
- DOM memakai Playwright pada container uji: 40 dari 40 PASS. Tiga halaman (25/25/21), mundur
  satu langkah, filter posisi guru 6 baris dan tendik 7 baris, search, empty state, tombol
  taut hanya di baris Santri, taut menghasilkan badge dan kartu "Tertaut" naik dari 0 ke 1,
  lepas tautan, tombol export nonaktif saat hasil kosong, unduhan Excel dan PDF terpicu, dan
  nol error konsol.
- Isi file export diperiksa, bukan hanya keberadaan file: Excel berisi 77 baris XML (71 data
  plus judul dan header, baris terakhir "Mpok Nani"), PDF `PDF-1.3` 3 halaman (multi-page
  berjalan) memuat kolom "Data Santri" dan seluruh 66 nomor identitas.
- Produksi setelah deploy: DOM 17 dari 17 PASS, export terunduh dan diperiksa ulang (71
  baris, PDF 3 halaman), `integrity_check` ok, 71 baris utuh, `/api/ready` 200, tanpa token
  401, dan nol error di `docker logs`.

**Deploy.** Image `alma-parung-backend:jilid64-bgnp1` dan `alma-parung-frontend:jilid64-bgnp1`;
backend `-p 8090:8080`, frontend `-p 3002:3000`; env diambil dari container yang sedang
berjalan, bukan disusun manual. Rollback ke `jilid63-bgn` untuk kedua layanan.

**Catatan operasional.**
- `docker build` wajib memakai `--network=host`. Pada jaringan bridge, DNS gagal saat
  `go mod download` dan `npm ci`. Build memakan sekitar 9 sampai 11 menit, jadi jalankan
  dengan `setsid nohup` plus file penanda `.done`.
- Container uji frontend tidak boleh memakai `--network=host` dengan PORT default 3000,
  karena port 3000 dipakai proses agen lain dan hasilnya `EADDRINUSE`. Pakai port 3010.
- Rewrite Next.js dibekukan saat build ke `.next/routes-manifest.json` dengan default
  `https://almaparung.com`. Agar frontend uji menguji backend uji, salin file itu dari
  image, ganti domainnya ke `http://127.0.0.1:8099`, lalu mount read-only ke container uji.
  Tanpa langkah ini, container uji diam-diam menguji produksi.
- Uji DOM memakai image resmi `mcr.microsoft.com/playwright:v1.49.0-jammy` karena host tidak
  punya pustaka `libatk` sehingga chromium di host gagal start. Modul `playwright-core`
  diambil dari `/tmp/pgl` di host dan di-mount sebagai `/pgl`; token lewat `/t`.
- Backend cukup `--env-file`. Frontend produksi dijalankan tanpa mount atau env khusus.

## Jilid 64b - Perbaikan fatal: egress internet semua container mati (rule iptables DOCKER-USER) (30 Sep 2026, LIVE)

**Latar belakang.** Setelah deploy Jilid 64 (11:33), WA gateway tidak bisa dipakai. Log
backend hanya menampilkan:
```
[WAGATE] belum ada sesi tersimpan, menunggu pairing dari admin
```
dan saat mencoba pairing:
```
gagal connect: failed to dial whatsapp web websocket: failed to send handshake
request: Get "https://web.whatsapp.com/ws/chat": dial tcp: lookup web.whatsapp.com
on 8.8.8.8:53: read udp 172.17.0.3:48072->8.8.8.8:53: i/o timeout
```
Ternyata ini **bukan** masalah WA. Semua container di VPS kehilangan akses internet.

**Gejala yang terlihat.** Dari container: DNS ke 8.8.8.8 / 1.1.1.1 / 9.9.9.9 timeout, TCP
ke 1.1.1.1:443 gagal, ping ke 1.1.1.1 gagal, `ip route get 1.1.1.1 from 172.17.0.3` ->
`Network is unreachable`. Host sendiri normal (bisa resolve, ping, HTTPS). Container hanya
saya bisa menjangkau gateway `172.17.0.1`. Ini juga menjadi penyebab **`docker build`
gagal** dengan `lookup proxy.golang.org ... i/o timeout` (perlu `--network=host` sebagai
workaround).

**Akar masalah.** `/usr/local/sbin/asyukro-block-docker-iptables.sh` (systemd
`asyukro-docker-block.service`, dijalankan tiap boot) memasang satu aturan:
```
iptables -I DOCKER-USER -i ens18 -j DROP
```
DOCKER-USER adalah chain PERTAMA di FORWARD. Aturan itu membuang **semua** paket yang
masuk lewat interface eksternal — termasuk **balasan** (SYN-ACK, reply DNS) dari koneksi
yang justru **dibuka oleh container itu sendiri**. Akibatnya: paket keluar di-MASQUERADE
(9142 pkt) tapi reply-nya dibuang (531 pkt) -> semua container egress mati. Dampak:
WA gateway tidak konek, `docker build` gagal, API luar (DAHL/AI) tidak terjangkau.
Dibuktikan dengan counter: `DOCKER-USER` `-i ens18 -j DROP` naik 526 -> 531 pkt hanya dari
satu percobaan `nc -z 1.1.1.1 443` dari container.

**Perbaikan.** Izinkan state `RELATED,ESTABLISHED` (hanya balasan koneksi yang sudah ada)
di **atas** baris DROP, jadi urutan DOCKER-USER sekarang:
```
-A DOCKER-USER -i ens18 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A DOCKER-USER -i ens18 -j DROP
```
Koneksi **baru** dari internet ke container (scan ke 5432/6379/9000/1025/3003/3004/3006)
tetap jatuh ke DROP, jadi proteksi asli tidak berkurang. Script tidak diubah secara
struktural, hanya menambahkan 1 blok; juga sudah diterapkan permanen + idempoten
(aman dijalankan berulang) dan diverifikasi setelah `systemctl restart`.
Backup script lama: `/usr/local/sbin/asyukro-block-docker-iptables.sh.bak-20260930`.

**Verifikasi.** Dari container: `nslookup web.whatsapp.com` OK, `nslookup google.com` OK,
`nc -z 1.1.1.1 443` OK, `wget https://web.whatsapp.com` OK. `GET /api/notifications/wa/qr`
sekarang **HTTP 200 image/png** 1439 byte (`X-Qr-Ttl: 50`). Health produksi tetap baik
(`/api/ready` 200, frontend 200, kedua container healthy, tidak ada restart).

**Sisa pekerjaan (BUTUH ADMIN).** File sesi `/data/wagate/wa_session.db` sudah kosong
(4096 byte, tabel `whatsmeow_device` 0 baris) dan **tidak ada backup-nya**, jadi gateway
harus di-pairing ulang secara manual: buka `/admin/notifications`, kartu "QR pairing
WhatsApp", pindai QR dengan WhatsApp di ponsel (atau pakai pair-code).Metode pair-code
juga tersedia: `POST /api/notifications/wa/pair-code`. Setelah pairing, sesi baru akan
langsung persist ke volume `/data` dan bertahan melewati restart container.

**Catatan risiko (belum dikerjakan, perlu kesepakatan).** `scripts/backup.sh` hanya
membackup `data/alma-parung.db` + `data/uploads` + config — **tidak** termasuk
`data/wagate/`. Kalau sesi WA hilang lagi, tidak ada cara memulihkannya. Disarankan
menambahkan `data/wagate` ke backup (dengan catatan: memulihkan sesi WhatsApp dari
backup bisa memicu logout di perangkat lain).

## Jilid 63 — Fitur BGN: menu Penerima Manfaat Beras Bergizi Nasional + input data template (30 Sep 2026, LIVE)
- **Backend** `internal/features/bgn/` (model.go, repository.go, handler.go): tabel baru `bgn_recipients`
  (migration `bgn_recipients_table` + index `bgn_recipients_identity_index`), kolom `identity` (NISN/NIK,
  ≤20 char), `name`, `birth_date` (DD-MM-YYYY), `gender` (L/P), `parent_name`, `position`
  (santri|guru|tendik), `status`. API `/api/bgn`: `GET /` (filter search/position/status), `GET /stats`
  (total/santri/guru/tendik/active/inactive), `POST /` (create), `PUT /{id}`, `DELETE /{id}`,
  `POST /import` (bulk idempoten — update by NISN/NIK atau by name+position bila tanpa identitas,
  duplikat intra-batch dilewati; balasan `{added,updated,skipped}`). Guard role `superadmin, admin,
  bendahara, panitia_psb` di `cmd/api/main.go`.
- **Frontend**: menu `Penerima BGN` (kategori BGN, roles superadmin/admin/bendahara/panitia_psb, docRef bgn)
  di `lib/roleMenus.ts` + icon lucide `Apple` di `components/Sidebar.tsx`; halaman baru
  `app/admin/bgn/page.tsx` (6 kartu statistik, pencarian + filter posisi/status, tabel CRUD, modal
  tambah/edit dengan ConfirmDialog, modal Import format `NISN/NIK;Nama;Tgl;JK(L/P);Ortu;Posisi;Status`);
  `lib/api.ts`: getBgnRecipients/getBgnStats/createBgnRecipient/updateBgnRecipient/deleteBgnRecipient/
  importBgnRecipients.
- **Input data**: `data/bgn/template-penerima-manfaat-BGN-PPTQ-ALMAA.xlsx` (sheet SMP, SMA, Tenaga
  Pendidik) dibaca parser zip-xml murni (server tidak punya pip/openpyxl). **71 penerima live**
  (santri 58, guru 6, tendik 7; L 30, P 41; semua aktif; semua identity+tanggal). Baris 1-2 header/
  keterangan, baris 3 "data contoh" kuning, baris rusak tanpa nama (SMA r4, Tenaga r3/r7), dan blok
  CATATAN dilewati (26 skip). Tanggal serial Excel → DD-MM-YYYY; sheet Tenaga Pendidik menaruh posisi
  di kolom E (bukan F) — parser menangani keduanya. Catatan: urllib diblok Cloudflare (error 1010) →
  import via `curl` POST `/api/bgn/import` (hasil `{"added":71,"updated":0,"skipped":0}`).
- **Deploy**: backend `alma-parung-backend:jilid63-bgn`, frontend `alma-parung-frontend:jilid63-bgn`;
  swap container `alma-parung-backend` (8090:8080) & `alma-parung-frontend-bobot` (3002:3000).
  Pelajaran build: `next/font` gagal fetch Google Fonts di builder default (DNS hanya mengembalikan IPv6)
  → **wajib `docker build --network=host`** untuk image frontend.
- **Verifikasi**: `go build` 0 error; `tsc --noEmit` 0 error; uji container (DB salinan, port 8099 &
  FE 3007): CRUD + import dedup (added 2, skipped 1) OK; DOM headless di produksi **13/13 PASS,
  0 console error** (menu sidebar, 6 kartu stat, tambah/edit/hapus, import via UI); live API stats
  `{"total":71,"santri":58,"guru":6,"tendik":7,"active":71,"inactive":0}`.
- **Backup**: `backups/pre-bgn-20260930-070239.db`; 5 file di-edit punya `.bak-jilid63` di repo.

- Jilid 30–39: fondasi, donasi jujur, JWT, font/SRI/rate-limit (detail: CATATAN-JILID42.md §1–4).
- Jilid 40: AutoSPP 4 bug (WIB, per-santri, guard due-date, WA queue) — live.
- Jilid 41: santri manual auto-akun users + backfill — live.
- Jilid 42: CBT formula 30/40/30, normalisasi semester, AY aktif — live (image jilid42 gagal 1x: signature basi, sudah rebuild).
- Jilid 43: tombol Hapus Total santri (purge transaksional, superadmin) — live.
- Jilid 44: fix list 500 (COALESCE occupation) — live.
- Jilid 45: field jenjang end-to-end — live.
- Jilid 46: kelas jadi dropdown master — live.
- Jilid 47: satu santri satu akun + reset password — live.
- Jilid 48: nilai kosong=null, bobot dihapus, predikat KKM, input project — live.
- Jilid 49: hapus Program Unggulan di PSB — live.
- Jilid 50: status `santri` diakui portal — live.
- Jilid 51: upload PDF + tombol Lihat — live.
- Kop PDF + TTD (jilid52–54), mapel Hadis Arbain, bersih storage §23, hapus Putra/Putri kelas.
- Jilid A peran (backend, image roleB2): lihat §3 di atas.
- Jilid B peran (frontend, image roleB): roleMenus + guru picker + wali_user_id — lihat §3.
- Skala nilai seragam 0-100 (grade+CBT selaras, kesantrian tampil 0-100) — live backend+frontend `skala`.
- **KKM dinamis**: setting `academic_kkm` (default 75, disimpan di tabel settings), GET `/academics/kkm` (semua role akademik) + PUT (admin), grade-letter mapel (Create+Update) & CBT pakai `weight.GradeLetter100` berbasis KKM (pita: A≥KKM+15, B≥KKM+5, C=KKM, D=KKM-15), predikat rapor bawaan weight mengikuti KKM. Frontend: KKM card di tab Dashboard `/admin/academics` (edit admin [superadmin/admin], info pita untuk semua). Verifikasi API: KKM 84→D (kk 90), →B (kk 70), →B (kk 75); tsc lolos; DB integrity ok. Live image `kkm` (backend 7815d3fb1d59, frontend a3738ef614b1). CATATAN: nilai lama tak dihitung ulang (berlaku utk yg di-edit/dibuat setelahnya). File: `platform/weight/engine.go`, `academics/repository.go`+`handler.go`, `exams/repository.go`, `cmd/api/main.go` (loadKKMFromDB), `lib/api.ts`, `admin/academics/page.tsx`.

- **Bobot komponen nilai per mapel + kolom UH (28 Sep 2026, live, image `bobot`)**: nilai akhir mapel TIDAK lagi hardcode 30/40/30 — komponen jadi 4 (UTS, UAS, Tugas, **UH/Ulangan Harian**) dengan bobot per mapel. Default `UTS 25 / UAS 30 / Tugas 25 / UH 20` (`weight.DefaultGradeWeights`), disimpan di tabel baru `subject_grade_weights` (satu baris per `subject_id`, migration `subject_grade_weights_table`); kolom baru `grades.uh_score` (migration `grades_uh_score_column`, idempoten, backfill 0). API: `GET /api/academics/grade-weights` (semua role akademik) + `PUT` (hanya `superadmin`/`admin` via `weight.IsFullAccessRole`, tolak bobot yang bukan total 100). `CreateGrade`/`UpdateGrade`/CBT `FinishSession` semua lewat `weight.CalculateGradeFinal(uts,uas,task,uh,weights)`; `GetSubjectWeights` selalu fallback ke default bila tabel/baris belum ada (input guru tidak pernah gagal karena bobot belum diset) dan `UpsertSubjectWeights` satu transaksi. Frontend: kolom UH di form nilai (single/bulk create/bulk edit) + tabel nilai + ekspor PDF/Excel, kartu "Bobot Komponen Nilai per Mapel" di tab **Mapel** `/admin/academics` (input 4 bobot + indikator total, badge hijau/merah), kartu "Ulangan Harian" di `/portal/raport`. Verifikasi: `go build`/`go vet`/`go test weight`/`tsc --noEmit` lolos; `/api/ready` 200; `GET /api/academics/grade-weights` 401 tanpa token (rute hidup, bukan 404); migrasi terpasang di DB prod (`uh_score`+`subject_grade_weights` ada, `integrity_check` ok); asset frontend live memuat "Bobot Komponen Nilai per Mapel"/"Ulangan Harian"/"grade-weights". Backup DB sebelum deploy: `data/alma-parung.db.bak-bobot-20260928-005332`. **CATATAN PENTING**: bobot default BERUBAH dari 30/40/30 → 25/30/25/20, jadi nilai yang diisi ulang akan turun bila UH belum diisi (UH default 0). Nilai lama TIDAK dihitung ulang otomatis. File: `platform/weight/engine.go`, `platform/database/db.go`, `academics/repository.go`+`handler.go`, `academics/scoped.go`, `exams/repository.go`, `lib/api.ts`, `admin/academics/page.tsx`+`form/page.tsx`, `portal/raport/page.tsx`.
- **Dropdown "Kelas" form Kesantrian kosong untuk wali_kelas/pimpinan (28 Sep 2026, live, image `jilid43`)**: keluhan user 27 Sep ("dropdown di `/admin/kesantrian/form` field kelas dan field status bermasalah") ter-park tanpa fix; investigasi DOM headless waktu itu membuktikan sebagai superadmin semua select normal. Akar masalah: `getClasses(true)` → `GET /api/school/classes` hanya boleh `superadmin,bendahara,panitia_psb,admin` (grup `r.Mount("/school")`), sedangkan grup `/santri` mengizinkan `superadmin,panitia_psb,wali_kelas,pimpinan` → wali_kelas/pimpinan kena 403 → `classOptions` kosong → dropdown Kelas cuma berisi "-- Pilih Kelas --" dan wali kelas tidak bisa memilih kelas sama sekali. Fix: `cmd/api/main.go` — `/school` dipecah jadi `r.Route("/school")`: grup READ (`GET /classes` + `GET /years`) untuk `superadmin,bendahara,panitia_psb,admin,wali_kelas,pimpinan`, grup WRITE (mount penuh `schoolHandler.Routes()`) tetap 4 role awal. Verifikasi: 13/13 uji RBAC lolos di container uji (copy DB + user uji `wali_kelas`/`pimpinan`, port 8099, lalu dibuang) — read 200 untuk wali_kelas & pimpinan, 403 untuk `user` & `tim_media`, write 403 untuk wali_kelas & pimpinan, write superadmin tetap jalan (POST/PUT/DELETE classes + activate years bukan 405, jadi tidak tertimpa routing chi); `gofmt` bersih pada baris yang diubah; live: backend `jilid43` healthy, `/api/ready` 200, publik `/`+`/login`+`/api/ready` 200, `GET /api/school/classes?active_only=true` live → `['IX','VII','VIII','X','XI','XII']`. Backup DB: `data/alma-parung.db.bak-jilid43-20260928-020508`. **Dropdown Status BELUM ada fixnya**: kode frontend (`statusOptions` = aktif/lulus/pindah/cuti, `apps/frontend/src/app/admin/kesantrian/form/page.tsx:15`) identik dengan validasi backend `validStatus` (`internal/features/santri/handler.go:201`) dan data produksi hanya berisi `aktif` → tidak ada bug terverifikasi, perlu klarifikasi user.
- **Field Kelas & Status form Kesantrian: `<select>` native diganti dropdown kustom (28 Sep 2026, live, image frontend `jilid44`)**: laporan user (Android/Chrome): "dropdown di `/admin/kesantrian/form` field kelas dan field status, ketika diklik langsung nutup tidak menampilkan dropdown, tapi kalau di scrol bisa" — hanya Kelas & Status; Jenis Kelamin & Jenjang normal. Investigasi headless (Chromium 393x851 `hasTouch` + UA Android, instrumentation event): urutan event bersih (`pointerdown→touchstart/end→mousedown→focus→click`), tidak ada blur/re-render/mutasi/scroll yang menutup popup, hit-testing aman, tidak ada ancestor transform/filter, 4 select terisi benar, tanpa error console → penyebab ada di popup `<select>` native sisi Chromium Android, bukan logika React; app juga tidak punya komponen dropdown kustom reusable. Fix: komponen `SelectField` (button `role="combobox"` + `ul role="listbox"`, tutup saat klik luar/Escape, panah+Enter/Space untuk keyboard) dipakai untuk field **Kelas** dan **Status**; `<select>` native field lain (Jenis Kelamin, Jenjang) dibiarkan. Logika opsi Kelas dipertahankan persis (placeholder `-- Pilih Kelas --` + `classOptions` + opsi `__custom__` "X (saat ini)"), state & payload submit tidak berubah (`form.class`/`form.status`). Styling pakai `inputClass()` yang sama → terukur identik dengan select native (lebar 311px, padding 10/14, font 14px/500, border 1px + radius sama; beda 1px tinggi). Verifikasi: `tsc --noEmit --incremental false` 0 error; 17/17 uji DOM di container uji port 3003 (langsung dibuang) dan 17/17 ulang di domain publik `https://almaparung.com` — tap buka listbox (opsi Kelas 7, Status 4), pilih "VII"/"Cuti" masuk dan tidak reset, tutup setelah pilih, tutup klik luar & Escape, keyboard jalan, tanpa error console. Image frontend `jilid44` (`e603cd08a19e`); image `bobot` (`9854105e2313`) untuk rollback.

- **Tutorial `/admin/help` seksi Nilai & Raport (eRapor) (28 Sep 2026, live, image frontend `jilid45`)**: user minta tutorial di-in-app diperjelas, terutama soal bobot nilai per mapel. `apps/frontend/src/lib/adminDocs.ts` — interface `AdminDocSection` ditambah field opsional `glossary`, `examples`, `reference`, `faq` (semua opsional, 20 section lama tidak berubah); seksi `academics` ditulis ulang supaya ramah pemula: urutan "Atur bobot -> isi KKM -> input nilai -> presensi/tahfidz -> rekap -> cetak", 10 `visualSteps` (makai 9 screenshot `/assets/tutorials/acad-*.png`), 3 blok contoh hitungan (termasuk kasus "nilai lama turun setelah diedit" karena UH kosong), tabel referensi grade A-E untuk KKM 70/75/80, 8 FAQ, 12 tips. `apps/frontend/src/app/admin/help/page.tsx` — renderer baru untuk keempat field itu (glosarium setelah audience; contoh + tabel + FAQ setelah `visualSteps`) dan keempat field ikut masukkan ke `haystack` pencarian (cari "bobot"/"tahfidz" menemukan seksi). **Koreksi isi penting**: validasi `weight.ValidateGradeWeights` menolak bobot 0 maupun total != 100, jadi draft yang menyarankan "set bobot UH = 0" DIHAPUS dari 3 tempat; teks final advises "isi kolom UH, atau minta admin menyesuaikan bobot mapel ini". Verifikasi: `tsc --noEmit --incremental false` 0 error; `docker build` sukses; 17/17 uji DOM di container uji port 3005 (image `tutorial`, lalu dibuang) dan 17/17 ulang di `https://almaparung.com` (semua PASS, 0 console error, 0 HTTP 4xx/5xx) — termasuk 9/9 gambar termuat, tabel 5 baris, FAQ bisa dibuka, section `dashboard/psb/donations/settings/teachers` tidak rusak.

- **Screenshot tutorial disamarkan + diamankan (28 Sep 2026, live, ikut image `jilid45`)**: 9 screenshot sebelumnya diambil dari data produksi dan ada di `public/` — Next melayani `/assets/*` **tanpa auth**, jadi siapa pun bisa membukanya (dibuktikan `curl` anonim = 200 sebelum fix, produksi lama = 404 karena file belum ada). Dua lapis fix: (1) semua nama/email Santri diambil dari `GET /api/academics/students` lalu diganti `"Santri (disamarkan)"` + nomor HP/angka >=6 digit jadi `"nomor disamarkan"` **di DOM sebelum screenshot** (`/tmp/oshot/shot_redact.js`, 9/9 berhasil, 0 console error); (2) `src/middleware.ts` tambah guard `pathname.startsWith('/assets/tutorials') && !token` -> redirect `/login`, jadi aset baru 307 untuk anonim dan 200 untuk admin. Datenya sudah tidak bocor, tapi nilai yang tampil (80/85/90) tetap dari data asli.

- **Pembersihan storage (28 Sep 2026, tanpa deploy)**: disk `/` turun dari **89% ke 47%** (105G -> 55G terpakai, 63G bebas). Yang DIBERSIHKAN (semua cache/file yatim, tidak ada data): (1) `docker image prune -f` -> 95 image gantung (tanpa tag, sisa build lama) hilang, `/var/lib/containerd` 72G -> 31G, docker-reported reclaim 9.2GB; (2) 251 file `.so` yatim di `/tmp` (2.1G, jeweils 5.5MB, berasal dari exec yang gagal); (3) cache npm `/home/alma/.npm` 6.0G -> 12M dan `/root/.npm` 337M -> 76K; (4) `journalctl --vacuum-size=100M` 320M -> 66M; (5) `/tmp/go-build*` 24M + sisa kerja `/tmp/oshot`, `/tmp/opencode-ap` 18M. **Efek samping yang perlu tahu**: cache layer build Docker sudah habis, jadi build frontend/backend berikutnya akan lebih lambat (tidak bisa `--cache-from` layer lama). Yang SENGAJA TIDAK disentuh: cache Go (~5.1G: repo `.gocache` 1.5G, `.gomodcache` 1.3G, `~/.cache/go-build` 428M, `~/.gocache` 255M, `~/go/pkg` 1.3G, `/tmp/gocache-heru` 306M), `/home/heru/.npm` 792M, `/tmp/j28` 775M, 38 tag image lama + 11 container exited (3.2G, sebagian memang container rollback), `mcr.microsoft.com/playwright:v1.49.0-jammy` 3.32G, 9x `data/alma-parung.db.bak-*`, dan `/home/alma/{eraport-clone,vibe-coding-repos}`. User memutuskan berhenti di titik ini. Census `/tmp`: 1.096 entri basi (>3 hari) -> 1.4G tersisa, sebagian besar folder kerja `j*full` milik agen lain. Verifikasi setelah bersih: `alma-parung-frontend-bobot` (jilid45) & `alma-parung-backend` (jilid43) healthy, `/`=200, `/admin/help`=307, `/assets/tutorials/*`=307, `/api/academics/kkm`=401 (semua sesuai).

- **Rumah Keeper 28 Sep: F (tsbuildinfo) + G (dok usang) + E (redaksi secret)**
  - **F [MEKANIK]**: `apps/frontend/tsconfig.tsbuildinfo` tadinya root-owned sehingga `tsc` gagal `TS5033`
    untuk user `heru`. Audit menemukan **24.080 file** root-owned di repo (`.gocache`/`.gomodcache` + `.bak`/backup baru) — karena ada build Go yang dijalankan lewat `sudo`, cache-nya jadi milik root.
    Semua `chown heru:heru` (di luar `node_modules` + `.git`) -> sisa **0**.
    Bukti perbaikan: `su heru -c "npx tsc --noEmit"` sekarang **EXIT=0** tanpa perlu `--incremental false`.
    *Aturan baru: jangan `sudo` build Go — cache jadi root-owned dan menggigit user `heru`.*
  - **G [DOKUMENTASI]**: `CATATAN-JILID42.md` diberi banner **DOCUMENTASI USANG** di atasnya. Isinya cuma
    1 entri lama (KKM dynamic / image `kkm`), tidak mencakup bobot-UH, dropdown Kesantrian, tutorial eRapor,
    maupun fix Kedisiplinan; nama filenya pun menyesatkan (isi entri **"Jilid 28 — KKM dynamic"**).
    Banner mengarahkan ke `RINGKASAN.md` §2/§4/§6 dan `HANDOFF.md` §4. Isi asli tidak diubah
    (backup `CATATAN-JILID42.md.bak-20260928`).
  - **E [KEAMANAN] audit + redaksi**: sapuan pola secret ke seluruh repo (`.go/.ts/.tsx/.js/.json/.env/.md/.sh/.sql`),
    nilai **tidak pernah dicetak** — hanya lokasi + kategori + hash. 21 temuan, 3 di antaranya nyata:
    1. `RINGKASAN.md` §2 memuat **API key DAHL asli** di baris perintah deploy -> diganti `"$DAHLKEY"`.
    2. `ssh_logs.py` **hardcode password SSH server lain** (103.107.206.10 / user `ubuntu24`) -> ditulis ulang,
       kredensial via env `SSH_HOST/SSH_PORT/SSH_USER/SSH_PASS` (+ `getpass`), dan password dikirim lewat
       `stdin` ke `sudo -S`, bukan disisipkan ke string perintah.
    3. `docs/deploy-alma-vercel-vps.md` memuat `JWT_SECRET` contoh -> jadi placeholder
       `change_me_use_openssl_rand_hex_32` (dicek: bukan sama dengan `.env`).
    Sisa 10 temuan sudah diverifikasi **false positive**: `change_me_*` di `.env.example` + docs,
    `PASS = os.environ.get("SSH_PASS")` (sekarang read-from-env), `password:` sebagai nama field JS di
    `SKILL.md`/`api.ts`/halaman users, dan fixture validator. `PASS = "Tes123456"` di
    `scripts/smoke_nik_final.py` = password akun sementara yang dibuat lalu dihapus skrip itu sendiri (risiko rendah).
    `.env` sudah ada di `.gitignore`. **Belum** dikerjakan: rotasi `JWT_SECRET` + password SSH `heru` + hapus `/tmp/pgl/inspect10.js` — semuanya butuh izin user.
- **Fix Kedisiplinan (`disiplinfix`, 28 Sep)**: di `/admin/disciplines` kolom "Santri" menampilkan **"Admin"**.
  Akar masalah: kolom `student_id` di `student_points`/`violation_logs` merujuk `users.id`, tapi validasi lama
  hanya `SELECT COUNT(*) FROM users WHERE id=?` (semua user lolos, termasuk akun admin/staff) dan form meminta
  "ID Santri" **diketik manual** -> id 1 (superadmin) jadi sasaran. Tiga lapis perbaikan:
  1. Data: `student_id` 1 -> 74 (Aday Kodarudin, satu-satunya Santri ter-link), poin di-reset 90 -> 100.
  2. Backend `disciplines/repository.go`: sentinel `ErrNotSantri` + `isSantriTx()` (harus ada di `users`
     **dan** punya baris `santri` ter-link) -> `POST /disciplines/violations` balas **422** untuk akun
     non-Santri (`handler.go` pakai `errors.Is`). Lima query tampilan + 2 count query di-`JOIN` ke tabel
     `santri` lewat `user_id`, sehingga akun non-Santri tidak bocor ke tabel walau data lama masih ada.
  3. Frontend `app/admin/disciplines/page.tsx`: input angka diganti `<select>` dropdown Santri dari
     `getSantriList({status:'aktif',limit:500})`, difilter `Boolean(user_id)`, label `nama - kelas (NIS)`.
  Verifikasi: `tsc --noEmit --incremental false` 0 error; container uji (port 8099, DB salinan) 422 untuk
  id 1/2/13 + 201 untuk id 74; `GET /disciplines/points` & `/disciplines/logs` di produksi hanya menampilkan
  "Aday Kodarudin"; bundle image baru 1 chunk dropdown & 0 chunk input manual; `/api/ready` = READY;
  `https://almaparung.com` 200. Rollback: `alma-parung-backend-rollback-135939` (jilid43),
  `alma-parung-frontend-bobot-rollback-135947` (jilid45). Backup DB:
  `backups/pre-disiplines-fix-20260928-125938.db` + `backups/pre-deploy-disiplinfix-20260928-135936.db`.

## Jilid 55 — Tagihan Otomatis SPP: envelope bocor + input stepMismatch (28 Sep 2026, LIVE)

**Gejala laporan user:** di `/admin/payments` → "Tagihan Otomatis" selalu tertulis *Nonaktif*,
dan saat Simpan muncul **"Payload permintaan tidak valid"**.

**Akar masalah (bukan satu, tapi dua yang menumpuk):**

1. **Envelope bocor di satu consumer.** `getSppAutoConfig()` di `apps/frontend/src/lib/api.ts`
   mengembalikan envelope `{success,message,data}`, tapi `SppBills.tsx:102` menyuapkannya
   *langsung* ke `setAutoCfg(cfg)`. Akibatnya `autoCfg.enabled/amount/due_day` = `undefined`
   → tombol selalu "Nonaktif" walau DB `spp_auto_enabled=true`. Saat Simpan, envelope itu
   dikembalikan sebagai payload; backend memakai `validators.DecodeJSON` +
   `DisallowUnknownFields()` sehingga field `success/message/data` ditolak → HTTP 400.
   - **Jebakan:** `getSppAutoConfig()` punya **dua consumer dengan ekspektasi berbeda**.
     `app/admin-bs/tagihan-spp/page.tsx` sudah benar (`c.success && c.data`, envelope).
     Jadi **tidak boleh** diubah jadi `return .data` — itu akan merusak halaman tsb.
     Yang diperbaiki: consumer-nya, plus `api.ts` diberi return type eksplisit.
   - **Mengapa `tsc` lama tidak menangkap:** `parseResponse()` (`api.ts:362`) tidak punya
     return type annotation, jadi `res.json()` membuat hasilnya `any`. Return type eksplisit
     di `getSppAutoConfig()` kini membuat drift seperti ini tertangkap compiler.

2. **`min="1" step="1000"`** di dua halaman. Step base = `min` = 1, sehingga nilai valid hanya
   1, 1001, 2001, … `15000000`/`150000`/`1000000` kena `stepMismatch`. Karena `<form>` tidak
   memakai `noValidate`, browser **memblokir submit** + menampilkan bubble. Diperbaiki ke
   `min="0"` (grid 0, 1000, 2000, … → semua rupiah bulat valid).

**Perubahan file:**
- `apps/frontend/src/lib/api.ts` — `getSppAutoConfig()` diberi return type `Promise<{success;message;data:SppAutoConfig}>`.
- `apps/frontend/src/app/admin/payments/SppBills.tsx` — `setAutoCfg(cfg?.data || {default})`; `min="1"`→`min="0"`.
- `apps/frontend/src/app/admin-bs/tagihan-spp/page.tsx` — `min="1"`→`min="0"`.
- `apps/backend/internal/features/settings/handler.go` — perbaikan P2 (lihat entri P2 di bawah).

**P2 — `GET /api/settings`.Payload 465 KB.** Tabel `settings` = 416.551 byte / 76 key, dan satu
key menyumbang **91%**: `website_builder_revisions` = 380.645 byte. Dicek: **tidak ada consumer
frontend maupun backend** yang membacanya lewat daftar settings (grep `apps/frontend/src` +
`apps/backend/internal` = 0 hasil) → 380 KB dead weight di tiap request.
- `GetAll` kini menyaring key berat lewat `heavySettings`; `GET /api/settings/revisions` (baru)
 menyediakan akses eksplisit sehingga **tidak ada functionality yang hilang**.
- Aman karena `Repository.UpdateMany` hanya upsert key yang dikirim (tidak ada delete-all), jadi
  memangkas `GetAll` tidak mungkin menghapus data. Route `/settings` sudah dibungkus
  `auth.RequireRole("superadmin")` di `main.go` → endpoint baru otomatis superadmin-only.
- Hasil: **465 KB → 45,8 KB** (75 setting, `-90%`).

**Verifikasi:**
- `tsc --noEmit --incremental false` → **0 error**; `gofmt -l` bersih; `go vet` exit 0; `go build ./...` exit 0.
- Bundle image dicek benar-benar berisi patch: `setAutoCfg(cfg?.data` dan `min:"0",step:"1000"`.
- Container uji (fe 3005 / be 8095) + produksi (8090): `GET /api/spp/auto-config` → `200`,
  `data = {enabled:true, amount:1000000, due_day:10, wa_enabled:true}` → UI tampil **AKTIF**.
- **Round-trip `PUT /api/spp/auto-config`** dengan nilai identik DB → `200`
  "Pengaturan tagihan otomatis disimpan", dan state DB terbukti **tidak berubah** (idempoten).
- `GET /api/settings` 46.904 B (sebelumnya ~465 KB); `GET /api/settings/revisions` 380.645 char utuh.
- `https://almaparung.com` `/` 200, `/login` 200, `/admin/payments` + `/admin-bs/tagihan-spp` 307
  (redirect login), `/api/ready` 200. Kedua container **healthy**, log tanpa error/panic.
- Backup DB: `backups/pre-sppautofix-20260928-231544.db`.

**Deploy:** image `alma-parung-backend:sppautofix` + `alma-parung-frontend:sppautofix`.
Rollback: image `disiplinfix` (masih ada), container lama
`alma-parung-backend-OLD-231556` / `alma-parung-frontend-OLD-231629` masih stopped di mesin.

**Catatan operasional (penting untuk agen penerus):**
- Build frontend **gagal 1x** dengan 42 error `next/font/google queries have exactly one entry`
  (Turbopack Next 16 + `layout.tsx` yang import `Inter` **dan** `Outfit`). Bukan regresi kode —
  `layout.tsx` identik dengan build `disiplinfix` yang sukses, jaringan ke `fonts.googleapis.com`
  & `fonts.gstatic.com` normal. Build **retry langsung sukses**. Perlakukan sebagai
  Turbopack font-fetch yang flaky; kalau berulang, siapkan `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`.
- `go` tidak ada di PATH shell non-interaktif → pakai `export PATH=$PATH:/usr/local/go/bin`.
- Auto-commit watcher ikut meng-*commit* file backup `.pre-sppautofix` / `.pre-settingspayload`
  (jadi ikut ter-*track* di git). Sudah dilaporkan ke user, belum dihapus.

## Jilid 56 — Bug: kolom "Kontak" kosong di /admin/disciplines (28 Sep 2026, LIVE)

**Gejala laporan user:** di `https://almaparung.com/admin/disciplines`, kolom **Kontak**
selalu kosong/nonaktif padahal data Santri aktif sudah punya nomor orang tua.

**Akar masalah:** 3 query di `apps/backend/internal/features/disciplines/repository.go`
mengambil nomor WA wali dari tabel **`registrations`**:

```sql
COALESCE(reg.parent_phone, '') as parent_phone
LEFT JOIN registrations reg ON reg.user_id = u.id
```

Tetapi tabel `registrations` di DB produksi **0 baris** — seluruh data sudah bermigrasi
ke tabel `santri`. Akibatnya `reg.parent_phone` selalu NULL → `COALESCE` → `''`.
Frontend lalu me-render tombol WA nonaktif:

```tsx
className={p.parent_phone ? 'text-sky-600 hover:bg-sky-50' : 'text-slate-300 cursor-not-allowed'}
```

**Kenapa lama tidak ketahuan:** `COALESCE(...,'')` menyembunyikan kegagalan JOIN sebagai
string kosong, bukan NULL/error — jadi tidak ada error di log, hanya UI yang diam-diam kosong.

**Perbaikan:** ganti sumber ke `santri.parent_phone`, dengan fallback berurutan ke
`father_phone` lalu `mother_phone` (beberapa data hanya mengisi salah satu kolom ortu).
`JOIN registrations` dihapus karena tidak terpakai lagi; tabel `santri` sudah ter-JOIN di
ketiga query tersebut.

```sql
COALESCE(NULLIF(s.parent_phone, ''), NULLIF(s.father_phone, ''),
         NULLIF(s.mother_phone, ''), '') as parent_phone
```

**Cakupan:** bug ini **terisolasi di `disciplines` saja** (3 query: `FindAllPoints`,
`GetStudentPoint`, `FindAllLogs`). Sudah dicek fitur lain — `notifications`, `spp`, `iuran`,
`santri` — semuanya sudah membaca `santri.parent_phone` dengan benar. `psb` yang
`JOIN registrations` memang benar (untuk pendaftar PSB, bukan Santri aktif).

**Verifikasi:**
- `gofmt` bersih, `go build ./...` exit 0, `go vet` exit 0.
- DB: sebelum query = `''` (kosong), sesudah = terisi.
- `GET /api/disciplines/points` & `/logs` → `200`, `parent_phone` terisi (len 12) → tombol WA aktif.
- `/api/ready` = READY, `https://almaparung.com` 200, `/admin/disciplines` 307 (auth, normal).
- Backend log tanpa error/panic. Container healthy.

**Deploy:** backend image `alma-parung-backend:disc-fix` (frontend tidak berubah, tetap `sppautofix`).
Rollback: `alma-parung-backend-DISC-*` (image `sppautofix`) dan image `disiplinfix`.

## Jilid 62 — Kop dinamis + reset warna teks di SEMUA dokumen cetak (SPP/Iuran/Logs/Kwitansi) (29 Sep 2026, LIVE)

**Perintah user:** terapkan perbaikan kop e-raport ke SEMUA raport/dokumen yang bisa dicetak.

**Audit:** hanya ada 2 generator PDF di frontend: `lib/export.ts` & `KwitansiModal.tsx`.
Admin → Payments menyediakan laporan PDF utk: SPP (`SppReport.tsx`), Iuran
(`IuranReport.tsx`), Audit Log (`admin/logs/page.tsx`) — ketiganya lewat `exportToPDF()`
yang **hardcode** `PONDOK PESANTREN AL-MAA` + alamat salah `Jl. Raya Parung - Bogor`.
`exportToExcel()` juga hardcode nama.

**Perubahan:**
- `lib/export.ts`
  - Helper baru `kopInfo()` (cache `loadKopInfo()`) dan `logoDataUrl()` (cache logo);
    dipakai juga oleh `renderKop()`.
  - `exportToPDF` → **async**: kop = `settings.school_name`, alamat & kontak dari
    setting, logo ditambahkan kiri-atas, warna teks eksplisit (gelap untuk kop area,
    teal untuk judul laporan, abu untuk tanggal cetak). Tidak ada lagi string hardcode.
  - `exportToExcel` → **async**: baris 1 = `kop.name`, + baris alamat & kontak.
  - `renderKop` → tambah `doc.setTextColor(30,41,59)` di akhir supaya pemanggil
    tidak mewarisi putih (tambahan defensif; bug asli sudah di-fix di Jilid 61).
- `KwitansiModal.tsx` → **fix bug Jilid 61**: baris header PDF sempat
  `doc.splitTextToSize(\`formatSchoolName(school.name).toUpperCase()\`, ...)` (memakai
  template literal dgn backtick → teks literal tercetak, bukan nama). Diubah ke
  pemanggilan fungsi asli. Backup `KwitansiModal.tsx.bak-20260929-kwitansi`.
- Pemanggil `exportToPDF`/`exportToExcel` jadi `async` + `await`:
  `SppReport.tsx`, `IuranReport.tsx`, `admin/logs/page.tsx`.
- Backup: `export.ts.bak-20260929`, `SppReport.tsx.bak-20260929-*`,
  `IuranReport.tsx.bak-20260929-*`, `logs/page.tsx.bak-20260929-*` (otomatis patch).

**Deploy:** image `alma-parung-frontend:jilid62-kop-global` (built 2x: rebake pertama,
lalu rebake kedua setelah fix kwitansi) di container `alma-parung-frontend-bobot`.
Healthy, `/` 200, `/api/settings/public` mengembalikan nama baru.

**Verifikasi (PDF asli di-generate headless dari UI live):**
- SPP report PDF (20.352 byte): header awal = `PONDOK PESANTREN AL-MAA PARUNG BOGOR |
  jl haji mawi gang omega desa waru parung bogor jawa-barat | +6287784423282 ·
  ponpesalmaaparung@gmail.com · almaparung.com | Laporan Tagihan 2026-09 s/d 2026-09`.
- Iuran report PDF (18.374 byte): kop sama dinamis, judul `Laporan Tagihan Iuran ...`.
- E-Raport (Jilid 61) tetap: judul putih di kop hijau; teks identitas & kartu gelap.
- Bundle ter-deploy **tidak** lagi mengandung string literal
  `formatSchoolName(school.name).toUpperCase()` (bukti kwitansi bug backtick bersih).
- `Pondok Pesantren Al-Maa` muncul di chunk ter-deploy (kop dinamis).
- `tsc --noEmit` lolos.

**Catatan:** string "Yayasan Pondok Pesantren Tahfidz Al-Maa"
**Verifikasi UH + Bobot nilai (30 Sep 2026, ternyata ALREADY LIVE):**
Sudah ter-deploy di image backend saat ini (`fix-wa-dedup` dan `uh-bobot` = image ID sama
`da5f62f3d6af`), jadi task "lanjut UH+bobot" = verifikasi saja:
- `GET /api/academics/grade-weights` prod → 200 (list bobot per mapel, default 25/30/25/20).
- `PUT /api/academics/grade-weights` body `{"items":[{subject_id, subject_name, uts_weight, uas_weight, task_weight, uh_weight}]}` → 200 (jangan pakai key `weights` → 400).
- DB live: tabel `subject_grade_weights` ada (0 baris = pakai default), kolom `grades.uh_score` ada.
- Calc terbukti: grade temp uts=uas=task=uh=80 → final 80.00, huruf C (bands KKM: C=(kkm), B=kkm+5, A=kkm+15), lalu dihapus.
- Frontend (chunk ter-deploy jilid 62): input UH di `/admin/academics/form` + editor Bobot di tab akademik (UTS+UAS+Tugas+UH=100).
- Known caveat (TODO 5&6): `final_score` grade lama TIDAK dihitung ulang otomatis; hanya berubah saat grade di-edit ulang.
 masih ada di 2 prompt AI
artikel (`apps/backend/internal/platform/ai/gemini.go:248` & `281`) — bukan dokumen
cetak, butuh rebuild backend; sengaja TIDAK diubah di jilid ini.

## Jilid 61 — Kop e-raport: "Pondok Pesantren Al-Maa Parung Bogor" + teks di atas tabel PDF tak terlihat (29 Sep 2026, LIVE)

**Keluhan user (2):** (1) di preview e-raport kop bernama "yayasan", padahal harus
"Pondok Pesantren"; (2) "di atas tabel tulisannya engga kelihatan" (teks identitas +
kartu statistik hilang). Lokasi: `/admin/academics` → tab **Cetak Raport** → **PREVIEW PDF**.

**Akar masalah keduanya:**
1. Kop PDF diambil dari setting `school_name` (DB) = `Yayasan almaa parung bogor`
   (`lib/export.ts` → `loadKopInfo()` → `renderKop()`), di-`toUpperCase()` jadi
   "YAYASAN ALMAA PARUNG BOGOR". Preview modal HTML punya string sendiri
   ("PESANTREN ALAMPARUNG") yang tidak sinkron dengan PDF.
2. `renderStudentReport()` di `export.ts`: setelah `doc.setTextColor(255, 255, 255)`
   untuk judul "e-Raport Akademik Santri" (y=44, memang harus putih di atas kop hijau),
   **warna tidak pernah di-reset**. Semua teks berikutnya ikut putih di atas latar terang
   → "Nama Santri / Identitas / Rata-rata / Kehadiran / RATA-RATA NILAI / HADIR /
   IZIN-SAKIT / ALPHA" praktis tak terlihat. Raport massal juga kena (fungsi yang sama).

**Perubahan (3 file frontend + 1 setting DB):**
- `apps/frontend/src/lib/export.ts` → tambah `doc.setTextColor(30, 41, 59)` tepat
  setelah teks "e-Raport Akademik Santri"; fallback kop diubah ke
  `PONDOK PESANTREN AL-MAA PARUNG BOGOR`.
- `apps/frontend/src/components/KwitansiModal.tsx` → helper baru `formatSchoolName()`
  (prefiks "Pondok Pesantren" hanya bila nama belum berawalan itu) dipakai di header
  HTML **dan** PDF kwitansi. Tanpa ini tampil dobel "Pondok Pesantren Pondok…" karena
  `school_name` kini sudah memuat kata "Pondok Pesantren".
- `apps/frontend/src/app/admin/academics/page.tsx` → kop preview modal
  `PESANTREN ALAMPARUNG` → `PONDOK PESANTREN AL-MAA PARUNG BOGOR` (sinkron dengan PDF).
- DB `settings.school_name`: `Yayasan almaa parung bogor` →
  `Pondok Pesantren Al-Maa Parung Bogor` (user pilih **ubah global**, jadi ikut dipakai
  kop kwitansi, header/footer situs publik, dan PDF e-raport).
  `/api/settings/public` sudah mengembalikan nilai baru.
- Backup: `export.ts.bak-20260929-eraport`, `KwitansiModal.tsx.bak-20260929-eraport`,
  `page.tsx.bak-20260929-eraport`.

**Deploy:** `docker build -f Dockerfile.frontend -t alma-parung-frontend:fix-eraport-kop .`
→ swap container `alma-parung-frontend-bobot` (`-p 3002:3000`, restart always, tanpa env
tambahan; rewrite `/api` → `https://almaparung.com/api`). Container healthy.

**Verifikasi (PDF asli di-generate headless dari `/admin/academics`, 24.705 byte):**
- Isi kop terbaca: `PONDOK PESANTREN AL-MAA PARUNG BOGOR` + alamat/kontak dari setting.
- Content stream PDF: judul "e-Raport Akademik Santri" tetap `1. g` (putih di atas kop
  hijau — benar), sedangkan "Nama Santri" dan "RATA-RATA NILAI" kini
  `0.118 0.161 0.231 rg` (RGB 30,41,59 = gelap) — sebelumnya ikut putih.
- `/api/settings/public` → `school_name = Pondok Pesantren Al-Maa Parung Bogor`.
- `formatSchoolName` ada di chunk ter-deploy (kwitansi tidak dobel).
- Git auto-commit HEAD `92645c0` (academics), `89ef633` (KwitansiModal + export),
  `0e3bc80` (export).

**Catatan teknis verifikasi PDF headless (pola untuk agen penerus):** Chromium di
server tidak punya lib sistem. Ambil paket `.deb` lalu ekstrak ke satu prefix:
`apt-get download <paket>` → `dpkg-deb -x <deb> <prefix>` → jalankan
`LD_LIBRARY_PATH=<prefix>/usr/lib/x86_64-linux-gnu node script.js`. Paket yang dibutuhkan
antara lain: `libatk1.0-0t64`, `libcups2t64`, `libcairo2`, `libnss3`, `libavahi-common3`,
`libgbm1`, `libxkbcommon0`, `libasound2t64`, `libpango-1.0-0`. Di Ubuntu Noble package
`libcups2`/`libatk1.0-0` sudah ber-suffix `t64` (nama lama tidak punya candidate).
Cara baca teks PDF tanpa `pdftotext` (tidak ada di server): `zlib.decompress` tiap
`stream ... endstream`, lalu regex kurung. Intercept PDF dari `window.open()` (blob URL)
lalu `fetch` di dalam page dan kirim basis64 ke Node.

## Jilid 60 — WA PSB tidak lagi spam: hanya status bernilai + debounce 2 menit + LUNAS sekali (29 Sep 2026, LIVE)

**Permintaan user:** “kenapa ini kirim berkali2, coba kamu cek” — wali menerima WA
“Pembayaran pendaftaran telah terverifikasi (LUNAS)” beruntun.

**Akar masalah (terverifikasi dari DB + log + audit):** pesan LUNAS sebenarnya terkirim
HANYA 1× (baris `wa_notifications` id·36, `attempts=1`). Yang terasa “berkali-kali” adalah
4 WA berbeda dalam ±16 detik untuk Asep Sunandar (reg·40): 13:49:00 LUNAS, 13:49:09
“Berkas sedang diverifikasi panitia”, 13:49:11 “Sedang diproses”, 13:49:15 “Diterima”.
Pemicunya: superadmin mengubah payment→`paid`, lalu status `review`→`pending`→`accepted`
beruntun; *setiap* transisi memanggil `notifyPSBTransition` (psb/handler.go) yang selalu
mengirim WA. Faktor lain: nomor 6282114752228 juga terdaftar untuk reg·36 (jono) sehingga
menerima pesan serupa pada 25 Sep. Tidak ada retry/dobel kirim (attempts=1, status sent).

**Perubahan (2 file backend):**
- `apps/backend/internal/features/psb/handler.go` →
  `notifyPSBTransition` kini **hanya mengirim WA untuk status bernilai**: `tes`,
  `re_registration`, `accepted`, `rejected`, `santri`. Status antara `review`/`pending`
  TIDAK dikirim (tidak membanjiri wali). Plus **debounce `psb_status` 2 menit** per
  registrasi (lewati bila sudah ada notifikasi status yang sama < 2 menit lalu).
  `UpdatePaymentStatus` → pesan LUNAS **hanya saat transisi belum-lunas → lunas**
  (cek `prev.PaymentStatus` sebelum update); menyimpan catatan saat sudah lunas
  TIDAK mengirim ulang LUNAS.
- `apps/backend/internal/platform/wanotif/wanotif.go` → tambah fungsi `RecentKind`
  (cek keberadaan baris `registration_id`+`kind` dengan `created_at` dalam jeda waktu).

**Deploy:** `docker build -f apps/backend/Dockerfile -t alma-parung-backend:fix-wa-dedup .`
→ swap container `alma-parung-backend` (`-p 8090:8080`, restart always, bind
`data`→`/data` & `data/uploads`→`.../public/uploads`, env JWT/DAHL/API_PORT sama).
Backend healthy + `[WAGATE] terhubung`. Git auto-commit HEAD `3c6d1ef`. Backup:
`handler.go.bak-20260929-wafix`, `wanotif.go.bak-20260929-wafix`.

**Verifikasi (reg uji id·55, nomor fiktif → tetap mencatat baris WA tanpa spam):**
- status→`review` → TIDAK ada baris WA.
- payment `unpaid`→`paid` → 1× `psb_payment` (LUNAS); PUT `paid`+note lagi → TIDAK dobel.
- status→`accepted` → 1× `psb_status`; `accepted` lagi → debounce, TIDAK ada tambahan.
- Data uji (reg·55 + WA id·40/41) sudah dibersihkan dari DB live.

## Jilid 59 — Hapus PERMANEN "Program Unggulan" dari /portal/program + KUNCI source (29 Sep 2026, LIVE)

**Permintaan user:** “di halaman /portal/program, Program Unggulan dihilangkan aja tapi jangan
merubah settingan yang lain” + “kunci dulu agar agen lain tidak menggunakan source lama, atau
source lama otomatis dihapus”.

**Konteks:** fix Jilid 58 sebelumnya mengembalikan picker Program Unggulan (“Tahfidz/Bahasa”)
agar upload dokumen bisa lewat gate `program_choice`. User memutuskan Program Unggulan tidak
dipakai → picker dihapus permanen, tapi alur upload & pembayaran harus tetap jalan.

**Perubahan:**
- `apps/frontend/src/app/portal/program/page.tsx` → dikembalikan ke commit `0fd6a92`
  (sama persis, sudah dicek `diff`): tanpa Program Unggulan, hanya Jenjang (SMP/SMK) + Kategori,
  `program_choice: ''` pada `saveMyPSBRegistration`.
- `apps/frontend/src/app/portal/documents/page.tsx` → `program_choice` dihapus dari
  `requiredBiodataFields` / `isBiodataReady` (agar upload dokumen tidak terbebani field ini).
- `apps/frontend/src/app/portal/page.tsx` (dashboard) → `program_choice` dihapus dari
  `biodataFields` (sisa 1 pemakaian = label display "Program Pilihan", sengaja dipertahankan).
- `apps/frontend/src/app/portal/payment/page.tsx` → `program_choice` dihapus dari gate
  `requiredBiodataFields`.

**KUNCI / lock (agar agen lain tidak memakai source lama):**
- Image frontend live: `alma-parung-frontend:fix-psb-current`
  (= `fix-psb-upload-nopicker`, SHA `6ac3f7f070b6`).
- Image lama yang masih membawa picker sudah dihapus: `alma-parung-frontend:fix-psb-upload`
  dan `alma-parung-frontend:disc-wa`.
- Catatan lock ditulis di `AGENTS.md` §5b. JANGAN kembalikan picker / jangan jadikan
  `program_choice` wajib kecuali user memerintah.

**Verifikasi (headless, akun user·76 Aday):**
- `/portal/program`: HAS_PROGRAM_UNGGULAN=false, HAS_JENJANG=true, HAS_KATEGORI=true.
- Submit → redirect `/portal/documents` → upload KK: `POST /api/upload` 201,
  `PUT /api/psb/me/documents` 200, UI “kk_test.png berhasil disimpan”.
- Data uji (kk_url reg id·39) langsung dikembalikan ke `''`.

## Jilid 58 — Fix PSB upload: Program Unggulan tidak bisa dipilih, dokumen tidak bisa diunggah (29 Sep 2026, LIVE)

**Permintaan user:** “saya mau upload documen tidak bisa lagi” — di pendaftaran PSB.

**Akar masalah (regresi):** commit `0fd6a92` (26 Sep) menghapus pemilih
**Program Unggulan** (Tahfidz/Bahasa) dari `apps/frontend/src/app/portal/program/page.tsx`
dan mulai menyimpan `program_choice: ''` (hardcoded). Sementara itu halaman
`apps/frontend/src/app/portal/documents/page.tsx` masih memasukkan
`data?.program_choice` ke `requiredBiodataFields` sebagai syarat
`isBiodataReady` — sehingga calon santri tidak pernah lolos gate
(“Lengkapi Biodata”) dan **tidak bisa upload dokumen apa pun**.

**Verifikasi akar masalah:**
- `POST /api/upload`, `GET/PUT /api/psb/me`, `PUT /api/psb/me/documents` semua OK
  dari backend (uji curl dengan token valid, cookie & bearer, via 127.0.0.1:8090 dan
  https://almaparung.com) — bukan masalah backend/nginx/upload.
- Reproduksi headless (Playwright, akun user·68 jono dan user·76 Aday): halaman
  `/portal/program` tidak punya pilihan program; setelah simpan `program_choice=''″,
  `/portal/documents` menolak upload dengan gate “Lengkapi Biodata Dulu”.

**Perubahan:** kembalikan `apps/frontend/src/app/portal/program/page.tsx` ke versi
sebelum regresi (mengembalikan `Program` type, `programOptions` Tahfidz/Bahasa,
state + validasi + UI “Program Unggulan”, dan `program_choice: program` pada
`saveMyPSBRegistration`). File identik dengan `0fd6a92^`.

**Deploy:** `docker build -f Dockerfile.frontend -t alma-parung-frontend:fix-psb-upload .`
(structure sama dengan build `disc-wa`: node:20-alpine deps/builder/runner, healthcheck
wget). Container `alma-parung-frontend-bobot` di-*swap* ke image baru
(`-p 3002:3000`, restart unless-stopped). Git auto-commit HEAD `c212b3b`
(commit otomatis oleh watcher).

**Verifikasi pasca-deploy (headless, user Aday id·76, token craft /tmp/mk_token_aday.py):**
- `/portal/program` menampilkan Program Unggulan; pilih Tahfidz → Simpan & Lanjut
  → redirect ke `/portal/documents`.
- Upload KK di UI: `POST /api/upload` → 201, `PUT /api/psb/me/documents` → 200,
  UI menampilkan “kk_test.png berhasil disimpan”.
- DB: registrasi id·39 menerima `kk_url` + `program_choice='tahfidz'` selama pengujian;
  data uji sudah langsung dikembalikan ke asal (`''`).
- `https://almaparung.com` HTTP 200, container healthy.

**Lain-lain yang ditemukan selama investigasi:**
- `GET /api/me` butuh klaim email di JWT; token tanpa email → 404 → frontend tampil
  halaman login. Bukan bug, hanya urusan token uji.
- Container live sebelum deploy: backend `disc-wa` (0.0.0.0:8090→8080), frontend
  `disc-wa` (0.0.0.0:3002→3000), keduanya dibuat 29 Sep ±00:53–00:54.

## Jilid 57 — Tombol Kontak: dari WA Web ke WA Gateway + popup pesan (29 Sep 2026, LIVE)

**Permintaan user:** di `/admin/disciplines`, tombol **Kontak** tidak boleh lagi membuka
WhatsApp Web. Pesan harus dikirim lewat **WA gateway yang sudah terpasang**, dengan
**popup berisi pesan yang sudah terisi template dan bisa diedit** sebelum dikirim.

**Kondisi lama:** kedua handler di `apps/frontend/src/app/admin/disciplines/page.tsx`
(`handleSendWA` untuk pelanggaran, `handleSendWARekap` untuk rekap) membangun URL
`https://wa.me/<nomor>?text=<pesan>` lalu `window.open(..., '_blank')`. Jadi:
pesan terkirim lewat browser(user yang harus kirim & clicking "Continue" di WA Web),
tidak lewat gateway, dan tidak ada jejak/riwayat di sistem.

**Perubahan:**

*Backend* — `apps/backend/internal/features/disciplines/handler.go`

- Route baru: `POST /api/disciplines/wa-send` (otomatis ikut RBAC
  `RequireRole("superadmin", "panitia_psb")` karena di-mount di group yang sama
  di `main.go:508`).
- Handler `SendWANotification` memvalidasi lalu meneruskan ke
  `wanotif.Enqueue(ctx, nil, kind, phone, message)`, yang menyimpan ke tabel
  `wa_notifications` **dan langsung mencoba mengirim** via `whatsapp.SendMessage`.
  Kalau gagal ada retry berjenjang (60s/300s/1800s, `max_attempts=3`),
  status `pending`/`sent`/`failed`/`dead`.
- `registration_id` sengaja `nil`: Santri aktif bukan pendaftar PSB sehingga tidak
  punya baris di `registrations` — pola yang sama dipakai autobilling SPP.
- Nomor dinormalisasi dengan `whatsapp.NormalizePhone` (`08xx` → `62xx`,
  `+62`/`62` diteruskan).

Validasi (semua `400`, **sudah teruji live**, tidak menyentuh gateway):

| Kasus | Pesan |
|---|---|
| `message` kosong / hanya spasi | "Pesan tidak boleh kosong" |
| `message` > 4096 karakter | "Pesan terlalu panjang. Maksimal 4096 karakter." |
| nomor kosong / bukan 10–15 digit setelah normalisasi | "Nomor WhatsApp wali tidak valid. Perbarui nomor di data Santri terlebih dahulu." |
| JSON tidak valid / field hilang | "Payload permintaan tidak valid" |

*Frontend* — `apps/frontend/src/app/admin/disciplines/page.tsx`

- State baru: `waModal`, `waMessage`, `isSendingWA`, `waSendResult`.
- `openWAModal()` menggantikan `window.open`: pesan dihitung dari template yang **sama**
  (`wa_discipline_violation_template` / `wa_discipline_summary_template`, dengan fallback
  teks bawaan) lalu dibuka di `<textarea>` yang bisa diedit.
- Modal menampilkan nama Santri + nomor tujuan, counter karakter `n/4096`, dan
  keterangan "Dikirim via WhatsApp gateway — tidak membuka WhatsApp Web".
- `submitWA()` memanggil `sendDisciplineWA()`; status `failed`/`dead` dari gateway
  ditampilkan sebagai kegagalan dengan saran kirim ulang lewat Notifikasi WhatsApp
  (bukan `alert`/`confirm`jsbawaan).
- Helper baru `sendDisciplineWA()` di `apps/frontend/src/lib/api.ts`.

**Catatan desain (untuk agent penerus):** `student_id` sengaja tidak dipakai backend
untuk lookup nomor — nomor dikirim dari state frontend yang bersumber dari
`santri.parent_phone` (sudah benar sejak Jilid 56). Kalau mau mengeraskan agar nomor
pasti otoritatif server, tambahkan repository method yang mengambil nomor berdasarkan
`student_id` dan abaikan `phone` dari body.

**Verifikasi:**
- `gofmt` bersih, `go build ./...` exit 0, `go vet` exit 0.
- `npx tsc --noEmit` exit 0 (0 error).
- `POST /api/disciplines/wa-send` tanpa auth → `401` (route terdaftar, bukan 404).
- 6 kasus validasi di atas → `400` dengan pesan yang benar.
- `GET /api/disciplines/points` → `200`, `parent_phone` terisi, `student_id` ada.
- Bundle frontend ter-deploy: `disciplines/page.tsx` berisi `Kirim via Gateway`,
  **0** kemunculan `https://wa.me`, **0** `window.open`.
- `/api/ready` READY, `/admin/disciplines` 307 (auth, normal), tanpa panic/error di log.
- **Belum diuji:** pengiriman nyata ke nomor wali asli (mengirim pesan ke orang sungguhan)
  → butuh persetujuan user.

**Deploy:** `alma-parung-backend:disc-wa` + `alma-parung-frontend:disc-wa`, keduanya healthy.
Rollback: `alma-parung-backend-DISCWA-OLD-005417` (image `disc-fix`) dan
`alma-parung-frontend-DISCWA-OLD-005456` (image `sppautofix`).
Backup DB: `backups/pre-discwa-20260929-004139.db`.

**Peringatan (dari proses, bukan fitur):** saat investigasi sempat dibuat file
`waq_tmp.go` di root repo; auto-commit watcher **ter-commit**-nya (commit `9e0a29d`).
File sudah dihapus dan watcher ikut meng-commit penghapusannya (`7db5412`).
Pelajaran: letakkan file scratch di `/tmp`, jangan di dalam repo.

**Sisa `wa.me` di repo (di luar scope jilid ini):** `kontak`, `psb`, `donations`,
`admin/teachers`, `admin/settings/tabs/TabHalamanPSB`, `admin/messages`,
`components/PublicLayout.tsx`, `lib/donations.ts`, `lib/page-content.ts`.

## 5. TODO AKTIF
1. [ ] **18 dari 120 baris sheet memakai NIS sementara `TEMP001`..`TEMP018`** (No Induk aslinya 1–3 karakter: `13`, `005`, `-`, `2`, ... jadi gagal validasi `nis` 4-20 char). Kalau No Induk asli dikirim user, ganti lewat UI (`/admin/kesantrian`) — **jangan** lewat SQL. Petakan balik ada di `/tmp/apcheck/temp_nis_mapping.csv`.
1b. [ ] **Kelas `M YUSUF RAMADHAN` perlu dikonfirmasi** — sheet bilang kelas 1, DB lama bilang kelas **X**. Dia juga terduplikasi di sheet (2 baris, 1 orang), yang ke-2 sudah dibuang.
1c. [ ] **2 baris tanpa kelas** (`M DESTA PRATAMA`, `ZULFA FAKHRUNNISA`) diisi `SEMENTARA` — konfirmasi ke user.
1d. [ ] **Case nama di master sheet tidak konsisten** (ada `Aisyah Khoirunnisa` tapi juga `Alisa adriana putri` dan `AFIFAH SALMA TAZKIA`). Import took apa adanya, tidak diubah. Kalau mau dirapikan, perlu listing dari user dulu.
2. [ ] **Angka data di §2 hasil recount 1 Okt 2026: `santri` 103 & `users` 122** (paling baru), turun dari 116/124 yang tercatat Jilid 68 dan 119/126 di Jilid 65. Log container lama menunjukkan sebagian adalah `DELETE .../santri/{id}/purge` deliberate (200) antara 09:37-11:46 + `DELETE /api/users/201` (200) 10:39 — **jadi deletion via UI/API terjadi, sisanya belum dijelaskan**. Lanjut: bandingkan `backups/alma-parung-20261001-020001.db` (126/119) vs `backups/pre-deploy-j69-avatar-20261001-121634.db` (124/105) vs live (122/103) untuk melihat kapan baris hilang. **Jangan menyebut angka lama sebagai fakta tanpa recount.**
2y. [ ] **Angka-angka lama kedaluwarsa** — §5 item 1/1b/1c/3/4 masih bicara soal 116/119 Buffer dan 74/119 gender/wali kosong; realita sekarang 103 Buffer dengan 24 `lulus`. Counting ulang perlu konfirmasi user.
2z. [x] ~~Avatar belum dipakai di Sidebar/FloatingQuickMenu~~ **SELESAI di Jilid 70.** Catatan koreksi: klaim lama ini salah separuh — `Sidebar.tsx` memang **tidak punya avatar user sama sekali** (kotak `A` di header itu logo aplikasi "Al-Maa", bukan inisial), jadi blok identitas baru ditambahkan, bukan cuma menyalakan foto.
2b. [ ] **Password akun portal hasil import belum ada** (`randomPlaceholderHash`) untuk 124 akun. Kalau wali perlu login, admin harus reset password per akun (menu reset password sudah ada: `POST /api/santri/{id}/reset-password`).
3. [ ] **Gender 74/119 kosong** (hanya 45 yang carry-over dari DB lama) — kolom gender di master sheet terbalik, jadi tidak dipakai. Perlu sumber gender yang benar.
4. [ ] **Wali 74/119 kosong** — master sheet tidak punya kolom nama wali. No HP (84/119) yang terisi. Kalau butuh nama wali, harus minta sheet tambahan atau isi manual.
5. [ ] **GitHub push GAGAL** — PAT yang tertanam di URL remote (`origin`) sudah dicabut: `Invalid username or token`. 40+ commit masih lokal. Perlu token baru / `gh auth login`, lalu `git remote set-url origin` tanpa token (lebih aman).
6. [ ] Dokumen §2 tadinya tertinggal (menulis image `jilid64-bgnp1` padahal live sudah lain) — **sudah dikoreksi** di Jilid 65. subsided: Arbain + import Santri + fix-nullsanti **tidak pernah didokumentasikan**; hanya BGN yang tercatat. Kalau memproxy pekerjaan lanjutan, cek `git log` 30 Sep.
7. [ ] Jilid C: akun perdana (tunggu daftar nama+email+peran dari user).
8. [ ] Rotasi password SSH `H3ru@2026`.
9. [ ] Update skor halaman `/audit`.
10. [ ] (Opsional) KKM dinamis utk tampilan CBT & PDF predikat ikut KKM (sudah selaras via weight; cek halaman ekslusif CBT).
11. [ ] Isi UH untuk nilai yang sudah ada — kalau tidak, nilai lama turun saat di-edit ulang. **Catatan 28 Sep: opsi "set bobot UH = 0" TIDAK bisa dipakai** — `weight.ValidateGradeWeights` menolak bobot 0, jadi mapel tanpa ulangan harian perlu bobot redistributed (mis. 30/30/20/20) atau backend diubah agar bobot 0 boleh.
12. [ ] Bobot yang tersimpan tidak memengaruhi `grades` yang sudah ada; perlu tombol/endpoint "hitung ulang nilai" bila ditanyakan user. Rencana eksekusi sudah ditulis di `HANDOFF.md` item C.
13. [ ] Jangan hapus: `backups/*.gz|*.db`, image/tag + container agen lain (`pekerjaan-*`, `userdel-*`, `kopraport-*`, `role-separation-*`, `ai-fix*`, `santrifilter-*`), volume `clinic-os-*`, `/tmp/j28` (milik UID lain).
14. [ ] Minta user cek di Android/Chrome: field **Kelas** & **Status** di `/admin/kesantrian/form` kini dropdown kustom (image frontend `jilid44`) — pastikan tidak lagi "langsung nutup". Bila `<select>` native di halaman lain (mis. `/admin/school`, `/admin-bs`) juga bermasalah di Android, pola `SelectField` di `app/admin/kesantrian/form/page.tsx` bisa dipakai ulang.
15. [ ] `CATATAN-JILID42.md` belum diupdate untuk pekerjaan bobot / jilid43 / jilid44 / jilid45 — detail lengkap ada di §4 RINGKASAN. Lengkapi atau tandai usang.
16. [ ] File `/tmp/pgl/inspect10.js` (milik agen lain) berisi `JWT_SECRET` hardcode — sudah dilaporkan ke user; JANGAN dihapus tanpa izin karena mungkin masih dipakai agen lain.
17. [ ] 2 screenshot tutorial (`acad-08-presensi.png`, `acad-09-tahfidz.png`) sudah dipakai di `visualSteps`. Kalau menambah section tutorial lain, pakai pattern yang sama: redactor DOM + guard middleware, jangan asal taruh PNG ke `public/`.

## 6. PELAJARAN TEKNIS (jangan ulangi)
- SQLite `modernc` + `_txlock=immediate`: tulis saat `rows` terbuka = DEADLOCK. Kumpulkan dulu, tutup, baru tulis.
- PRAGMA `foreign_keys` tak bisa diubah di dalam transaksi.
- Placeholder `?` vs argumen Go dicek saat runtime, bukan compile — hitung manual (kasus jenjang: INSERT 25=25, UPDATE 23+id).
- Patch anchor dari copy basi = MISS; selalu dry-run di server. File `.bak-*` = agen lain sedang kerja.
- Build lama (backend ~10 mnt, frontend ~15 mnt, konteks 2,2 GB) — pakai `nohup` + polling, jangan blokir 1 call.
- `pgrep -f "docker build"` bisa false-positive dari perintah ssh sendiri.
- Tool `bash` merusak `$()`/backtick dalam perintah remote - pakai file script + scp.
- **`student_id` di tabel fitur `disciplines` != `santri.id`.** Kolom itu menunjuk `users.id`; kolom nama di
  query joined ke `users`, jadi akun staff bisa ikut tampil. Cek ulang `JOIN ... ON` sebelum menambah
  validasi, atau data bisa menunjuk akun admin/staff.
- Patch string-literal ke file JS/Go rawan salah baca. Verifikasi ulang dengan `python3` `repr()`/`ord()`,
  atau pakai patch berbasis regex/nomor baris, bukan string match panjang.
- Alias SQL ganda (gaya `JOIN x s s ON`) lolos `go build` karena SQL tak divalidasi compile, tapi balas
  **500** saat runtime. Setelah ubah query, selalu uji `GET` (bukan cuma `POST`) di container uji.
- `docker run -v /tmp:/data` + `DB_PATH=/data/alma-parung.db` akan **membuat DB kosong baru** kalau nama
  filenya berbeda -> semua token 401 ("sesi tidak valid"). Mount direktori khusus, jangan `/tmp` mentah.
- `sudo rm` file di `/tmp` milik user lain sebelum `scp` ulang; file root-owned di `/tmp` membuat scp gagal.
- **Semua data BGN lama benar-benar kasar.** 58 Santri tanpa No HP sama sekali (`parent_phone` 0/58),
  wali cuma 1 field gabungan tanpa pisah ayah/ibu, dan tidak ada satupun tagihan/kuitansi/rapor.
  Kalau pengen restored, mending **import dari master Google Sheet** daripada andalkan DB lama.
- **Kolom gender di master sheet terbalik** (45/46 baris yang cocok beda dengan DB lama, pola geser 1 baris).
  Jangan percaya sheet tanpa cross-check ke sumber lain — gender dipakai untuk filter/laporan.
- **`POST /api/santri/bulk` itu all-or-nothing** (1 baris invalid → 400 untuk seluruh batch) dan
  `validateSantri` mewajibkan `nis` 4-20 char + `class` terisi. Data yang tidak lolos filter **tidak boleh**
  dipaksa masuk lewat SQL: recordnya akan menggagalkan validasi saat diedit lewat UI.
- **`ensureUserAccount` membuat akun portal tiap kali Santri di-create** (email `<nis>@almaparung.local`,
  `randomPlaceholderHash()`). Import massal = akun massal. Kalau tidak diinginkan, set `user_id` NULL
  setelah import, atau ubah `ensureUserAccount` dulu.
- **Kolom yang di-DROP bisa dihidupkan lagi oleh image lama.** Setelah `DROP COLUMN` BGN, backend yang masih
  jalan `migrateSantriBgnColumns` akan menambahkannya kembali saat start. Setelah drop kolom, WAJIB deploy
  image yang sudah pakai `migrateDropBgnArtifacts` — jangan restart container dengan image lama.
- `nohup cmd &` saja **TIDAK cukup** di environment ini: shell tool yang memanggilnya bisa di-kill saat
  timeout dan ikut membunuh proses anak. Pakai `setsid nohup bash -c '...' </dev/null &` + `disown`,
  lalu verifikasi jalan dengan `pgrep`.
- **Jumlah argumen `rows.Scan` tidak dicek compiler** (SQL juga tidak) — menambah kolom ke `SELECT`
  tanpa menambah variabel di `Scan` lolos `go build` + `go vet` + test yang tidak menyentuh query itu,
  lalu balas **500** saat runtime (`sql: expected N destination arguments in Scan, not M`). Contoh nyata
  Jilid 67: `santri.FindByUserID` tertinggal 1 kolom. **Setelah menambah kolom di query, hitung ulang
  semua `Scan` di file itu** (`grep -c "COALESCE(" <query>` vs jumlah argumen `Scan`).
- **Daftar nilai enum jangan diduplikasi per-file.** Jilid 67 menyatukan kategori ke
  `validators.NormalizeCategory` + konstanta. Manfaatnya: alias ejaan (`duafa`→`dhuafa`) dan kapitalisasi
  ditangani sekali, dan test bisa mengunci daftar yang sama. Kalau menambah enum baru, taruh di
  `validators` dari awal, jangan `if x != "a" && x != "b"` di tiap handler.
- **Nilai enum yang tidak dinormalkan = dua sumber kebenaran.** Sheet/UI lama menulis `Duafa`, form baru
  menulis `Dhuafa`; tanpa normalisasi keduanya jadi nilai berbeda di DB dan laporan tidak pernah cocok.
  Normalisasi harus di **tulis** (payload create/update/accept), bukan hanya saat baca.
- **Angka di dokumen bisa basi Diam-diam.** §2 RINGKASAN mengklaim `santri` 119 / `users` 126, DB live
  1 Okt ternyata 116 / 124. Selalu recount lewat `python3` sebelum menulis angka ke dokumen atau
  mengambil keputusan (mis. "hapus semua akun import").
- Menjalankan test Go di host: `go` ada tapi versinya (1.22) **lebih tua** dari `go 1.26` yang diminta
  `go.mod` → selalu lewat container `golang:1.26` dengan cache di-mount sebagai user saat ini
  (`-u $(id -u):$(id -g) -v "$PWD/.gomodcache:/gomodcache" -v "$PWD/.gocache:/gocache"`), jangan `sudo`
  (cache jadi root-owned, sudah pernah jadi insiden 28 Sep).
- **`parseResponse()` frontend me-redirect ke `/login` pada SETIAP 401.** Jadi jangan pakai 401 untuk
  "kredensial yang kamu masukkan salah" (mis. password lama tidak cocok) — user akan terkeluar dari
  halaman dan tidak pernah melihat pesan error-nya. Pakai 400 + `errors.<field>` supaya bisa
  ditampilkan inline. 401 di backend cukup untuk "token tidak ada / kedaluwarsa".
- **Cek "tombol mati" sebelum\\/selector/CSS-nya dipakai user.** Tombol `X` lama di header
  dashboard_visible tapi selalu no-op: sidebar tertutup = `setFalse(false)`, sidebar terbuka =
  tertutup backdrop `z-40` di atas header `z-30`. Cara cepat: cek `z-index` bertumpuk
  (apakah ada yang menutupi) **dan** apakah state yang di-toggle sudah bernilai awal.
- **Port 3006 sudah dipakai `tempe-webapp`** (project lain, jangan disentuh) — pakai 3008/3009
  untuk container uji. `docker ps --format '{{.Ports}}' | grep ":$p->"` sebelum memilih port.
- **Container uji TIDAK bisa menjangkau host lewat `172.17.0.1`** (firewall docker0) → `wget:
  download timed out`. Pakai **docker network** bersama + nama container sebagai hostname
  (`docker network create x && docker network connect x a && ...`), bukan IP host.
- Frontend production **bake rewrite `/api` ke `https://almaparung.com`** saat build
  (lihat `routes-manifest.json`), jadi container uji frontend **tetap menembak API produksi**.
  Untuk menguji UI tanpa menyentuh produksi, taruh nginx/nginx:alpine di depan dua container uji
  di network yang sama: `/api/` → container backend uji, sisanya → container frontend uji.
- `next build` = **build yang paling mahal** (~15 mnt). Jalankan build backend + frontend
  **sekaligus** di background ( dua proses `setsid nohup` terpisah + file penanda `.done`) —
  jalan paralel, totalnya ~15 mnt bukan 25.
- Legacy builder buffered output `docker build` (log cuma 4 baris "DEPRECATED" selama puluhan
  menit). Jangan kira build mati — cek proses `ps aux | grep "[d]ocker build"` dan tunggu file
  `.done`. Pesan "Install the buildx component" itu **warning**, bukan error.

- Skala nilai seragam KKM 0-100 (grade+CBT+predikat selaras; kesantrian tampil 0-100). Live: backend+frontend `skala`.
- **chi**: memecah grup terproteksi jadi `r.Route(path, func(r chi.Router){ ... })` dengan grup READ rute spesifik + grup WRITE `r.Mount("/", h.Routes())` aman — rute spesifik menang untuk method-nya, sisanya tetap masuk mount (POST/PUT/DELETE **bukan** 405, sudah diuji 13/13). Tetap wajib uji ulang endpoint WRITE setiap kali melakukan pemecahan seperti ini.
- **Android/Chrome**: popup `<select>` native bisa "terbuka lalu langsung nutup". Headless tidak bisa menirukan popup, dan instrumentasi (urutan event, blur, mutasi DOM, scroll, transform/filter ancestor) bisa bersih total → jangan disalahkan logika React; ganti ke combobox kustom (lihat `SelectField`).
- `tsc --noEmit` gagal `TS5033` kalau `tsconfig.tsbuildinfo` dimiliki root → tambah `--incremental false`.
- DB live mode WAL (ada `-wal`/`-shm`); salinan konsisten pakai `python3` `src.backup(dst)`, bukan `cp`.
- Berkas root-owned di `/tmp`/folder ter-mount tidak bisa dihapus oleh `heru` → `docker run --rm -v DIR:/x alpine sh -c "rm -rf /x/*"`.
- `sudo -S` tanpa `-p ''` mencetak prompt tanpa newline, jadi `console.log`/echo PERTAMA ikut menempel di baris prompt lalu ikut terhapus `grep -v '^\[sudo'` — awas thinks "baris hilang". Pakai `sudo -S -p ''`.
- Screenshot tutorial: `public/` = aset publik tanpa auth. Selalu (1) redaksi data di DOM sebelum `screenshot()` dengan sumber nama dari API, (2) guard path di `src/middleware.ts`. Validasi dengan `curl` **tanpa cookie** (harus 307, bukan 200).
- `<img loading="lazy"` di bawah fold: `naturalWidth` = 0 saat dicek → false "gambar rusak". Paksa scroll sampai bawah + tunggu, baru cek `naturalWidth`; `HTTP 4xx/5xx = 0` adalah bukti paling andal.
- Build: jalankan `nohup ... > log 2>&1 &` + file penanda `.done`; jangan `pgrep -f <cmd>` lewat ssh (self-match → loop nyangkut & broken pipe). Pesan "Install the buildx component" dari `docker build` = warning legacy builder, bukan error.
