'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, Wallet, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { topUpWalletAdmin } from '@/lib/api';

export default function AdminTopUpPage() {
  const [studentID, setStudentID] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Top-up Saldo Tunai');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentID || !amount) return;

    setIsLoading(true);
    const success = await topUpWalletAdmin(parseInt(studentID), parseFloat(amount), description);
    if (success) {
      setIsSuccess(true);
      setAmount('');
      setStudentID('');
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      alert("Gagal melakukan top-up. Pastikan ID Santri benar.");
    }
    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl pb-20">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="rounded-full bg-emerald-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
          Kasir Dompet Digital
        </div>
      </div>

      <div className="mb-10 text-center">
        <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-slate-900">Top Up Saldo</h1>
        <p className="mt-2 text-slate-500">Isi saldo dompet digital santri melalui kasir pusat.</p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl">
        {isSuccess && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-emerald-50 p-6 text-emerald-700 border border-emerald-100 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={32} />
            <div>
              <p className="font-black uppercase tracking-widest text-xs">Berhasil!</p>
              <p className="text-sm font-medium">Pengisian saldo telah berhasil diproses.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleTopUp} className="space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">ID Santri (Database ID)</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number"
                required
                placeholder="Masukkan ID Unik Santri..."
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 pl-12 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
                value={studentID}
                onChange={e => setStudentID(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Jumlah Top Up (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
              <input 
                type="number"
                required
                min="0"
                placeholder="0"
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 pl-12 text-2xl font-black text-slate-900 outline-none focus:border-emerald-500 transition-all font-outfit"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan / Memo</label>
            <input 
              type="text"
              placeholder="Contoh: Titipan Uang Saku Orang Tua"
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading || !studentID || !amount}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/20 transition-all hover:bg-emerald-600 hover:-translate-y-1 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
            Proses Top Up Sekarang
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-2xl bg-blue-50 p-6 border border-blue-100">
        <h4 className="font-bold text-blue-900 flex items-center gap-2 uppercase tracking-widest text-xs mb-3">
          <Wallet size={16} /> Informasi Kasir
        </h4>
        <p className="text-xs leading-relaxed text-blue-800/80">
          Pastikan Anda telah menerima uang tunai dari santri atau wali santri sebelum memproses pengisian saldo ini. Transaksi yang sudah diproses tidak dapat dibatalkan secara mandiri.
        </p>
      </div>
    </div>
  );
}
