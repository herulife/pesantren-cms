'use client';

import Link from 'next/link';
import { LayoutDashboard, GraduationCap, Users, FileText, Phone, Palette, Eye, ArrowRight } from 'lucide-react';

const pages = [
  { href: '/admin/programs', label: 'Program', desc: 'Data + tampilan Program & Ekskul', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/admin/builder/psb', label: 'PSB', desc: 'Pendaftaran, Jadwal, Lokasi', icon: Users, color: 'bg-sky-50 text-sky-600' },
  { href: '/admin/builder/profil', label: 'Profil', desc: 'Visi Misi & Tentang', icon: FileText, color: 'bg-amber-50 text-amber-600' },
  { href: '/admin/builder/kontak', label: 'Kontak', desc: 'Alamat, Peta, Jam', icon: Phone, color: 'bg-slate-50 text-slate-600' },
];

export default function BuilderDashboard() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Website Builder</p>
        <h1 className="mt-1 font-outfit text-2xl font-black tracking-tight text-slate-900">Dashboard Builder</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Kelola halaman builder terpisah dari Pengaturan Utama — pilih halaman di bawah, preview jelas, Save Draft vs Publish terpisah.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((p) => (
          <Link key={p.href} href={p.href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.color}`}>
                <p.icon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-slate-700">{p.label}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{p.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  Kelola <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-700">Terpisah dari Pengaturan Utama</p>
        <p className="mt-1 text-xs leading-6 text-slate-500">Menu <span className="font-bold">Website Builder</span> di Sidebar sekarang standalone — tidak lagi di dalam <span className="font-bold">Pengaturan → Website Builder</span> tab. Pengaturan tetap 10 tab (Umum s.d. Donasi) tanpa builder.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/builder-preview/program" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <Eye size={14} /> Preview Program
        </a>
        <a href="/program" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
          Lihat Situs <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
