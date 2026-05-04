'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { getCampaigns, Campaign, resolveDisplayImageUrl } from '@/lib/api';
import { Heart, Activity, CheckCircle, ArrowRight, Landmark } from 'lucide-react';

export default function DonationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const data = await getCampaigns();
        setCampaigns(data.filter((campaign) => campaign.is_active));
      } catch (e) {
        console.error('Error fetching campaigns:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/86 to-emerald-950/72" />
        <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-700/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-amber-300/18 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                <Heart size={14} />
                Donasi dan Wakaf
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Bersama membangun ruang belajar, ibadah, dan pembinaan santri.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-100/82 sm:text-base sm:leading-8">
                Dukungan Anda membantu penguatan program tahfidz, kebutuhan operasional, dan
                pengembangan fasilitas Darussunnah agar pembinaan santri terus berjalan optimal.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/12 text-emerald-100">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200/80">
                    Rekening Donasi
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">BSI 7123664177</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-emerald-100/80">
                A.n. PONPES DARUSSUNNAH. Konfirmasi donasi dan kebutuhan bantuan dapat dilakukan
                melalui halaman kontak pondok.
              </p>
              <Link
                href="/kontak"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-emerald-200"
              >
                Konfirmasi donasi <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(to_bottom,_#f8fafc,_#ffffff)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                Program Aktif
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Pilihan dukungan untuk pengembangan dan keberlangsungan pondok.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Setiap program ditampilkan agar donatur dapat melihat fokus kebutuhan dan perkembangan
              pengumpulan dana secara lebih jelas.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] animate-pulse rounded-[1.75rem] border border-slate-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => {
                const progress =
                  campaign.target_amount > 0
                    ? Math.min(
                        100,
                        Math.round((campaign.collected_amount / campaign.target_amount) * 100)
                      )
                    : 0;
                const imageUrl = resolveDisplayImageUrl(campaign.image_url);

                return (
                  <article
                    key={campaign.id}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/8"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={campaign.title}
                          fill
                          unoptimized
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-300">
                          <Heart size={52} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />
                      <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm backdrop-blur">
                        <Activity size={12} />
                        Aktif
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">
                        {campaign.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {campaign.description || 'Program dukungan untuk pengembangan dan keberlangsungan kegiatan pondok.'}
                      </p>

                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em]">
                          <span className="text-slate-400">Terkumpul</span>
                          <span className="text-emerald-700">
                            Rp {campaign.collected_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-right text-[11px] text-slate-500">
                          Target Rp {campaign.target_amount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/kontak"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1rem] bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          Donasi Sekarang <ArrowRight size={16} />
                        </Link>
                        <Link
                          href="/profil"
                          className="inline-flex items-center justify-center rounded-[1rem] border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                        >
                          Tentang Pondok
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.9rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-300">
                <CheckCircle size={28} />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                Program donasi akan ditampilkan di sini.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Saat ini belum ada program publik yang sedang dibuka. Anda tetap dapat menghubungi
                pondok untuk informasi donasi umum, wakaf, atau dukungan pembangunan.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
