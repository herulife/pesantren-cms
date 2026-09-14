'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Check, CircleHelp, ExternalLink, LayoutList } from 'lucide-react';
import { getPortalDocById, portalDocSections } from '@/lib/portalDocs';

function PortalHelpContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [query, setQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(portalDocSections[0].id);

  const filteredSections = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return portalDocSections;
    }

    return portalDocSections.filter((section) => {
      const haystack = [
        section.title,
        section.summary,
        ...section.quickActions,
        ...section.workflows.flatMap((workflow) => [workflow.title, ...workflow.steps]),
        ...section.tips,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [query]);

  const requestedTab = getPortalDocById(ref).id;
  const resolvedTab = ref ? requestedTab : selectedTab;
  const activeTab = filteredSections.some((section) => section.id === resolvedTab)
    ? resolvedTab
    : (filteredSections[0]?.id ?? requestedTab);
  const currentSection = getPortalDocById(activeTab);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <BookOpen className="h-3.5 w-3.5" />
              Panduan Wali
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Cara Daftar & Pantau Anak, Langkah Demi Langkah
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Pilih kebutuhan di kiri, lalu ikuti nomor 1, 2, 3. Bahasanya sederhana, diikuti pelan-pelan pasti bisa.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Jumlah Panduan</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{portalDocSections.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Cocok Untuk</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">Pemula</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cari: butuh apa?
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: upload KK, lihat nilai..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LayoutList className="h-4 w-4 text-sky-600" />
              Pilih kebutuhan
            </div>

            <div className="space-y-2">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                        onClick={() => setSelectedTab(section.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    activeTab === section.id
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className={`mt-1 text-xs leading-5 ${activeTab === section.id ? 'text-sky-100' : 'text-slate-500'}`}>
                    {section.summary}
                  </p>
                </button>
              ))}

              {filteredSections.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Tidak ketemu. Coba kata lain, contoh: daftar, foto, nilai.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-8 min-w-0">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  <CircleHelp className="h-3.5 w-3.5" />
                  Panduan
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                  {currentSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{currentSection.summary}</p>
              </div>

              <Link
                href={`${currentSection.href}?from=docs`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Buka Halamannya
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Di halaman ini bisa apa?</h3>
              <div className="mt-4 space-y-3">
                {currentSection.quickActions.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900">Tips biar lancar</h3>
              <div className="mt-4 space-y-3">
                {currentSection.tips.map((item) => (
                  <div key={item} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Langkah-langkah (ikuti nomornya)</h3>
            <div className="mt-5 space-y-5">
              {currentSection.workflows.map((workflow) => (
                <div key={workflow.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-base font-bold text-slate-900">{workflow.title}</h4>
                  <div className="mt-4 space-y-3">
                    {workflow.steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white">
                          {index + 1}
                        </div>
                        <p className="pt-1 text-sm leading-6 text-slate-700 sm:text-base">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold">Kalau sudah selesai semua</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Pantau halaman depan portal. Tunggu kabar dari panitia PSB lewat WA atau status di sini.
              Jangan daftar dua kali, cukup satu saja.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Kembali ke Halaman Depan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default function PortalHelpPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 animate-fade-in">
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
          </div>
        }
      >
        <PortalHelpContent />
      </Suspense>
    </div>
  );
}
