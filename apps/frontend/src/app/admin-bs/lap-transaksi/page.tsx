'use client';

import React, { useEffect, useState } from 'react';
import { getPayTransactions, getPublicSettingsMap, PayTx, SettingsMap } from '@/lib/api';
import KwitansiModal, { KwitansiTx } from '@/components/KwitansiModal';
import { fmtRp, BsTitle, PageHeader, Toast, useToastState } from '../ui';
import { exportToExcel } from '@/lib/export';

function today() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() { return today().slice(0, 8) + '01'; }

export default function BsLapTransaksi() {
  const [rows, setRows] = useState<PayTx[]>([]);
  const [kwitansi, setKwitansi] = useState<KwitansiTx | null>(null);
  const [settings, setSettings] = useState<SettingsMap>({});
  const { toast, show } = useToastState();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const load = async () => {
    const [t, st] = await Promise.all([getPayTransactions({ from, to }), getPublicSettingsMap()]);
    setRows(t);
    setSettings(st);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <PageHeader
        title="Lap. Transaksi"
        breadcrumb="Reporting / Transaksi"
        actions={
          <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={() => exportToExcel('Lap Transaksi', ['Tanggal', 'Jam', 'No Induk', 'Nama', 'Keterangan', 'Jml Bayar', 'Jenis', 'Petugas', 'Kode'], rows.map((r) => { const parts = (r.date || '').split(' '); return [parts[0] || '', parts[1] || '-', r.santri_nis || '-', r.santri_name || '-', r.description, r.amount, r.method, r.petugas || '-', r.code]; }), 'lap_transaksi')}>Export Excel</button>
        }
      />
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
            <thead><tr><th>Tanggal</th><th>Jam</th><th>No. Induk</th><th>Nama</th><th>Keterangan</th><th>Jml Bayar</th><th>Jenis</th><th>Petugas</th><th>Kode Transaksi</th><th>Kwitansi</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const [d, t] = (r.date || '').split(' ');
                return (
                  <tr key={r.id}>
                    <td>{d}</td><td>{t || '-'}</td><td>{r.santri_nis}</td><td className="fw-bold">{r.santri_name}</td>
                    <td>{r.description}</td><td className="fw-bold">{fmtRp(r.amount)}</td><td>{r.method}</td>
                    <td>{r.petugas || '-'}</td><td>{r.code}</td><td><button title="Cetak kwitansi" onClick={() => setKwitansi({ code: r.code, date: r.date, santri_nis: r.santri_nis, santri_name: r.santri_name, description: r.description, amount: r.amount, method: r.method })} className="btn btn-xs btn-info">Kwitansi</button></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {kwitansi && <KwitansiModal data={kwitansi} schoolName={settings.school_name} schoolAddress={settings.school_address} schoolPhone={settings.school_phone} onClose={() => setKwitansi(null)} />}
      <Toast toast={toast} />
    </div>
  );
}
