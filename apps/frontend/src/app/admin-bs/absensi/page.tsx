'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEmployees, getTeacherAttendance, createTeacherAttendance, deleteTeacherAttendance, getRawLogs, importRawLogs, syncAbsen, Employee, TeacherAttendance, RawLog } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';
import { useConfirm } from '@/components/ConfirmProvider';


function today() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() { return today().slice(0, 8) + '01'; }

function BsAbsensiInner() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'rawlog' ? 'rawlog' : 'absen';
  const [emps, setEmps] = useState<Employee[]>([]);
  const [rows, setRows] = useState<TeacherAttendance[]>([]);
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [form, setForm] = useState({ employee_code: '', date: today(), status: 'Masuk', notes: '', time_in: '', time_out: '' });
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [rawText, setRawText] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async () => {
    const [e, a] = await Promise.all([getEmployees(), getTeacherAttendance({ from, to })]);
    setEmps(e);
    setRows(a);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createTeacherAttendance(form);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ ...form, notes: '', time_in: '', time_out: '' });
      load();
    }
  };

  const confirmDialog = useConfirm();

  const hapus = async (id: number) => {
    if (!(await confirmDialog({ title: 'Hapus absensi', message: 'Hapus absensi ini? Tindakan ini tidak bisa dibatalkan.', confirmText: 'Hapus' }))) return;
    const r = await deleteTeacherAttendance(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  const loadRaw = async () => setRawLogs(await getRawLogs(from, to));

  const importLog = async () => {
    const list = rawText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(/[;,]/).map((x) => x.trim());
      return { fp_id: p[0] || '', date: p[1] || '', time: p[2] || '', verify: p[3] || '', machine: p[4] || '' };
    }).filter((r) => r.fp_id && r.date);
    if (list.length === 0) {
      setOk(false);
      setMsg('Tidak ada baris valid.');
      return;
    }
    const r = await importRawLogs(list);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setRawText('');
      loadRaw();
    }
  };

  const sync = async () => {
    const r = await syncAbsen(from, to);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      loadRaw();
      load();
    }
  };

  return (
    <div>
      <BsTitle>{tab === 'rawlog' ? 'Raw Log & Sync Absen' : 'Data Absen Guru'}</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      {tab === 'absen' ? (
        <>
          <div className="card card-primary">
            <div className="card-header"><h3 className="card-title">Catat Absen</h3></div>
            <form onSubmit={submit}>
              <div className="card-body row g-2">
                <div className="col-md-3"><label className="form-label">Guru</label>
                  <select className="form-select" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} required>
                    <option value="">- Pilih -</option>
                    {emps.map((e) => <option key={e.code} value={e.code}>{e.code} - {e.name}</option>)}
                  </select>
                </div>
                <div className="col-md-2"><label className="form-label">Tanggal</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="col-md-2"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option>Masuk</option><option>Sakit</option><option>Ijin</option><option>Tanpa Keterangan</option>
                  </select>
                </div>
                <div className="col-md-1"><label className="form-label">Masuk</label><input className="form-control" placeholder="07:00" value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} /></div>
                <div className="col-md-1"><label className="form-label">Pulang</label><input className="form-control" placeholder="16:00" value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} /></div>
                <div className="col-md-2"><label className="form-label">Keterangan</label><input className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="col-md-1 d-flex align-items-end"><button className="btn btn-primary btn-sm">Simpan</button></div>
              </div>
            </form>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-tools d-flex gap-2">
                <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
                <button className="btn btn-sm btn-secondary" onClick={load}>Tampilkan</button>
              </div>
            </div>
            <div className="card-body table-responsive p-0">
              <table className="table table-bordered table-striped table-sm text-sm mb-0">
                <thead><tr><th>Tanggal</th><th>Guru</th><th>Status</th><th>Masuk</th><th>Pulang</th><th>Ket</th><th>Aksi</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td><td className="fw-bold">{r.employee_name || r.employee_code}</td><td>{r.status}</td>
                      <td>{r.time_in || '-'}</td><td>{r.time_out || '-'}</td><td>{r.notes || '-'}</td>
                      <td><button className="btn btn-xs btn-danger" onClick={() => hapus(r.id)}>Hapus</button></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted p-3">Belum ada data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted small">Sync Data Absen (Rawlog ke Absen Harian). Status menjadi Masuk bila ada log fingerprint di tanggal yang sama.</p>
          <div className="card">
            <div className="card-body row g-2">
              <div className="col-md-2"><input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="col-md-2"><input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <div className="col-md-2"><button className="btn btn-sm btn-secondary" onClick={loadRaw}>Tampilkan</button></div>
              <div className="col-md-2"><button className="btn btn-sm btn-success" onClick={sync}>Sync Data Absen</button></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Import Log Fingerprint</h3></div>
            <div className="card-body">
              <textarea className="form-control font-monospace" rows={3} placeholder="19980430004,2026-09-11,07:00:01,1,1" value={rawText} onChange={(e) => setRawText(e.target.value)} />
              <button className="btn btn-sm btn-primary mt-2" onClick={importLog}>Import Log</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body table-responsive p-0">
              <table className="table table-bordered table-striped table-sm text-sm mb-0">
                <thead><tr><th>No</th><th>ID FP</th><th>Tgl Transaksi</th><th>Jam</th><th>Verifikasi</th><th>Mesin</th></tr></thead>
                <tbody>
                  {rawLogs.map((l, i) => (
                    <tr key={l.id}><td>{i + 1}</td><td>{l.fp_id}</td><td>{l.date}</td><td>{l.time || '-'}</td><td>{l.verify || '-'}</td><td>{l.machine || '-'}</td></tr>
                  ))}
                  {rawLogs.length === 0 && <tr><td colSpan={6} className="text-center text-muted p-3">Belum ada data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BsAbsensi() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat...</p>}>
      <BsAbsensiInner />
    </Suspense>
  );
}
