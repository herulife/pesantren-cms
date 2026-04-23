---
name: guardrails
description: Daftar periksa (checklist) prapenerbangan dan protokol ulasan mandiri pascaimplementasi. Gunakan sebelum menulis kode apa pun (prapenerbangan) dan setelah menulis kode tetapi sebelum verifikasi (ulasan mandiri) untuk menangkap masalah lebih awal.
---

# Keahlian Pagar Pembatas (Guardrails) Agen

## Tujuan
Daftar periksa terstruktur yang memastikan agen telah mempertimbangkan semua aturan yang berlaku sebelum dan sesudah menulis kode. Menangkap masalah yang jika tidak dikendalikan, hanya akan muncul selama verifikasi.

## Kapan Harus Dipanggil
- **Prapenerbangan (Pre-Flight):** Di awal Fase 2 (Implementasi), sebelum menulis kode apa pun
- **Ulasan Mandiri (Self-Review):** Di akhir Fase 2 (Implementasi), setelah menulis kode tetapi sebelum Fase 3/4

---

## Daftar Periksa Prapenerbangan

Jalankan daftar periksa ini **sebelum menulis kode apa pun**:

- [ ] Mengidentifikasi semua aturan yang berlaku dari `.agent/rules/`
- [ ] Mencari pola yang sudah ada di codebase (Protokol Penemuan Pola dari `architectural-pattern.md`)
- [ ] Mengonfirmasi kesesuaian struktur proyek (`project-structure.md`)
- [ ] Mengidentifikasi batasan I/O yang memerlukan abstraksi
- [ ] Menentukan strategi pengujian (unit/integrasi/E2E)
- [ ] Meninjau `rule-priority.md` untuk setiap potensi konflik aturan

Jika ada item yang tidak dapat dicentang, **berhenti dan selesaikan** sebelum melanjutkan.

---

## Ulasan Mandiri Pascaimplementasi

Jalankan daftar periksa ini **setelah menulis kode, sebelum verifikasi**:

### Keamanan
- [ ] Tidak ada kalimat rahasia (secret) atau nilai konfigurasi yang di-hardcode
- [ ] Semua input pengguna sudah divalidasi pada batasan sistem
- [ ] Query terparameter (tidak ada rangkaian/concatenation string untuk SQL)

### Testabilitas
- [ ] Semua operasi I/O berlindung di balik antarmuka/abstraksi
- [ ] Logika bisnis bersifat murni (tidak ada efek samping dalam kalkulasi)
- [ ] Dependensi disuntikkan (injected), bukan di-hardcode

### Observabilitas
- [ ] Semua titik masuk operasi publik telah dicatat lognya (start/sukses/gagal)
- [ ] Logging terstruktur dengan correlation ID
- [ ] Penentuan Level log yang tepat (tidak semuanya bersatus INFO)

### Penanganan Error
- [ ] Jalur error ditangani secara eksplisit (tidak ada blok catch yang kosong)
- [ ] Error memberikan konteks (dibungkus dengan info tambahan)
- [ ] Sumber daya dibersihkan (cleanup) pada jalur error (defer/finally)

### Pengujian
- [ ] Pengujian (Test) mencakup happy path
- [ ] Pengujian mencakup setidaknya 2 jalur error
- [ ] Pengujian mencakup edge case yang relevan dengan domain
- [ ] Jika adapter I/O dimodifikasi: integration test ada dan lulus (pass)
- [ ] Jika UI dimodifikasi: E2E test ada (atau Fase 3.5 sudah direncanakan)

### Konsistensi
- [ ] Mengikuti pola codebase yang sudah ada (>80% konsistensi)
- [ ] Konvensi penamaan sesuai dengan codebase
- [ ] Organisasi file sesuai dengan petunjuk `project-structure.md`

## Kepatuhan Aturan
Keahlian ini menegakkan:
- Semua mandat (aturan yang selalu aktif)
- Pola Arsitektur @architectural-pattern.md
- Strategi Pengujian @testing-strategy.md
- Prioritas Aturan @rule-priority.md
