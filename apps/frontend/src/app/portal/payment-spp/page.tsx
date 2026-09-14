'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  getMySantri, getMyBills, getMyLedger,
  submitSppProof, submitIuranProof, uploadImage,
  Santri, MyBill, PayTx, SettingsMap,
} from '@/lib/api';
import { getPublicSettingsMap } from '@/lib/api';
import KwitansiModal, { KwitansiTx, formatPeriode } from '@/components/KwitansiModal';
import { useToast } from '@/components/Toast';

function rp(n: number) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

export default function PortalPaymentSppPage() {
  const { showToast } = useToast();
  const [santris, setSantris] = useState<Santri[]>([]);
  const [bills, setBills] = useState<MyBill[]>([]);
  const [ledger, setLedger] = useState<PayTx[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<MyBill | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Transfer');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [kwitansi, setKwitansi] = useState<KwitansiTx | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b, l, st] = await Promise.all([getMySantri(), getMyBills(), getMyLedger(), getPublicSettingsMap()]);
      setSantris(s);
      setBills(b);
      setLedger(l);
      setSettings(st);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openPay = (b: MyBill) => {
    setPaying(b);
    setAmount(String(b.remain));
    setFile(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const nominal = parseInt(amount, 10);
    if (!nominal || nominal <= 0 || nominal > paying.remain) {
      showToast('error', `Nominal 1 s/d ${rp(paying.remain)}.`);
      return;
    }
    if (!file) {
      showToast('error', 'Upload bukti transfer dulu.');
      return;
    }
    setSaving(true);
    try {
      const up = await uploadImage(file, 'proof');
      const proofUrl: string = up.url || up?.data?.url || '';
      if (!proofUrl) {
        showToast('error', 'Upload bukti gagal.');
        setSaving(false);
        return;
      }
      const payload = { amount: nominal, method, paid_at: new Date().toISOString().slice(0, 19).replace('T', ' '), proof_url: proofUrl };
      const res = paying.bill_type === 'SPP'
        ? await submitSppProof(paying.bill_id, payload)
        : await submitIuranProof(paying.bill_id, payload);
      if (res.success) {
        showToast('success', 'Bukti terkirim, menunggu verifikasi bendahara.');
        setPaying(null);
        setAmount('');
        setFile(null);
        load();
      } else {
        showToast('error', res.message || 'Gagal mengirim.');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const openKwitansiTx = (t: PayTx) => {
    setKwitansi({
      code: t.code,
      date: t.date,
      santri_nis: t.santri_nis,
      santri_name: t.santri_name,
      description: t.description,
      amount: t.amount,
      method: t.method,
    });
  };

  const bankInfo = [settings.psb_payment_bank_name, settings.psb_payment_account_number, settings.psb_payment_account_name].filter(Boolean).join(' • ');

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (santris.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-black">Akun belum terhubung ke santri.</p>
        <p className="mt-1">Hubungi admin/panitia agar akun ini dihubungkan ke data santri, lalu tagihan akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900">Pembayaran SPP & Iuran</h1>
        <p className="text-sm text-slate-500">Tagihan aktif, kirim bukti transfer, dan unduh kwitansi.</p>
      </div>

      {bankInfo && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-black">Transfer ke: {bankInfo}</p>
          <p className="mt-1 text-xs">Setelah transfer, pilih tagihan di bawah lalu upload bukti. Bendahara akan memverifikasi.</p>
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-slate-500">Tagihan Belum Lunas</h2>
        {bills.length === 0 ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            Alhamdulillah, tidak ada tagihan. Semua lunas.
          </p>
        ) : (
          <div className="space-y-2">
            {bills.map((b) => (
              <div key={`${b.bill_type}-${b.bill_id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {b.bill_type === 'SPP' ? `SPP ${formatPeriode(b.period)}` : `${b.name} (${b.period.slice(0, 7)})`}
                    </p>
                    <p className="text-xs text-slate-500">{b.santri_name} • Sisa <b className="text-rose-600">{rp(b.remain)}</b> dari {rp(b.amount)}</p>
                    {b.status === 'pending' && (
                      <p className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                        Menunggu verifikasi bendahara
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const tx = ledger.find((t) => t.bill_id === b.bill_id && t.bill_type === b.bill_type);
                        if (tx) openKwitansiTx(tx);
                        else showToast('error', 'Belum ada pembayaran tercatat.');
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Kwitansi
                    </button>
                    {b.status !== 'pending' && (
                      <button onClick={() => openPay(b)} className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
                {paying && paying.bill_type === b.bill_type && paying.bill_id === b.bill_id && (
                  <form onSubmit={submit} className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <input type="number" min="1" max={paying.remain} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nominal" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <option>Transfer</option><option>Tunai</option>
                    </select>
                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="col-span-2 text-sm" />
                    <div className="col-span-2 flex gap-2">
                      <button type="button" onClick={() => setPaying(null)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">
                        Batal
                      </button>
                      <button disabled={saving} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                        {saving ? 'Mengirim…' : `Kirim Bukti ${rp(parseInt(amount || '0', 10))}`}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-slate-500">Riwayat Pembayaran</h2>
        {ledger.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-400">Belum ada riwayat.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.description}</p>
                  <p className="text-xs text-slate-500">{(t.date || '').slice(0, 10)} • {t.method} • {t.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-emerald-700">{rp(t.amount)}</p>
                  <button
                    onClick={() => openKwitansiTx(t)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Kwitansi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {kwitansi && <KwitansiModal data={kwitansi} onClose={() => setKwitansi(null)} />}
    </div>
  );
}
