'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  History, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  Lock,
  Plus,
  Nfc
} from 'lucide-react';
import { getMyWallet, getWalletHistory, setWalletPIN, type Wallet, type WalletTransaction } from '@/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      const [wData, hData] = await Promise.all([
        getMyWallet(),
        getWalletHistory(20)
      ]);
      if (cancelled) {
        return;
      }
      setWallet(wData);
      setHistory(hData);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleSetPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    
    setIsSettingPin(true);
    const success = await setWalletPIN(pin);
    if (success) {
      setShowPinModal(false);
      setRefreshTick((value) => value + 1);
    } else {
      alert("Gagal mengatur PIN");
    }
    setIsSettingPin(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 shadow-inner">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
        <p className="font-outfit text-sm font-black uppercase tracking-widest text-slate-400">Sinkronisasi Dompet...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/portal" className="inline-flex items-center gap-2 w-fit rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 border border-slate-200">
          <ArrowLeft size={16} /> Kembali ke Portal
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg w-fit">
          Dompet Digital
        </div>
      </div>

      {/* Hero Section (Digital Card Replica) */}
      <div className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute right-0 top-0 h-64 w-64 -mr-20 -mt-20 rounded-full bg-cyan-500/20 blur-[80px]" />
        <div className="absolute left-0 bottom-0 h-64 w-64 -ml-20 -mb-20 rounded-full bg-emerald-500/20 blur-[80px]" />
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20">
                <Nfc size={20} />
              </div>
              <span className="font-outfit text-sm font-black uppercase tracking-widest text-white/50">Darussunnah Pay</span>
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-md">Total Saldo</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h1 className="font-outfit text-5xl md:text-6xl font-black tracking-tight drop-shadow-lg">
                {formatCurrency(wallet?.balance || 0).replace('Rp', '')}
              </h1>
              <span className="text-xl font-bold text-white/50">IDR</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!wallet?.has_pin && (
              <button 
                onClick={() => setShowPinModal(true)}
                className="flex items-center gap-2 rounded-[1.25rem] bg-rose-500/20 border border-rose-500/30 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-300 backdrop-blur-md hover:bg-rose-500/40 transition-all"
              >
                <Lock size={16} /> Atur PIN
              </button>
            )}
            <Link 
              href="/portal/wallet/topup"
              className="flex items-center gap-2 rounded-[1.25rem] bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all hover:bg-cyan-50 hover:-translate-y-1"
            >
              <Plus size={16} /> Top Up
            </Link>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
          <h4 className="font-outfit text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <History size={20} className="text-slate-400" /> Mutasi Terakhir
          </h4>
          <button onClick={fetchData} className="rounded-full hover:bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-4 ring-8 ring-slate-50/50">
              <History size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum Ada Transaksi</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs">Silakan lakukan top-up saldo di kasir pusat untuk memulai transaksi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((tr) => (
              <div key={tr.id} className="group flex items-center justify-between rounded-[1.5rem] bg-white border border-slate-100 p-5 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50">
                <div className="flex items-center gap-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
                    tr.type === 'deposit' 
                      ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' 
                      : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                  }`}>
                    {tr.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 capitalize leading-tight group-hover:text-blue-600 transition-colors">
                      {tr.description || 'Transaksi Saku'}
                    </h5>
                    <p className="mt-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {new Date(tr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      {new Date(tr.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className={`text-right font-outfit text-lg font-black ${
                  tr.type === 'deposit' ? 'text-emerald-500' : 'text-slate-900'
                }`}>
                  {tr.type === 'deposit' ? '+' : '-'} {formatCurrency(tr.amount).replace('Rp', '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
              <ShieldCheck size={32} />
            </div>
            <h2 className="mb-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">Atur PIN Saku</h2>
            <p className="mb-8 text-sm text-slate-500 leading-relaxed">PIN 6 digit ini akan ditanyakan setiap kali Anda melakukan pembelian di area pondok.</p>
            
            <form onSubmit={handleSetPIN} className="space-y-6">
              <input 
                type="password"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                className="w-full rounded-[1.25rem] border-2 border-slate-100 bg-slate-50 p-5 text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-cyan-500 transition-all font-outfit"
                onChange={e => setPin(e.target.value)}
              />
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 rounded-[1.25rem] py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={pin.length < 4 || isSettingPin}
                  className="flex-1 rounded-[1.25rem] bg-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-cyan-600 transition-all disabled:opacity-50"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
