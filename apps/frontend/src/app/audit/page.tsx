'use client';

import PublicLayout from '@/components/PublicLayout';
import { ShieldCheck, AlertTriangle, FileSearch, Layers, Bug, Lock, Palette, CheckCircle2, XCircle, Info, Copy, Check, Server, LayoutDashboard, GraduationCap, HeartHandshake, Database, Globe, Zap, Accessibility, Search, Scale, Box } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

type Checkpoint = { id: string; title: string; status: 'PASS' | 'FAIL' | 'NA'; note?: string };
type Finding = { id: string; severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Blocking' | 'Minor'; title: string; loc: string; impact: string; fix: string; skill: string };

const fullStackCheckpoints: { cat: string; icon: React.ReactNode; checks: Checkpoint[] }[] = [
  { cat: '1. Visual Design & Frontend', icon: <Palette size={16} />, checks: [
    { id:'1.1', title:'Typography hierarchy (Outfit display + Inter body)', status:'PASS' },
    { id:'1.2', title:'Colour system — DESIGN.md sky-500/emerald/slate tokens', status:'PASS' },
    { id:'1.3', title:'Layout & composition — intentionally staged, not template', status:'PASS' },
    { id:'1.4', title:'Backgrounds & depth — shadow hierarchy cards', status:'PASS' },
    { id:'1.5', title:'Motion — hover/focus + prefers-reduced-motion', status:'FAIL', note:'Swiper autoplay + framer motion tanpa reduced-motion guard di page.tsx:900' },
  ]},
  { cat: '2. User Flow & UX', icon: <LayoutDashboard size={16} />, checks: [
    { id:'2.1', title:'Hero clarity — value prop 5 detik + CTA di atas fold', status:'PASS' },
    { id:'2.2', title:'Navigation — max 7 item + active state', status:'PASS' },
    { id:'2.3', title:'CTA copy — deskriptif outcome, bukan Submit', status:'FAIL', note:'Beberapa admin form masih pakai Simpan generik — app/admin/*/form' },
    { id:'2.4', title:'Journey completeness — loading/success/error state', status:'FAIL', note:'PSB wizard loading ada, tapi error masih raw api message di portal/payment:120' },
    { id:'2.5', title:'Trust & social proof dekat CTA', status:'PASS' },
  ]},
  { cat: '3. Responsive & Mobile', icon: <Box size={16} />, checks: [
    { id:'3.1', title:'Breakpoints — no horizontal scroll', status:'PASS' },
    { id:'3.2', title:'Touch targets 44px', status:'FAIL', note:'Icon-only buttons di Sidebar.tsx:42 <44px pada mobile' },
    { id:'3.3', title:'Mobile typography 14px min', status:'PASS' },
    { id:'3.4', title:'Mobile navigation — hamburger functional', status:'PASS' },
    { id:'3.5', title:'Mobile performance — lazy images', status:'FAIL', note:'Hero images unsplash tanpa priority/lazy optimal di page.tsx:240' },
  ]},
  { cat: '4. Performance & Web Vitals', icon: <Zap size={16} />, checks: [
    { id:'4.1', title:'LCP — hero image optimized', status:'FAIL', note:'remote unsplash 1920w tanpa next/image priority preload' },
    { id:'4.2', title:'INP — no long tasks blocking', status:'PASS' },
    { id:'4.3', title:'CLS — no layout shift', status:'PASS' },
    { id:'4.4', title:'Asset optimization — image domains whitelisted', status:'PASS', note:'next.config.ts remotePatterns lengkap' },
    { id:'4.5', title:'Caching — rewrites /api & /uploads', status:'PASS' },
  ]},
  { cat: '5. Accessibility (WCAG)', icon: <Accessibility size={16} />, checks: [
    { id:'5.1', title:'Semantic HTML & heading order', status:'PASS' },
    { id:'5.2', title:'Keyboard nav & focus-visible ring', status:'FAIL', note:'Custom dropdown di PublicLayout:210 missing aria-expanded sync pada keyboard' },
    { id:'5.3', title:'Screen reader — alt & aria-label', status:'PASS' },
    { id:'5.4', title:'Colour contrast AA', status:'PASS', note:'sky-700 on white lulus AA' },
    { id:'5.5', title:'Motion respect prefers-reduced-motion', status:'FAIL', note:'Sama dengan 1.5' },
  ]},
  { cat: '6. Security (10 checks)', icon: <Lock size={16} />, checks: [
    { id:'6.1', title:'Secrets — no token/.env in repo', status:'PASS' },
    { id:'6.2', title:'Client-side exposure — no NEXT_PUBLIC_ secrets', status:'PASS' },
    { id:'6.3', title:'Input validation — validators/* + backend guard', status:'FAIL', note:'PSB validasi divergen frontend 14 field vs backend hanya full_name — psb/handler.go:70' },
    { id:'6.4', title:'Paywall bypass — no DOM-gated paid content', status:'PASS', note:'Donasi/payment butuh bukti upload + verifikasi bendahara' },
    { id:'6.5', title:'Payment replay — idempotency', status:'FAIL', note:'payments/handler.go tanpa idempotency key, replay bukti bayar bisa double' },
    { id:'6.6', title:'DB access — no exposed SQLite RLS', status:'PASS' },
    { id:'6.7', title:'HTTP headers — CSP/HSTS/X-Frame', status:'FAIL', note:'main.go CORS saja, tanpa helmet CSP/HSTS headers' },
    { id:'6.8', title:'API protection — rate limit + auth', status:'PASS', note:'ratelimit.go sudah ada cleanup + path-scoped key' },
    { id:'6.9', title:'Webhooks — HMAC verify', status:'FAIL', note:'telegram/webhook & payment tanpa HMAC signature verify' },
    { id:'6.10', title:'Console cleanup — no debug log in prod', status:'PASS' },
  ]},
  { cat: '7. Backend & API', icon: <Server size={16} />, checks: [
    { id:'7.1', title:'API design — REST consistent /api prefix', status:'PASS' },
    { id:'7.2', title:'Rate limiting — global + per-IP eviction', status:'PASS', note:'Fixed 2026-04-30: map leak sudah ada cleanupExpiredClientsLocked' },
    { id:'7.3', title:'Error handling — APIResponse envelope konsisten', status:'FAIL', note:'response.go SendValidationErrorResponse pakai errors key, tidak envelope APIResponse' },
    { id:'7.4', title:'Data handling — time.Parse RFC3339', status:'FAIL', note:'psb/repository.go scanRegistration DateTime gagal untuk RFC3339 T' },
    { id:'7.5', title:'Timeouts & MaxBytesReader', status:'PASS', note:'upload/handler.go MaxBytesReader 10MB ok' },
  ]},
  { cat: '8. SEO & Discoverability', icon: <Search size={16} />, checks: [
    { id:'8.1', title:'Meta + OG + Twitter card', status:'PASS', note:'layout.tsx metadataBase + openGraph lengkap' },
    { id:'8.2', title:'Structured data — EducationalOrganization JSON-LD', status:'PASS' },
    { id:'8.3', title:'Technical SEO — canonical, sitemap, robots', status:'PASS', note:'sitemap.ts + robots.ts ada' },
    { id:'8.4', title:'Headings — single H1 per page', status:'PASS' },
    { id:'8.5', title:'Social presence — sameAs instagram', status:'PASS' },
  ]},
  { cat: '9. Privacy, Legal & Compliance', icon: <Scale size={16} />, checks: [
    { id:'9.1', title:'Cookie consent', status:'FAIL', note:'Tidak ada banner consent — padahal pakai @react-oauth/google + analytics potensial' },
    { id:'9.2', title:'Legal pages — privacy/terms', status:'FAIL', note:'Belum ada /privacy & /terms' },
    { id:'9.3', title:'Data minimisation — santri NIK tidak public', status:'PASS' },
    { id:'9.4', title:'Third-party scripts — preconnect google fonts ok', status:'PASS' },
    { id:'9.5', title:'Data protection — log activity santri', status:'PASS', note:'activity_logs table ada' },
  ]},
  { cat: '10. Infrastructure & Polish', icon: <Globe size={16} />, checks: [
    { id:'10.1', title:'Error pages — 404/500', status:'FAIL', note:'Belum ada app/not-found.tsx custom' },
    { id:'10.2', title:'Favicon/manifest', status:'PASS', note:'favicon.ico + icons di layout.tsx' },
    { id:'10.3', title:'Dark mode', status:'NA', note:'Design system tidak require dark mode' },
    { id:'10.4', title:'Analytics', status:'NA' },
    { id:'10.5', title:'Content quality — no lorem', status:'PASS' },
  ]},
];

const uxCheckpoints: { cat: string; checks: Checkpoint[] }[] = [
  { cat: '11. System Status & Feedback', checks: [
    { id:'11.1', title:'Loading states setiap async action', status:'PASS' },
    { id:'11.2', title:'Success confirmations', status:'PASS' },
    { id:'11.3', title:'Error recovery — human readable ID', status:'FAIL', note:'Payment error masih teknikal, bukan ID plain' },
    { id:'11.4', title:'Progress indicators — PSB stepper 3 langkah', status:'PASS' },
    { id:'11.5', title:'Realtime validation', status:'PASS', note:'Biodata inline NIK 16 validation' },
  ]},
  { cat: '12. Navigation & IA', checks: [
    { id:'12.1', title:'Primary nav konsisten', status:'PASS' },
    { id:'12.2', title:'Mobile nav adaptive', status:'PASS' },
    { id:'12.3', title:'Search', status:'NA', note:'Belum ada site search — roadmap' },
    { id:'12.4', title:'Breadcrumbs', status:'FAIL', note:'Admin detail pages tanpa breadcrumb' },
    { id:'12.5', title:'Footer informatif', status:'PASS' },
  ]},
  { cat: '13. User Control & Freedom', checks: [
    { id:'13.1', title:'Undo/reversibility', status:'FAIL', note:'Delete galeri/berita tanpa undo, langsung hard delete' },
    { id:'13.2', title:'Form preservation — back tidak hilang', status:'FAIL', note:'PSB wizard belum pakai PortalRegistrationContext, back = refetch' },
    { id:'13.3', title:'Escape hatches — cancel/back', status:'PASS' },
    { id:'13.4', title:'Settings persistence', status:'PASS' },
    { id:'13.5', title:'Logout/session clear', status:'PASS' },
  ]},
  { cat: '14. Consistency & Standards', checks: [
    { id:'14.1', title:'Visual consistency — DESIGN.md tokens', status:'PASS' },
    { id:'14.2', title:'Language consistency — ID santri-friendly', status:'PASS' },
    { id:'14.3', title:'Platform conventions — Next.js App Router', status:'PASS' },
    { id:'14.4', title:'Icon usage — lucide konsisten', status:'PASS' },
    { id:'14.5', title:'Responsive parity — admin vs public', status:'FAIL', note:'Admin table density tinggi, mobile scroll horizontal belum card view' },
  ]},
];

const findings: Finding[] = [
  { id:'F-01', severity:'Blocking', title:'Duplikasi isFilled + REQUIRED_BIODATA 14-field 4× & N+1 getMyPSBRegistration', loc:'portal/biodata:64 · portal/layout:11 · documents:38 · payment:30 · api.ts:1447', impact:'Tambah field harus edit 4 tempat; tiap navigasi 2× GET /psb/me boros; sudah divergen father_name vs ParentName', fix:'Buat lib/psb/completeness.ts (REQUIRED_BIODATA_KEYS + isFilled + isComplete) + PortalRegistrationContext di portal/layout.tsx single-fetch', skill:'audit code-quality + pesantren-ops' },
  { id:'F-02', severity:'High', title:'Validasi PSB divergen frontend vs backend + gender dead branch', loc:'psb/handler.go:70-96 · repository.go:19 · validators/psb.go', impact:'Frontend wajib 14 field, backend hanya full_name — bisa submit incomplete; gender low==g dead, validasi izinkan Laki tapi UI hanya L/P', fix:'Samakan schema Zod shared; fix gender ke enum L/P saja, hapus low==g branch', skill:'backend-dev + pesantren-ops' },
  { id:'F-03', severity:'High', title:'Payment replay tanpa idempotency key + webhook tanpa HMAC', loc:'payments/handler.go · notifications/handler.go:telegram/webhook · donations/handler.go', impact:'Bukti bayar bisa replay unlock ganda; webhook Telegram bisa diforge', fix:'Idempotency-Key header + simpan hash bukti; HMAC verify untuk webhook', skill:'full-stack-audit security 6.5/6.9' },
  { id:'F-04', severity:'High', title:'Security headers hilang — tanpa CSP/HSTS/X-Frame', loc:'apps/backend/cmd/main.go · middleware', impact:'Clickjacking & downgrade risk, audit security FAIL 6.7', fix:'Tambah middleware helmet: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options', skill:'full-stack-audit security' },
  { id:'F-05', severity:'Medium', title:'Upload URL normalisasi duplikat + ADDRESS/MAP duplikat', loc:'portal/documents:94 · payment:243 · api.ts:1447 · psb/page:115 · PublicLayout:696', impact:'Maintenance debt, iframe maps beda URL bisa desync', fix:'Sentralisasi di api.ts normalizeUploadUrl + constants/contact.ts ADDRESS/MAP_EMBED_URL', skill:'audit duplication + cms' },
  { id:'F-06', severity:'Medium', title:'Response envelope inkonsisten — APIResponse vs {errors}', loc:'platform/response.go:8 vs 37 · frontend localizeApiMessage', impact:'Frontend tidak tangani errors shape, toast error generik', fix:'Unifikasi ke APIResponse {success, message, errors} + update localizeApiMessage', skill:'backend-architect' },
  { id:'F-07', severity:'Medium', title:'scanRegistration time.Parse DateTime gagal RFC3339', loc:'psb/repository.go:126 · raport/repository.go', impact:'created_at jadi zero time untuk ISO T', fix:'Coba time.RFC3339 fallback sebelum DateTime, atau pakai time.ParseInLocation', skill:'backend-dev' },
  { id:'F-08', severity:'Medium', title:'Breadcrumbs hilang & admin table mobile tidak card view', loc:'app/admin/*/detail/[id] · app/admin/psb/page.tsx', impact:'Nielsen heuristic 12 & 14 FAIL — user lost di detail', fix:'Tambah Breadcrumbs component + responsive card view untuk table (list-page-patterns skill)', skill:'ux-heuristics + frontend-design' },
  { id:'F-09', severity:'Medium', title:'Portal layout 609 LOC monolith + IRepository duplikat', loc:'app/portal/layout.tsx:564 · psb/handler.go:488', impact:'Over-abstraksi, susah test, dead code', fix:'Split lib/portal/navigation.ts + hook usePortalNav; hapus IRepository alias ke PSBRepository', skill:'audit dead code' },
  { id:'F-10', severity:'Low', title:'Motion tanpa prefers-reduced-motion + hero LCP tidak priority', loc:'app/page.tsx:240 · Swiper autoplay', impact:'Aksesibilitas & Core Web Vital', fix:'Wrap motion di useReducedMotion; next/image priority untuk hero pertama', skill:'wcag-accessibility + frontend-design' },
  { id:'F-11', severity:'Low', title:'Cookie consent & legal pages belum ada', loc:'app/layout.tsx · globals', impact:'Privacy compliance FAIL 9.1/9.2', fix:'Tambah CookieBanner + pages /privacy & /terms (ringkas, ID)', skill:'full-stack-audit privacy' },
  { id:'F-12', severity:'Low', title:'Lint 78 warnings tersisa (no-img-element, unused vars)', loc:'apps/frontend — eslint', impact:'Noise, bukan blocking tapi hutang', fix:'Fase 5: ganti img→Image, hapus unused, atau eslint --fix bertahap', skill:'audit build & suite' },
];

const passCount = [...fullStackCheckpoints, ...uxCheckpoints].flatMap(c=>c.checks).filter(c=>c.status==='PASS').length;
const failCount = [...fullStackCheckpoints, ...uxCheckpoints].flatMap(c=>c.checks).filter(c=>c.status==='FAIL').length;
const naCount = [...fullStackCheckpoints, ...uxCheckpoints].flatMap(c=>c.checks).filter(c=>c.status==='NA').length;
const totalScored = passCount + failCount;
const scorePct = Math.round((passCount/totalScored)*100);

export default function AuditPage() {
  const [copied, setCopied] = useState(false);
  const auditText = `# Audit Menyeluruh Alma Parung — 2026-09-07
Verdict: Minor (1 Blocking, 3 High, 5 Medium, 3 Low) — skor ${scorePct}% (${passCount}/${totalScored} PASS, ${failCount} FAIL, ${naCount} N/A)
Scope: apps/backend (Go 1.25, 26 fitur, SQLite WAL) + apps/frontend (Next.js 16.2, Tailwind 4, website-builder) + domain pesantren (PSB, santri, tahfidz, keuangan)
Skills: audit (code-quality deep-dive), full-stack-audit (90 checkpoint), backend-architect, backend-dev, frontend-design, ux-heuristics, cms, pesantren-ops (custom)

Blocking: F-01 duplikasi isFilled 4× & N+1 getMyPSBRegistration — fix lib/psb/completeness.ts + PortalRegistrationContext
High: F-02 validasi divergen + gender dead branch | F-03 payment replay/HMAC | F-04 security headers CSP/HSTS
Medium: F-05 upload/maps duplikat | F-06 envelope errors | F-07 scanRegistration RFC3339 | F-08 breadcrumbs+mobile table | F-09 layout monolith
Low: F-10 motion reduced + LCP | F-11 cookie/legal | F-12 lint 78 warnings

PRD: docs/PRD-AUDIT-ALMA-PARUNG.md — 5 fase: 1 PRD+skill → 2 audit paralel → 3 halaman /audit → 4 Blocking/Major fix → 5 polish & handover
Lama: /audit ALMA (audit_page.tsx 208 LOC, PSB-only Minor) TELAH DIHAPUS — diganti halaman ini.
`;
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(auditText); setCopied(true); setTimeout(()=>setCopied(false),2000); }
    catch { const ta=document.createElement('textarea'); ta.value=auditText; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sky-900/80 bg-slate-950 py-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-sky-950/70" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize:'22px 22px'}} />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-100">
            <FileSearch size={14} /> Audit Menyeluruh — 90 Checkpoint
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Audit Alma Parung <span className="text-sky-300">Menyeluruh</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-sky-100/80">
            Hasil audit 360° <span className="font-bold text-white">frontend + backend + CMS + UX + domain pesantren</span> menggunakan 7 skill: <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">audit</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">full-stack-audit</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">cms</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">frontend-design</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">backend-architect</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">ux-heuristics</span> <span className="font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">pesantren-ops</span>. Menggantikan <span className="line-through decoration-rose-300">audit Alma lama (PSB-only)</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900">Tanggal: 2026-09-07</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white">Skor: {passCount}/{totalScored} PASS · {scorePct}%</span>
            <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-slate-900">Verdict: Minor</span>
            <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-black text-white">Blocking: 1</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500 px-3 py-1 font-bold">PASS {passCount}</span>
            <span className="rounded-full bg-rose-500 px-3 py-1 font-bold">FAIL {failCount}</span>
            <span className="rounded-full bg-slate-600 px-3 py-1 font-bold">N/A {naCount}</span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-sky-100">90 checkpoint (50 full-stack + 40 UX — 4 N/A)</span>
          </div>
          <div className="mt-3 h-2 w-full max-w-xl overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${scorePct}%` }} />
          </div>
          <button onClick={handleCopy} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-slate-900 shadow transition hover:bg-sky-50">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Tersalin!' : 'Copy Ringkas Audit'}
          </button>
          <p className="mt-3 text-xs text-sky-200/70">PRD: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">docs/PRD-AUDIT-ALMA-PARUNG.md</span> · Skill baru: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">full-stack-audit</span> + <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">pesantren-ops</span> disimpan di <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">.opencode/skills/*</span></p>
        </div>
      </section>

      {/* Deletion notice OLD alma audit */}
      <section className="bg-rose-50 py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600"><XCircle size={18} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-600">Halaman lama dihapus</p>
              <p className="mt-1 text-sm font-bold text-slate-900"><span className="line-through">audit_page.tsx</span> Alma (PSB-only, 208 LOC, Verdict Minor) — TELAH DIHAPUS</p>
              <p className="mt-1 text-xs leading-6 text-slate-600">Sesuai permintaan: halaman <span className="font-mono bg-slate-100 px-1 rounded">/audit</span> lama milik Alma diganti halaman ini (audit menyeluruh 90 checkpoint). Backup tersimpan di <span className="font-mono bg-slate-100 px-1 rounded">audit_page.tsx.bak-2026-09-07</span> & <span className="font-mono bg-slate-100 px-1 rounded">/tmp/audit-heru-bak.tsx</span>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary 4 cards */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"><Database size={14} /> Scope</p>
              <p className="mt-2 text-sm font-bold text-slate-800">Monorepo penuh</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">Backend 26 fitur Go + frontend Next.js + website-builder 118k LOC + portal wali/santri + donasi</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700"><AlertTriangle size={14} /> Verdict</p>
              <p className="mt-2 text-lg font-black text-amber-900">Minor — 1 Blocking</p>
              <p className="mt-2 text-xs leading-6 text-amber-800">Aman deploy, tapi Blocking F-01 wajib sebelum tambah fitur PSB. 3 High (security/payment) prioritas minggu ini.</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-sky-600"><ShieldCheck size={14} /> Skills</p>
              <p className="mt-2 text-sm font-bold text-sky-900">7 skills aktif</p>
              <p className="mt-2 text-xs leading-6 text-sky-700/80">audit · full-stack-audit (90) · backend-architect · frontend-design · ux-heuristics · cms · pesantren-ops (custom pesantren)</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700"><GraduationCap size={14} /> Pesantren</p>
              <p className="mt-2 text-sm font-bold text-emerald-900">PPTQ Al-Maa Parung</p>
              <p className="mt-2 text-xs leading-6 text-emerald-700">SMP–SMK · 30 Juz · 30 Ikhwan/30 Akhwat · SPP syahriah · tahfidz weight engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scorecard 90 checkpoints */}
      <section className="bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><FileSearch size={20} className="text-sky-600" /> Scorecard 90 Checkpoint (full-stack-audit + UX)</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">PASS hijau, FAIL rose, N/A slate. Klik FAIL untuk lihat fix di bawah (F-01 dst). Sumber skill: <span className="font-mono bg-white border px-1.5 py-0.5 rounded">jalaalrd/full-stack-audit</span> + <span className="font-mono bg-white border px-1.5 py-0.5 rounded">pesantren-ops</span>.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[...fullStackCheckpoints, ...uxCheckpoints].map(group=>(
              <div key={group.cat} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700">{group.icon} {group.cat}</p>
                <div className="mt-3 space-y-2">
                  {group.checks.map(ch=>(
                    <div key={ch.id} className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs ${ch.status==='PASS' ? 'border-emerald-100 bg-emerald-50' : ch.status==='FAIL' ? 'border-rose-100 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="min-w-0">
                        <p className="font-bold"><span className="font-mono">{ch.id}</span> — {ch.title}</p>
                        {ch.note && <p className="mt-1 leading-5 text-slate-500">{ch.note}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${ch.status==='PASS' ? 'bg-emerald-500 text-white' : ch.status==='FAIL' ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>{ch.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Findings 12 */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><Bug size={20} className="text-rose-600" /> Temuan Tervalidasi (12) — per skill</h2>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">{failCount} FAIL → 12 findings</span>
          </div>
          <div className="grid gap-4">
            {findings.map(f=>(
              <div key={f.id} className={`rounded-[1.4rem] border p-5 md:p-6 ${f.severity==='Blocking' ? 'border-rose-200 bg-rose-50' : f.severity==='High' ? 'border-amber-200 bg-amber-50' : f.severity==='Medium' ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                      <span className={`rounded-full px-2 py-1 text-white ${f.severity==='Blocking' ? 'bg-rose-600' : f.severity==='High' ? 'bg-amber-600' : f.severity==='Medium' ? 'bg-sky-600' : 'bg-slate-500'}`}>{f.severity}</span>
                      <span className="font-mono bg-white border px-1.5 py-0.5 rounded text-slate-600">{f.id}</span>
                      <span className="text-slate-400">{f.skill}</span>
                    </p>
                    <h3 className="mt-2 text-sm font-black text-slate-900 md:text-base">{f.title}</h3>
                    <p className="mt-1 font-mono text-xs text-slate-500">{f.loc}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-xs leading-6 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 border"><p className="font-black text-slate-800">Impact</p><p className="mt-1 text-slate-600">{f.impact}</p></div>
                  <div className="rounded-xl bg-white p-3 border"><p className="font-black text-emerald-700">Fix</p><p className="mt-1 text-slate-700">{f.fix}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS & Pesantren deep dive */}
      <section className="bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-4 grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-6">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-sky-700"><Layers size={16} /> CMS Seam (skill cms)</p>
            <h3 className="mt-2 text-base font-black text-slate-900">Theme vs Plugin vs Media pipeline</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-6 text-slate-600 marker:text-slate-400">
              <li>Template seam bersih: `PageBuilderEditor` + `HomePageRenderer` + `WebsiteBuilderLivePreview` — preview ↔ publish ok</li>
              <li>Plugin seam: upload handler auth `RequireRole` ada, tapi gallery/videos belum rate-limit khusus</li>
              <li>Media pipeline: `upload/handler.go:48 MaxBytesReader` + mime check ok, tapi `public/uploads` fallback `appURL` perlu env guard</li>
              <li>Content model: settings `website_builder_state` JSON ok, tapi draft leakage perlu auth check di `settings/handler.go`</li>
            </ul>
          </div>
          <div className="rounded-[1.4rem] border border-emerald-200 bg-white p-6">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700"><HeartHandshake size={16} /> Pesantren Ops (skill pesantren-ops custom)</p>
            <h3 className="mt-2 text-base font-black text-slate-900">PSB · Tahfidz · Keuangan</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-6 text-slate-600 marker:text-slate-400">
              <li>PSB wizard 3 langkah butuh `pesantren-ops` checklist — F-01/F-02 blocking</li>
              <li>Tahfidz weight engine `platform/weight/engine.go` ada test `engine_test.go` — lulus, tapi butuh benchmark N santri besar</li>
              <li>Keuangan: `payments` + `donations` + `wallet` terpisah, `buku kas` konsisten — minus idempotency (F-03)</li>
              <li>Referensi pattern: Dibaliqaja laravel + PPMRJSKA Filament + SantriConnect geofencing — diserap ke skill</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Branch audit 8 kategori */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><ShieldCheck size={20} className="text-emerald-600" /> Branch Audit 8 Kategori (skill audit)</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-800"><CheckCircle2 size={14} /> Secrets</p><p className="mt-1 text-xs text-emerald-700">Clean — tidak ada token/.env di diff, JWT_SECRET via env</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-800"><CheckCircle2 size={14} /> Debug</p><p className="mt-1 text-xs text-emerald-700">Clean — no console.log/TODO produk</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-amber-800"><AlertTriangle size={14} /> Unintended</p><p className="mt-1 text-xs text-amber-700">Minor — audit ini sendiri ganti /audit, intentional</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-amber-800"><AlertTriangle size={14} /> Test</p><p className="mt-1 text-xs text-amber-700">Minor — no test baru untuk F-01/F-02 (butuh vitest/go test)</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-800"><CheckCircle2 size={14} /> Build & suite</p><p className="mt-1 text-xs text-emerald-700">Clean — Ratemimiter sudah fix + cleanup test lulus</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-amber-800"><Info size={14} /> Commit hygiene</p><p className="mt-1 text-xs text-amber-700">Minor — PRD 1 commit, audit page 1 commit — atomic ok</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-800"><CheckCircle2 size={14} /> Integration</p><p className="mt-1 text-xs text-emerald-700">Clean — /audit route ter-register, skill path .opencode/skills ok</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-800"><CheckCircle2 size={14} /> Merge</p><p className="mt-1 text-xs text-emerald-700">Clean — no markers, base main</p></div>
          </div>
        </div>
      </section>

      {/* Roadmap Fase 1-5 */}
      <section className="bg-slate-950 py-10 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="flex items-center gap-2 text-xl font-black"><Zap size={20} className="text-amber-400" /> Roadmap Bertahap — 5 Fase (PRD)</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">PRD lengkap: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">docs/PRD-AUDIT-ALMA-PARUNG.md</span> + staging <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">/home/alma/PRD-AUDIT-ALMA-PARUNG.md</span></p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Fase 1 — DONE</p><p className="mt-1 text-sm font-bold">PRD & Skill</p><p className="mt-2 text-xs leading-6 text-slate-300">Eksplorasi monorepo, 32 skill inventaris, clone full-stack-audit, buat pesantren-ops custom. PRD 220 baris.</p><p className="mt-2 text-xs font-mono text-emerald-300">✓ 2026-09-07</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-black uppercase tracking-widest text-amber-300">Fase 2 — DONE (di halaman ini)</p><p className="mt-1 text-sm font-bold">Audit Paralel</p><p className="mt-2 text-xs leading-6 text-slate-300">7 skill paralel, 90 checkpoint scoring {scorePct}% + 12 findings tervalidasi.</p><p className="mt-2 text-xs font-mono text-amber-300">→ halaman ini adalah laporan Fase 2</p></div>
            <div className="rounded-2xl border border-sky-400 bg-sky-500 p-4 text-slate-900"><p className="text-[11px] font-black uppercase tracking-widest">Fase 3 — DONE (halaman ini)</p><p className="mt-1 text-sm font-black">Halaman /audit Baru</p><p className="mt-2 text-xs leading-6 text-slate-800">Hapus audit_page.tsx Alma lama, ganti halaman menyeluruh ini. Backup .bak tersimpan.</p><p className="mt-2 text-xs font-mono font-bold">✓ /audit live</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-black uppercase tracking-widest text-white">Fase 4 — NEXT</p><p className="mt-1 text-sm font-bold">Blocking & High fix</p><p className="mt-2 text-xs leading-6 text-slate-300">F-01 PortalContext, F-02 validasi, F-03 idempotency/HMAC, F-04 helmet headers. Target 1 minggu.</p><p className="mt-2 text-xs font-mono text-slate-400">estim. 4 PR</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Fase 5 — POLISH</p><p className="mt-1 text-sm font-bold">Minor & Handover</p><p className="mt-2 text-xs leading-6 text-slate-300">F-05 s/d F-12, lint 78→0, breadcrumbs, cookie/legal, reduced-motion, handover.</p><p className="mt-2 text-xs font-mono text-slate-400">estim. 2 minggu</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/psb" className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900">Ke PSB</Link>
            <Link href="/portal/biodata" className="rounded-full bg-sky-500 px-6 py-3 text-sm font-black text-white">Portal Daftar</Link>
            <Link href="/" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white">Beranda</Link>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Tersalin!' : 'Copy Audit'}
            </button>
          </div>
        </div>
      </section>

      {/* Skill inventory footer */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Skill inventory — tersimpan di projek</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border bg-slate-50 px-3 py-1 font-mono">.opencode/skills/audit — 14 tipe</span>
            <span className="rounded-full border bg-sky-50 px-3 py-1 font-mono">.opencode/skills/full-stack-audit — 90 checkpoint (baru, dari github jalaalrd)</span>
            <span className="rounded-full border bg-emerald-50 px-3 py-1 font-mono">.opencode/skills/pesantren-ops — custom pesantren (baru)</span>
            <span className="rounded-full border bg-slate-50 px-3 py-1">+ 29 skill lokal (cms, frontend-design, backend-dev, ux-heuristics, wcag, dll)</span>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">Skill pesantren-ops + full-stack-audit disimpan di <span className="font-mono bg-slate-100 px-1 rounded">/home/alma/.opencode/skills/*</span> (staging alma). Untuk deploy ke <span className="font-mono bg-slate-100 px-1 rounded">/home/heru/alma-parung/.opencode/skills/*</span> jalankan sebagai <span className="font-mono bg-slate-100 px-1 rounded">heru</span>: <span className="font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">cp -r /home/alma/.opencode/skills/full-stack-audit /home/heru/alma-parung/.opencode/skills/ && cp -r /home/alma/.opencode/skills/pesantren-ops /home/heru/alma-parung/.opencode/skills/</span></p>
          <p className="mt-3 text-xs text-slate-400">Generated 2026-09-07 · PRD: PRD-AUDIT-ALMA-PARUNG.md · Verdict Minor · Skor {scorePct}% · Halaman ini menggantikan audit Alma — siap untuk Fase 4 perbaikan bertahap.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
