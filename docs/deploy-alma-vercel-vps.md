# Deploy Alma Parung via GitHub, Vercel, dan VPS

Dokumen ini menjelaskan alur deploy untuk setup berikut:

- Frontend Next.js di `apps/frontend`
- Backend Go di `apps/backend`
- Source of truth di GitHub: `herulife/alma-parung`
- Frontend deploy ke Vercel
- Backend deploy ke VPS dengan domain `https://almaparung.com`

## Branch aktif

Branch yang sudah dipush untuk setup ini:

- `codex/pesantren-cms-import-2026-05-04`

Jika repo GitHub belum punya branch `main`, ada dua opsi:

1. Pakai branch di atas sebagai production branch sementara di Vercel
2. Buat branch `main` dari commit yang sama saat kamu sudah siap produksi

## Arsitektur deploy

- User membuka frontend di domain Vercel atau custom domain frontend
- Frontend tetap memanggil `/api/*` dan `/uploads/*`
- Vercel me-rewrite request tersebut ke backend VPS
- Backend Go melayani API dan file upload dari `https://almaparung.com`

Alur request:

1. Browser akses `https://frontend-kamu.vercel.app`
2. Request `/api/...` diterima frontend Vercel
3. Vercel proxy ke `https://almaparung.com/api/...`
4. Browser tetap merasa request berasal dari domain frontend

## Env frontend di Vercel

Masuk ke Vercel Project -> Settings -> Environment Variables.

Tambahkan:

- `BACKEND_ORIGIN=https://almaparung.com`
- `NEXT_PUBLIC_SITE_API_ORIGIN=https://almaparung.com`

Catatan:

- `BACKEND_ORIGIN` dipakai oleh rewrite di `next.config.ts`
- `NEXT_PUBLIC_SITE_API_ORIGIN` dipakai untuk fallback server-side fetch
- `NEXT_PUBLIC_API_URL` tidak wajib diisi untuk setup ini

## Setup project Vercel

Saat import repo `herulife/alma-parung` ke Vercel:

1. Pilih repository GitHub `alma-parung`
2. Framework akan terdeteksi sebagai Next.js
3. Set `Root Directory` ke `apps/frontend`
4. Build command: biarkan default
5. Output directory: biarkan default
6. Tambahkan env frontend di atas
7. Deploy

## Kenapa tidak direct call ke backend domain dari browser

Frontend saat ini lebih aman memakai rewrite daripada direct cross-origin call.

Alasannya:

- cookie login backend masih `SameSite=Lax`
- request browser yang tetap same-origin lewat Vercel lebih stabil
- tidak perlu expose URL API mentah ke semua sisi client

## Env backend di VPS

Contoh env production backend:

```env
APP_URL=https://almaparung.com
API_PORT=8080
ALLOWED_ORIGINS=https://frontend-kamu.vercel.app
DB_PATH=/home/ubuntu24/my-docker-apps/apps/almaparung/deploy/almaparung/data/alma.db
JWT_SECRET=ganti_dengan_secret_panjang
COOKIE_SECURE=true
DEV_MODE=false
ENVIRONMENT=production
GOOGLE_CLIENT_ID=isi_jika_pakai_google_login
FONNTE_API_URL=https://api.fonnte.com/send
FONNTE_API_KEY=isi_jika_pakai
GEMINI_API_KEY=opsional
```

Jika nanti frontend memakai custom domain, update `ALLOWED_ORIGINS` ke domain itu juga.

Contoh:

```env
ALLOWED_ORIGINS=https://alma.example.com,https://frontend-kamu.vercel.app
```

## Deploy backend di VPS

Direkomendasikan:

- source di-clone dari GitHub
- backend dijalankan sebagai `systemd service`
- Nginx reverse proxy di depan backend
- HTTPS aktif di level Nginx

Langkah ringkas:

1. Clone repo ke VPS
2. Checkout branch production yang kamu pilih
3. Buat `.env` backend production
4. Build atau jalankan service Go
5. Pasang config Nginx
6. Reload Nginx

## Update backend dari GitHub

Untuk awal, cukup manual:

```bash
cd /opt/alma-parung/app
git pull
sudo systemctl restart alma-backend
```

Kalau nanti mau full otomatis, baru tambah GitHub Actions via SSH.

## Checklist production

- Vercel project mengarah ke `apps/frontend`
- Env `BACKEND_ORIGIN` sudah diisi
- Env `NEXT_PUBLIC_SITE_API_ORIGIN` sudah diisi
- Backend VPS memakai `COOKIE_SECURE=true`
- Backend VPS memakai `DEV_MODE=false`
- `ALLOWED_ORIGINS` tidak mengandung `localhost`
- Nginx VPS sudah melayani HTTPS
- Endpoint backend sehat di `https://almaparung.com/api/health`

## Endpoint penting untuk test

- Frontend: `https://frontend-kamu.vercel.app`
- Backend health: `https://almaparung.com/api/health`
- Upload proxy: `https://frontend-kamu.vercel.app/uploads/...`
- Login API lewat Vercel rewrite: `https://frontend-kamu.vercel.app/api/login`

## Catatan repo saat ini

Perubahan frontend yang sudah siap untuk setup ini:

- branding publik Al-Maa
- logo `logo-alama.jpg`
- rewrite frontend tidak lagi hardcode `localhost`
- fallback API server-side memakai environment
