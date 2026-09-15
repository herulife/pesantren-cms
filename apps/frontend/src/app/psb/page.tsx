'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getPublicSettingsMap } from '@/lib/api';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { useWebsiteBuilderPageContent } from '@/components/PublicSiteContext';
import { defaultPageContent } from '@/lib/page-content';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HelpCircle,
  ListChecks,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
} from 'lucide-react';


const PSB_PAGE_KEYS = [
  'psb_page_hero_title',
  'psb_page_hero_subtitle',
  'psb_page_requirements',
  'psb_page_quota_ikhwan',
  'psb_page_quota_akhwat',
  'psb_page_fee',
  'psb_page_address',
  'psb_page_wa',
];

type PsbContent = typeof defaultPageContent.psb;

// Timpa konten statis dengan pengaturan admin (kosong = pakai bawaan).
function mergePsbContent(base: PsbContent, over: Record<string, string>): PsbContent {
  const lines = (over['psb_page_requirements'] || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const waves = base.schedule.waves.map((w, i) => {
    const label = w.label.toLowerCase();
    let text = w.date_text;
    if (label.includes('ikhwan') && !label.includes('akhwat') && over['psb_page_quota_ikhwan']) {
      text = over['psb_page_quota_ikhwan'];
    } else if (label.includes('akhwat') && over['psb_page_quota_akhwat']) {
      text = over['psb_page_quota_akhwat'];
    } else if ((label.includes('biaya') || label.includes('formulir')) && over['psb_page_fee']) {
      text = over['psb_page_fee'];
    } else if (i === 0 && over['psb_page_quota_ikhwan'] && !label.includes('akhwat')) {
      text = over['psb_page_quota_ikhwan'];
    } else if (i === 1 && over['psb_page_quota_akhwat']) {
      text = over['psb_page_quota_akhwat'];
    } else if (i === 2 && over['psb_page_fee']) {
      text = over['psb_page_fee'];
    }
    return { ...w, date_text: text };
  });
  return {
    ...base,
    hero: {
      ...base.hero,
      title: over['psb_page_hero_title'] || base.hero.title,
      subtitle: over['psb_page_hero_subtitle'] || base.hero.subtitle,
    },
    requirements: {
      ...base.requirements,
      items: lines.length > 0 ? lines : base.requirements.items,
    },
    schedule: { ...base.schedule, waves },
    location: {
      ...base.location,
      address_text: over['psb_page_address'] || base.location.address_text,
    },
    cta: {
      ...base.cta,
      secondary_button: {
        ...base.cta.secondary_button,
        url: over['psb_page_wa'] || base.cta.secondary_button.url,
      },
    },
  };
}

export function PsbPageContent() {
  const base = useWebsiteBuilderPageContent('psb', defaultPageContent.psb);
  const [over, setOver] = useState<Record<string, string>>({});
  useEffect(() => {
    getPublicSettingsMap()
      .then((m) => {
        const picked: Record<string, string> = {};
        for (const k of PSB_PAGE_KEYS) {
          if (m[k]) picked[k] = m[k];
        }
        setOver(picked);
      })
      .catch(() => {});
  }, []);
  const pageContent = useMemo(() => mergePsbContent(base, over), [base, over]);
  const [mapInteractive, setMapInteractive] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden border-b border-sky-900/80 bg-slate-950 py-24 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${pageContent.hero.background_image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-sky-950/78" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sky-100">
            <Sparkles size={14} />
            {pageContent.hero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            {pageContent.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-50/90">
            {pageContent.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fbfcfa_0%,#f4f7f3_100%)] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/70 bg-white/92 p-8 shadow-[0_22px_50px_-35px_rgba(250,204,21,0.18)] backdrop-blur-sm">
              <div className="absolute -right-8 -top-8 rounded-full bg-sky-50 p-6 opacity-80">
                <FileText size={84} className="text-sky-200" />
              </div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                {pageContent.requirements.eyebrow}
              </p>
              <h2 className="mb-8 flex items-center gap-4 text-3xl font-black tracking-tight text-slate-900">
                <ClipboardCheck className="text-sky-600" /> {pageContent.requirements.title}
              </h2>
              <ul className="relative z-10 space-y-4">
                {pageContent.requirements.items.map((req, index) => (
                  <li
                    key={`${index}-${req}`}
                    className="flex items-center gap-4 rounded-[1.35rem] border border-slate-100 bg-[#fbfcfb] p-4 shadow-sm"
                  >
                    <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="font-medium text-slate-700">{req}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2.3rem] border border-sky-100 bg-sky-50 p-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                  {pageContent.schedule.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-sky-950">
                  <Calendar className="text-sky-600" /> {pageContent.schedule.title}
                </h2>
                <div className="space-y-4">
                  {pageContent.schedule.waves.map((wave) => (
                    <div
                      key={`${wave.label}-${wave.date_text}`}
                      className={`rounded-[1.4rem] p-5 ${
                        wave.active
                          ? 'border border-sky-100 bg-white shadow-sm'
                          : 'border border-dashed border-sky-200 bg-white/50'
                      }`}
                    >
                      <p
                        className={`mb-1 text-xs font-black uppercase tracking-widest ${
                          wave.active ? 'text-sky-600' : 'text-slate-400'
                        }`}
                      >
                        {wave.label}
                      </p>
                      <p className={`text-lg font-bold ${wave.active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {wave.date_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.3rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                  {pageContent.location.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-slate-900">
                  <MapPin className="text-sky-600" /> {pageContent.location.title}
                </h2>
                <p className="mb-4 font-medium text-slate-700">{pageContent.location.address_text}</p>
                <div className="relative h-56 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm">
                  <iframe
                    src="https://www.google.com/maps?q=Pondok+Pesantren+Tahfidzul+Qur%27an+Al-Maa+Parung&t=&z=17&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, pointerEvents: mapInteractive ? 'auto' : 'none' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Peta ${pageContent.location.title}`}
                  />
                  {!mapInteractive ? (
                    <button
                      type="button"
                      onClick={() => setMapInteractive(true)}
                      className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-slate-50/40 backdrop-blur-[1px]"
                      aria-label="Aktifkan peta"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-sky-600 hover:text-white">
                        <MapPin size={15} /> Ketuk untuk melihat peta
                      </span>
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pageContent.location.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#fbfcfa] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">Tahapan Pendaftaran</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Alur PSB Santri Baru</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Semua proses dipantau lewat Portal Wali Santri. Setiap perubahan status disertai pemberitahuan otomatis ke WhatsApp.
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-3">
            {[
              { step: '01', title: 'Buat Akun & Lengkapi Berkas', text: 'Registrasi akun portal, isi biodata santri & orang tua, lalu unggah KK, ijazah/raport, dan pas foto.' },
              { step: '02', title: 'Bayar Biaya Pendaftaran', text: 'Kirim bukti transfer biaya pendaftaran melalui portal dan tunggu verifikasi panitia.' },
              { step: '03', title: 'Review Berkas', text: 'Panitia memeriksa kelengkapan dan keabsahan biodata serta dokumen yang dikirim.' },
              { step: '04', title: 'Tes Seleksi', text: 'Calon santri diundang mengikuti tes seleksi di jadwal dan lokasi yang diinformasikan lewat portal & WA.' },
              { step: '05', title: 'Pengumuman', text: 'Hasil seleksi diumumkan lewat portal. Cek kelulusan dengan nomor pendaftaran di halaman Pengumuman.' },
              { step: '06', title: 'Daftar Ulang', text: 'Wali menyelesaikan daftar ulang sebelum batas waktu agar status santri aktif terekam.' },
            ].map((s) => (
              <li key={s.step} className="group rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 font-black text-white">
                  {s.step}
                </span>
                <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
                  <ListChecks size={18} className="text-sky-600" />
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-8 rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-50/60 p-8 md:grid-cols-2 md:p-12">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">Pengumuman Kelulusan</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Cek hasil seleksi secara online</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Punya nomor pendaftaran (contoh: PSB-0001)? Masukkan nomor tersebut di halaman Pengumuman untuk melihat status
                kelulusan calon santri. Tidak perlu login, cukup nomor pendaftaran.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-end">
              <Link
                href="/psb/status"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-sky-600/20 transition-all hover:-translate-y-0.5 hover:bg-sky-700"
              >
                <Search size={17} /> Cek Pengumuman
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">Tanya Jawab</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Pertanyaan yang Sering Diajukan</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: 'Berapa biaya pendaftaran PSB?', a: 'Biaya pendaftaran saat ini bisa dilihat pada bagian jadwal & kuota di atas. Kirim bukti transfer melalui portal, lalu panitia akan memverifikasi.' },
                { q: 'Bagaimana cara mengetahui jadwal tes seleksi?', a: 'Setelah berkas lolos review, status di portal berubah menjadi "Tes Seleksi". Jadwal, lokasi, dan catatan tes tampil di dashboard portal dan juga dikirim otomatis ke WhatsApp wali.' },
                { q: 'Berapa lama proses seleksinya?', a: 'Setelah tes seleksi, hasil diumumkan melalui halaman Pengumuman dan portal. Wali akan menerima notifikasi WA begitu status diubah panitia.' },
                { q: 'Bagaimana jika melewati batas waktu daftar ulang?', a: 'Segera hubungi panitia. Daftar ulang harus diselesaikan sebelum batas waktu yang diumumkan agar status santri aktif bisa dikonfirmasi.' },
                { q: 'Apakah bukti transfer wajib diunggah?', a: 'Ya. Panitia hanya memverifikasi biaya pendaftaran setelah bukti transfer dikirim lewat portal agar pencatatan pembayaran rapi.' },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm open:border-sky-200 open:bg-sky-50/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black tracking-tight text-slate-900">
                    <span className="flex items-center gap-3">
                      <HelpCircle size={18} className="shrink-0 text-sky-600" />
                      {faq.q}
                    </span>
                    <span className="text-sky-600 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 pl-9 text-sm leading-7 text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-800 bg-gradient-to-br from-sky-800 to-sky-950 py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
            {pageContent.cta.eyebrow}
          </p>
          <h2 className="mb-5 mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            {pageContent.cta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-8 text-sky-50/88">
            {pageContent.cta.subtitle}
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Link
              href={
                pageContent.cta.primary_button.url &&
                !pageContent.cta.primary_button.url.includes('wa.me') &&
                pageContent.cta.primary_button.url !== ''
                  ? pageContent.cta.primary_button.url
                  : '/portal/biodata'
              }
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-black text-sky-900 shadow-xl shadow-white/10 transition-all hover:-translate-y-1 hover:bg-sky-50"
            >
              {pageContent.cta.primary_button.label &&
              !pageContent.cta.primary_button.label.toLowerCase().includes('panitia')
                ? pageContent.cta.primary_button.label
                : 'Daftar Online Sekarang'}{' '}
              <ArrowRight size={18} />
            </Link>
            <a
              href={pageContent.cta.secondary_button.url || 'https://wa.me/6287784423282'}
              target={pageContent.cta.secondary_button.url?.includes('wa.me') ? '_blank' : undefined}
              rel={pageContent.cta.secondary_button.url?.includes('wa.me') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-7 py-4 text-base font-black text-white transition-all hover:bg-white hover:text-sky-900"
            >
              <MessageCircle size={18} />
              {pageContent.cta.secondary_button.label || 'Hubungi Panitia'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default function PSBPage() {
  return (
    <PublicLayout>
      <PsbPageContent />
    </PublicLayout>
  );
}
