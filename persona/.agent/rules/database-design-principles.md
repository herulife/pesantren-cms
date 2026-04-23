---
trigger: model_decision
description: Saat merancang skema database, menulis migrasi, membuat query, atau bekerja dengan batasan transaksi
---

## Prinsip Desain Database

### Desain Skema

**Normalisasi:**
- Mulai dengan 3NF (Third Normal Form) dan denormalisasi hanya ketika performa yang terukur memerlukannya
- Setiap tabel harus merepresentasikan satu entitas tunggal
- Hindari menyimpan data turunan/terhitung kecuali caching secara eksplisit diperlukan

**Konvensi Penamaan:**
- Tabel: jamak, snake_case (misalnya, `users`, `task_assignments`)
- Kolom: tunggal, snake_case (misalnya, `created_at`, `user_id`)
- Foreign key: `{tabel_direferensikan_tunggal}_id` (misalnya, `user_id`, `task_id`)
- Indeks: `idx_{tabel}_{kolom}` (misalnya, `idx_users_email`)
- Constraint: `{tipe}_{tabel}_{kolom}` (misalnya, `uq_users_email`, `fk_tasks_user_id`)

**Kolom wajib untuk semua tabel:**
- `id` — primary key (UUID diutamakan, auto-increment dapat diterima)
- `created_at` — timestamp, diatur saat insert, tidak pernah diperbarui
- `updated_at` — timestamp, diperbarui pada setiap modifikasi

### Migrasi

**Aturan Keamanan:**
- **Jangan pernah hapus kolom di produksi** tanpa periode penghentian bertahap (deprecation)
- **Jangan pernah ganti nama kolom secara langsung** — tambah baru, migrasi data, hapus yang lama
- **Selalu buat migrasi yang dapat dibalik** — sertakan baik up maupun down
- **Uji migrasi pada salinan data produksi** sebelum menerapkan

**Strategi Migrasi:**
1. Perubahan aditif terlebih dahulu (tambah kolom, tambah tabel)
2. Isi ulang data (backfill)
3. Perbarui kode aplikasi
4. Hapus kolom/tabel lama di migrasi masa depan

### Query

**Performa:**
- **Selalu gunakan query berparameter** (jangan pernah penggabungan string)
- **Buat indeks pada kolom** yang digunakan di klausa WHERE, JOIN, dan ORDER BY
- **Hindari SELECT \*** — tentukan hanya kolom yang diperlukan
- **Waspadai query N+1** — gunakan JOIN atau batch loading
- **Tetapkan timeout query** untuk mencegah query yang berjalan lama memblokir

**Transaksi:**
- Gunakan transaksi untuk operasi yang memodifikasi beberapa baris/tabel
- Pertahankan transaksi sesingkat mungkin
- Tangani deadlock dengan logika percobaan ulang
- Jangan pernah membiarkan transaksi terbuka selama interaksi pengguna atau panggilan API eksternal

### Daftar Periksa Desain Database

- [ ] Skema mengikuti konvensi penamaan?
- [ ] Semua tabel memiliki `id`, `created_at`, `updated_at`?
- [ ] Foreign key memiliki constraint dan indeks yang tepat?
- [ ] Query berparameter (tidak ada SQL injection)?
- [ ] Indeks ada untuk pola query yang sering?
- [ ] Migrasi dapat dibalik?
- [ ] Transaksi pendek dan terfokus?
- [ ] Query N+1 dihindari?

### Prinsip Terkait
- Prinsip Keamanan @security-principles.md (pencegahan SQL injection)
- Prinsip Optimasi Performa @performance-optimization-principles.md (performa query)
- Prinsip Penanganan Error @error-handling-principles.md (penanganan error transaksi)
