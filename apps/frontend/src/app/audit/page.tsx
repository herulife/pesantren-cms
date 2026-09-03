'use client';

import PublicLayout from '@/components/PublicLayout';
import { ShieldCheck, AlertTriangle, FileSearch, Layers, Bug, Lock, Palette, CheckCircle2, XCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sky-900/80 bg-slate-950 py-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-sky-950/70" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-100">
            <FileSearch size={14} /> Audit Report
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Audit Modul PSB</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-sky-100/80">
            Hasil audit deep-dive modul Penerimaan Santri Baru (PSB) menggunakan skill <span className="font-bold text-white">audit</span> (`.opencode/skills/audit`) — mode code-quality, bug-patterns, security & UI CRAP.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900">Branch: codex/pesantren-cms-import-2026-05-04</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white">Base: origin/main</span>
            <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-slate-900">Verdict: Minor</span>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Scope</p>
              <p className="mt-2 text-sm font-bold text-slate-800">Backend psb/handler, repository, portal/biodata, documents, payment, layout, lib/api, defaults, PublicLayout</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">Fokus online wizard 3 langkah (biodata → dokumen → pembayaran) + public PSB CTA Daftar Online.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700"><AlertTriangle size={14} /> Verdict</p>
              <p className="mt-2 text-lg font-black text-amber-900">Minor — aman push, duplikasi wajib dibersihkan dulu</p>
              <p className="mt-2 text-xs leading-6 text-amber-800">Tidak ada blocking data-loss, tapi 4 area duplikasi + validasi divergen bikin maintenance debt tinggi.</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">Skill dipakai</p>
              <p className="mt-2 text-sm font-bold text-sky-900">audit (deep-dive code-quality)</p>
              <p className="mt-2 text-xs leading-6 text-sky-700/80">Check duplication, inconsistency, dead code. Next: security & UI CRAP menyusul di halaman ini.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Findings */}
      <section className="bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-4 space-y-8">
          {/* 1 Duplication */}
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600"><Layers size={20} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">1. Duplication — Blocking</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">isFilled & validasi PSB copy-paste 4×, fetch N+1, upload normalisasi ganda</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-800">1.1 `isFilled` + 14-field list</p>
                <p className="mt-1 font-mono text-xs text-slate-500">portal/biodata:64 isFilled(value:string) · portal/layout:11 isFilled(value?:string|null) · portal/payment:30 · documents:38 inline 14 field every() · layout:79-96 14-field array</p>
                <p className="mt-2">Harus edit 4 tempat jika tambah field. Sudah divergen (biodata pakai fallback `father_name||parent_name`).</p>
                <p className="mt-2 font-bold text-sky-700">Fix: `lib/psb/completeness.ts` → REQUIRED_BIODATA_KEYS + isFilled + isBiodataComplete/isDocumentsComplete single source.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-800">1.2 Fetch `getMyPSBRegistration()` N+1</p>
                <p className="mt-1 font-mono text-xs text-slate-500">portal/biodata:107 · documents:37 · payment:95 · layout:58 — tiap navigasi 2× GET /psb/me (layout + page)</p>
                <p className="mt-2 font-bold text-sky-700">Fix: `PortalRegistrationContext` di layout, children consume context, hapus per-page useEffect.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-800">1.3 Validasi Frontend vs Backend divergen</p>
                <p className="mt-1 font-mono text-xs text-slate-500">biodata:72-89 require 14 field + NIK 16 + YYYY-MM-DD vs handler.go:70-111 hanya full_name wajib, lainnya if != ""</p>
                <p className="mt-2 font-bold text-sky-700">Fix: samakan required list, atau buat schema terpusat (Zod/OpenAPI).</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-black text-slate-800">1.4 Upload URL normalisasi ganda + maps duplikasi</p>
                <p className="mt-1 font-mono text-xs text-slate-500">documents:94 `uploadResult?.url||data?.url` · payment:243 · api.ts:1447 + psb/page:115 iframe vs PublicLayout:696</p>
                <p className="mt-2 font-bold text-sky-700">Fix: biar `api.ts` saja normalisasi; `constants/contact.ts` untuk ADDRESS/MAP.</p>
              </div>
            </div>
          </div>

          {/* 2 Inconsistency */}
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Bug size={20} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">2. Internal Inconsistency — Minor (Blocking untuk payment)</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Gender, parent vs father, mount order, response shape</h3>
              </div>
            </div>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-slate-400">
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">handler.go:86-96</span> — `low==g` double normalize, dead branch, pesan vs validasi mismatch (izinkan `Laki` tapi UI hanya L/P).</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">repository.go:19-26,195</span> — `ParentName/Phone` + `Father/Mother` dual, sintesis silent fallback sembunyikan data bug.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">main.go:307-332</span> — `Mount /psb` (panitia) + `GET /psb/me` (user) sharing prefix, order sensitif `me` vs {'{id}'}.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">response.go:8 vs 37</span> — `APIResponse` vs `errors` key shape beda, frontend `localizeApiMessage` tidak tangani.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">scanRegistration:126</span> — `time.Parse(DateTime)` gagal untuk RFC3339 `T`, jadi zero time.</li>
            </ul>
          </div>

          {/* 3 Dead code */}
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-600"><FileSearch size={20} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">3. Dead Code / Over-Abstraksi — Minor</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Interface duplikat, wrapper trivial, layout monolith</h3>
              </div>
            </div>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-slate-400">
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">handler.go:488 IRepository</span> duplikat `PSBRepository` tidak dipakai — hapus/alias.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">handler.go:36 currentUserID</span> wrapper `auth.CurrentUserID` — inline saja.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">portal/layout:564</span> 609 LOC campur nav + mobile + stepper + focus mode — split `lib/portal/navigation.ts` + hook.</li>
              <li><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">payment:78-90</span> 7 useState + banner duplikat — derivasi dari `registration` saja.</li>
            </ul>
          </div>

          {/* Checklist */}
          <div className="rounded-[1.7rem] border border-sky-200 bg-sky-50 p-6 md:p-8">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-sky-700"><ShieldCheck size={16} /> Action Checklist (prioritas)</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-sky-900 marker:font-black">
              <li><span className="font-black">[Blocking]</span> Ekstrak `isFilled` + `REQUIRED_BIODATA_KEYS` ke shared hook — ganti 4 duplikat.</li>
              <li><span className="font-black">[Blocking]</span> `PortalRegistrationProvider` single-fetch `/psb/me`, hapus per-page fetch.</li>
              <li>[Minor] Samakan validasi required backend↔frontend + fix gender `handler.go:86`.</li>
              <li>[Minor] Hapus `IRepository` duplikat + `currentUserID` wrapper, tambah logging portal.</li>
              <li>[Minor] Normalisasi route `/psb/me` sebelum `/:id` atau pisah router.</li>
              <li>[Minor] Unifikasi error shape `SendValidationErrorResponse` ke `APIResponse`.</li>
              <li>[Minor] Fix `scanRegistration` coba `RFC3339` fallback, buat `Registration` non-optional.</li>
              <li>[Clean] Sentralisasi `ADDRESS/MAP_EMBED_URL` ke constants.</li>
            </ol>
          </div>

          {/* Branch audit categories */}
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Branch audit 8 kategori (ringkas)</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" /><div><p className="text-sm font-black text-emerald-900">Secrets</p><p className="text-xs text-emerald-700">Clean — tidak ada token/.env di diff PSB.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" /><div><p className="text-sm font-black text-emerald-900">Debug artifacts</p><p className="text-xs text-emerald-700">Clean — no console.log/TODO di diff.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" /><div><p className="text-sm font-black text-emerald-900">Build & suite</p><p className="text-xs text-emerald-700">Clean — frontend build sukses 9e75f4d.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"><Info size={18} className="text-amber-600 shrink-0" /><div><p className="text-sm font-black text-amber-900">Commit hygiene</p><p className="text-xs text-amber-700">Minor — commit `a2b9c6a` menggabung 3 file PSB, sudah atomic.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" /><div><p className="text-sm font-black text-emerald-900">Integration</p><p className="text-xs text-emerald-700">Clean — routes `/portal/biodata` ter-register.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600 shrink-0" /><div><p className="text-sm font-black text-emerald-900">Merge conflicts</p><p className="text-xs text-emerald-700">Clean — no markers, branch up-to-date.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"><AlertTriangle size={18} className="text-amber-600 shrink-0" /><div><p className="text-sm font-black text-amber-900">Unintended changes</p><p className="text-xs text-amber-700">Minor — `defaults.ts` 4 baris, `psb/page` 20 baris dalam scope.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"><XCircle size={18} className="text-amber-600 shrink-0" /><div><p className="text-sm font-black text-amber-900">Test coverage</p><p className="text-xs text-amber-700">Minor — no test untuk validasi psb baru (perlu vitest/go test).</p></div></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/psb" className="rounded-full bg-sky-600 px-6 py-3 text-sm font-black text-white">Kembali ke PSB</Link>
            <Link href="/portal/biodata" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700">Buka Daftar Online</Link>
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700">Beranda</Link>
          </div>
          <p className="text-xs leading-6 text-slate-400">Generated {new Date().toISOString().slice(0,10)} · skill audit deep-dive code-quality · untuk modul PSB saja. Deep-dive security/UI menyusul — halaman ini akan diperbarui otomatis.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
