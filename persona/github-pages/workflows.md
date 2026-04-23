---
layout: default
title: Referensi Alur Kerja
nav_order: 5
---

# Referensi Alur Kerja (Workflows Reference)
{: .no_toc }

Keseluruhan 10 pedoman alur kerja pengembangan — mulai dari implementasi fitur baru hingga audit/peninjauan kode.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Memahami Alur Kerja (Workflows)

Alur kerja adalah file definisi instruksi terstruktur fase-fase pengembangan yang tersimpan di dalam `.agent/workflows/`. File-file tersebut berfungsi merangkai aturan (rules) dan keahlian (skills) menjadi siklus eksekusi pengembangan terapan (development cycles).

Setiap alur kerja akan dijalankan melalui pemanggilan **slash command** (misal `/orchestrator`, `/quick-fix`) yang menuntun agen AI murni menyelesaikan tahapan demi tahapan yang dilengkapi indikator lolos (completion criteria) spesifik pada masing-masing fase-nya.

### Memilih Peruntukan Alur Kerja

| Kondisi Masalah                      | Panggilan Alur Kerja Terkait                            |
| ------------------------------ | ----------------------------------- |
| Pembuatan proyek implementasi fungsional / fitur baru         | `/orchestrator`                     |
| Perbaikan bug / celah ringan berskala ubahan kecil (<50 baris) | `/quick-fix`                        |
| Eksekusi penyusunan ulang, memindahkan letak komponen kode lama             | `/refactor`                         |
| Inspeksi penyisiran evaluasi standar penulisan / audit         | `/audit`                            |
| Eksekusi terpisah tunggal pada 1 fase saja         | `/1-research`, `/2-implement`, dll. |

---

## 🏭 Alur Kerja Utama (/orchestrator)

**File:** `.agent/workflows/orchestrator.md`

Alur silsilah utama (workflow) murni guna menuntun agen menyusun kerangka penugasan terapan baru. Setiap rute dipandang mutlak menyerupai silsilah ketaatan tata mesin berurutan (**state machine**) — tak boleh ada satupun fase di dalam rutenya dilompati/dikurangi.

### Silsilah Urutan

```
Reset (Research) → Penerapan Skrip (Implement via metode TDD) → Peleburan Terapan Real (Integrate) → Pengujian Gawai Ujung-ke-Ujung E2E (bersyarat opsional) → Pengecekan Total Linter Verifikasi (Verify) → Pelepasan Rilis Commit (Ship)
```

### Penjelasan Detil Tiap Fase Rute

| Tahap Fase             | Indikator Target Terselesaikan Lolos Lanjut (Gate)                         | Keluaran Target (Output)                                |
| ----------------- | ---------------------------- | ------------------------------------- |
| Research          | Penulisan log investigasi hasil riset tersimpan utuh         | Fail daftar tugas rincian `task.md` + file bukti riset di `docs/research_logs/*.md` |
| Implement         | Semua rangkaian Pengujian Terpisah *(Unit tests)* sukses mutlak 100% lulus tak ada pesan error terkendala             | Penyimpanan mutlak rupa skrip murni pilar fungsional program (kode rilis) disanding file pasangan uji unti test-nya         |
| Integrate         | Seluruh uji penyatuan kelayakan interaksi komponen program nyata *(Integration tests)* mendarat sukses tembus berjalan utuh       | Pencantuman File skrip pelengkap Uji Integrasi berbekal simulasi silsilah pelaksana mesin *(Testcontainers)*   |
| E2E (bersyarat optional) | Ujian tuntas rute kelayakan pemantauan perjalanan pengunjung aplikasi tanpa kendala, dan memuat bukti lampiran foto tangkap layarnya | Terbacanya File skrip E2E tests + cetak gambar tangkap layar *(screenshots)*               |
| Verify            | 100% indikator kelayakan sapuan linter lolos pemeriksaan             | Laporan ketuntasan liputan penutupan saringan sasaran luasan kode rincian Coverage report   |
| Ship              | Terhimpun mengkristal diamankan utuh di ranah status warta rekaman Commit perangkum log git                   | Bukti penyimanan mutlak penulisan warta *Git commit* dengan format konvensial standar                             |

### Aturan Pokok Utama

- **HARAM dan TERLARANG KERAS menyilap merompak tahapan silsilah** — fase berikutnya tak diizinkan jalan menginisiasi skrip baru apabila silsilah fase tahapan pendahulunya urung dinyatakan tamat (complete) dan sukses mutlak!
- Agen AI disumpah dan menerima status kuasa murni mandataris bekerja melayani silsilah sebagai layaknya profil perwatakan: "Programmer Pejabat Senior (Senior Principal Engineer) dengan perintah ketaatan ekstrem pada absolut tatanan rupa protokol wewenang Awesome AGV mutlak tanpa cela kelonggaran".
- Tepat sebelum mengawali silsilah penerapan cetak ketikan skrip pemrograman: agen dimandatkan menggali ke sarang `.agent/rules/`, mensidik serta mengenali seluruh irisan berkas aturan spesifik yang bersangkut kelindan mengurai sengketa dengan pekerjaannya lantas MEMBACANYA utuh murni tanpa kecuali!
- Cincin pengunci ceklis daftar `[x]` kotak rampung penyelesaian penugasan (*tasks*) yang ada, sah hukumnya diisikan ditandai ceklisnya usai lolos palang gerbang penutupan sidang Verifikasi (Verify) kelar!

### Rute Pandu Darurat Antisipasi Terhentinya Fase (Error Handling)

Apabila dijumpai adanya kebuntuan pada tahapan fase tertenitu (fase gagal ditembus indikator target kelulusannya):
1. Dokumentasikan apa akar penyebab kelumpuhannya pada barisan awal file ceklis warta rangkuman tugas pencatatan task summary.
2. Jangan berpindah atau lari ke tahapan siklus fase lanjutannya
3. Tuntaskan urusan tambal perbaikan murni skrip di dalam kandang tahapan lingkup fase tersebut sendirian tanpa berpindah status
4. Putar memanggil verifikasi ulang parameter sukses/indikator di fase terkaitnya
5. Lanjut usai perbaikannya terkonfirmasi melintas tuntas (pass).

---

## Tahap 1: Evaluasi Riset Dasar (`/1-research`)

**File:** `.agent/workflows/1-research.md`

Pemahaman landasan teoretis mendeteksi pemahaman awal akan keseluruhan sengketa akar konteks sebelum mencolek dan melahirkan eksekusi menulis satu baris skrip pun.

### Prosedur Kerja
1. **Pecah Konteks Mandat** — Membaca maksud peruntukan tuntutan spesifik pesanan pengguna
2. **Bedah Silsilah Arsitektur Sisa** — mengupas memahami jeroan perihal logika koding pendahuluan tatanan sisa proyek aslinya (current implementation)
3. **Bangun Tiruan Sketsa Penyatuan Integrasi Peta Arsitektur (*Mental Model*)** 
4. **Petakan Rentang Titik Lingkup Laju (Scope)** — Menerjemahkan turunan sasaran pekerjaan ke wadah urutan daftar `task.md` bersisi tugas atomik porsi penyelesaian spesifik.
5. **Inventarisasi Daftar Pencarian** — Sebutkan seluruh ekosistem *library*, pustaka bahasa (tech stack) atau instrumen penopang pihak luaran mana saja yang terlibat menopang fungsinya.
6. **Eksekusi Penjelajahan Pustaka Dokumentasi** — mengerahkan telik pencari *crawling browser Qurio* melakukan mesin pemindai laman web mendapati kepastian bacaan murni fungsi teknis tiap perangkat librarinyanya.
7. **Bungkus Susun Log Lapor Hasil Risetnya** — Tuangkan temuan wujud dokumentasinya mengendap di arsip file `docs/research_logs/{judul-fitur}.md`
8. **Tuangkan Peninggalan Arsitektur Rekaman (*ADRs*)** — Jika ditemui terobosan desain menagih pilar pencatatan sejarah besar, panggil dan cetak keabsahan lewat Keahlian ADR Skill.

### Peranti Sentuh Keahlian Terkait
- **Sequential Thinking** — Guna merintis mengurai gundukan sengketa pilihan tata rute rancang bangun dan kepelikan pemutus pilihan arsitektural kompleks
- **ADR Skill (Pencatatan Putusan Arsitektural)** 

---

## Tahap 2: Menerjemahkan ke Skrip (`/2-implement`)

**File:** `.agent/workflows/2-implement.md`

Menghimpun mengetik tumpukan rupa balok jasad rilis penyusunan skrip murni produksi bersandar siklus metodologi *Test-Driven Development (TDD)* murni.

### Sirklus Wajib Metode TDD Mutlak Murni
1. **Merah (Red)** — Tuang tulis skrip pengetesan yang gagal (*failing test*)
2. **Hijau (Green)** — Tulis skrip pemenuhan logika koding minimal serba hemat secukup guna murni agar indikator keluntasan mesin tes tadi terselesaikan.
3. **Rombak Penyatuan Arsitektur Rapian (Refactor)** — Benahi memoles rupa serpihan wujud penyusunan keanggunan bentuk rute sintaks kodingnya kelak tanpa melukai melumpuhkan wujud kelulusan jayana pengujiannya.

### Syarat Syarat Uji Kinerja Pengujian Komponen Tunggal Murni Uji Satuan (Unit Test)
- Palsukan mem-bayangi (mock) semua unsur kebergantungan luar/lintas seberang luar I/O (I/O boundaries interfaces) perbatasannya (database, network)
- Tes urutan rute kemenangan (*happy path*), rute sengketa maut (*error paths*), tak pelak menyisihkan sengketa pilar batas tepian tebing tepi gila *(edge cases)*
- Sasaran menyudahi luasan tatanan serbuan mengcover `>85% coverage minimum` (murni pada area pilar logika bisnis murninya saja)

### Peranti Sentuh Keahlian Terkait
- **Sequential Thinking** — Guna menangani kesetanan teka-teki manuver pembelahan penyusunan ulang skrip koding pusingan maut memecat rupa penyatuan gila (refactoring).
- **Debugging Protocol** — Menengahi teki masalah kilit sandi teki-teki letupan eror tes yang buram asalnya darimana
- **Guardrails** — Lapor Sidik Wajib Tuntas daftar kelayak *checklist* persiapan sebelum beranjak mengetik ke tulisan (preflight pre-coding).

---

## Tahap 3: Peleburan Komponen Terapan Asli (`/3-integrate`)

**File:** `.agent/workflows/3-integrate.md`

Menggelar wujud pembuktian unjuk gelar ketuntasan silsilah jeroan skrip arsitektur bersanding menyentuh tumpuan nafas pendamping perbekalan elemen infrastuktur tumpu prasarana sesungguhnya mengusung pengawalan (Testcontainers dll).

### Kapan Diwajibkan Jalan
- Bila skrip terapan melintasi menyentuh dinding pengasuh penyimpanan pangkalan memori penyimpanan Database (komponen storage adapter implementations)
- Komponen rupa logika jembatan menyebrang melempar dan menerima sambungan tumpu kawan eksternal pihak seberang (external API handlers)
- Saat mengasuh rel pilar pengasuhan alat utilitas sistem persuratan pesan antarmuka perangkai pesan ganda, tampungan selip memori penyimpanan sementara singgah pesan kilas, dan kawan sejawat lainnya (seumpama message queues/caches)

### Prosedur Eksekusi
1. Rangkai panggil persiapan *karantina silsilah piranti bohongan tiruan* infrastruktur sesungguhnya via wadah Testcontainers (memanggil pelayan PostgreSQL tiruan simulasi, pelayan Redis siluman pelapis, NSQ, dll.)
2. Membentuk membubuhi menyusun jasad uji lapis *Integration Tests* (bernafas menyematkan gelaran akhiran nama `*_integration_test.go` di sarang Golang atau persinggahan `*.integration.spec.ts` di asrama TypeScript)
3. Eksekusi tembakan pengujian berjalur penyatuan terapan uji integritas integrasi 
4. Boleh diisikan lapor pemeriksaan pengujian telik pandang tangkap peraba pemakaian campur tangan jepret saksi manusia pelihat rupa *Manual verification*

---

## Tahap 3.5: Ujian Rute Jelajah Ekstrem (E2E Test) (`/e2e-test`)

**File:** `.agent/workflows/e2e-test.md`

Menelanjangkan mengoper membajak keutuhan seluruh alur skenario rute lalu lintas panjang melayari simulasi rupa jejak jalan perjalanan persinggahan tatap muka interaksi pengoperasian keliling utuh dari sang kacamata tamu (the whole system interaction / user journey) memandu menumpang gerbong penindai kendali serbuan otomatis alat sulap peretas *Playwright MCP*.

### Kapan Diwajibkan
- Sewaktu menyinggahi memoles menambahkan meredesain elemen blok UI menyentuh pengunjung depan layar gawai utuh
- Menyentuh perbatasan sapa rupa komponen seruan API yang melempar jawaban ke wajah frontend (sisi pengguna di peramban)
- Tatkala merombak menilik letusan mengubah arus laju prosedur urat lari interaksi bisnis urat nadi yang fatal

### Diizinkan Untuk Melewatinya Saja Bilamana
- Sebatas merekayasa meromba urat permesinan murni tersembunyi jauh di balik pelataran backend terdalam
- Mereparasi memahat penertipan tatanan kemasan keranjang penumpu berkas bungkusan internal library pelengkap fungsi (tanpa berdampak sisi luar)
- Cuma modifikas isian naskah pengujian / *test-only changes* tanpa menancap corak baru ke wajah produksi murni.

### Tahapan Runut
1. Menghidupkan saklar peranti seluruh pelayan pilar (docker compose atau wadah *local dev* pendampingnya utuh)
2. Membentuk kertas peluncuran rencana naskah pandu pengujian
3. Ekeskusi peluncurannya meminjam keperkasaan alat Playwright MCP browser murni otomatis (merekayasa jepret foto peragaan klik layar jepret *screenshot interact* utuh)
4. Melampirkan cetakan buktinya membingkai simpan naskat laporya tertuang membubuh gambar menyusup di folder pelaporan galeri temui `docs/e2e-screenshots/`

---

## Tahap 4: Pemeran Validasi Verifikai Tuntas Totalitas (`/4-verify`)

**File:** `.agent/workflows/4-verify.md`

Proklamasi mutlak wajib memberanikan diri disidang pengadilan penjara pengusutan total memilah mendedah melerai mencabut kecacatan menyapu gundah menyikat lapor perihal jasad noda serapan cacat kotor *linting* (all linters), memanggil pengukur cacat celah *static analysis*, ditambah kelolosan tes-ujian koding sebelum berani melenggang melangkah melepas usai garapan pekerjaannya.

### Batasan Ukur Wajib Backend (Bawaan Golang murni)
```bash
gofumpt -l -e -w . && go vet ./... && staticcheck ./... && gosec -quiet ./... && go test -race ./...
```

### Eksekusi Uji Mutlak Linter Lolos Validasi Tahan Cacat Peranti Wajah (TypeScript/Vue)
```bash
pnpm run lint --fix && npx vue-tsc --noEmit && pnpm run test
```

### Palu Ketok Sah Perakitan Kemasan Bangun Aplikasi (*Build Check*)
```bash
# Sisi Mesin Backend
go build ./...

# Sisi Pamer Muka Frontend
pnpm run build
```

### Palang Merah Minimal Pencapaian Ketahanan Lingkaran Sasar Pengujian Jangkau Tancap (Coverage)
Target melahap batas tancap penuhan luas menutupi `>85%` wujud wilayah kemurnian pada inti area silsilah jantung penyemat logis mesin hitung (*domain logic*).

### Bila Nyatany Menabrak Gagal Menembus Rintang Tahapan Verifikasi
1. Pantang HARAM melerai diri lari melepas melanjutkan seruan tamat lepas putusan komit usai rilis (`Ship`) kelanjutnnya.
2. Putar balik balikan rute gerak tatalaksana arah ke posisi Fase ke-2 implement murni atau menyentuh memangkas memoles perbaikan integrasi ulang murni seutuhnya.
3. Setelah noda selesai bersih disingkirkan, Panggil raung pental putaran pembuktian mesin Verifikasinya murni lagi sedari detik awal pemeriksaan total tanpa lewat satupun rumpang tertinggal. 

---

## Tahap Peluncuran 5: Tancap Rilis Pembungkusan Kelar (Ship Pledging Commits) (`/5-commit`)

**File:** `.agent/workflows/5-commit.md`

Penobatan rupa perampungan hasil tugas memutusi penyegelan titip pilar komit silsilah bungkusan *commit* murni menuruti etika kepatutan tatanan pelabelan penyepakatan nama gelar penertiban nama komit berkonvensi resmi Conventional commit.

### Format Paten Susun Turun Baku (Conventional Commit)
```
<pangkat_tipenya>(<area_sasaran_nama_scope>): <keterangan_deskripsi_lapornya>
```

### Penggolongan Kelompok Pangkat Tipenya
| Pangkat Kelompok (`type`)       | Sasaran Maknanya                          |
| ---------- | -------------------------------- |
| `feat`     | Lahirnya pilar fitur tunas kebaruan fungsional peranti   |
| `fix`      | Menyumbat menambal kutu keparat maut sang bug merusaknya  |
| `docs`     | Sentuhan kosmetik merias meluruskan ulas tata tulis narasi label keterangan penjelasan berkas (komentar/readme)             |
| `refactor` | Bongkar tatanan pijak silsilah memutar kemudi jeroan murni sengketa silsilah koding (tanpa berwujud lahirnya fungsi kemudahan fitur baru / membunuh tambalan cacatan rilis) |
| `test`     | Penyesuaian kelonggaran penyegaran perombakan penambaham sisipan menyematkan kail uju skrip rilis tes.         |
| `chore`    | Menyapu halaman pekarangan rupa lalat pemeliharan pembarusan ketergantungan ganti susun kancing wujud silsilah versi kebergantungan mesin alat penopang pustakan eksternal dll         |
| `perf`     | Rombak peras gilas peningkatan kecepatan tenaga meluncur pacunya         |
| `ci`       | Bongkar penyusuan merombak tali komando rute perpipaan rilis awan integrasian penyaluran beruntun di tatanan rel silsisilah CI/CD     |

---

## 🔧 Workflow Cepat Tangkas Menambal Darurat Kutu Bug Singkat (Quick-Fix Workflow:`/quick-fix`)

**File:** `.agent/workflows/quick-fix.md`

Rute terobosan pelarian kilat menyelesaikn noda raga temuan celah bug mini murni berkala mungkil ukur sungsang tancapan ubahan baris ringkat (*<50 barisan ubahan modifikasi patahan guras kode*) tanpa menagih kewajiban melampaui tahapan melelat letih mendedas tahapan penelusuran Riset baca dan fase rilis meratapi penat membakar peleburan sengketa uji integrasinya *(integration phases)*.

### Kapan Diperlukan
- Menambal tumpu tembus celah noda penemuat murni wujud asul usul sebab letupan bug-nya jelas diketahui pangkalnya (known root cause)
- Gubahan rupa bongkaran murni merombak baris letus singkat tumpu mini celah rintang secuil saja mutlak tanpa buntut (*small, isolated changes*)
- Tambal darurat murni menyelamatkan muka pemadaman maut murni (Hotfixes darurat saat itu juga nyalakan penawar kilat)
- Obat penawar rujukan pasca menjumpai vonis temuan persidangan tuntutan pembedah laporan lapor temuan di fase silang panggil gelar seruan tahapan komando audit sidak rilis `(/audit)`.

### Rumpun Turunan Rutenya (Phases)
1. **Diagnosis Pemeriksaan (Diagnose)** — menandai menjaring rupa sengketa pemicu maut kotornya bug, mengawasi silsilah terjang tumpak kode terjangkit sakit menyisir lokasi, dan merangkul memboyong bantuan keahlian *Debugging Protocol* skill jikala gentar dipandang membutuhkannya
2. **Bedah Sembuh dan Gilas Tes murni serapan gaya pakem Test-Driven Development (Fix + TDD Test)** — bubuhi gurat skrip tes pembuktian jatuh pecah kegagalan dihadapkan buktikan dulu *failing test*, balurkan oles ramuan penawar memutar membesut jahit penyembuh skrip letupan eror tambal perbaik fix-nya mengokohkannya, buktikan sisa skrip sisa lamanya di sudut lain keutuhannya terjamin tanpa pecah tewas gagal menyikapi tumpu tes penyisirnya lurus mulus (verify existing pass)
3. **Penyisiran Mutlak Tutup Palah dan Sepak Unggah (Verify + Ship)** — Guyur murni rute jalar sidang linter tumpas mutlak verifkasasi, lantas di-kunci dengan balutan tumpahan stempel rilis berlabel `fix`.

---

## 🔧 Workflow Refactor Bedah Tatanan (Refactor Workflow: `/refactor`)

**File:** `.agent/workflows/refactor.md`

Menjemput mutlak jaminan rombak bongkar kerut bungkusan tumpuan wujud merestrukrurisai jajah sengketa memapas merubah tumpu kediaman kemah skrip banguanan lama namun tak mencedirain memukul cacat menggeser menjatukan tatanan fungsionalisas watak fungsional aselinya sama semuannya tiada rubah kelakuannya (preserving behavior intact while restructuring code).

### Kapan Diperlukan
- Rupa menata restrukturikasi tata mupun rupa bentuk koding murni perihal letak tatanan map seret geser nama pindah belah rombak pecat lilit nama perubah tatanan (memboyong rupa belah letak pecahan *splitting modules*) dll.
- Bedol eksodus wujud rombak serapan mutlak pindah adat budaya peradapan koding murni perombakan pemutasian merupa *(merombak langgaman lawas seruan callbacks melompat ke serapan baru peradapan modern async/await patterns dsb)*.
- Pengkatrolan pangkat versi perpustaan bawaan dependencies menanggung silsila noda pecah patah remuk tuntutan pembaharuan rawan mematahkan kompatibilitias *(breaking changes dependency upgrades )*.
- Penuntasan menuntut pemulasan tunggakan sisa bayaran *hutang urat teknis* perwajahan (technical debt) ganti rugi murni ke perapian kesempurnaan kemilau keanggunan gaya gubah asiteksurnya arsitektur utunnya di dandan murni *(architectural improvements)*.

### Menagih Syarat Adanya Penuntun Kompas Arah Titik Sentral Perbaikan Putusan Cekak Singkat Tugasnya Wajib Mencantol Maksud Spesfik 
- ✅ *(BENAR)* `/refactor extract storage interface in task feature`
- ✅ *(BENAR)* `/refactor split user handler into separate auth handler`
- ❌ **(KELIRU FATAL)** `/refactor apps/backend` - (terlalu luas menyapu kabur bias tak mendulang kepelikan meragu apa maksudnya persisnya target letaknya, diharamkan mutak mutlak menyuruh ini langsung murni terbelah rupa di hadapan luas meradang — jilati dulu selami pahami rilis lewat penyisihan di tancapan awalan gelar persidangan silsilah `/audit` di tahap ini lebih elok duluan ditempuh)

### Rute Fase Putaran Rutenya
1. **Pendugaan Lapor Analisis Pukulan Hawa Letupan Serapan Guncangan Rombak Dampaknya (Impact Analysis)** — Bentang bentangkan sapuan peta tebar pancing buang meramal jangkauan sejauh apanya guncangan *blast radius* peluruhan tatanan meretas tatanan rentet letaknya sejauh batas perbatasan apa di sekitarnya menganga hancur merusaknya wujud fungsional watak perawakan aslinya (documenting behavior meramu takaran kemungkinan runtuhnya sisanya mengidentifikaasi keamaman risks).
2. **Kucuran Ketukan Sedikit Perubahan Menjulur Lambat Murni Berlapis Lumat Serap TDD Bertahap Pukulan Terukur Pelan (*Incremental Change via TDD*)** — Memenggal menancap sepenggal demi sepenggal sekrup ubah tatanan satu tahap persatu ubahan gurat seirama rentet satu siklus (one change at a time), wajib lulus disuguhi rentung sukses lurus tak menyisakan luluhlantak deret ujian pengujian penjamin tancapan pas tiada hancur tests pass utuh menempel di masing letusan keping serpih rombak bergesernya at each step.
3. **Penyisiran Mengamini Ketegakan Kemampuan Terjamin Kesejejakan Pengamanan Uji Serapnya (*Parity Verification*)** — Menggiling disidang validasi penuh menyapu tanpa melumpuhkan membanding lunas menjamin merentalkan persentase pilar target batas penutupan ujian tameng serbuan pengujian batas lapor tumpu *coverage limits* tumpuan jangkau rentet penutupan jasad areanya (harus tak ciut luntur terperosok mundur, wajjib sekuat perisai keutuhann angkanya tetap semampan sedari nilai masa lampau atau dianjurkan melaju merata melebihinya bertambah mulia hebat).
4. **Pelepasan Tutupan Lepas (Ship)** — Komit diserah bungkus dengan sapa rupa murni pelabelan gelar pangkat komit sebutan `refactor`.

### Nalar Prinsip Tertinggi Penunggang Kendalinya (Key Principle) 
Tak dihalalkan Mutan Hukurmnya selamanya membikin mematikan lumpuh ambruk silsilah bangunan murni rancang keruntuhan terapan cacat menyakitinya kemampuannya merajut silsilah rintis pengerahan kompilasi utuhnya *(Never break the build)* membredel remuk lebih tumpu melintangi menjangkau merombak bertabrak serempak bersama menjangkasi di atas takaran batas satu lompat tahapan bongkahan serempak memutus melangkai rupa meroboh merengkuh mematah serempak bersamanya dalam waktu sekali tampar melebehi 1 pilar tahap silsilah memutar (*for more than one step at a time*).

---

## 🔧 Workflow Rupa Persidangan Lapor Telik Sidak Uji Cacat (Audit Workflow: `/audit`)

**File:** `.agent/workflows/audit.md`

Menelanjangi menginspeksi menelusuri memata-matai keruntuhan tatanan kadar letak bobot mutu timbangan kemulian koding gubahan lamnya yang telah bernaung pilar waris lama tanpa ada hajat pesanan urusan perwujudan kelahiran mencetak satupun bentuk tulisan perwujudan koding pembuatan fungsionalisas layanan Fitur meraba terapan koding Baru. Menelorkan membentang keping melipat lembaran tumpuk laporn berseragam surat tertulis rinician menjejer temuan penyimpangan diwujudkan di depan rupa pedoman bekal turunan susul perlakuan obat bedah siasat tancapan memandu penyelesain penyekusian di wujud seruan terusan pengangkatan ke aliran silsilah bedah obati menanggalkan sisa noda pemangkasan kutu *fix workflows* menawarnya.

### Kapan Diperlukan
- Menimang mencederai menguji melapor silang rupa menakar timbangan bobot koding rakit karya dari gubah bentukan usul penyerahan *agen kecerdasan sejawat asing rupa lain tangannya* usai dilebur masuk dicomitkan persediaanya masuk (lintas silang peninjauan meraba murni agen cross-agent review saling lurus bersilangan sapa membedah)
- Melintas sidik menyidak berondong merazia secara giliran berkala merutinkan berkala luku waktu berkala gerbang uji sidak pengawas jaminan kualiatasi *(Periodic quality gates)*. 
- Detik menit menjelang serahan lemparan luncuran rilis terbang mendulang udara manggung lepas terunggah serempak tayang mutlak *(Before releases or deployments).*
- Menyahihkan menggaransi menyemat stempel pemeriksaan aman terkendali mutlak pengujian garansi kemulyaan *(Verification without new code).*

### Fase Alirannya (Phases)
1. **Peninjauan Cacat Kode Menyentuh Sifat Cacat Memandu Perkara Menggali Mutu Peringkat (Code Review)** — Menggelepar merapal mamacu panggilan keanggunan keajaiban pelancaran Keahlian Rupa Sidang Pemeriksaan Murni Kode Pengeritik Sampa Code Review Skill untuk dipentaskan mengeksekusi sasar bantai penelisikan menggali cermat tumpuan menyasar meruncing membidik pada perlakuan penusukan pilar kumpulan berkas files tertentu yang ditunjuk diciduk spesifik terarah (*specified files*).
2. **Pengesahan Otomatis Persidangan Linter Murni Swadaya Evaluasi Menjatuhkan Uji Lulus Otomtatis Swakarsa (Automated Verification)** — Tembakan sidik gilas gulung meremas mengoper pemeriksaan seluruh wujud rupa kelayakan linter/test/build validation saringan pelacak kejanggalan sengketa putarnya.
3. **Dokumen Tuang Risalah Pundi Lembar Peninggalan Penuntun Temuan Kejanggalannya Laporan Cermatan Pemeriksaan Cacat Noda Wujud Temuannya Laporan Sisi (Findings Report)** — Dijajarkan mengakar didiamkan mapan melingkar menghuni wadah pangeraman bilik sisa pusara *`docs/audits/review-findings-{feature}-{date}-{HHmm}.md`*

### Memilah Menyortir Mengoper Penanganan Lanjutan Serapan Lapor Hasil Sidak Maut Kelak Tangkapan Sergap Panggil Penanganan (Findings Triage Menempat Penanggulangan Cacat)
| Rupa Kejanggalan Kadar Cacat Luka Temuannya | Misalan Umpama Teladannya | Jejak Perlawanan Menanggulangi Terapi Pukul Kencang Merespon Lapor Penaganan |
| ------------------ | ------------------------------ | ----------------------------------- |
| Kosmetik Estetika Meramu Remah Kusam Permukaan / Kelas Teringan Terjangkau Nit / Minor        | "Sebaiknya Rupa sebutan embel 'x' diubah namanya agar kentara merupa `userCount`"    | Segera panggil eksekusi di sela tempayan itu jua sikat lumat tambal membetuli perubahannnya (Fix directly tanpa mendirikan babak baru) |
| Semburat Letupan Noda Gurem Mungil Tersudut Kecil Menganga Isolasi Tunggal / Small isolated fix | "Haramnya tiada jaring pembatas pengecek gawang tameng Validasi asupan Input di gerbang itu"         | Pekik raungan pamungkas pecutan sakti `/quick-fix` menyinggung memandu serapan obrolan tumpun wujud jasad jendela kamar *sesi percakapan sengketa penyidikan pengisian halaman pembincangan sesi perbincangan mutlak yang dipisahkan baru murni suci* menyelesaiakan menjahitnya in new conversation |
| Patah Bingkai Silsilah Tulang Tata Penopang Miring Kritis Rangkaian Letak Tulang Structural change  | "Dosa Jauhnya Wadah penderas penyimpan bungkusan tumpuan pelindung Storage jeroannya ditelanjangi lompong dipamerkan tak ditutupi dihelat di balik topeng celah dinding wajah antarmuka perisai perantara interface." | Gaungkan panggil dekte pitar pemecut rupa pilar kemudi serapan gilas seruan `/refactor` menyibak menugasi mencentang menyebar urus bedak menelusuri penanganan terasing di sengketa rilis *obrolan lembar dialog agen anyar in new conversation*     |
| Lubang Kosong Absen Melompong Menganga Hilang Peran Penting Rupa Wujud Lompong Absen Menyalahi Kehilngana Lompongan Absen Kewajiban Kemampuan Kehilangan Rupa Keharaman Bolong Kosong Peranti Kemampuan Murni Kehilangan Kapasitas Perang/ Missing capability | "Kengerian Terang Nyatanya Tiadanya Palang Gembok Penanya Penyisiran Pemeriksaan Pemeriksa Karcis Periksa Ktp Izin Melangkahi Auth menapaki jejak Rute sakral perlintasan Kamar Kuasa para Admin routes!"      | Genderang dipukul gertakan tancap pelaksana rupa pengasuhan pembimbing pamungkas arsitektural utuhnya mutlak pecut pengasuhan pembina rupa seruan orkestratrator mandor `/orchestrator` mutlak wajib di tancaran silsilah pendekte lembaran memutar roda usulan percakapan mesin lembar kosong baru lumat in new conversation |

### Pamungkas Saran Puncak Wejangan Kemanjuran Keampuhan Berkah Mujarab Anjuran Tertinggi (Best Practice)
Jalankan gertak sidang sapuan rilis sapuan serbuan putusan sidang Audit di dalam wahana tempayan wujud **Hamparan Sesi Obrolan Agen Mesin Terpisah Murni Suci Tanpa Tersusupi Sisa Mengaburkan Kesadaran Pikiran Pihak Yang Mengerjakan Asli (*fresh conversation*)** (larang menumpang menyerupai melontar rupa putus menggabungkan pengadilan cacat pelaporan meminjam di lembaran di mana tangan sang agen pengerjannya tsb bersarang melepaskan wujud penulisan ketikkan memoles kode sumber jasad itu sedari aslinya (*not the one that wrote the code*), guna menentramkan menakrutkan membebaskan kembalikan menawar memangkulkan perbiasan kecacatan persidangan pemikiran lurus serbak wujud kerancuan menawar sangkalan pemihakan miring sengketa keradangan menyusung pemihak asul sengketa batin putusnya penyanggahan pemihakan tebal sebelah *confirmation bias*.
