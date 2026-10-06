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
      <section className="lte-card">
        <div className="lte-card-body">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="lte-badge lte-badge-soft-primary">
                <BookOpen className="h-3.5 w-3.5" />
                Panduan Portal
              </span>
              <h1 className="lte-page-title mt-4">Bantuan Pendaftaran PSB</h1>
              <p className="lte-page-subtitle mt-2 max-w-xl text-sm leading-6 sm:text-base">
                Panduan singkat untuk melengkapi biodata, mengunggah dokumen, dan memantau status pendaftaran.
              </p>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="lte-card-subtitle">Panduan Aktif</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{portalDocSections.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="lte-card">
            <div className="lte-card-body">
              <label className="lte-form-label">Cari Panduan</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kata kunci..."
                className="lte-form-control w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="lte-card">
            <div className="lte-card-header justify-start">
              <div className="flex items-center gap-2">
                <LayoutList className="h-4 w-4 text-blue-600" />
                <h4 className="lte-card-title">Daftar Panduan</h4>
              </div>
            </div>

            <div className="lte-card-body">
              <div className="lte-list-group">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedTab(section.id)}
                    className={`lte-list-group-item w-full text-left ${activeTab === section.id ? 'active' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{section.title}</p>
                      <p className={`mt-1 text-xs leading-5 ${activeTab === section.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {section.summary}
                      </p>
                    </div>
                  </button>
                ))}

                {filteredSections.length === 0 && (
                  <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Tidak ada panduan yang cocok dengan pencarian ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-8 min-w-0">
          <section className="lte-card">
            <div className="lte-card-body">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <span className="lte-badge lte-badge-soft-primary">
                    <CircleHelp className="h-3.5 w-3.5" />
                    Panduan
                  </span>
                  <h2 className="lte-page-title mt-4">{currentSection.title}</h2>
                  <p className="lte-page-subtitle mt-2 max-w-3xl text-sm leading-6 sm:text-base">{currentSection.summary}</p>
                </div>

                <Link
                  href={`${currentSection.href}?from=docs`}
                  className="lte-btn lte-btn-dark shrink-0"
                >
                  Buka Halaman
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="lte-card">
              <div className="lte-card-header justify-start">
                <h3 className="lte-card-title">Yang Bisa Dilakukan</h3>
              </div>
              <div className="lte-card-body">
                <div className="lte-list-group">
                  {currentSection.quickActions.map((item) => (
                    <div key={item} className="lte-list-group-item items-start text-sm leading-6 text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lte-card">
              <div className="lte-card-header justify-start">
                <h3 className="lte-card-title">Tips Singkat</h3>
              </div>
              <div className="lte-card-body">
                <div className="space-y-3">
                  {currentSection.tips.map((item) => (
                    <div key={item} className="lte-alert lte-alert-primary px-4 py-3 text-sm leading-6">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="lte-card">
            <div className="lte-card-header justify-start">
              <h3 className="lte-card-title">Langkah Kerja</h3>
            </div>
            <div className="lte-card-body space-y-5">
              {currentSection.workflows.map((workflow) => (
                <div key={workflow.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h4 className="lte-card-title">{workflow.title}</h4>
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

          <section className="rounded-lg bg-slate-900 p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold">Panduan Selanjutnya</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Jika seluruh data dan dokumen sudah lengkap, pantau status di dashboard portal sampai panitia PSB
              memberikan keputusan.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/portal"
                className="lte-btn lte-btn-light"
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