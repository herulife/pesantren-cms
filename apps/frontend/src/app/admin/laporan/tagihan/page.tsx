'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import SppReport from '../../payments/SppReport';
import IuranReport from '../../payments/IuranReport';

type Tab = 'spp' | 'iuran';

// Laporan Tagihan (pengganti menu "Lap. Tagihan" di Mode Classic). Isinya sama
// dengan tab Laporan di /admin/payments: rekap tagihan SPP dan Iuran per Santri.
export default function LaporanTagihanPage() {
  const [tab, setTab] = useState<Tab>('spp');
  const tabCls = (active: boolean) =>
    `px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
      active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
    }`;

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
          <BarChart3 className="text-sky-600" size={32} />
          Laporan Tagihan
        </h1>
        <p className="text-slate-500 text-sm">
          Rekap tagihan per Santri beserta status pembayaran, bisa diekspor ke PDF/Excel.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <button type="button" onClick={() => setTab('spp')} className={tabCls(tab === 'spp')}>
          Tagihan SPP
        </button>
        <button type="button" onClick={() => setTab('iuran')} className={tabCls(tab === 'iuran')}>
          Tagihan Iuran
        </button>
      </div>

      {tab === 'spp' ? <SppReport /> : <IuranReport />}
    </div>
  );
}