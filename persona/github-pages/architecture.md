---
layout: default
title: Arsitektur
nav_order: 6
---

# Arsitektur Sistem Aturan
{: .no_toc }

Bagaimana sistem aturan dua tingkat dirancang dan mengapa pendekatan ini berhasil.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Filosofi Desain

Agen AI memiliki satu masalah mendasar: **jendela konteks (context window) terbatas**. Memuat 30 file aturan yang sangat mendetail ke dalam setiap sesi percakapan akan menghabiskan ruang konteks yang berharga serta membuat model AI kewalahan dengan panduan yang tidak relevan.

Awesome AGV memecahkan tantangan ini dengan **sistem aturan dua tingkat** yang terinspirasi oleh bagaimana sistem operasi komputer menangani beban tingkat *kernel-mode* vs *user-mode* — operasi sangat kritis selalu dijalankan dengan perlindungan hak istimewa (privileges) penuh, sedangkan operasi lainnya baru aktif hanya jika diperlukan (on demand).

---

## Tingkat 1: Mandat (Selalu Aktif)

**Pemicu (*Trigger*):** `always_on` pada bagian YAML frontmatter

Mandat adalah **batasan yang mutlak dan tidak bisa dinegosiasikan** yang wajib dimuat dalam setiap sesi. Aturan ini mewakili batas standar minimum terhadap keamanan dan rancangan kode. Agen tidak diperbolehkan menggeneralisasi skrip yang melanggar mandat sama sekali.

### Mandat Saat Ini

| Mandat | Tujuan Utama |
| ------------------------------- | ------------------------------------------------------- |
| Rugged Software Constitution | Inti filosofi tatanan — defensibel (siap bertahan), bertanggung jawab, dan dapat dipelihara |
| Security Mandate | Jangan pernah langsung percaya suatu asupan eksternal (input), selalu tolak secara bawaan (deny by default), dan menangkut (*fail closed*) dalam kegagalan |
| Code Completion Mandate | Selalu validasi karya baris kode sebelum diantarkan pada eksekusi utuh |
| Logging & Observability Mandate | Segala jenis tindakan sentuh sistem vital wajib dicatat dengan rekam log yang solid |
| Concurrency & Threading Mandate | Jangan gunakan fungsionalitas konkurensi secara liar dan berlebihan |
| Core Design Principles | Berpegang teguh pada prinsip SOLID, DRY, YAGNI, KISS |
| Architectural Pattern | Isolasi I/O, menjaga logika bisnis inti agar murni |
| Code Organization Principles | Pengorganisasian kode berbasis per-fitur bisnis (feature-based) |
| Code Idioms & Conventions | Kepatuhan mutlak pola penulisan idiom asli pada masing-masing bahasa target peruntukan |
| Avoid Circular Dependencies | Pantang ada impor library saling menyilang secara siklus berputar ganda (no import cycles) |
| Project Structure | Tata letak folder khusus untuk merangkum fitur-fitur (sumber validitas satu-satunya pengorganisasian peta direktori) |
| Rule Priority | Ketegasan resolusi hierarki untuk menangani aturan-aturan yang berpotensi tabrakan prioritas |

### Mengapa Aturan Ini Selalu Aktif

Kelompok petunjuk mandat tersematkan di atas prinsip universal: **melanggarnya adalah tindakan yang tidak dapat dibenarkan untuk dilewatkan terlepas dari seperti apa ruang konteks layanannya**. Lubang kerentanan semacam injeksi kejahatan SQL di pengolah database (*db handler*) sama bahayanya dengan ancaman di gerbang luar *API endpoint*. Fitur pemantauan pelacakan log aktivitas jejak (*logging*) sama besarnya menagih mutlak pencatatan pada API REST milik sisi pengguna maupun sekadar bilah perkakas CLI pelaksana skrip mentah sederhana.

---

## Tingkat 2: Prinsip (Kontekstual Bersyarat)

**Pemicu (*Trigger*):** `model_decision` pada bagian YAML frontmatter

Prinsip merupakan sekumpulan **panduan terperinci** yang akan dihidupkan pemakaiannya hanya saat sang agen merasa butuh dan selaras dengan langkah penyusutan arah perintah relevansi dari pekerjaan proyek yang sedang ditempuh sekarang. Ini secara ampuh akan menurunkan tingkat kesemrawutan lalu lintas lalu memandu alat pemikir AI memprioritaskan yang penting duluan.

### Prinsip Saat Ini

| Prinsip                          | Aktif Ketika                              |
| ---------------------------------- | ----------------------------------------- |
| Security Principles                | Menulis komponen fungsi keamanan autentikasi, tahapan kriptografi, hingan layar baris validatasi sistem|
| Error Handling Principles          | Merancang tipe status error atau menguji penangguhan kesalahan (recovery)|
| Concurrency & Threading Principles | Menulis deret sintaks serempak async, untaian threaded, atau rentak paralel berjalan bersamaan|
| Performance Optimization           | Saat mengarahkan pengawasan waktu (Profiling), membuat balapan beban uji (benchmarking), membedah peruntukan jalan terberat lalu lintas kritis (critical paths) |
| Resource & Memory Management       | Mengarur raga objek file fisik, tancapan seutas koneksitas (*connections*), kolam *pools* pembatas, sampai alur pengerukan puing memori (cleanup)|
| Monitoring & Alerting              | Melapor alat uji daya kesehatan aplikasi (health checks), angka beban hitung pemakaian (metrics), hingga jepretan sekering *circuit breakers*|
| Configuration Management           | Membedah pemuatan raga muatan var env, penanganan kerahasiaan isi dompet rahasia (secrets), map rancang file pengaturan (config files)|
| API Design Principles              | Mencetak pangkalan tembak terminal *REST endpoints*, mesin tumpu muatan panggulan antarmuka handlers, atau bentangan pipa susup pengantar layanan (middleware)|
| Database Design Principles         | Pemodelan garis ukur bangunan relasi (Schema), catatan pembaharuan data urut baris lapak raga data lama (migrations), seruan pemilih query baca ambil, pengereman simpul ganda transaksi bersyarat |
| Data Serialization                 | Bongkar-muat barisan serapan baca/tulis format JSON, XML, persinggahan YAML, atau muatan lintasan protobuf |
| Command Execution                  | Membangkitkan baris raga eksekusi skrip pangkalan shell lurus mentah, dan eksekusi panggila pada anak-proses eksternal di belukar pergerakan operasi mesin|
| Testing Strategy                   | Mengarsip lembaran barisan urat uji tes-kendali (*writing tests*), hingga skema pengerombolannya|
| Dependency Management              | Mengatur laju perakitan sistem manajer bungkus (*package management*), pengendalian umur usia tali kendali versi (*version pinning*) |
| Documentation Principles           | Merangkai barisan celah penyemat panduan serpihan keterangan komentar (*comments*), pelapisan penyerahan tugu dokumen pengenalan petunjuk pemakaian *READMEs*|
| Logging & Observability Principles | Menyusupi untaian petunjuk pengenalan garis penerapan tatanan jejak pencatatan aktivitas sensor lapor alat pacu kelayakan operasi alatnya (Logging)|
| Accessibility Principles           | Kesesuaian kaidah WCAG, kaitan ke ranah perakitan pedoman elemen raga HTML semantis, berikut hiasan lilit label deskripsi ARIA |
| Git Workflow Principles            | Pedoman lurus merangkai untai catatan gerbong baris pesan (Commits), persimpangan percabangan belukar ranting riwayat *branches*, lalu usulan unjuk gabung kerja *Pull Requests (PRs)* |
| CI/CD Principles                   | Pengaturan jalur pipa rakit dan lempar pengerjaan terintegrasi berlanjutan (Pipelines), setelan bungkus labuh wadah virtual Docker, penyisipan ke mesin GitHub Actions |

### Bagaimana Mekanisme Aturan Bersyarat Kontekstual Itu Menyala (How Context Activation Works)

Agen otak buatan AI membacai bidang `description` yang diapit peluk selimut bingkai set YAML frontmatter pada semua file pendamping kelompok tingkatan *Principles* dan mengevaluasi kedekatannya sendiri dengan kaitan urat nadi perintah tugas di medan perang yang sedang dijalani:

```yaml
---
trigger: model_decision
description: Ketika sedang mendesain skema bentuk dasar tabel *database*, memuntel penulisan perulangan *migrations*, membuat bongkar pendaraban kueri pesanan, atau berkutat menyusun batasan transaksional beruntun.
---
```

Bila utusan pemikir agen sedang sibuk menjahit perintah seputar skrip alur migrasi struktur *database*, maka otomatis memori ini tercolek hidup bangun dan dimuat mengawasi langkah tangan si mesin. Sebaliknya manakala sang Agen sekadar dititipi memahat warna serbuk kancing hiasan tombol muka *frontend*, maka aturan *Database Design Principles* tenang tenteram terus mendengkur tidur.

---

## Skala Prioritas Kekuasaan Penertiban Benturan Aturan Bersilang (Rule Priority)

Kerap kali hukum yang dipanggul secara utuh bersengketa dan bertubrukan adu kepalan satu sama beda saling memandulkan diri berseberangan arah saat raga aturan berhadapan-hadapan beradu muka di depan tungku satu penyelesaian yang sama. Disitulah tiang tata tingkat hirarki rujukan kuasa dipanggil bangkit:

```
1. Mandat Keamanan Mutlak (Security Mandate)     ← Berkuasa Mutlak Menang Menghantam Semuanya
2. Rugged Software Constitution
3. Code Completion Mandate
4. Testability-First Design
5. Prinsip fitur fungsional murni terkhusus
6. YAGNI / KISS                                  ← Kalah saing telak. Hanya bangkit memandu asalkan ketiadaan rintangan opsi rupa perselisihan lain-lain sama rata kosong melompong (Only when no other trade-off exists)
```

### Sejumlah Contoh Skenario Sengit Peleraian Kubu Beradu

| Skema Bentrok Pertikaian Aturan Tersinggung | Juara Pemenang | Nalar Pertimbangan Pemecahan Kebuntuan                          |
| ------------------------------------------------- | ----------------- | ---------------------------------- |
| Asas peringkas YAGNI melawan pertahanan dinding Keamanan (Security) ("hanya urusan fungsi simpel mungil kenapa pakai dipanjangkan validasi asupan ketat?")       | **Keamanan (Security)**      | Input mutlak dan selamanya kudu wajib dicuci-suci disaring dari celah racun.  |
| Pendekatan pemangkasan KISS melawan tuntutan ruang Uji Testabilitas ("mengisi fungsi berlembar-lembar bungkus pialang pemisah abstraksi cuman bikin skema desain lebih kompleks menyulitkan dibaca") | **Testability**   | Pemisahan celah pelapis abstraksi Antarmuka wajib dilahirkan semata-mata buat pintu masuk celah sambung pemanggilan bohongan (mock tests) sanggup berjalan mulus menakar kendali kemudi di ujung. Pintu antarmuka memungkinkan penyatuan mesin tes berfungsi seirama|
| Tuntutan kencang unjuk gigi lari Performa (Performance Optimization) melawan sabuk pelapis pencegahan sia sia YAGNI ("lebih baik dioptimalkan awal daripada menyesal nanti walau kode jadi rumit?")            | **Aduk Uji Ukur Tarung Kenyataan Dahulu (Measure first)** | Haram mengedepankan bongkar penajaman lari performa optimal yang hanya dilandasi selera sangkaan buta tak terbukti (tebak raba tebal). Performa dikejar cuman sesudah pembandingan balapan pengujian aslinya dari bacaan alat pemindai riwayat *profiler* mendesainnya sah terjadi kelambatan parah.      |
| Menggulung kesamaan pengulangan tak fungsional (DRY) melawan Keindahan lugu terjemahan polos keterbacaan (Clarity) ("tarik aja kode kembar ini ke wadah modul bantu generik utilitas sendiri?")         | **Kejelasan Penjabaran (Clarity)**       | Jangan terburu napsu mengutak-atik bangunan wadah abstraksi memisahkan kode berulang merangkumnya sekadar alasan DRY mentah. Pantang diterapkan sebelum pengulangan identik sejati terpanggu menyentuh batasan keramaian salinan berderet ke angka kembaran wujud pengulangan ganda ketiga sisinya bermunculan riil secara serentak (Rule of Three). |
| Dorongan gila meluncur ngebut cepat melahirkan karya produk (Speed) memukul runtuh sandaran pelita cahaya Pemandu Perekam pelacak Logging ("skip baris logging buat mengejar tenggat deploy")  | **Pusaka Mandat Kesediaan Pemandu Perekam jejak (Logging)**       | Mengusap lenyap raga peranti fungsi instrumen jejak lapor sensor pada jalur lalu lintas vital demi kecepatan hantar, artinya tengah melahirkan bayangan maut celaka yang menjerat lumpuh diam diam tak kelihatan menjerit dari belakang punggung gelap pengembangnya seumur hidup (*Silent failures are the enemy*).     |

---

## Simpul Ikatan Jaringan Ekosistem Menyeluruh Rangkaian Komponen Organ (Relationship Between Components)

```
┌─────────────────────────────────────────────┐
│  Rangkaian Setir Kemudi Alur Kerja (Workflows) 
│  (Mengoper giling tata siklus hidup sang pengembangan - Orchestrate the development lifecycle)
│                                             │
│  /orchestrator → /1-research → /2-implement │
│  → /3-integrate → /4-verify → /5-commit     │
├─────────────────────────────────────────────┤
│  Keahlian Kepakaran Berpikir (Skills)       │
│  (Dihidupkan per-jalur gerbong penugasan saat dimintai oleh panggilan spesifik mesin pengolah Alur kerjanya)      │
│                                              │
│  Debugging Protocol, Code Review,            │
│  Sequential Thinking, Guardrails, ADR        │
├──────────────────────────────────────────────┤
│  Panduan Kemudi Nalar Prinsip (Tier 2 Principles)
│  (Pilar pedoman taktis kontekstual dihidupkan bersuara manakala terpantik sentuhan nuansa latar belakang serapan relevansinya selaras tugas bersangkutan)
│                                              │
│  Database Design, CI/CD, Security Principles │
├──────────────────────────────────────────────┤
│  Pilar Pantangan Dinding Kekuasaan Mutlak Mandat Kemudi Kehendak (Tier 1 Mandates)    
│  (Tak pernah padam menyala, Tak ada kompromi membantah apalagi memangkas memotong tawarannya)   
│                                              │
│  Security Mandate, Code Completion Mandate,  │
│  Logging Mandate, Core Design Principles     │
└──────────────────────────────────────────────┘
```

- **Mandat (Mandates)** mengecor semen landasan fondasi tak tergoyahkan lapis terbawah — senantiasa terbangun pasang mata (always active).
- **Prinsip Taktis (Principles)** bersemayam di tingkat dua bernaung di pundak sang Mandat, siaga dipetik terpicu hidup terlecut beringas nyala sesaat ketika disusul seruan konteks bersangkutan menghampirinya melintas perannya.
- **Keahlian Berpikir (Skills)** menghantar perwujudan prosedur kecakapan fungsional rupa wujud panduan-petunjuk bersanding yang dipanggil dan digadang-gadang jadi landasan sokong punggung eksekutor bagi pergerakan kemudi si Workflows menalar membedah tantangan spesifik yang tertuang.
- **Alur Kerja Penggerak Mesin (Workflows)** mengabdi di tahta puncal pengendali konduktor seluruh laju irama keriuhan interaksi komponen penyokong bernafas dibawahnya, menjahit untaian putarannya maju berurut bertumbuh menjadi gumpalan rantai hasil produksi pengerjaan membulat ke depan (*structured development cycles*).

---

## Merentang Kepak Ekspansi Bangunan Luas Sistemnya (Extending the System)

### Menambahkan Aturan Baru

1. Buat file markdown di dalam `.agent/rules/`
2. Tambahkan YAML frontmatter dengan `trigger: always_on` atau `trigger: model_decision`
3. Untuk aturan bersyarat (kontekstual), tambahkan `description` yang memberi tahu agen kapan aturan ini harus diaktifkan
4. Tambahkan aturan tersebut ke dalam kategori yang sesuai

### Menambahkan Keahlian Baru

1. Buat direktori di `.agent/skills/{nama-keahlian}/`
2. Buat file `SKILL.md` dengan YAML frontmatter (`name`, `description`)
3. Tambahkan instruksi detail, template (jika ada), dan contoh penggunaan
4. Anda juga bisa menambahkan direktori pendukung secara opsional seperti `scripts/`, `examples/`, atau `resources/`

### Menambahkan Alur Kerja Baru

1. Buat file markdown di `.agent/workflows/`
2. Tambahkan YAML frontmatter beserta `description`-nya
3. Definisikan fase-fase (tahapan) dengan kriteria penyelesaian (completion criteria) yang jelas
4. Referensikan aturan (rules) dan keahlian (skills) yang berlaku
