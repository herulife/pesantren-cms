'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUserRole, resetUserPassword, deleteUser } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { PageHeader } from '../ui';
import { exportToExcel } from '@/lib/export';
import { useConfirm } from '@/components/ConfirmProvider';


type U = { id: number; name: string; email: string; role: string; created_at: string; last_login_at?: string | null };
const ROLES = ['superadmin', 'bendahara', 'panitia_psb', 'tim_media'];

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-danger',
  bendahara: 'bg-warning text-dark',
  panitia_psb: 'bg-info text-dark',
  tim_media: 'bg-secondary',
};

function RowActions({ canReset, canDelete, isSelf, onPassword, onDelete }: { canReset: boolean; canDelete: boolean; isSelf: boolean; onPassword: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="d-inline-block position-relative">
      <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setOpen((v) => !v)}>
        Aksi <span className="bi bi-chevron-down ms-1" />
      </button>
      {open && (
        <div className="dropdown-menu show position-absolute end-0 mt-1 shadow rounded border bg-white p-0" onClick={() => setOpen(false)}>
           {canReset && (
             <button className="dropdown-item btn-sm py-1" onClick={onPassword}>Reset Password</button>
           )}
          {canDelete && (
            <button className="dropdown-item btn-sm py-1 text-danger" onClick={onDelete} disabled={isSelf} title={isSelf ? 'Tidak bisa menghapus akun sendiri' : ''}>
              Hapus User
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CompactAlert({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div className={`alert ${ok ? 'alert-success' : 'alert-danger'} alert-dismissible py-1 px-3 mb-2 d-flex align-items-center`} role="alert" style={{ fontSize: '0.8rem' }}>
      <span className="me-2">{msg}</span>
      <button type="button" className="btn-close ms-auto" style={{ width: '0.55rem', height: '0.55rem' }} onClick={onClose} aria-label="Tutup" />
    </div>
  );
}

export default function BsUsers() {
  const { user } = useAuth();
  const isSuper = user?.role === 'superadmin';
  const roleOptions = isSuper ? ROLES : ROLES.filter((r) => r !== 'superadmin');

  const [rows, setRows] = useState<U[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'bendahara' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async (q: string) => setRows(await getUsers(q));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('');
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createUser(form);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ name: '', email: '', password: '', role: roleOptions[0] });
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

  const confirmDialog = useConfirm();

  const hapus = async (id: number, name: string) => {
    if (!(await confirmDialog({ title: 'Hapus user', message: `Hapus user "${name}"? Tindakan ini tidak bisa dibatalkan.`, confirmText: 'Hapus' }))) return;
    const r = await deleteUser(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(search);
  };

  return (
    <div>
      <PageHeader
        title="Manajemen User"
        breadcrumb="Tools / User"
        actions={
          <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={() => exportToExcel('Data User', ['Nama', 'Email', 'Role', 'Login Terakhir'], rows.map((r) => [r.name, r.email, r.role, (r.last_login_at || '').slice(0, 16).replace('T', ' ') || '-']), 'data_user')}>Export Excel</button>
        }
      />
      <CompactAlert msg={msg} ok={ok} onClose={() => setMsg('')} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah User</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2 align-items-center">
            <div className="col-md-3"><input className="form-control" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="col-md-3"><input type="email" className="form-control" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="col-md-2"><input type="password" className="form-control" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="col-md-2">
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roleOptions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-2"><button className="btn btn-primary btn-sm w-100">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-tools d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <span className="text-muted small">{rows.length} akun {!isSuper && <span className="badge bg-secondary ms-1">Hapus hanya oleh super admin</span>}</span>
            <div className="d-flex gap-2">
              <input className="form-control form-control-sm" placeholder="Cari nama / email…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(search); }} />
              <button className="btn btn-sm btn-secondary" onClick={() => { setSearch(''); load(''); }}>Reset</button>
            </div>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Login Terakhir</th><th style={{ width: 90 }}>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="fw-bold">
                    {r.name}
                    {r.id === user?.id && <span className="badge bg-info text-dark ms-1">Anda</span>}
                  </td>
                  <td>{r.email}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${ROLE_BADGE[r.role] || 'bg-light text-dark'}`}>{r.role}</span>
                      {r.id !== user?.id && (isSuper || r.role !== 'superadmin') ? (
                        <select className="form-select form-select-sm w-auto" value={r.role} onChange={(e) => gantiRole(r.id, e.target.value)}>
                          {roleOptions.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      ) : (
                        <span className="text-muted small">super admin</span>
                      )}
                    </div>
                  </td>
                  <td>{(r.last_login_at || '').slice(0, 16).replace('T', ' ') || '-'}</td>
                  <td>
                     <RowActions
                        canReset={r.id !== user?.id && (isSuper || r.role !== 'superadmin')}

                       canDelete={isSuper}
                       isSelf={r.id === user?.id}
                      onPassword={() => resetPass(r.id)}
                      onDelete={() => hapus(r.id, r.name)}
                    />
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