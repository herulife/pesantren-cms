'use client';

import React, { useEffect, useState } from 'react';
import { getDonors, createDonor, updateDonor, deleteDonor, Donor } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

export default function BsDonatur() {
  const [rows, setRows] = useState<Donor[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', address: '', phone: '', notes: '' });
  const [editing, setEditing] = useState<Donor | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async (q: string) => setRows(await getDonors(q));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = editing
      ? await updateDonor(editing.id, { ...form })
      : await createDonor({ ...form });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ name: '', address: '', phone: '', notes: '' });
      setEditing(null);
      load(search);
    }
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus donatur ini?')) return;
    const r = await deleteDonor(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(search);
  };

  return (
    <div>
      <BsTitle>Data Donatur</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">{editing ? 'Ubah Donatur' : 'Tambah Donatur'}</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-3"><input className="form-control" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="No HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Keterangan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="col-md-2 d-flex gap-1">
              <button className="btn btn-primary btn-sm">Simpan</button>
              {editing && <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditing(null); setForm({ name: '', address: '', phone: '', notes: '' }); }}>Batal</button>}
            </div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-tools d-flex gap-2">
            <input className="form-control form-control-sm" placeholder="Pencarian" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(search); }} />
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); load(''); }}>Reset</button>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>ID</th><th>Nama</th><th>Alamat</th><th>No HP</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td><td className="fw-bold">{r.name}</td><td>{r.address || '-'}</td>
                  <td>{r.phone || '-'}</td><td>{(r.created_at || '').slice(0, 10)}</td>
                  <td className="d-flex gap-1">
                    <button className="btn btn-xs btn-warning" onClick={() => { setEditing(r); setForm({ name: r.name, address: r.address, phone: r.phone, notes: r.notes }); }}>Ubah</button>
                    <button className="btn btn-xs btn-danger" onClick={() => hapus(r.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
