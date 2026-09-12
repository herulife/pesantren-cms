'use client';

import React, { useEffect, useState } from 'react';
import { getCombinedReport, CombinedRow } from '@/lib/api';
import { fmtRp, BsTitle } from '../ui';

function nowPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function statusLabel(s: string) {
  if (s === 'paid') return 'Lunas';
  if (s === 'partial') return 'Sebagian';
  if (s === 'unpaid') return 'Belum Lunas';
  return '-';
}

export default function BsLapTagihan() {
  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [start, setStart] = useState(nowPeriod());
  const [end, setEnd] = useState(nowPeriod());

  const load = async () => setRows(await getCombinedReport({ period_start: start, period_end: end }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <BsTitle>Lap. Tagihan Siswa</BsTitle>
      <div className="card">
        <div className="card-body row g-2">
          <div className="col-md-2"><input type="month" className="form-control" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="col-md-2"><input type="month" className="form-control" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div className="col-md-2"><button className="btn btn-sm btn-secondary" onClick={load}>Tampilkan</button></div>
        </div>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>No Induk</th><th>Nama</th><th>Kelas</th><th>Tagihan SPP</th><th>Tagihan Iuran</th><th>Total Tagihan</th><th>Sudah Dibayar</th><th>Sisa</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.santri_id}>
                  <td>{r.nis}</td><td className="fw-bold">{r.name}</td><td>{r.class}</td>
                  <td>{fmtRp(r.spp_billed)}</td><td>{fmtRp(r.iuran_billed)}</td><td className="fw-bold">{fmtRp(r.billed)}</td>
                  <td>{fmtRp(r.collected)}</td><td className="fw-bold text-danger">{fmtRp(r.outstanding)}</td><td>{statusLabel(r.status)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
