'use client';

import React, { useEffect, useState } from 'react';
import { getKasSummary, KasSummary } from '@/lib/api';
import { fmtRp, BsTitle, PageHeader } from '../ui';
import { exportToExcel } from '@/lib/export';

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
      <PageHeader
        title="Lap. Laba / Rugi"
        breadcrumb="Reporting / Laba Rugi"
        actions={
          <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={() => exportToExcel('Laba Rugi', ['Uraian', 'Nominal'], [['Pemasukan SPP', s?.spp_income || 0], ['Pemasukan Iuran', s?.iuran_income || 0], ['Donasi', s?.donasi_income || 0], ['Kas Masuk Lain', s?.kas_income || 0], ['Total Pemasukan', s?.income || 0], ['Total Pengeluaran', s?.expense || 0], ['Laba/Rugi Bersih', s?.balance || 0]], 'laba_rugi')}>Export Excel</button>
        }
      />
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
