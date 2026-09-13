'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSantriList, Santri } from '@/lib/api';
import { PageHeader, Pagination, EmptyState } from '../ui';

const PER_PAGE = 10;

export default function BsSiswa() {
  const [rows, setRows] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);

  const load = async (q: string, p: number) => {
    const r = await getSantriList({ search: q || undefined, limit: PER_PAGE, offset: (p - 1) * PER_PAGE });
    setRows(r.items);
    setTotal(r.total);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat awal saat mount
    load('', 1);
  }, []);

  const go = (q: string, p: number) => {
    setApplied(q);
    setPage(p);
    load(q, p);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);
  const filtered = useMemo(() => rows, [rows]);

  return (
    <div>
      <PageHeader title="Data Siswa" breadcrumb="Data Master / Siswa" />
      <div className="alma-card mb-3">
        <div className="alma-card-bd alma-filter">
          <div className="alma-field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="siswa-search">Pencarian</label>
            <input
              id="siswa-search"
              className="alma-input"
              placeholder="Cari NIS / nama…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') go(search, 1); }}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="alma-btn alma-btn-secondary" onClick={() => { setSearch(''); go('', 1); }}>Reset</button>
            <button type="button" className="alma-btn alma-btn-primary" onClick={() => go(search, 1)}>Cari</button>
          </div>
        </div>
      </div>
      <div className="alma-table-wrap">
        <table className="alma-table">
          <thead><tr><th>No Induk</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Angkatan</th><th>Status</th><th>Wali</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><span className="alma-code">{r.nis}</span></td><td><strong>{r.name}</strong></td><td>{r.gender}</td>
                <td>{r.class || '-'}</td><td>{r.angkatan || '-'}</td>
                <td><span className={`alma-badge ${r.status === 'aktif' ? 'alma-badge-green' : 'alma-badge-gray'}`}>{r.status}</span></td>
                <td>{r.parent_name || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7}>
                <EmptyState title="Belum ada data siswa" desc="Coba ubah kata kunci pencarian." />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPage={(p) => go(applied, p)} />
    </div>
  );
}
