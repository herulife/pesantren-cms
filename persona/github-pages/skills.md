---
layout: default
title: Referensi Khusus
nav_order: 4
---

# Referensi Keahlian (Skills Reference)
{: .no_toc }

Ketujuh keahlian spesifik yang memperluas fungsionalitas agen AI Anda.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Memahami Keahlian (Skills)

Keahlian adalah direktori di dalam `.agent/skills/` yang menyediakan panduan spesifik untuk tugas-tugas terapan. Setiap keahlian memiliki file `SKILL.md` yang memuat frontmatter YAML serta pedoman konkrit. Keahlian yang lebih kompleks dapat memiliki file pendukung tambahan di perpustakaan foldernya seperti `scripts`, `examples`, dan `resources`.

Keahlian bersifat **prosedural** — ia menuntun agen AI melangkah secara bertahap dalam sebuah *proses kerja*, berbeda dengan aturan (rules) yang cenderung berisi batasan.

---

## Protokol Debugging (Debugging Protocol)

**File:** `.agent/skills/debugging-protocol/SKILL.md`

Sebuah metode struktural untuk menganalisis akar masalah bug kode. Agen didikte untuk membuat hipotesis dan menguji dugaan sebelum menulis perbaikan.

### Kapan Diperlukan
- Menemukan bug kompleks dengan letak kesalahan yang buram
- Menangani *flaky tests* (hasil pengujian yang berubah-ubah)
- Identifikasi perilaku sistem yang tidak dikenali
- Saat tindakan `/quick-fix` gagal mengatasi masalah

### Cara Kerjanya
1. Analisis titik masalah (symptoms)
2. Bentuk daftar hipotesis tentang posisi masalah
3. Buat modul tes untuk masing-masing hipotesis
4. Eksekusi file tes, catat temuan log nya
5. Verifikasi di mana letak akar masalah baru kemudian kerjakan perbaikan kode utamanya.

---

## Desain Frontend (Frontend Design)

**File:** `.agent/skills/frontend-design/SKILL.md`

Pedoman pembuatan antarmuka pengguna web responsif (User Interface) berstandar layak rilis (production-grade), disadur dari [Anthropic's Frontend-Design Skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design).

### Kapan Diperlukan
- Pembuatan *landing page* situs
- Perancangan arsitektur dasbor (dashboard)
- Modifikasi atau merapikan gaya (styling) komponen antarmuka
- Proyek spesifik frontend yang membutuhkan ketelitian estetika tinggi.

### Prinsip Fundamental
- **Design Thinking** — pahami sasaran pengguna UI, peruntukan antarmuka, dan limitasi teknis platform
- **Tipografi** — gunakan jenis teks modern dengan kontras dan hierarki bacaan tinggi 
- **Palet Warna Sentris** — implementasi warna kohesif yang fungsional
- **Animasi Mikro** — beri sentuhan efek transisi pergerakan antarmuka yang lembut
- **Responsivitas Murni** — adopsi sistem grid melar bersandar prinsip "pembangunan awal berbasis lebar layar handphone" (mobile-first).

---

## Desain Mobile (Mobile Design)

**File:** `.agent/skills/mobile-design/SKILL.md`

Pedoman penyusunan elemen perwajahan aplikasi layar gawai (mobile interfaces) spesifik untuk ekosistem koding standar rilis (production-grade) menggunakan framework Flutter maupun React Native.

### Kapan Diperlukan
- Menyusun layar penuh gawai atau serpihan modul elemen interaktif (*widgets*)
- Mengatur gaya tampilan seluler antarmuka desain aplikasi
- Mengeksekusi rancangan bahasa kode Flutter dan React Native

### Prinsip Fundamental
- **Standar Aturan Ekosistem Bawaan** — adopsi desain UI secara hati-hati; pedoman standar *Cupertino* untuk pasar seluler iOS harus dipisah tegas dari gaya bahasa rupa antar muka *Material 3* milik sistem tata rupa desain Android
- **Responsivitas Tipografi Huruf Layar** — atur jarak spasi tinggi badan ukuran pembatas jenis font dasar (`16px+`), dukung setelan pengaturan rentang besaran opsi sistem (*dynamic type*) bawaan dari menu setelan sistem operasi pemakai gawai
- **Tema Gelap/Terang (Light & Dark Themes)** — wajib mendesain warna dua kutub
- **Navigasi Searah Titik Ibu Jari Tangan** — penjarakan letak konsentrasi pemantik navigasi dan tumpuan komponen antarmuka harus diletakkan dalam zona sasar ibu jari bawah gawai (hanya menempati 60% irisan layar dasar terbawah).
- **Performa Ringan (Performance)** — Penguatan pelekatan pemanggilan deklarasi variabel komponen bawaan statis melalui pendirian sebutan konstanta `const`, penerapan pemanggilan muat panjang deret pengulangan pintar antrean struktur tumpukan berbalut silsilah relasi daftar (*ListView.builder*), dan perihal perlakuan menyimpan foto layar gambar (cached images).

---

## Pemikiran Sekuensial (Sequential Thinking)

**File:** `.agent/skills/sequential-thinking/SKILL.md`

Sistem kecerdasan bertahap siklis iteratif adaptif merunut alur berpikir sistematis (iterative thought chains) disalurkan dari protokol pilar ekstensi [Sequential Thinking MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking).

### Kapan Diperlukan
- Analisis tumpukan fungsional rumit terstruktur hierarki bertahap banyak jajaran jenjang penyelesaian (Multi-step analysis).
- Menguraikan simpul kebuntuan sistem logika rintasan panjang yang mensyaratkan mekanisme perubahan rute pikir maju/mundur (backtracking)
- Seruan penggagalan pengubujian kesahihan tumpuan persidangan menakar hipotesa uji (Hypothesis verification)
- Batas cakupan bentang akhir sasaran penyelesaian sangat abstrak

### Cara Kerjanya
Agen sistem koding akan membongkar bongkahan tumpukan koding murni secara serial (*sequential thoughts*) dan pada gilirannya sang agen memiliki kewenangan penuh mengatur tata pola langkah:
- Mentelaah dan membatalkan serpihan tumpu simpulan dari tahapan hasil berpikir langkah sebelumnya jika ditemui sengketa
- Menukar haluan menyabang pendekatan metode analisis pada langkah solusi paralel
- Terus menyimpan warta keterangan status pengenalan (context) pada memori raga otak sekuensial yang merentang sepanjang panjangnya gerbong barisan logikanya terurai murni bertalian tuntas.

---

## Tinjauan Mutu Kode (Code Review)

**File:** `.agent/skills/code-review/SKILL.md`

Protokol khusus standar penggeledahan penyisiran inspeksi kualitas tingkat skrip terapan spesifik kriteria murni wujud kumpulan kerangka wewenang arsitektur tumpuan naungan Awesome AGV murni seutuhnya. Ia secara tajam menjangkau wilayah penemuan ketidakpatuhan terapan struktur abstraksi murni rupa pemodelan fondasi yang tidak mungkin terdeteksi saringan alat pemeriksaan otomatis koding biasa *(linters)*, meliput: kelemahan arsitektur, kelupaan menanam detektor riwayat pencatatan pantau, sengketa kemurnian pemrosesan kalkulasi sentral logika program, kemelencengan penulisan idiom keseragaman bentuk polanya.

### Kapan Diperlukan
- Bersinggungan lekat murni menunggangi pengerahan tahapan siklus pertama (*Phase 1*) roda operasi gerbong Alur `/audit`
- Ketika menerima permintaan spesifik dari manusia buat menyisir tumpuan koding murni di luar jam dan alur pengerahan mutlak perintah utuh
- **Kiat Optimal (Best practice):** Mulailah gelar penyisiran menakar kualitas koding koding pada bentangan sesi ruang percakapan kosong jendela obrolan baru gres yang terputus seutuhnya bebas peninggalan sisa kerja lampau menghindarkan efek amnesia peninggalan sisa tebak dugaan (hindari *confirmation bias*).

### Hierarki Skala Pemeringkatan Kelas Isu/Bugs

| Kasta Skala Timbang Bobot Penilaian (Priority) | Kelompok Lahan Jenis Kecacatan Isu (Category) | Identifikasi Bukti Nyata |
| ------------ | -------------------------------------------------------- | -------------------------------------------------- |
| **Kritis Sempurna (Critical)** | Penjagaan Ancaman Dinding Serangan (Security), Kebebasan Relasi Kemusnahan Cacat Relasi Ceceran Kelumpuhan Akses (Data Loss), Kesedotan Ketimpangan Bocor Maut Pemborosan Akses Muatan Tarikan Beban Jeroan Murni (Resource Leaks) | Kerawanan injeksi siluman asing tak kasat, pengetikan kalung kata pusaka rahasia dompet tak ditutupi rapi membongkar tak tersembunyi merangsek polos ke ranah murni naskah tanpa dipayungi topeng tameng *hardcoded secrets*, pengabaian pelepasan rupa relasi pengunci gerbang gembok pintu koneksi keping saluran tertinggal terus nyala terbuka liar (unclosed connections) |
| **Genting Tajam (Major)** | Hak Cacat Kebintangan Teropong Intip Pelacak Murni (*Observability*), Sengketa Perang Jeda Meredam Penanganan Terbelit Kejatuhan Runtuh Menangani Gagal Pemeliharaan (Error Handling), Fondasi Rakit Susun Gelar Pondasi Dasar Arsitektur Arsitektur Tata Tumpuk Pilar Dasar Tata Penempatan Dinding Abstraksi Pondasinya (Architecture) | Berdosa penyingkiran celah wujud penghampaan tatanan mutlak tiang penengah abstrak penghambat muka panggil *interfaces*, kelalaian ketiadaan pendirian mutlak lumbung pemantau tak dipasang rupa tata pencatat penanda panggil telik alat pengawasan kamera riwayat *logging*, terlewat tak bersiaga menjatah pilar selimut jerat pilar tumpuan wujud meredam sanggah eror gagal nyatanya *empty catch blocks* lompong rupa tak tertuang langkah mengosongkannya. |
| **Ringan Minor (Minor)** | Kesepadanan Turutan Kembar Peniru Merawat Warisan Konsistensi Jejak Lama Peninggalannya (Pattern Consistency), Pangkat Corak Semat Penyertaan Tatak Kelola Gelar Tabel Identitas Pengenalan Nama Rupa Wujud Coret Parameter Nama Fungsi Rupa Penamaan (Naming). | Penyelewangan penyimpangan menembus palang membangkang waris corak kelaziman perwatakan idiom koding penata purba lamanya peninggalan sisa jaman tatanan proyek bersangkutan berlawanan memunggungi warisan *codebase patterns*, penamaan wujud bingkai rupa pemberian rupa nama pelabelan tak bersuara buram terjerat rupa membingungkan tak lurus maknanya (unclear names). |
| **Tingkatan Nit (Polesan Estetika)** | Tata Semat Seni Gores Bumbu Rupa Corakan Bentuk Coret Ketik Tampilan (Style), Pangkat Penyertaan Pelengkap Tata Bingkis Pengenalan Keterangan Titip Selip Narasi Penjelasan Keterangan (Documentation) | Merias wujud bingkai pengetikan tak teratur lurus Format sapu bentang tak mematuhi estetika format tatanan potong baris *formatting*, serabut kelalaian alpa lompong pemutaran menafikan penjelasan tak ditambahkan pandu rupa narasi pelingkap bingkai nama pemandu *missing comments* .

### Pita Penanda Kepangkatan Cap Klasifikasi Rambu Isu Maut/Teguran Cacat (Severity Tags)

| Sandi Label | Sasaran Terapan Peruntukan Kelas Ruang Batasan (Category) |
| -------- | ------------------- |
| `[SEC]` | Perisai Kewaspadaan Tatanan Wujud Karantina Penyaring Celah (Security) |
| `[DATA]` | Keutuhan Perawan Merengkuh Bersih Keras Murni Perlindungan Kemurnian Data (Data integrity) |
| `[RES]` | Pelunturan Pembocoran Melubernya Pelumas Peras Tenaga Listrik Ketahanan Pundi Simpan Sumber Nyawa Bekatan Memori Daya Daya Lari Lapis (Resource leak) |
| `[TEST]` | Kewajiban Kesanggupan Ketekunan Rela Ditumbuk Rupa Keterjaminan Siaga Disiksa Siksaan Tumbuk Diuji Sidang Lapis Lintas Jaminan Kinerja (Testability) |
| `[OBS]` | Pertalian Pelita Penglihatan Penyambung Perhatian Alat Rekam Telik Pelacak Alat Rekaman Mesin Pandu Membuka Pemantauan Riwayat Sorot Rekab Sorot (Observability) |
| `[ERR]` | Jeratan Tali Tumpu Sengketa Membelit Pertolongan Merangkul Laju Mengelola Penanganan Jatuh Nyatanya Error handling |
| `[ARCH]` | Panduan Bingkai Titian Susun Pasak Pemutus Murni Abstraksi Perancang Wujud Corak Tiang Pondasinya Architecture |
| `[PAT]` | Kedisiplinan Ketaat-asasan Pemutusan Pengekalan Kepatuhan Ketentuan Ketetapan Terusan Turunan Menuruti Keputusan Leluhur Pemutus Pelestarian Kemiripan Tradisi (Pattern consistency) |

---

## Guardrails (Pagar Pembatas Kepatuhan Terpasang)

**File:** `.agent/skills/guardrails/SKILL.md`

Daftar formulir periksa penanda keharusan saklak menderu wajib genap terpenuhi di dua lintasan palang titik genting: pra-landas memulai goresan barisan skrip tumpuan *(Pre-flight checklist)* berikut tuntunan wujud protokol peninjauan mutlak intropeksi penggeledahan ulang swadaya kaitan evaluasi internal pengkaji kerja jari memetik serapan tumpuan naskahnya *(post-implementation self-review protocol)*. Berfungsi membongkar membentang menciduk bibit kejahilan ancaman kecacatan wujud tak nampak tak terdeteksi oleh kaitan deteksi lint.

### Kapan Diperlukan
- **Evaluasi Dini (Pre-Flight):** Persis detik kala jemari kawan barusan bersiap berposisi memantik deret tombol huruf membidani menyusun gubahan gurat coret perdananya menulis menyalin pilar penyusunan tahapan skrip Fase 2 Pelaksanaan kerja awal implement.
- **Tinjauan Pembuktian Diri (Self-Review):** Tepat kala detik menitisnya merengkuh pengetikan putus usai tuntas ganti jeda layar di penghujung ekor serapan tumpuan ujung penyempurnaan di titik buncit buntut fase kelar Pelaksanaan Fase Ke-2 usainya rilisnya usal selesai tertuangnya rampung namun serapan penyelesaian belum ditambatkannyata ke lintasi pintu penjagaan gerbang pemutus sidang peradilan linter Verifikasi.

### Daftar Tilik Kesiagaan Pra-Mulai Pre-Flight Checklist
Sebelum mengeksekusi penciptaan murni kode penugasan apa pun:
- [ ] Menelaah telik mengenali mengepung menjala membaca menumpuk menjeruji menangkap pelupasan meraba menyimpulkan keliling seluruh payung selip peraturan pilar pegangan tatanannya dengan teguh. 
- [ ] Tersusupi jejak melongok corak warisan peninggalan pusaka gaya koding koding cetakan cetak biru keaslian langgam lamanya membesut (*Pattern Discovery Protocol*)
- [ ] Memeriksa sinkronisasi kepatuhan mengafirmasi kedudukan letak keselarasan rute penyimpan pangkas laci folder peruntukan keseragaman arsitektur wadah tumpu silsilah tatanannya *project structure* 
- [ ] Menggaris bawahi mematok ranjau melacak titik pembatas dinding sentuhan perputaran selipan pengawas persinggahan ghaib lapis pembuat sekat celah antarmuka penjaga jalinan tumpuan pengikatan muatan panggil serak rupa pembungkusan batasan ghaib di perbatasan palung *I/O boundaries*
- [ ] Mendedah Menentukan Menjanjikan strategi wujud kemurnian serapan corak sasaran balapan skenario skema perlapisan tingkat keparahan rupa pembuktian panggung wujud serbuan perangkaian strategi uji tempurnya pelengkap *unit/integration/E2E test strategy*
- [ ] Menilik menerawang kemungkinan celah sengketa kemelud maut tabrakan konflik di antara kubu kubu pengawal peraturan dengan melirik rambu prioritas hakim putus penguasa hirarki *rule-priority* buat menengarai pertikaian kubu.

### Peninjauan Ulang Mandiri Pasca-Implementasi (Self-Review Pasca Karya Gubah Koding Terpancang)
Usai jari menyelesaikan tugas ketikan pencetak kode:
- **Ketahanan Tempur (Security)** — sunyi tuntas nihilnya tak tertinggal wujud pakunya jasad rahasia tumpuan tulisan menyayat celah hardcoded secrets; mutlaknya dijaminkan lolos merangkai menyulam uji gempuran saringan nilai titipan perbekalan bungkus parameter berbingkai tumpu berbatas pengamanan terpasang parameterized queries penyatu basis datanya.
- **Kesiapan Digempur Uji Lapis Ketelitian Ganda (Testability)** — Segitiga palungan bungkus panggil koneksi lari antarmuka luar I/O tuntas tertutup bernaung berteduh tertutup berlindung berkat selimut pemisah penengah celah gaib abstraksi lurus interfaces; menyisir membebaskan menyisihkan peras pemompa hitung kemurnian pilar kalkulasi murni berteman kesucian penalaran rute kemurnian tumpu jeroan terbebas menyendiri jernih dari sentuhan celaka maut wujud racun siluman hantaman side effects merusaknya menyentuhnya *pure business logic*; tersorongnya kemurahan pemutusan menyuapi penyediaan serahan letusan injeksi di luar celah injeksi memisah dependencies panggil kaitan bersarang asing ter-injeksi.
- **Pelita Sinar Pancar Cctv Terpasang Murni (Observability)** — Mengerahkan paku penancap lapor rekaman menancap bersarang memaku gawang persinggahan memandu mula pengusung pengawalan rute pintu utamanya berkibar tancap pemandu mula merekam start success failure memaku tiang start tancap utamanya operation entry points dipakukan; format barisan kelola kemasan log rupa berkumpul dibubuhkan dengan rupa format paten tak gupuh terstruktur wujud bingkai menyatukan penyamarataan kustom sakti berstruktur utuh merata di sekujur nafas program structured logging.
- **Lamat lamat Celah Meredam Kekuatan Error Gagal (Error Handling)** — Menyediakan lorong rute pelarian terpasang di rute jelas penuntun kearah kepulangan jalan tumpuan penyadaran keluar selamat kembali menelusuri penanganan seragam terpandu logis terang di sela belukar explicit error paths; penyertaan jalinan selimut rangkalan kelengkapan pembungkus kronologis pada penanggalan sengketa riwayat pesan eror lapor kegagalan sengketa diringkus komplit dititip terpasangkan tersimpul lekat dirincikan menaut memegang erat rentet context in errors; menjaring sisa menyita maut kelancangan serakan rupa sisa hisapan kotor ampas wujud tarikan gila pilar sumber tarikan listrik serapan resources dibereskan meluruh tumpas dibersihkan di sela penghujungnya lunas tumpas lenyap.
- **Pengujian Garansi Lulus Sidak (Testing)** — Rute jaya aman mulus beriring menderu selamat jalan surga rupa lurus tumpu kelulusan bahagia *happy path*, meramu setidaknya melipatgandakan ganda ujian kejam diuji siksa dua skenario lebih mengamuk berdentam sengketa uji tanggap error gila hancurkan *2+ error paths*, mencakup lilitan sudut curam melukis silih aneh tepi pelintir ekstrim merupa pelintasi tepian luarnya pilar melesat rintangan serdadu maut gila berputar tepian selip ganjil serapan uji tikungan pilar selinting tak kasatmata celah terjal *edge cases*.
- **Konsistensi Keharmonisan Membaur Ketepatan Patuh Murni Corak Gaya (Consistency)** — menyerupai kepatuhan langgam corak menyamai kemiripan corak langgam kebiasan wujud corak tatanan waris gaya tulisan tumpuan irisan perawakan naskah lama kawan sedarah sedapur senegara wujud proyek leluhur aslinya menyamai di takar `>80%`, patuh merunduk bersila setia merujuk pakem seragam corak rupa kebiasan tata eja pemberian label sapa sebut pengenalan wujud pemberian penamaan rupa gelar penama naming conventions.

---

## Rekam Catatan Peninggalan Ukiran Bersejarah Putusan Rancang Bangun Tata Letak Jeroan Arsitektur Besar (ADR)

**File:** `.agent/skills/adr/SKILL.md`

Wahana membukuli merekam mendokumentasikan gurat merupa pencatatan rupa sengketa pemicuan putusan gila banting setir tajam bersilang penentuan tatanan rancangan kemudi pilar bingkai keputusan letak corak mutlak tata desain arsitektural proyek sehingga pencahayaan wawasan kebijaksanaan dan pertimbangan luhurnya tak menguap fana belaka bersamaan bergugurannya ganti hilangnya anggota pekerja staf kemudi proyek murni atau di jeda matinya pelita kenangan obrolan jendela perbincanngana sesaat (institutional knowledge persists across conversations and team members). Surat jepret lembaran ADRs ini melestarikan menguraikan panjang lamat alasan "mengapanya / why", murni tak secuilpun sebatas menyanjung menyebut luasan luaran gurat corak rintik "apanya yang dibikin / what".

### Kapan Diperlukan
- Di tengah sengketa perdebatan pelik berlama mendiam di dalam naungan Fase Riset saat harus menetapkan melontar kepastian letak menjatuhkan gurat palu kepastian dari simpangan opsi gurat penentuan menyusun perancangan membedah arah opsi meragu tumpu memilih pendekatan menyiasat choosing between approaches
- Detik detik sakral harus membantai mengeksekusi menetapkan tatanan rupa pemutusan penawaran mumpuni 2 wujud pelita opsi meramu jalan usul tawaran cemerlang sama wibawanya viable approaches
- Mengemas membajak menyimpulkan mengadobsi galian pungut adopsi penculikan meminang mengasuh persembahan pengikutsertaan tatanan luar murni asing wujud pertalian tumpu pendatang komponen pinjam pelengkap mesin dependency yang perawan anyar gres, tak menapikannya seraya menyambut melongok adopsi pertalian meresmikkan pelembagaan pembuka rupa pakam kebarisan tradisi gurat gaya penulisan langgam tumpuan rupa desain gaya menyusun rancang bangun anyar mewujud menatah pattern corakan yang rilis baru menengadah diperkenal menyusup.
- Sesaat menyungkuli mendlontari menggusur membredel mencabut membongkar membanting arsitektur mapan corak lamanya menertib mengubah rupa warisan turun arsitektur changing existing architecture

### Bentuk Kotak Rongga Pakem Wujud Cetakan Pengisian Susun Tata Aturan ADR Template

Setiap surat ADR disimpan menyempil di rute letak tatanan laci berkumpul tumpuk berarsip kumpul jejer lipatan `docs/decisions/NNNN-judul-ringkas.md` dengan menuntut kelengkapan kolom wujud paksa tertuang:

1. **Jepretan Konteks (Context)** — membabar mendedah mengoyak menjabarkan melukis merintakan mengaburkan apa maut keruwetan hantaman apa masalah sengkerut apa yang sungguh dipaksa dipatah dibentur diperangi dituntasi?
2. **Katalog Penawaran Opsi Pembedah Tanding Opsi Opsi Dilahirkan Menyertai Tanding Tawaran Opsi Opsi Tersingkap Tawaran Menyertai Persidangan Timbang Cermat Melerainya Menyanding Menimangnya Membahas Serapan Tawaraan Pengganti Dilahirkan Ulas Tawaran Terlibat Membahas Tawaran Tumpuan (Options Considered)** — deretan calon resep pendatang penyembuhan serapan wujud pilar obat (dilengkapi kupasan rincian pisau pelita keunggulan penunjang berkah kelebihan *pros*, borok letupan bom tusuk duri ancaman ancaman derita rupa tumpu kelemahan tangis rintih duka bayangnya *cons*, serta tuntutan kerokan gerusan keringat tetes tangis penyerahan nafas lari kencang dana wujud bayaran rupa kaji beratnya mengungkus pikul beban tarikan muat tumpu *effort*)
3. **Palu Pemutus Ikatan Titah Nasib Pilihan Tumpu Putusan Kepastian Mengikrarkan Pemenangnya Jatuh Mutlak Pada Putusan Pemutusan Ikral (Decision)** — titah mendaulat menyerahkan menjatuhkan menengadak rupa pedang menyemat peraih gelar putusan tahta lumat mana opsi tumpuan yang sukses dibaptis dimuliakan dijura disahkannya dimuliakan which option was chosen bergandeng urut alasan rentet pertimbangan argumen pijakan pendukung pengangkatan memahat keputasannya rupa and why 
4. **Tuaian Hawa Pembuntutan Kesudahan Getaran Serdadu Maut Bentur Gelombang Imbasan Tumpu Imbas Hawa Imbas Terpukul Turunan Belakangan (Consequences)** — deret tetesan hembusan embun penyegar pelita pancar berkat kebaaiikan madu penyejuk *positive*, sengatan duri derita ampas tumpu pukulan perih lara tusukan meradang hantaman duri getir noda buruk noda noda duri lecet meradang *negative*, tak meluputkan luapan peramalan wujud rintih tumpuan menduga ancaman resiko menyergap membayangi menakut bahaya ancang bayanga sengketa kemungkinan seretan daki penarik duka merongrong resiko taruhan perih rupa maut ancaman bahayanya *risks*-nya.

### Dikte Rambu Titah Tatanan (Process Rules)
- Penamaan dibubuhi kalung nomer tanda nomor urut yang merunut serah terurut rupa berderet tumpu penomoran taat rupa tumpuk kaku Number sequentially
- Haram membumi hangus mencampakan membunuh menghapus menghilangkan wujud raga menghancurkan riwayat ADRs lampau pusaka ini Never delete ADRs — membubuhkan menyematkan suntikan pelucutan purna bakti melungsur tahtakan label wujud menyingkirkannya di cap sisa lurus pangkat pengkerdil Superseded by NNNN penggantinya 
- Peredaran silang gerak statusnya memutar masa siklus masa tuanya memakan roda umurnya Status lifecycle: Membubung diimpikan dinukil dimunculkan perwujudan tawaran pengaju *Proposed* → Digandeng dipimang dikawini dicetak diberkati sah diketuk palu pelunasan rupa pengajuan sah dimuliakan dilantik rupa sah diterima mendarak mutlak dinobatkan bertatap rilis sah jaya sah disahkan rupa ditarik dimenangkannya di-ikrarkan diangkat sah dilegitimasi sah dikawini rupa *Accepted* → Rontok ditinggalkan dibiarkan disirnakan ditinggalkan menepi menyendiri merana rintih merunduk pudar purna tugas ditinggalkan dicampakan tenggelam digudangkan diam dibiarkan dilengser usang tenggelam kesepian sunyi dirobek ditinggalkan membisu Deprecated seraya tak sudi menutup wujud merobek musnah tergeser dilibas oleh penguasa terapan pendatang si pendepaknya rupa Superseded ditaruh dilengser diruntuhkan merengkuh turun mendaulat dibuang merengkuh meminggir ditinggal sepi ganti diruntuh di depak digentayangi dihuni rupa sisa diruntuhkan tahta tahtanya diturun dicalo digeser penguasa tunggal dilumatkan diruntuhkan diterkam diduduki ditalak digenggam didorong memudar dijauh ditinggalkan melarat dicalonkan dirangkul disusul rupa lengser kedudukannya.
