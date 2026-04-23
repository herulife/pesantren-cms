---
trigger: always_on
---

## Prinsip Dokumentasi

### Kode yang Mendokumentasikan Diri Sendiri

**Penamaan yang jelas mengurangi kebutuhan komentar:**

- Kode menunjukkan APA yang terjadi
- Komentar menjelaskan MENGAPA dilakukan dengan cara ini

**Kapan perlu komentar:**

- Logika bisnis yang kompleks perlu penjelasan
- Algoritma yang tidak jelas (jelaskan pendekatannya)
- Solusi sementara untuk bug (tautkan ke issue tracker)
- Optimasi performa (jelaskan trade-off-nya)

### Level Dokumentasi

1. **Komentar inline:** Jelaskan MENGAPA untuk kode yang kompleks
2. **Dokumentasi fungsi/metode:** Kontrak API (parameter, return, error)
3. **Dokumentasi modul/paket:** Tujuan dan penggunaan tingkat tinggi
4. **README:** Setup, penggunaan, contoh
5. **Dokumentasi arsitektur:** Desain sistem, interaksi komponen, gunakan diagram mermaid yang valid
