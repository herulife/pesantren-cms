---
layout: default
title: Home
nav_order: 1
permalink: /
---

# Awesome AGV
{: .fs-9 }

Sebuah paket konfigurasi sistem berkualitas tinggi yang tangguh untuk memandu Agen AI (AI Agents).
{: .fs-6 .fw-300 }

[Memulai Langkah](/awesome-agv/getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Lihat di GitHub](https://github.com/irahardianto/awesome-agv){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Apa itu Awesome AGV?

Awesome AGV adalah kumpulan standar dan praktik komprehensif yang dirancang untuk meningkatkan kemampuan agen koding AI. Daripada sekadar menghasilkan kode yang asalkan "berjalan", aturan dan keahlian di dalamnya akan memastikan agen menghasilkan kode yang **dapat bertahan lama** — kode yang aman, defensif (tangguh), dan mudah dipelihara.

Pengaturan ini dibangun di atas pondasi [Rugged Software Manifesto](https://ruggedsoftware.org/), memastikan setiap baris kode yang dihasilkan oleh AI diperlakukan seperti halnya kode yang kelak akan diserang, akan dipelihara oleh developer lain, dan dipastikan akan beroperasi di tahap produksi (production) selama bertahun-tahun mendatang.

## Sekilas Pandang

| Komponen | Jumlah | Tujuan Utama |
| ------------- | ----- | -------------------------------------------------------------------------- |
| **Aturan (Rules)** | 30 | Standar keamanan, keandalan, arsitektur, pemeliharaan, dan praktik DevOps |
| **Keahlian (Skills)** | 7 | Kemampuan spesifik untuk proses debugging, desain antarmuka, ulasan kode (code review), dll. |
| **Alur Kerja (Workflows)** | 10 | Proses pengembangan perangkat lunak (end-to-end) mulai dari tahap riset hingga rilis (ship) |

## Filosofi Inti

> "Saya sadar sepenuhnya bahwasanya kode yang saya tulis akan selalu dihadapkan pada ancaman serangan."

Kerangka kerja penunjang ini mewujudkan tiga komitmen teguh yang diadopsi dari [Rugged Software Constitution](https://github.com/irahardianto/awesome-agv/blob/main/.agent/rules/rugged-software-constitution.md):

1. **Bertanggung Jawab (I Am Responsible)** — Tidak ada istilah kode yang hanya mengandalkan "jalur aman" (happy path). Setiap input yang masuk ke sistem harus dianggap sebagai cacat atau berbahaya secara *default*.
2. **Defensif (I Am Defensible)** — Kode harus senantiasa memvalidasi statusnya sendiri. Segala bentuk kegagalan harus berakhir dengan mengunci sistem agar aman (fail closed), bukan memberikan hasil tanpa kepastian (undefined).
3. **Mudah Dipelihara (I Am Maintainable)** — Mengutamakan kejelasan keterbacaan kode (clarity) di atas sekadar bahasa *syntax* yang rumit/pintar. Kode ditulis untuk dibaca oleh orang lain di tahun-tahun mendatang.

## Bagaimana Sistem ini Bekerja

Sistem konfigurasi ini menggunakan **sistem aturan dua-tingkat** (two-tier rule system) untuk meminimalkan beban kognitif (noise) pada AI seraya memaksimalkan efisiensi:

### Mandat Mutlak (Selalu Aktif / Always-On)
Berisi panduan batasan yang mutlak tidak dapat ditawar dan selalu dimuat (loaded) pada setiap sesi percakapan obrolan AI:
- Security Mandate (Mandat Keamanan)
- Rugged Software Constitution
- Code Completion Mandate (Mandat Penyelesaian Kode)
- Logging & Observability Mandate (Mandat Observasi dan Log)
- Concurrency & Threading Mandate (Mandat Konkurensi Utas)

### Prinsip (Kontekstual Bersyarat)
Panduan yang sangat mendetail namun sengaja hanya diaktifkan manakala agen AI ditugaskan melakukan pekerjaan yang relevan dengannya:
- Aturan database akan hidup aktif manakala ia sedang merangkai perintah kueri (queries)
- Aturan CI/CD akan bangun ketika agen menata konfigurasi rilis pengembangan (*pipelines*)
- Aturan UI/Aksesibilitas akan terlibat saat agen diperintah membuat susunan komponen tampilan (*User Interfaces*)

Pendekatan bertingkat ini menjadikan agen AI tidak akan kewalahan dihujani teks arahan berisi ke-30 aturan utuh setiap kali ia diberi satu perintah sederhana — melainkan AI akan senantiasa dipayungi perlindungan mandat mutlaknya pada setiap detik percakapan, dan di waktu bersamaan otomatis memetik ragam prinsip yang membimbing pekerjaannya sesuai dengan konteks permintaannya.

## Dukungan Kompatibilitas Platform AI

Meskipun secara orisinal dirancang khusus berpusat untuk menopang ketangguhan agen AI di platform **Antigravity**, racikan rumusan pengetahuan ini dibangun khusus dari rangkaian berkas *markdown* bahasa manusia yang luwes sehingga bisa Anda cangkokan pada ekosistem platform yang berbeda-beda:

| Alat Koding Berbasis AI | Cara Pemakaian dan Konfigurasi |
| ---------------- | ----------------------------------------------- |
| **Antigravity** | Sudah didukung secara *native* melalui pembacaan rujukan folder `.agent/` |
| **Roo Code** | Salin direktori map `.agent/` dan letakkan di ranah direktori akar (project root) dasar proyek Anda |
| **Claude Code** | Salin direktori map `.agent/` dan letakkan di ranah direktori akar (project root) dasar proyek Anda |
| **Gemini CLI** | Sisipkan seluruh barisan muatan aturan sebagai rentetan himbauan pesan instruksi awal *(custom instructions)* |
| **Sistem Agen AI lainnya** | Muat (load) seluruh direktori file `.agent/rules/**` agar menempati ruangan *system prompt context* (konteks sistem prompt)-nya |

## Struktur Isi Di Dalamnya

<div class="code-example" markdown="1">

```
.agent/
├── rules/             # 30 jenis Aturan pengawal (gabungan mandat + kelompok prinsip)
├── skills/            # 7 pilar penyangga pendamping keahlian fungsional 
└── workflows/         # 10 rute jenis tahapan alur kerja
```

</div>

Telusuri masing-masing wawasan komponen ini secara mendalam:

- [**Referensi Aturan (Rules Reference)**](/awesome-agv/rules) — Seluruh 30 aturan disusun utuh menurut kategorinya
- [**Referensi Keahlian (Skills Reference)**](/awesome-agv/skills) — Seluruh 7 kelompok pengawal kemampuan prosedural spesialisnya (specialized skills)
- [**Referensi Alur Kerja (Workflows Reference)**](/awesome-agv/workflows) — Keseluruhan pedoman siklus eksekusi dari 10 pedoman tahapan peluncuran siklus pengerjaan proyeknya.
- [**Panduan Arsitektur Sistem (Architecture)**](/awesome-agv/architecture) — Panduan selayang pandang penjelasan mengenai hirarki fondasi filosofis di balik perancangan sistem aturannya.
- [**Praktik Terbaik (Best Practices)**](/awesome-agv/best-practices) — Kumpulan rangkaian tips dan celah teknis untuk memeras utilitas ekstra mendapatkan keluaran optimal dari panduan agen ini.
- [**Mengadaptasikan Sistem Konfigurasinya (Adapting)**](/awesome-agv/adapting) — Petunjuk modifikasi sesuaikan setelan agar dapat diterapkan untuk membimbing proyek/ bahasa / framework khas bentukan Anda sendiri kelak.
