---
trigger: model_decision
description: Saat menjalankan perintah eksternal, skrip shell, atau proses sistem
---

## Prinsip Eksekusi Perintah

### Keamanan

**Jangan pernah menjalankan input pengguna secara langsung:**

- ❌ `exec(userInput)`
- ❌ `shell("rm " + userFile)`
- ✅ Gunakan daftar argumen, bukan penggabungan string shell
- ✅ Validasi dan sanitasi semua argumen

**Jalankan dengan izin minimum:**

- Jangan pernah menjalankan perintah sebagai root/admin tanpa persetujuan eksplisit dari manusia. Jika izin tinggi benar-benar diperlukan, BERHENTI dan minta otorisasi.
- Gunakan akun layanan dengan hak akses minimum

### Portabilitas

**Gunakan pustaka standar bahasa:**

- Hindari perintah shell ketika pustaka standar menyediakan fungsionalitas
- Contoh: Gunakan API I/O file daripada `cat`, `cp`, `mv`

**Uji pada semua OS target:**

- Windows, Linux, macOS memiliki perintah dan perilaku yang berbeda
- Gunakan fungsi penggabungan path (jangan gabungkan dengan /)

### Penanganan Error

**Periksa kode keluar (exit code):**

- Kode keluar bukan-nol = kegagalan
- Tangkap dan log stderr
- Tetapkan timeout untuk perintah yang berjalan lama
- Tangani "perintah tidak ditemukan" dengan halus

### Daftar Periksa Eksekusi Perintah

- [ ] Apakah input pengguna disanitasi/divalidasi sebelum digunakan dalam perintah?
- [ ] Apakah argumen diberikan sebagai daftar (bukan penggabungan string shell)?
- [ ] Apakah perintah berjalan dengan izin minimum yang diperlukan?
- [ ] Apakah kode keluar diperiksa dan error ditangani?
- [ ] Apakah timeout ditetapkan untuk perintah yang berjalan lama?
- [ ] Apakah stderr ditangkap dan di-log?

### Prinsip Terkait
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md