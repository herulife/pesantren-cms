'use client';

import React, { useEffect, useState } from 'react';
import { getKasTransactions, createKasTransaction, deleteKasTransaction, getKasCategories, KasTransaction, KasCategory } from '@/lib/api';
import { fmtRp, BsTitle, BsAlert, PageHeader } from '../ui';
import { exportToExcel } from '@/lib/export';
import { useConfirm } from '@/components/ConfirmProvider';


export default function BsKas() {
  const [rows, setRows] = useState<KasTransaction[]>([]);
  const [cats, setCats] = useState<KasCategory[]>([]);
  const [kind, setKind] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], kind: 'masuk', category_id: '', amount: '', method: 'Tunai', notes: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async () => {
    const [t, c] = await Promise.all([
      getKasTransactions({ date_from: from || undefined, date_to: to || undefined, kind: kind || undefined }),
      getKasCategories(),
    ]);
    setRows(t);
    setCats(c);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createKasTransaction({
      date: form.date,
      kind: form.kind,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      amount: Number(form.amount),
      method: form.method,
      notes: form.notes,
    });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ ...form, amount: '', notes: '' });
      load();
    }
  };

  const confirmDialog = useConfirm();

  const hapus = async (id: number) => {
    if (!(await confirmDialog({ title: 'Hapus transaksi', message: 'Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.', confirmText: 'Hapus' }))) return;
    const r = await deleteKasTransaction(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  return (
    <div>
      <PageHeader
        title="Kas Masuk / Keluar"
        breadcrumb="Transaksi / Kas"
        actions={
          <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={() => exportToExcel('Transaksi Kas', ['Kode', 'Tanggal', 'Kategori', 'Jenis', 'Keterangan', 'Nominal', 'Oleh'], rows.map((r) => [r.code || '-', r.date, r.category || '-', r.kind, r.notes || '-', r.amount, r.creator || '-']), 'transaksi_kas')}>Export Excel</button>
        }
      />
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Transaksi</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-2"><label className="form-label">Tanggal</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="col-md-2"><label className="form-label">Jenis</label>
              <select className="form-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="masuk">Kas Masuk</option><option value="keluar">Kas Keluar</option>
              </select>
            </div>
            <div className="col-md-3"><label className="form-label">Kategori</label>
              <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">- Pilih -</option>
                {cats.filter((c) => c.kind === form.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-2"><label className="form-label">Nominal</label><input type="number" min="1" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="col-md-3"><label className="form-label">Keterangan</label><input className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="col-md-12"><button className="btn btn-primary btn-sm">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-tools d-flex gap-2 align-items-end">
            <select className="form-select form-select-sm" value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 150 }}>
              <option value="">Semua Jenis</option><option value="masuk">Kas Masuk</option><option value="keluar">Kas Keluar</option>
            </select>
            <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 160 }} />
            <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 160 }} />
            <button className="btn btn-sm btn-secondary" onClick={load}>Tampilkan</button>
          </div>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>#</th><th>Kode</th><th>Tanggal</th><th>Kategori</th><th>Jenis</th><th>Keterangan</th><th>Nominal</th><th>Oleh</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td><td>{r.code || '-'}</td><td>{r.date}</td><td>{r.category || '-'}</td>
                  <td>{r.kind}</td><td>{r.notes || '-'}</td><td className="fw-bold">{fmtRp(r.amount)}</td>
                  <td>{r.creator || '-'}</td>
                  <td><button className="btn btn-xs btn-danger" onClick={() => hapus(r.id)}>Hapus</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
