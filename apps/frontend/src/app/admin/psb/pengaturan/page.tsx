'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import TabHalamanPSB from '@/app/admin/settings/tabs/TabHalamanPSB';
import TabTesSeleksi from './TabTesSeleksi';

const TABS = [
  { id: 'halaman', label: 'Halaman PSB' },
  { id: 'tes', label: 'Tes Seleksi' },
  { id: 'pembayaran', label: 'Pembayaran PSB' },
  { id: 'data', label: 'Data Pendaftar' },
] as const;

export default function PsbPengaturanPage() {
  const [active, setActive] = useState<string>('halaman');

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Pengaturan PSB</h1>
      <p className="mt-1 text-sm text-slate-600">Semua pengaturan PSB dalam satu tempat.</p>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-bold ${
              active === t.id
                ? 'border-b-2 border-sky-600 text-sky-700'
                : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {active === 'halaman' && <TabHalamanPSB />}
        {active === 'tes' && <TabTesSeleksi />}
        {active === 'pembayaran' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Pengaturan pembayaran PSB pindah ke Pengaturan Website agar satu pintu dengan rekening Donasi &amp; SPP.</p>
            <Link
              href="/admin/settings?tab=No.%20Rekening"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Buka Pengaturan No. Rekening →
            </Link>
          </div>
        )}
        {active === 'data' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Data pendaftar ada di halamannya sendiri.</p>
            <Link
              href="/admin/psb"
              className="mt-3 inline-block rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Buka Data Pendaftar →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
