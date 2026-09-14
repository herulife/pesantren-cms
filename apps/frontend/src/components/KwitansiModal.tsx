'use client';

import React from 'react';

export interface KwitansiTx {
  code: string;
  date: string;
  santri_nis?: string;
  santri_name?: string;
  description: string;
  amount: number;
  method: string;
}

export function terbilang(n: number): string {
  const a = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const t = (x: number): string => {
    if (x < 12) return a[x];
    if (x < 20) return t(x - 10) + ' belas';
    if (x < 100) return (t(Math.floor(x / 10)) + ' puluh ' + t(x % 10)).trim();
    if (x < 200) return ('seratus ' + t(x - 100)).trim();
    if (x < 1000) return (t(Math.floor(x / 100)) + ' ratus ' + t(x % 100)).trim();
    if (x < 2000) return ('seribu ' + t(x - 1000)).trim();
    if (x < 1000000) return (t(Math.floor(x / 1000)) + ' ribu ' + t(x % 1000)).trim();
    if (x < 1000000000) return (t(Math.floor(x / 1000000)) + ' juta ' + t(x % 1000000)).trim();
    return (t(Math.floor(x / 1000000000)) + ' miliar ' + t(x % 1000000000)).trim();
  };
  if (!n || n <= 0) return 'Nol rupiah';
  return t(Math.floor(n))
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ') + ' Rupiah';
}

function formatTanggalID(dateStr: string): string {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatPeriode(period: string): string {
  const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const m = period.match(/^(\d{4})-(\d{2})/);
  if (!m) return period;
  const mi = parseInt(m[2], 10);
  return `${months[mi] || m[2]} ${m[1]}`;
}

export default function KwitansiModal({ data, schoolName, schoolAddress, schoolPhone, city, petugas, onClose }: {
  data: KwitansiTx;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  city?: string;
  petugas?: string;
  onClose: () => void;
}) {
  const rp = (v: number) => 'Rp. ' + (v || 0).toLocaleString('id-ID');
  const kota = city || 'Parung';

  const doPrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="kwitansi-area bg-white p-6 text-slate-900 sm:p-10 print:p-2">
          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">PONDOK PESANTREN {schoolName || 'ALMAA'}</h2>
            <p className="mt-1 text-sm">{schoolAddress || 'Jl. H Mawi, Gg. Omega, Kp. Jati Waru, Rt/Rw 003/002, Desa, Waru, Kec. Parung'}</p>
            <p className="text-sm">Telp. {schoolPhone || '-'}</p>
          </div>
          <hr className="my-4 border-t-2 border-slate-900" />
          <h3 className="text-center text-lg font-bold uppercase tracking-widest">Kwitansi</h3>
          <div className="mx-auto mt-4 max-w-xl space-y-2 text-[15px]">
            <div className="flex gap-2">
              <span className="w-40 shrink-0">Nomor Transaksi</span><span>:</span><span className="font-mono font-bold">{data.code}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-40 shrink-0">Sudah Diterima Dari</span><span>:</span>
              <span className="font-bold">{data.santri_nis || '-'} / {data.santri_name || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-40 shrink-0">Uang Sebesar</span><span>:</span>
              <span className="font-bold italic">{terbilang(data.amount)}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-40 shrink-0">Untuk Pembayaran</span><span>:</span>
              <span>{data.description} <span className="text-slate-500">({data.method})</span></span>
            </div>
          </div>
          <div className="mx-auto mt-6 flex max-w-xl items-start justify-between">
            <p className="text-lg font-bold">{rp(data.amount)}</p>
            <div className="text-center">
              <p>{kota}, {formatTanggalID(data.date)}</p>
              <p className="mt-1">Penerima</p>
              <p className="mt-12 font-bold underline">{petugas || '( ................................................ )'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 print:hidden">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Tutup
          </button>
          <button onClick={doPrint} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700">
            Cetak / PDF
          </button>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .kwitansi-area, .kwitansi-area * { visibility: visible; } .kwitansi-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
}
