# Lisensi Darussunnah

Sistem lisensi saat ini tidak memakai database terpisah. License key disimpan di:

- tabel `settings`
- key `app_license_key`

Backend akan memverifikasi token lisensi menggunakan:

- [apps/backend/public.key](/D:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/public.key)

## Alur Kerja

1. Buat pasangan RSA key baru jika Anda belum punya private key yang cocok dengan `public.key`.
2. Simpan private key di luar repository.
3. Tempel public key hasil generate ke `apps/backend/public.key`.
4. Redeploy backend.
5. Issue license key JWT dengan private key.
6. Login ke admin dan buka `Pengaturan Website -> Lisensi`.
7. Paste token lisensi ke form lisensi.

## Tool CLI

Generator tersedia di:

- `apps/backend/cmd/licensectl`

### Generate key pair

```bash
cd apps/backend
go run ./cmd/licensectl genkeypair \
  --private-out ../../secrets/darussunnah-license-private.pem \
  --public-out ./public.key
```

### Issue lisensi 1 tahun

```bash
cd apps/backend
go run ./cmd/licensectl issue \
  --private-key ../../secrets/darussunnah-license-private.pem \
  --days 365 \
  --customer "Pondok Pesantren Darussunnah" \
  --domain darussunnahparung.com \
  --plan annual
```

Perintah itu akan mencetak satu JWT panjang. Tempel JWT itu ke tab `Lisensi`.

### Inspect isi token

```bash
cd apps/backend
go run ./cmd/licensectl inspect --token "<JWT_LICENSE>"
```

## Catatan Penting

- Jangan commit private key ke GitHub.
- Jika Anda generate key pair baru, backend harus memakai `public.key` yang baru sebelum token lisensi baru akan dianggap valid.
- Validator saat ini minimal membutuhkan claim `exp`. Tool `licensectl` juga menambahkan `iss`, `iat`, `nbf`, `plan`, `customer`, dan `domain` untuk audit yang lebih rapi.
