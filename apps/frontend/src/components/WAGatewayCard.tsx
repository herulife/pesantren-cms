'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getWAGatewayStatus,
  requestWAQR,
  requestWAPairCode,
  disconnectWA,
  WAGatewayStatus,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { QrCode, KeyRound, RefreshCw, Unplug, CheckCircle2, XCircle } from 'lucide-react';

function StatusBadge({ st }: { st: WAGatewayStatus | null }) {
  if (!st) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" /> Memeriksa…
      </span>
    );
  }
  if (st.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 size={14} /> Terhubung{st.phone ? ` • ${st.phone}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
      <XCircle size={14} /> Terputus
    </span>
  );
}

export default function WAGatewayCard() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<WAGatewayStatus | null>(null);
  const [mode, setMode] = useState<'qr' | 'code'>('qr');
  const [qrUrl, setQrUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [pairPhone, setPairPhone] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [pairLoading, setPairLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getWAGatewayStatus());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    timer.current = setInterval(() => {
      void refreshStatus();
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [refreshStatus]);

  useEffect(() => {
    return () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    };
  }, [qrUrl]);

  const loadQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const r = await requestWAQR();
      if (r.url) {
        if (qrUrl) URL.revokeObjectURL(qrUrl);
        setQrUrl(r.url);
      } else {
        showToast('error', 'Gagal memuat QR.');
      }
    } catch (e: any) {
      if (e?.status === 409 || e?.response?.status === 409) {
        showToast('info', 'WhatsApp sudah terhubung.');
      } else {
        const msg = e?.message || 'Gagal memuat QR.';
        showToast('error', msg);
      }
    }
    setQrLoading(false);
  }, [qrUrl, showToast]);

  const requestPairCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairPhone.trim()) {
      showToast('error', 'Nomor HP wajib diisi.');
      return;
    }
    setPairLoading(true);
    try {
      const res = await requestWAPairCode(pairPhone.trim());
      if (res.ok) {
        setPairCode(res.data?.code || res.code || '');
        showToast('success', 'Kode pairing berhasil diminta.');
      } else {
        showToast('error', res.message || 'Gagal meminta kode pairing.');
      }
    } catch (e: any) {
      showToast('error', e?.message || 'Gagal meminta kode pairing.');
    }
    setPairLoading(false);
  };

  const disconnect = async () => {
    if (!confirm('Putuskan koneksi WhatsApp Gateway?')) return;
    try {
      const res = await disconnectWA();
      if (res.ok) {
        showToast('success', 'Koneksi WhatsApp diputuskan.');
        setQrUrl('');
        void refreshStatus();
      } else {
        showToast('error', res.message || 'Gagal memutus koneksi.');
      }
    } catch (e: any) {
      showToast('error', e?.message || 'Gagal memutus koneksi.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">WhatsApp Gateway</h2>
          <p className="mt-1 text-sm text-slate-500">Hubungkan nomor WhatsApp untuk mengirim notifikasi otomatis.</p>
        </div>
        <StatusBadge st={status} />
      </div>

      {!status?.connected && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button onClick={() => setMode('qr')} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${mode === 'qr' ? 'border-sky-600 text-sky-600 bg-sky-50' : 'border-slate-200 bg-white text-slate-700'}`}>
            <QrCode size={16} /> Scan QR
          </button>
          <button onClick={() => setMode('code')} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${mode === 'code' ? 'border-sky-600 text-sky-600 bg-sky-50' : 'border-slate-200 bg-white text-slate-700'}`}>
            <KeyRound size={16} /> Pair Code
          </button>
        </div>
      )}

      {!status?.connected && mode === 'qr' && (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          {qrUrl ? (
            <img src={qrUrl} alt="QR WhatsApp" className="h-64 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <p className="text-sm text-slate-500">Belum ada QR terunduh</p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button onClick={loadQR} disabled={qrLoading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              <RefreshCw size={16} className={qrLoading ? 'animate-spin' : ''} /> {qrUrl ? 'Muat Ulang QR' : 'Tampilkan QR'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Buka WhatsApp → Pengaturan → Perangkat Tertaut → Tautkan Perangkat → Scan QR</p>
        </div>
      )}

      {!status?.connected && mode === 'code' && (
        <form onSubmit={requestPairCode} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
          <div>
            <label className="text-sm font-bold text-slate-700">Nomor HP (62xxxxxxxxxxx)</label>
            <input value={pairPhone} onChange={(e) => setPairPhone(e.target.value)} placeholder="62812xxxxxxx" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm" />
          </div>
          <button type="submit" disabled={pairLoading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            <KeyRound size={16} /> {pairLoading ? 'Meminta...' : 'Minta Pair Code'}
          </button>
          {pairCode && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pair Code Anda</p>
              <p className="mt-2 text-3xl font-black tracking-widest text-emerald-900">{pairCode}</p>
              <p className="mt-2 text-xs text-emerald-800">Buka WhatsApp → Pengaturan → Perangkat Tertaut → Hubungkan dengan Nomor Telepon → Masukkan kode ini.</p>
            </div>
          )}
        </form>
      )}

      {status?.connected && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <div>
              <p className="text-sm font-black text-emerald-900">WhatsApp Gateway Terhubung</p>
              {status.phone && <p className="text-xs text-emerald-800">{status.phone}</p>}
              {status.pushname && <p className="text-xs text-emerald-800">{status.pushname}</p>}
            </div>
          </div>
          <div className="mt-4">
            <button onClick={disconnect} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50">
              <Unplug size={16} /> Putuskan Koneksi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
