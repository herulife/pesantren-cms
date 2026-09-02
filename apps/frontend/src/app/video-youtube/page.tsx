'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';

const videos = [
  {
    id: 'GQMM16T780w',
    title: 'Hilmi dan Lukman — Halaqoh Mubtadi Ikhwan',
    description:
      'Momen muhadatsah (percakapan bahasa Arab) pertama Hilmi dan Lukman di halaqoh mubtadi ikhwan. Para santri baru mulai terbiasa berinteraksi menggunakan bahasa Arab dalam kegiatan sehari-hari di Pondok Pesantren Al Maa Parung.',
    category: 'Muhadatsah',
  },
  {
    id: 'jUna_1RwEAc',
    title: 'Afifah & Nazia — Praktik Muhadatsah',
    description:
      'Praktik muhadatsah pertama Afifah dan Nazia di halaqoh mubtadi. Kegiatan ini merupakan bagian dari pembiasaan percakapan bahasa Arab bagi santriwati pemula di pondok.',
    category: 'Muhadatsah',
  },
  {
    id: 'NVaA5mXmF1o',
    title: 'Hani dan Ayla — Percakapan Bahasa Arab Pertama',
    description:
      'Percakapan pertama Hani dan Ayla dalam bahasa Arab di Pondok Pesantren Al Maa Parung Bogor. Momen ini menunjukkan progres awal santri dalam menguasai kosa kata dan percakapan sehari-hari.',
    category: 'Muhadatsah',
  },
  {
    id: 'UsDflCHNobQ',
    title: 'Kegiatan Santri — 12 Oktober 2025',
    description:
      'Dokumentasi kegiatan santri Pondok Pesantren Al Maa Parung pada tanggal 12 Oktober 2025. Menampilkan aktivitas harian santri di asrama dan area pondok.',
    category: 'Dokumentasi',
  },
  {
    id: 'ir5_y90-3zg',
    title: 'Halaqoh Al-Qur\'an — 14 Oktober 2024',
    description:
      'Halaqoh Al-Qur\'an santri Pondok Pesantren Al Maa Parung Bogor, 14 Oktober 2024. Kegiatan mengaji rutin yang menjadi bagian utama program tahfidzul qur\'an di pondok.',
    category: 'Tahfidz',
  },
  {
    id: 'e1n6WQB65YY',
    title: 'Rihlah Pasca PTS — Santri Ikhwan',
    description:
      'Rihlah (perjalanan rekreasi edukatif) santri ikhwan pasca ujian tengah semester. Kegiatan ini memberikan refreshing sekaligus membangun kebersamaan antar santri.',
    category: 'Kegiatan',
  },
  {
    id: 'B6DwnzGSjQ0',
    title: 'KBM Diniyah — 11 Oktober 2024',
    description:
      'Kegiatan Belajar Mengajar (KBM) diniyah santri Pondok Pesantren Al Maa Parung, 11 Oktober 2024. Pembelajaran ilmu-ilmu keislaman yang menjadi kurikulum utama pondok.',
    category: 'KBM Diniyah',
  },
  {
    id: '0hrOnBd70YI',
    title: 'KBM Diniyah — 10 Oktober 2024',
    description:
      'Dokumentasi KBM diniyah santri Pondok Pesantren Al Maa Parung pada 10 Oktober 2024. Aktivitas belajar mengajar ilmu agama berjalan rutin setiap harinya.',
    category: 'KBM Diniyah',
  },
  {
    id: 'U64jWJDeCJg',
    title: 'Tempe El Maa — Produk Unggulan Pondok',
    description:
      'Tempe El Maa merupakan produk olahan tempe unggulan dari Pondok Pesantren Al Maa Parung Bogor. Video ini menampilkan proses pembuatan tempe yang dikelola oleh santri sebagai bagian dari program kemandirian pondok.',
    category: 'Kemandirian',
  },
  {
    id: 'Bp3sVJxbUiM',
    title: 'Tasmi Bil Ghaib 5 Juz — Rahmah Hufaidah',
    description:
      'Tasmi bil ghaib (uji hafalan tanpa teks) 5 Juz (26-30) oleh Rahmah Hufaidah. Pencapaian menghafal Al-Qur\'an yang luar biasa dari santriwati Pondok Pesantren Al Maa Parung.',
    category: 'Tahfidz',
  },
  {
    id: 'rroEGJrM9HA',
    title: 'Kajian Malam Senin — Ust. Mu\'adhom Mu\'zafarudin',
    description:
      'Kajian malam Senin bersama Ust. Mu\'adhom Mu\'zafarudin di Pondok Pesantren Al Maa Parung Bogor. Kajian rutin yang mengupas berbagai tema keislaman untuk para santri dan jamaah.',
    category: 'Kajian',
  },
  {
    id: 'Ulzo09ifS_0',
    title: 'Kisah 3 Anak Nakal Yang Ingin Berubah',
    description:
      'Kisah inspiratif tentang tiga anak nakal yang ingin berubah menjadi lebih baik. Kajian yang disampaikan di pondok sebagai pengajaran dan motivasi bagi para santri.',
    category: 'Kajian',
  },
  {
    id: 'jP-R6iaRvtw',
    title: 'Daily Vlog Santri Al Maa — Kelas Kreatif',
    description:
      'Vlog harian santri Pondok Pesantren Al Maa Parung yang menampilkan kegiatan kelas kreatif. Para santri belajar berbagai keterampilan selain ilmu diniyah.',
    category: 'Kegiatan',
  },
  {
    id: 'GR3ywBilY1c',
    title: 'H-1 HUT RI Ke-79 — Nusantara Baru Indonesia Maju',
    description:
      'Dokumentasi kegiatan H-1 Hari Ulang Tahun Republik Indonesia ke-79 di Pondok Pesantren Al Maa Parung. Semangat nasionalisme para santri dalam menyambut hari kemerdekaan.',
    category: 'Dokumentasi',
  },
  {
    id: 'Sfk9RyIj00g',
    title: 'KBM Diniyah — 12 Agustus 2024',
    description:
      'Kegiatan Belajar Mengajar diniyah santri Pondok Pesantren Al Maa Parung pada 12 Agustus 2024. Suasana kelas yang khidmat dalam mempelajari ilmu-ilmu keislaman.',
    category: 'KBM Diniyah',
  },
];

const categories = ['Semua', ...Array.from(new Set(videos.map((v) => v.category)))];

export default function VideoYouTubePage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filtered =
    selectedCategory === 'Semua'
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sky-900/40 bg-gradient-to-br from-[#032144] via-[#0a3a6b] to-[#0e4d8f] py-20 text-white lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-yellow-400 blur-[120px]" />
          <div className="absolute -bottom-10 -left-20 h-60 w-60 rounded-full bg-sky-300 blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto max-w-6xl px-4 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-yellow-300">Almaa TV</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Video Kegiatan <span className="text-yellow-400">Al Maa</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-sky-100/80 sm:text-base">
            Kumpulan video kegiatan, kajian, halaqoh Al-Qur&apos;an, dan momen berharga
            Pondok Pesantren Al Maa Parung Bogor dari channel AlmaaTV.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="border-b border-slate-200 bg-white py-5">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="bg-[#f6f4ee] py-12 lg:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((video) => (
              <div
                key={video.id}
                className="group overflow-hidden rounded-[1.4rem] border border-white/70 bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_20px_50px_-15px_rgba(14,165,233,0.15)]"
              >
                {/* Thumbnail / Embed */}
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  {activeVideo === video.id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      <button
                        onClick={() => setActiveVideo(video.id)}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-yellow-400/90 group-hover:text-slate-900">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="ml-1 h-6 w-6"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </button>
                      <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900">
                        {video.category}
                      </span>
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h2 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2">
                    {video.title}
                  </h2>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-500 line-clamp-3">
                    {video.description}
                  </p>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-yellow-500"
                  >
                    Tonton di YouTube
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-14">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900">
            Subscribe <span className="text-sky-600">AlmaaTV</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
            Dapatkan notifikasi video terbaru dari Pondok Pesantren Al Maa Parung Bogor.
          </p>
          <a
            href="https://www.youtube.com/@AlmaaTV1"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Subscribe AlmaaTV
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
