'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Newspaper, Settings, Users, Wallet } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const quickLinks = [
  {
    href: '/admin/psb',
    label: 'Kelola PSB',
    description: 'Tinjau pendaftaran dan data calon santri.',
    icon: GraduationCap,
    roles: ['panitia_psb', 'superadmin'],
  },
  {
    href: '/admin/news',
    label: 'Kelola Berita',
    description: 'Publikasikan berita dan konten website.',
    icon: Newspaper,
    roles: ['tim_media', 'superadmin'],
  },
  {
    href: '/admin/users',
    label: 'Manajemen User',
    description: 'Atur akun, role, dan akses admin.',
    icon: Users,
    roles: ['superadmin'],
  },
  {
    href: '/admin/wallet/topup',
    label: 'Top Up Wallet',
    description: 'Kelola saldo santri dari panel admin.',
    icon: Wallet,
    roles: ['superadmin'],
  },
  {
    href: '/admin/settings',
    label: 'Pengaturan Sistem',
    description: 'Perbarui lisensi, identitas, dan konfigurasi.',
    icon: Settings,
    roles: ['superadmin'],
  },
];

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (user.role === 'user') {
      router.replace('/portal');
    }
  }, [loading, router, user]);

  const visibleLinks = quickLinks.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/60 p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
          Dashboard Admin
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Selamat datang, {user?.name || 'Administrator'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Panel admin berhasil dimuat. Gunakan pintasan di bawah untuk masuk ke modul utama sambil kita menjaga dashboard tetap ringan dan stabil.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon size={22} />
              </div>
              <h2 className="mt-5 text-lg font-black text-slate-900">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm leading-6 text-amber-900 shadow-sm">
        Jika panel utama ini sudah bisa dibuka normal, berarti problem sebelumnya memang ada di dashboard admin yang terlalu berat atau ada runtime error di dalamnya. Setelah akses Anda aman, saya bisa lanjut audit dan mengembalikan dashboard statistik secara bertahap.
      </section>
    </div>
  );
}
