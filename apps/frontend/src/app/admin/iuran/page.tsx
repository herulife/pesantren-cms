'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import IuranBills from '../payments/IuranBills';

// Palaman Tagihan Iuran. Memakai komponen yang sama dengan tab "Tagihan Iuran"
// di /admin/payments, supaya tidak ada dua implementasi yang bisa melenceng.
export default function IuranPage() {
  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
          <Receipt className="text-emerald-600" size={32} />
          Tagihan Iuran
        </h1>
        <p className="text-slate-500 text-sm">
          Buat tagihan iuran Santri (kegunaan/activity), verifikasi bukti bayar, dan pantau yang belum lunas.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          <Link href="/admin/payments" className="font-bold text-emerald-600 hover:underline">
            Buka Manajemen Pembayaran
          </Link>{' '}
          untuk melihat tab lain (Tagihan SPP, Kasir, Laporan).
        </p>
      </div>
      <IuranBills />
    </div>
  );
}