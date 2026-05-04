'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, CircleHelp, ExternalLink, LayoutList } from 'lucide-react';
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
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <BookOpen className="h-3.5 w-3.5" />
              Panduan Portal
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Bantuan Pendaftaran PSB
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Panduan singkat untuk melengkapi biodata, mengunggah dokumen, dan memantau status pendaftaran.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Panduan Aktif</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{portalDocSections.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cari Panduan
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kata kunci..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LayoutList className="h-4 w-4 text-blue-600" />
              Daftar Panduan
            </div>

            <div className="space-y-2">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                        onClick={() => setSelectedTab(section.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    activeTab === section.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className={`mt-1 text-xs leading-5 ${activeTab === section.id ? 'text-blue-100' : 'text-slate-500'}`}>
                    {section.summary}
                  </p>
                </button>
              ))}

              {filteredSections.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Tidak ada panduan yang cocok dengan pencarian ini.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-8 min-w-0">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buka Halaman
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Yang Bisa Dilakukan</h3>
              <div className="mt-4 space-y-3">
                {currentSection.quickActions.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Tips Singkat</h3>
              <div className="mt-4 space-y-3">
                {currentSection.tips.map((item) => (
                  <div key={item} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Langkah Kerja</h3>
            <div className="mt-5 space-y-5">
              {currentSection.workflows.map((workflow) => (
                <div key={workflow.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-base font-bold text-slate-900">{workflow.title}</h4>
                  <div className="mt-4 space-y-3">
                    {workflow.steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="pt-0.5 text-sm leading-6 text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold">Panduan Selanjutnya</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Jika seluruh data dan dokumen sudah lengkap, pantau status di dashboard portal sampai panitia PSB
              memberikan keputusan.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Kembali ke Dashboard
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        }
      >
        <PortalHelpContent />
      </Suspense>
    </div>
  );
}
