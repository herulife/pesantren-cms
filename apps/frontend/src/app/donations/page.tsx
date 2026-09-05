'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { getCampaigns, Campaign, resolveDisplayImageUrl } from '@/lib/api';
import {
  buildCampaignDetailHref,
  featuredOpenDonation,
  findFeaturedDonationCampaign,
} from '@/lib/donations';
import {
  Heart,
  Activity,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  PaintBucket,
  Target,
} from 'lucide-react';

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

  const featuredCampaign = findFeaturedDonationCampaign(campaigns);
  const featuredTargetAmount = featuredCampaign?.target_amount ?? featuredOpenDonation.target;
  const visibleCampaigns = campaigns.filter((campaign) => campaign.id !== featuredCampaign?.id);
  // Menu-driven display — pakai DB campaign bila ada, fallback ke hardcode
  const displayTitle = featuredCampaign?.title ?? featuredOpenDonation.title;
  const displayDescription = featuredCampaign?.description || featuredOpenDonation.summary;
  const displayDetailHref = featuredCampaign ? buildCampaignDetailHref(featuredCampaign) : `/donations/${featuredOpenDonation.slug}`;

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#e0f2fe_100%)] px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_32%)]" />
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700 shadow-[0_20px_50px_-30px_rgba(14,165,233,0.45)]">
                <Heart size={14} />
                Open Donasi Baru
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
                {displayTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                {displayDescription}
              </p>
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-sm">
                <strong className="font-black">Info Bootstrap:</strong> Donasi via <span className="font-bold">{featuredOpenDonation.bankName} {featuredOpenDonation.accountNumber}</span> a.n. {featuredOpenDonation.accountHolder} — klik <span className="badge bg-primary text-white px-2 py-1 rounded text-xs font-black">WA Konfirmasi</span> setelah transfer. <span className="badge bg-success text-white px-2 py-1 rounded text-xs font-black">Amanah</span> <span className="badge bg-info text-white px-2 py-1 rounded text-xs font-black">Transparan</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={displayDetailHref}
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Lihat Halaman Donasi <ArrowRight size={16} />
                </Link>
                <a
                  href={featuredOpenDonation.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-[0_20px_40px_-22px_rgba(14,165,233,0.75)] transition hover:bg-sky-600"
                >
                  WA Konfirmasi Donasi <ArrowRight size={16} />
                </a>
                <Link
                  href="#program-donasi"
                  className="inline-flex items-center gap-2 rounded-[1rem] border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                >
                  Lihat Program Donasi <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-sky-100 bg-white/92 p-5 shadow-[0_30px_80px_-40px_rgba(59,130,246,0.35)] md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-100 text-sky-600">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">
                    Target Donasi
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    Rp {featuredTargetAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-wide text-slate-600">
                  <span>Terkumpul Rp 0</span>
                  <span>Target Rp {featuredTargetAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-200 border border-slate-100">
                  <div className="h-3 rounded-full bg-blue-600" style={{ width: '5%' }}></div>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">0% terkumpul</span> — progress bootstrap
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {featuredOpenDonation.summary} Konfirmasi dan arahan transfer sementara diarahkan
                langsung ke admin pondok agar penyalurannya lebih rapi.
              </p>
              <div className="mt-5 rounded-[1.2rem] border border-sky-100 bg-sky-50/80 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                  Rekening Donasi
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-800">
                  Salurkan infak terbaik anda melalui:
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  <span className="font-black">💳 {featuredOpenDonation.bankName} {featuredOpenDonation.accountNumber}</span>{' '}
                  <span className="font-medium">(an. {featuredOpenDonation.accountHolder})</span>
                </p>
              </div>
              <a
                href={featuredOpenDonation.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition hover:text-sky-800"
              >
                WA Konfirmasi: {featuredOpenDonation.contactLabel} <ArrowRight size={16} />
              </a>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-sky-100 bg-sky-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                    Kategori
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">Wakaf Renovasi Ringan</p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Fokus
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    Ruang Kelas Penghafal Al-Quran
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(to_bottom,_#f8fbff,_#ffffff)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_28px_80px_-44px_rgba(56,189,248,0.4)]">
            <div className="relative h-[420px] bg-slate-100">
              <Image
                src={featuredCampaign?.image_url ? resolveDisplayImageUrl(featuredCampaign.image_url) : featuredOpenDonation.posterImage}
                alt={displayTitle}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
              <PaintBucket size={14} />
              Wakaf Cat Tembok
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              Cuma cat tembok, tapi pahalanya terus mengalir.
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
              Bayangkan setiap ayat yang dihafal santri terjadi di ruang kelas yang kamu bantu
              bangun. Donasi ini dibuka untuk membantu pengecatan ruang belajar agar para santri
              memiliki tempat yang lebih nyaman untuk belajar, murojaah, dan menjaga semangat
              hafalan mereka.
            </p>
            <div className="mt-6 space-y-3">
              {featuredOpenDonation.points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <CheckCircle className="mt-0.5 text-sky-500" size={18} />
                  <p className="text-sm leading-7 text-slate-700">{point}</p>
                </div>
                ))}
              </div>
            <div className="mt-6 rounded-[1.35rem] border border-sky-100 bg-sky-50/75 px-4 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                Salurkan infak terbaik anda melalui
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-slate-900">
                💳 {featuredOpenDonation.bankName} {featuredOpenDonation.accountNumber}
              </p>
              <p className="text-sm leading-7 text-slate-700">
                a.n. {featuredOpenDonation.accountHolder}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={displayDetailHref}
                className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Buka Detail Donasi <ArrowRight size={16} />
              </Link>
              <a
                href={featuredOpenDonation.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[1rem] bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                <MessageCircle size={16} />
                WA Konfirmasi Donasi
              </a>
              <Link
                href="/kontak"
                className="inline-flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
              >
                Info Kontak Pondok <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 shadow-[0_30px_90px_-48px_rgba(250,204,21,0.6)]">
          <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="relative min-h-[280px]">
              <Image
                src={featuredOpenDonation.coverImage}
                alt="Gedung Pondok Pesantren Al-Maa"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/18 via-slate-950/6 to-transparent" />
            </div>
            <div className="p-6 text-white sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">
                Dampak Donasi
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight">
                Ruang belajar yang lebih layak untuk santri Al-Maa.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Donasi ini diharapkan membantu menghadirkan ruang kelas yang lebih bersih, cerah,
                dan menyenangkan untuk hafalan, pembelajaran diniyah, dan aktivitas harian santri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Donasi - Alma Parung - Versi Lengkap & Estetik */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_55%,#eef7ff_100%)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="absolute left-[-6rem] top-10 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-[-4rem] h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Video Resmi Alma Parung
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">
              Dari ruang yang kusam menjadi ruang yang menghidupkan hafalan
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Video <span className="font-bold text-slate-900">“Donasi”</span> di channel YouTube{" "}
              <span className="font-bold text-slate-900">Alma Parung</span> —{" "}
              <a href="https://youtu.be/zi7yo4KEtiM" target="_blank" rel="noreferrer" className="font-bold text-red-600 underline decoration-red-200 underline-offset-4 hover:text-red-700">youtu.be/zi7yo4KEtiM</a>{" "}
              — merekam ajakan wakaf pengurus untuk mengecat ruang kelas santri penghafal Al-Quran. Tonton langsung di bawah, lalu baca rangkuman lengkapnya.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
            {/* Video */}
            <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_28px_80px_-44px_rgba(250,204,21,0.18)]">
              <div className="aspect-video w-full overflow-hidden bg-slate-950">
                <iframe
                  src="https://www.youtube.com/embed/zi7yo4KEtiM"
                  title="Video Donasi - Pondok Pesantren Al-Maa Parung"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> YouTube • Alma Parung • Donasi
                </span>
                <a href="https://youtu.be/zi7yo4KEtiM" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15">Buka di YouTube ↗</a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <a href={featuredOpenDonation.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700">Donasi via WA</a>
                <a href="https://youtu.be/zi7yo4KEtiM" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:text-red-600">Tonton di YouTube</a>
              </div>
            </div>
          </div>

          {/* Detail tambahan */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-sky-600">Rincian Penggunaan</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Cat interior premium + cat dasar anti lembab</li>
                <li>• Dempul, amplas, dan perbaikan sudut lembab</li>
                <li>• Kuas/roller dan alat bantu pengecatan</li>
                <li>• Upah tukang & pembersihan akhir</li>
              </ul>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-600">Cara Donasi (3 langkah)</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li><span className="font-black">1.</span> Transfer ke <span className="font-bold">BSI {featuredOpenDonation.accountNumber}</span> a.n. {featuredOpenDonation.accountHolder}</li>
                <li><span className="font-black">2.</span> Simpan bukti transfer</li>
                <li><span className="font-black">3.</span> Kirim bukti ke WA <span className="font-bold text-sky-700">0819 3250 6078</span></li>
              </ol>
            </div>
            <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50/70 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">Rekening</p>
              <p className="mt-3 text-sm font-black text-slate-900">BSI {featuredOpenDonation.accountNumber}</p>
              <p className="text-sm text-slate-600">a.n. {featuredOpenDonation.accountHolder}</p>
              <p className="mt-3 text-xs leading-6 text-slate-600">Target <span className="font-bold">Rp 15.000.000</span> • Kategori Wakaf Renovasi Ringan • Fokus Ruang Kelas Penghafal Al-Quran</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="program-donasi"
        className="bg-[linear-gradient(to_bottom,_#f8fbff,_#ffffff)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                Program Aktif
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Program donasi yang sudah terhubung ke sistem admin.
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {campaigns.slice(0, 2).map((campaign) => {
                const progress =
                  campaign.target_amount > 0
                    ? Math.min(
                        100,
                        Math.round((campaign.collected_amount / campaign.target_amount) * 100)
                      )
                    : 0;
                const imageUrl = resolveDisplayImageUrl(campaign.image_url);
                const detailHref = buildCampaignDetailHref(campaign);
                const category = campaign.title.toLowerCase().includes('wakaf') ? 'Wakaf' : campaign.title.toLowerCase().includes('infaq') ? 'Infaq' : 'Donasi';
                const sisaHari = 30;

                return (
                  <article
                    key={campaign.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={campaign.title}
                          fill
                          unoptimized
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 text-sky-300">
                          <Heart size={52} />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700 shadow-sm">
                        {category}
                      </div>
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
                        <Activity size={12} />
                        Aktif
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-6 text-slate-900">
                        {campaign.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {campaign.description || 'Bantu pondok wujudkan program ini.'}
                      </p>

                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">Rp {campaign.collected_amount.toLocaleString('id-ID')}</span>
                          <span className="font-medium text-slate-500">{progress}%</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">terkumpul dari Rp {campaign.target_amount.toLocaleString('id-ID')}</p>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Heart size={12} /> {Math.floor(progress/10)+3} donatur</span>
                        <span>•</span>
                        <span>{sisaHari} hari lagi</span>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <Link
                          href={detailHref}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
                        >
                          Donasi Sekarang <ArrowRight size={16} />
                        </Link>
                        <Link
                          href={detailHref}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.9rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-300">
                <CheckCircle size={28} />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                Program donasi akan ditampilkan di sini.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Saat ini belum ada program publik yang sedang dibuka. Anda tetap dapat menghubungi
                pondok untuk informasi donasi umum, wakaf, atau open donasi pembangunan lainnya.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
