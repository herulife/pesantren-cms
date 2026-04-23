---
trigger: model_decision
description: Saat melakukan serialisasi, deserialisasi, atau memvalidasi format data (JSON, XML, YAML, Protocol Buffers, MessagePack, dll.)
---

## Prinsip Serialisasi dan Pertukaran Data

### Validasi di Batas Sistem

**Semua data yang memasuki sistem harus divalidasi:**

- Permintaan API, unggahan file, pesan message queue
- Validasi tipe, format, rentang, field wajib
- Gagal cepat pada data yang tidak valid (jangan memproses data yang hanya valid sebagian)
- Kembalikan error validasi yang jelas ke klien

### Tangani Encoding Secara Eksplisit

**Default ke UTF-8:**

- UTF-8 untuk semua data teks (respons API, konten file, string database)
- Tentukan encoding secara eksplisit saat membaca/menulis file
- Tangani error encoding dengan halus (karakter pengganti atau error)

**Error encoding:**

- Urutan UTF-8 yang tidak valid (byte yang cacat)
- Pencampuran encoding (membaca UTF-8 sebagai ISO-8859-1)
- Selalu validasi dan normalisasi encoding

### Pemilihan Format Serialisasi

**JSON:**

- Dapat dibaca manusia, didukung luas, agnostik bahasa
- Baik untuk: API, file konfigurasi, aplikasi web
- Keterbatasan: Tidak mendukung binary, ukuran lebih besar dari format binary

**Protocol Buffers:**

- Format binary yang ringkas, serialisasi/deserialisasi yang cepat
- Evolusi skema (kompatibilitas mundur/maju)
- Baik untuk: Microservice internal, sistem throughput tinggi
- Keterbatasan: Tidak dapat dibaca manusia, memerlukan definisi skema

**MessagePack:**

- Format binary mirip JSON, lebih cepat dan lebih ringkas dari JSON
- Baik untuk: API internal, ketika JSON terlalu lambat tetapi keterbacaan masih diinginkan
- Keterbatasan: Kurang didukung luas dibanding JSON

**XML:**

- Verbose, sistem legacy, berorientasi dokumen
- Baik untuk: Sistem enterprise, API SOAP, feed RSS/Atom
- Keterbatasan: Verbositas, kompleksitas, masalah keamanan (serangan XXE)

**YAML:**

- Ramah manusia, baik untuk file konfigurasi
- Baik untuk: File konfigurasi, Infrastructure as Code (Kubernetes, CI/CD)
- Keterbatasan: Parsing yang kompleks, performa, masalah keamanan (eksekusi kode arbitrer)

### Pertimbangan Keamanan

**Validasi sebelum deserialisasi:**

- Cegah serangan deserialisasi (eksekusi kode arbitrer)
- Tetapkan batasan ukuran pada payload (cegah kehabisan memori)
- Daftar putih tipe/kelas yang diizinkan untuk deserialisasi

**Nonaktifkan fitur berbahaya:**

- XML: Nonaktifkan pemrosesan entitas eksternal (pencegahan XXE)
- YAML: Nonaktifkan konstruktor yang tidak aman
- Python pickle: Jangan pernah deserialisasi data yang tidak tepercaya

### Prinsip Terkait
- Prinsip Penanganan Error @error-handling-principles.md
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md
- Prinsip Desain API @api-design-principles.md
