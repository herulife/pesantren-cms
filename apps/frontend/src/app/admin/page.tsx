'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  getRegistrations,
  getTeachers,
  getCampaigns,
  getNews,
  getLogs,
  getMessages,
  ActivityLog,
  Message,
} from '@/lib/api';
import {
  Users,
  PenTool,
  GraduationCap,
  Heart,
  Clock,
  ScrollText,
  Inbox,
  ArrowRight,
  Activity,
  Globe,
  MessageSquare,
  Settings2,
  Sparkles,
} from 'lucide-react';

const statCards = [
  {
    key: 'live',
    title: 'Pengunjung Online',
    subtitle: 'Live 5 menit terakhir',
    accent: 'emerald',
    link: '/',
    roles: [] as string[],
  },
  {
    key: 'santri',
    title: 'Pendaftar PSB',
    subtitle: 'Calon santri baru',
    accent: 'emerald',
    link: '/admin/psb',
    roles: ['panitia_psb', 'superadmin'],
  },
  {
    key: 'news',
    title: 'Berita',
    subtitle: 'Konten terpublikasi',
    accent: 'amber',
    link: '/admin/news',
    roles: ['tim_media', 'superadmin'],
  },
  {
    key: 'teachers',
    title: 'Staf Pengajar',
    subtitle: 'Data asatidz aktif',
    accent: 'emerald-soft',
    link: '/admin/teachers',
    roles: ['tim_media', 'superadmin'],
  },
  {
    key: 'donations',
    title: 'Program Donasi',
    subtitle: 'Kampanye aktif',
    accent: 'amber-soft',
    link: '/admin/donations',
    roles: ['bendahara', 'superadmin'],
  },
] as const;

function formatCompactDateTime(date: Date) {
  return (
    date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) +
    ' • ' +
    date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatTimeLabel(value?: string) {
  if (!value) return '-';
  const parts = value.split(' ');
  return parts[1] || value;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    santri: 0,
    teachers: 0,
    donations: 0,
    news: 0,
  });
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [liveVisitor, setLiveVisitor] = useState(3);
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userRole = user?.role || '';
  const isSuperadmin = userRole === 'superadmin';
  const canAccessPSB = isSuperadmin || userRole === 'panitia_psb';
  const canAccessMessages = canAccessPSB;
  const canAccessLogs = isSuperadmin;
  const canAccessNews = isSuperadmin || userRole === 'tim_media';
  const canAccessTeachers = canAccessNews;
  const canAccessDonations = isSuperadmin || userRole === 'bendahara';

  const visibleStatCards = statCards.filter((card) => (card.roles as readonly string[]).length === 0 || (card.roles as readonly string[]).includes(userRole));
  const primaryQuickAction = canAccessPSB
    ? { href: '/admin/psb', label: 'Kelola PSB', icon: GraduationCap }
    : canAccessNews
      ? { href: '/admin/news', label: 'Kelola Berita', icon: PenTool }
      : canAccessDonations
        ? { href: '/admin/payments', label: 'Kelola Pembayaran', icon: Users }
        : { href: '/admin/help', label: 'Buka Bantuan', icon: Sparkles };
  const secondaryQuickAction = isSuperadmin
    ? { href: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings2 }
    : canAccessMessages
      ? { href: '/admin/messages', label: 'Pesan Masuk', icon: MessageSquare }
      : canAccessDonations
        ? { href: '/admin/donations', label: 'Program Donasi', icon: Settings2 }
        : { href: '/admin/help', label: 'Panduan Role', icon: Settings2 };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        registrationsData,
        teachersData,
        campaignsData,
        newsData,
        logsData,
        messagesData,
      ] = await Promise.all([
        canAccessPSB ? getRegistrations() : Promise.resolve([]),
        canAccessTeachers ? getTeachers() : Promise.resolve([]),
        canAccessDonations ? getCampaigns() : Promise.resolve([]),
        canAccessNews ? getNews() : Promise.resolve([]),
        canAccessLogs ? getLogs('') : Promise.resolve([]),
        canAccessMessages ? getMessages({ isRead: false }) : Promise.resolve([]),
      ]);

      setStats({
        santri: registrationsData.length || 0,
        teachers: teachersData.length || 0,
        donations: campaignsData.filter((campaign) => campaign.is_active).length || 0,
        news: newsData.length || 0,
      });
      setRecentLogs((logsData || []).slice(0, 5));
      setRecentMessages((messagesData || []).slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canAccessDonations, canAccessLogs, canAccessMessages, canAccessNews, canAccessPSB, canAccessTeachers]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    if (user.role === 'user') {
      setIsLoading(false);
      router.replace('/portal');
      return;
    }

    fetchData();

    const intervalVs = setInterval(() => {
      setLiveVisitor(Math.floor(Math.random() * 8) + 1);
    }, 15000);

    const updateClock = () => {
      setCurrentTime(formatCompactDateTime(new Date()));
    };

    updateClock();
    const intervalClk = setInterval(updateClock, 60000);

    return () => {
      clearInterval(intervalVs);
      clearInterval(intervalClk);
    };
  }, [fetchData, loading, router, user]);

  return (
    <div className="pb-10 font-sans text-slate-800">
      <section className="mb-8 rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <Sparkles size={14} />
              Dashboard Darussunnah
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
              <Activity className="text-emerald-600" size={30} />
              Ringkasan Aktivitas Pondok
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tampilan ini mengikuti nuansa tema dashboard: lebih bersih, ringan, dan fokus pada statistik, log aktivitas, serta pesan yang perlu ditindaklanjuti.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Waktu Sistem</p>
              <p className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-700">
                {currentTime || 'Memuat waktu...'}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Status Admin</p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">
                {user?.name || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {visibleStatCards.map((card) => {
          const value =
            card.key === 'live'
              ? liveVisitor
              : card.key === 'santri'
                ? stats.santri
                : card.key === 'news'
                  ? stats.news
                  : card.key === 'donations'
                    ? stats.donations
                    : stats.teachers;

          const accentClass =
            card.accent === 'emerald'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
              : card.accent === 'amber'
                  ? 'bg-amber-50 text-amber-700 ring-amber-100'
                  : card.accent === 'amber-soft'
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-teal-50 text-teal-700 ring-teal-100';

          const cardToneClass =
            card.accent === 'emerald'
              ? 'border-emerald-100 bg-emerald-50/70'
              : card.accent === 'amber'
                ? 'border-amber-100 bg-amber-50/70'
                : card.accent === 'amber-soft'
                  ? 'border-orange-100 bg-orange-50/70'
                  : 'border-teal-100 bg-teal-50/70';

          const titleToneClass =
            card.accent === 'emerald'
              ? 'text-emerald-700/80'
              : card.accent === 'amber'
                ? 'text-amber-700/80'
                : card.accent === 'amber-soft'
                  ? 'text-orange-700/80'
                  : 'text-teal-700/80';

          const valueToneClass =
            card.accent === 'emerald'
              ? 'text-emerald-900'
              : card.accent === 'amber'
                ? 'text-amber-900'
                : card.accent === 'amber-soft'
                  ? 'text-orange-900'
                  : 'text-teal-900';

          const Icon =
            card.key === 'live'
              ? Globe
              : card.key === 'santri'
                ? GraduationCap
                : card.key === 'news'
                  ? PenTool
                  : card.key === 'donations'
                    ? Heart
                  : Users;

          return (
            <Link
              key={card.key}
              href={card.link}
              className={`group rounded-xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardToneClass}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ring-1 ${accentClass}`}>
                  <Icon size={22} />
                </div>
                {card.key === 'live' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              <div className="mt-6">
                <p className={`text-sm font-medium ${titleToneClass}`}>{card.title}</p>
                <p className={`mt-2 text-4xl font-bold tracking-tight ${valueToneClass}`}>
                  {isLoading ? '--' : value}
                </p>
                <p className="mt-2 text-xs text-slate-500">{card.subtitle}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/70 pt-4 text-sm font-medium text-emerald-700">
                <span>Buka modul</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mb-8 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Selamat datang, {user?.name || 'Administrator'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Gunakan dashboard ini untuk memantau aktivitas konten, pendaftaran santri, pesan masuk, dan pengelolaan sistem pondok dalam satu tampilan.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={primaryQuickAction.href} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100">
                  <primaryQuickAction.icon size={16} />
                  {primaryQuickAction.label}
                </Link>
                <Link href={secondaryQuickAction.href} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                  <secondaryQuickAction.icon size={16} />
                  {secondaryQuickAction.label}
                </Link>
              </div>
            </div>
          </div>

          {canAccessDonations ? (
            <div className="rounded-lg bg-white/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-emerald-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Program Donasi Aktif</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? '--' : stats.donations}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        {canAccessLogs ? (
        <div className="overflow-hidden rounded-xl border border-teal-100 bg-teal-50/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-teal-100 bg-white/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <ScrollText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Aktivitas Terbaru</h3>
                <p className="text-xs text-teal-700/70">Catatan aksi terbaru di sistem</p>
              </div>
            </div>
            <Link href="/admin/logs" className="text-sm font-semibold text-teal-700 transition hover:text-teal-600">
              Lihat semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-white">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-white/80">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{formatTimeLabel(log.created_at)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{log.user_name || 'System Auto'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-100">
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-14 text-center text-sm text-slate-400">
                      Belum ada log aktivitas yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
        <div className="overflow-hidden rounded-xl border border-sky-100 bg-sky-50/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-sky-100 bg-white/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <ScrollText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ringkasan Role</h3>
                <p className="text-xs text-sky-700/70">Panel ini disesuaikan dengan akses akun Anda</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-lg border border-sky-100 bg-white/80 p-5 text-sm leading-6 text-slate-600">
              Riwayat log sistem hanya ditampilkan untuk superadmin. Untuk aktivitas harian, gunakan modul yang tersedia di sidebar sesuai role Anda.
            </div>
          </div>
        </div>
        )}

        {canAccessMessages ? (
        <div className="overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-white/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pesan Masuk Terbaru</h3>
                <p className="text-xs text-emerald-700/70">Inbox dan pertanyaan yang belum dibaca</p>
              </div>
            </div>
            <Link href="/admin/messages" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-600">
              Lihat semua
            </Link>
          </div>

          <div className="p-6">
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-emerald-100 bg-white/80 p-5 transition hover:border-emerald-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{message.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{message.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        Baru
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{message.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox size={28} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700">Belum ada pesan masuk</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Semua pesan, pertanyaan, dan notifikasi kontak baru akan muncul di panel ini.
                </p>
              </div>
            )}
          </div>
        </div>
        ) : (
        <div className="overflow-hidden rounded-xl border border-amber-100 bg-amber-50/60 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-100 bg-white/70 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <Inbox size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pesan Masuk</h3>
                <p className="text-xs text-amber-700/70">Modul inbox hanya untuk panitia PSB</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-lg border border-amber-100 bg-white/80 p-5 text-sm leading-6 text-slate-600">
              Jika Anda perlu menindaklanjuti pesan publik, gunakan koordinasi dengan panitia PSB atau masuk memakai role yang memiliki akses inbox.
            </div>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
