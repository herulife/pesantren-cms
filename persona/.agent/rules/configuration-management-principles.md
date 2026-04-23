---
trigger: model_decision
description: Saat bekerja dengan konfigurasi aplikasi, variabel lingkungan, file pengaturan, atau manajemen secret
---

## Prinsip Manajemen Konfigurasi

### Pemisahan Konfigurasi dan Kode

**Konfigurasi:**

- Nilai spesifik lingkungan (URL, kredensial, feature flag, timeout)
- Berubah antara dev/staging/prod
- Dapat berubah tanpa deployment kode

**Kode:**

- Logika bisnis dan perilaku aplikasi
- Sama di semua lingkungan
- Memerlukan deployment untuk berubah

**Jangan pernah hardcode konfigurasi dalam kode:**

- ❌ `const DB_URL = "postgresql://prod-db:5432/myapp"`
- ✅ `const DB_URL = process.env.DATABASE_URL`

### Validasi Konfigurasi

**Validasi saat startup:**

- Periksa semua konfigurasi yang diperlukan sudah ada
- Gagal cepat jika konfigurasi yang diperlukan hilang atau tidak valid
- Berikan pesan error yang jelas untuk kesalahan konfigurasi
- Contoh: "Variabel lingkungan DATABASE_URL diperlukan"

**Pemeriksaan validasi:**

- Tipe (string, number, boolean, enum)
- Format (URL, email, path file)
- Rentang (nomor port 1-65535)
- Dependensi (jika fitur X diaktifkan, konfigurasi Y diperlukan)

### Hierarki Konfigurasi

**Prioritas (tertinggi ke terendah):**

1. **Argumen baris perintah:** Menimpa semua (untuk pengujian, debugging)
2. **Variabel lingkungan:** Menimpa file konfigurasi
3. **File konfigurasi:** Spesifik lingkungan (config.prod.yaml, config.dev.yaml)
4. **Default:** Default yang masuk akal dalam kode (fallback)

**Contoh:**

Resolusi port database:

1. Periksa argumen CLI: --db-port=5433

2. Periksa variabel lingkungan: DB_PORT=5432

3. Periksa file konfigurasi: database.port=5432

4. Gunakan default: 5432

### Organisasi Konfigurasi

Pendekatan Hibrida (file konfigurasi + file .env): definisikan struktur konfigurasi dalam file konfigurasi (misalnya config/database.yaml) dan gunakan file .env untuk menyuntikkan nilai secret.

**File .env:** Deskripsi: File yang didedikasikan untuk lingkungan tertentu (development). Untuk produksi, nilai-nilai ini berasal dari platform/manajer secret/lingkungan, bukan file `.env` fisik di disk. Kapan Digunakan: Gunakan ini hanya untuk secret (kunci API, kata sandi) dan beberapa nilai spesifik lingkungan (seperti IP server). File-file ini kecuali `.env.template` tidak boleh pernah di-commit ke version control (git).

- `.env.template` - Berisi kredensial dan secret dengan nilai kosong (HARUS di-commit ke git)
- `.env.development` - Kredensial dan secret development lokal (TIDAK BOLEH di-commit ke git)

**Contoh `.env.development`:**
```
DEV_DB_HOST=123.45.67.89
DEV_DB_USERNAME=prod_user
DEV_DB_PASSWORD=kata_sandi_produksi_yang_sangat_aman
```

**File fitur:** Deskripsi: Pengaturan dikelompokkan ke dalam file berdasarkan fungsinya (database, auth, dll.). Ini menjaga konfigurasi Anda tetap terorganisir. Kapan Digunakan: Gunakan ini sebagai metode utama Anda untuk mengorganisir pengaturan non-secret. Ini adalah cara terbaik untuk menjaga konfigurasi Anda tetap bersih dan skalabel seiring pertumbuhan aplikasi Anda.

- `config/database.yaml` - Pengaturan database
- `config/redis.yaml` - Pengaturan cache
- `config/auth.yaml` - Pengaturan autentikasi

**Contoh `config/database.yaml`:**
```
default: &default
  adapter: postgresql
  pool: 5
development:
  <<: *default
  host: localhost
  database: myapp_dev
  username: <%= ENV['DEV_DB_USERNAME'] %> # Placeholder untuk secret
  password: <%= ENV['DEV_DB_PASSWORD'] %>
production:
  <<: *default
  host: <%= ENV['PROD_DB_HOST'] %>
  database: myapp_prod
  username: <%= ENV['PROD_DB_USERNAME'] %>
  password: <%= ENV['PROD_DB_PASSWORD'] %>
```

### Prinsip Terkait
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md
