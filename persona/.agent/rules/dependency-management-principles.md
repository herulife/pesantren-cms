---
trigger: model_decision
description: Saat mengelola dependensi proyek, mengkonfigurasi file paket, atau mengorganisir impor modul
---

## Prinsip Manajemen Dependensi

### Penguncian Versi (Version Pinning)

**Produksi:** Kunci versi tepat (1.2.3, bukan ^1.2.0)

- Mencegah serangan rantai pasokan (supply chain attack)
- Mencegah kerusakan tak terduga dari pembaruan patch
- Memastikan build yang dapat direproduksi

**Gunakan lock file:**

- package-lock.json (Node.js)
- Cargo.lock (Rust)
- go.sum (Go)
- requirements.txt (Python)

### Minimalkan Dependensi

**Setiap dependensi adalah kewajiban:**

- Potensi kerentanan keamanan
- Peningkatan waktu build dan ukuran artefak
- Beban pemeliharaan (pembaruan, kompatibilitas)

**Tanyakan sebelum menambah dependensi:**

- "Bisakah saya mengimplementasikan ini dalam 50 baris?"
- "Apakah fungsionalitas ini kritis?"
- "Apakah dependensi ini aktif dipelihara?"
- "Apakah ini versi stabil terbaru?"

### Organisasi Impor

**Pengelompokan:**

1. Pustaka standar
2. Dependensi eksternal
3. Modul internal

**Pengurutan:** Alfabet dalam setiap kelompok

**Pembersihan:** Hapus impor yang tidak digunakan (gunakan linter/formatter)

### Daftar Periksa Manajemen Dependensi

- [ ] Apakah dependensi produksi dikunci ke versi tepat?
- [ ] Apakah lock file di-commit ke version control?
- [ ] Bisakah setiap dependensi dijustifikasi (tidak dapat diimplementasikan dalam <50 baris)?
- [ ] Apakah semua dependensi aktif dipelihara dan pada versi stabil terbaru?
- [ ] Apakah impor diorganisir berdasarkan kelompok (stdlib → eksternal → internal)?
- [ ] Apakah impor yang tidak digunakan sudah dihapus?

### Prinsip Terkait
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md