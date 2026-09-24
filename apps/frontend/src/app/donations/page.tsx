'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { getCampaigns, Campaign, resolveDisplayImageUrl, getPublicSettingsMap, SettingsMap, getDonationStats, DonationStats } from '@/lib/api';
import {
  buildCampaignDetailHref,
  featuredOpenDonation,
  findFeaturedDonationCampaign,
} from '@/lib/donations';
import {
  Heart,
  ShieldCheck,
  Eye,
  Users,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
} from 'lucide-react';

export default function DonationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsMap>({});
	const [stats, setStats] = useState<DonationStats>({ total_donors: 0, total_verified_amount: 0, total_campaigns: 0 });

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const [data, s, st] = await Promise.all([getCampaigns(), getPublicSettingsMap(), getDonationStats()]);
        setCampaigns(data.filter((c) => c.is_active));
        setSettings(s);
        setStats(st);
        setCampaigns(data.filter((c) => c.is_active));
        setSettings(s);
        setError(null);
      } catch (e) {
        console.error('Error fetching campaigns:', e);
        setError('Program donasi belum dapat dimuat. Silakan coba lagi beberapa saat.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const featuredCampaign = findFeaturedDonationCampaign(campaigns);
  const allCampaigns = campaigns.slice(0, 2);
  const displayCampaigns = allCampaigns.length > 0 ? allCampaigns : [];
  const donationBankName = settings.donation_bank_name || featuredOpenDonation.bankName;
  const donationAccountNumber = settings.donation_account_number || featuredOpenDonation.accountNumber;
  const donationAccountHolder = settings.donation_account_holder || featuredOpenDonation.accountHolder;
  const donationWhatsappRaw = settings.donation_whatsapp || featuredOpenDonation.whatsappUrl.replace('https://wa.me/', '').replace(/\D/g, '');
  const donationWhatsapp = donationWhatsappRaw.replace(/\D/g, '');
  const donationWhatsappUrl = donationWhatsapp ? `https://wa.me/${donationWhatsapp}` : featuredOpenDonation.whatsappUrl;
  const donationContactLabel = donationWhatsapp ? donationWhatsapp.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3') : featuredOpenDonation.contactLabel;

  const handleCopyRekening = async () => {
    const text = `${donationBankName} ${donationAccountNumber} a.n. ${donationAccountHolder}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PublicLayout>
      {/* HERO — clean, profesional, islami, emerald primary */}
      <section className="relative overflow-hidden bg-white px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_55%,#ffffff_100%)]" />
        <div className="absolute right-[-6rem] top-[-4rem] h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute left-[-4rem] bottom-[-4rem] h-64 w-64 rounded-full bg-teal-50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-700">
                <Heart size={14} className="text-emerald-600" /> Lembaga Amal Terpercaya
              </p>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-[3.2rem]">
                Bersama Wujudkan Fasilitas yang Lebih Baik
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Donasi Anda membantu kami membangun dan merawat fasilitas untuk pendidikan, ibadah, dan sosial yang bermanfaat bagi banyak orang.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#program-donasi"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  aria-label="Donasi Sekarang, lihat program donasi"
                >
                  Donasi Sekarang <ArrowRight size={16} aria-hidden="true" />
                </a>
                <Link
                  href="/program"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Lihat Program
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-black">A</div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-black">M</div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-black">+</div>
                </div>
                <div className="text-sm">
                  <p className="font-black text-slate-900">{stats.total_donors > 0 ? `${stats.total_donors.toLocaleString('id-ID')} Donatur Terverifikasi` : 'Donatur Terverifikasi'}</p>
                  <p className="text-xs text-slate-500">Telah bergabung dalam kebaikan</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-[280px] lg:h-[340px]">
                  <Image
                    src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80"
                    alt="Pembangunan fasilitas masjid dan ruang kelas santri Al-Maa Parung"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Fasilitas Pendidikan & Ibadah</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Ruang kelas penghafal Qur&apos;an yang lebih layak</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} aria-label="Progress donasi wakaf">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: '25%' }} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">25% terkumpul • Amanah & Transparan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM DONASI AKTIF */}
      <section id="program-donasi" className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Program Donasi Aktif</h2>
              <p className="mt-2 text-sm text-slate-600">Pilih program yang ingin Anda dukung</p>
            </div>
            <Link href="/donations" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800">
              Lihat Semua Program <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="font-bold text-rose-800">Program donasi belum dapat dimuat</p>
              <p className="mt-1 text-sm text-rose-600">Silakan coba lagi beberapa saat.</p>
              <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Coba Lagi</button>
            </div>
          ) : displayCampaigns.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {displayCampaigns.map((campaign) => {
                const progress = campaign.target_amount > 0 ? Math.min(100, Math.round((campaign.collected_amount / campaign.target_amount) * 100)) : 0;
                const imageUrl = resolveDisplayImageUrl(campaign.image_url);
                const detailHref = buildCampaignDetailHref(campaign);
                const isWakaf = campaign.title.toLowerCase().includes('wakaf');
                const badgeColor = isWakaf ? 'bg-emerald-600' : 'bg-sky-600';
                const sisaHari = campaign.end_date
                  ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / 86400000))
                  : 0;
                const endDateLabel = campaign.end_date
                  ? new Date(campaign.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;

                return (
                  <article
                    key={campaign.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={campaign.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                          <Heart size={48} />
                        </div>
                      )}
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${badgeColor}`}>
                        {isWakaf ? 'Wakaf' : 'Infaq'}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">
                        {campaign.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {campaign.description || 'Dukung program ini untuk kebermanfaatan bersama.'}
                      </p>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">Terkumpul Rp {campaign.collected_amount.toLocaleString('id-ID')}</span>
                          <span className="font-medium text-slate-500">{progress}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress donasi ${progress} persen`}>
                          <div className="h-full rounded-full bg-emerald-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Target Rp {campaign.target_amount.toLocaleString('id-ID')}{campaign.end_date && <> • {sisaHari} hari lagi</>}</p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Users size={12} /> {campaign.donor_count || 0} donatur terverifikasi</span>
                        {endDateLabel && <><span>•</span><span className="inline-flex items-center gap-1"><Calendar size={12} /> Berakhir {endDateLabel}</span></>}
                      </div>

                      <div className="mt-5 flex gap-3">
                        <Link
                          href={detailHref}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          Donasi Sekarang
                        </Link>
                        <button
                          onClick={() => {
                            if (navigator.share) navigator.share({ title: campaign.title, url: window.location.origin + detailHref });
                            else navigator.clipboard.writeText(window.location.origin + detailHref);
                          }}
                          aria-label={`Bagikan campaign ${campaign.title}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <Share2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 border">
                <Heart size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Belum Ada Program Donasi Aktif</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Program donasi baru akan segera hadir. Pantau terus halaman ini untuk kebaikan berikutnya.</p>
            </div>
          )}
        </div>
      </section>

      {/* VIDEO */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <a href={donationWhatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700">Donasi via WA</a>
            <a href="https://youtu.be/zi7yo4KEtiM" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:text-red-600">Tonton di YouTube</a>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Kenapa Berdonasi di Alma Parung?</h2>
            <p className="mt-2 text-sm text-slate-600">Kepercayaan Anda adalah amanah bagi kami.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Aman & Terpercaya', desc: 'Dana dikelola secara aman dan transparan' },
              { icon: Eye, title: 'Transparan', desc: 'Laporan penggunaan dana secara berkala' },
              { icon: Users, title: 'Banyak Manfaat', desc: 'Program tepat sasaran untuk umat dan masyarakat' },
              { icon: Heart, title: 'Pahala Berkelanjutan', desc: 'Setiap donasi menjadi investasi kebaikan' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <item.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARA BERDONASI */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Cara Berdonasi</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Pilih Program', d: 'Pilih program donasi yang ingin Anda dukung' },
              { n: '02', t: 'Transfer Donasi', d: 'Transfer donasi ke rekening resmi kami' },
              { n: '03', t: 'Konfirmasi', d: 'Kirim bukti transfer untuk konfirmasi dan pencatatan' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-black">{s.n}</div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{s.t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REKENING RESMI */}
      <section className="bg-emerald-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Rekening Resmi Donasi</h2>
            <p className="mt-1 text-sm text-slate-600">Transfer ke rekening resmi berikut</p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{donationBankName}</p>
              <p className="mt-2 font-mono text-xl font-black tracking-wide text-slate-900">{donationAccountNumber}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Atas nama: {donationAccountHolder}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleCopyRekening}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  aria-label={`Salin nomor rekening ${donationBankName} ${donationAccountNumber}`}
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copied ? 'Tersalin!' : 'Salin Nomor Rekening'}
                </button>
                <a
                  href={donationWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  aria-label={`Konfirmasi via WhatsApp ke ${donationContactLabel}`}
                >
                  Konfirmasi via WhatsApp
                </a>
              </div>
              {copied && <p className="mt-3 text-xs font-bold text-emerald-700" role="status">Nomor rekening berhasil disalin</p>}
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Donasi via transfer manual. Setelah transfer, kirim bukti ke WhatsApp agar dicatat dan diverifikasi admin (status akan jadi <span className="font-bold text-emerald-700">verified</span> setelah dicek).
            </p>
          </div>
        </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden">
        <a
          href="#program-donasi"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
          aria-label="Donasi Sekarang"
        >
          <Heart size={16} aria-hidden="true" /> Donasi Sekarang
        </a>
      </div>
    </PublicLayout>
  );
}
