'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  getWAGatewayStatus, getWAQRBlob, requestWAPairCode, disconnectWAGateway,
  sendWhatsApp, WAGatewayStatus,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { PageHeader } from '../ui';

export default function BsNotifikasi() {
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

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getWAGatewayStatus());
    } catch {
      // abaikan
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const t = setInterval(() => {
      void refreshStatus();
    }, 5000);
    return () => clearInterval(t);
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
      showToast('error', 'Isi nomor HP dulu.');
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
    if (!confirm('Putuskan koneksi WhatsApp?')) return;
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
    <div>
      <PageHeader title="Gateway WhatsApp" breadcrumb="Tools / Notifikasi" />
      <div className="card card-primary">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Koneksi Gateway Sendiri</h3>
          {status == null ? (
            <span className="badge bg-secondary">Memeriksa…</span>
          ) : status.connected ? (
            <span className="badge bg-success">Terhubung{status.phone ? ` • ${status.phone}` : ''}</span>
          ) : (
            <span className="badge bg-secondary">Terputus</span>
          )}
        </div>
        <div className="card-body">
          {status?.connected ? (
            <div className="alert alert-success">
              <b>Terhubung{status.phone ? ` sebagai ${status.phone}` : ''}{status.pushname ? ` (${status.pushname})` : ''}.</b>
              <div className="mt-2 d-flex gap-2">
                <button className="btn btn-sm btn-outline-success" onClick={() => void refreshStatus()}>Perbarui Status</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => void doDisconnect()}>Putuskan</button>
              </div>
            </div>
          ) : (
            <>
              <div className="btn-group mb-3" role="group">
                <button type="button" className={`btn btn-sm ${mode === 'qr' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('qr')}>Scan QR</button>
                <button type="button" className={`btn btn-sm ${mode === 'code' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('code')}>Kode 8 Digit</button>
              </div>
              {mode === 'qr' ? (
                <div className="row g-3">
                  <div className="col-md-4 text-center">
                    <div className="border rounded bg-white p-2 d-inline-block" style={{ width: 220, height: 220 }}>
                      {qrUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrUrl} alt="QR pairing WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div className="d-flex h-100 align-items-center justify-content-center text-muted small">Belum ada QR.<br />Klik “Muat QR”.</div>
                      )}
                    </div>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-success" disabled={qrLoading || (qrUrl !== '' && qrLeft > 10)} title={qrUrl !== '' && qrLeft > 10 ? `Tunggu ${qrLeft}d, QR masih berlaku` : undefined} onClick={() => void loadQR()}>
                        {qrLoading ? 'Memuat…' : qrUrl ? `QR Baru (${qrLeft}d)` : 'Muat QR'}
                      </button>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <ol className="small text-muted ps-3">
                      <li>Buka <b>WhatsApp</b> di HP nomor khusus pondok.</li>
                      <li><b>Pengaturan → Perangkat Tertaut → Tautkan Perangkat</b>.</li>
                      <li>Scan QR (berlaku ±1 menit).</li>
                      <li>Status berubah <b>Terhubung</b> otomatis.</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold" htmlFor="bs-pair-phone">Nomor HP pondok</label>
                    <input id="bs-pair-phone" className="form-control" placeholder="cth: 62812xxxxxxx" inputMode="tel" value={pairPhone} onChange={(e) => setPairPhone(e.target.value)} />
                    <button className="btn btn-sm btn-success mt-2" disabled={pairLoading} onClick={() => void askPairCode()}>
                      {pairLoading ? 'Meminta…' : 'Minta Kode'}
                    </button>
                    {pairCode && (
                      <div className="alert alert-success mt-3 text-center">
                        <div className="small fw-bold">KODE PAIRING</div>
                        <div className="fs-3 fw-bold font-monospace" style={{ letterSpacing: '0.3em' }}>{pairCode}</div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <ol className="small text-muted ps-3">
                      <li>Isi nomor, klik <b>Minta Kode</b>.</li>
                      <li>Di HP: <b>Perangkat Tertaut → Tautkan dengan nomor telepon</b>.</li>
                      <li>Masukkan kode 8 digit.</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title mb-0">Kirim Tes</h3></div>
        <div className="card-body d-flex gap-2 flex-column flex-md-row">
          <input className="form-control" placeholder="Nomor WA tujuan" inputMode="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          <button className="btn btn-dark text-nowrap" disabled={testing || !status?.connected} title={!status?.connected ? 'Hubungkan dulu' : undefined} onClick={() => void sendTest()}>
            {testing ? 'Mengirim…' : 'Kirim Tes'}
          </button>
        </div>
      </div>
    </div>
  );
}
