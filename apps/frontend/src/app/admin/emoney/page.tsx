'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Lock,
  Unlock,
  KeyRound,
  History,
  Trash2,
  X,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  getAdminWalletList,
  getAdminWalletHistory,
  adjustWalletBalance,
  setAdminWalletActive,
  resetAdminWalletPIN,
  deleteAdminWallet,
  type AdminWalletRow,
  type WalletTransaction,
} from '@/lib/api';

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

type AdjustKind = 'deposit' | 'withdrawal';

export default function AdminEMoneyPage() {
  const { showToast } = useToast();

  const [rows, setRows] = useState<AdminWalletRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [adjustTarget, setAdjustTarget] = useState<{ row: AdminWalletRow; kind: AdjustKind } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  const [pinTarget, setPinTarget] = useState<AdminWalletRow | null>(null);
  const [pinValue, setPinValue] = useState('');

  const [historyTarget, setHistoryTarget] = useState<AdminWalletRow | null>(null);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<{ row: AdminWalletRow; action: 'freeze' | 'activate' | 'delete' } | null>(null);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const res = await getAdminWalletList({ search: term, limit: 100 });
      setRows(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const summary = useMemo(() => {
    const totalSaldo = rows.reduce((sum, r) => sum + (r.balance || 0), 0);
    const aktif = rows.filter((r) => r.is_active).length;
    return { totalSaldo, aktif };
  }, [rows]);

  const closeAdjust = () => {
    setAdjustTarget(null);
    setAdjustAmount('');
    setAdjustDesc('');
  };

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) {
      showToast('error', 'Nominal tidak valid');
      return;
    }
    setActionLoading(true);
    const res = await adjustWalletBalance(adjustTarget.row.user_id, adjustTarget.kind, amount, adjustDesc.trim());
    setActionLoading(false);
    if (res.ok) {
      showToast('success', res.message);
      closeAdjust();
      void load(search);
    } else {
      showToast('error', res.message);
    }
  };

  const openHistory = async (row: AdminWalletRow) => {
    setHistoryTarget(row);
    setHistoryLoading(true);
    const data = await getAdminWalletHistory(row.user_id, 100);
    setHistory(data);
    setHistoryLoading(false);
  };

  const submitPin = async () => {
    if (!pinTarget) return;
    setActionLoading(true);
    const res = await resetAdminWalletPIN(pinTarget.user_id, pinValue.trim());
    setActionLoading(false);
    if (res.ok) {
      showToast('success', res.message);
      setPinTarget(null);
      setPinValue('');
      void load(search);
    } else {
      showToast('error', res.message);
    }
  };

  const runConfirm = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    let res: { ok: boolean; message: string };
    if (confirmTarget.action === 'delete') {
      res = await deleteAdminWallet(confirmTarget.row.user_id);
    } else {
      res = await setAdminWalletActive(confirmTarget.row.user_id, confirmTarget.action === 'activate');
    }
    setActionLoading(false);
    if (res.ok) {
      showToast('success', res.message);
      setConfirmTarget(null);
      void load(search);
    } else {
      showToast('error', res.message);
    }
  };

  const confirmCopy = () => {
    if (!confirmTarget) return { title: '', message: '', type: 'danger' as const, confirmText: 'Proses' };
    const name = confirmTarget.row.santri_name || confirmTarget.row.name;
    if (confirmTarget.action === 'delete') {
      return {
        title: 'Hapus Dompet',
        message: `Hapus dompet ${name}? Seluruh mutasi dompet akan ikut terhapus dan tidak bisa dikembalikan.`,
        type: 'danger' as const,
        confirmText: 'Hapus',
      };
    }
    if (confirmTarget.action === 'freeze') {
      return {
        title: 'Bekukan Dompet',
        message: `Bekukan dompet ${name}? Santri tidak bisa memakai saldo sampai diaktifkan kembali.`,
        type: 'warning' as const,
        confirmText: 'Bekukan',
      };
    }
    return {
      title: 'Aktifkan Dompet',
      message: `Aktifkan kembali dompet ${name}?`,
      type: 'info' as const,
      confirmText: 'Aktifkan',
    };
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">E-Money (Dompet)</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola saldo, PIN, dan mutasi dompet santri. Setiap top-up/penarikan otomatis tercatat di Kas.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / NIS / email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 md:w-72"
            />
          </div>
          <button
            onClick={() => void load(search)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Muat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Saldo Beredar</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatRupiah(summary.totalSaldo)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Jumlah Dompet</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Dompet Aktif</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.aktif}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Santri / Pemilik</th>
                <th className="px-5 py-3.5">NIS</th>
                <th className="px-5 py-3.5 text-right">Saldo</th>
                <th className="px-5 py-3.5">PIN</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    <Loader2 className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">
                    Tidak ada dompet yang cocok.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.user_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{row.santri_name || row.name}</p>
                      <p className="text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{row.nis || '-'}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-800">{formatRupiah(row.balance)}</td>
                    <td className="px-5 py-4">
                      {row.has_pin ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Aktif</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Belum</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {row.is_active ? (
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-600">Aktif</span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600">Beku</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustTarget({ row, kind: 'deposit' })}
                          title="Top up"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Plus size={13} /> Top Up
                        </button>
                        <button
                          onClick={() => setAdjustTarget({ row, kind: 'withdrawal' })}
                          title="Tarik / refund"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Minus size={13} /> Tarik
                        </button>
                        <button
                          onClick={() => void openHistory(row)}
                          title="Mutasi"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          <History size={13} /> Mutasi
                        </button>
                        <button
                          onClick={() => { setPinTarget(row); setPinValue(''); }}
                          title="Reset PIN"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          <KeyRound size={13} /> PIN
                        </button>
                        <button
                          onClick={() => setConfirmTarget({ row, action: row.is_active ? 'freeze' : 'activate' })}
                          title={row.is_active ? 'Bekukan' : 'Aktifkan'}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          {row.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                          {row.is_active ? 'Bekukan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => setConfirmTarget({ row, action: 'delete' })}
                          title="Hapus dompet"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeAdjust} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {adjustTarget.kind === 'deposit' ? 'Top Up Saldo' : 'Tarik / Refund Saldo'}
              </h3>
              <button onClick={closeAdjust} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {adjustTarget.row.santri_name || adjustTarget.row.name} &middot; saldo {formatRupiah(adjustTarget.row.balance)}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nominal</label>
                <input
                  type="number"
                  min={0}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Keterangan</label>
                <input
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  placeholder={adjustTarget.kind === 'deposit' ? 'Top-up tunai di kasir' : 'Refund sisa saldo'}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={closeAdjust} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Batal
              </button>
              <button
                onClick={() => void submitAdjust()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : adjustTarget.kind === 'deposit' ? <Plus size={16} /> : <Minus size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {pinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPinTarget(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Reset PIN</h3>
              <button onClick={() => setPinTarget(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {pinTarget.santri_name || pinTarget.name}. Kosongkan lalu simpan untuk menghapus PIN.
            </p>
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">PIN Baru</label>
              <input
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                inputMode="numeric"
                placeholder="Minimal 4 digit"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setPinTarget(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Batal
              </button>
              <button
                onClick={() => void submitPin()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setHistoryTarget(null)} />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Mutasi Dompet</h3>
              <button onClick={() => setHistoryTarget(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {historyTarget.santri_name || historyTarget.name} &middot; saldo {formatRupiah(historyTarget.balance)}
            </p>
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400"><Loader2 className="mx-auto animate-spin" /></div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Belum ada mutasi.</div>
              ) : (
                history.map((tr) => {
                  const isIn = tr.type === 'deposit';
                  return (
                    <div key={tr.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isIn ? <ArrowDownCircle size={18} className="text-emerald-500" /> : <ArrowUpCircle size={18} className="text-amber-500" />}
                        <div>
                          <p className="text-sm font-bold text-slate-700">{tr.description || (isIn ? 'Top-up' : 'Transaksi')}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(tr.created_at)} &middot; {tr.type}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-black ${isIn ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isIn ? '+' : '-'}{formatRupiah(tr.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => void runConfirm()}
        title={confirmCopy().title}
        message={confirmCopy().message}
        confirmText={confirmCopy().confirmText}
        type={confirmCopy().type}
        isLoading={actionLoading}
      />
    </div>
  );
}
