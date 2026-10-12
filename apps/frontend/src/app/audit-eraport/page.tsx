import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Database, FileCheck2,
  FlaskConical, GraduationCap, Lock, RefreshCcw, Scale, ShieldCheck, XCircle,
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

type Status = 'PASS' | 'FAIL' | 'N/A';

type Item = {
  id: string;
  label: string;
  s: Status;
  why: string;
  fix?: string;
};

type Cat = { id: string; title: string; ok: number; denom: number; items: Item[] };

const CATS: Cat[] = [
  {
    id: '1',
    title: 'Logika Perhitungan Inti',
    ok: 0,
    denom: 8,
    items: [
      {
        id: '1.1',
        label: 'Gate kelengkapan rapor berbasis CACUPAN, bukan keberadaan',
        s: 'FAIL',
        why: 'computeMapel mengembalikan true bila len(details) > 0 — bukan bila semua mapel aktif punya nilai. computeProject sama: scoredAny, bukan scored==total. Diuji langsung: 1 dari 9 mapel bernilai 100, 1 dari 5 kegiatan bernilai 4.0, keempat aspek kesantrian 4.0 → IsComplete=true, FinalScore=100.00, Predikat="Sangat Baik", Status="ready". Save() menerimanya lalu mengunci. Nilai yang benar (8 mapel & 4 kegiatan = 0) adalah 33.33 "Perlu Perbaikan" — selisih 67 poin pada dokumen resmi, dengan HTTP 200 dan entri audit LOCK_RAPORT.',
        fix: 'Hitung cakupan: SELECT COUNT(*) FROM subjects WHERE is_active=1 vs COUNT(DISTINCT g.subject_id); wajib sama. Project: scored == total. Masukkan nama mapel yang belum dinilai ke Missing, dan jadikan ini prekondisi level-repo sebelum Upsert agar tidak bisa dilewati pemanggil mana pun.',
      },
      {
        id: '1.2',
        label: 'Bobot mapel (subjects.weight) terisi & tervalidasi tapi DIABAIKAN',
        s: 'FAIL',
        why: 'Kolom weight ada dan berisi (12.5 per mapel di DB), weight.ValidateWeights menegakkan total = 100, dan UpdateSubjectsWeights membalas "Bobot mapel diperbarui (total 100%)". Tapi computeMapel komentar eksplisit "tanpa bobot", SQL-nya SELECT g.subject_id, s.name, g.final_score — s.weight tidak diambil. Field SubjectScore.Weight dideklarasikan tapi tidak pernah diisi, jadi selalu 0 di JSON.',
        fix: 'Tambahkan s.weight & s.kkm ke SELECT, hitung Σ(score×weight)/Σ(weight) di atas mapel yang dinilai, isi d.Weight. Perubahan kecil — infrastrukturnya sudah lengkap, tinggal dipakai.',
      },
      {
        id: '1.3',
        label: 'Bobot sub-project (Qurani/Mandiri/Peduli) juga diabaikan',
        s: 'FAIL',
        why: 'project_subprojects.weight NOT NULL dan divalidasi total=100 (features/project/handler.go), tapi fungsi computeProjectId membagi rata sub-project secara sama (subTotal/subCount). Bobot 40/30/30 diterapkan jadi 33/33/33. project_activities.weight & project_indicators.weight tidak pernah dibaca sama sekali.',
        fix: 'Pakai bobot sub-project yang sudah ada, sama seperti 1.2.',
      },
      {
        id: '1.4',
        label: 'Bobot final rapor hardcoded /3,CalculateERaport dead code',
        s: 'FAIL',
        why: 'FinalScore = (Mapel+Project+Kesantrian)/3 di repository.go:134. Sementara weight.CalculateERaport(mapel, project, kesantrian, weights) sudah ditulis, diuji, dan mendukung bobot — tetapi TIDAK PERNAH dipanggil dari kode non-test di seluruh repo. verify: satu-satunya caller adalah engine_test.go.',
        fix: 'Panggil CalculateERaport dengan bobot yang bisa dikonfigurasi per tahun ajaran, atau hapus fungsi itu dan tuliskan niatnya dalam komentar agar tidak menyesatkan.',
      },
      {
        id: '1.5',
        label: 'Komponen yang belum dinilai dilaporkan sebagai angka 0',
        s: 'FAIL',
        why: 'Komentar di kode:j"Rata-rata biasa ketiga komponen. Komponen yang belum dinilai = kosong, bukan angka." Tapi MapelScore/ProjectScore/KesantrianScore adalah float64 polos tanpa omitempty, dan pada jalur incomplete isinya sudah berisi ANGKA NYATA (mis. 87.50) sementara FinalScore=0 dan Predikat="". Handler membalas 200 "Rapor berhasil dihitung". Di JSON, "kosong" dan "nol" tidak dapat dibedakan.',
        fix: 'Ubah tiga field komponen jadi *float64 + omitempty (nil = belum dinilai), atau balas 409/422 saat !IsComplete agar konsisten dengan Save.',
      },
      {
        id: '1.6',
        label: 'Dua skala berbeda dalam satu payload, tanpa penanda',
        s: 'FAIL',
        why: 'Kesantrian: score14 dipakai apa adanya, tapi agregatnya dikonversi (score14/4.0*100). Satu response memuat "kesantrian_score": 87.5 DAN "kesantrian_detail": {"disiplin": 3.5}. Field detail tidak membawa penanda skala. Client yang merata-ratakan detail dengan mapel_score meleset faktor 25.',
        fix: 'Kirim detail sebagai array: [{aspek, score_1_4, score_100, predikat}].',
      },
      {
        id: '1.7',
        label: 'rows.Err() tidak pernah dicek di ketiga fungsi compute',
        s: 'FAIL',
        why: 'grep "rows.Err" di seluruh features/raport = 0 hasil. Ketiga loop hanya rows.Next() lalu continue pada error Scan. Bila terjadi error di tengah iterasi, loop berhenti, len(details) > 0, dan Compute mengembalikan is_complete=true dengan rata-rata dari subset mapel yang TERPOTONG — bias ke ATAS karena mapel yang belum dinilai justru yang paling rendah. Tidak ada halaman lain di codebase yang benar (notifications/repository.go:131 sudah benar).',
        fix: 'Tambahkan if err := rows.Err(); err != nil { return 0, nil, false } di ketiga fungsi, dan kumpulkan error per-baris ke Missing alih-alih continue diam-diam.',
      },
      {
        id: '1.8',
        label: 'Tiga komponen punya tiga kebijakan kelengkapan berbeda',
        s: 'FAIL',
        why: 'Mapel: ≥1 baris nilai dari N mapel. Project: ≥1 penilaian dari M kegiatan. Kesantrian: keempat aspek WAJIB ada (CalculateKesantrianScore error bila ada yang kurang/tidak dikenal). Salah ketik satu nama aspek — "Adab dan Akhlak" lolos validasi karena handler_kes.go hanya lowercase tanpa allow-list — membuat rapor permanen tidak bisa dikunci, dengan satu-satunya pesan "Kurangnya: Nilai kesantrian". Penyebab aslinya dibuang (return 0, false) tanpa dicatat.',
        fix: 'Allow-list keempat aspek (422 kalau di luar daftar), teruskan err.Error() ke Missing, dan samakan ketiga kebijakan kelengkapan menjadi berbasis cakupan.',
      },
    ],
  },
  {
    id: '2',
    title: 'Integritas Data Rapor',
    ok: 1,
    denom: 7,
    items: [
      {
        id: '2.1',
        label: 'final_score NULL dihapus diam-diam — menaikkan rata-rata',
        s: 'FAIL',
        why: 'grades.final_score REAL DEFAULT 0, nullable, tanpa CHECK. Scan ke float64 polos gagal saat NULL, lalu continue menelan errornya — mapel itu hilang dari pembilang DAN penyebut tanpa jejak. Tiga mapel 90 + satu NULL menghasilkan MapelScore 90, bukan 67.5: kenaikan 22,5 poin senyap. Digabung 1.1, ini jalur paling berbahaya karena biasnya ke atas.',
        fix: 'Scan ke sql.NullFloat64; bila !Valid, masukkan nama mapel ke missing_subjects dan set mapelOK=false. Tambah CHECK (final_score IS NULL OR final_score BETWEEN 0 AND 100).',
      },
      {
        id: '2.2',
        label: 'academic_year — kunci join seluruh perhitungan — tak pernah divalidasi',
        s: 'FAIL',
        why: 'validateGrade memeriksa StudentID, SubjectID, UTS, UAS, Task, Semester — TIDAK ADA pemeriksaan AcademicYear. Kolomnya NOT NULL, jadi "" lolos. Sisi rapor memakai strings.TrimSpace pada query param, sisi nilai tidak mem-trim sama sekali. Tiga mode gagal senyap, semuanya 200 OK: (a) "2025/2026 " dengan spasi di akhir tidak match; (b) "2025-2026" tidak match; (c) "" tersimpan tapi tidak pernah bisa join. Akibatnya mapelOK=false selamanya, rapor tidak bisa dikunci, pesan error tidak pernah menyebut academic_year.',
        fix: 'Jadikan academic_years.name satu-satunya sumber kebenaran: wajib diisi, di-trim, dicek ada di tabel academic_years, 422 dengan daftar nama valid bila tidak. Lebih jauh: ganti key teks bebas dengan academic_year_id INTEGER FK.',
      },
      {
        id: '2.3',
        label: 'semester kesantrian disimpan tanpa normalisasi',
        s: 'FAIL',
        why: 'Semua jalur baca rapor menormalisasi semester; hanya jalur TULIS kesantrian yang tidak (handler_kes.go SetKesantrian). values.NormalizeSemester tidak dipanggil, dan repo menyimpan verbatim. Bandingkan features/project/assessments.go:71 yang benar. UI yang mengirim {"semester":"ganjil"} — hal paling wajar untuk radio berlabel "Ganjil" — akan disimpan sebagai "ganjil", sementara perhitungan selalu filter semester=\'1\'. Komponen kesantrian jadi permanen "hilang". Perbaikannya hanya berjalan saat restart lewat UPDATE di db.go:1152-1157.',
        fix: 'Panggil validators.NormalizeSemester di SetKesantrian dan GetKesantrian. Tambah CHECK (semester IN (\'1\',\'2\')) di grades, raports, kesantrian_aspek, exams, project_assessments.',
      },
      {
        id: '2.4',
        label: 'Rapor terkunci tidak immutable terhadap inputnya',
        s: 'FAIL',
        why: 'Kunci hanya Dicek terhadap baris raports (Upsert menolak overwrite). UpdateGrade/DeleteGrade tidak menyebut raports sama sekali, dan exams/repository.go:287 meng-upsert grades lalu menimpa uas_score. handler_me.go GetMine mengembalikan baris tersimpan TANPA cek status maupun kesegaran. Urutan kejadian: rapor dikunci di 82.50 "Baik" → nilai diperbaiki → rapor tetap serves 82.50 selamanya, sudah pernah diinformasikan ke wali. Tidak ada mekanisme mendeteksi divergensi.',
        fix: 'Tambah source_fingerprint (hash jumlah baris + MAX(updated_at) + MAX(id) seluruh input) dan computed_at di raports; bandingkan di GetStored, kembalikan stale:true bila beda. Tolak perubahan nilai 409 bila ada rapor locked untuk(student, semester, AY) kecuali rapor di-unlock lebih dulu.',
      },
      {
        id: '2.5',
        label: 'generated_by — kolom "siapa yang menerbitkan" — dikendalikan client',
        s: 'FAIL',
        why: 'Save memakai json.NewDecoder(r.Body).Decode(&s) atas seluruh struct StoredRaport. Skor di-overwrite server-side (bagus), tapi GeneratedBy, StudentID, Semester, AcademicYear, dan Notes semua datang dari request. auth.CurrentUserID baru dipanggil SESUDAH write, dan hanya untuk log. Artinya siapa pun yang tidak berwenang Publish bisa mengatribusikan rapor ke user id sembarang, membuat kolom audit tidak berarti untuk artefak terpenting. Ketidakkonsistenan ini jelas salah buffalo: handler yang sama JUSTRU menormalisasi Semester & AcademicYear dari payload tak tepercaya itu.',
        fix: 'Ambil uid di awal Save (401 bila kosong), set s.GeneratedBy = uid, set s.ID = 0, dan buang field lain milik client sebelum Upsert.',
      },
      {
        id: '2.6',
        label: 'Nilai skala 1-4 bisa tersimpan di kolom 0-100',
        s: 'FAIL',
        why: 'calcGrade mengasumsikan 0-100 (A≥85, E<40) dan validateGrade membatasi UTS/UAS/Tugas 0-100. Tapi project_assessments & kesantrian memakai 1-4. Tidak ada penjaga yang mencegah angka 1-4 masuk grades.final_score — dan di DB ada 3 baris seperti itu (final_score 7.3 / 5.7 / 8.0, grade_letter "E", notes "gggg"/"fff"). Bila ikut rapor, bobotnya cuma 1 dari 9 mapel dan menarik rata-rata turun.',
        fix: 'Tambah CHECK (0..100) di DB, dan di UI beri tahu skala yang diharapkan tiap field. Bersihkan 3 baris tersebut.',
      },
      {
        id: '2.7',
        label: 'Rekomputasi server saat Save mencegah manipulasi nilai',
        s: 'PASS',
        why: 'Save tidak pernah mempercayai angka dari client: res := h.repo.Compute(...) dijalankan ulang dari database, lalu menimpa MapelScore/ProjectScore/KesantrianScore/FinalScore/Predikat sebelum Upsert. Client tidak bisa mengarang nilai rapor lewat body request. Ini pola yang benar dan harus dijaga.',
      },
    ],
  },
  {
    id: '3',
    title: 'Skema & Struktur Data',
    ok: 2,
    denom: 7,
    items: [
      {
        id: '3.1',
        label: 'subjects tidak punya kolom jenjang',
        s: 'FAIL',
        why: 'Dicek lewat PRAGMA table_info di DB produksi: subjects = [id, name, category, teacher_id, created_at, weight, kkm, sort_order, is_active]. Tidak ada jenjang. Bandingkan santri.jenjang dan classes.jenjang yang keduanya ada. Konsekuensi: tidak ada cara tahu mapel mana yang seharusnya dimiliki seorang Santri — ini akar penyebab langsung 1.1. Mapel 3 tahun lalu tetap is_active=1 selamanya karena tidak ada jalur menonaktifkannya.',
        fix: 'Tambah subjects.jenjang (atau tabel subject_sets per (jenjang, tingkat)), tambah grades.class_id, dan filter computeMapel berdasarkan kelas Santri.',
      },
      {
        id: '3.2',
        label: 'Bobot tervalidasi sum=100 secara global — mustahil per jenjang',
        s: 'FAIL',
        why: 'Bobot diperlakukan sebagai satu daftar global. Weight.ValidateWeights menjumlahkan bobot seluruh subjects, dan UpdateSubjectsWeights berjalan atas semua subjects WHERE is_active=1 tanpa memanggil handler UpdateSubjectsWeightsOnce. Begitu subjects punya jenjang (3.1), bobot per jenjang jadi mustahil: SMP akan ikut menjumlahkan mapel SMA, dan operator tidak punya cara menyetel bobot yang benar untuk tiap jenjang. Padahal bobot itulah yang nanti menentukan bobot rapor (1.2).',
        fix: 'Ubah Weight menjadi map[jenjang]map[subjectID]float64, validasi per (jenjang, tingkat) sampai 100%, dan jadikan penggantian bobot per jenjang endpoint tersendiri.',
      },
      {
        id: '3.3',
        label: 'tahfidz_progress tidak punya semester / academic_year',
        s: 'PASS',
        why: 'Jilid 90 (8 Okt 2026): kolom semester + academic_year ditambahkan lewat addColumnIfNotExists di db.go, di-backfill idempoten dari evaluation_date (bulan >= Juli -> semester 1 TA y/y+1), dan Create/Update Tahfidz menurunkan periode yang sama di server (DeriveTahfidzPeriod) sehingga form frontend tidak perlu mengirim periode. Progres tahfidz kini dibaca features/raport (computeTahfidz) dan tampil di eRapor, PDF, serta portal sebagai komponen INFORMASIONAL — tidak mengubah final_score (keputusan produk 8 Okt 2026).',
      },
      {
        id: '3.4',
        label: 'validateTahfidz tidak memvalidasi start_ayat / end_ayat sama sekali',
        s: 'FAIL',
        why: 'Fungsi itu memeriksa StudentID, Juz (1-30), SurahName (!=""), Status. Field StartAyat dan EndAyat TIDAK PERNAH dirujuk. Tidak ada start_ayat > 0, tidak ada end >= start, tidak ada batas 286 ayat (Al-Baqarah), tidak ada konsistensi surah↔ayat. Baris dengan start_ayat=500, end_ayat=-5 diterima dengan 200. Surah_name juga teks bebas — tidak dicek terhadap 114 surah, tidak ada surah_id. Status kosong pun lolos karena syaratnya "t.Status != \'\'" sehingga DEFAULT \'proses\' di DB tidak pernah terpakai.',
        fix: 'Sebagian sudah ditutup (Jilid 90): validateTahfidz kini memaksa 1 <= start_ayat <= end_ayat <= 300 dan status kosong di-default "proses". Yang masih terbuka: ganti surah_name teks bebas dengan surah_id FK ke tabel referensi 114 surah, lalu validasi ayat maksimal per surah (mis. 286 untuk Al-Baqarah).',
      },
      {
        id: '3.5',
        label: 'Nilai & status punya DEFAULT di luar jangkauan yang di-enforce API',
        s: 'FAIL',
        why: 'kesantrian_aspek.score REAL NOT NULL DEFAULT 0 —tetapi API hanya menerima 1-4. Sisipan tanpa skor karena itu secara tidak sengaja menarik rata-rata dengan 0, bukan dihitung sebagai belum dinilai. raports.status DEFAULT \'draft\' tidak terjangkau: Save selalu tulis "locked", Unlock selalu tulis "ready". Tidak ada alur draft, sehingga status "belum diterbitkan" tidak dapat direpresentasikan.',
        fix: 'Jadikan kolom nullable dengan default NULL (NULL = belum dinilai), dan sediakan alur draft yang nyata bila memang dibutuhkan.',
      },
      {
        id: '3.6',
        label: 'Ledger migrasi dekoratif — semua migrasi jalan setiap boot',
        s: 'FAIL',
        why: 'runMigrations menulis ke schema_migrations tapi TIDAK PERNA membacanya untuk melewati yang sudah jalan. Satu-satunya tempat yang memeriksanya hanya di migrasi backfill (db.go:1193). Efek: (1) kerusakan semester di 2.3 hanya diperbaiki saat restart, jadi perilaku tidak deterministik antar restart; (2) statement normalisasi hanya memetakan ganjil/genap/semester 1/satu — drift lain tidak pernah diperbaiki; (3) migrasi data non-idempotent di masa depan akan diam-diam diterapkan ulang.',
        fix: 'Guard tiap entri dengan if applied(migration.name) { continue }, dan pindahkan statement normalisasi ke dataFixups() yang dijaga terpisah.',
      },
      {
        id: '3.7',
        label: 'Unique index mencegah duplikasi nilai & upsert kesantrian',
        s: 'PASS',
        why: 'idx_grades_unique pada (student_id, subject_id, semester, academic_year) mencegah nilai ganda untuk mapel yang sama. SetKesantrian memakai ON CONFLICT(student_id, aspek, semester, academic_year) DO UPDATE, jadi penilaian ulang aman dan idempoten. Keduanya pola yang benar.',
      },
    ],
  },
  {
    id: '4',
    title: 'Bobot, KKM & Predikat',
    ok: 0,
    denom: 5,
    items: [
      {
        id: '4.1',
        label: 'subjects.kkm tidak pernah dipakai, dan UpdateSubjectsWeights membuangnya',
        s: 'FAIL',
        why: 'Payload SubjectWeight menerima kkm, tapi loop write hanya menulis weight: UPDATE subjects SET weight = ? WHERE id = ?. Handler membalas 200 "Bobot mapel diperbarui" padahal kkm tidak tersimpan. grep "kkm" di features/raport/repository.go = 0 hasil. Tidak ada Santri yang diblokir, tidak ada nilai di bawah KKM yang ditandai.',
        fix: 'Tulis kkm di loop yang sama, plus endpoint khusus KKM. Tambahkan evaluasi per mapel di computeMapel: lulus = score >= s.kkm.',
      },
      {
        id: '4.2',
        label: 'Ambang predikat dipatok 75 untuk SEMUA mapel',
        s: 'FAIL',
        why: 'weight.PredikatKKM memakai ambang tetap 90/80/75. Tapi DB punya KKM berbeda: 75 untuk kategori agama, 70 untuk umum. Akibatnya nilai 72-74 pada mapel ber-KKM 70 sebenarnya LULUS tapi dilaporkan "Perlu Perbaikan". Sebaliknya 78 pada mapel ber-KKM 80 sebenarnya TIDAK LULUS tapi dilaporkan "Cukup" — terbaca seperti lulus.',
        fix: 'Jadikan ambang predikat parameter yang menerima KKM mapel, dan evaluasi per mapel terhadap subjects.kkm — bukan terhadap angka hardcode.',
      },
      {
        id: '4.3',
        label: 'Tiga fungsi predikat, dua yang hidup saling berbeda ambang',
        s: 'FAIL',
        why: 'Predikat (skala 1-4) dan Predikat100 (87.75/62.75/37.75) tidak dipakai sama sekali di kode non-test — keduanya mati. Yang hidup hanya PredikatKKM. Dua yang hidup berbeda di seluruh rentang 62,75-79,99. Sumber komentar di engine.go:119-120 sudah memperingatkan jebaknya secara eksplisit ("JANGAN panggil Predikat() dengan skor 0-100").',
        fix: 'Hapus Predikat & Predikat100 yang mati, jadikan hanya satu fungsi predikat dengan KKM sebagai parameter.',
      },
      {
        id: '4.4',
        label: 'grade_letter (A-E) dan predikat (Sangat Baik) punya ambang berbeda',
        s: 'FAIL',
        why: 'grade_letter: A≥85, B≥70, C≥55, D≥40, E<40. Predikat rapor: ≥90/80/75. Santri dengan nilai 85 terlihat "A" di tabel mapel tapi rapornya cuma "Baik". Frontend bahkan memetakan ulang sendiri (getLetterPredicate, terduplikasi identik di dua halaman) dan memakai label "Perlu Bimbingan" sementara backend menghasilkan "Perlu Perbaikan". Huruf "E" tidak dipetakan sama sekali sehingga tampil "E - -".',
        fix: 'Pilih satu sumber kebenaran. Sebaiknya kirim predikat dari backend per mapel (letter + predikat + KKM + status lulus) dan hapus pemetaan ganda di frontend.',
      },
      {
        id: '4.5',
        label: 'Validasi bobot memakai NAMA mapel sebagai kunci',
        s: 'FAIL',
        why: 'newWeights[names[id]] = w, sementara subjects.name tidak punya UNIQUE dan CreateSubject tidak mengecek duplikat. Dua mapel bernama sama collapse menjadi satu kunci map: yang kedua menimpa yang pertama, penjumlahan jadi kurang hitung, dan update bobot yang sah ditolak dengan pesan "Total bobot harus 100%. Saat ini 70.00%" — error yang tidak bisa ditindaklanjuti operator.',
        fix: 'Kunci map validasi dengan id (mis. "subject:12"), dan tambahkan UNIQUE(name) dengan 409 pada CreateSubject.',
      },
    ],
  },
  {
    id: '5',
    title: 'Keamanan & Otorisasi',
    ok: 1,
    denom: 5,
    items: [
      {
        id: '5.1',
        label: 'tim_media bisa mengunci, membuka, dan mengubah bobot rapor',
        s: 'FAIL',
        why: 'Seluruh router raport di-mount di bawah RequireRole("bendahara", "tim_media", "superadmin") tanpa pemersempitan per-rute. Handler punya komentar "// require superadmin/bendahara" pada /unlock — pembatasan yang tidak ada di kode. Akun media/marketing bisa menerbitkan rapor (POST /save → locked), menariknya (unlock), dan mengubah bobot mapel untuk semua Santri. Perlu dicatat: penulisan nilai justru lebih ketat (superadmin+bendahara), jadi ironisnya zona otorisasi paling longgar justru di publikasi rapor.',
        fix: 'Pisahkan sub-router operasional dan restriksi /save, /unlock, /subjects/weights dengan RequireRole("superadmin","bendahara").',
      },
      {
        id: '5.2',
        label: 'Save melewati pengetatan JSON yang dipakai seluruh kode lain',
        s: 'FAIL',
        why: 'handler.go memakai json.NewDecoder(r.Body).Decode(&s) mentah — tanpa batas ukuran body dan tanpa DisallowUnknownFields. Setiap jalur tulis lain di codebase memakai validators.DecodeJSON yang membatasi 1 MB dan menolak field tak dikenal. Endpoint yang menulis dokumen resmi ini justru yang paling longgar.',
        fix: 'Ganti dengan validators.DecodeJSON(w, r, &s).',
      },
      {
        id: '5.3',
        label: 'Perubahan nilai tidak pernah masuk audit log',
        s: 'FAIL',
        why: 'grep audit di features/academics dan features/exams = 0 hasil. CreateGrade, UpdateGrade, DeleteGrade, UpsertAssessment, SetKesantrianAspect, dan sinkronisasi CBT→grades tidak meninggalkan jejak. PadahalMenulis nilai adalah tindakan yang menentukan nilai akhir. Konsekuensi: nilai rapor bisa diubah tanpa jejak siapa dan kapan.',
        fix: 'Tambahkan entri audit untuk keenam jalur tulis tersebut (audit.RecordTx sudah ada dan memang menggagalkan pemanggil bila error).',
      },
      {
        id: '5.4',
        label: 'Audit lock/unlock best-effort dan berjalan setelah commit',
        s: 'FAIL',
        why: 'audit.Record bersifat best-effort (kagal hanya di-log, tidak menggagalkan operasi). Dipanggil SESUDAH Upsert/Unlock berhasil. Hasilnya rapor resmi bisa terbit tanpa satu pun entri audit, sementara komentar di repository.go menyebut "audit wajib" — jadi slogan itu, bukan penegakan.',
        fix: 'Pakai audit.RecordTx di dalam transaksi yang sama dengan Upsert/Unlock; audit itu memang designed untuk menggagalkan pemanggil.',
      },
      {
        id: '5.5',
        label: 'Seluruh query rapor & nilai ter-parameterisasi',
        s: 'PASS',
        why: 'Tidak ada satu pun titik SQL yang dibangun dari input user. Total 9 situs SQL dinamis di backend, semuanya aman; ORDER BY semuanya literal atau ordinal (positional), dan tidak ada parameter sort yang diterima endpoint mana pun. Pola query += dengan args terpisah dipakai konsisten di ~110 tempat. Tidak ada SQL injection di jalur rapor maupun nilai.',
      },
    ],
  },
  {
    id: '6',
    title: 'Portal Santri & Ekspor PDF',
    ok: 0,
    denom: 8,
    items: [
      {
        id: '6.1',
        label: 'Rapor yang sudah dikunci SELALU tampil "belum lengkap" di portal',
        s: 'FAIL',
        why: 'Frontend portal/raport/page.tsx merender eraport.is_complete ? eraport.final_score.toFixed(2) : "–" dan eraport.is_complete ? eraport.predikat : "Belum lengkap". Tapi StoredRaport (backend, repository.go:49-64) TIDAK punya field is_complete sama sekali — hanya ComputedRaport yang punya. Field itu deserialize jadi undefined yang falsy. Akibatnya setiap rapor final yang sudah dikunci justru menampilkan banner "belum lengkap", menyembunyikan nilai resmi, dan memakai "–". Menariknya baris 331 tetap mencetak eraport.predikat, jadi predikat "Baik" tampil bersamaan dengan badge "Belum lengkap" di layar yang sama.',
        fix: 'Tambah IsComplete + Missing ke StoredRaport, atau di handler_me.go set stored.IsComplete = stored.Status != "incomplete". Selama transisi, guard frontend dengan !== false.',
      },
      {
        id: '6.2',
        label: 'Rata-rata di portal bukan nilai rapor resmi',
        s: 'FAIL',
        why: 'reportSummary.averageScore = rata-rata final_score dari SELURUH mapel, SELURUH semester, SELURUH tahun. Raport resmi menghitung (Mapel+Project+Kesantrian)/3 untuk SATU semester. Keduanya tidak sebanding. Contoh: mapel semester ini 90, semester lalu 70, project 60, kesantrian 60 → rapor resmi (90+60+60)/3 = 70.00, sementara kartu "Rata-rata Nilai" menampilkan (90+70)/2 = 80.0. Selisihnya makin lebar setiap ada semester baru. Angka yang paling menonjol di PDF justru angka lokal ini, bukan nilai resmi.',
        fix: 'Jadikan raport.final_score angka utama. Kalau rata-rata tetap ditampilkan, labeli tegas "Rata-rata Nilai Mapel (Semua Semester)".',
      },
      {
        id: '6.3',
        label: 'PDF rapor tidak pernah memakai rapor.final_score / predikat',
        s: 'FAIL',
        why: 'Payload PDF Portal hanya membawa averageScore lokal + daftar mapel. Tidak ada raport.final_score, predikat, is_complete, mapel_score, project_score, maupun kesantrian_score. Kolom UTS/UAS/Tugas yang tampil di layar juga tidak ada di PDF. PDF admin memakai raport resmi, tapi tidak pernah tercetak untuk PDF wali.',
        fix: 'Tambahkan final_score, predikat, dan ketiga komponen ke StudentReportPayload.',
      },
      {
        id: '6.4',
        label: 'PDF rapor incomplete mencetak "Nilai Akhir 0.00"',
        s: 'FAIL',
        why: 'export.ts mencetak payload.finalScore.toFixed(2) dan payload.predikat || "-". Untuk rapor berstatus incomplete, final_score=0 dan predikat="". Hasil PDF: "Nilai Akhir 0.00", "Predikat -", tanpa watermark. Tombol PDF juga tidak di-disable (disabled hanya ada di tombol "Kunci"). Guru bisa salah mengira Santri bernilai 0 lalu mencetak/mengirim rapor final ke wali.',
        fix: 'Disable tombol PDF saat !is_complete, dan tolak ekspor di dalam exportERaportPDF dengan status incomplete — tampilkan "Belum Lengkap", bukan 0.00.',
      },
      {
        id: '6.5',
        label: 'Kegagalan API disamarkan sebagai "data kosong"',
        s: 'FAIL',
        why: 'Semua wrapper API mengembalikan [] atau {} di dalam catch, sehingga catch di loadData tidak pernah tereksekusi untuk error HTTP mana pun. 403 karena role salah, 401 karena token kedaluwarsa, 500 karena backend mati — semuanya tampil sebagai tabel kosong. Worse: saat grades kosong, averageScore=0 dan PDF mencetak "Rata-rata nilai: 0.00", yang tampak seperti nilai nyata. Di admin/raport ada showToast error yang secara praktis tidak pernah muncul.',
        fix: 'Biarkan wrapper melempar error, tangani di komponen dengan state error + banner, dan render "–" (bukan 0) ketika grades.length === 0.',
      },
      {
        id: '6.6',
        label: 'Nilai project di admin dikonversi dua kali (1-4 → 0-100 → ÷4×100)',
        s: 'FAIL',
        why: 'Backend SUDAH menormalisasi 1-4 ke 0-100 (repository.go membagi avg14 dengan 4.0 lalu kali 100). UI admin raport lalu mengonversi lagi: (d.score || 0) / 4 * 100. Akibatnya skor 4.0 tampil 2500.0, 3.5 tampil 2187.5, 2.0 tampil 1250.0. Semua bar progres juga selalu 100% karena Math.min(x, 100) hanya membatasi batas atas. Guru tidak bisa membedakan 25 dari 100 kecuali dari angka 4 digit.',
        fix: 'Tampilkan d.score.toFixed(1) langsung; bar progres width: d.score% tanpa pengali tambahan.',
      },
      {
        id: '6.7',
        label: 'Setiap baris nilai DIKIRIM ke wali via WhatsApp sebagai "Nilai Akhir"',
        s: 'FAIL',
        why: 'notifications/repository.go GetNilai tidak punya filter semester maupun academic_year, dan tidak mengagregasi. FormatNilaiRaport berbunyi "berikut informasi nilai raport semester %s ... Nilai Akhir: %.1f". Untuk Santri dengan 9 mapel × 2 semester, wali menerima 18 pesan, masing-masing menyajikan nilai SATU mapel seolah-olah itu nilai akhir semester, memakai kosakata predikat keempat (Grade A-E) yang tak ada hubungannya dengan rapor. Ini paparan reputasi & hukum yang nyata, dan karakanya justru tidak adanya endpoint agregat.',
        fix: 'Jalankan broadcast dari hasil perhitungan rapor: satu pesan per Santri per semester, memuat final_score dan weight.PredikatKKM, difilter satu tahun ajaran + satu semester.',
      },
      {
        id: '6.8',
        label: 'PDF melabeli nilai 0-100 sebagai "Skor (1-4)"',
        s: 'FAIL',
        why: 'Header kolom PDF adalah ["Sub Project", "Skor (1-4)", "Bobot", "Kontribusi"] sementara nilainya sudah 0-100. Santri dengan project 3.5/4 tercetak 87.50 di bawah header 1-4. Baris kesantrian di tabel yang sama dicetak apa adanya (memang 1-4) — jadi dua skala berbeda dalam satu tabel.',
        fix: 'Ubah header menjadi "Skor (0-100)", atau cetak nilai 1-4 (score/25) agar konsisten dengan yang diisi guru di form.',
      },
    ],
  },
  {
    id: '7',
    title: 'Operasional & Kualitas',
    ok: 2,
    denom: 9,
    items: [
      {
        id: '7.1',
        label: 'Bobot & KKM tidak bisa dikelola dari layar mana pun',
        s: 'FAIL',
        why: 'Interface Subject di frontend hanya punya 4 field (id, name, category, teacher_id). Kolom weight, kkm, sort_order, is_active ada di DB dan punya API (getExtendedSubjects, updateSubjectWeights di api.ts) tapi TIDAK PERNAH dipanggil dari satu pun halaman. Admin sekolah tidak bisa menyetelnya tanpa akses SQL. Sekali salah ketik nama mapel pun tidak bisa diperbaiki — tidak ada endpoint updateSubject, hanya create & delete.',
        fix: 'Tambah form edit mapel yang memuat weight, kkm, sort_order, is_active, dan aktifkan getExtendedSubjects di tab rekap.',
      },
      {
        id: '7.2',
        label: 'DeleteSubject adalah hard delete yang menghasilkan 500',
        s: 'FAIL',
        why: 'DELETE FROM subjects WHERE id = ?, sementara grades punya FOREIGN KEY (subject_id) REFERENCES subjects(id) tanpa ON DELETE. Dengan foreign_keys=ON, menghapus mapel yang punya nilai memicu error constraint yang dipetakan jadi 500 generik. Akibatnya mapel lama tidak bisa "dipensiunkan" dan is_active tak pernah bisa dimatikan.',
        fix: 'Jadikan soft delete (is_active=0), dan petakan error FK menjadi 409 dengan pesan yang membantu.',
      },
      {
        id: '7.3',
        label: 'Tidak ada test yang menangkap cacat kelengkapan',
        s: 'FAIL',
        why: 'Tidak ada satu pun test yang menguji gate is_complete terhadap CAKUPAN. test yang ada (TestCalculateERaport, TestCalculateKesantrianScore, TestCalculateProjectScore) menguji fungsi matematika murni di weight/engine, bukan alur Compute. Test SPP sudah punya pola yang benar (TestConcurrentPaySingleWinner, TestIdempotentReplay) — pola yang sama persis belum ada di raport.',
        fix: 'Tambahkan test yang mengisi 1 dari N mapel lalu assert is_complete == false, dan yang mengisi final_score NULL lalu assert komponen dianggap belum dinilai.',
      },
      {
        id: '7.4',
        label: 'Empat ambang huruf duplikatif, satu di antaranya mati',
        s: 'FAIL',
        why: 'calcGrade di academics/handler.go tidak pernah dipanggil. Ambang A≥85/B≥70/C≥55/D≥40 diimplementasikan ulang di academics/repository.go (CreateGrade & UpdateGrade) dan exams/repository.go (gradeLetter), plus rumus (30 UTS + 40 UAS + 30 Task) ditulis tiga kali. Empat tempat untuk satu aturan, tiga di jalur tulis.',
        fix: 'Satu fungsi func Letter(score, kkm float64) (string, bool); hapus calcGrade; ketiga pemanggil memakainya.',
      },
      {
        id: '7.5',
        label: '~380 baris modal rapor adalah dead code',
        s: 'FAIL',
        why: 'Tiga state modal (reportOpen, recapOpen, bulkReportOpen) di admin/academics/page.tsx tidak pernah di-set(true) — hanya definisi dan onClose. Area rapor cetak yang berisi kop resmi, blok tanda tangan, dan tabel printable berada DI DALAM modal yang tak pernah dibuka. Tombol CETAK memanggil window.print(), tapi globals.css @media print menyetel .ap-modal-overlay { display: none !important } — hasilnya halaman kosong saat dicetak. Ada dua implementasi "rapor cetak" yang tidak sinkron.',
        fix: 'Hapus ketiga modal dan state-nya, atau sambungkan ke setReportOpen(true) dan pindahkan area print ke luar .ap-modal-overlay.',
      },
      {
        id: '7.6',
        label: 'Aksesibilitas tabel rapor',
        s: 'FAIL',
        why: 'Diempat file rapor: 0 htmlFor, 0 scope= pada 7 tabel, 0 <caption>, 8 tombol ikon tanpa aria-label/title. Pembaca layar membacakan "Edit" / "Hapus" tanpa konteks mapel atau Santri, dan navigasi header tabel mustahil.',
        fix: 'Tambah htmlFor+id, scope="col" pada semua th, caption sr-only per tabel, dan aria-label deskriptif pada tombol ikon.',
      },
      {
        id: '7.7',
        label: 'Teks penjelasan formula di UI bertentangan dengan backend',
        s: 'FAIL',
        why: 'Portal dan admin rapor menampilkan "Komponen yang belum dinilai tidak ikut dihitung" — yang menjanjikan rata-rata dari komponen yang ada. Padahal backend begitu SATU komponen kosong langsung mengembalikan final_score=0 dan status=incomplete. Orang tua yang mengikuti penjelasan UI akan menghitung predikat yang berbeda dari hasil sistem.',
        fix: 'Ubah teks: "Jika ada satu komponen yang belum dinilai, rapor ditandai belum lengkap dan nilai akhir belum dapat dihitung."',
      },
      {
        id: '7.8',
        label: 'Validasi rentang 0-100 pada UTS/UAS/Tugas & penguncian rapor eksplisit',
        s: 'PASS',
        why: 'validateGrade membatasi UTS, UAS, dan Task ke 0-100, dan semester dinormalisasi sebelum disimpan. Mekanisme penguncian ada danupunutang: Upsert menolak overwrite rapor berstatus locked (ErrRaportLocked → 409 dengan pesan "Rapor terkunci. Buka kunci (unlock) eksplisit"), serta ada endpoint Unlock tersendiri. Normalisasi semester juga punya migrasi bootstrap (db.go:1128-1157) yang memetakan ganjil/genap ke 1/2. Yang kurang adalah penguncian terhadap input (2.4) dan audit trail (5.3), bukan mekanismenya.',
      },
      {
        id: '7.9',
        label: 'Fallback ActiveAcademicYear & batas semester Juli-Juni',
        s: 'PASS',
        why: 'ActiveAcademicYear membaca academic_years.is_active, dan bila kosong jatuh kehitung tahun ajaran berjalan dengan batas bulan 7 (Juli). Fallback ini benar untuk kalender sekolah Indonesia dan mencegah parameter tahun ajaran kosong merusak perhitungan. NormalizeSemester juga dipakai konsisten di jalur baca rapor.',
      },
    ],
  },
];

const TOTAL_OK = CATS.reduce((n, c) => n + c.ok, 0);
const TOTAL_DENOM = CATS.reduce((n, c) => n + c.denom, 0);
const ALL_ITEMS = CATS.flatMap((c) => c.items);
const CRIT = ALL_ITEMS.filter((i) => i.s === 'FAIL' && ['1.1', '1.2', '2.4', '2.5', '6.1', '6.7'].includes(i.id));
const HIGH = ALL_ITEMS.filter((i) => i.s === 'FAIL' && ['2.1', '2.2', '2.3', '2.6', '3.1', '3.3', '4.1', '4.2', '5.1', '5.3', '6.2', '6.4', '6.6'].includes(i.id));
const MED = ALL_ITEMS.filter((i) => i.s === 'FAIL' && !CRIT.includes(i) && !HIGH.includes(i));

const TOP5 = [
  'Terratkan kelengkapan rapor: hitung cakupan (mapel dinilai vs mapel aktif, kegiatan dinilai vs kegiatan aktif), dan jadikan prekondisi level-repo sebelum Upsert. Inilah satu-satunya bug yang bisa menghasilkan rapor resmi bernilai 100 untuk Santri yang belum dinilai — selisih 67 poin, sudah terbukti diuji.',
  'Tambahkan is_complete ke StoredRaport. Saat ini setiap rapor yang sudah dikunci justru tampil "belum lengkap" dengan nilai "–" di portal wali — bugs yang paling langsung dilihat pengguna.',
  'Aktifkan bobot yang sudah ada: hitung Σ(score×weight)/Σ(weight) di computeMapel, pakai KKM per mapel sebagai ambang predikat, dan hapus ambang 75 hardcode. Infrastrukturnya sudah lengkap dan tervalidasi, tinggal tidak dipakai.',
  'Tahfidz sudah punya semester + academic_year dan sudah tampil di eRapor (Jilid 90). Lanjutannya: ganti surah_name teks bebas dengan surah_id FK ke tabel 114 surah supaya validasi ayat bisa per-surah, bukan pagar umum 300.',
  'Tambahkan audit trail ke jalur tulis nilai, kunci GeneratedBy dari client, dan batasi /save + /unlock ke superadmin+bendahara. Nilai rapor boleh diubah tanpa jejak, dan kolom "siapa yang menerbitkan" bisa dipalsukan.',
];

function statusChip(s: Status) {
  if (s === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
        <CheckCircle2 size={12} /> PASS
      </span>
    );
  }
  if (s === 'FAIL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-black text-rose-700">
        <XCircle size={12} /> FAIL
      </span>
    );
  }
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-500">N/A</span>;
}

function CatCard({ cat }: { cat: Cat }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-sky-700">
          K{cat.id} · {cat.title}
        </h2>
        <span className="text-sm font-black text-slate-900">
          {cat.ok}
          <span className="text-slate-400">/{cat.denom}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
          style={{ width: `${(cat.ok / cat.denom) * 100}%` }}
        />
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {cat.items.map((it) => (
          <li key={it.id} className="py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">
                <span className="font-mono text-xs text-slate-400">{it.id}</span> · {it.label}
              </p>
              {statusChip(it.s)}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{it.why}</p>
            {it.fix && (
              <p className="mt-1 flex items-start gap-1.5 text-xs font-medium leading-5 text-amber-700">
                <RefreshCcw size={12} className="mt-0.5 shrink-0" /> {it.fix}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuditEraportPage() {
  const pct = Math.round((TOTAL_OK / TOTAL_DENOM) * 100);
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <GraduationCap size={30} className="text-sky-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Audit E-Raport</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Audit E-Raport · {TOTAL_DENOM} Checkpoint
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              26 September 2026 · ditarik dari kode Go + Next.js, database produksi, dan pembuktian berjalan
              (bukan klaim).
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-sky-300"
          >
            <ArrowLeft size={14} /> Beranda
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Lulus</p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {TOTAL_OK}
              <span className="text-lg text-slate-400">/{TOTAL_DENOM}</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gagal</p>
            <p className="mt-1 text-3xl font-black text-rose-600">
              {TOTAL_DENOM - TOTAL_OK}
              <span className="text-lg text-slate-400">/{TOTAL_DENOM}</span>
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {CRIT.length} kritis · {HIGH.length} tinggi · {MED.length} sedang
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{pct}%</p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Belum layak jadi dokumen resmi — 1 cacat kritis sudah terbukti menghasilkan nilai 100 untuk rapor
              yang belum lengkap.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-700">
              <AlertTriangle size={16} /> Kritis ({CRIT.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {CRIT.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700">
                  <b className="font-mono">{c.id}</b> · {c.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700">
              <Database size={16} /> Tinggi ({HIGH.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {HIGH.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700">
                  <b className="font-mono">{c.id}</b> · {c.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
              <Scale size={16} /> Sedang ({MED.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {MED.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700">
                  <b className="font-mono">{c.id}</b> · {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-600">
            <FlaskConical size={16} /> Pembuktian Berjalan
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Cacat 1.1 bukan hasil pembacaan kode — ia dibuktikan dengan test yang mengisi 1 dari 9 mapel bernilai 100, 1
            dari 5 kegiatan bernilai 4.0, dan keempat aspek kesantrian bernilai 4.0, lalu memanggil{' '}
            <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">Compute()</code> secara langsung:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-5 text-emerald-300">
{`IsComplete  = true        <-- seharusnya false
MapelScore   = 100.00      <-- dari 1 dari 9 mapel
ProjectScore = 100.00      <-- dari 1 dari 5 kegiatan
FinalScore   = 100.00      <-- rapor resmi
Predikat     = "Sangat Baik"
Status       = "ready"     <-- Save() akan mengunci & menerbitkan

Nilai yang benar: 33.33 "Perlu Perbaikan"  =>  selisih 67 poin`}
          </pre>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Karena <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">IsComplete</code> bernilai true,
            tidak ada operator mana pun yang melihat peringatan: HTTP 200, entri audit{' '}
            <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">LOCK_RAPORT</code> tercatat, dan
            rapor dikirim ke wali.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-sky-700">
            <ArrowRight size={16} /> Top 5 Prioritas
          </h2>
          <ol className="mt-3 space-y-2">
            {TOP5.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[11px] font-black text-white">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <FileCheck2 size={20} className="text-sky-600" /> Rincian · {TOTAL_OK}/{TOTAL_DENOM}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            7 kategori · {TOTAL_DENOM} checkpoint. Setiap butir citing path:line pada kode, kecuali yang ditandai
            pembuktian berjalan.
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {CATS.map((c) => (
              <CatCard key={c.id} cat={c} />
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-600">
            <ShieldCheck size={16} /> Catatan Metodologi
          </h2>
          <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">
            <li>
              · Skor didasarkan kode repo (apps/backend + apps/frontend) dengan bukti path:line, bukan klaim.
            </li>
            <li>
              · Struktur tabel diambil dari <code className="font-mono">PRAGMA table_info</code> terhadap database
              produksi, termasuk isi tabel{' '}
              <code className="font-mono">subjects</code> (9 mapel, bobot, KKM) dan 3 baris{' '}
              <code className="font-mono">grades</code> bermasalah.
            </li>
            <li>
              · Cacat 1.1 dan skala nilai 2.6 dibuktikan secara empiris, bukan dibaca saja.
            </li>
            <li>
              · <b className="text-slate-700">Tidak adabutir yang menyebut lokasi berkas kredensial.</b> Halaman ini
              murni audit logika rapor.
            </li>
            <li>
              · Catatan yang sudah dikoreksi: middleware memakai cookie <code className="font-mono">alma_token</code>{' '}
              (bukan <code className="font-mono">access_token</code>) — benar.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-sky-700"
          >
            <Lock size={16} /> Audit Menyeluruh
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300"
          >
            <GraduationCap size={16} /> Buka Portal Wali
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
