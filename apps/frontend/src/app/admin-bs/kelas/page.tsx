'use client';

import React, { useEffect, useState } from 'react';
import { getClasses, createClass, deleteClass, SchoolClass } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

export default function BsKelas() {
  const [rows, setRows] = useState<SchoolClass[]>([]);
  const [name, setName] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async () => setRows(await getClasses());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createClass({ name, jenjang });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setName('');
      setJenjang('');
      load();
    }
  };

  const hapus = async (id: number) => {
    if (!confirm('Hapus kelas ini?')) return;
    const r = await deleteClass(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  return (
    <div>
      <BsTitle>Data Kelas</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Kelas</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-4"><input className="form-control" placeholder="Nama kelas (cth: VII-A)" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="col-md-4"><input className="form-control" placeholder="Jenjang (SMP/SMK)" value={jenjang} onChange={(e) => setJenjang(e.target.value)} /></div>
            <div className="col-md-4"><button className="btn btn-primary btn-sm">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>#</th><th>Nama</th><th>Jenjang</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td><td className="fw-bold">{r.name}</td><td>{r.jenjang || '-'}</td>
                  <td>{r.is_active ? 'Aktif' : 'Nonaktif'}</td>
                  <td><button className="btn btn-xs btn-danger" onClick={() => hapus(r.id)}>Hapus</button></td>
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
