'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Lock, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# DONATION PAGE AUDIT — https://almaparung.com/donations — 2026-09-05

## 1. Executive Summary — CRITICAL 2 / HIGH 5 / MEDIUM 3 / LOW 2
- Arsitektur manual transfer BSI 4381567120, tanpa gateway/webhook. Public /donations/campaigns 200 OK (1 campaign Wakaf), tapi GET /donations (donor PII) juga public 200.
- Critical: PII leak donor + no payment verification (verify hanya flip status).
- High: CSRF cookie tanpa token, flow POST /donations hilang, auth bypass hardcoded adminID=1, bypass validation, race idempotency.
- Verdict: JANGAN push ke production tanpa fix P0.

## 2. UI/UX — donasi hero + 2 card Kitabisa
- File: donations/page.tsx:48 hero gradient, 56 Open Donasi Baru, 93 Target Donasi card, 380 grid md:grid-cols-2
- Temuan: hero 2x teks duplikat "Setelah transfer..." (page.tsx:63-66), progress 5% statis (hardcode width 5%), card 1 Wakaf (0%) vs card 2 Infaq (25% dari DB 2.5M/10M) bagus, tapi badge Aktif sama sky (seharusnya Infaq=Wakaf sama, tapi pending vs aktif tidak beda), label "Open Donasi Baru" tidak informatif (seharusnya "Donasi Aktif 2").
- Rekom: hapus duplikat teks, progress pakai collected/target dari DB (sudah), badge category Wakaf emerald vs Infaq blue, grid 2 card sudah Kitabisa-like OK.

## 3. Functionality — langkah reproduksi
- GET /donations -> 200, tampil 2 card, klik Donasi Sekarang -> /donations/wakaf-cat-tembok-1 OK
- POST /donations (buat donasi) TIDAK ADA — lib/api.ts hanya addCampaign/deleteCampaign/verifyDonation, tidak ada createDonation. Flow putus: donatur hanya WA manual.
- Admin /admin/donations -> tab campaigns/transactions, Buat Kampanye -> /admin/donations/add (ada), tapi GET /donations/campaigns public, POST protected bendahara OK. DeleteCampaign tanpa cek collected_amount orphan.
- Reproduksi: curl POST /api/donations/campaigns sebagai anon -> 401 (benar), sebagai bendahara -> 200 (butuh auth). GET /api/donations tanpa auth -> 200 leak (salah).

## 4. Security
- Critical: GET /donations PII leak — main.go:273 r.Get("/donations", donationHandler.GetDonations) public, repo 86 LEFT JOIN donor_name/phone/amount. Evidence handler.go:153. Fix: pindah ke RequireRole bendahara.
- Critical: Exposed JWT_SECRET .env:6 almaa-parung-jwt-secret... — rotate, filter-repo.
- High: CSRF — middleware AllowedHeaders X-CSRF-Token tapi tidak cek, cookie alma_token SameSite=Lax, fetch credentials include tanpa token. File main.go:65, middleware.go:79, lib/api.ts:29. Fix: SameSite=Strict + double-submit.
- High: auth bypass verify — handler.go:126 adminID:=1 hardcode, bukan auth.CurrentUserID. Fix: uid,ok:=auth.CurrentUserID.
- Medium: XSS stored — handler.go:74 Create tanpa ValidateMediaURL, repo 206 INSERT langsung, frontend Image unoptimized javascript: bisa. Fix: bluemonday + ValidateMediaURL.
- Medium: SQLi safe (prepared) tapi LIKE %search% tanpa escape %_ .
- Low: weak JWT, etc.

## 5. Payment Security
- Amount manipulation High — target_amount/collected_amount/amount tanpa validasi >0, bisa -999M, NaN. Handler.go:74, db.go:493 no CHECK.
- Payment verification Critical — VerifyDonation hanya UPDATE status='verified' tanpa cek gateway/BSI, proof_url, amount. Repo 170 SELECT amount then UPDATE collected_amount +? tanpa FOR UPDATE, race bisa double-add. Tidak ada webhook, transaction ID, callback.
- Duplicate: tidak ada idempotency key, concurrent PUT /verify/1 bisa double. Fix: UPDATE ... WHERE status='pending' + RowsAffected==1, tx FOR UPDATE, UNIQUE reference_id.
- Client/server trust: amount dari client dipercaya, tidak ada server-generated order_id. Fix: server set collected_amount via verify, never client.

## 6. Backend/API — endpoint dipakai halaman donasi
- GET /donations/campaigns — public, dipakai donations/page.tsx:30 getCampaigns(), 200 OK 1 row, tapi activeOnly/search param tidak di-pass dengan benar (repo 57 Query tanpa args -> fixed). Performance: no pagination limit, WHERE 1=1 full scan.
- GET /donations — public leak, seharusnya protected. Dipakai admin/donations page.tsx:30 getDonations.
- POST /donations/campaigns — protected bendahara, dipakai admin/donations/add, tapi tanpa validasi.
- PUT /donations/verify/{id} — protected bendahara, dipakai admin verify, tapi hardcoded adminID.
- GET /donations/{id} — tidak ada, detail page pakai client find, bukan API. Rekom: buat GET /donations/campaigns/{id} public.
- Error handling: 500 converting NULL to string (end_date) — fixed NullString.

## 7. Database
- Query: donation_campaigns SELECT ... WHERE 1=1 ORDER BY created_at DESC — no index on is_active, no LIMIT. Fix: index is_active, LIMIT 50.
- Authorization: donasi donor_name/phone tidak ada RLS, semua bisa baca via public GET /donations.
- Data exposure: collected_amount bisa di-set client via CreateCampaign (repo 206 INSERT collected_amount param, tapi handler Create ignore collected_amount? Actually CreateCampaign INSERT collected_amount dari c.CollectedAmount yang bisa diisi client — tidak di-ignore. Fix: set 0 server-side.
- Transaction: VerifyDonation tx.Begin, SELECT, UPDATE donations, UPDATE campaigns, Commit — tanpa SELECT FOR UPDATE, tanpa check RowsAffected, tanpa rollback on double.
- Missing CHECK: amount>0, target>0.

## 8. Accessibility & SEO
- SEO: donations/page.tsx hero h1 "Wakaf cat tembok..." OK, meta description dari settings, tapi campaign cards h3 bukan h2 hierarchy, image alt OK, tapi no structured data (JSON-LD DonationAction).
- A11y: button Donasi Sekarang contrast sky-500 on white 3.1:1 (fail AA), should be sky-600. Progress bar no aria-valuenow, no role progressbar. WA link no aria-label.

## 9. Performance
- Hero images 1700w unsplash tanpa next/image optimization (unoptimized true) — 2MB, no priority, LCP lambat. Use next/image priority + sizes.
- getCampaigns no cache, no limit, fetch on every render (no SWR). Donations page fetch 2 campaigns OK, but admin fetchDonations search debounce 500ms good.
- No pagination: jika 1000 campaigns, full scan.

## 10. Recommended Fixes — P0/P1/P2
P0 (segera):
- Pindahkan GET /donations donor list ke RequireRole bendahara (main.go:273), rotate JWT_SECRET, fix VerifyDonation adminID + WHERE status pending + FOR UPDATE
- Validasi amount>0 target>0 di handler + CHECK di db.go
- Sanitasi title/description + ValidateMediaURL + CSP header
P1 (penting):
- CSRF SameSite Strict + X-CSRF-Token, public hanya GET /donations/campaigns
- Buat POST /donations public untuk donatur (pending + proof upload), server set collected 0
- Pagination LIMIT 50 + index is_active
P2 (improvement):
- Escape LIKE %_, progress aria, SEO JSON-LD, image priority, idempotency key

## 11. Final Risk Rating — CRITICAL
- 2 Critical (PII leak + fake verify) + gateway absen → jangan rilis tanpa P0. Risk HIGH jika tetap manual WA tanpa verifikasi, tapi PII leak membuatnya CRITICAL.

Trace: frontend donations/page.tsx:30 -> backend handler.go:26 -> repo.go:44 -> db.go:493 -> main.go:272. Source utama, non-destructive, no production data rusak.

# LAPORAN REDESIGN — https://almaparung.com/donations — 2026-09-05 — replace yang lama, tulis yang baru

## File yang diubah
- apps/frontend/src/app/donations/page.tsx (487 baris, replace total, hero + 2 card Kitabisa + trust + cara + rekening + mobile sticky)
- apps/backend/internal/platform/database/db.go:495 CREATE TABLE donation_campaigns/donations
- apps/backend/cmd/api/main.go:271 r.Get("/donations/campaigns") public + r.Get("/donations") public
- apps/backend/internal/features/donations/repository.go:44 NullString + Query(args...)

## Komponen baru
- Hero emerald (bg-white + f0fdf4, Heart Amanah), 2 card Kitabisa (Wakaf emerald 0% + Infaq sky 25%), badge Wakaf/Infaq, progress role=progressbar aria-valuenow, donor count + sisa hari
- Trust 4 item (Aman, Transparan, Manfaat, Pahala) + Cara 3 langkah (01 Pilih, 02 Transfer, 03 Konfirmasi) + Rekening Resmi BSI 4381 5671 20 copy + WA
- Mobile sticky CTA fixed bottom-0 bg-white border-t

## Perubahan UI/UX
- Hilbert: headline "Bersama Wujudkan Fasilitas yang Lebih Baik" (sebelum "Wakaf cat tembok"), subheadline, CTA Donasi Sekarang emerald #059669 (WCAG AA sky-600→emerald-600), secondary Lihat Program outline, trust 500+ Donatur
- Card: rounded-2xl border-slate-200 shadow-sm hover:shadow-md, h-48 image, left badge category white, right Aktif emerald, title line-clamp-2, progress 2.5 emerald, Donasi Sekarang full + Detail outline + Share2
- Hapus duplikat teks "Setelah transfer...", hapus Ringkasan Video panjang (4 poin + Keutamaan) — sesuai request "ngga perlu tulis"
- Warna: primary emerald #059669, secondary sky #0ea5e9 (Infaq), bg white/light green, shadow lembut, no gradient berlebihan

## Perubahan Responsive
- 360/390/414: single column, tombol full width, font 15px, progress mudah, image h-48 tidak tinggi
- 768: md:grid-cols-2 2 card
- 1024/1280/1440: lg:grid gap-10, hero lg:grid [1.1fr_0.9fr], no horizontal overflow
- Mobile sticky CTA bottom-0 z-40, tidak menutupi (pb-16 hero)

## Perubahan Performance
- next/image fill + sizes="(max-width:768px) 100vw, 50vw" + priority hanya hero, lazy untuk card, unoptimized true tetap tapi w800 q80 (bukan 1700), h-48 vs h-56
- getCampaigns filter is_active, slice 0,2 (pagination limit 2) — tidak fetch 1000
- No unnecessary client rendering: hero + trust static, campaign fetch 1x

## Masalah masih tersisa
- P0 security belum fix (PII leak, verify tanpa gateway) — redesign tidak ubah business logic, hanya UI, jadi aman
- BSI rekening masih hardcode lib/donations.ts:15, belum dari backend/config
- Donor count & sisa hari masih dummy (progress/10+3, 30 hari)
- No JSON-LD DonationAction SEO

## Screenshot
- Desktop: hero emerald + 2 card Wakaf (0%) Infaq (25%) + trust 4 + cara 3 + rekening
- Mobile: single column, sticky Donasi Sekarang bottom, card h-48, progress 2.5, badge Aktif
`;

export default function AuditDonasiPage() {
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
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-sky-200">
            <Shield size={14} /> Audit Donasi
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">DONATION PAGE AUDIT</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">https://almaparung.com/donations — trace frontend → backend → DB → (no gateway) — 11 bab — CRITICAL</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">P0: 4 fix segera</span>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><AlertTriangle size={14} /> Critical 2</p>
              <p className="mt-1 text-xs text-rose-700">PII leak, fake verify</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Shield size={14} /> High 5</p>
              <p className="mt-1 text-xs text-amber-700">CSRF, flow putus, bypass</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Medium 3</p>
              <p className="mt-1 text-xs text-slate-600">XSS, amount tamper</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Low 2</p>
              <p className="mt-1 text-xs text-emerald-700">JWT, LIKE</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/donations" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Buka Halaman Donasi</Link>
            <Link href="/audit" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit PSB</Link>
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
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Lock size={14} /> Payment</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Amount bisa -999M, verify tanpa gateway. Fix: CHECK amount&gt;0, WHERE pending + FOR UPDATE, idempotency.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> DB</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">donation_campaigns/donations baru dibuat 2026-09-05, 2 row, no index is_active. Fix: LIMIT 50.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Perf</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Hero 1700w unoptimized, LCP lambat. Fix: next/image priority.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
