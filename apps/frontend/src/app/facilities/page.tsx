'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getFacilities, Facility, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { ArrowRight, Building2, CheckCircle2, MapPin, Sparkles } from 'lucide-react';

const fallbackFacilities = [
  { name: 'Masjid', category: 'Ibadah & Pembinaan' },
  { name: 'Ruang Kelas', category: 'Akademik' },
  { name: 'Asrama', category: 'Hunian Santri' },
  { name: 'Toilet dan Kamar Mandi', category: 'Hunian Santri' },
  { name: 'Kantin', category: 'Layanan Harian' },
  { name: 'Lapangan Olahraga', category: 'Olahraga' },
  { name: 'Lapangan Futsal', category: 'Olahraga' },
  { name: 'Laboratorium Komputer', category: 'Akademik' },
  { name: 'Perpustakaan', category: 'Akademik' },
  { name: 'Ruang Praktik Tata Boga, Otomotif & Listrik', category: 'Life Skill' },
  { name: 'Taman Menghafal', category: 'Ibadah & Pembinaan' },
];

const facilityHighlights = [
  { value: '11', label: 'Fasilitas Utama' },
  { value: 'Belajar', label: 'Ruang Pembinaan' },
  { value: 'Asrama', label: 'Kehidupan Santri' },
];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const data = await getFacilities();
        setFacilities(data);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  const mergedFacilities = useMemo(() => {
    if (facilities.length > 0) {
      return facilities.map((facility) => ({
        id: String(facility.id),
        name: facility.name,
        category: facility.category || 'Lainnya',
        description: facility.description || 'Fasilitas pendukung pembinaan dan kenyamanan santri.',
        imageUrl: resolveDisplayImageUrl(facility.image_url),
      }));
    }

    return fallbackFacilities.map((facility, index) => ({
      id: `fallback-${index}`,
      name: facility.name,
      category: facility.category,
      description: 'Fasilitas pendukung pembinaan, akademik, ibadah, dan kenyamanan santri sehari-hari.',
      imageUrl: '',
    }));
  }, [facilities]);

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(mergedFacilities.map((facility) => facility.category)))],
    [mergedFacilities]
  );

  const filteredFacilities =
    activeCategory === 'Semua'
      ? mergedFacilities
      : mergedFacilities.filter((facility) => facility.category === activeCategory);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/80 bg-slate-950 py-24 text-white lg:py-28">
        <div className="absolute inset-0 bg-[url('/assets/img/gedung.webp')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/70" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                <Sparkles size={14} />
                Fasilitas Pondok
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                Lingkungan belajar yang mendukung ibadah, akademik, keterampilan, dan kenyamanan santri.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
                Kenali sarana pondok yang mendukung ibadah, belajar, keterampilan, dan kenyamanan
                santri dalam keseharian di Darussunnah.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {facilityHighlights.map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_42px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/82">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[4.25rem] z-40 border-b border-slate-200 bg-white/95 py-4 backdrop-blur-md md:top-20 md:py-5">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.22em] whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fbfcfa_0%,#f5f7f3_100%)] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="h-[340px] rounded-[2.5rem] bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : filteredFacilities.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredFacilities.map((facility) => (
                <div
                  key={facility.id}
                  className="group overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/92 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-200"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-50">
                    {facility.imageUrl ? (
                      <Image
                        src={facility.imageUrl}
                        alt={facility.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-emerald-300">
                        <Building2 size={54} className="mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-500">
                          Fasilitas Pondok
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/8 to-transparent" />
                  </div>
                    <div className="p-7">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                        {facility.category}
                      </span>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{facility.name}</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">{facility.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center">
              <Building2 className="mx-auto mb-5 text-slate-300" size={46} />
              <p className="text-sm font-bold text-slate-500">Informasi fasilitas belum tersedia.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f7f8f4] py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Lingkungan Pondok</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Suasana yang mendukung fokus belajar dan pembiasaan hidup tertib.
            </h2>
            <div className="mt-6 flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <MapPin size={18} />
              </div>
              <p className="text-sm leading-7 text-slate-600">
                Kampus Darussunnah berada di lingkungan yang mendukung pembinaan santri secara lebih
                tenang, terarah, dan konsisten dalam ritme ibadah serta belajar.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Fasilitas Inti</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {fallbackFacilities.slice(0, 6).map((facility) => (
                <div key={facility.name} className="flex gap-3 rounded-[1.5rem] border border-white bg-white p-4 shadow-sm">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-sm font-semibold leading-7 text-slate-700">{facility.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Selanjutnya</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Lanjutkan melihat program pondok atau informasi pendaftaran
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/program"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            >
              Lihat halaman program <ArrowRight size={16} />
            </Link>
            <Link
              href="/psb"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
            >
              Buka info PSB <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
