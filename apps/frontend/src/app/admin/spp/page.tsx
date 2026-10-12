'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import SppBills from '../payments/SppBills';

// Palaman Tagihan SPP. Komponennya sama dengan tab "Tagihan SPP" di
// /admin/payments (Jilid 44), dipisah agar punya menu sendiri seperti di
// Mode Classic yang dihapus pada Jilid 73.
export default function SppPage() {
  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
          <Receipt className="text-emerald-600" size={32} />
          Tagihan SPP
        </h1>
        <p className="text-slate-500 text-sm">
          Buat tagihan bulanan Santri, verifikasi bukti bayar, dan atur tagihan otomatis.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          <Link href="/admin/payments" className="font-bold text-emerald-600 hover:underline">
            Buka Manajemen Pembayaran
          </Link>{' '}
          untuk melihat tab lain (Tagihan Iuran, Kasir, Laporan).
        </p>
      </div>
      <SppBills />
    </div>
  );
}