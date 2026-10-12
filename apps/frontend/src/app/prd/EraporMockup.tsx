'use client';

import React, { useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Minus, RefreshCw, XCircle } from 'lucide-react';

type Tab = 'kelengkapan' | 'log' | 'selisih';

type Stat = {
  label: string;
  value: string;
  sub: string;
  bar?: number;
  tone: 'emerald' | 'sky' | 'slate' | 'amber';
};

const STATS: Stat[] = [
  {
    label: 'NISN lengkap',
    value: '218 / 231',
    sub: '13 santri belum punya NISN',
    bar: 94,
    tone: 'emerald',
  },
  {
    label: 'Nilai lengkap semester ini',
    value: '214 / 231',
    sub: '7 santri menunggu nilai mapel',
    bar: 93,
    tone: 'sky',
  },
  {
    label: 'Ekspor terakhir',
    value: '5 Okt 2026',
    sub: 'Data pokok · 231 baris · Berhasil',
    tone: 'slate',
  },
  {
    label: 'Selisih vs EMIS',
    value: '3 santri',
    sub: '2 di alma tak ada di EMIS, 1 sebaliknya',
    tone: 'amber',
  },
];

const KELENGKAPAN = [
  { nama: 'Aisyah Rahmawati', kelas: '7', nis: '20260011', nisn: '', nik: true },
  { nama: 'Muhammad Rizki Ananda', kelas: '8', nis: '20250134', nisn: '0091234567', nik: true },
  { nama: 'Siti Maryam', kelas: '9', nis: '20240076', nisn: '', nik: false },
  { nama: 'Abdul Karim Hakim', kelas: '10', nis: '20230045', nisn: '0087654321', nik: true },
  { nama: 'Zainab Nur Fadhilah', kelas: '11', nis: '20220018', nisn: '', nik: true },
  { nama: 'Hafidz Maulana', kelas: 'PSB', nis: '20270003', nisn: '', nik: true },
];

const LOG = [
  {
    waktu: '5 Okt 2026 · 09:12',
    jenis: 'Data pokok',
    periode: 'Ganjil 2026/2027',
    baris: '231',
    status: 'Berhasil',
    catatan: '',
  },
  {
    waktu: '5 Okt 2026 · 09:14',
    jenis: 'Nilai',
    periode: 'Ganjil 2026/2027',
    baris: '1.204',
    status: 'Berhasil',
    catatan: '',
  },
  {
    waktu: '28 Sep 2026 · 16:40',
    jenis: 'Data pokok',
    periode: 'Genap 2025/2026',
    baris: '229',
    status: 'Berhasil',
    catatan: '',
  },
  {
    waktu: '12 Sep 2026 · 10:02',
    jenis: 'Nilai',
    periode: 'Ganjil 2026/2027',
    baris: '0',
    status: 'Gagal',
    catatan: '21 baris nilai tanpa mata pelajaran yang cocok',
  },
];

const SELISIH = [
  {
    nama: 'Zainab Nur Fadhilah',
    alma: 'Ada · kelas 11',
    emis: 'Tidak ada',
    tindakan: 'Tambahkan di EMIS',
    tone: 'rose' as const,
  },
  {
    nama: 'Budi Santoso Pratama',
    alma: 'Tidak ada',
    emis: 'Ada · kelas 9',
    tindakan: 'Tambahkan di alma',
    tone: 'amber' as const,
  },
  {
    nama: 'Nurul Kholifah',
    alma: 'Ada · kelas 7',
    emis: 'Ada · kelas 8',
    tindakan: 'Samakan rombel',
    tone: 'amber' as const,
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: 'kelengkapan', label: 'Kelengkapan identitas' },
  { id: 'log', label: 'Log sinkron' },
  { id: 'selisih', label: 'Selisih EMIS' },
];

function toneBar(tone: Stat['tone']) {
  if (tone === 'emerald') return 'bg-emerald-500';
  if (tone === 'sky') return 'bg-emerald-500';
  return 'bg-amber-500';
}

function toneValue(tone: Stat['tone']) {
  if (tone === 'emerald') return 'text-emerald-600';
  if (tone === 'sky') return 'text-emerald-600';
  if (tone === 'amber') return 'text-amber-600';
  return 'text-slate-700';
}

export default function EraporMockup() {
  const [tab, setTab] = useState<Tab>('kelengkapan');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </span>
        <span className="flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-500">
          darussunnahparung.com/admin/erapor
        </span>
        <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:inline">
          Rancangan
        </span>
      </div>

      <div className="bg-slate-50 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-[family-name:var(--font-outfit)] text-lg font-black text-slate-900">
              Sinkron E-Rapor
            </h3>
            <p className="text-xs text-slate-500">
              Format file mengikuti template resmi RDM Kemenag
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              TA 2026/2027 ▾
            </span>
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              Ganjil (1) ▾
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
              <FileSpreadsheet size={13} /> Ekspor Data Pokok
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Download size={13} /> Ekspor Nilai
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <p
                className={`font-[family-name:var(--font-outfit)] mt-1 text-2xl font-black ${toneValue(s.tone)}`}
              >
                {s.value}
              </p>
              {s.bar !== undefined && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${toneBar(s.tone)}`}
                    style={{ width: `${s.bar}%` }}
                  />
                </div>
              )}
              <p className="mt-1.5 text-xs leading-snug text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-1 border-b border-slate-200" role="tablist" aria-label="Tampilan">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-3.5 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                tab === t.id
                  ? 'border-b-2 border-emerald-500 bg-white text-emerald-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 bg-white">
          {tab === 'kelengkapan' && (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Santri</th>
                  <th className="px-4 py-2.5 font-semibold">Kelas</th>
                  <th className="px-4 py-2.5 font-semibold">NIS</th>
                  <th className="px-4 py-2.5 font-semibold">NISN</th>
                  <th className="px-4 py-2.5 font-semibold">NIK</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {KELENGKAPAN.map((k) => (
                  <tr key={k.nis} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{k.nama}</td>
                    <td className="px-4 py-2.5 text-slate-600">{k.kelas}</td>
                    <td className="px-4 py-2.5 text-slate-600">{k.nis}</td>
                    <td className={`px-4 py-2.5 ${k.nisn ? 'text-slate-700' : 'text-rose-500'}`}>
                      {k.nisn || <Minus size={14} aria-label="kosong" />}
                    </td>
                    <td className="px-4 py-2.5">
                      {k.nik ? (
                        <CheckCircle2 size={15} className="text-emerald-500" aria-label="ada" />
                      ) : (
                        <XCircle size={15} className="text-rose-400" aria-label="belum" />
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {k.nisn ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Lengkap
                        </span>
                      ) : k.nik ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          Tanpa NISN
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                          Tanpa NISN &amp; NIK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'log' && (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold">Jenis</th>
                  <th className="px-4 py-2.5 font-semibold">Periode</th>
                  <th className="px-4 py-2.5 font-semibold">Baris</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {LOG.map((l) => (
                  <tr key={l.waktu + l.jenis} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-700">{l.waktu}</td>
                    <td className="px-4 py-2.5 text-slate-600">{l.jenis}</td>
                    <td className="px-4 py-2.5 text-slate-600">{l.periode}</td>
                    <td className="px-4 py-2.5 text-slate-700">{l.baris}</td>
                    <td className="px-4 py-2.5">
                      {l.status === 'Berhasil' ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Berhasil
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          Gagal
                        </span>
                      )}
                      {l.catatan && (
                        <span className="mt-0.5 block text-xs text-rose-500">{l.catatan}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {l.status === 'Berhasil' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Download size={13} /> Unduh
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'selisih' && (
            <div>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Santri</th>
                    <th className="px-4 py-2.5 font-semibold">Di Darussunnah</th>
                    <th className="px-4 py-2.5 font-semibold">Di EMIS</th>
                    <th className="px-4 py-2.5 font-semibold">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {SELISIH.map((s) => (
                    <tr key={s.nama} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{s.nama}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.alma}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.emis}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            s.tone === 'rose'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {s.tindakan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                Selisih diperbarui saat operator mengunggah hasil ekspor dari EMIS, atau lewat
                tarikan data terjadwal.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw size={12} /> Sinkron terakhir: 5 Okt 2026, 09:14
          </p>
          <span className="rounded-lg bg-slate-200/70 px-3 py-1.5 text-xs font-bold text-slate-500">
            Tarik dari EMIS
          </span>
        </div>
      </div>
    </div>
  );
}
