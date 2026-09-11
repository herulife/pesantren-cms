'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Lock, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# TAGIHAN SPP AUDIT — https://almaparung.com/admin/payments (tab Tagihan SPP) — 2026-09-11
Modul: generate tagihan/bulan, bayar penuh/sebagian, ringkasan tunggakan. Backend spp_bills + endpoint /api/spp/* (bendahara). Tanpa gateway (catat manual). TIDAK UBAH KODE — laporan saja.

## 1. Executive Summary — CRITICAL 0 / HIGH 2 / MEDIUM 5 / LOW 5
- Backend Go (spp/repository.go, handler.go), tabel spp_bills, 8 endpoint, unit test 4/4 lolos (satu test menemukan bug rollback transaksi sebelum rilis — sudah diperbaiki).
- High: (H1) Summary 500 saat periode kosong — TERBUKTI live (tabel masih kosong, tiap buka tab kena); (H2) UpdateBill sukses palsu untuk id tidak ada.
- Tidak ada PII leak (tidak ada data pribadi di response), tidak ada payment gateway yang bisa dimanipulasi (manual).
- Verdict: Siap dipakai dengan catatan — perbaiki P0 sebelum bulan baru. Risk: MEDIUM.

## 2. UI/UX — tab Tagihan SPP di admin/payments (SppBills.tsx)
- File: SppBills.tsx (tab, 3 kartu ringkasan, tabel + progress, 3 modal: generate/satuan/bayar), page.tsx (tab Tagihan/Manual).
- Baik: empty state jelas ("Generate Sebulan..."), badge Belum/Sebagian/Lunas berwarna + teks (tidak warna saja), tombol Bayar hilang saat lunas, tombol Batal/Hapus ada konfirmasi ConfirmDialog, input bayar dibatasi max=sisa, format Rp id-ID + "September 2026".
- Temuan: progress bar tanpa role/aria (M5); modal tanpa tombol Esc/focus-trap, tutup via backdrop/X saja (M5, pola sama dengan modal lama); tombol Bayar/Buat Tagihan/Simpan tanpa status loading — klik ganda = 2 POST (M3).
- Rekom: tambah role="progressbar" aria-valuenow, disabled+spinner saat submit, Esc untuk modal.

## 3. Functionality — langkah reproduksi
- Pilih periode 2026-09 -> Generate Sebulan nominal 150000 -> backend buat 10 tagihan (10 santri aktif), duplikat dilewati (INSERT OR IGNORE) + pesan "X baru, Y sudah ada".
- Bayar 50000 -> status Sebagian 33%; bayar 200000 saat sisa 100000 -> ditolak 422 "melebihi sisa"; lunasi sisa -> Lunas, tombol Bayar hilang.
- Batalkan -> kembali Belum Bayar (seluruh riwayat cicilan hilang — M4). Hapus tagihan berbayar -> ditolak 422. Hapus tagihan 0-bayar -> OK.
- Ubah nominal di bawah yang sudah dibayar -> ditolak 422. Ubah id tidak ada -> 200 palsu (H2).
- Periode kosong (tanpa tagihan) -> ringkasan 500 (H1), UI tetap tampil 0 (catch -> null).

## 4. Security
- Auth OK: mount bendahara (main.go bendahara group), superadmin bypass by design (middleware.go:106). Live: /api/spp/* tanpa token -> 401 semua (bills, santri, summary, generate). TIDAK ada endpoint publik.
- Secrets: tidak ada key/token di modul ini. JWT_SECRET dkk tak tersentuh.
- XSS Low: nama santri/catatan di-render sebagai teks React (escape otomatis), tanpa dangerouslySetInnerHTML. Santri diinput admin, bukan publik.
- SQLi aman: semua query parameterized (?), tanpa string concat, tanpa LIKE.
- CSRF Medium (postur app-wide, bukan spesifik modul): cookie alma_token SameSite=Lax tanpa token anti-CSRF — sama seperti modul lain.
- Amount manipulation: DITOLAK server — generate/create/update wajib >0 (422), bayar wajib 1..sisa (422), duplikat periode -> 409, hapus-berbayar -> 422. paid_amount TIDAK bisa di-set client (tidak ada field di endpoint pay).
- Bypass validasi: periode regex YYYY-MM di semua endpoint; status filter allowlist; santri_id>0 dicek. Celah: paid_at bebas string apa saja (M3-medium: junk tersimpan), due_date masa lalu boleh (L2).
- Race: PayBill aman (tx + serialized SQLite; double-submit serialized -> yang kedua 422 bersih). DeleteBill/UpdateBill check-then-act (H2/M1): bayar yang masuk di antara cek-hapus bisa terhapus.

## 5. Payment Security
- Tanpa gateway: tidak ada webhook/callback/transaction-ID yang bisa dipalsukan. Kepercayaan = akun bendahara.
- Duplikat: generate idempotent (UNIQUE santri+periode + INSERT OR IGNORE, teruji). Bayar ganda: diserialkan DB, kelebihan ditolak 422.
- Idempotency key: tidak ada (M). Klik ganda tombol Bayar tanpa disable = 2 POST; hasil akhir tetap benar (kedua 422) tapi toast ganda membingungkan.
- Verifikasi pembayaran: manual oleh bendahara (tidak ada bukti transfer/foto di modul ini — tercatat di method/catatan saja).
- Trust boundary: client hanya kirim nominal; status/sisa dihitung server. Benar.

## 6. Backend/API — 8 endpoint (semua bendahara-only, 401 tanpa token — live)
- GET /spp/santri -> santri aktif (id/nis/nama/kelas), untuk dropdown.
- GET /spp/bills?period=&status=&santri_id= -> JOIN santri, tanpa pagination (M2).
- GET /spp/bills/summary?period= -> total/terkumpul/tunggakan + count. BUG: periode kosong -> 500 (H1).
- POST /spp/bills/generate {period, amount, due_date?} -> {created, skipped}, idempotent.
- POST /spp/bills (satuan, duplikat -> 409), PUT /spp/bills/{id} (false-success bila id hantu — H2).
- POST /spp/bills/{id}/pay {amount, method?, paid_at?, notes?} (422 bila >sisa/sudah lunas), POST /spp/bills/{id}/cancel, DELETE /spp/bills/{id} (422 bila berbayar).
- Chi route /bills/summary vs /bills/{id}: static menang — terbukti live (summary -> 401 auth, bukan 404).
- Error shape konsisten {success,message,(errors|data)}; activity log tercatat (GENERATE/CREATE/UPDATE/PAY/CANCEL/DELETE_SPP).

## 7. Database
- spp_bills: id, santri_id FK->santri(id), period, amount, paid_amount default 0, status default unpaid, due_date, paid_method, paid_at NULL, notes, created_at/updated_at, UNIQUE(santri_id,period), INDEX period. Aman: santri tidak pernah dihapus (hanya user_id di-NULL), jadi FK tidak yatim.
- Kurang CHECK constraints (amount>0 hanya di kode). Saran P2: CHECK(amount>0), CHECK(paid_amount>=0).
- Bukti live: tabel ada (12 kolom), kosong (0 row) -> summary 500 terkonfirmasi via query langsung: (0,0,0,None,None,None).

## 8. Accessibility & SEO
- SEO: halaman admin, robots.ts disallow /admin/ — tidak diindeks. OK.
- A11y: badge status ada teks (baik); progress tanpa role/aria (M5); input bertipe (month/number/date) baik; aria-label tombol ikon: Bayar ada title, ikon-only (batal/ubah/hapus) hanya title (tambah aria-label — L).

## 9. Performance
- List 1 query JOIN; summary 1 query agregat; generate N exec (10 santri OK; catat bila >500 santri).
- Tanpa pagination (M2): 10 santri x bulan = ratusan row masih ringan; tambah limit/offset mengikuti pola payments bila >1000.
- Frontend: 3 request paralel per ganti periode (bills+summary+santri), no-store, tabel client-render ringan.

## 10. Recommended Fixes
P0 (sebelum bulan baru dipakai):
- H1: bungkus 3 SUM(CASE) dengan COALESCE(...,0) di Summary.
- H2: cek RowsAffected di UpdateBill -> 404 bila id tidak ada.
P1 (penting):
- M1: DELETE/UPDATE bersyarat atomik (WHERE paid_amount=0 / paid_amount<=?) + RowsAffected.
- M2: pagination ListBills (limit/offset ala payments GetAll).
- M3: disable tombol saat submit (isSaving) + validasi format paid_at (YYYY-MM-DD HH:MM:SS).
P2 (improvement):
- M4/L: riwayat pembayaran per tagihan (tabel spp_payments) agar batal tidak menghapus jejak; aria progressbar + Esc modal + aria-label ikon; CHECK constraints; sanitasi notes length.

## 11. Final Risk Rating — MEDIUM
- 0 Critical. 2 High non-eksploitatif (500 + false-success, tanpa kebocoran/kerugian dana). 5 Medium, 5 Low. Unit test 4/4 + validasi server kuat + auth benar. Layak produksi setelah P0.
- JANGAN ubah kode sebelum disetujui — hanya laporan.

Trace: SppBills.tsx + page.tsx -> lib/api.ts (getSppBills/getSppSummary/...) -> main.go bendahara group -> spp/handler.go -> spp/repository.go -> spp_bills. Verifikasi live: 401 semua endpoint, tabel ada, bundle FE memuat "Generate Sebulan".
`;

export default function AuditSppPage() {
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
            <Shield size={14} /> Audit Tagihan SPP
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">TAGIHAN SPP AUDIT</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">https://almaparung.com/admin/payments (tab Tagihan SPP) — trace frontend → backend → DB. 11 bab — MEDIUM.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">P0: 2 fix (summary kosong + update hantu)</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">Risk: MEDIUM</span>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-600">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin!' : 'Copy Audit'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><Shield size={14} /> Critical 0</p>
              <p className="mt-1 text-xs text-slate-500">Tanpa kebocoran/kerugian dana</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><AlertTriangle size={14} /> High 2</p>
              <p className="mt-1 text-xs text-amber-700">Summary 500, update hantu</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Medium 5</p>
              <p className="mt-1 text-xs text-slate-600">Race, paging, submit ganda</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Low 5</p>
              <p className="mt-1 text-xs text-emerald-700">A11y, kode mati, catatan</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/admin/payments" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Buka Tagihan SPP</Link>
            <Link href="/audit-donasi" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit Donasi</Link>
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
              <p className="mt-2 text-xs leading-6 text-slate-600">Nominal tervalidasi server (tolak negatif/lebih). Tanpa gateway — bendahara tepercaya.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> DB</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">UNIQUE santri+periode, index periode, FK santri aman. Summary kosong perlu COALESCE.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Perf</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">1 query JOIN + 1 agregat per periode. Generate N exec — ringan untuk 10 santri.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
