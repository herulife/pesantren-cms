'use client';

import React, { useEffect, useState } from 'react';
import { getAcademicYears, createAcademicYear, activateAcademicYear, deleteAcademicYear, AcademicYear } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';
import { useConfirm } from '@/components/ConfirmProvider';


export default function BsTahunAjaran() {
  const [rows, setRows] = useState<AcademicYear[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async () => setRows(await getAcademicYears());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createAcademicYear({ name });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setName('');
      load();
    }
  };

  const aktifkan = async (id: number) => {
    const r = await activateAcademicYear(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  const confirmDialog = useConfirm();

  const hapus = async (id: number) => {
    if (!(await confirmDialog({ title: 'Hapus tahun ajaran', message: 'Hapus tahun ajaran ini? Tindakan ini tidak bisa dibatalkan.', confirmText: 'Hapus' }))) return;
    const r = await deleteAcademicYear(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  return (
    <div>
      <BsTitle>Tahun Ajaran</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Tahun Ajaran</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-6"><input className="form-control" placeholder="cth: 2025/2026" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="col-md-6"><button className="btn btn-primary btn-sm">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>#</th><th>Tahun Ajaran</th><th>Periode</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td><td className="fw-bold">{r.name}</td>
                  <td>{r.start_date || '-'} - {r.end_date || '-'}</td>
                  <td>{r.is_active ? <span className="badge bg-success">Aktif</span> : 'Tidak Aktif'}</td>
                  <td className="d-flex gap-1">
                    {!r.is_active && <button className="btn btn-xs btn-success" onClick={() => aktifkan(r.id)}>Aktifkan</button>}
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
