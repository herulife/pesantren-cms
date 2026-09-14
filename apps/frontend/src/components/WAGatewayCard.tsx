'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getWAGatewayStatus, getWAQRBlob, requestWAPairCode, disconnectWAGateway,
  sendWhatsApp, WAGatewayStatus,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { MessageCircle, QrCode, KeyRound, RefreshCw, Unplug, Send, CheckCircle2, XCircle } from 'lucide-react';

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
  const [qrExpAt, setQrExpAt] = useState(0);
  const [qrNow, setQrNow] = useState(Date.now());
  const [pairPhone, setPairPhone] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [pairLoading, setPairLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getWAGatewayStatus());
    } catch {
      // abaikan, badge tetap apa adanya
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
    const r = await getWAQRBlob();
    setQrLoading(false);
    if (r.ok && r.url) {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
      setQrUrl(r.url);
      setQrExpAt(Date.now() + 50000);
    } else {
      showToast('error', r.message || 'Gagal memuat QR.');
    }
  }, [qrUrl, showToast]);

  // Hitung mundur + muat ulang otomatis sesaat sebelum kedaluwarsa.
  useEffect(() => {
    if (!qrUrl) return;
    const t = setInterval(() => setQrNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [qrUrl]);

  const qrLeft = Math.max(0, Math.ceil((qrExpAt - qrNow) / 1000));

  useEffect(() => {
    if (qrUrl && qrExpAt > 0 && qrNow >= qrExpAt) {
      void loadQR();
    }
  }, [qrNow, qrUrl, qrExpAt, loadQR]);

  const askPairCode = async () => {
    if (!pairPhone.trim()) {
      showToast('error', 'Isi nomor HP dulu (cth: 62812xxxxxxx).');
      return;
    }
    setPairLoading(true);
    try {
      const r = await requestWAPairCode(pairPhone.trim());
      if (r.success) setPairCode(String(r.data?.pair_code || ''));
      else showToast('error', r.message || 'Gagal meminta kode.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal meminta kode.');
    } finally {
      setPairLoading(false);
    }
  };

  const doDisconnect = async () => {
    if (!confirm('Putuskan koneksi WhatsApp? Perlu pairing ulang untuk menghubungkan lagi.')) return;
    const r = await disconnectWAGateway();
    if (r.success) {
      showToast('success', 'Koneksi diputus.');
      void refreshStatus();
    } else {
      showToast('error', r.message || 'Gagal memutuskan.');
    }
  };

  const sendTest = async () => {
    if (!testPhone.trim()) {
      showToast('error', 'Isi nomor WA tujuan dulu.');
      return;
    }
    setTesting(true);
    try {
      const r = await sendWhatsApp(testPhone.trim(), 'Tes gateway WA Al-Maa: koneksi mandiri aktif. Assalamu\u2019alaikum.');
      if (r.success) showToast('success', 'Pesan uji terkirim.');
      else showToast('error', r.message || 'Gagal mengirim.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal mengirim.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <MessageCircle size={24} />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Gateway WhatsApp Sendiri</h2>
            <p className="text-sm font-medium text-slate-500">Tanpa pihak ketiga — HP pondok ditautkan langsung sebagai perangkat.</p>
          </div>
        </div>
        <StatusBadge st={status} />
      </div>

      <div className="space-y-6 p-8">
        {status?.connected ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6 text-sm leading-relaxed text-emerald-900">
            <p className="font-bold">Terhubung{status.phone ? ` sebagai ${status.phone}` : ''}{status.pushname ? ` (${status.pushname})` : ''}.</p>
            <p className="mt-1 text-emerald-800">Semua notifikasi (kwitansi, tagihan, donasi, absensi) dikirim lewat nomor ini.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void refreshStatus()} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                Perbarui Status
              </button>
              <button onClick={() => void doDisconnect()} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">
                <span className="inline-flex items-center gap-1.5"><Unplug size={15} /> Putuskan</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-bold">
              <button
                onClick={() => setMode('qr')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${mode === 'qr' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                <QrCode size={15} /> Scan QR
              </button>
              <button
                onClick={() => setMode('code')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${mode === 'code' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                <KeyRound size={15} /> Kode 8 Digit
              </button>
            </div>

            {mode === 'qr' ? (
              <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrUrl} alt="QR pairing WhatsApp" className="h-full w-full object-contain" />
                    ) : (
                      <p className="px-6 text-center text-xs text-slate-400">Belum ada QR.<br />Klik “Muat QR”.</p>
                    )}
                  </div>
                  <button
                    onClick={() => void loadQR()}
                    disabled={qrLoading || (qrUrl !== '' && qrLeft > 10)}
                    title={qrUrl !== '' && qrLeft > 10 ? `Tunggu ${qrLeft}d, QR masih berlaku` : undefined}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={qrLoading ? 'animate-spin' : ''} />
                    {qrLoading ? 'Memuat…' : qrUrl ? `QR Baru (${qrLeft}d)` : 'Muat QR'}
                  </button>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                  <li>Buka <b>WhatsApp</b> di HP nomor khusus pondok.</li>
                  <li>Masuk ke <b>Pengaturan → Perangkat Tertaut → Tautkan Perangkat</b>.</li>
                  <li>Scan QR di samping (berlaku ±1 menit, klik <b>QR Baru</b> bila kedaluwarsa).</li>
                  <li>Status berubah <b>Terhubung</b> otomatis dalam beberapa detik.</li>
                </ol>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="wa-pair-phone">
                    Nomor HP pondok (format internasional)
                  </label>
                  <input
                    id="wa-pair-phone"
                    value={pairPhone}
                    onChange={(e) => setPairPhone(e.target.value)}
                    placeholder="cth: 62812xxxxxxx"
                    inputMode="tel"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => void askPairCode()}
                    disabled={pairLoading}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {pairLoading ? 'Meminta…' : 'Minta Kode'}
                  </button>
                  {pairCode && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Kode pairing</p>
                      <p className="font-mono text-3xl font-black tracking-[0.3em] text-emerald-900">{pairCode}</p>
                    </div>
                  )}
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                  <li>Isi nomor HP pondok, klik <b>Minta Kode</b>.</li>
                  <li>Di HP: <b>Pengaturan → Perangkat Tertaut → Tautkan dengan nomor telepon</b>.</li>
                  <li>Masukkan kode 8 digit yang muncul.</li>
                  <li>Status berubah <b>Terhubung</b> otomatis dalam beberapa detik.</li>
                </ol>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kirim Tes</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Nomor WA tujuan (cth: 0812xxxx)"
              inputMode="tel"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => void sendTest()}
              disabled={testing || !status?.connected}
              title={!status?.connected ? 'Hubungkan dulu sebelum kirim tes' : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <Send size={15} /> {testing ? 'Mengirim…' : 'Kirim Tes'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
