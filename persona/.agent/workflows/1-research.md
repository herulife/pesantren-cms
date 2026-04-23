---
description: Fase riset - memahami konteks dan mengumpulkan pengetahuan
---

# Fase 1: Riset

## Tujuan
Memahami konteks permintaan DAN mengumpulkan pengetahuan yang akurat dan terkini sebelum menulis kode apapun.

## Langkah-langkah

### 1. Analisis Permintaan
Uraikan permintaan pengguna dan identifikasi:
- Apa yang mereka minta?
- Apa cakupannya?

### 2. Tinjau Implementasi Saat Ini
Periksa repositori untuk memahami:
- Arsitektur teknis saat ini
- Pola implementasi yang ada
- Dependensi dan konfigurasi

### 3. Bangun Model Mental
Inventarisasi:
- Kebutuhan bisnis
- Batasan teknis
- Titik integrasi dengan kode yang ada

### 4. Definisikan Cakupan
Gunakan `task_boundary` untuk mengatur mode ke **PLANNING**

Buat rencana dengan tugas-tugas atomik kecil di `task.md`:
- `[ ]` = Belum dimulai
- Gunakan daftar berjenjang untuk sub-item

### 5. Identifikasi Topik Riset
Daftar semua teknologi, pustaka, dan pola yang terlibat dalam tugas ini.

Contoh:
```
Topik untuk "Task CRUD API":
- Pola routing Go http.ServeMux
- Pembuatan query SQLC
- Penanganan UUID di PostgreSQL
- Middleware autentikasi JWT
```

### 6. Cari di Qurio
Jalankan pencarian untuk SETIAP topik:

[comment]: # (2-5 kata kunci saja!)

```
qurio_search(query="Go ServeMux routing")
qurio_search(query="SQLC CRUD queries")
qurio_search(query="Pinia store setup")

# Query yang lebih kompleks
qurio_search(query="<kata-kunci-teknis>", alpha=0.5)
qurio_search(query="<kata-kunci-teknis>", alpha=0.5, limit=10, source_id="<source_id>")

# Baca halaman lengkap
qurio_read_page(url="https://go.dev/doc/go1.25")
```

### 7. Dokumentasikan Temuan
Buat `docs/research_logs/{nama_fitur}.md` dengan:
- Pola-pola kunci yang ditemukan
- Contoh kode dari dokumentasi
- Tanda tangan API dan opsi
- Jebakan atau kasus tepi yang ditemukan

#### Penamaan Log Riset
Setiap fitur harus memiliki log riset sendiri:
```
docs/research_logs/
├── epic1_auth.md           # Epic 1: Autentikasi
├── epic2_task.md           # Epic 2: CRUD Tugas
├── epic3_lists.md          # Epic 3: Daftar
└── {nama_fitur}.md         # Pola: satu log per fitur
```

### 8. Dokumentasikan Keputusan Arsitektur
Jika ada keputusan yang melibatkan:
- Memilih antara 2+ pendekatan yang layak
- Memperkenalkan dependensi atau pola baru
- Mengubah arsitektur yang ada

Maka buat ADR menggunakan **Skill ADR** di `docs/decisions/NNNN-judul-singkat.md`.

**Skill yang dipertimbangkan:**
- **Sequential Thinking** — untuk keputusan desain kompleks dengan beberapa trade-off

### 9. Fallback ke Pencarian Web
Jika Qurio tidak menghasilkan hasil, gunakan pencarian web.

### 10. Nyatakan Penggunaan Data Pelatihan
Jika mengandalkan data pelatihan, nyatakan secara eksplisit:
> "Saya mengandalkan data pelatihan saya untuk solusi ini karena verifikasi eksternal tidak tersedia."

## Jika Fase Ini Gagal
Jika Qurio dan pencarian web tidak menghasilkan hasil:
1. Dokumentasikan apa yang dicari
2. Nyatakan: "Mengandalkan data pelatihan"
3. Lanjutkan dengan hati-hati
4. Tandai untuk review manusia jika kritis

## Kriteria Penyelesaian
- [ ] Permintaan dianalisis dan cakupan didefinisikan
- [ ] `task.md` dibuat dengan tugas-tugas atomik
- [ ] Log riset dibuat di `docs/research_logs/{nama_fitur}.md`
- [ ] Semua teknologi utama diriset
- [ ] Contoh kode didokumentasikan
- [ ] Keputusan arsitektur didokumentasikan sebagai ADR (jika berlaku)

## Fase Berikutnya
Lanjutkan ke **Fase 2: Implementasi** (`/2-implement`)