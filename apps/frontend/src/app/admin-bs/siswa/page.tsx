'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSantriList, bulkCreateSantri, Santri } from '@/lib/api';
import { PageHeader, Pagination, EmptyState, ImportModal, Toast, useToastState } from '../ui';
import { exportToExcel } from '@/lib/export';

const PER_PAGE = 10;

export default function BsSiswa() {
  const [rows, setRows] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast, show } = useToastState();

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

  const exportAll = async () => {
    const r = await getSantriList({ search: applied || undefined, limit: 2000 });
    exportToExcel(
      'Data Siswa',
      ['No Induk', 'Nama', 'L/P', 'Kelas', 'Angkatan', 'Status', 'Wali'],
      r.items.map((x) => [x.nis, x.name, x.gender, x.class || '-', x.angkatan || '-', x.status, x.parent_name || '-']),
      'data_siswa'
    );
  };

  const doImport = async (list: Record<string, string>[]) => {
    setImporting(true);
    const items = list
      .filter((x) => (x.nis || x['no induk'] || '') && (x.nama || x.name || ''))
      .map((x) => ({
        nis: x.nis || x['no induk'] || '',
        name: x.nama || x.name || '',
        gender: x['l/p'] || x.gender || '',
        class: x.kelas || x.class || '',
        angkatan: x.angkatan || '',
        status: x.status || 'aktif',
        parent_name: x.wali || x.parent_name || '',
        parent_phone: x.hp || x.parent_phone || '',
        address: x.alamat || x.address || '',
      }));
    if (items.length === 0) {
      show(false, 'Tidak ada baris valid (wajib nis + nama).');
      setImporting(false);
      return;
    }
    const r = await bulkCreateSantri(items);
    setImporting(false);
    show(r.ok, r.message || (r.ok ? `${r.inserted ?? items.length} santri diimport.` : 'Gagal import.'));
    if (r.ok) {
      setImportOpen(false);
      go(applied, 1);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);
  const filtered = useMemo(() => rows, [rows]);

  return (
    <div>
      <PageHeader
        title="Data Siswa"
        breadcrumb="Data Master / Siswa"
        actions={
          <>
            <button type="button" className="alma-btn alma-btn-success" onClick={exportAll}>Export Excel</button>
            <button type="button" className="alma-btn alma-btn-primary" onClick={() => setImportOpen(true)}>Import Massal</button>
          </>
        }
      />
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
      <ImportModal
        open={importOpen}
        title="Import Massal Santri"
        templateName="template_santri.csv"
        templateHeaders={['nis', 'nama', 'l/p', 'kelas', 'angkatan', 'status', 'wali', 'hp', 'alamat']}
        sampleRow={['001', 'Abdullah', 'L', 'VII-A', '2024', 'aktif', 'Ahmad', '0812', 'Parung']}
        onClose={() => setImportOpen(false)}
        onImport={doImport}
        busy={importing}
      />
      <Toast toast={toast} />
    </div>
  );
}
