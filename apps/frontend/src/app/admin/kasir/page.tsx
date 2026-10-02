'use client';

import React from 'react';
import Link from 'next/link';
import { ScanLine } from 'lucide-react';
import Kasir from '../payments/Kasir';

// Halaman Kasir: bayar tagihan SPP & Iuran yang belum lunas.
// Sama dengan tab "Kasir" di /admin/payments (dipisah agar punya menu sendiri).
export default function KasirPage() {
  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
          <ScanLine className="text-sky-600" size={32} />
          Kasir Pembayaran
        </h1>
        <p className="text-slate-500 text-sm">
          Catat pembayaran SPP atau iuran untuk Santri yang masih punya tagihan belum lunas.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          <Link href="/admin/payments" className="font-bold text-sky-600 hover:underline">
            Buka Manajemen Pembayaran
          </Link>{' '}
          untuk melihat tab lain (Tagihan SPP, Tagihan Iuran, Laporan).
        </p>
      </div>
      <Kasir />
    </div>
  );
}