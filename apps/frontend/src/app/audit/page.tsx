'use client';

// Halaman /audit baru (jilid 11, 2026-09-19): audit ALUR PSB -> santri.
// Menggantikan halaman scorecard 17 Sep (fokus temuan lama). Isi di bawah
// ditarik dari kode: psb/repository.go, santri/*, portal/*, payments.

import PublicLayout from '@/components/PublicLayout';
import {
  AlertTriangle, ArrowDown, CheckCircle2, Database, FileCheck2,
  ShieldCheck, UserCheck, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type Step = {
  no: string;
  title: string;
  desc: string;
  guard: string;
  ref: string;
};

const STEPS: Step[] = [
  {
    no: '01',
    title: 'Daftar akun + biodata',
    desc: 'Wali buat akun portal, isi biodata santri & orang tua lewat wizard 4 langkah (data diri, ortu, dokumen, bayar).',
    guard: 'NIK 16 digit + HP valid dicek frontend dan backend; data tersimpan per langkah.',
    ref: 'portal/biodata + validators',
  },
  {
    no: '02',
    title: 'Unggah dokumen',
    desc: 'KK, ijazah/raport, pas foto 3x4. Terkunci sampai biodata lengkap.',
    guard: 'Normalisasi URL tunggal; gagal upload tidak merusak data lama.',
    ref: 'portal/documents + lib/upload',
  },
  {
    no: '03',
    title: 'Bayar formulir',
    desc: 'Transfer manual + bukti. Panitia verifikasi; kwitansi KWI terbit saat lunas.',
    guard: 'Ledger idempoten (satu baris per registrasi); nominal selisih = warning, bukan blokir.',
    ref: 'psb/repository.go ledger',
  },
  {
    no: '04',
    title: 'Review panitia',
    desc: 'Status pending/review. Form wali dikunci otomatis saat berkas diproses.',
    guard: 'Transisi status via map (ilegal → 422); edit-lock 403 saat review/tes/accepted.',
    ref: 'psb/repository.go psbStatusTransitions',
  },
  {
    no: '05',
    title: 'Tes seleksi',
    desc: 'Jadwal + lokasi tampil di portal + WA. Nilai tes tercatat.',
    guard: 'Undangan hanya untuk status tes; hasil via pengumuman + portal.',
    ref: 'portal (tes) + admin/psb',
  },
  {
    no: '06',
    title: 'Diterima + daftar ulang',
    desc: 'accepted → re_registration dengan batas waktu. Wali menyelesaikan daftar ulang.',
    guard: 'accepted wajib paid; deadline tercatat; pengumuman bisa dicek tanpa login.',
    ref: 'psb/page status + psb/status',
  },
  {
    no: '07',
    title: 'Pindah jadi santri',
    desc: 'Satu klik panitia menyalin pendaftar menjadi santri: NIS tahun+urutan, NIK, ayah/ibu, pasfoto, tautan registrasi. Status registrasi jadi terminal.',
    guard: 'Syarat paid + accepted; cegah ganda via user_id; semua dalam SATU transaksi DB; pindah ulang & hapus ditolak 409.',
    ref: 'psb/repository.go AcceptToSantri',
  },
  {
    no: '08',
    title: 'Santri aktif',
    desc: 'NIS, kelas, SPP/iuran, raport, presensi, wallet — dengan AKUN WALI YANG SAMA (user_id terbawa).',
    guard: 'Akun wali berlanjut tanpa daftar ulang; arsip PSB dipertahankan.',
    ref: 'santri/* + portal',
  },
];

const MAPPING: Array<[string, string, string]> = [
  ['Nama lengkap', 'registrations.full_name', 'santri.name'],
  ['NIK', 'registrations.nik', 'santri.nik'],
  ['Ayah (nama + HP)', 'registrations.father_*', 'santri.father_*'],
  ['Ibu (nama + HP)', 'registrations.mother_*', 'santri.mother_*'],
  ['Pas foto', 'registrations.pasfoto_url', 'santri.photo_url'],
  ['Program pilihan', 'registrations.program_choice', 'santri.class'],
  ['Akun wali', 'registrations.user_id', 'santri.user_id (sama)'],
  ['Tautan balik', 'registrations.id', 'santri.registration_id'],
  ['NIS (baru)', 'dibangkitkan tahun+urutan', 'santri.nis'],
  ['Arsip (tetap di PSB)', 'ledger bayar, dokumen, nilai tes, catatan tolak', 'tidak disalin'],
];

const PASS = [
  'Transisi status guarded (ilegal → 422) + edit-lock portal.',
  'Pembayaran idempoten + kwitansi KWI bernomor urut.',
  'Anti-ganda pindah santri (cek user_id) + transaksi atomik.',
  'NIK + ayah/ibu + pasfoto + tautan tersalin (jilid 10).',
  'Akun wali berlanjut; arsip PSB tak bisa dihapus bila sudah jadi santri.',
];

const OPEN = [
  'Santri lama (sebelum migrasi kolom) NIK/ortu-nya kosong — terisi pada pemindahan berikutnya atau edit manual.',
  'NIK santri belum dicek duplikat di backend (baru format). Duplikat antar-santri masih mungkin.',
  'Akun wali yang belum ditautkan (user_id NULL) tak melihat tagihan & rapor di portal — tautkan via admin Data Santri.',
];

export default function AuditPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={30} className="text-emerald-600" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Audit Alur</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Alur PSB → Santri</h1>
            <p className="mt-1 text-sm text-slate-500">
              19 September 2026 · ditarik dari kode (bukan klaim) · menggantikan halaman audit 17 September.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-0">
          {STEPS.map((s, i) => (
            <div key={s.no} className="relative flex gap-4 pb-2">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 font-black text-white">
                  {s.no}
                </div>
                {i < STEPS.length - 1 && <ArrowDown size={16} className="my-1 text-slate-300" />}
              </div>
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-black text-slate-900">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{s.desc}</p>
                <p className="mt-2.5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold leading-5 text-emerald-800">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  {s.guard}
                </p>
                <p className="mt-2 font-mono text-xs text-slate-400">{s.ref}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-sky-700">
            <Database size={16} /> Peta data: PSB → santri
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 font-bold">Data</th>
                  <th className="px-3 py-2 font-bold">Asal (PSB)</th>
                  <th className="px-3 py-2 font-bold">Tujuan (santri)</th>
                </tr>
              </thead>
              <tbody>
                {MAPPING.map(([label, from, to]) => (
                  <tr key={label} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{label}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{from}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-700">
              <CheckCircle2 size={16} /> Terverifikasi ({PASS.length})
            </h2>
            <ul className="mt-3 space-y-2.5">
              {PASS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-600" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700">
              <AlertTriangle size={16} /> Catatan terbuka ({OPEN.length})
            </h2>
            <ul className="mt-3 space-y-2.5">
              {OPEN.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <AlertTriangle size={15} className="mt-1 shrink-0 text-amber-600" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/psb"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-sky-700"
          >
            <FileCheck2 size={16} /> Lihat Info PSB
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300"
          >
            <UserCheck size={16} /> Buka Portal Wali
          </Link>
          <Link
            href="/donations"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300"
          >
            <Wallet size={16} /> Donasi
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
