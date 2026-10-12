# Alma Backend Deploy

Folder ini berisi contoh file deploy backend Alma Parung untuk VPS yang
melayani API melalui `https://benuatech.web.id`.

Isi folder:

- `.env.example`: contoh env production backend
- `alma-backend.service`: contoh unit `systemd`
- `nginx.benuatech.web.id.conf`: contoh reverse proxy Nginx untuk `/api` dan `/uploads`

## Rekomendasi path di VPS

```text
/opt/alma-parung/app
/opt/alma-parung/data
```

## Langkah singkat

1. Clone repo ke `/opt/alma-parung/app`
2. Checkout branch production
3. Salin `.env.example` menjadi file env yang dipakai service
4. Sesuaikan `JWT_SECRET`, `ALLOWED_ORIGINS`, dan path database
5. Copy unit service ke `/etc/systemd/system/alma-backend.service`
6. Copy config Nginx ke `/etc/nginx/sites-available/`
7. Aktifkan site, reload Nginx, lalu start service backend
