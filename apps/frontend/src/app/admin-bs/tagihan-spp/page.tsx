'use client';

import React, { useEffect, useState } from 'react';
import { getSppBills, generateSppBills, deleteSppByPeriod, deleteSppBySantri, getSppSantri, SppBill, SppSantri } from '@/lib/api';
import { fmtRp, BsTitle, BsAlert } from '../ui';

function nowPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BsTagihanSpp() {
  const [rows, setRows] = useState<SppBill[]>([]);
  const [santris, setSantris] = useState<SppSantri[]>([]);
  const [period, setPeriod] = useState(nowPeriod());
  const [form, setForm] = useState({ start: nowPeriod(), end: '', amount: '', due: '', class: '' });
  const [delSantri, setDelSantri] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async (p: string) => {
    const [b, s] = await Promise.all([getSppBills({ period: p }), getSppSantri()]);
    setRows(b);
    setSantris(s);
  };

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cari = () => load(period);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await generateSppBills({
      period: form.start,
      period_end: form.end || undefined,
      amount: Number(form.amount),
      due_date: form.due || undefined,
      class: form.class || undefined,
    });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(period);
  };

  const hapusPeriode = async () => {
    if (!confirm(`Hapus SEMUA tagihan SPP belum dibayar periode ${period}?`)) return;
    const r = await deleteSppByPeriod(period);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(period);
  };

  const hapusSantri = async () => {
    if (!delSantri) return;
    if (!confirm('Hapus tagihan santri ini (yang belum dibayar)?')) return;
    const r = await deleteSppBySantri(Number(delSantri), period);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load(period);
  };

  return (
    <div>
      <BsTitle>Generate SPP</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Generate Tagihan</h3></div>
        <form onSubmit={generate}>
          <div className="card-body row g-2">
            <div className="col-md-2"><label className="form-label">Bulan Awal</label><input type="month" className="form-control" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required /></div>
            <div className="col-md-2"><label className="form-label">Bulan s/d</label><input type="month" className="form-control" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
            <div className="col-md-2"><label className="form-label">Besar SPP</label><input type="number" min="1" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="col-md-2"><label className="form-label">Jatuh Tempo</label><input type="date" className="form-control" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></div>
            <div className="col-md-2"><label className="form-label">Kelas</label>
              <select className="form-select" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                <option value="">Semua Kelas</option>
                {Array.from(new Set(santris.map((x) => x.class).filter(Boolean))).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end"><button className="btn btn-primary btn-sm">Generate</button></div>
          </div>
        </form>
      </div>
      <div className="card card-danger">
        <div className="card-header"><h3 className="card-title">Delete SPP</h3></div>
        <div className="card-body row g-2">
          <div className="col-md-3"><input type="month" className="form-control" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
          <div className="col-md-2"><button className="btn btn-sm btn-secondary" onClick={cari}>Tampilkan</button></div>
          <div className="col-md-3"><button className="btn btn-sm btn-danger" onClick={hapusPeriode}>Hapus Semua Periode Ini</button></div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={delSantri} onChange={(e) => setDelSantri(e.target.value)}>
              <option value="">-- Per Siswa --</option>
              {santris.map((s) => <option key={s.id} value={s.id}>{s.nis} - {s.name}</option>)}
            </select>
          </div>
          <div className="col-md-2"><button className="btn btn-sm btn-danger" onClick={hapusSantri}>Hapus Siswa</button></div>
        </div>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>No Induk</th><th>Nama</th><th>Kelas</th><th>Tagihan</th><th>Dibayar</th><th>Sisa</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.santri_nis}</td><td className="fw-bold">{r.santri_name}</td><td>{r.santri_class}</td>
                  <td>{fmtRp(r.amount)}</td><td>{fmtRp(r.paid_amount)}</td><td>{fmtRp(r.amount - r.paid_amount)}</td><td>{r.status}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted p-3">Tidak ada data. Pilih periode lalu Tampilkan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
