---
trigger: model_decision
description: Saat mengimplementasikan autentikasi, otorisasi, validasi input, operasi kriptografi, atau menangani input pengguna dan data sensitif
---

## Prinsip Keamanan

### Penegakan OWASP Top 10

* **Kontrol Akses yang Rusak:** Tolak secara default. Validasi izin *di sisi server* untuk setiap permintaan. Jangan mengandalkan status UI.
* **Kegagalan Kriptografi:** Gunakan TLS 1.2+ di mana-mana. Enkripsi PII/Secret saat diam (at rest). Gunakan algoritma standar (AES-256, RSA-2048, Ed25519). *Jangan pernah* membuat kriptografi sendiri.
* **Injeksi:** TOLERANSI NOL untuk penggabungan string dalam query. Gunakan Query Berparameter (SQL) atau binding ORM. Sanitasi semua output HTML/JS.
* **Pencegahan SSRF:** Validasi semua URL yang diberikan pengguna terhadap daftar yang diizinkan (allowlist). Nonaktifkan pengalihan HTTP di klien fetch. Blokir permintaan ke IP internal (layanan metadata, localhost).
* **Desain yang Tidak Aman:** Buat model ancaman (threat model) untuk setiap fitur baru. Gagal secara aman (tertutup), bukan terbuka.
* **Komponen Rentan:** Kunci (pin) versi dependensi. Pindai CVE di CI/CD.

### Autentikasi & Otorisasi

* **Kata Sandi:** Hash dengan Argon2id atau Bcrypt (biaya minimum 12). Jangan pernah teks polos.
* **Token:**
  * *Token Akses:* Berumur pendek (15-30 menit). HS256 atau RS256.
  * *Token Refresh:* Berumur panjang (7-30 hari). Rotasi saat digunakan. Simpan di cookie `HttpOnly; Secure; SameSite=Strict`.
* **Pembatasan Laju (Rate Limiting):** Terapkan secara ketat pada endpoint publik (Login, Registrasi, Reset Kata Sandi). Standar: 5 percobaan / 15 menit.
* **MFA:** Diperlukan untuk akses Admin dan Data Sensitif.
* **RBAC:** Petakan izin ke Peran, bukan ke Pengguna. Periksa izin di tingkat Rute DAN Sumber Daya.

### Validasi & Sanitasi Input

* **Prinsip:** "Semua Input adalah Jahat sampai Terbukti Baik."
* **Validasi:** Validasi terhadap Skema yang ketat (Zod/Pydantic) di batas *Controller/Port*.
* **Daftar yang Diizinkan (Allowlist):** Periksa "Karakter baik" (misalnya, `^[a-zA-Z0-9]+$`), jangan mencoba menyaring "Karakter buruk."
* **Sanitasi:** Hapus tag berbahaya dari input teks kaya menggunakan pustaka yang terbukti (misalnya, padanan DOMPurify).

### Logging & Monitoring (Fokus Keamanan)

* **Redaksi:** BERSIHKAN semua PII, Secret, Token, dan Kata Sandi dari log *sebelum* ditulis.
* **Peristiwa:** Log semua percobaan autentikasi yang *gagal*, peristiwa akses ditolak, dan kegagalan validasi input.
* **Format:** Log terstruktur JSON dengan `correlationId`, `user_id`, dan `event_type`.
* **Anti-Sabotase:** Log harus bersifat tulis-saja (write-only) untuk aplikasi.

### Manajemen Secret

* **Penyimpanan:** Jangan pernah commit secret ke git. Gunakan `.env` (lokal) atau Secret Manager (Produksi - misalnya, Vault/GSM).

### Prinsip Terkait
- Prinsip Penanganan Error @error-handling-principles.md
- Prinsip Desain API @api-design-principles.md
- Mandat Logging dan Observabilitas @logging-and-observability-mandate.md
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md
- Prinsip Manajemen Konfigurasi @configuration-management-principles.md