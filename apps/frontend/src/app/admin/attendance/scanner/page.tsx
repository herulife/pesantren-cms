'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, CheckCircle, Loader2, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { scanAttendanceQR } from '@/lib/api';

export default function AttendanceScannerPage() {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch {}
    }

    try {
      const resp = await scanAttendanceQR(decodedText);
      setScanResult(resp);
      setIsScanning(false);
    } catch {
      setScanResult({ success: false, message: "Terjadi kesalahan koneksi" });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const onScanFailure = useCallback(() => {
    // We don't want to spam errors for every failed frame.
  }, []);

  useEffect(() => {
    // Only initialize scanner if we are in "scanning" mode and don't have a result
    if (isScanning && !scanResult) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((clearError: unknown) => {
          console.error("Failed to clear scanner", clearError);
        });
      }
    };
  }, [isScanning, onScanFailure, onScanSuccess, scanResult]);

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="rounded-full bg-blue-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
            Scanner Presensi
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-black uppercase tracking-tight text-slate-900">Scan QR Santri</h1>
          <p className="mt-2 text-sm text-slate-500">Pindai kode QR dari HP santri untuk mencatat kehadiran otomatis.</p>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-2 shadow-2xl">
          {scanResult ? (
            <div className={`flex min-h-[400px] flex-col items-center justify-center p-10 text-center transition-all ${scanResult.success ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
              <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg ${scanResult.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {scanResult.success ? <CheckCircle size={40} /> : <XCircle size={40} />}
              </div>
              <h2 className={`mb-3 text-2xl font-black uppercase tracking-tight ${scanResult.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                {scanResult.success ? 'Berhasil!' : 'Gagal'}
              </h2>
              <p className="mb-10 text-sm leading-relaxed text-slate-600">{scanResult.message}</p>
              
              <button
                onClick={resetScanner}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-1 ${scanResult.success ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}
              >
                <RefreshCw size={20} />
                Scan Ulang
              </button>
            </div>
          ) : (
            <div className="relative">
              <div id="reader" className="overflow-hidden rounded-[2rem]"></div>
              
              {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
                  <p className="font-black uppercase tracking-widest text-slate-900">Memproses...</p>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                 <div className="h-64 w-64 rounded-3xl border-2 border-dashed border-white/50 bg-white/5"></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Camera size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Kamera</p>
              <p className="text-sm font-bold text-slate-900">Kamera Siap Gunakan</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Pesantren Darussunnah Modern Attendance System
        </p>
      </div>
    </div>
  );
}
