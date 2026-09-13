'use client';

import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, deleteEmployee, Employee } from '@/lib/api';
import { BsTitle, BsAlert, PageHeader, ImportModal, Toast, useToastState } from '../ui';
import { exportToExcel } from '@/lib/export';

export default function BsPegawai() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', gender: 'Laki-laki', phone: '', email: '', kind: 'Guru' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast, show } = useToastState();

  const load = async () => {
    setRows(await getEmployees(search || undefined));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createEmployee(form);
    setOk(r.success);
    setMsg(r.message || (r.success ? 'Tersimpan.' : 'Gagal.'));
    if (r.success) {
      setForm({ code: '', name: '', gender: 'Laki-laki', phone: '', email: '', kind: 'Guru' });
      load();
    }
  };

  const exportAll = () => {
    exportToExcel(
      'Data Pegawai',
      ['ID', 'Nama', 'L/P', 'Telp', 'Email', 'Jenis'],
      rows.map((r) => [r.code, r.name, r.gender || '-', r.phone || '-', r.email || '-', r.kind]),
      'data_pegawai'
    );
  };

  const doImport = async (list: Record<string, string>[]) => {
    const items = list.filter((x) => (x.kode || x.id || '') && (x.nama || x.name || ''));
    if (items.length === 0) {
      show(false, 'Tidak ada baris valid (wajib kode + nama).');
      return;
    }
    setImporting(true);
    let okCount = 0;
    for (const x of items) {
      const r = await createEmployee({
        code: x.kode || x.id || '',
        name: x.nama || x.name || '',
        gender: x['l/p'] || x.gender || 'Laki-laki',
        phone: x.telp || x.phone || '',
        email: x.email || '',
        kind: x.jenis || x.kind || 'Guru',
      });
      if (r.success) okCount++;
    }
    setImporting(false);
    show(okCount === items.length, `${okCount} dari ${items.length} pegawai diimport.`);
    if (okCount > 0) {
      setImportOpen(false);
      load();
    }
  };

  const hapus = async (code: string) => {
    if (!confirm(`Hapus pegawai ${code}?`)) return;
    const r = await deleteEmployee(code);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  return (
    <div>
      <PageHeader
        title="Data Pegawai"
        breadcrumb="Data Master / Pegawai"
        actions={
          <>
            <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={exportAll}>Export Excel</button>
            <button type="button" className="alma-btn alma-btn-primary alma-btn-sm" onClick={() => setImportOpen(true)}>Import Massal</button>
          </>
        }
      />
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Pegawai</h3></div>
        <form onSubmit={submit}>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="ID" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="col-md-2">
                <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Laki-laki</option><option>Perempuan</option>
                </select>
              </div>
              <div className="col-md-2"><input className="form-control" placeholder="Telp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-md-1">
                <select className="form-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  <option>Guru</option><option>Staf</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-footer"><button className="btn btn-primary btn-sm">Simpan</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Daftar Pegawai</h3>
          <div className="card-tools d-flex gap-2">
            <input className="form-control form-control-sm" placeholder="Pencarian" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} />
            <button className="btn btn-sm btn-secondary" onClick={load}>Reset</button>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>ID</th><th>Nama</th><th>JK</th><th>Telp</th><th>Email</th><th>Jenis</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td>{r.code}</td><td>{r.name}</td><td>{r.gender || '-'}</td>
                  <td>{r.phone || '-'}</td><td>{r.email || '-'}</td><td>{r.kind}</td>
                  <td><button className="btn btn-xs btn-danger" onClick={() => hapus(r.code)}>Hapus</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ImportModal
        open={importOpen}
        title="Import Massal Pegawai"
        templateName="template_pegawai.csv"
        templateHeaders={['kode', 'nama', 'l/p', 'telp', 'email', 'jenis']}
        sampleRow={['19980430004', 'Khusnul Kholik', 'Laki-laki', '0812', 'a@b.c', 'Guru']}
        onClose={() => setImportOpen(false)}
        onImport={doImport}
        busy={importing}
      />
      <Toast toast={toast} />
    </div>
  );
}
