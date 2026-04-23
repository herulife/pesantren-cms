<div align="center">
  <img src="banner.png" alt="Awesome AGV" width="800" />
  <h3 align="center">Awesome AGV</h3>

  <p align="center">
    Seperangkat konfigurasi tangguh dan berkualitas tinggi untuk Agen AI.
    <br />
    <a href="#penggunaan">Lihat Aturan & Keahlian</a>
    ·
    <a href="https://github.com/irahardianto/awesome-agv/issues">Laporkan Bug</a>
    ·
    <a href="https://github.com/irahardianto/awesome-agv/issues">Minta Fitur</a>
    <br />
    <br />
  </p>
</div>

<!-- TENTANG PROYEK -->
## Tentang Awesome AGV

**Awesome AGV** menyediakan kumpulan standar dan praktik komprehensif yang dirancang untuk meningkatkan kemampuan agen pengkodean AI. Proyek ini menyediakan seperangkat aturan ketat yang disarikan dari praktik terbaik rekayasa perangkat lunak untuk memastikan kode yang dihasilkan aman, dapat dipertahankan, dan mudah dipelihara. Proyek ini juga menyediakan keahlian khusus yang akan membantu di seluruh proses pengembangan perangkat lunak.

Alih-alih hanya menghasilkan kode yang berfungsi, aturan dan keahlian ini memastikan agen menghasilkan kode yang **bertahan**.

Meskipun konfigurasi ini awalnya dirancang untuk **Antigravity**, konfigurasi ini dibangun di atas protokol konteks berbasis markdown standar yang mudah dipindahkan ke alat pengkodean AI lainnya. Bahkan, bentuk aslinya [Technical Constitution](https://github.com/irahardianto/technical-constitution/blob/main/technical-constitution-full.md) pertama kali dibuat untuk **Gemini CLI**

Anda dapat memasukkan konfigurasi ini ke dalam pengaturan konteks atau aturan kustom dari:

*   **Roo Code**
*   **Claude Code**
*   Alat agentik lainnya yang mendukung prompt sistem kustom atau pemuatan konteks.

Sebagai contoh, prinsip-prinsip dari [Konstitusi Perangkat Lunak Tangguh](.agent/rules/rugged-software-constitution.md) yang didasarkan pada [Rugged Software Manifesto](https://ruggedsoftware.org/) bersifat universal dan akan meningkatkan output dari asisten pengkodean berbasis LLM manapun.

### Fitur Utama

*   📏 **30 Aturan** — mencakup keamanan, keandalan, arsitektur, pemeliharaan, dan DevOps.
*   🛠️ **7 Keahlian** — kemampuan khusus untuk debugging, desain, review kode, dan lainnya.
*   🔄 **10 Alur Kerja** — proses pengembangan end-to-end dari riset hingga rilis.
*   🏗️ **Sistem Aturan Dua-Tingkat** — mandat yang selalu aktif + prinsip kontekstual untuk penegakan tanpa kebisingan.

> **💡 Semuanya modular.** Aturan dan keahlian bekerja secara independen — Anda tidak perlu alur kerja untuk mendapat manfaat dari keduanya. Gunakan hanya yang Anda butuhkan, modifikasi apapun, atau buat alur kerja Anda sendiri. Ini adalah toolkit, bukan framework.

<!-- MEMULAI -->
## Memulai

Untuk melengkapi agen AI Anda dengan kemampuan super ini, ikuti langkah-langkah berikut.

### Prasyarat

*   Asisten Pengkodean AI (Antigravity, Roo Code, Cline, dll.)
*   Proyek tempat Anda ingin menerapkan standar tinggi.

### Instalasi

**Instalasi Cepat (disarankan):**
```sh
npx awesome-agv
```

Perintah ini mengunduh dan menginstal direktori `.agent/` terbaru ke proyek Anda saat ini. Agen AI Anda akan otomatis mendeteksinya — tidak perlu konfigurasi tambahan.

**Opsi:**

| Flag           | Deskripsi                                          |
| -------------- | -------------------------------------------------- |
| `[target-dir]` | Direktori tujuan instalasi (default: `./`)         |
| `--force, -f`  | Timpa `.agent/` yang sudah ada tanpa konfirmasi    |
| `--help, -h`   | Tampilkan bantuan                                   |

### Contoh

```bash
# Instal ke direktori saat ini
npx awesome-agv

# Instal ke proyek tertentu
npx awesome-agv ./proyek-saya

# Timpa instalasi yang sudah ada tanpa konfirmasi
npx awesome-agv --force
```

**Instalasi Manual:**

1.  Clone repositori ini atau salin folder `.agent` ke root proyek Anda.
    ```sh
    cp -r /path/to/awesome-agv/.agent ./root-proyek-anda/
    ```
2.  Pastikan agen AI Anda dikonfigurasi untuk membaca dari direktori `.agent` (sebagian besar asisten pengkodean AI terkenal sudah mengikuti konvensi `.agent` secara default, tidak diperlukan tindakan) atau secara manual masukkan `.agent/rules/**` sebagai bagian dari prompt sistemnya.

<!-- PENGGUNAAN -->
## Penggunaan

Setelah terinstal, aturan dan keahlian dalam repositori ini menjadi aktif untuk agen Anda.

### Arsitektur Aturan

Pengaturan ini menggunakan **sistem aturan dua-tingkat** untuk meminimalkan kebisingan sambil memaksimalkan cakupan:

| Tipe           | Pemicu           | Tujuan                                                                                                                       |
| -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Mandat**     | `always_on`      | Batasan yang tidak bisa ditawar yang dimuat di setiap sesi (keamanan, logging, kelengkapan kode).                            |
| **Prinsip**    | `model_decision` | Panduan kontekstual yang diaktifkan hanya saat bekerja di area yang relevan (misalnya, aturan database aktif hanya saat menulis query). |

Konflik antar aturan diselesaikan oleh [Prioritas Aturan](.agent/rules/rule-priority.md) — keamanan selalu menang.

### Rangkaian Aturan Komprehensif

Kekuatan pengaturan ini berasal dari koleksi aturan yang ekstensif yang mencakup setiap aspek rekayasa perangkat lunak.

#### 🛡️ Keamanan & Integritas
*   **[Konstitusi Perangkat Lunak Tangguh](.agent/rules/rugged-software-constitution.md)**: Filosofi inti pengkodean yang dapat dipertahankan.
*   **[Mandat Keamanan](.agent/rules/security-mandate.md)**: Persyaratan keamanan yang tidak bisa ditawar.
*   **[Prinsip Keamanan](.agent/rules/security-principles.md)**: Praktik terbaik untuk desain yang aman.

#### ⚡ Keandalan & Performa
*   **[Prinsip Penanganan Error](.agent/rules/error-handling-principles.md)**: Teknik untuk manajemen error yang kokoh.
*   **[Konkurensi & Threading](.agent/rules/concurrency-and-threading-principles.md)**: Eksekusi paralel yang aman dan pencegahan deadlock.
*   **[Mandat Konkurensi & Threading](.agent/rules/concurrency-and-threading-mandate.md)**: Kapan menggunakan (dan tidak menggunakan) konkurensi.
*   **[Optimasi Performa](.agent/rules/performance-optimization-principles.md)**: Menulis kode yang efisien dan skalabel.
*   **[Manajemen Sumber Daya](.agent/rules/resources-and-memory-management-principles.md)**: Menangani memori dan sumber daya sistem secara bertanggung jawab.
*   **[Monitoring & Alerting](.agent/rules/monitoring-and-alerting-principles.md)**: Health check, metrik, dan degradasi yang halus.
*   **[Manajemen Konfigurasi](.agent/rules/configuration-management-principles.md)**: Variabel lingkungan, secret, dan hierarki konfigurasi.

#### 🏗️ Arsitektur & Desain
*   **[Prinsip Desain Inti](.agent/rules/core-design-principles.md)**: Aturan desain perangkat lunak dasar (SOLID, DRY, dll.).
*   **[Prinsip Desain API](.agent/rules/api-design-principles.md)**: Membuat API yang bersih, intuitif, dan dapat diversi.
*   **[Pola Arsitektur](.agent/rules/architectural-pattern.md)**: Desain yang mengutamakan testabilitas dengan isolasi I/O.
*   **[Struktur Proyek](.agent/rules/project-structure.md)**: Organisasi berbasis fitur (sumber kebenaran tunggal untuk tata letak).
*   **[Desain Database](.agent/rules/database-design-principles.md)**: Desain skema, migrasi, dan keamanan query.
*   **[Serialisasi Data](.agent/rules/data-serialization-and-interchange-principles.md)**: Penanganan data dan format yang aman.
*   **[Eksekusi Perintah](.agent/rules/command-execution-principles.md)**: Prinsip untuk menjalankan perintah sistem secara aman.
*   **[Hindari Dependensi Melingkar](.agent/rules/avoid-circular-dependencies.md)**: Mencegah siklus impor modul.

#### 🧩 Pemeliharaan & Kualitas
*   **[Organisasi Kode](.agent/rules/code-organization-principles.md)**: Menyusun proyek agar mudah dibaca.
*   **[Idiom Kode](.agent/rules/code-idioms-and-conventions.md)**: Mengikuti praktik terbaik khusus bahasa.
*   **[Strategi Pengujian](.agent/rules/testing-strategy.md)**: Memastikan kode dapat diverifikasi dan diuji.
*   **[Manajemen Dependensi](.agent/rules/dependency-management-principles.md)**: Mengelola pustaka eksternal dengan aman.
*   **[Prinsip Dokumentasi](.agent/rules/documentation-principles.md)**: Menulis dokumentasi yang jelas dan bermanfaat.
*   **[Logging & Observabilitas](.agent/rules/logging-and-observability-principles.md)**: Memastikan visibilitas sistem.
*   **[Mandat Logging & Observabilitas](.agent/rules/logging-and-observability-mandate.md)**: Semua operasi harus di-log — tanpa pengecualian.
*   **[Prinsip Aksesibilitas](.agent/rules/accessibility-principles.md)**: Kepatuhan WCAG 2.1 AA untuk UI.
*   **[Alur Kerja Git](.agent/rules/git-workflow-principles.md)**: Commit konvensional, penamaan branch, dan kebersihan PR.

#### 🔄 DevOps & Operasional
*   **[Prinsip CI/CD](.agent/rules/ci-cd-principles.md)**: Desain pipeline, Docker, dan GitHub Actions.
*   **[Mandat Kelengkapan Kode](.agent/rules/code-completion-mandate.md)**: Pemeriksaan kualitas otomatis sebelum setiap pengiriman.
*   **[Prioritas Aturan](.agent/rules/rule-priority.md)**: Resolusi konflik ketika aturan saling bertentangan.

### Keahlian Khusus

*   **[Protokol Debugging](.agent/skills/debugging-protocol/SKILL.md)**: Pendekatan sistematis untuk menyelesaikan error.
*   **[Desain Frontend](.agent/skills/frontend-design/SKILL.md)**: Panduan untuk membuat UI yang menarik secara visual, berdasarkan [Anthropic Frontend-Design Skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
*   **[Desain Mobile](.agent/skills/mobile-design/SKILL.md)**: Antarmuka mobile kelas produksi untuk Flutter dan React Native.
*   **[Pemikiran Sekuensial](.agent/skills/sequential-thinking/SKILL.md)**: Alat untuk memecah masalah kompleks, adaptasi dari [Sequential Thinking MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
*   **[Review Kode](.agent/skills/code-review/SKILL.md)**: Protokol review kode terstruktur terhadap kumpulan aturan lengkap.
*   **[Pagar Pembatas](.agent/skills/guardrails/SKILL.md)**: Daftar periksa pra-penerbangan dan review mandiri pasca-implementasi.
*   **[ADR (Catatan Keputusan Arsitektur)](.agent/skills/adr/SKILL.md)**: Dokumentasikan keputusan arsitektur yang signifikan dengan konteks dan trade-off.

### Alur Kerja Pengembangan

Pengaturan ini mencakup alur kerja end-to-end yang opinionated yang merangkai aturan dan keahlian ke dalam proses pengembangan terstruktur.

#### 🏭 Alur Kerja Fitur (`/orchestrator`)

Alur kerja utama untuk membangun fitur. Fase dijalankan secara berurutan — **tidak boleh dilewati**.

```
Riset → Implementasi (TDD) → Integrasi → E2E (bersyarat) → Verifikasi → Kirim
```

| Fase          | Alur Kerja                                          | Tujuan                                                                                                                       |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. Riset      | [`/1-research`](.agent/workflows/1-research.md)     | Pahami konteks, cari dokumentasi, buat ADR, menggunakan [Qurio](https://github.com/irahardianto/qurio) default untuk pencarian web |
| 2. Implementasi | [`/2-implement`](.agent/workflows/2-implement.md) | Siklus TDD: Merah → Hijau → Refaktor                                                                                        |
| 3. Integrasi  | [`/3-integrate`](.agent/workflows/3-integrate.md)   | Test integrasi dengan Testcontainers                                                                                         |
| 3.5. E2E      | [`/e2e-test`](.agent/workflows/e2e-test.md)         | Validasi end-to-end dengan Playwright                                                                                        |
| 4. Verifikasi | [`/4-verify`](.agent/workflows/4-verify.md)         | Validasi lint, test, dan build secara penuh                                                                                  |
| 5. Kirim      | [`/5-commit`](.agent/workflows/5-commit.md)         | Git commit dengan format konvensional                                                                                        |

#### 🔧 Alur Kerja Khusus

| Alur Kerja                                    | Kapan Digunakan                                      |
| --------------------------------------------- | ---------------------------------------------------- |
| [`/quick-fix`](.agent/workflows/quick-fix.md) | Perbaikan bug dengan penyebab yang sudah diketahui (<50 baris) |
| [`/refactor`](.agent/workflows/refactor.md)   | Restrukturisasi kode dengan aman sambil mempertahankan perilaku |
| [`/audit`](.agent/workflows/audit.md)         | Review kode dan inspeksi kualitas (tanpa fitur baru)  |

<!-- STRUKTUR DIREKTORI -->
## Struktur Direktori

```
.agent/
├── rules/             # 30 aturan (mandat + prinsip)
│   ├── rugged-software-constitution.md
│   ├── security-mandate.md
│   ├── rule-priority.md
│   └── ...            
├── skills/            # 7 keahlian khusus
│   ├── debugging-protocol/
│   ├── frontend-design/
│   ├── mobile-design/
│   ├── sequential-thinking/
│   ├── code-review/
│   ├── guardrails/
│   └── adr/
└── workflows/         # 10 alur kerja pengembangan
    ├── orchestrator.md
    ├── 1-research.md
    ├── 2-implement.md
    ├── 3-integrate.md
    ├── 4-verify.md
    ├── 5-commit.md
    ├── quick-fix.md
    ├── refactor.md
    ├── audit.md
    └── e2e-test.md
```

<!-- PETA JALAN -->
## Peta Jalan

- [x] Menyertakan lebih banyak keahlian khusus untuk membantu proses pengembangan (7 keahlian telah dirilis).
- [x] Menambah alur kerja pengembangan untuk pengiriman fitur yang terstruktur (10 alur kerja telah dirilis).
- [ ] Menambah lebih banyak aturan keamanan khusus bahasa (Python, Go, Rust).
- [x] Membuat alat CLI untuk instalasi yang lebih mudah (`npx awesome-agv`).
- [ ] Menambah skrip validasi otomatis untuk memeriksa apakah agen mengikuti konstitusi.
- [x] Menerbitkan situs dokumentasi komprehensif (GitHub Pages).

## Panduan Adaptasi Proyek

Pengaturan ini mendukung berbagai struktur proyek:

| Tipe Proyek            | Adaptasi                                                          |
| ---------------------- | ----------------------------------------------------------------- |
| **Monorepo** (default) | Gunakan apa adanya                                                 |
| **Backend tunggal**    | Hapus aturan/alur kerja frontend, pertahankan path backend        |
| **Frontend tunggal**   | Hapus aturan/alur kerja backend, pertahankan path frontend        |
| **Microservices**      | Sesuaikan `project-structure.md` per layanan, tambah aturan service mesh |
| **Mobile (Flutter/RN)**| Sesuaikan aturan frontend, tambah aksesibilitas/pengujian khusus mobile |

**Untuk adaptasi:** Edit `project-structure.md` dan `4-verify.md` agar sesuai dengan tata letak proyek Anda.

<!-- BERKONTRIBUSI -->
## Berkontribusi

Kontribusi adalah yang membuat komunitas open source menjadi tempat yang luar biasa untuk belajar, menginspirasi, dan berkreasi. Setiap kontribusi yang Anda berikan **sangat dihargai**.

1.  Fork Proyek
2.  Buat Branch Fitur Anda (`git checkout -b fitur/FiturKeren`)
3.  Commit Perubahan Anda (`git commit -m 'Menambah FiturKeren'`)
4.  Push ke Branch (`git push origin fitur/FiturKeren`)
5.  Buka Pull Request

<!-- LISENSI -->
## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat file [LICENSE](LICENSE) untuk detailnya.

---

<p align="center">
  Dibuat dengan ❤️ untuk Komunitas Developer
</p>
