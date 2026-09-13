'use client';

import React, { useEffect, useState } from 'react';
import { getDonations, getDonors, getCampaigns, createDonation, verifyDonation, Donation, Donor, Campaign } from '@/lib/api';
import { fmtRp, BsTitle, BsAlert, PageHeader } from '../ui';
import { exportToExcel } from '@/lib/export';

const TYPES = ['Infak', 'Sedekah', 'Wakaf', 'Zakat'];

export default function BsDonasi() {
  const [rows, setRows] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], donor_id: '', donor_name: '', type: 'Infak', campaign_id: '', amount: '', method: 'Tunai', notes: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const load = async () => {
    const [d, dn, c] = await Promise.all([getDonations({}), getDonors(''), getCampaigns()]);
    setRows(d);
    setDonors(dn);
    setCampaigns(c);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createDonation({
      campaign_id: Number(form.campaign_id) || 0,
      donor_id: form.donor_id ? Number(form.donor_id) : undefined,
      donor_name: form.donor_name,
      amount: Number(form.amount),
      type: form.type,
      method: form.method,
      notes: form.notes,
    });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) {
      setForm({ date: new Date().toISOString().split('T')[0], donor_id: '', donor_name: '', type: 'Infak', campaign_id: '', amount: '', method: 'Tunai', notes: '' });
      load();
    }
  };

  const verif = async (id: number) => {
    if (!confirm('Verifikasi donasi ini?')) return;
    const r = await verifyDonation(id);
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success) load();
  };

  return (
    <div>
      <PageHeader
        title="Transaksi Donasi"
        breadcrumb="Transaksi / Donasi"
        actions={
          <button type="button" className="alma-btn alma-btn-success alma-btn-sm" onClick={() => exportToExcel('Transaksi Donasi', ['Tanggal', 'Donatur', 'Jenis', 'Besar', 'Keterangan', 'Status'], rows.slice(0, 500).map((r) => [(r.donation_date || r.created_at || '').slice(0, 10), r.donor_name, r.type || '-', r.amount, r.notes || r.message || '-', r.status]), 'transaksi_donasi')}>Export Excel</button>
        }
      />
      <BsAlert msg={msg} ok={ok} />
      <div className="card card-primary">
        <div className="card-header"><h3 className="card-title">Tambah Donasi</h3></div>
        <form onSubmit={submit}>
          <div className="card-body row g-2">
            <div className="col-md-2"><label className="form-label">Tanggal</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="col-md-3"><label className="form-label">Donatur (master)</label>
              <select className="form-select" value={form.donor_id} onChange={(e) => {
                const d = donors.find((x) => x.id === Number(e.target.value));
                setForm({ ...form, donor_id: e.target.value, donor_name: d ? d.name : form.donor_name });
              }}>
                <option value="">-- Pilih / isi manual --</option>
                {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="col-md-2"><label className="form-label">Nama Donatur</label><input className="form-control" value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} required /></div>
            <div className="col-md-2"><label className="form-label">Jenis</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-3"><label className="form-label">Campaign</label>
              <select className="form-select" value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">-- Umum --</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="col-md-2"><label className="form-label">Besar Donasi</label><input type="number" min="1" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="col-md-2"><label className="form-label">Metode</label>
              <select className="form-select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option>Tunai</option><option>Transfer</option>
              </select>
            </div>
            <div className="col-md-4"><label className="form-label">Keterangan</label><input className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="col-md-2 d-flex align-items-end"><button className="btn btn-primary btn-sm">Simpan</button></div>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>Tanggal</th><th>Donatur</th><th>Jenis</th><th>Besar</th><th>Keterangan</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td>{(r.donation_date || r.created_at || '').slice(0, 10)}</td>
                  <td className="fw-bold">{r.donor_name}</td><td>{r.type || '-'}</td>
                  <td>{fmtRp(r.amount)}</td><td>{r.notes || r.message || '-'}</td><td>{r.status}</td>
                  <td>{r.status !== 'verified' && <button className="btn btn-xs btn-success" onClick={() => verif(r.id)}>Verifikasi</button>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
