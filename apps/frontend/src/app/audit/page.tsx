'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Lock, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# AUDIT UI/UX — https://almaparung.com — 2026-09-12
Metode: skill Vercel web-design-guidelines (100+ aturan: a11y, fokus, form, animasi, tipografi, gambar, perf, navigasi, sentuh, dark-mode, i18n, hidrasi) + skill lokal ux-heuristics, wcag-accessibility, mobile-responsive-ux, frontend-design + full-stack-audit. 3 audit paralel (publik, admin, komponen), read-only. Scope: 124 file TSX. Total ±270 temuan: MAYOR/HIGH ±110, MEDIUM ±95, LOW ±65.

## 1. Ringkasan per area
- Publik (14 file): FAIL semua kecuali news/[slug] (PASS dgn catatan). Pola: tanpa skip-link, link/tombol tanpa focus-visible, SectionIntro selalu h2 (news & galeri tanpa h1), kontras slate-400/emerald/amber gagal AA.
- Admin (19 file): FAIL semua. Pola: search/select/input tanpa <label>, tombol ikon tanpa aria-label, submit tanpa loading/disabled, tabel tanpa overflow-x, Rp/tanggal hardcoded bukan Intl.
- Komponen (10 file): FAIL semua. Toast/ConfirmDialog/modal tanpa role=dialog/aria-modal/Escape; layout tanpa skip-link/theme-color; globals tanpa :focus-visible global.

## 2. Pola sistemik (perbaiki sekali, sembuh banyak)
- S1: Tambah skip-link + id="main" di layout; style :focus-visible global di globals.css.
- S2: Semua tombol ikon (Trash2/Pencil/X/RotateCcw/Search) wajib aria-label; ikon dekoratif aria-hidden="true".
- S3: Semua search/select/input wajib <label htmlFor+id> (ganti placeholder-only).
- S4: Semua submit async wajib disabled+spinner (isSaving) cegah double-submit.
- S5: Semua <table> admin bungkus overflow-x-auto (mobile).
- S6: PublicSectionIntro tambah prop level agar tiap halaman punya h1.
- S7: Rp/tanggal via Intl.NumberFormat('id-ID') / Intl.DateTimeFormat (ganti MONTHS_ID & toLocaleString manual + split).
- S8: Modal (ConfirmDialog dkk) tambah role=dialog aria-modal, Escape, overscroll contain.
- S9: Kontras: slate-400 label, emerald-600/amber-500 badge/teks → naikkan ke -700/sky-700.

## 3. Temuan publik (contoh kunci, file:line)
- app/page.tsx:528 autoplay 6,5 dtk tanpa pause; :564 h1 di tiap slide (3 h1); :553,598,645 motion tanpa reduced-motion; :571,577,699,705 CTA tanpa focus-visible; :634 label slate-400 ~2,8:1; :1066 thumbnail div tanpa role/alt.
- app/kontak/page.tsx:215,230,246,261 label tanpa htmlFor; :315 iframe tanpa title; :47 error hanya toast; :215 label slate-400.
- app/galeri/page.tsx:293 X tanpa aria-label; :289 lightbox tanpa dialog/Escape; :291 overlay div onClick; :125 search tanpa label; :94 tanpa h1; :247 info hover-only.
- app/donations/[slug]/page.tsx:300,567 progress tanpa role; :131 h3 sebelum h1; :294,561 label slate-400.
- app/news/page.tsx:47 tanpa h1; :60 search tanpa label.
- components/PublicLayout.tsx:466 tanpa skip-link; :302,346 menu akun tanpa aria-expanded; :183,499 teks 9-11px ~4:1.
- components/NewsCard.tsx:40 badge amber ~2,1:1; :59 "..." bukan "…".
- components/PublicSectionIntro.tsx:37 selalu h2 (akar missing-h1).
- Positif: Toast aria-live polite; progressbar+aria-label di donations list benar; empty state ada; iframe footer ada title.

## 4. Temuan admin (contoh kunci, file:line)
- payments/page.tsx:362,403 ikon tanpa aria-label; :287,296 search/select tanpa label; :488 submit tanpa loading; :198 tab tanpa overflow-x; :127,130 Rp/tanggal hardcoded.
- payments/SppBills.tsx:401,405,408 aksi title saja; :441 X x3; :264,326,335 label/search tanpa label; :508,553 submit tanpa loading; :380 progress tanpa role.
- payments/IuranBills.tsx:415,419,422; :455; :279,340; :528,573; :393 (pola sama).
- payments/Kasir.tsx:62,89,90 tanpa label; :66 selected tanpa aria-pressed.
- admin/school/page.tsx:68,88,108,131 tanpa label; :73,92,125 tabel tanpa overflow-x; :78,98 Trash2 tanpa aria-label.
- admin/kas/page.tsx:74-80,67,101 7 input tanpa label; :84,106 tabel; :91,115 aksi tanpa aria-label.
- admin/teachers/report/page.tsx:135,142,143,154,168,236; :97,119,163 tabel; :57,63 submit.
- portal/biodata/page.tsx:459-478 6 input orangtua tanpa label.
- Positif: hapus/batal selalu ConfirmDialog; badge ada teks (tak warna saja); export PDF/Excel konsisten.

## 5. Temuan komponen (file:line)
- Toast.tsx:61 close tanpa aria-label; :56 ikon tanpa aria-hidden; :60 pesan tanpa break-words.
- ConfirmDialog.tsx:44 tanpa role/aria-modal/Escape; :45 backdrop div onClick; :57 close tanpa aria-label.
- Sidebar.tsx:91 close tanpa aria-label; :107 aktif tanpa aria-current; :122 nav tanpa aria-label.
- GallerySelectionModal.tsx:74 close; :125 div onClick harus button; :134 img tanpa dimensi/lazy.
- layout.tsx:79 tanpa skip-link; :4 tanpa theme-color.
- globals.css:11 tanpa color-scheme & :focus-visible global; :75 transition:all.

## 6. Skill yang dipakai
- Baru: web-design-guidelines (Vercel vercel-labs/agent-skills, 31rb star) — .opencode/skills/web-design-guidelines/ (SKILL.md + guidelines.md 100+ aturan, diambil 2026-09-12).
- Lokal: ux-heuristics (Nielsen), wcag-accessibility, mobile-responsive-ux, frontend-design, visual-design-system, react-ux-patterns, full-stack-audit, pesantren-ops.
- Kandidat dinilai: flitzrrr/frontend-design-skills (website-audit, 20 skill), hueyexe/frontend-agent-skills (9 skill + checklist), addyosmani/web-quality-skills (150+ aturan Lighthouse), vercel react-best-practices. Pemenang untuk audit: Vercel web-design-guidelines (aturan paling konkret + format file:line).

## 7. Roadmap
P0: S1 skip-link+focus global; S2 aria-label tombol ikon; S3 label form; S6 h1 per halaman.
P1: S4 loading submit; S5 overflow-x tabel; S8 dialog; S9 kontras; progressbar+lightbox+iframe title.
P2: S7 Intl; typo …/curly quotes; tabular-nums; aria-pressed tab; debounce search; URL-sync tab.

## 8. Verdict — PERLU PERBAIKAN MENYELURUH (mayor ±110)
Fungsionalitas dan keamanan tak tersentuh audit ini (lihat /audit-donasi & /audit-spp). Sampel 12 temuan sudah divalidasi manual file:line. Perbaikan disarankan per pola S1-S9, bukan per file.`;

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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-sky-200">
            <Shield size={14} /> Audit UI/UX
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">AUDIT UI/UX MENYELURUH</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Skill Vercel web-design-guidelines (100+ aturan) + skill lokal UX. 3 audit paralel, read-only, bukti file:line. 124 file TSX — PERLU PERBAIKAN.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">P0: skip-link, aria-label, label form, h1</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">Mayor ±110</span>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><AlertTriangle size={14} /> Mayor ±110</p>
              <p className="mt-1 text-xs text-rose-700">Label, aria, fokus, h1, kontras</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Shield size={14} /> Medium ±95</p>
              <p className="mt-1 text-xs text-amber-700">Loading, dialog, Intl, motion</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Low ±65</p>
              <p className="mt-1 text-xs text-slate-600">Tipografi, copy, URL state</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Lolos</p>
              <p className="mt-1 text-xs text-emerald-700">Toast live, empty state, konfirmasi hapus</p>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Lock size={14} /> Skill Baru</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">web-design-guidelines dari Vercel (31rb star): 100+ aturan + format file:line. Tersimpan di .opencode/skills.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> Pola Sistemik</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">9 pola S1-S9: perbaiki sekali di komponen bersama, sembuh di puluhan halaman.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Roadmap</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">P0 akses dasar, P1 dialog/loading/kontras, P2 Intl & copy. Fungsionalitas tak tersentuh.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
