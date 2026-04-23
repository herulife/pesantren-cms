'use client';

import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { LicenseStatus } from '@/lib/api';

export default function LicenseBanner({ status }: { status: LicenseStatus }) {
  if (status.is_valid && !status.is_warning) return null;

  const isExpired = !status.is_valid;
  const isWarning = status.is_warning;

  return (
    <div className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${
      isExpired 
        ? 'bg-rose-50 border-rose-200 text-rose-800' 
        : 'bg-amber-50 border-amber-200 text-amber-800'
    }`}>
      <div className={`p-2 rounded-lg ${isExpired ? 'bg-rose-100' : 'bg-amber-100'}`}>
        {isExpired ? <ShieldX className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
      </div>
      <div>
        <h3 className="font-bold text-lg">
          {isExpired ? 'Lisensi Kedaluwarsa' : 'Peringatan Lisensi'}
        </h3>
        <p className="text-sm opacity-90">
          {isExpired 
            ? 'Fitur premium terkunci. Harap perbarui lisensi Anda untuk melanjutkan layanan.' 
            : `Masa aktif lisensi tinggal ${status.days_left} hari lagi. Segera lakukan perpanjangan.`}
        </p>
      </div>
      <button className={`ml-auto px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 ${
        isExpired ? 'bg-rose-600 text-white shadow-lg' : 'bg-amber-600 text-white shadow-lg'
      }`}>
        Perbarui Sekarang
      </button>
    </div>
  );
}
