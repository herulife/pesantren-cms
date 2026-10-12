'use client';

import Link from 'next/link';
import React from 'react';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="rounded-full bg-rose-100 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-rose-700">
        Ada gangguan
      </p>
      <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
        Maaf, halamannya gagal dibuka
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
        Coba muat ulang sekali lagi. Kalau masih gagal, kembali ke beranda atau hubungi admin.
        Data Anda tidak hilang.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-700"
        >
          Coba Lagi
        </button>
        <Link href="/" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-sky-300">
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}
