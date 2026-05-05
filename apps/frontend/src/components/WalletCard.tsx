'use client';

import React, { useEffect, useState } from 'react';
import { 
  History, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Nfc,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { getMyWallet, type Wallet } from '@/lib/api';

export default function WalletCard() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadWallet = async () => {
      setIsLoading(true);
      const data = await getMyWallet();
      if (cancelled) {
        return;
      }
      setWallet(data);
      setIsLoading(false);
    };

    void loadWallet();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* The "Physical" Card */}
      <div className="group relative flex-1 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl transition-all hover:shadow-cyan-500/20">
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[80px] transition-all group-hover:bg-cyan-400/30" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-[80px] transition-all group-hover:bg-emerald-400/30" />
        
        {/* Card Pattern/Texture */}
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20">
                <Nfc size={20} />
              </div>
              <span className="font-outfit text-sm font-black uppercase tracking-widest text-white/50">Darussunnah Pay</span>
            </div>
            <button 
              onClick={() => setRefreshTick((value) => value + 1)}
              className="rounded-full bg-white/5 p-2 text-white/50 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white active:scale-95"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="mt-8 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-md">Saldo Tersedia</p>
            <div className="mt-1 flex items-baseline gap-1">
              <h3 className="font-outfit text-4xl font-black tracking-tight text-white drop-shadow-lg">
                {isLoading ? '...' : formatCurrency(wallet?.balance || 0).replace('Rp', '')}
              </h3>
              <span className="text-lg font-bold text-white/50">IDR</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">ID Pelajar</span>
              <span className="font-mono text-sm font-bold tracking-widest text-white/80">
                {isLoading ? '•••• •••• ••••' : `DRS • ${wallet?.user_id || '000'} • ${wallet?.id || '000'}`}
              </span>
            </div>
            
            <div className="flex gap-1.5">
              <div className="h-6 w-6 rounded-full bg-rose-500/80 mix-blend-screen" />
              <div className="h-6 w-6 -ml-3 rounded-full bg-amber-500/80 mix-blend-screen" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portal/wallet/topup"
          className="group flex flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-emerald-50 py-4 border border-emerald-100 transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 transition-colors group-hover:bg-white/20 group-hover:text-white">
            <Plus size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-colors group-hover:text-white">Top Up</span>
        </Link>
        <Link
          href="/portal/wallet"
          className="group flex flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-slate-50 py-4 border border-slate-200 transition-all hover:bg-slate-900 hover:shadow-lg hover:shadow-slate-900/20"
        >
          <div className="rounded-full bg-slate-200 p-2 text-slate-600 transition-colors group-hover:bg-white/20 group-hover:text-white">
            <History size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors group-hover:text-white">Mutasi</span>
        </Link>
      </div>

      {/* Security Warning */}
      {!isLoading && !wallet?.has_pin && (
        <Link 
          href="/portal/wallet"
          className="group flex items-center justify-between rounded-2xl bg-rose-50 p-4 border border-rose-100 transition-all hover:bg-rose-100"
        >
          <div className="flex items-center gap-3 text-rose-600">
            <ShieldAlert size={20} className="shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Pin Belum Diatur</p>
              <p className="text-xs font-medium text-rose-600/80 mt-0.5">Atur PIN transaksi sekarang</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-rose-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
      
      {!isLoading && wallet?.has_pin && (
        <div className="flex items-center justify-center gap-2 rounded-xl py-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dompet Terlindungi PIN</span>
        </div>
      )}
    </div>
  );
}
