'use client';

import React, { useEffect, useState } from 'react';
import { getKasCategories, createKasCategory, updateKasCategory, KasCategory } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

export default function BsKasKategori() {
  const [rows, setRows] = useState<KasCategory[]>([]);
  const [kind, setKind] = useState('');
  const [name, setName] = useState('');
  const [ckind, setCkind] = useState('masuk');
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async (k: string) => setRows(await getKasCategories(k));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createKasCategory({ name, kind: ckind });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setName('');
      load(kind);
    }
  };

  const simpan = async (c: KasCategory) => {
    if (!editing || editing.id !== c.id) return;
    const r = await updateKasCategory(c.id, { name: editing.name, kind: c.kind });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setEditing(null);
      load(kind);
    }
  };

  return (
    <div>
      <BsTitle>Kategori Kas</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Kategori</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-5"><input className="form-control" placeholder="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="col-md-4">
              <select className="form-select" value={ckind} onChange={(e) => setCkind(e.target.value)}>
                <option value="masuk">Kas Masuk</option><option value="keluar">Kas Keluar</option>
              </select>
            </div>
            <div className="col-md-3"><button className="btn btn-primary btn-sm">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-tools d-flex gap-2">
            <select className="form-select form-select-sm" value={kind} onChange={(e) => { setKind(e.target.value); load(e.target.value); }} style={{ width: 180 }}>
              <option value="">Semua Jenis</option><option value="masuk">Kas Masuk</option><option value="keluar">Kas Keluar</option>
            </select>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>#</th><th>Kode</th><th>Nama</th><th>Jenis</th><th>Dibuat Oleh</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td><td>{r.code || '-'}</td>
                  <td>{editing?.id === r.id
                    ? <input className="form-control form-control-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    : <span className="fw-bold">{r.name}</span>}</td>
                  <td>{r.kind}</td><td>{r.creator || '-'}</td>
                  <td>
                    {editing?.id === r.id
                      ? <button className="btn btn-xs btn-success" onClick={() => simpan(r)}>Simpan</button>
                      : <button className="btn btn-xs btn-warning" onClick={() => setEditing({ id: r.id, name: r.name })}>Ubah</button>}
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
