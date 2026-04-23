'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Clock, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { getAttendanceToken } from '@/lib/api';

export default function StudentQRCard() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    const newToken = await getAttendanceToken();
    setToken(newToken);
    setCountdown(300);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (countdown <= 0) {
      fetchToken();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchToken]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (countdown / 300) * 100;

  return (
    <div className="group relative w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
      {/* Top Header - Boarding Pass Style */}
      <div className="bg-blue-600 p-8 text-white relative">
        <div className="absolute right-0 top-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-md w-fit mb-3">
              <Sparkles size={10} /> Live Pass
            </span>
            <h4 className="font-outfit text-2xl font-black uppercase tracking-tight shadow-sm">Presensi QR</h4>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <ShieldCheck size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Ticket Cutouts (The notches) */}
      <div className="relative flex items-center justify-between px-[-10px] bg-white mt-[-1px]">
        <div className="absolute -left-3 h-6 w-6 rounded-full bg-slate-50 shadow-inner" />
        <div className="w-full border-t-2 border-dashed border-slate-200 opacity-50" />
        <div className="absolute -right-3 h-6 w-6 rounded-full bg-slate-50 shadow-inner" />
      </div>

      {/* QR Code Section */}
      <div className="flex flex-col items-center bg-white p-8">
        <div className="relative flex aspect-square w-full max-w-[200px] items-center justify-center rounded-3xl bg-white p-4 shadow-[0_0_40px_rgb(0,0,0,0.05)] ring-1 ring-slate-100 mb-6 group-hover:scale-105 transition-transform duration-500">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading...</span>
            </div>
          ) : token ? (
            <QRCodeSVG
              value={token}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#0f172a" 
              imageSettings={{
                src: "/assets/logo-pondok.png",
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          ) : (
            <div className="flex flex-col items-center text-center px-4">
              <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
              <p className="text-xs font-bold text-slate-600">Terjadi Kendala</p>
            </div>
          )}
        </div>

        {/* Dynamic Progress Bar for Token Expiry */}
        <div className="w-full max-w-[200px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Clock size={12} /> Auto Refresh
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${countdown < 60 ? 'text-rose-500 animate-pulse' : 'text-blue-600'}`}>
              {formatTime(countdown)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${countdown < 60 ? 'bg-rose-500' : 'bg-blue-600'}`}
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 p-6 flex flex-col gap-3">
        <button
          onClick={fetchToken}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200/50 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Manual
        </button>
        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
          Tunjukkan QR ini ke scanner
        </p>
      </div>
    </div>
  );
}
