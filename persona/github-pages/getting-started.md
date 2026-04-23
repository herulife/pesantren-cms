---
layout: default
title: Memulai Langkah
nav_order: 2
---

# Panduan Memulai Langkah (Getting Started)
{: .no_toc }

Memasang dan menyetel kerangka tata-laku *Awesome AGV* dalam sekejap hitungan menit.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Prasyarat Utama

- Akses ke Agen Koding AI (Antigravity, Roo Code, Claude Code, Cline, dll.)
- Sebuah proyek tujuan di mana Anda mendambakan jaminan kualitas dan penerapan standar tinggi

## Instalasi Pemasangan

### Opsi 1: Menyalin Utuh direktori `.agent`

Penggandaan klon repositori secara langsung ke tanah proyek Anda:

```sh
# Unduh duplikat Klona repository-nya
git clone https://github.com/irahardianto/awesome-agv.git

# Tuangkan salinan leburkan wadah map .agent ke hamparan proyek asli Anda
cp -r awesome-agv/.agent /path/to/your-project/
```

### Opsi 2: Kaitan Git Submodule

Kaitkan ia sebagai lengan ekstensi (submodule) agar mulus di-pudate menyerap nafas pembaharuan rilis versi anyarnya kelak:

```sh
cd your-project
git submodule add https://github.com/irahardianto/awesome-agv.git .awesome-agv
ln -s .awesome-agv/.agent .agent
```

## Modifikasi Penyetelan (Configuration)

### Memasang ke Antigravity / Roo Code / Claude Code

Keluarga *tools* di atas mahir secara alami menghisap nafas petunjuk langsung di kedalaman direktori beralamat `.agent` tanpa perlu campur tangan eksternal apa-apa. Anda cukup mencelupkan bongkahan foldernya kesana lalu persilakan mesin menari.

### Memasang ke Gemini CLI

Hentak hisap kumpulan pedoman aturannya menyatu dalam gurat skrip khusus pemandu mandat (*custom system prompt context*). Anda cukup menuding alamat merujuk satu-satu kepingan aturan mandatinya.

```sh
# Bidik arah tatapan Gemini CLI fokus tertuju mendarat lurus ke sarang rak kumpul rules/
# (*Sempatkan merunut baca sekilas lembar petunjuk panduan Gemini CLI perihal teknik custom instructions)
```

### Untuk Keluarga Ekosistem Agen Koding AI Lainnya

Khusus menunggangi piranti asing tapi memiliki ruang kapling muat *custom system prompts* atau asimilasi *context loading*:

1. Serap hisap paksa segenap muatan rak `.agent/rules/` masuk lebur bercampur di sistem mandat mesin (system prompt).
2. Optional (Dianjurkan): Hisap tenggak botol serum `.agent/skills/` buat membekalinya kemampuan mematikan manuver taji keahlian teknis khusus yang spesifik 
3. Optional (Dianjurkan): Bekali setelan `.agent/workflows/` manakala berselera menebeng terbang mengikuti arahan roda peta rute jalur kereta komando pengembangan terstruktur sistemnya.

## Gelar Sidang Verifikasi Keberhasilan Instalasi

Begitu bubar diinstal, wajib jajal ukur pemastian menyoal sang Agen beneran berhasil terpancing menelan mentah aturannya:

1. Lemparkan sekadar sayap pertanyaan: *"What rules are you following?" (Aturan sakti pamungkas macam apa sajakah yang memandu napas langkah kerjamu hari ini?)*
2. Perhatikan gelagat adakah dia menyebutkan pilar sakti **Rugged Software Constitution** atau **Security Mandate** dengan fasih
3. Pancing dan suruh sekadar praktekkan menyusun serpihan kodingan buatan kecil lalu pantau tajam apakah wujudnya menjelma wujud ciri berikut:
   - Terpasang otomatisasi tembok *penyaring nilai asupan masuk* (*input validation*) yang menancap bersiaga menjaga parit-parit masuk *API handlers*
   - Tercetaknya rangkaian wujud pelacak jejak *pencatung log* (*structured logging*) siaga memandu pada gapura tiap pemantik pintu fungsi
   - Adanya gerbang tameng perbatasan I/O berwujud abstraksi rupa wadah antarmuka (*Interface-based I/O abstraction*)

## Apa Saja Kisah Kelanjutan Menjelang Berikutnya?

Sehabis tertanam subur menancap di tanah asalnya, maka keseluruhan gerbong rangkaian akan mengalir hidup (activates) merangkai gerak swa-kerja seketika:

| Komponen Pilar | Status Pemantik Aktif (Activation)| Aksi Meliuk Efek Daya (Effect)                                                                                      |
| -------------- | -------------- | ------------------------------------------------------------------------------------------- |
| **Aturan Tetap (Mandates)**   | Terpatri Hidup Mutlak Sepanjang Waktu (Always loaded)  | Agen didera wajib meralat membersihkan serpihan skripnya via validasi total, rajin tak luput menghunjam paku Logging rekaman lapor, dan patuh mutlak buta bertengger aman diteduh bingkai tata aturan pertahanan Keamanan                           |
| **Prinsip Taktis (Principles)** | Tersulut Kontekstual Sesaat Bekerja | Agen menarik turunkan aturan penanganan Database tepat disaat tangan kanannya tengah menuang lafal Kueri database. Agen membentangkan sayap protokol CI/CD manakala tangan kirinya disuruh mengubah peta selipan Pipa alir skrip rilisnya, dan begitu seterusnya. |
| **Keahlian Berpikir (Skills)**     | Ditarik On Demand Sesuai Kehausan | Agen menyergap memamah biak panduan bedah sungsang Debugging Protocol sewaktu nafasnya mogok terbentur tembok kebuntuan; melafal seraya menjilat paku penambat sakti Guardrails (Pagar pembatas) pra/pasca mencetak tuangan skrip. |
| **Pedoman Etos Alur Kerja (Workflows)**  | Dipecut Panggilan Terompet Komando perintah Slash Command | Serukan sakti peluit `/orchestrator` tatkala meniti menyusun gerak perwujudan kelahiran modul Fitur baru. Pecut panggilan `/quick-fix` saat terjegal ceceran bug merisaukan. Lepas teriakan instruksi `/audit` untuk mengeksekusi sweeping pemeriksaan mutlak hasil jepretan mutu karya buatan kode lampau.   |

{: .note }
> **Kemerdekaan Segalo-galonya Fleksibel Lepas Pasang (Modular).** Segala renteng barisan Aturan dan Keahlian bertahta di singgasananya masing-masing merdeka independen — Anda mutlak tak butuh dikte pedoman *Alur Kerja (Workflows)* melingkupinya buat sekadar mencuri menghisap memerah keberkahan nilai sarinya. Bebas merdeka pilih acak rupa aturan yang cuman berkesan mencuri hasratmu semata, susun pewayangan dalang alur menumu sendiri, atau libas buang menyingkir lupakan saja si Alur Kerjanya kesemua di pinggir aspal. Bangunan rancang arsitektur tata wujud seperangkat sarana pandu di tanah ini ibarat *set alat penunjang obeng perkakas belaka (toolkit)*, bukanlah sebentuk dinding rel paksa pemenjara langkah (*framework*).

## Perjalanan Tur Kilat Selayang Pandang

### Tenggak Jajal Merasakan Manisnya Gelaran Fitur Orkestrasi Lengkap (Feature Workflow)

Mengepal lengan mulai menghimpun bongkahan merangkai gerbong Fitur bernilain tambah bersenjata diapit kelengkapan serangkaian irama tata krama *Alur Kerja Utama (Structured workflow)*:

```
/orchestrator
```

Seketika rentetan rantai mesin raksasa pemroduksi *software* menggeliat mengikat ritme:
1. **Memahani Riset** — menghimpun menyelam mengupas cangkang luar konteks, menggali menajam menelusuri isi pundi pustaka dokumentasi sejarah
2. **Tuang Mencetak Kode (Implement)** — Memutar tuas roda mesin giling TDD (Merah Red → Hijau Green → Tata Rombak Ulang Refactor)
3. **Rekat dan Gabung Leburkan (Integrate)** — Diuji sabung gilas nyata terintegrasi langsung berpijak pada pelukan prasarana habitat infrastruktur sungguhan nyatanya kelak (Bersiasat mesin karantina Testcontainers)
4. **Sidang Pemeriksaan Totalitas (Verify)** — Diguyur disapu pel lantai lewat gilingan mesin *lint*, dibombardir serbuan amunisi skrip Test berpeluru tajam, serta disidang wujud praktek perakitan final ujinya (build validation)
5. **Kirim Bongkar Sauh Muatan Puncak (Ship)** — Mengarungi angkasa lepas via bungkusan roket kiriman *git commit* dibranding perwajahan standar *conventional format* yang menyejukkan pandang mata.

### Tebas Ringkes (Quick Fix) 

Buat tumpas meredakan tikaman sengatan perih sekawanan maut bug kelas teri berskala gurem:

```
/quick-fix
```

Menyebrak terbang melompati tahap galian riset pelik apalagi leburnya integrasi berlarut-larut, dan langsung sigap pasang aksi: Mendiagnosa Penyakit (Diagnose) → Eksekusi Pukulan Palu Tambalan Lenyapkan ditambah tes kepatuhannya (Fix + Test) → Tinjau Singkat Sahih (Verify) → Tendang Langsung Unggah (Ship).

### Sorot Lampu Inspeksi Sapu Jagad (Audit)

Bongkar gulung menggeledah memblejeti standar kecacatan rupa rahasia kualitas bongkahan tumpukan kode yang tlah berdebu menumpuk di lapak belakang sana:

```
/audit
```

Pasti memuntahkan berlembar gulungan kitab laporan hasil tembak sita temuan rincian nan rapi terstuktur (findings report), yang divonis dijatuhi bobot gelar sanksi sesuai porsi bobot dosanya berurutan (Kritis/Critical → Berat Cacat/Major → Tengil Kecil/Minor → Cuma Rupa Kulit Sepele/Nit).

## Jejak Titian Melangkah Bersambung (Next Steps)

- [**Pusat Acuan Rujukan Kitab Aturan (Rules Reference)**](/awesome-agv/rules) — Selami petualangan lautan ke-30 baris aturannya secara khusyuk
- [**Simpanan Punden Berbakti Sakti Keahlian (Skills Reference)**](/awesome-agv/skills) — Hisap waris petuah tajam mengenai serba serbi ajian kesaktian pembedahan pakar keahliannya (specialized skills)
- [**Map Jalur Peta Alur Rute Penugasan (Workflows Reference)**](/awesome-agv/workflows) — Cerna hirup dan rasapi kemudi haluan kapal di rel rel alur kerjanya
- [**Setel Merajut Kesesuaian Diri (Adapting)**](/awesome-agv/adapting) — Merapikan baju menata ukuran penyesuaian khusus demi mengayomi bentuk perawakan proyek khusus milik Anda
