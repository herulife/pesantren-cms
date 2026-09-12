'use client';

import React, { useEffect, useState } from 'react';
import { getPayTransactions, PayTx } from '@/lib/api';
import { fmtRp, BsTitle } from '../ui';

function today() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() { return today().slice(0, 8) + '01'; }

export default function BsLapTransaksi() {
  const [rows, setRows] = useState<PayTx[]>([]);
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const load = async () => setRows(await getPayTransactions({ from, to }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <BsTitle>Lap. Transaksi</BsTitle>
      <div className="card">
        <div className="card-body row g-2">
          <div className="col-md-2"><input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="col-md-2"><input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="col-md-2"><button className="btn btn-sm btn-secondary" onClick={load}>Tampilkan</button></div>
          <div className="col-md-6 text-end fw-bold align-self-center">Total: {fmtRp(total)}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>Tanggal</th><th>Jam</th><th>No. Induk</th><th>Nama</th><th>Keterangan</th><th>Jml Bayar</th><th>Jenis</th><th>Petugas</th><th>Kode Transaksi</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const [d, t] = (r.date || '').split(' ');
                return (
                  <tr key={r.id}>
                    <td>{d}</td><td>{t || '-'}</td><td>{r.santri_nis}</td><td className="fw-bold">{r.santri_name}</td>
                    <td>{r.description}</td><td className="fw-bold">{fmtRp(r.amount)}</td><td>{r.method}</td>
                    <td>{r.petugas || '-'}</td><td>{r.code}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
