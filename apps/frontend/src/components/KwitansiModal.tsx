'use client';

import React from 'react';
import { ReceiptData } from '@/lib/api';

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
  return t(Math.floor(n)).replace(/\s+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase()) + ' rupiah';
}

export function formatPeriode(period: string): string {
  const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const m = period.match(/^(\d{4})-(\d{2})/);
  if (!m) return period;
  const mi = parseInt(m[2], 10);
  return `${months[mi] || m[2]} ${m[1]}`;
}

export default function KwitansiModal({ data, schoolName, schoolAddress, onClose }: {
  data: ReceiptData;
  schoolName?: string;
  schoolAddress?: string;
  onClose: () => void;
}) {
  const r = data.receipt;
  const rp = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

  const doPrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="kwitansi-area p-6 sm:p-8 print:p-2">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">{schoolName || 'Pondok Pesantren Al-Maa'}</h2>
            {schoolAddress && <p className="mt-1 text-xs text-slate-600">{schoolAddress}</p>}
            <p className="mt-2 inline-block rounded bg-slate-900 px-4 py-1 text-sm font-black uppercase tracking-widest text-white">
              Kwitansi Pembayaran
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p className="text-slate-500">No. Kwitansi</p>
            <p className="font-mono font-bold text-slate-900">: {r.receipt_no}</p>
            <p className="text-slate-500">Periode</p>
            <p className="font-bold text-slate-900">: {formatPeriode(r.period)}</p>
            <p className="text-slate-500">NIS / Nama</p>
            <p className="font-bold text-slate-900">: {r.santri_nis || '-'} / {r.santri_name || '-'}</p>
            {r.santri_class && (<><p className="text-slate-500">Kelas</p><p className="font-bold text-slate-900">: {r.santri_class}</p></>)}
            {r.parent_name && (<><p className="text-slate-500">Wali</p><p className="font-bold text-slate-900">: {r.parent_name}</p></>)}
          </div>

          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y-2 border-slate-900">
                <th className="py-2 text-left">No</th>
                <th className="py-2 text-left">Tanggal</th>
                <th className="py-2 text-left">Uraian</th>
                <th className="py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={it.id} className="border-b border-slate-200">
                  <td className="py-1.5">{i + 1}</td>
                  <td className="py-1.5">{(it.date || '').slice(0, 10)}</td>
                  <td className="py-1.5">{it.description} <span className="text-xs text-slate-400">({it.method})</span></td>
                  <td className="py-1.5 text-right">{rp(it.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="py-2 text-right font-black uppercase">Total</td>
                <td className="py-2 text-right font-black">{rp(r.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm italic text-slate-700">
            Terbilang: {terbilang(r.total)}
          </p>

          <div className="mt-6 flex justify-between text-sm">
            <div>
              <p className="text-slate-500">Petugas</p>
              <p className="mt-10 font-bold underline">{r.petugas || '( ........................ )'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Parung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-10 font-bold underline">Bendahara</p>
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
