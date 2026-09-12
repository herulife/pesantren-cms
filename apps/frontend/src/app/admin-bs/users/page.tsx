'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUserRole, resetUserPassword, deleteUser } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

type U = { id: number; name: string; email: string; role: string; created_at: string; last_login_at?: string | null };
const ROLES = ['superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'admin', 'user'];

export default function BsUsers() {
  const [rows, setRows] = useState<U[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async (q: string) => setRows(await getUsers(q));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createUser(form);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ name: '', email: '', password: '', role: 'admin' });
      load(search);
    }
  };

  const gantiRole = async (id: number, role: string) => {
    const r = await updateUserRole(id, role);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(search);
  };

  const resetPass = async (id: number) => {
    const p = prompt('Password baru:');
    if (!p) return;
    const r = await resetUserPassword(id, p);
    setOk(r.success);
    setMsg(r.message || '');
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    const r = await deleteUser(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(search);
  };

  return (
    <div>
      <BsTitle>Manajemen User</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah User</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-3"><input className="form-control" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="col-md-3"><input type="email" className="form-control" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="col-md-2"><input type="password" className="form-control" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="col-md-2">
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-2"><button className="btn btn-primary btn-sm">Simpan</button></div>
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
            <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="fw-bold">{r.name}</td><td>{r.email}</td>
                  <td>
                    <select className="form-select form-select-sm" value={r.role} onChange={(e) => gantiRole(r.id, e.target.value)}>
                      {ROLES.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </td>
                  <td>{(r.last_login_at || '').slice(0, 16).replace('T', ' ') || '-'}</td>
                  <td className="d-flex gap-1">
                    <button className="btn btn-xs btn-warning" onClick={() => resetPass(r.id)}>Password</button>
                    <button className="btn btn-xs btn-danger" onClick={() => hapus(r.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
