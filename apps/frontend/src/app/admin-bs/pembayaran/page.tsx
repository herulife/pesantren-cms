'use client';

import React, { useEffect, useState } from 'react';
import { getSppSantri, getUnpaidBills, paySppBill, payIuranBill, getReceipt, SppSantri, UnpaidBill, ReceiptData } from '@/lib/api';
import KwitansiModal from '@/components/KwitansiModal';
import { fmtRp, BsTitle, BsAlert, Toast, useToastState } from '../ui';

export default function BsPembayaran() {
  const [santris, setSantris] = useState<SppSantri[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SppSantri | null>(null);
  const [bills, setBills] = useState<UnpaidBill[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Tunai');
  const [paying, setPaying] = useState<UnpaidBill | null>(null);
  const [kwitansi, setKwitansi] = useState<ReceiptData | null>(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  useEffect(() => {
    getSppSantri().then(setSantris).catch(() => {});
  }, []);

  const pick = async (s: SppSantri) => {
    setSelected(s);
    setPaying(null);
    setBills(await getUnpaidBills(s.id));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const nominal = parseInt(amount, 10);
    if (!nominal || nominal <= 0 || nominal > paying.remain) {
      setOk(false);
      setMsg(`Nominal 1 s/d ${fmtRp(paying.remain)}.`);
      return;
    }
    const paidBill = paying;
    const r = paying.bill_type === 'SPP'
      ? await paySppBill(paying.bill_id, { amount: nominal, method })
      : await payIuranBill(paying.bill_id, { amount: nominal, method });
    setOk(r.success);
    setMsg(r.message || '');
    if (r.success && selected) {
      setPaying(null);
      setAmount('');
      setBills(await getUnpaidBills(selected.id));
      setKwLoading(true);
      const kw = await getReceipt(selected.id, (paidBill?.period || '').slice(0, 7));
      setKwLoading(false);
      if (kw) setKwitansi(kw);
    }
  };

  const list = santris.filter((s) => (s.nis + s.name).toLowerCase().includes(search.toLowerCase())).slice(0, 50);

  return (
    <div>
      <BsTitle>Pembayaran Siswa</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Pilih Siswa</h3></div>
            <div className="card-body">
              <input className="form-control form-control-sm mb-2" placeholder="Cari NIS/nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="list-group" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {list.map((s) => (
                  <button key={s.id} type="button" onClick={() => pick(s)} className={`list-group-item list-group-item-action${selected?.id === s.id ? ' active' : ''}`}>
                    <div className="fw-bold">{s.name}</div>
                    <small>{s.nis} • {s.class}</small>
                  </button>
                ))}
                {list.length === 0 && <p className="text-muted small p-2">Tidak ada santri.</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card card-primary">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Rincian Tagihan {selected ? `- ${selected.name}` : ''}</h3>
              {selected && (
                <button
                  type="button"
                  disabled={kwLoading}
                  onClick={async () => {
                    const now = new Date();
                    const per = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    setKwLoading(true);
                    const kw = await getReceipt(selected.id, per);
                    setKwLoading(false);
                    if (kw) setKwitansi(kw);
                    else {
                      setOk(false);
                      setMsg('Belum ada pembayaran bulan ini.');
                    }
                  }}
                  className="btn btn-sm btn-success"
                >
                  {kwLoading ? 'Memuat…' : 'Kwitansi Bulan Ini'}
                </button>
              )}
            </div>
            <div className="card-body table-responsive p-0">
              <table className="table table-bordered table-striped table-sm text-sm mb-0">
                <thead><tr><th>Tagihan</th><th>Periode</th><th>Sisa</th><th>Aksi</th></tr></thead>
                <tbody>
                  {selected && bills.length === 0 && <tr><td colSpan={4} className="text-center text-success p-3">Lunas semua.</td></tr>}
                  {!selected && <tr><td colSpan={4} className="text-center text-muted p-3">Silakan pilih siswa terlebih dahulu.</td></tr>}
                  {bills.map((b) => (
                    <tr key={`${b.bill_type}-${b.bill_id}`}>
                      <td className="fw-bold">{b.bill_type === 'SPP' ? `SPP ${b.period}` : b.name}</td>
                      <td>{b.period}</td><td className="text-danger fw-bold">{fmtRp(b.remain)}</td>
                      <td><button className="btn btn-xs btn-primary" onClick={() => { setPaying(b); setAmount(String(b.remain)); }}>Bayar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {paying && (
            <div className="card card-success">
              <div className="card-header"><h3 className="card-title">Simpan Pembayaran</h3></div>
              <form onSubmit={submit}>
                <div className="card-body row g-2">
                  <div className="col-md-4"><label className="form-label">Nominal Bayar</label><input type="number" min="1" max={paying.remain} className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
                  <div className="col-md-4"><label className="form-label">Jenis Pembayaran</label>
                    <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option>Tunai</option><option>Transfer</option>
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end gap-2">
                    <button className="btn btn-success btn-sm">Simpan Pembayaran</button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPaying(null)}>Batal</button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      {kwitansi && <KwitansiModal data={kwitansi} onClose={() => setKwitansi(null)} />}
      </div>
    </div>
  );
}
