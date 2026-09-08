'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Eye, ExternalLink, Save, Rocket, Palette, FileText, Users, GraduationCap } from 'lucide-react';

const nav = [
  { href: '/admin/builder', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/builder/program', label: 'Program', icon: GraduationCap, desc: 'Ekstrakurikuler & Kurikulum' },
  { href: '/admin/builder/psb', label: 'PSB', icon: Users, desc: 'Pendaftaran' },
  { href: '/admin/builder/profil', label: 'Profil', icon: FileText, desc: 'Visi Misi' },
  { href: '/admin/builder/kontak', label: 'Kontak', icon: Palette, desc: 'Alamat & Peta' },
];

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#f6f7f7] font-[Plus_Jakarta_Sans,Inter,sans-serif] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/builder" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-black text-sm">A</span>
              <span className="hidden font-outfit text-sm font-bold tracking-tight text-slate-900 sm:block">Al-Maa Builder</span>
              <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">WordPress-like</span>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {nav.slice(1).map((n) => {
                const active = pathname === n.href;
                return (
                  <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a href="/program" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:inline-flex">
              <ExternalLink size={14} /> Lihat Situs
            </a>
            <a href="/builder-preview/program" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Eye size={14} /> Preview
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-[65px] space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Navigasi Builder</p>
              <nav className="mt-3 space-y-1">
                {nav.map((n) => {
                  const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
                  return (
                    <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <n.icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
                      <span className="font-medium">{n.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">Tips Estetik</p>
              <p className="mt-2 text-xs leading-6 text-amber-800">Font halus <span className="font-outfit font-bold">Outfit</span> untuk judul, <span className="font-bold">Plus Jakarta</span> untuk form. Card putih, radius 12px, shadow lembut.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
