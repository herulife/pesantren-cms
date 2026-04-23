---
trigger: always_on
---

## Mandat Keamanan

**Keamanan adalah persyaratan dasar, bukan fitur.**

### Prinsip Keamanan Universal

1. **Jangan pernah percaya input pengguna:** Semua data dari pengguna, API, atau sumber eksternal harus divalidasi di sisi server
2. **Tolak secara default:** Memerlukan pemberian izin yang eksplisit, jangan pernah mengasumsikan akses
3. **Gagal secara aman:** Ketika terjadi error, gagal secara tertutup (tolak akses) daripada terbuka
4. **Pertahanan berlapis:** Beberapa lapisan keamanan, jangan pernah mengandalkan satu kontrol tunggal

**Saat mengimplementasikan fitur yang sensitif terhadap keamanan (autentikasi, validasi, query), lihat Prinsip Keamanan @security-principles.md untuk panduan implementasi yang detail.**

### Prinsip Terkait
- Prinsip Keamanan @security-principles.md