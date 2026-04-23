---
layout: default
title: Praktik Terbaik
nav_order: 7
---

# Praktik Terbaik (Best Practices)
{: .no_toc }

Sejumlah tips untuk mendapatkan hasil maksimal dari sistem Awesome AGV.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Manajemen Percakapan

### Gunakan Sesi Percakapan Baru untuk Tugas yang Berbeda

Setiap percakapan dengan AI idealnya memiliki satu tujuan yang spesifik:

| Tugas                 | Sesi Percakapan                                   |
| --------------------- | ------------------------------------------------- |
| Membangun fitur baru  | Percakapan baru dipandu perintah `/orchestrator`  |
| Memperbaiki sebuah bug| Percakapan baru dipandu perintah `/quick-fix`     |
| Meninjau kualitas kode| Percakapan baru dipandu perintah `/audit`         |
| Menindaklajuti temuan | Percakapan baru dengan `/quick-fix` atau `/refactor`|

**Mengapa?** Percakapan baru menghindari "bias konfirmasi" (confirmation bias). Seorang agen yang meninjau kode yang baru saja ia selesaikan, performanya akan kurang efektif dibandingkan dengan agen yang melihat kode tersebut untuk pertama kalinya.

### Merujuk Artefak Tersimpan (Persisted Artifacts)

Saat memulai alur kerja perbaikan dari hasil sebuah temuan audit, sebutkan saja secara langsung laporan yang tersimpan:

> "Fix the critical issues in `docs/audits/review-findings-auth-2026-02-15-1430.md`" (Atau dalam Bahasa Indonesia: Tolong perbaiki masalah kritis pada file laporan audit `docs/audits/...`)

Agen dapat membaca file tersebut secara langsung — tidak perlu melakukan aksi copy-paste rangkuman temuannya ke dalam kotak obrolan.

---

## Memilih Alur Kerja (Workflow Selection)

### Diagram Pengambilan Keputusan

```
Apakah ini sebuah fitur baru?
├── Ya → /orchestrator
└── Tidak
    ├── Apakah ini murni sebatas perbaikan bug?
    │   ├── Akar penyebab permasalahan sudah diketahui, dan estimasi ubahan <50 baris kode? → /quick-fix
    │   └── Masalah kompleks dan belum ditemukan letak pemicu utamanya? → /orchestrator (didampingi tahap debugging)
    ├── Apakah ini bertujuan mengubah struktur kode (restructuring)?
    │   ├── Sudah ada tujuan desain yang spesifik? → /refactor
    │   └── Masih meraba "Cari apa yang bisa diperbaiki dari kode lama ini"? → Jalankan /audit dahulu, kemudian /refactor
    └── Apakah tujuannya sebatas peninjauan kualitas (Review)? → /audit
```

### Jangan Pernah Melewati Fase Riset (Research Phase)

Fase Riset (`/1-research`) eksis karena suatu alasan:
- Agen AI akan memproduksi hasil kode yang jauh lebih matang tatkala mereka memahami ikhtisar konteks lingkungan sistem secara mendalam.
- Mengirim perintah penelusuran dokumentasi dapat mencegah agen sekadar mengandalkan informasi yang tidak valid apabalia bersumber murni dari data latih asalnya yang usang.
- Tercetaknya lembaran log riset (research logs) membuahkan simpanan harta karun ilmu pengetahuan warisan perusahaan untuk memandu setiap percakapan-percakapan agen lain di masa mendatang.

### Percayai Siklus TDD (Trust the TDD Cycle)

Tahapan fase Implementasi memaksa disiplin kerja TDD: Red → Green → Refactor. Ini bukan cuma formalitas hiasan ritual kaku:
- **Red (Merah)** — memastikan Anda telah membuat skrip ujian otomatis yang tepat untuk menangkap suatu celah logika
- **Green (Hijau)** — memaksa agen memberikan solusi penyelesaian paling hemat & simpel yang berfungsi tepat sasaran
- **Refactor (Menata Ulang)** — proses pengubahan desain serampangan menuju wujud sistem yang elegan dengan kepercayaan diri tebal (skrip pengujian akan memprotes manakala refactor malah merusak kode).

---

## Kustomisasi Aturan (Rule Customization)

### Memodifikasi Aturan untuk Tim Anda

File-file aturan hanyalah sekadar kumpulan dokumen teks markdown biasa. Cara untuk menyesuaikannya:

1. **Edit aturan yang sudah ada (existing rules)** — Anda bisa sesuaikan ambang batas jumlah angka, maupun memberlakukan keseragaman format kode kustom khas warisan selera internal kantor.
2. **Tambahkan aturan kustom baru** — buat file `*.md` di bawah selimut folder `.agent/rules/`
3. **Copot/singkirkian aturan mubazir** — langsung buang ke tempat sampah apa-apa yang mengganggu laju proyek Anda (tetapi jangan ceroboh jika aturan itu berstatus "mandat mutlak").

### Jenis Pemicu Aturan (Rule Trigger Types)

Pilihlah tipe pemantik (trigger) secara cermat di aturan susunan Anda sendiri:

| Pemantik (Trigger) | Kapan Harus Digunakan                                     |
| ---------------- | ------------------------------------------------------- |
| `always_on`      | Aturan yang mutlak dan HARAM terlanggar walau di kondisi situasi tak genting sekalipun |
| `model_decision` | Aturan yang cuman punya taring saat berhadapan memecahkan urusan spesifik berkategori terkait di areanya |

**Contoh Kasus:** Sebuah sumpah "Jangan pernah mensisipkan parameter fungsi terlarang `eval()`" layaknya dianugerahi pangkat `always_on`. Sementara larangan membebankan urusan "Selalu susun rute kemasan lembar halaman GraphQL untuk rilis dataset gajah" pasnya diapit pangkat `model_decision` ditambah penyinggungan kata "API GraphQL" pada deksripsinya.

### Cara Menitipkan Aturan Khusus Target Bahasa Pemrograman

Susunan pedoman yang menancap sekarang dirancang mengedepankan fleksibiltas terhadap ragam keragaman bahasa netral. Jika ingin menginfus petuah khas bagi spesifik bahasa tertentu:

1. Cetak selembar file `.agent/rules/go-specific.md` (atau `python-specific.md`, dan semacamnya)
2. Pantek di kepalanya `trigger: model_decision`
3. Selangi sisipan rincian deskripsinya: "Ketika tengah membangun rancang bangun menyusun kode spesifik bahasa Go / Python"
4. Muntahkan seluruh pedoman penulisan tata laras kerama idomatik bahasa itu, lubang ranjau kelalaian para pemulanya, beserta resep pola rujukan dambaan kalian perihal skrip si bahasa.

---

## Eksekusi Keahlian Khusus (Skill Usage)

### Kapan Merilis Panggilan Keahlian

Keahlian (Skills) tak akan tiba-tiba meloncat unjuk kendali secara otomatis — Mereka hanyalah segenggam manual tata laksana baku agar diikuti oleh agen tatkala memenuhi sejumlah syarat kualifikasi:

| Situasi Pertimbangan Khusus               | Target Panggilan Keahlian |
| ---------------------------------- | ------------------------- |
| Melakukan Debug kelumpuhan sebuah keruntuhan error buta arah    | Protokol Debugging (Debugging Protocol)        |
| Memutus arah takdir dari persimpangan raksasa keputusan sistem | Pemikiran Sekuensial (Sequential Thinking) bersanding ikhtisar ADR |
| Memahat kode sumber (mengeksekusi cek list rincian sbelum menetas kode) | Memeluk Pagar Pendamping Keselamatan (Guardrails)                |
| Meninjau jejak karya skrip bersumber masa silam            | Peninjauan Ulasan Keselamatan Bersanding (Code Review)               |
| Eksekusi resep perancangan tata wajah perwajahan Website | Rancangan Antarmuka Tampilan Web (Frontend Design)           |
| Membentang sulam tata wajah aplikasi perwajahan Seluler | Panduan Susun Antarmuka layar Sentuh Ponsel (Mobile Design)             |

### Memadukan Peran Keahlian Mendorong Putaran Alur-Kerja

Adakalanya beberapa ragam *Workflows* otomatis mengajukan proposal agar *Skills* diperbantukan merapat mengawal bersamanya:

- Alur Kerja `/orchestrator` Tahapan 1 → Membutuhkan kemampuan **Sequential Thinking** untuk mengiris-iris kesimpulan tebak merancang
- Alur Kerja `/orchestrator` Tahapan 2 → Mengekor jejak daftar *checklist* standar kemanan pelaksana mandiri  **Guardrails** (Pratugos & Pascatinjau-mandiri)
- Alur Kerja `/orchestrator` Tahapan 2 → Bersandar merebahkan arah meluncurnya kepada **Debugging Protocol** manakala unit testes hancur berkeping mementalkan penyesalan seketika.
- Alur Kerja `/audit` Tahapan Fase 1 → Mendatangkan warta suci dari  **Code Review** (Mutlak senantiasa)
- Alur Kerja `/refactor` Tahapan Fase 1 → Mendatangkan pelita sinar **Sequential Thinking** memandu terjang kepekatan rute labirin refactor lintas jalan panjang

---

## Penegakan Kontrol Mutu Kualitas (Quality Enforcement)

### Paksaan Mandat Tuntasnya Kualitas Skrip (The Code Completion Mandate)

Segenap rantai operasi seruan menetas lahirnya kode tak luput memanggul beban deret putaran: Mengusulkan Kodingan → Mensahihkan Kesesuaiannya (Validate) → Meramu Ramuan Penyembuh jika Gagal Uji (Remediate) → Menjamin Verifikasinya → Baru Menyerahkan Putusan Finalnya (Deliver).

**Pantang Sekali Melangkahi Tiang Tahapan Penjamin Validasi.** Agen disumpah guna menggelar seruan pemantik linter, melempar tes peluru, seraya memaksa cetak balutan pra-rakit secara swa-otomatis baru akhirnya mengecap stempel berani melabel status komplit di hadapan pelapor. Jika tepergok meloloskan melompati rintangan tsb tanpa ba-bi-bu di layar terminal sampaikan gertakan:

> "Run the full validation suite before marking this complete." (Tolong laksanakan putaran mesin validasi uji linter/pengujian test secara utuh keseluruhan tes sebelum Anda mengecap tugas ini usai diserahkan tutup buku)

### Target Cakupan Penyisiran Uji Kode (Coverage Targets)

| Lapisan Kode Komponen | Tingkat Sasaran Minimal |
| ----------------------------- | -------------------------- |
| Area pengutak-atik logika bisnis ranah kekuasaan kemurnian (Domain logic)| Minimal Lolos Menutupi Setengah Lingkar Lebar Area `>85%`             |
| Barisan Resepsionis & Penyeru Komando Pesan Jembatan Rombongan API (Handlers / Controllers)        | Target Mencapai Ujung Ukur Angka `>=70%`                       |
| Serba serbi Lapisan Pertalian Penancap Kabel Pihak ke 3 (Integrasi antar Komponen Adapter)        | Disidak Penuh Menggunalan Wadah Lingkungan Karantina Murni Testcontainers |
| Pengujian Sempurna Meraba Melangkah layaknya Sentuhan Pengutus Awal Manusia Tuntun (E2E full flows) | Serendahnya Wajib Mencatat Kehadiran `1 Uji Alur` utuh per satu ragam Fiturnya     |

### Hierarki Susunan Strategi Uji Lapisan Urat

```
Pengujian Ujung ke Ujung E2E Tests (Tidak butuh merajut buanyak lintasan, cukup habis tempo pengoperasian paling super lama namun menyeluruh dan mencakupi pembuktian nyala tumpukan satu sistem totalitas mutlak tumpukan layanan utuh/ full stack)
    ↑
Pengujian Keterhubungan Integration Tests (Merajut kepingan jumlah menengah, dengan andalan wadah wadah wadaw kasing uji karatina Testcontainers)
    ↑
Uji Satuan Fungsi Unit-Tests (Dituai secara lebat tak terbatas membludak menjubati tuntas keramaian seantero pelosok rumah kode program, bergerak gerak super kilat melesat gesit dan mengandalkan selaput pembungkusan simulasi mesin bohongan pengganti sarana keluar masuk I/O)
```

Tulang punggung penjaga terbanyak seyogyanya dibekalkan buat laskar tameng Unit Test. Peranti pelacak Integritas mendedahkan jaminan rute antar perbatasan Adapter. Pertahanan mutlak terluar berupa E2E hadir mengawasi rintangan memuliakan skenario pengguna.

---

## Struktur Organisasi Rumah Proyek

### Skema Tata Organisasi Terbelah Berorientasi Fitur

Setelan tatanan kerangka proyek bawaan membimbing mengawal penyebaran wujud arsitektur **pembagian pilar lapak mengelompokan satuan berdasarkan fitur** (vertical slices), alih-alih merajut keranjang memilah pemisahan berlapis layaknya kue Lapis Legit yang monoton (layer-based):

```
# ✅ Tatanan Laskar Pemenang (Correct): Bersandar fitur bisnis mengumpal lengkap
features/
  task/
    handler.go
    logic.go
    storage.go
    models.go
  order/
    handler.go
    logic.go
    storage.go

# ❌ Serpihan Masa Lampau Tak Bernilai (Wrong): Sistem kaku berkutat misah berlapis-lapis
controllers/
  task_controller.go
  order_controller.go
models/
  task.go
  order.go
services/
  task_service.go
```

### Mengapa Cenderung Memeluk Pembagian Berbasis Fitur?

- Setiap satu ragam nama produk kapling layanan (fitur) menjelma laskar potong tebasan seiris utuh rapi vertikal meluncur tajam dari pinggir antar muka layar ke lambung belakang kedalaman pelataran Database yang mampu berdiri tegak tak repot diselingkupi bayang raga haluan fitur tetangganya.
- Penggantian setelan skrup mesin pesanan di serambi layanan `task` tidak mengguncang takkan menodai sarang susun pilar penyusun bersemayanya istana sarang penantian milik modul direktori keranjang `order` sedikitpun
- Fitur dimanjakan kemewahan otonomi mendandani kustom model strategi tempaan ujinya per sendirinya.
- Merangkak meniti hari para serdadu pilar fitur-fitur tsb dapat digotong dicangkok lepas menjamah ditarik merdeka ke kasta derajat kedudukan singgasana tersendiri (Microservices)
- Bingkai tapal batas sekat perbentengan meminjam sekat wujud lapis rupa batas-batas penampakkan Publik API murni menengadah antar fitur-nya yang amat jelas tegas membatasi.

---

## Lubang Jebakan Ranjau Maut Kerap Menelikung

### 1. Merobek Paksa Memansukan Mandat
Dilarang pongah menghapus menindih menyilang mandat aturan pangkat `always_on` sebelum mafhum beralasan matang membela sebab pertaruhannya. Segala pagar keselamatan keamaan pertahanan lapis ganda anti jebol penyusup sampai deret rekaman lapor pencatat CCTV *logging* tak sembarangan dihadiahkan kalau bukan sebab murni keselamatan kerangka proyek jangka abadi tak ternilai ke depan belaka.

### 2. Mengakali Mendahului Langkahi Lewati Sengaja Tingkatan Rute Fase Pengerjaan (Skipping Phases)
Bilik komandan pusat alur perakitan tungku pengerjaan pamungkas berseruan `/orchestrator` menancap titah tabu pelompatan tahapan pemutus tengah lintasan urutan fase. Taruh kata langkah setapak urutan nampak dipelupuk terasa terlampau muluk kepanjangan terpaksa dilalui urutan kerjanya, segera alihkan putar arah merujuk pelik perintisan tungku perintah Alur lain yang dipercaya memotong jalan pas guna di ladang rintisan spesifik sempitmu (specialized workflow instead):
- Perlukah tak ada tancapan menancap pipa kabel pihak ketiganya melintas butir Integrasi? Panggil cepat perintah tebasan  `/quick-fix` sang kilat si pelongkap seutas fase integrasi.
- Belum jua butuhkan kembara telaah riset merunut perpustakaan dokumen ke arsip masa lampau? Silakan panggil cepat gertakan  `/quick-fix` (menginggalkan tanpa setapakpun singgah mengukir jejak rintisan baca fase riset telisik awal).

### 3. Menggado Gado Mengaduk Menggabungkan Keinginan Siluman Macam-Ragam Dalam Semangkuk Mangkuk Ruang Sesi Pengerjaan 
Satu lembar Percakapan Suci = Satu tujuan tunggal mutlak memandu alur = Sekali peruntukan tembakan membidik satu tujuan tunggal (Satu tujuan mutlak per percakapannya). Pantang bertindak membenturkan kehendak serakah berniat memeriksa menjajal audit silang perbaikan menyapu noda di 1 lorong sesak percakapan sesi percakapan obrolan tumpah sama tak putus nafasnya itu jua. 

### 4. Meremehkan Lembaran Tinggalan Kenangan Buku Memori Penelititan Lapangan Temuan
Arsip riwayat perumusan galian serapan pustaka yang bersemayam bernaung di folder `docs/research_logs/` menanggung predikat penggalan buku tabungan perpustakaan rahasia pilar memori urat nadinya penopang korporasi instansinya. Tilik tilik obrolan mesin keesokan lusa mestinya bisa diajak pintar menghormati mencuri gali mengambil manfaat rujukan peninggalan kitab keramat bersamayamnya tsb, jauh lebih mendulang bernilai berlian timbang agen mesin kelak didera membabi gila bodonya disuruh menjerumus meneliti mencari telajah menyungkur ulang bahan setelan penelusuran yang itu itu memulu jua disedot galian topiknya untuk per-sekian kali berulangnya.

### 5. Membelot Tak Sudi Melapor Mendaftarkan Tembusan Kepastian Lewati Lolos Uji Validasi 
Menghindar rute tahapan tahap penutup verifikasi meniscayakan kemunculan rahasia kebusukan cacat bawaan maut rahasia di masa merajut jahitannya yang tak nampak kasat menipu indra sewaktu periode merangkai penulisan baru seumur aslinya berjalan (invisible during implementation): 
- Teguran Cacat Tata eja format nalar kesepakatan penulisan sintaks linter (Linter errors)
- Kutukan salah merasuk mematri pertukaran kemasan tipe propertinya di lapis lindung pengarah pelindungnya (Type errors bersandar skrip perisai semisal TypeScript)
- Keruntuhan berpacu susul menyusul berebut menyentap merebut peranti aset jajahanya dengan kelajuan beda silang merundung serbuan liar paraler lintas tapaknya (Race conditions yang kerap menukik menyerang lewat kawan detektor pelacak tameng seutas panggulan seutas lambang `-race` sewaktu merakit bahasa Go mendesing pacarnya)
- Seratan celah kotor noda lumpur rawan dijahati bajak kerawanan kebobolan celah rahasia celah-aman  *(Security vulnerabilities ditangkal pedang penyisir `gosec`)* 

Pancang kencang palang gerbang wajib selalu pacu jalankan sidang mutlak Verifikasi seutuhnya baru kirim melempar suguhan kapal layarnya dikapalkan meluncur menerbangkan kode!
