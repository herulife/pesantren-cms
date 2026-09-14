'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, ShieldCheck, AlertTriangle, Copy, Check, Database, GitBranch, FlaskConical, Rocket, RotateCcw, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const phases: Array<[string, string, string]> = [
  ['PHASE 0', 'Discovery & baseline', '8 dokumen: REPAIR_PLAN, INVENTORY, ROUTE, RBAC, DB, API, DEPLOY, FINDINGS'],
  ['PHASE 1', 'Backup & recovery', 'Script WAL-safe + cron daily/weekly + runbook + off-host + drill PASS'],
  ['PHASE 2', 'Auth & sesi', 'token_version+jti, revokasi logout/reset/role, helper tunggal, adminID:=1 hapus'],
  ['PHASE 3', 'RBAC', 'FAQ/agenda terkunci, HR dipersempit, /psb/me didedupe (C8)'],
  ['PHASE 4', 'PII & upload', 'DTO donasi/guru, proofs privat berauth, nama acak, webp→png'],
  ['PHASE 5', 'DB integrity', '13 index hot-path, idempotency cols+UNIQUE, receipt_no UNIQUE'],
  ['PHASE 6', 'Financial engine', 'IMMEDIATE + conditional update + receipt seq + reversal + idempoten; conc-test 100 PASS'],
  ['PHASE 7', 'Audit log', 'audit_logs + hook semua mutasi kritis, retensi saat user dihapus'],
  ['PHASE 8–12', 'Domain', 'Santri DTO+unlink, PSB state machine, kas void+idempoten, donasi guard'],
  ['PHASE 13–18', 'Akademik', 'Predikat100, raport lock+unlock, CBT/exam guards, PIN-lama'],
  ['PHASE 19–21', 'API & FE', '409 codes, kind=proof, kontrak + 4 dokumen'],
  ['PHASE 22', 'Deploy', '/ready, graceful shutdown, trusted-proxy, healthcheck, DB path tunggal'],
  ['PHASE 23–24', 'Test & staging', 'Full suite hijau; tanpa staging → backup+rollback diperketat'],
  ['PHASE 25', 'Final audit', 'Re-grep bersih; sisa legacy dibersihkan'],
  ['PHASE 26', 'Go-live', 'Image :new, migrasi PASS, smoke 443 PASS, healthy×2'],
];

const fixes: Array<[string, string, string]> = [
  ['C2', 'adminID:=1 hardcoded', 'Helper auth tunggal'],
  ['C5/R5', 'Receipt MAX()+1', 'receipt_sequences + UNIQUE (SPP/iuran/legacy)'],
  ['C6/R3', 'Cancel tanpa reversal', 'Baris reversal + rekap decrement'],
  ['C7', 'Re-upload reset paid', 'Guard paid/verified + 400 locked'],
  ['C8', 'Duplikat /psb/me', 'Dihapus dari mount staff'],
  ['C11', 'Predikat 82.58 = Sangat Baik', 'Predikat100 + 12 boundary test'],
  ['S-N1', 'proof_url bebas', 'ValidateProofURL (SPP/iuran)'],
  ['S-N3', 'Proofs publik', 'Privat berauth+ownership (baru); legacy = known issue'],
  ['S-N5', 'Tanpa revokasi', 'token_version; logout/reset/role bump'],
  ['S-N8', 'Mass assignment', 'SantriInput DTO'],
  ['S-N9', 'Rate-limit salah IP', 'Trusted-proxy (XFF terakhir)'],
  ['S-N11', 'PIN tanpa verifikasi lama', 'Wajib PIN lama + bcrypt persisten'],
  ['S-N13', 'Verify tanpa audit', 'VERIFY_*/PAY_*/CANCEL_* di audit_logs'],
  ['S-N15', 'Actor=0', 'Helper tunggal (auth/spp/iuran/kas/payments/wallet)'],
  ['API#1', 'FAQ/agenda any-auth', 'RequireRole superadmin/tim_media'],
  ['M-N2/R1–R4', 'Race uang', 'IMMEDIATE + conditional + idempoten + retry'],
  ['A3/A4', 'Preview≠save; lock semu', 'Engine tunggal + lock + Unlock beraudit'],
  ['W1', 'Broadcast legacy', 'Dipertahankan + agregat follow-up'],
];

const smoke: Array<[string, string, string]> = [
  ['GET / (homepage)', '200', 'ok'],
  ['GET /login', '200', 'ok'],
  ['GET /portal (tanpa sesi)', '307 guard', 'ok'],
  ['GET /api/health', '200 OK', 'ok'],
  ['GET /api/ready', 'READY', 'ok'],
  ['GET /api/teachers', 'tanpa email/WA', 'ok'],
  ['POST /api/faqs (anonim)', '401', 'ok'],
  ['GET /uploads/proofs/x (anonim)', '401', 'ok'],
  ['POST /api/login (salah)', '401', 'ok'],
  ['go test ./... (14 paket)', 'PASS', 'ok'],
  ['tsc --noEmit (frontend)', 'bersih', 'ok'],
  ['docker healthcheck', 'healthy ×2', 'ok'],
];

const remaining = [
  'Proofs & dokumen PSB legacy di /uploads root masih publik → backfill pindah + tulis ulang URL.',
  'GET /api/donations ter-bayangi mount bendahara (pre-existing); FE memakai /list + /campaigns.',
  'Role admin zombie: migrasi tiap boot dipertahankan; finalisasi butuh keputusan bisnis.',
  'Ambang Predikat100 (87.75/62.75/37.75) butuh konfirmasi sekolah vs KKM.',
  'Tanpa staging: diganti backup pre-deploy + rollback image + drill tercatat.',
];

const ops = [
  'Umumkan RE-LOGIN massal sekali (token lama ditolak).',
  'Jaga cron backup + salinan off-host mingguan.',
  'Jalankan backfill proofs sebelum unggahan sensitif berikutnya.',
  'Konfirmasi ambang predikat + nasib role admin ke pemilik bisnis.',
];

export default function AuditLaporanPage() {
  const [copied, setCopied] = useState(false);
  const summary = `LAPORAN PERBAIKAN FINAL ALMAPARUNG 2026-09-14 — VERDICT: PRODUCTION READY (bersyarat). 27 phase selesai, 12 commit, P0 habis. Backend+frontend di-deploy ulang, migrasi PASS, smoke 443 PASS. Syarat: re-login massal, jaga backup, backfill proofs legacy, konfirmasi predikat + role admin.`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summary;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 py-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-200">
            <ClipboardList size={14} /> Laporan Perbaikan Final
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">LAPORAN PERBAIKAN ALMAPARUNG</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Full repair, hardening &amp; production readiness — 14 September 2026. 27 phase, 12 commit, seluruh P0 diperbaiki dan teruji.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white"><ShieldCheck size={14} /> PRODUCTION READY (bersyarat)</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">27 phase selesai</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">P0 habis</span>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900 hover:bg-slate-100">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin!' : 'Copy Ringkasan'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Rocket size={14} /> Go-live</p>
              <p className="mt-1 text-xs text-emerald-700">Image :new, migrasi boot PASS, smoke 443 PASS, healthy ×2</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-700"><GitBranch size={14} /> 12 commit</p>
              <p className="mt-1 text-xs text-sky-700">Per phase, build+vet+test hijau tiap commit</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-700"><FlaskConical size={14} /> Test</p>
              <p className="mt-1 text-xs text-violet-700">14 paket PASS + conc-test 100 goroutine + tsc bersih</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><RotateCcw size={14} /> Rollback</p>
              <p className="mt-1 text-xs text-amber-700">Image :pre-phase26 + backup + RESTORE_RUNBOOK</p>
            </div>
          </div>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-black text-slate-900"><Shield size={18} /> Eksekusi per phase</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Fokus</th>
                  <th className="px-4 py-3">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {phases.map(([p, f, h]) => (
                  <tr key={p} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-2.5 font-black text-slate-900">{p}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-bold text-slate-700">{f}</td>
                    <td className="px-4 py-2.5 text-slate-600">{h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-black text-slate-900"><ShieldCheck size={18} /> Temuan → perbaikan</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Temuan</th>
                  <th className="px-4 py-3">Perbaikan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {fixes.map(([id, t, f]) => (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-2.5 font-black text-slate-900">{id}</td>
                    <td className="px-4 py-2.5 text-slate-600">{t}</td>
                    <td className="px-4 py-2.5 text-slate-600">{f}</td>
                    <td className="px-4 py-2.5"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">FIXED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-black text-slate-900"><AlertTriangle size={18} /> Sisa non-P0 (diketahui &amp; tercatat)</h2>
          <ul className="mt-3 space-y-2">
            {remaining.map((r, i) => (
              <li key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{r}</li>
            ))}
          </ul>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-black text-slate-900"><Database size={18} /> Verifikasi &amp; smoke test</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Uji</th>
                  <th className="px-4 py-3">Hasil</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {smoke.map(([u, h, s]) => (
                  <tr key={u} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-bold text-slate-700">{u}</td>
                    <td className="px-4 py-2.5 text-slate-600">{h}</td>
                    <td className="px-4 py-2.5"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">{s === 'ok' ? 'PASS' : s}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-black text-slate-900"><ClipboardList size={18} /> Syarat operasi</h2>
          <ul className="mt-3 space-y-2">
            {ops.map((o, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">{i + 1}</span>
                {o}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Beranda</Link>
            <Link href="/audit-gpt" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit 2026-09-14</Link>
            <Link href="/audit-full" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit 2026-09-13</Link>
          </div>
          <p className="mt-6 text-xs leading-5 text-slate-400">Detail teknis lengkap (database, API, security, rollback, SPEC_GAP): docs/FINAL_REPAIR_REPORT.md di repository. Baseline production 2026-09-14 10:29 UTC.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
