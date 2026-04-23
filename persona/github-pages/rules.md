---
layout: default
title: Referensi Aturan
nav_order: 3
---

# Referensi Aturan (Rules Reference)
{: .no_toc }

Keseluruhan 30 aturan disusun berdasarkan kategori, dengan penjelasan tipe pemantik (trigger) dan tujuannya.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Cara Kerja Aturan

File aturan adalah file markdown di dalam `.agent/rules/` yang memberi panduan kepada agen AI. Setiap aturan memiliki satu **tipe pemantik (trigger)** di dalam kolom YAML *frontmatter*:

| Pemantik (Trigger) | Perilaku Operasional                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `always_on`      | Selalu dimuat (loaded) di setiap sesi — batasan mutlak yang tidak dapat ditawar                  |
| `model_decision` | Diaktifkan secara kontekstual ketika agen memutuskan bahwa pedomannya relevan dengan pekerjaannya |

Saat aturan saling berbenturan, [Prioritas Aturan (Rule Priority)](https://github.com/irahardianto/awesome-agv/blob/main/.agent/rules/rule-priority.md) menentukan mana yang dimenangkan. Keamanan selalu diutamakan secara mutlak.

---

## 🛡️ Keamanan & Integritas (Security & Integrity)

Sekumpulan aturan untuk memastikan struktur kode dibangun secara aman (secure by default).

### Rugged Software Constitution
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `rugged-software-constitution.md`

Filosofi mendasar yang diilhami [Rugged Software Manifesto](https://ruggedsoftware.org/). Menegakkan 3 Komitmen Mendasar: Bertanggung-jawab (Responsible), Defensif (Defensible), dan Mudah Dipelihara (Maintainable). Menekankan penerapan 7 Kebiasaan Kuat (Rugged Habits) termasuk pertahanan berlapis, instrumen pelacakan, pengurangan luas permukaan serangan, dan pembersihan jejak rekam kegagalan yang selalu aman.

### Security Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `security-mandate.md`

Titah keamanan mendasar (non-negotiable):
- Jangan pernah memercayai input pengguna — wajib validasi server-side
- Kunci secara default (Deny by default) — wajib ada lisensi izin khusus
- Gagal dengan aman (Fail securely) — tutup celah saat rusak (fail closed)
- Pertahanan berlapis (Defense in depth)

### Security Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `security-principles.md`

Panduan detail untuk pengamanan autentikasi, otorisasi, validasi input, operasi kriptografi, serta penanganan lalu-lintas data sensitif demi membendung kerentanan.

---

## ⚡ Keandalan & Performa (Reliability & Performance)

Aturan untuk memastikan kode tetap kuat dan efisien.

### Error Handling Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `error-handling-principles.md`

Teknik penanganan error termasuk mendefinisikan tipe error yang jelas, strategi pemulihan mandiri (recovery), error validasi, pelaporan pelanggaran logika bisnis, error infrastruktur, serta pembersihan sumber daya saat gagal.

### Concurrency & Threading Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `concurrency-and-threading-principles.md`

Pola aman pengerjaan paralel: penerapan rutinitas utas goroutines di Go, penggunaan fungsi pola async/await, tumpukan antrian thread pools, penghindaran proses saling tunggu terkunci macet (deadlock), dan sengketa interaksi memori (race conditions).

### Concurrency & Threading Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `concurrency-and-threading-mandate.md`

Mengatur secara tegas kapan menggunakan konkurensi (I/O-bound vs CPU-bound) dan kapan untuk dilarang mutlak. Menahan developer/agen dari melakukan kecerobohan optimasi berlebihan atau penggunaan fungsi multithreading yang mubazir.

### Performance Optimization Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `performance-optimization-principles.md`

Pedoman membuat program lebih efisien. Menyertakan saran untuk melacak performa awal via *Profiling*, skema uji banding (*benchmarking*), dan pengoptimalan di lalu lintas kode yang padat (*critical paths*).

### Resource & Memory Management
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `resources-and-memory-management-principles.md`

Seni menangani siklus hidup file, koneksi basis data (database connections), jaringan jaringan tumpuan antar server (network sockets), dan mekanisme penguncian (locks). Berisi pedoman membatasi jumlah pemakaian via *resource pools*, pelepasan muatan (cleanup), dan target batasan waktu putus (*timeout*).

### Monitoring & Alerting Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `monitoring-and-alerting-principles.md`

Implementasi pemantulan data nyawa detak aplikasi seperti endpoints peraba daya kesehatan *health checks* (`/health` dan `/ready`), penanaman pengukur muatan beban metrik via (metode RED/USE), hingga pemasangan batasan relai sekering listrik pencegah mesin hancur (*circuit breakers*), serta panduan pengurangan fungsi darurat seraya merelakan kejatuhan mesin perlahan tanpa henti total (graceful degradation).

### Configuration Management Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `configuration-management-principles.md`

Memisahkan variabel lingkungan sistem konfigurasi dari kode sistem, menyembunyikan variabel sistem rahasia *secrets*, beserta mendikte tingkatan derajat perintah konfigurasi (*CLI args* → *env vars* → files konfigurasi → batas nilai *default*) dan mengurus raksasa manajemen file simpan `.env`.

---

## 🏗️ Arsitektur & Perancangan Arsitektur (Architecture & Design)

Tata tertib pedoman memandu pembentukan kerangka susun skrip berskala panjang.

### Core Design Principles
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `core-design-principles.md`

Lanskap inti rancang bangun:
- **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY** — Don't Repeat Yourself
- **YAGNI** — You Aren't Gonna Need It
- **KISS** — Keep It Simple, Stupid
- Separation of Concerns, Composition Over Inheritance, Principle of Least Astonishment

### Architectural Pattern (Testability-First)
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `architectural-pattern.md`

Tonggak inti arsitektur perangkat lunak:
1. **Isolasi I/O (I/O Isolation)** — Menyembunyikan seluruh I/O melalui abstraksi Interfaces
2. **Kemurnian Logika (Pure Business Logic)** — Memisahkan proses perhitungan mesin logika matematis bebas pencemaran side effects/tampilan keluar.
3. **Arah Ketergantungan (Dependency Direction)** — Arus muatan terarah mendarat menuju pusaran pusat logika bisnis

Termasuk tabel ungkapan kustom spesifikasi tata pola masing-masing turunan jenis basanya.

### API Design Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `api-design-principles.md`

Merakit pangkalan layanan antarmuka *REST/HTTP APIs* berparas fungsional rapi, intuitif, seraya mudah diturunkan urutan pembaharuan versinya (*versionable*). Termasuk perihal endpoint muara keluar, tumpuan mesin layan *handlers*, saringan jaring tengah *middleware*, dan kerapian bungkusan pelapor hasil jawaban pesan *responses*.

### Project Structure
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `project-structure.md`

**Aturan absolut satu-satunya bagi referensi peletakan bangunan pondasi hierarki map rak penyimpan proyek (single source of truth for project organization).** Mewajibkan penyusunan arsitektur tumpukan bersandar fitur (feature-based) ke alur direktori bersangkutan, alih-alih tatanan membentang pembagian pemisahan vertikal berlapis. Dilengkapi susunan sketsa bentuk rumah peruntukan khusus:
- Keranjang Raksasa Bersama Campuran (*Monorepo*) backend + frontend + mobile
- Proyek spesifik Flutter/Mobile apps
- Aplikasi tunggal terasing backend maupun frontend
- Layanan Terdistribusi Serpihan Microservices

### Database Design Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `database-design-principles.md`

Meracik denah relasi simpan rak muatan rupa database struktur susunan rupa (mengedepankan rancangan rujukan tingkatan Normalisasi Berderajad Ke-Tiga 3NF), mengunci kesepakatan penamaan lebel (*naming conventions*), menjamin pemindahan struktur modifikasi data *migrations* dengan tertib selamat, efisiensi lalu-lintas memanggil tembak panggil mesin penelusuk database (*parameterized queries*, *indexing*, pemberantasan jeratan kutukan mutlak perulangan lingkaran setan *N+1*), seraya membatasi rantai siklus gulung tatanan transaksional berulang murni memutar simpan ke belakang batal susun muat *transaction management*.

### Data Serialization & Interchange
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `data-serialization-and-interchange-principles.md`

Prosedur lurus membongkar, membaca, seraya mengubah mengemas silang penanganan wujud pendaftaran data aman melalui gerbong bahasa format standar serapan pengantar (lintasan *JSON*, *XML*, *YAML*, bingkisan *Protocol Buffers*, ragam *MessagePack*, dan jubah format penyusun lain serupa).

### Command Execution Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `command-execution-principles.md`

Provisi panduan saat butuh menjalankan perintah panggilan aplikasi luar lewat pelatuk bahasa mesin murni (*shell scripts / CLI*). Menjaga ketat injeksi racun input susupan kotor tak kasat maya (preventing injection), meramu menangani lontaran penangkapan nilai eksekusi penolakan wujud kelolosan putusan rute batas gagal/menang laju proses exit codes luwes, mencabut tumpu memanusiakan wujud pemutusan nyala eksekusi agar lekas gugur tuntas layarnya tak mengambang jadi beban menumpuk sisa ampas memori tertidur di belakang (*managing process lifecycles*).

### Avoid Circular Dependencies
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `avoid-circular-dependencies.md`

Pantangan menyusun lingkaran perulangan import bolak-balik antara saling silang antar skrip. Peretas penangkal jembatan pemutus kemelut sengketa meliput: Memasukkan gundukan irisan tumpuan muatan fungsional berkode bersama (shared) diekstrak menuju bilik pondasi modul kasta ke-3 seutuhnya yang dipanggil bersama, menjabarkan rel tata arah rel putar pemancangan rantai pilar pijakan penusukan keterikatan (*restructure dependencies*), hinggga manuver pamungkas penerapan pola sisip menumpang wujud penyerahan penengah wewenang antarmuka (*dependency injection*).

---

## 🧩 Mudah Dipelihara & Kualitas (Maintainability & Quality)

Deretan perundangan pedoman membimbing kelayakan program agar senantiasa merendah dibaca murni lurus terjemah mata (readable), dijamin terukur disiksa ditampar pengujian tes (*testable*), tahan merangkak melewati panjang usia berlanjut hidup waras bugar seratus tahun lamanya (long-lived).

### Code Organization Principles
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-organization-principles.md`

Melempar cetakan membatasi struktur wujud fitur fungsional dengan kejalasan penegasan dinding penghadapan antarmuka wujud batasan pemisah public interfaces antar tetangga modul. Memandu penegasan wewenang sekat dinding bentur rute, jaring tumpuan perwujudan alur tata krama komunikasi silang tumpang panggil (feature interaction patterns), bersanding tumpuan teladan rujukan kawat jalur pelistrikan kawat persinggungan menanam persilangan jembatan wiring pengait panggil (*wiring examples*).

### Code Idioms & Conventions
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-idioms-and-conventions.md`

Menulis skrip idiomatik tulus asimilasi mutlak menuruti langgam rupa ketersesuaian peruntukan spesifik khas turunan bahasanya (*language target*). Hormati kesepakatan lidah kebudayaan kesepakatan tatanan komunitasa lingkungan ekosistem pendukung lokalnya, perah habis instrumen keahlian khusus mesin fitur pabrikannya, buang dan jauhkan tabiat anti-pola memboyong nalar koding asing diselipkan menyeludup melompat pagar pindah alam tatanan menyusup menyilang masuk dari luar negeri ekosistem tumpuan murni sang target pemakai (avoid cross-language anti-patterns).

### Testing Strategy
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `testing-strategy.md`

Skema lengkap eksekusi pengujian:
- **Unit tests** (Menutup kepung wujud peranti pelabuhan tempelan alat pemalsu luar mocked I/O pelayan sisip bayangan, memukul rata menjamin menangkup target persentase tameng penutup peluru tatas lingkup jangkauan wilayah domain logic murni melebur `>85%` luasan raga).
- **Integration tests** (Peluh bentur karantina menangguk dukungan pemandu piranti kontainer sungguhan Testcontainers mendedah melilit wujud uji infrastruktur).
- **E2E tests** (Penjenjajahan lakon skenario penjarah meniru mutlak safari pengguna manusia penuh layar ber-alat Playwright dll).
- Susun tatanan laci uji coba skrip *Test* dikeserasikan wujud gelar tatanan logat penamaan lebel (*naming conventions*).

### Dependency Management Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `dependency-management-principles.md`

Kendali pawang mengasuh percampuran tamu luaran bungkus kumpulan *library eksternal* dengan aman — tumpuan disiplin pengikatan wujud tancap umur pematokan kunci versi perbaris (*version pinning*), penggelaran pamungkas sidak lacak riwayat pelaporan pelucutan cacat pengamanan audit lacak muatan, memangkas buangan meredam kelebaran luas membedah luasan empuk jangkauan sasar sasaran tumpuan maut tembakan celah (*minimizing attack surface*).

### Documentation Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `documentation-principles.md`

Pemakaian penamaan skrip perawakan pemanggil murni lugas sebagai penjelasan diri (*Self-documenting code*), tata tertib menyusup penjelasan baris sisipan keterangan kapan dibutuhkan (MENGAPA fungsi melompat ke angka 5, bukan menceritakan APA fungsi 2+3 tersebut merangkaiannya bekerja), membentangkan arsitektur hierarki tingkatan wujud tata pembeberan penampakan dokumen pelapis mulai komentar sela-menyela kode hingga meraksasa berbentuk wujud raksasa ulas pilar besar jasad dokumentasi Arsitekturnya.

### Logging & Observability Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `logging-and-observability-principles.md`

Merajut panduan komplit tata pelacak pandu: pengelompokan wujud derajat bahaya peringatan kancing tingkatan jenjang log levels, menjahit seragam memandu kasta perwajahan berstruktur tak rubah kaku paten di *structured logging patterns*, panduan logat menelusup khusus rintisan terapan tumpuan murni pengamanan spesifik logat bahasa (*peruntukan Go, TypeScript, dan Python*). Perhatian waspada pelucutan tata privasi tumpu wujud celah security, hingan wejangan pamungkas performansi kejituan eksekusi rekam cepat log yang tak menyeret perlambat jalannya roda (*performance best practices*).

### Logging & Observability Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `logging-and-observability-mandate.md`

Fungsi penyemat catatan absolut pada semua mulut pelaksana awal masuk eksekusi seruan pemantik operasi keluar masuk *(operation entry points)* mutlak diikutsertakan (mencatat lafal Start/memulai, menderu Success/jaya, atau tumbang roboh meronta Failure/gagal). Penempatan konteks rekam rekat jejak atribut identifikasi penjemput muatan log absolutnya: *correlationId*, *operation name*, hitung-hitungan penelusur masa rentan durasi waktu lari nafas hitung laju putaran per *duration*, menancap penunjuk papan pengunjung per *userId*, dan sisa buang jasad gagal *error* sela tertinggal hancur rontok meruntuhkan jalan.

### Accessibility Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `accessibility-principles.md`

WCAG 2.1 Level AA patuh penyelarasan: Kerangka raga kemuliaan wujud barisan susun HTML semantic murni bernilai fungsi lugas, kemampuan merayap menginjak lumbung kemudi sirkuit peluncuran lari jelajah lintasan susup penunjuk lajur tekan loncat tuts memandu tumpu *keyboard navigation*, lekat atribut sisipan wujud pemandu label ghaib pembesar pendamping mesin peraba perwajahan pemandu pembaca *ARIA*, jaminan sengketa kontras pertalian perimbangan beda jarak beda pisah warna sorot wujud mencuat kentara menyalak menyemai tajam bertolak corak lias jarak batas pertahanan mata (color contrast), penempatan perlakuan imbasan pandu ghaib bagi sajian potret raga lukisan menangkap jejak (*images*), mengawaki kesopanan ladang tempat tumpah muatan pundi penampung formulir menjamu sumbangan tampung per tikan tuangan (*forms*).

### Git Workflow Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `git-workflow-principles.md`

Pendiktean laju penata tata nama jalin kemasan konvensi sebutan *Conventional commits format*, penamaan belah ranting simpangan percabangan peta kemudi cabang penugasan (*branch naming*), rupa perombakan kesucian susunan silsilah lapor catatatn (*commit hygiene*), pengekangan rambu ukuran batasan wujud berat badan proposal usul menumpas muatan tumpuan pundi ajuan sisip permohonan lebur tarik minta asuh tarik merapat PR (*<400 lines ideal*), mendarat merangkul kemudi perlakuan rute mengasuh pelabuhan tancap tumpu penyerbuan perleburannya (*merge strategy*).

---

## 🔄 DevOps & Operasi (DevOps & Operations)

Aturan untuk otomasi alur pengembangan (pipeline).

### CI/CD Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `ci-cd-principles.md`

Mendesain tata saluran rel Pipa berurut maju perangkaian berurut tahapan otomatis (lint → build → test → deploy), mengadopsi taktik pertingkatan wujud lapis berganda peramping *Dockerfile* (multi-stage builds), meramu mempesona rute ikatan tumpuan kontainer menyusun lapis pelengkap jala layanan arsitektur seruan Docker Compose patterns, merias dan merekam cetakan templet paku wujud pengatur panggung seruan setelan rel alir skrip rilis GitHub Actions templates, rute pengoperan penaikan tingkatan muatan bergeser kasta promosi singgasana dari perbatasan bawah hingga rilis memancar tayang (environment promotion strategy).

### Code Completion Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-completion-mandate.md`

Sebelum mengakhiri sebaris penugasan rupa kodingan utuh diklaim usai rampung paripurna, MESIN WAJIB mengeksekusi meremas melempar ke panggung pengadilan kualitas kodingan swa-otomatis *(automated quality checks)*:
1. Bangkit Mencetak Raga (*Generate*) → 2. Disidang Mutlak (*Validate*) → 3. Diobati Membedah Penyelesaian (*Remediate*) → 4. Dicek Uji Kesahihan Tutup Kembali (*Verify*) → 5. Dikirim Dilepas Mendarat Kelar Tutup Usai Rampung Tutup Buku (*Deliver*).

Termasuk melampirkan daftar lafal instruksi pakem khusus rute validasi spesifik perintah untuk bahasa Go laras menyilang dan renteng rintisan linter kaku skrip TypeScript/Vue.

### Rule Priority
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `rule-priority.md`

Resolusi untuk mengatasi aturan yang berlawanan dan saling mendikte memaksakan kemauan sendiri. Urutan prioritas kekuasaan prioritas tahta aturan sengketa pendamai:
1. Mandat Keamanan (*Security Mandate*) — Selalu Menang Mutlak Tak Tergugat
2. Rugged Software Constitution
3. Code Completion Mandate
4. Testability-First Design
5. Prinsip fitur fungsional murni terkhusus
6. YAGNI / KISS
