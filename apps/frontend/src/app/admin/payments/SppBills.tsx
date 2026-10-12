'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getSppBills, getSppSummary, getSppSantri, generateSppBills,
  createSppBill, updateSppBill, paySppBill, cancelSppBill, deleteSppBill, verifySppBill,
  getSppAutoConfig, updateSppAutoConfig,
  SppBill, SppSummary, SppSantri, SppAutoConfig,
} from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { openProofInNewTab } from '@/components/ProofImage';
import { Plus, Trash2, Search, X, Receipt, Calendar, Wallet, RotateCcw, Pencil, Users, Zap } from 'lucide-react';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriod(period: string) {
  const [y, m] = period.split('-');
  const idx = parseInt(m || '1', 10) - 1;
  if (!y || !m || idx < 0 || idx > 11) return period;
  return `${MONTHS_ID[idx]} ${y}`;
}

function statusBadge(status: string) {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-700';
  if (status === 'partial') return 'bg-amber-100 text-amber-700';
  if (status === 'pending') return 'bg-sky-100 text-sky-700';
  return 'bg-rose-100 text-rose-700';
}

function statusLabel(status: string) {
  if (status === 'paid') return 'Lunas';
  if (status === 'partial') return 'Sebagian';
  if (status === 'pending') return 'Menunggu Verifikasi';
  return 'Belum Bayar';
}

export default function SppBills() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState(currentPeriod());
  const [bills, setBills] = useState<SppBill[]>([]);
  const [summary, setSummary] = useState<SppSummary | null>(null);
  const [santriList, setSantriList] = useState<SppSantri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoCfg, setAutoCfg] = useState<SppAutoConfig>({ enabled: false, amount: 0, due_day: 10, wa_enabled: false });
  const [isSavingAuto, setIsSavingAuto] = useState(false);

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genAmount, setGenAmount] = useState('');
  const [genDueDate, setGenDueDate] = useState('');
  const [genPeriodEnd, setGenPeriodEnd] = useState('');
  const [genClass, setGenClass] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<SppBill | null>(null);
  const [billForm, setBillForm] = useState({ santri_id: '', amount: '', due_date: '', notes: '' });

  const [payBill, setPayBill] = useState<SppBill | null>(null);

  const doVerify = async (id: number, approve: boolean) => {
    let note = '';
    if (!approve) {
      const p = window.prompt('Alasan penolakan (opsional):');
      if (p === null) return;
      note = p;
    }
    const res = await verifySppBill(id, approve, note);
    if (res.success) {
      showToast('success', res.message || (approve ? 'Pembayaran diterima.' : 'Pembayaran ditolak.'));
      fetchData(period);
    } else {
      showToast('error', res.message || 'Gagal memverifikasi.');
    }
  };
  const [payForm, setPayForm] = useState({ amount: '', method: 'manual', paid_at: new Date().toISOString().split('T')[0], notes: '' });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const fetchData = useCallback(async (p: string) => {
    setIsLoading(true);
    try {
      const [bData, sData, santri, cfg] = await Promise.all([
        getSppBills({ period: p }),
        getSppSummary(p),
        getSppSantri(),
        getSppAutoConfig(),
      ]);
      setBills(bData);
      setSummary(sData);
      setSantriList(santri);
      setAutoCfg(cfg?.data || { enabled: false, amount: 0, due_day: 10, wa_enabled: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(period);
  }, [period, fetchData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(genAmount, 10);
    if (!period || !amount || amount <= 0) {
      showToast('error', 'Isi periode dan nominal yang valid.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateSppBills({ period, period_end: genPeriodEnd || undefined, amount, due_date: genDueDate || undefined, class: genClass || undefined });
      if (res.success) {
        showToast('success', res.message || 'Tagihan berhasil dibuat.');
        setIsGenerateOpen(false);
        setGenAmount('');
        setGenDueDate('');
        fetchData(period);
      } else {
        showToast('error', res.message || 'Gagal membuat tagihan.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAuto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autoCfg.amount <= 0) {
      showToast('error', 'Isi besar SPP terlebih dahulu.');
      return;
    }
    if (autoCfg.due_day < 1 || autoCfg.due_day > 28) {
      showToast('error', 'Jatuh tempo harus tanggal 1-28.');
      return;
    }
    setIsSavingAuto(true);
    try {
      const res = await updateSppAutoConfig(autoCfg);
      if (res.success) {
        showToast('success', res.message || 'Pengaturan tagihan otomatis disimpan.');
        fetchData(period);
      } else {
        showToast('error', res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingAuto(false);
    }
  };

  const openAddBill = () => {
    setEditingBill(null);
    setBillForm({ santri_id: '', amount: '', due_date: '', notes: '' });
    setIsBillModalOpen(true);
  };

  const openEditBill = (b: SppBill) => {
    setEditingBill(b);
    setBillForm({
      santri_id: String(b.santri_id),
      amount: String(b.amount),
      due_date: (b.due_date || '').split(' ')[0],
      notes: b.notes || '',
    });
    setIsBillModalOpen(true);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(billForm.amount, 10);
    if (!billForm.santri_id || !amount || amount <= 0) {
      showToast('error', 'Pilih santri dan isi nominal yang valid.');
      return;
    }
    try {
      const res = editingBill
        ? await updateSppBill(editingBill.id, { amount, due_date: billForm.due_date || undefined, notes: billForm.notes })
        : await createSppBill({
            santri_id: parseInt(billForm.santri_id, 10),
            period,
            amount,
            due_date: billForm.due_date || undefined,
            notes: billForm.notes,
          });
      if (res.success) {
        showToast('success', editingBill ? 'Tagihan berhasil diperbarui.' : 'Tagihan berhasil dibuat.');
        setIsBillModalOpen(false);
        fetchData(period);
      } else {
        const msg = (res as { errors?: Record<string, string[]> }).errors
          ? Object.values((res as { errors?: Record<string, string[]> }).errors || {}).flat().join(', ')
          : res.message || 'Gagal menyimpan tagihan.';
        showToast('error', msg);
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    }
  };

  const openPay = (b: SppBill) => {
    setPayBill(b);
    setPayForm({
      amount: String(b.amount - b.paid_amount),
      method: 'manual',
      paid_at: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBill) return;
    const amount = parseInt(payForm.amount, 10);
    const remaining = payBill.amount - payBill.paid_amount;
    if (!amount || amount <= 0 || amount > remaining) {
      showToast('error', `Jumlah bayar harus 1 s/d Rp ${remaining.toLocaleString('id-ID')}.`);
      return;
    }
    try {
      const res = await paySppBill(payBill.id, {
        amount,
        method: payForm.method,
        paid_at: payForm.paid_at ? payForm.paid_at + ' 00:00:00' : undefined,
        notes: payForm.notes,
      });
      if (res.success) {
        showToast('success', 'Pembayaran berhasil dicatat.');
        setPayBill(null);
        fetchData(period);
      } else {
        showToast('error', res.message || 'Gagal mencatat pembayaran.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      const res = await cancelSppBill(cancelId);
      if (res.success) {
        showToast('success', 'Pembayaran dibatalkan.');
        setIsCancelOpen(false);
        fetchData(period);
      } else {
        showToast('error', res.message || 'Gagal membatalkan.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteSppBill(deleteId);
      if (res.success) {
        showToast('success', 'Tagihan berhasil dihapus.');
        setIsDeleteOpen(false);
        fetchData(period);
      } else {
        showToast('error', res.message || 'Gagal menghapus tagihan.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan sistem.');
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (b.santri_name || '').toLowerCase().includes(q) ||
      (b.santri_nis || '').toLowerCase().includes(q) ||
      (b.santri_class || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const inputCls = 'w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800';
  const labelCls = 'block text-xs font-black text-slate-400 uppercase tracking-widest mb-2';

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Periode</label>
          <input
            type="month"
            value={period}
            onChange={(e) => e.target.value && setPeriod(e.target.value)}
            className="px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-700"
          />
        </div>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          <button
            onClick={openAddBill}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={18} /> Tagihan Satuan
          </button>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95"
          >
            <Users size={18} /> Generate Sebulan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 shadow-inner">
            <Receipt size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {(summary?.billed || 0).toLocaleString('id-ID')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{formatPeriod(period)} • {summary?.count_total || 0} santri</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Terkumpul</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {(summary?.collected || 0).toLocaleString('id-ID')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{summary?.count_paid || 0} lunas • {summary?.count_partial || 0} sebagian</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Tunggakan</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {(summary?.outstanding || 0).toLocaleString('id-ID')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">{summary?.count_unpaid || 0} belum bayar</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase font-outfit tracking-tight">Tagihan Otomatis</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Buat tagihan SPP tiap bulan tanpa repot generate manual.</p>
          </div>
        </div>
        <form onSubmit={handleSaveAuto} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className={labelCls}>Aktif</label>
            <button
              type="button"
              onClick={() => setAutoCfg({ ...autoCfg, enabled: !autoCfg.enabled })}
              className={`w-full py-4 rounded-xl border font-black uppercase tracking-widest text-[10px] transition-all ${autoCfg.enabled ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {autoCfg.enabled ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>
          <div>
            <label className={labelCls}>Besar SPP (Rp)</label>
            <input type="number" min="0" step="1000" placeholder="Contoh: 150000" value={autoCfg.amount || ''} onChange={(e) => setAutoCfg({ ...autoCfg, amount: Number(e.target.value) || 0 })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Jatuh Tempo (tanggal)</label>
            <input type="number" min="1" max="28" placeholder="Contoh: 10" value={autoCfg.due_day || ''} onChange={(e) => setAutoCfg({ ...autoCfg, due_day: Number(e.target.value) || 0 })} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAutoCfg({ ...autoCfg, wa_enabled: !autoCfg.wa_enabled })}
              className={`flex-1 py-4 rounded-xl border font-black uppercase tracking-widest text-[10px] transition-all ${autoCfg.wa_enabled ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              WA Wali {autoCfg.wa_enabled ? 'ON' : 'OFF'}
            </button>
            <button type="submit" disabled={isSavingAuto} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-60">
              {isSavingAuto ? '...' : 'Simpan'}
            </button>
          </div>
        </form>
        <p className="text-xs text-slate-400 font-medium mt-4">Sistem otomatis membuat tagihan untuk semua santri aktif di awal bulan jika bulan itu belum punya tagihan, lalu mengirim WA ke nomor wali (parent/father/mother phone) bila WA dinyalakan. Manual satu-satu tetap bisa dipakai lewat tombol “Tagihan Satuan”.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIS, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="shrink-0 w-full md:w-56">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="partial">Sebagian</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="paid">Lunas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan / Sisa</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredBills.map((b) => {
                  const remaining = b.amount - b.paid_amount;
                  const pct = b.amount > 0 ? Math.round((b.paid_amount / b.amount) * 100) : 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-800">{b.santri_name || `Santri #${b.santri_id}`}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{b.santri_nis || '-'} • {b.santri_class || '-'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900">Rp {b.amount.toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Sisa Rp {remaining.toLocaleString('id-ID')}</p>
                      </td>
                      <td className="px-8 py-5 min-w-[140px]">
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${b.status === 'paid' ? 'bg-emerald-500' : b.status === 'partial' ? 'bg-amber-500' : 'bg-slate-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{pct}% • Rp {b.paid_amount.toLocaleString('id-ID')}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-1">
                          {b.status === 'pending' && (
                            <>
                              {b.payment_proof && (
                                <button onClick={() => void openProofInNewTab(b.payment_proof, (m) => showToast('error', m))} title="Lihat bukti" className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all">
                                  Bukti
                                </button>
                              )}
                              <button onClick={() => doVerify(b.id, true)} title="Terima pembayaran" className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 transition-all">
                                Terima
                              </button>
                              <button onClick={() => doVerify(b.id, false)} title="Tolak pembayaran" className="px-3 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-black uppercase hover:bg-rose-50 transition-all">
                                Tolak
                              </button>
                            </>
                          )}
                          {b.status !== 'paid' && b.status !== 'pending' && (
                            <button onClick={() => openPay(b)} title="Bayar" className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-black uppercase hover:bg-sky-700 transition-all">
                              Bayar
                            </button>
                          )}
                          {b.status !== 'unpaid' && (
                            <button onClick={() => { setCancelId(b.id); setIsCancelOpen(true); }} title="Batalkan pembayaran" className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
                              <RotateCcw size={18} />
                            </button>
                          )}
                          <button onClick={() => openEditBill(b)} title="Ubah" className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all">
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(b.id); setIsDeleteOpen(true); }}
                            title="Hapus"
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Receipt className="text-slate-200" size={40} />
            </div>
            <p className="text-slate-400 font-medium">Belum ada tagihan periode {formatPeriod(period)}.</p>
            <p className="text-slate-400 text-sm mt-1">Klik “Generate Sebulan” untuk membuat tagihan semua santri aktif.</p>
          </div>
        )}
      </div>

      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsGenerateOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <form onSubmit={handleGenerate}>
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase font-outfit tracking-tight">Generate {formatPeriod(period)}</h3>
                <button type="button" onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="p-8 space-y-5">
                <p className="text-sm text-slate-500">Buat tagihan untuk <b>{santriList.length} santri aktif</b>. Santri yang sudah punya tagihan periode ini dilewati otomatis.</p>
                <div>
                  <label className={labelCls}>Nominal per Santri (Rp) *</label>
                  <input type="number" min="1" placeholder="Contoh: 150000" value={genAmount} onChange={(e) => setGenAmount(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Jatuh Tempo (opsional)</label>
                  <input type="date" value={genDueDate} onChange={(e) => setGenDueDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bulan Selesai (opsional, untuk rentang)</label>
                  <input type="month" value={genPeriodEnd} onChange={(e) => setGenPeriodEnd(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kelas (opsional)</label>
                  <select value={genClass} onChange={(e) => setGenClass(e.target.value)} className={inputCls}>
                    <option value="">Semua kelas</option>
                    {Array.from(new Set(santriList.map((x) => x.class).filter(Boolean))).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setIsGenerateOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" disabled={isGenerating} className="flex-1 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 disabled:opacity-60">
                  {isGenerating ? 'Memproses...' : 'Buat Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBillModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <form onSubmit={handleSaveBill}>
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase font-outfit tracking-tight">{editingBill ? 'Ubah Tagihan' : 'Tagihan Satuan'}</h3>
                <button type="button" onClick={() => setIsBillModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className={labelCls}>Santri *</label>
                  <select value={billForm.santri_id} disabled={!!editingBill} onChange={(e) => setBillForm({ ...billForm, santri_id: e.target.value })} className={`${inputCls} disabled:opacity-60`}>
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nominal (Rp) *</label>
                  <input type="number" min="1" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Jatuh Tempo</label>
                  <input type="date" value={billForm.due_date} onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Catatan</label>
                  <textarea rows={2} value={billForm.notes} onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setIsBillModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPayBill(null)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <form onSubmit={handlePay}>
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase font-outfit tracking-tight">Bayar Tagihan</h3>
                  <p className="text-sm text-slate-500 mt-1">{payBill.santri_name} • {formatPeriod(payBill.period)} • Sisa Rp {(payBill.amount - payBill.paid_amount).toLocaleString('id-ID')}</p>
                </div>
                <button type="button" onClick={() => setPayBill(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className={labelCls}>Jumlah Bayar (Rp) *</label>
                  <input type="number" min="1" max={payBill.amount - payBill.paid_amount} value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Metode</label>
                    <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className={inputCls}>
                      <option value="manual">Tunai / Manual</option>
                      <option value="transfer">Transfer Bank</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal</label>
                    <input type="date" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Catatan</label>
                  <input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Contoh: cicilan 1" className={inputCls} />
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setPayBill(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20">Catat Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Tagihan?"
        message="Tagihan yang belum ada pembayarannya akan dihapus permanen."
        confirmText="Hapus"
      />
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Batalkan Pembayaran?"
        message="Seluruh pembayaran tagihan ini dibatalkan dan status kembali belum lunas."
        confirmText="Batalkan"
      />
    </div>
  );
}
