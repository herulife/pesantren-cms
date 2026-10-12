'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import { Campaign, getCampaigns, resolveDisplayImageUrl } from '@/lib/api';
import {
  buildCampaignDetailHref,
  findFeaturedDonationCampaign,
  featuredOpenDonation,
  parseCampaignIdFromSlug,
} from '@/lib/donations';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

export default function DonationDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || '';
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(slug !== featuredOpenDonation.slug);

  useEffect(() => {
    async function fetchCampaignDetail() {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      if (slug !== featuredOpenDonation.slug) {
        setIsLoading(true);
      }

      try {
        const data = await getCampaigns({ activeOnly: true });
        const activeCampaigns = data.filter((item) => item.is_active);
        setCampaigns(activeCampaigns);

        if (slug === featuredOpenDonation.slug) {
          setCampaign(findFeaturedDonationCampaign(activeCampaigns));
          return;
        }

        const campaignId = parseCampaignIdFromSlug(slug);
        const foundCampaign =
          activeCampaigns.find((item) => item.id === campaignId) ??
          activeCampaigns.find((item) => buildCampaignDetailHref(item).endsWith(slug));
        setCampaign(foundCampaign ?? null);
      } catch (error) {
        console.error('Failed to fetch donation detail:', error);
        setCampaign(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaignDetail();
  }, [slug]);

  const featuredCampaign = useMemo(
    () => findFeaturedDonationCampaign(campaigns),
    [campaigns]
  );

  const featuredCollectedAmount = featuredCampaign?.collected_amount ?? featuredOpenDonation.progressAmount;
  const featuredTargetAmount = featuredCampaign?.target_amount ?? featuredOpenDonation.target;
  const featuredProgress = featuredTargetAmount
    ? Math.min(
        100,
        Math.round((featuredCollectedAmount / featuredTargetAmount) * 100)
      )
    : 0;

  const relatedCampaigns = useMemo(() => {
    if (slug === featuredOpenDonation.slug) {
      return campaigns.filter((item) => item.id !== featuredCampaign?.id).slice(0, 3);
    }

    return campaigns.filter((item) => item.id !== campaign?.id).slice(0, 3);
  }, [campaign?.id, campaigns, featuredCampaign?.id, slug]);

  const featuredDonationSteps = [
    'Transfer donasi ke rekening BSI yang tertera di halaman ini.',
    'Simpan bukti transfer agar proses verifikasi lebih mudah.',
    `Kirim bukti transfer ke WA konfirmasi ${featuredOpenDonation.contactLabel}.`,
  ];

  if (slug === featuredOpenDonation.slug) {
    return (
      <PublicLayout>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_46%,#dff4ff_100%)] px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_28%)]" />
          <div className="pointer-events-none absolute right-[-7rem] top-[-4rem] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] left-[-4rem] h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-6xl">
            <Link
              href="/donations"
              className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition hover:text-sky-800"
            >
              <ArrowLeft size={16} />
              Kembali ke daftar donasi
            </Link>

            {/* Video Donasi - Deskripsi Panjang */}
            <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_28px_80px_-44px_rgba(250,204,21,0.12)]">
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src="https://www.youtube.com/embed/zi7yo4KEtiM"
                  title="Video Donasi - Pondok Pesantren Darussunnah Parung"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200">Video resmi Darussunnah Parung • Donasi — https://youtu.be/zi7yo4KEtiM</div>
              <div className="p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">Deskripsi Lengkap Video</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Dari dinding kusam menjadi ruang yang menghidupkan hafalan</h3>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <p>Video dibuka dengan sorotan ruang kelas yang catnya memudar dan lembab di sudut — tempat 60 santri (30 ikhwan + 30 akhwat SMP–SMK) setiap hari murojaah dan setor hafalan. Pengurus menyampaikan bahwa suasana yang bersih dan cerah bukan sekadar estetika, melainkan penunjang konsentrasi dan adab belajar.</p>
                  <p>Rencana wakaf Rp 15.000.000 mencakup cat interior premium, cat dasar anti lembab, dempul/amplas, kuas/roller, dan upah tukang agar hasil rapi dan tahan lama. Pengerjaan ditargetkan menyeluruh agar tidak cepat rusak dan bisa dipakai lama.</p>
                  <p>Dampaknya: santri lebih betah berlama-lama mengulang ayat, belajar diniyah lebih fokus, dan setiap huruf yang dihafal di ruang itu menjadi pahala jariyah bagi donatur — sebagaimana hadits tentang sedekah jariyah, ilmu bermanfaat, dan doa anak shalih.</p>
                  <p>Cara donasi tetap sederhana: transfer ke BSI 4381567120 a.n. Darussunnah Parung Bogor, simpan bukti, lalu kirim ke WA 0819 3250 6078 untuk verifikasi dan doa dari santri.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(340px,0.96fr)] lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700 shadow-[0_18px_40px_-28px_rgba(14,165,233,0.35)]">
                  <Sparkles size={14} />
                  Open Donasi Unggulan
                </div>
                <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] text-slate-950 md:text-6xl">
                  {featuredOpenDonation.title}
                </h1>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                  {featuredOpenDonation.summary}
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.45rem] border border-sky-100 bg-white/92 p-4 shadow-[0_22px_50px_-34px_rgba(250,204,21,0.16)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                      Target
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      Rp {featuredTargetAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-slate-200 bg-white/92 p-4 shadow-[0_22px_50px_-34px_rgba(250,204,21,0.16)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Kategori
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {featuredOpenDonation.category}
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-slate-200 bg-white/92 p-4 shadow-[0_22px_50px_-34px_rgba(250,204,21,0.16)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Fokus
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {featuredOpenDonation.focus}
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={featuredOpenDonation.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-[1rem] bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-[0_22px_45px_-26px_rgba(14,165,233,0.48)] transition hover:-translate-y-0.5 hover:bg-sky-600"
                  >
                    <MessageCircle size={16} />
                    WA Konfirmasi Donasi
                  </a>
                  <Link
                    href="/kontak"
                    className="inline-flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
                  >
                    Kontak Pondok <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="mt-6 rounded-[1.45rem] border border-sky-100 bg-sky-50/80 px-4 py-4 shadow-[0_18px_42px_-28px_rgba(5,150,105,0.18)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                    Rekening Donasi
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-800">
                    Salurkan infak terbaik anda melalui:
                  </p>
                  <p className="mt-2 text-sm font-bold leading-7 text-slate-900">
                    {featuredOpenDonation.bankName} {featuredOpenDonation.accountNumber}
                  </p>
                  <p className="text-sm leading-7 text-slate-700">
                    a.n. {featuredOpenDonation.accountHolder}
                  </p>
                </div>
              </div>

              <div className="relative order-1 lg:order-2">
                <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white p-3 shadow-[0_32px_90px_-42px_rgba(59,130,246,0.35)]">
                  <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)] p-4 sm:min-h-[520px] sm:p-5">
                    <div className="relative h-[380px] w-full max-w-[390px] sm:h-[470px]">
                      <Image
                        src={featuredOpenDonation.posterImage}
                        alt={featuredOpenDonation.title}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_28px_90px_-50px_rgba(250,204,21,0.6)]">
                <div className="relative h-[360px]">
                  <Image
                    src={featuredOpenDonation.coverImage}
                    alt="Suasana ruang belajar Darussunnah"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-slate-950/10 to-transparent" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(250,204,21,0.14)] sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Cerita Donasi
                </p>
                <div className="mt-5 space-y-4 text-sm leading-8 text-slate-600 sm:text-base">
                  {featuredOpenDonation.story.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(250,204,21,0.14)] sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Mengapa Campaign Ini Penting
                </p>
                <div className="mt-5 space-y-3">
                  {featuredOpenDonation.points.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <CheckCircle2 className="mt-0.5 text-sky-500" size={18} />
                      <p className="text-sm leading-7 text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(250,204,21,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-100 text-sky-600">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                      Progres Donasi
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {featuredProgress}%
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em]">
                    <span className="text-slate-400">Terkumpul</span>
                    <span className="text-sky-700">
                      Rp {featuredCollectedAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${featuredProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-right text-[11px] text-slate-500">
                    Target Rp {featuredTargetAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-sky-100 bg-sky-50/75 p-6 shadow-[0_22px_54px_-40px_rgba(5,150,105,0.16)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white text-sky-700">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                      Transfer Donasi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Rekening resmi campaign
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                  {featuredOpenDonation.bankName} {featuredOpenDonation.accountNumber}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  a.n. {featuredOpenDonation.accountHolder}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(250,204,21,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-100 text-sky-600">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                    Langkah Donasi
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {featuredDonationSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-start gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[11px] font-black text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(250,204,21,0.14)]">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  WhatsApp Konfirmasi
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Setelah transfer, kirim bukti pembayaran ke nomor ini agar donasi bisa segera kami catat dan konfirmasi dengan rapi.
                </p>
                <a
                  href={featuredOpenDonation.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
                >
                  <MessageCircle size={16} />
                  WA Konfirmasi: {featuredOpenDonation.contactLabel}
                </a>
              </div>
            </aside>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <section className="bg-[linear-gradient(to_bottom,_#f8fbff,_#ffffff)] px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl animate-pulse space-y-6">
            <div className="h-6 w-40 rounded-full bg-slate-200" />
            <div className="h-16 w-full max-w-3xl rounded-3xl bg-slate-200" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(300px,0.98fr)]">
              <div className="h-[420px] rounded-[2rem] bg-slate-200" />
              <div className="h-[420px] rounded-[2rem] bg-slate-200" />
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (!campaign) {
    return (
      <PublicLayout>
        <section className="bg-[linear-gradient(to_bottom,_#f8fbff,_#ffffff)] px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-400">
              <Heart size={28} />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
              Halaman donasi tidak ditemukan
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Link yang kamu buka belum tersedia atau campaign-nya sudah tidak aktif lagi.
            </p>
            <Link
              href="/donations"
              className="mt-6 inline-flex items-center gap-2 rounded-[1rem] bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
            >
              Kembali ke daftar donasi <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const progress =
    campaign.target_amount > 0
      ? Math.min(100, Math.round((campaign.collected_amount / campaign.target_amount) * 100))
      : 0;
  const imageUrl = resolveDisplayImageUrl(campaign.image_url);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#dbeafe_100%)] px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/donations"
            className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition hover:text-sky-800"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar donasi
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                <Activity size={14} />
                Campaign Donasi Aktif
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
                {campaign.title}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                {campaign.description ||
                  'Campaign ini dibuka untuk mendukung kebutuhan pondok. Silakan hubungi admin donasi untuk konfirmasi dan informasi penyaluran.'}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-sky-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                    Terkumpul
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    Rp {campaign.collected_amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Target
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    Rp {campaign.target_amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Progres
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">{progress}%</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_30px_80px_-40px_rgba(59,130,246,0.35)]">
              <div className="relative h-[280px] sm:h-[360px] lg:h-[480px] bg-slate-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={campaign.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 text-sky-300">
                    <Heart size={72} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                Ringkasan Program
              </p>
              <div className="mt-5 space-y-4 text-sm leading-8 text-slate-600 sm:text-base">
                <p>
                  {campaign.description ||
                    'Program ini dikelola melalui panel donasi pondok dan ditampilkan ke publik agar calon donatur dapat melihat kebutuhan serta progres pengumpulan dana.'}
                </p>
                <p>
                  Jika kamu ingin ikut berkontribusi atau butuh konfirmasi teknis penyaluran,
                  admin donasi pondok siap membantu melalui WhatsApp atau kontak resmi pondok.
                </p>
              </div>
            </div>

            {relatedCampaigns.length > 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Campaign Lainnya
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {relatedCampaigns.map((item) => (
                    <Link
                      key={item.id}
                      href={buildCampaignDetailHref(item)}
                      className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-white"
                    >
                      <p className="text-sm font-bold leading-6 text-slate-900">{item.title}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        Target Rp {item.target_amount.toLocaleString('id-ID')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-sky-100 text-sky-600">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                    Progres Campaign
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{progress}%</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em]">
                  <span className="text-slate-400">Terkumpul</span>
                  <span className="text-sky-700">
                    Rp {campaign.collected_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 text-right text-[11px] text-slate-500">
                  Target Rp {campaign.target_amount.toLocaleString('id-ID')}
                </div>
              </div>
              {campaign.end_date && (
                <div className="mt-5 flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-sky-600" />
                  Berakhir {new Date(campaign.end_date).toLocaleDateString('id-ID')}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                Donasi Sekarang
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Untuk ikut berpartisipasi, silakan hubungi admin donasi pondok terlebih dahulu agar
                mendapatkan arahan transfer dan konfirmasi campaign yang tepat.
              </p>
              <a
                href={featuredOpenDonation.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                <MessageCircle size={16} />
                Hubungi Admin Donasi
              </a>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
