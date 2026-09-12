'use client';

import PublicLayout from '@/components/PublicLayout';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const sections: Array<{ title: string; body: string[] }> = [
  {
    title: 'Data yang kami kumpulkan',
    body: [
      'Data pendaftaran santri (nama, NIK, alamat, data wali) saat mengisi formulir PSB.',
      'Dokumen yang diunggah (KK, raport/ijazah, pas foto, bukti pembayaran).',
      'Data pembayaran dan donasi (nominal, tanggal, bukti transfer).',
      'Catatan teknis otomatis (log aktivitas admin) untuk keamanan.',
    ],
  },
  {
    title: 'Untuk apa datanya dipakai',
    body: [
      'Memproses pendaftaran santri dan menghubung wali via WhatsApp.',
      'Mencatat nilai, absen, hafalan, dan keuangan santri.',
      'Menampilkan informasi publik (berita, program, galeri) di website.',
      'Tidak dijual dan tidak dibagikan untuk iklan.',
    ],
  },
  {
    title: 'Layanan luar yang ikut memproses data',
    body: [
      'YouTube (video yang diputar di website), Google Maps (peta lokasi), Unsplash (sebagian foto).',
      'Cloudflare (pengaman & penyalur website), Google Analytics (statistik kunjungan, hanya jalan kalau Anda menekan Setuju pada banner cookie).',
      'Fonnte/WhatsApp (pengiriman notifikasi ke nomor yang Anda berikan).',
    ],
  },
  {
    title: 'Cookie',
    body: [
      'Cookie login: mengingat Anda sudah masuk (wajib, tanpa ini tidak bisa login).',
      'Pilihan cookie Anda sendiri (Setuju/Tolak) disimpan di HP/browser Anda.',
      'Cookie statistik/analytics hanya dipasang setelah Anda menekan Setuju.',
    ],
  },
  {
    title: 'Hak Anda',
    body: [
      'Minta salinan, perbaikan, atau penghapusan data pribadi Anda.',
      'Caranya: hubungi admin pondok lewat halaman Kontak atau WhatsApp resmi.',
      'Kami akan memproses dalam waktu wajar dan memberi kabar.',
    ],
  },
];

export default function PrivasiPage() {
  return (
    <PublicLayout>
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-700">
            <ShieldCheck size={14} /> Kebijakan Privasi
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Data Anda aman bersama kami
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Halaman ini menjelaskan data apa yang kami simpan, untuk apa, dan hak Anda.
            Ditulis dengan bahasa sederhana. Terakhir diperbarui: September 2026.
          </p>
          <div className="mt-8 space-y-5">
            {sections.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg font-black text-slate-900">
                  {i + 1}. {s.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {s.body.map((b) => (
                    <li key={b} className="flex gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/syarat" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
              Baca Syarat Layanan
            </Link>
            <Link href="/kontak" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-sky-300">
              Hubungi Admin
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
