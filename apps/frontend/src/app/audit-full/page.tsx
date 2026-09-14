'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# AUDIT FULL MENYELURUH — https://almaparung.com — 2026-09-13
Metode: 4 audit paralel read-only (PPDB, Santri+Pengajar, SPP+Keuangan, Donasi+Akademik) + audit skema database langsung (49 tabel, 40 index, 27 FK). Bukti file:line. Total ±95 temuan backend.

## 1. Ringkasan eksekutif
- PPDB (23 temuan): alur daftar→verifikasi jalan, tapi validasi timpang FE/BE, state machine tak dienforce, upload-ulang user bisa batalkan status lunas.
- Santri+Pengajar (25): identitas terpecah 3 (users/santri/teachers-employees), master guru ganda, role admin mati.
- SPP+Keuangan (22): PayBill solid anti-overpay, tapi race konkuren, cancel vs ledger drift, adminID JWT selalu 0, index hilang.
- Donasi+Akademik (25): PII donatur publik, adminID:=1 hardcoded, predikat rapor rusak (skala), WA absensi ke nomor salah.
- Verdict: 11 KRITIS, ±30 HIGH, sisanya MEDIUM/LOW. Tidak ada SQLi/RCE (query parameterized, upload image-only).

## 2. Peta database (49 tabel, ringkas per domain)
- Identitas: users(4) [email uniq, role CHECK, whatsapp] | santri(3) [nis UNIQUE, user_id NULL→users ON DELETE SET NULL] | registrations(0) [user_id NULL, tanpa UNIQUE] | teachers(1) [isolasi, tanpa FK] | employees(0) [PK code] | teacher_attendance(0) [UNIQUE(code,date)] | raw_logs(0) [UNIQUE(fp,date,time)]
- Keuangan: spp_bills(2) [UNIQUE(santri,period)] | iuran_bills(0) [UNIQUE(santri,name,period)] | payment_transactions(0) [code UNIQUE] | receipts(0) [UNIQUE(santri,period)] | kas_categories(5, seed 5) [UNIQUE(name,kind)] | kas_transactions(0) [code UNIQUE] | payments(0) [legacy, user-based] | donation_campaigns(4) | donations(0) | donors(0)
- Akademik: subjects(8) | grades(8) | attendance(0) | tahfidz_progress(0) | kesantrian_aspek(4) [UNIQUE] | raports(1) [UNIQUE] | student_points(1) | violation_logs(1) | exams(0)+questions/sessions/answers(0) | project_*(2/4/0)
- Konten/ops: news(12) | gallery(22) | videos(19) | programs(5) | agendas(0) | facilities(0) | faqs(0) | messages(1) | settings(42) | activity_logs(161) | classes(8) | academic_years(0) | wallets(0)
- Index: 40 (period/date/status/nis/class/name/email). HILANG: spp/iuran(santri_id,status), paytx(bill_type,bill_id),(bill_period), kas_tx(category_id).
- FK: 27. Tanpa ON DELETE kecuali santri.user_id→SET NULL & donations.campaign→SET NULL. payments/activity/subjects/grades/dll →users; spp/iuran/receipts/paytx →santri (SPLIT!).
- Temuan struktural: (a) akademik key users.id vs keuangan key santri.id — tanpa santri.user_id tak bisa rekonsiliasi; (b) teachers×employees×users tak terhubung; (c) santri.class/angkatan & classes.academic_year free-text bukan FK; (d) grades & attendance tanpa UNIQUE(student,date/subject); (e) payments legacy orphan dari spp/iuran; (f) settings 42 keys tanpa dokumentasi.

## 3. Kerangka flow per modul
- PPDB: /psb info → register(user) → biodata(14 field FE/1 BE) → dokumen(3 URL) → bayar(upload bukti→pending) → panitia verify payment→verify status (gate: accepted wajib paid) → manual jadi santri. Dua state machine independen (status & payment_status).
- Santri: CRUD + bulk + set-class + link-user(user_id) → dipakai spp/iuran/receipts/paytx. Portal wali via /my-santri,/my-bills,/my-ledger,/my-receipt.
- SPP/Iuran: generate(INSERT OR IGNORE)→bayar Pay(tx: guard→update→ledger KTR→rekap KWI→COMMIT→WA async)→portal proof(pending)→verify approve(Pay)/reject→kwitansi cetak/WA.
- Donasi: campaign → donasi pending → verify(+collected tx)→WA. Edit/hapus dikunci bila verified.
- Akademik: subjects(teacher→users)→grades(final=0.3UTS+0.4UAS+0.3tugas)→rapor calculate(preview custom)→save(paksa 50/25/25, locked)→portal/me.
- Absensi: manual academics | QR(token 5mnt, sekali pakai)→scan→WA ke users.whatsapp. Guru: employees→attendance→per-guru/rekap; raw fingerprint→sync.
- WA: wagate whatsmeow mandiri (sesi SQLite, QR+pair-code, antrean 3 dtk) — Fonnte dihapus total.

## 4. Temuan KRITIS (11)
- C1 donasi PII publik: GET /api/donations tanpa auth kembalikan nama+HP+nominal (donations/handler.go:70, main.go:304-305).
- C2 verify donasi adminID:=1 hardcoded, bukan JWT (donations/handler.go:228).
- C3 role admin mati: migrasi admin→superadmin tapi RequireRole(...,admin) & menu Pegawai klaim admin (db.go:779, main.go:348).
- C4 PayBill race: BEGIN deferred + check-then-act; 2 Pay konkuren bisa dobel ledger+rekap (spp/repository.go:346-396).
- C5 KWI via MAX()+1 tanpa retry di PayBill; hanya GetOrCreateReceipt yang retry (spp:648-654).
- C6 CancelBill reset paid tapi ledger+receipts.total tak dikoreksi → drift permanen (spp:471-483).
- C7 portal upload-ulang reset payment_status paid→pending; lock hanya FE (psb/repository.go:271-286).
- C8 /api/psb/me ganda grup panitia+user; user bisa kena 403 (main.go:354-379).
- C9 hapus santri/pegawai tanpa cek cascade → 500 FK (santri/handler.go:296-303, hr:101-107).
- C10 WA absensi ke users.whatsapp santri, bukan parent_phone (attendance/handler.go:75-88).
- C11 predikat rapor rusak: ambang skala 1-4 dipakai untuk skor 0-100 → hampir semua "Sangat Baik" (weight/engine.go:101-112).

## 5. Temuan HIGH per area (ringkas)
- PPDB: UpdateStatus/UpdatePaymentStatus tanpa state machine (#2,#3); BE wajib 1 field vs FE 14 (#6); NIK ganda lolos (#7); user ganda via race (#8); hard-delete tanpa audit (#10); PDF ditolak BE tapi ditawarkan FE (#11); hotlink bukti tanpa via /upload (#12); Rp1 jadi pending (#13); tolak tanpa alasan (#16); GetMine null menyesatkan (#17); parent_* hilang diam-diam (#18); /psb/status mock (#19); TOCTOU verify (#20).
- Santri: master guru ganda (#1); teacher_id→users bukan guru (#2); LinkUser overwrite tanpa cek role/unlink (#4); BulkCreate telan duplikat (#10); paginasi teachers rusak (#11); create guru tanpa id (#12); email/WA guru publik (#13); menu vs backend role mismatch (#15); update pegawai tanpa validasi (#16); gender/status kotor (#17,#18); export hanya 20 baris (#22); import class kosong (#23); kode kelas non-atomik (#24); portal terisolasi sulit debug (#25).
- SPP: Verify TOCTOU pending (#3); tanpa Idempotency-Key (#4); GetOrCreate rekursi tak berbatas (#5); UpdateBill abaikan pending (#7); filter sembunyikan pending (#8); DeleteBy abaikan pending (#10); proof basi pasca-verify (#11); Update tak hitung status (#12); WA total gabungan (#13); rekap tak sinkron (#14); laba double-count/manual (#15); payments orphan (#16); hapus kategori yatim (#17); kategori-kind bebas (#18); kwitansi salah bill (#19); adminID selalu 0 (#20); bendahara-only sempit (#21).
- Donasi+: verifikasi idempoten diam-diam (#10); hapus campaign yatim (#11); campaign fiktif lolos (#12); validasi longgar + opsi Umum 400 (#13); form BS buang tanggal/HP (#14); getDonations tanpa credentials → 401 (#15); broadcast sumber salah (#17); nilai spam per mapel (#18); antrean vs timeout (#19); respons bohong + ctx basi (#20); tahun ajaran bebas (#21); sumber siswa ganda (#22); semester hardcoded portal (#23).

## 6. Roadmap
- P0 (data & akses): C1 tutup PII / filter verified; C2 adminID dari JWT; C8 urutan route /psb/me; C9 guard hapus + 409; C4 BEGIN IMMEDIATE + unique guard; C6 koreksi ledger/receipt saat cancel; C7 tolak upload bila paid (BE).
- P1 (integritas): state machine PSB + payment; NIK unique; user_id unique-per-user + unlink; validasi BE=FE; envelope error konsisten; index hilang; adminID JWT (kasir/audit); envelope verify idempoten; KKM simpan; locked dienforce; dedup broadcast; timeout antrean realistis.
- P2 (rapian): predikat skala; default 3.0 transparan; bobot preview=save; absensi UNIQUE+WA parent; menu vs role sync; export full-filter; import validasi; reconnect QR/429 halus; docs settings keys.

## 7. Metode & catatan
- 4 sub-agen paralel + baca langsung DB live (read-only) + verifikasi sampel file:line (route PSB ganda, adminID:=1, endpoint donasi publik). Tanpa ubah kode/data.
- Halaman audit lama (/audit, /audit-donasi, /audit-spp) dihapus, diganti halaman ini.
- Estimasi usaha: P0 ±2 hari, P1 ±1 minggu, P2 bertahap.`;

export default function AuditFullPage() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 py-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-sky-200">
            <Shield size={14} /> Audit Full
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">AUDIT FULL MENYELURUH</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Database 49 tabel + flow PPDB, santri, pengajar, SPP, donasi, akademik, WA. 4 audit paralel, bukti file:line. 11 kritis.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">P0: 11 kritis</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">±95 temuan</span>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-600">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin!' : 'Copy Audit'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><AlertTriangle size={14} /> Kritis 11</p>
              <p className="mt-1 text-xs text-rose-700">PII, race, drift, role mati</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Shield size={14} /> High ±30</p>
              <p className="mt-1 text-xs text-amber-700">Validasi, TOCTOU, split identitas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Med/Low ±54</p>
              <p className="mt-1 text-xs text-slate-600">Rapian, copy, UX API</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Kuat</p>
              <p className="mt-1 text-xs text-emerald-700">Parameterized, guard overpay, envelope</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Beranda</Link>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy Full Report
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700"><Database size={16} /> Laporan Lengkap</h2>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin' : 'Copy'}
              </button>
            </div>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-6 text-xs leading-6 text-slate-100">{report}</pre>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Shield size={14} /> Cakupan</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">49 tabel, 40 index, 27 FK + flow PPDB, santri, SPP, kwitansi, WA, donasi, akademik, absensi.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> Jejak Data</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Sumber tiap angka dan relasi tercatat; DB live hanya dibaca, tidak diubah.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Tindak Lanjut</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">P0 ±2 hari, P1 ±1 minggu, P2 bertahap. Halaman audit lama sudah dihapus.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
