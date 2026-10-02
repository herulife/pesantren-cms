'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import PayTransactions from '../../payments/PayTransactions';

// Laporan Transaksi (pengganti menu "Lap. Transaksi" di Mode Classic).
// Komponen sama dengan tab Transaksi di /admin/payments.
export default function LaporanTransaksiPage() {
  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
          <BarChart3 className="text-emerald-600" size={32} />
          Laporan Transaksi
        </h1>
        <p className="text-slate-500 text-sm">
          Daftar transaksi pembayaran yang masuk, bisa disaring per rentang tanggal dan kata kunci.
        </p>
      </div>
      <PayTransactions />
    </div>
  );
}