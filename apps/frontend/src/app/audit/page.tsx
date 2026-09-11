'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Lock, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# AUDIT MENYELURUH — https://almaparung.com — 2026-09-11
Metode: 4 deep-dive paralel (security, database, frontend/UI, backend quality), READ-ONLY, tanpa destructive test. Menggantikan laporan lama di halaman ini.

## 1. Executive Summary — CRITICAL 5 / HIGH 19 / MEDIUM 29 / LOW 17
- Satu paparan data aktif (donatur publik), situs nyaris tak terindeks (tanpa H1/metadata per halaman), 2 bug live (SPP summary 500, update hantu), backup DB tidak konsisten.
- Yang sudah kuat: SQLi aman, upload aman, XSS berita aman, bcrypt, rate-limit, auth cookie, RBAC backend, unit test SPP 4/4.
- Verdict: JANGAN abaikan P0. Risk: CRITICAL.

## 2. CRITICAL (5)
- C1: Donor PII publik — GET /api/donations tanpa auth kembalikan nama+HP+bukti (main.go rute publik vs handler /list yang benar). Fix: hapus rute publik, sisakan /donations/campaigns.
- C2: H1 kosong di HTML awal /, /galeri, /news, /login (client-only render; H1 baru muncul setelah JS+API). Fix: Server Components + H1 statis fallback.
- C3: Tanpa per-page metadata — title/OG/canonical identik di semua rute (layout.tsx:4; canonical '/' global = risiko de-index). Fix: generateMetadata per route.
- C4: Form biodata portal tanpa <label> + tanpa focus-ring (biodata/page.tsx:459-478; htmlFor hanya 9 untuk 15+ field). Fix: label terasosiasi + focus style.
- C5: Halaman audit internal publik (/audit, /audit-donasi, /audit-spp, HTTP 200, robots index:true). RISIKO DITERIMA PEMILIK (disengaja). Saran: pastikan tak ada kredensial di laporan.

## 3. HIGH (19)
- H1: User biasa bisa tulis FAQ & Agenda (RequireRole hilang; main.go) — deface via registrasi terbuka. Fix: RequireRole tim_media/superadmin.
- H2: CSRF — cookie tanpa token anti-CSRF (SameSite Lax; X-CSRF-Token diizinkan tapi tak divalidasi). Fix: SameSite Strict + double-submit.
- H3: SPP summary 500 saat periode kosong — TERBUKTI live (SUM CASE tanpa COALESCE; tabel kosong). Fix: COALESCE(...,0).
- H4: SPP UpdateBill sukses palsu untuk id hantu (tanpa RowsAffected). Fix: cek -> 404.
- H5: SPP tx Commit gagal -> rollback dilewati (return tanpa assign). Fix: err = tx.Commit().
- H6: Exams abaikan error (studentID bisa 0 masuk grades). Fix: cek semua error.
- H7: Paginasi payments in-memory salah (offset>limit dilewati -> bocor semua data). Fix: LIMIT/OFFSET di SQL.
- H8: adminID selalu 0 di payments & SPP (assertion map vs jwt.MapClaims) — audit trail rusak. Fix: auth.CurrentUserID.
- H9: WAL 4MB belum checkpoint + backup .db tanpa WAL (kehilangan 26 jam, rawan corrupt). Fix: wal_checkpoint(TRUNCATE) + .backup API.
- H10: 6 berita kategori yatim (categories kosong; filter selalu kosong). Fix: seed/NULL-kan + validasi.
- H11: Hapus santri/subject laten FK (spp_bills, grades, exams). Fix: bersihkan/cegah terpusat.
- H12: CTA primer gagal kontras AA (sky-500 ~3:1). Fix: sky-700 atau teks gelap.
- H13: Kosakata lunas ganda (success vs paid). Fix: satu enum + helper badge.
- H14: Tombol ikon tanpa aria-label (X modal, aksi baris SppBills). Fix: aria-label.
- H15: Gambar konten alt="" + unoptimized + img mentah (LCP lambat, SEO image nol). Fix: alt terisi, hapus unoptimized, sizes+priority hero.
- H16: Homepage full-client + bundle berat (framer-motion, swiper, jspdf/xlsx di rute publik). Fix: Server Components + dynamic import + pisah chunk admin.
- H17: 3 tabel academics tanpa overflow-x (mobile overflow). Fix: bungkus overflow-x-auto.
- H18: Login Google mock mati tapi UI ada (notice kuning permanen). Fix: env + sembunyikan bila kosong.
- H19: JWT secret lemah/prediktabel (kata+tahun). Fix: rotasi 32+ byte acak.

## 4. MEDIUM (27)
- Auth tanpa revocasi (logout hanya hapus cookie, token hidup 24 jam); payments tanpa batas atas nominal; PSB self-attested amount (klaim Rp1 lolos antrean — andalkan verifikasi admin).
- Race check-then-act DeleteBill/UpdateBill; ListBills tanpa pagination; double-submit tanpa disable; paid_at bebas string; cancel hapus seluruh jejak cicilan.
- time.Parse diabaikan (zero-time); rows.Err() hilang (SPP list); donations json.Marshal/Unmarshal tanpa cek error.
- 4 envelope respons berbeda; validasi timpang antar fitur; GetBill tanpa route; raport skor dummy 3.0; 16 paket tanpa test; GenerateBills tanpa tx; settings UpdateMany tanpa defer rollback.
- Teks kecil slate-400; radius/tipografi tanpa token; wording empty-state beda; progress donations/[slug] tanpa aria; tab admin tanpa semantik tablist; rute add-vs-form ganda; scanner attendance tanpa menu; FK pragma fragility; activity log ikut terhapus; index hilang (santri.user_id, news.author, spp santri_id, dsb); vacuum tak jalan.

## 5. LOW (17)
- Validator role tanpa whitelist; VerifyDonation adminID:=1; error leak kecil raport; upload terbuka semua user (kuota 5MBx30/jam); middleware hanya cek cookie; HSTS backend absen (wajib di reverse-proxy); generated_by=0; ownership root:root data/*.db*; label login tanpa htmlFor; dead code errors-flatten SPP; due_date masa lalu boleh; SPP-payments ledger tak terhubung; Create 200 vs 201; logger timpang; dead code; GetByUserID mati; bahasa campur ID/EN.

## 6. Kekuatan (terbukti aman)
- SQLi aman (semua placeholder); upload anti path-traversal/executable; XSS berita di-sanitize; tanpa command injection; secrets tak ter-commit; mass-assignment role aman; IDOR sesi/dormpet aman; bcrypt PIN/password; rate-limit login/upload; webhook Telegram terverifikasi; Rupiah/tanggal id-ID konsisten; toast aksesibel; tanpa N+1; halaman 404/500 baik; test SPP 4/4.

## 7. Rekomendasi
P0 (sekarang): tutup GET /donations publik; COALESCE summary; RowsAffected UpdateBill; H1 SSR + metadata per halaman; RequireRole FAQ/Agenda.
P1 (penting): token CSRF + SameSite Strict; rollback-commit fix; paginasi SQL payments+SPP; adminID dari JWT; checkpoint+backup benar; seed/NULL kategori; kontras CTA; aria-label; alt+optimasi gambar; tablist semantik; progress aria; index DB; Enum status tunggal.
P2 (perbaikan): envelope respons tunggal; test 16 paket; token radius/tipografi; dead code/routes; vacuum terjadwal; rotasi JWT + expiry pendek; sembunyikan Google mock.

## 8. Final Risk Rating — CRITICAL
- 5 Critical (1 paparan data aktif + situs tak terindeks + form tak aksesibel). 19 High. Perbaiki P0 dulu, lalu P1 berurutan. Audit berikutnya setelah P0 hijau.
- Jejak: 4 agen audit paralel, read-only, bukti file:line + curl/DB di tiap temuan. Tanpa ubah kode (kecuali halaman ini).

Trace: apps/frontend/src + apps/backend (main.go, */handler.go, */repository.go, db.go) + SQLite live (SELECT/PRAGMA) + curl https. Lihat /audit-donasi & /audit-spp untuk laporan modul.
`;

export default function AuditPage() {
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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-rose-200">
            <Shield size={14} /> Audit Menyeluruh
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">AUDIT SELURUH SISTEM</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Security + database + frontend + backend. 4 audit paralel, read-only, bukti file:line. 11 bab — CRITICAL.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">P0: 5 fix sekarang</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">Risk: CRITICAL</span>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><AlertTriangle size={14} /> Critical 5</p>
              <p className="mt-1 text-xs text-rose-700">PII publik, SEO, form, audit</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Shield size={14} /> High 19</p>
              <p className="mt-1 text-xs text-amber-700">Auth, bug live, kontras</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Medium 29</p>
              <p className="mt-1 text-xs text-slate-600">Race, validasi, a11y</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Low 17</p>
              <p className="mt-1 text-xs text-emerald-700">Hardening, rapian</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Beranda</Link>
            <Link href="/audit-donasi" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit Donasi</Link>
            <Link href="/audit-spp" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit SPP</Link>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Lock size={14} /> Security</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Tutup donatur publik + RequireRole FAQ/Agenda + token CSRF. SQLi/upload/sandi aman terbukti.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> Database</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Checkpoint WAL + backup .backup API. Tanpa yatim FK. Tambah index + vacuum terjadwal.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Frontend</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">H1 SSR + metadata per halaman dulu, lalu kontras, aria, gambar, dan bundle.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
