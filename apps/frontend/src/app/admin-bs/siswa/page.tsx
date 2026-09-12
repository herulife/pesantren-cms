'use client';

import React, { useEffect, useState } from 'react';
import { getSantriList, Santri } from '@/lib/api';
import { BsTitle } from '../ui';

export default function BsSiswa() {
  const [rows, setRows] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const load = async () => {
    const r = await getSantriList({ search: search || undefined, limit: 100 });
    setRows(r.items);
    setTotal(r.total);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <BsTitle>Data Siswa ({total})</BsTitle>
      <div className="card">
        <div className="card-header">
          <div className="card-tools d-flex gap-2">
            <input className="form-control form-control-sm" placeholder="Pencarian NIS/nama" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} />
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); }}>Reset</button>
            <button className="btn btn-sm btn-primary" onClick={load}>Tampilkan</button>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>No Induk</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Angkatan</th><th>Status</th><th>Wali</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nis}</td><td className="fw-bold">{r.name}</td><td>{r.gender}</td>
                  <td>{r.class || '-'}</td><td>{r.angkatan || '-'}</td><td>{r.status}</td><td>{r.parent_name || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
