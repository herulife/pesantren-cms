'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Newspaper,
  School,
} from 'lucide-react';
import {
  Agenda,
  getAgendas,
  getNews,
  getSettingsMap,
  News,
  resolveDisplayImageUrl,
  SettingsMap,
} from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';

type HeroContent = {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
};

function buildHeroContent(settings: SettingsMap): HeroContent {
  return {
    title: settings.banner_title || 'Merekam Jejak Intelektual & Spiritual',
    subtitle:
      settings.banner_subtitle ||
      'Pendidikan tahfidz yang menumbuhkan ilmu, adab, dan kesiapan berdakwah di tengah umat.',
    imageUrl: resolveDisplayImageUrl(settings.banner_image_url || '/assets/img/gedung.webp'),
    buttonText: settings.banner_button_text || 'Daftar Sekarang',
    buttonUrl: settings.banner_button_url || '/psb',
  };
}

export default function LandingPage() {
  const [news, setNews] = useState<News[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHomepageData() {
      try {
        const [newsData, agendasData, settingsData] = await Promise.all([
          getNews(),
          getAgendas(),
          getSettingsMap({ silentUnauthorized: true }),
        ]);

        const newsPayload = newsData as unknown as { data?: News[] } | News[];
        const agendaPayload = agendasData as unknown as { data?: Agenda[] } | Agenda[];

        setNews(Array.isArray(newsPayload) ? newsPayload.slice(0, 4) : (newsPayload.data || []).slice(0, 4));
        setAgendas(Array.isArray(agendaPayload) ? agendaPayload.slice(0, 4) : (agendaPayload.data || []).slice(0, 4));
        setSettings(settingsData || {});
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchHomepageData();
  }, []);

  const hero = useMemo(() => buildHeroContent(settings), [settings]);
  const infoCards = useMemo(
    () => [
      {
        label: 'Pendaftaran',
        title: settings.card_info_1_title || 'PSB Tahun Ajaran 2026/2027',
        desc: settings.card_info_1_desc || 'Informasi pendaftaran dan alur bergabung sebagai santri baru.',
        href: '/psb',
        icon: <GraduationCap size={30} />,
      },
      {
        label: 'Pembinaan',
        title: settings.card_info_2_title || 'Tahfidz & Adab Harian',
        desc: settings.card_info_2_desc || 'Pembinaan hafalan, ibadah harian, dan pembentukan karakter santri.',
        href: '/program',
        icon: <Award size={30} />,
      },
      {
        label: 'Tentang Pondok',
        title: settings.card_info_3_title || 'Sambutan & Profil Lembaga',
        desc: settings.card_info_3_desc || 'Baca pesan pimpinan dan pelajari visi misi yang dibangun di Darussunnah.',
        href: '/sambutan',
        icon: <School size={30} />,
      },
    ],
    [settings]
  );

  const programCards = [
    {
      title: "Tahfidz Al-Qur'an",
      desc: "Program intensif menghafal Al-Qur'an dengan target 30 juz mutqin.",
      icon: <BookOpen className="text-emerald-500" />,
      href: '/program#tahfidz',
    },
    {
      title: 'Kajian Kitab Kuning',
      desc: 'Mendalami literatur klasik Islam dengan bimbingan asatidz kompeten.',
      icon: <School className="text-emerald-500" />,
      href: '/program#kitab-kuning',
    },
    {
      title: 'Kader Dakwah',
      desc: 'Pembinaan keberanian, tanggung jawab, dan keterampilan menyampaikan ilmu.',
      icon: <Heart className="text-emerald-500" />,
      href: '/program#kader-dakwah',
    },
    {
      title: 'Kemandirian Santri',
      desc: 'Pembiasaan hidup tertib, mandiri, dan disiplin dalam aktivitas harian.',
      icon: <Award className="text-emerald-500" />,
      href: '/program#kemandirian',
    },
  ];

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${hero.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-emerald-950/50" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center px-4 py-20 sm:min-h-[640px] lg:min-h-[700px]">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Pondok Pesantren Tahfidz
          </span>
          <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={hero.buttonUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-4 text-sm font-black text-white transition hover:brightness-110"
            >
              {hero.buttonText}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/profil"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              Lihat Profil Pondok
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-12 px-4">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {infoCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[2rem] border border-white/60 bg-white/95 p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-22px_rgba(16,185,129,0.35)]"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
                    {card.label}
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <PublicSectionIntro
                eyebrow="Kabar Pesantren"
                title="Warta Darussunnah"
                description="Aktivitas, pengumuman, dan artikel terbaru dari lingkungan pesantren."
              />
              <Link
                href="/news"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-100"
              >
                Semua Berita
                <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2">
                {news.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            ) : (
              <PublicEmptyState
                icon={Newspaper}
                title="Belum ada berita"
                description="Berita terbaru akan segera hadir."
              />
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-[0_20px_50px_-20px_rgba(16,185,129,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                  <GraduationCap size={28} />
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Dibuka
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-black uppercase tracking-tight text-slate-900">
                Pendaftaran Santri Baru
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Buka kesempatan putra-putri Anda untuk menjadi penghafal Al-Qur&apos;an bersama Darussunnah Parung.
              </p>

              <Link
                href="/psb"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Lihat Info PSB
                <ArrowRight size={14} />
              </Link>

              <div className="mt-10 border-t border-slate-100 pt-8">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                  Agenda Singkat
                </h4>
                <div className="mt-5 space-y-4">
                  {isLoading ? (
                    [1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    ))
                  ) : agendas.length > 0 ? (
                    agendas.slice(0, 3).map((agenda) => (
                      <div key={agenda.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                              {new Date(agenda.start_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                              })}
                            </p>
                            <h5 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">
                              {agenda.title}
                            </h5>
                            <p className="mt-2 text-xs text-slate-500">
                              {agenda.location || 'Kampus Darussunnah'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <PublicEmptyState
                      icon={Calendar}
                      title="Agenda belum tersedia"
                      description="Agenda terbaru akan tampil di bagian ini."
                      className="px-4 py-10"
                    />
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200/60 bg-slate-50/70 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
              Program Pendidikan
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Program Unggulan Pondok
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-500">
              Kurikulum dirancang untuk menjaga keseimbangan antara hafalan, adab, pendalaman ilmu,
              dan kesiapan santri menjalani kehidupan yang disiplin.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {programCards.map((program) => (
              <Link
                key={program.href}
                href={program.href}
                className="group flex h-full flex-col rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_40px_-20px_rgba(16,185,129,0.25)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm transition group-hover:bg-emerald-600 group-hover:text-white">
                  {program.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-emerald-700">
                  {program.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{program.desc}</p>
                <div className="mt-auto pt-6 text-sm font-bold text-emerald-700">
                  Pelajari Selengkapnya
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4">
          <PublicSectionIntro
            eyebrow="Jadwal Kegiatan"
            title="Agenda Mendatang"
            description="Pantau kegiatan pondok, agenda akademik, dan informasi penting yang akan datang."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-60 animate-pulse rounded-[2rem] bg-slate-100" />
              ))
            ) : agendas.length > 0 ? (
              agendas.map((agenda) => {
                const date = new Date(agenda.start_date);
                return (
                  <article
                    key={agenda.id}
                    className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200">
                        <span className="text-lg font-black">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                          {date.toLocaleString('id-ID', { month: 'long' })}
                        </p>
                        <p className="text-sm font-bold text-slate-700">{date.getFullYear()}</p>
                      </div>
                    </div>

                    <h3 className="mt-6 line-clamp-2 text-xl font-bold text-slate-900">
                      {agenda.title}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      {agenda.location ? (
                        <div className="flex items-center gap-2.5">
                          <MapPin size={16} className="text-emerald-500" />
                          <span>{agenda.location}</span>
                        </div>
                      ) : null}
                      {agenda.time_info ? (
                        <div className="flex items-center gap-2.5">
                          <Clock size={16} className="text-emerald-500" />
                          <span>{agenda.time_info}</span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="md:col-span-2 xl:col-span-4">
                <PublicEmptyState
                  icon={Calendar}
                  title="Belum ada agenda terbaru"
                  description="Agenda pondok yang akan datang akan ditampilkan di bagian ini."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-24 lg:py-28">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center text-white">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
            Siap Bergabung Bersama Kami?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
            Kenali lebih dekat sistem pendidikan Darussunnah dan lanjutkan ke proses pendaftaran
            santri baru.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/psb"
              className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-extrabold text-emerald-900 transition hover:bg-emerald-50"
            >
              Lihat Info PSB
              <ArrowRight size={18} />
            </Link>
            <a
              href="https://wa.me/6281413241748"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/20"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
