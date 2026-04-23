---
trigger: always_on
---

## Hindari Dependensi Melingkar

**Masalah:** Modul A mengimpor B, B mengimpor A

- Menyebabkan kegagalan build, masalah inisialisasi
- Menunjukkan batasan modul yang buruk

**Solusi:**

- Ekstrak kode bersama ke modul ketiga
- Restrukturisasi dependensi (A→C, B→C)
- Gunakan injeksi dependensi
