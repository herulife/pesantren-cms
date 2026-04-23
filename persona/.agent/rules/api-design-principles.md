---
trigger: model_decision
description: Saat mengimplementasikan API REST/HTTP (endpoint, handler, middleware, atau pemformatan respons)
---

## Prinsip Desain API

### Standar API RESTful

**URL Berbasis Sumber Daya:**

- Gunakan kata benda jamak untuk sumber daya: `/api/{version}/users`, `/api/{version}/orders`
- Hubungan hierarkis: `/api/{version}/users/:userId/orders`
- Hindari kata kerja dalam URL: `/api/{version}/getUser` ❌ → `/api/{version}/users/:id` ✅

**Metode HTTP:**

- GET: Baca/ambil sumber daya (aman, idempoten, dapat di-cache)
- POST: Buat sumber daya baru (tidak idempoten)
- PUT: Ganti seluruh sumber daya (idempoten)
- PATCH: Pembaruan parsial (idempoten)
- DELETE: Hapus sumber daya (idempoten)

**Versioning:**

- Versioning jalur URL: `/api/{version}/users` misalnya `/api/v1/users` (eksplisit, jelas)

**Paginasi:**

- Batasi hasil per halaman (default 20, maksimum 100)
- Berbasis kursor: `?cursor=abc123` (lebih baik untuk data real-time)
- Berbasis offset: `?page=2&limit=20` (lebih sederhana, kurang akurat untuk data yang berubah)

**Filtering dan Sorting:**

- Filtering: `?status=active&role=admin`
- Sorting: `?sort=created_at:desc,name:asc`
- Pencarian: `?q=kata+pencarian`

### Kode Status HTTP dan Kategori Error

**Kode Sukses:**
- 200 OK: Sukses (GET, PUT, PATCH)
- 201 Created: Sumber daya berhasil dibuat (POST)
- 204 No Content: Sukses tanpa body respons (DELETE)

**Kode Error Klien (4xx) - Pengguna Dapat Memperbaiki:**

**Error Validasi (400 Bad Request):**
- Input pengguna tidak memenuhi persyaratan
- Contoh: Email tidak valid, kata sandi terlalu pendek, field wajib tidak diisi
- Respons: Error detail per field
- Tindakan pengguna: Perbaiki input dan coba lagi

**Error Autentikasi (401 Unauthorized):**
- Verifikasi identitas gagal
- Contoh: Kredensial tidak valid, token kedaluwarsa, token tidak ada
- Tindakan pengguna: Berikan kredensial yang valid

**Error Otorisasi (403 Forbidden):**
- Izin ditolak (pengguna teridentifikasi tetapi tidak memiliki izin)
- Tindakan pengguna: Hubungi admin untuk izin

**Error Tidak Ditemukan (404 Not Found):**
- Sumber daya tidak ada atau pengguna tidak memiliki izin untuk mengetahui keberadaannya
- Tindakan pengguna: Tidak ada (tidak ada)

**Pelanggaran Aturan Bisnis (409 Conflict / 422 Unprocessable Entity):**
- Pelanggaran aturan domain
- Contoh: Saldo tidak mencukupi, email duplikat, pesanan sudah dikirim
- Respons: Penjelasan aturan bisnis
- Tindakan pengguna: Tergantung konteks bisnis

**Pembatasan Laju (429 Too Many Requests):**
- Terlalu banyak permintaan dalam jendela waktu
- Tindakan pengguna: Tunggu dan coba lagi

**Kode Error Server (5xx) - Masalah Sistem:**

**Error Infrastruktur (500/502/503):**
- Database mati, timeout jaringan, kegagalan layanan eksternal
- Respons: Pesan generik dengan ID korelasi
- Tindakan pengguna: Tidak ada (masalah sistem, coba lagi nanti)

### Format Respons Sukses API
```
{
  "data": { /* sumber daya atau array sumber daya */ },
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2",
    "prev": null
  }
}
```

### Format Respons Error API

Semua error API harus mengikuti struktur envelope yang konsisten, sesuai format sukses jika memungkinkan atau menggunakan envelope error standar.
```
{
  "status": "error",                      // Transport: Selalu "error" atau "fail"
  "code": 400,                            // Transport: Status HTTP Redundan
  "error": {                              // Domain: Masalah bisnis yang sebenarnya
    "code": "VALIDATION_ERROR",           // Kode bisnis yang dapat dibaca mesin (UPPER_SNAKE)
    "message": "Format email tidak valid", // Pesan yang dapat dibaca manusia
    "details": {                          // Opsional: Konteks terstruktur
      "field": "email",
      "reason": "Harus berupa alamat yang valid"
    },
  "correlationId": "req-1234567890",      // Ops: Keterlacakan
  "doc_url": "https://..."                // Opsional: Tautan bantuan
  }
}
```

### Prinsip Terkait
- Prinsip Penanganan Error @error-handling-principles.md
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md
- Mandat Logging dan Observabilitas @logging-and-observability-mandate.md
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md