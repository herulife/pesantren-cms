'use client';

import React, { useEffect, useState } from 'react';
import { getKasSummary, KasSummary } from '@/lib/api';
import { fmtRp, BsTitle } from '../ui';

export default function BsLapLabaRugi() {
  const [s, setS] = useState<KasSummary | null>(null);

  useEffect(() => {
    getKasSummary().then(setS).catch(() => {});
  }, []);

  const row = (label: string, value: number, bold = false) => (
    <tr>
      <td className={bold ? 'fw-bold' : ''}>{label}</td>
      <td className={`text-end${bold ? ' fw-bold' : ''}`}>{fmtRp(value)}</td>
    </tr>
  );

  return (
    <div>
      <BsTitle>Lap. Laba / Rugi</BsTitle>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-sm text-sm mb-0">
            <tbody>
              <tr className="table-secondary"><td colSpan={2} className="fw-bold">PEMASUKAN</td></tr>
              {row('Pemasukan SPP', s?.spp_income || 0)}
              {row('Pemasukan Iuran', s?.iuran_income || 0)}
              {row('Donasi Uang / Infak', s?.donasi_income || 0)}
              {row('Pemasukan Lain (Kas Masuk)', s?.kas_income || 0)}
              {row('Total Pemasukan', s?.income || 0, true)}
              <tr className="table-secondary"><td colSpan={2} className="fw-bold">PENGELUARAN</td></tr>
              {row('Total Pengeluaran', s?.expense || 0, true)}
              <tr className="table-primary">{row('Laba / Rugi Bersih', s?.balance || 0, true)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
