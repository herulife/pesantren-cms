'use client';

import PublicLayout from '@/components/PublicLayout';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const sections: Array<{ title: string; body: string[] }> = [
  {
    title: 'Aturan umum',
    body: [
      'Gunakan website apa adanya untuk informasi pondok dan pendaftaran santri.',
      'Jangan mencoba merusak, membobol, atau mengganggu jalannya website.',
      'Jangan mengirim data palsu, spam, atau konten yang melanggar hukum.',
    ],
  },
  {
    title: 'Akun',
    body: [
      'Jaga kerahasiaan password Anda. Jangan berikan ke orang lain.',
      'Satu orang satu akun. Beri tahu admin kalau akun Anda disalahgunakan.',
      'Admin berhak menonaktifkan akun yang melanggar aturan.',
    ],
  },
  {
    title: 'Pendaftaran & pembayaran',
    body: [
      'Isi data pendaftaran dengan jujur sesuai dokumen asli.',
      'Biaya yang sudah dibayar mengikuti ketentuan panitia PSB.',
      'Status pendaftaran mengikuti hasil verifikasi panitia dan bersifat final.',
    ],
  },
  {
    title: 'Donasi',
    body: [
      'Donasi yang sudah masuk dipakai sesuai program yang dipilih.',
      'Simpan bukti transfer sampai donasi Anda terverifikasi.',
      'Laporan penyaluran mengikuti informasi resmi pondok.',
    ],
  },
  {
    title: 'Konten website',
    body: [
      'Foto, tulisan, dan logo di website milik pondok. Boleh dibagikan untuk kebaikan dengan menyebut sumbernya.',
      'Jangan mengubah atau mengaku-ngaku konten website sebagai milik sendiri.',
    ],
  },
  {
    title: 'Bantuan',
    body: [
      'Butuh bantuan? Hubungi admin lewat halaman Kontak atau WhatsApp resmi pondok.',
      'Aturan ini bisa diperbarui sewaktu-waktu mengikuti kebutuhan.',
    ],
  },
];

export default function SyaratPage() {
  return (
    <PublicLayout>
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            <ScrollText size={14} /> Syarat Layanan
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Aturan pakai website
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Singkat dan jelas: apa yang boleh, apa yang tidak, dan bagaimana kalau ada masalah.
            Terakhir diperbarui: September 2026.
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
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/privasi" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
              Baca Kebijakan Privasi
            </Link>
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
