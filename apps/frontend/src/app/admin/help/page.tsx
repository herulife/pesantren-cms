'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, CircleHelp, ExternalLink, LayoutList, ShieldCheck } from 'lucide-react';
import { adminDocSections, getAdminDocById, roleAccessMatrix } from '@/lib/adminDocs';

function HelpContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(adminDocSections[0].id);

  useEffect(() => {
    const current = getAdminDocById(ref);
    setActiveTab(current.id);
  }, [ref]);

  const filteredSections = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return adminDocSections;
    }

    return adminDocSections.filter((section) => {
      const haystack = [
        section.title,
        section.category,
        section.summary,
        ...section.audience,
        ...section.quickActions,
        ...section.workflows.flatMap((workflow) => [workflow.title, ...workflow.steps]),
        ...section.tips,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [query]);

  const groupedSections = useMemo(() => {
    return filteredSections.reduce<Record<string, typeof adminDocSections>>((acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = [];
      }

      acc[section.category].push(section);
      return acc;
    }, {});
  }, [filteredSections]);

  const currentSection = getAdminDocById(activeTab);

  useEffect(() => {
    const visible = filteredSections.some((section) => section.id === currentSection.id);
    if (!visible && filteredSections.length > 0) {
      setActiveTab(filteredSections[0].id);
    }
  }, [currentSection.id, filteredSections]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <BookOpen className="h-3.5 w-3.5" />
              Dokumentasi Admin
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Pusat Bantuan Darussunnah
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Semua panduan operasional admin sekarang dikumpulkan di satu tempat. Tiap modul punya
              ringkasan fungsi, langkah kerja cepat, tips operasional, dan tautan langsung ke halaman
              modulnya.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modul Terdokumentasi</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{adminDocSections.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role Utama</p>
              <p className="mt-2 text-2xl font-black text-slate-900">5</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Akses Kontekstual</p>
              <p className="mt-2 text-2xl font-black text-slate-900">Aktif</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cari Panduan
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari modul atau kata kunci..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LayoutList className="h-4 w-4 text-emerald-600" />
              Daftar Dokumentasi
            </div>

            <div className="space-y-4">
              {Object.entries(groupedSections).map(([category, sections]) => (
                <div key={category}>
                  <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {category}
                  </p>
                  <div className="space-y-1.5">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full rounded-xl px-4 py-3 text-left transition ${
                          activeTab === section.id
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-sm font-semibold">{section.title}</p>
                        <p className={`mt-1 text-xs leading-5 ${activeTab === section.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {section.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Tidak ada modul yang cocok dengan pencarian ini.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-8 min-w-0">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <CircleHelp className="h-3.5 w-3.5" />
                  {currentSection.category}
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                  {currentSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{currentSection.summary}</p>
              </div>

              <Link
                href={`${currentSection.href}?from=docs`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buka Halaman Modul
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {currentSection.audience.map((audience) => (
                <span
                  key={audience}
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {audience}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Yang Bisa Dilakukan</h3>
              <div className="mt-4 space-y-3">
                {currentSection.quickActions.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Tips Operasional</h3>
              <div className="mt-4 space-y-3">
                {currentSection.tips.map((item) => (
                  <div key={item} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Langkah Kerja</h3>
            <div className="mt-5 space-y-5">
              {currentSection.workflows.map((workflow) => (
                <div key={workflow.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-base font-bold text-slate-900">{workflow.title}</h4>
                  <div className="mt-4 space-y-3">
                    {workflow.steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
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

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Matriks Role & Akses</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ringkasan ini membantu tim memahami siapa yang berhak mengakses modul tertentu.
            </p>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3">Modul</th>
                    <th className="px-4 py-3">Superadmin</th>
                    <th className="px-4 py-3">Tim Media</th>
                    <th className="px-4 py-3">Bendahara</th>
                    <th className="px-4 py-3">Panitia PSB</th>
                    <th className="px-4 py-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roleAccessMatrix.map((row) => (
                    <tr key={row.module} className="align-top">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.module}</td>
                      <td className="px-4 py-3 text-slate-600">{row.superadmin}</td>
                      <td className="px-4 py-3 text-slate-600">{row.tim_media}</td>
                      <td className="px-4 py-3 text-slate-600">{row.bendahara}</td>
                      <td className="px-4 py-3 text-slate-600">{row.panitia_psb}</td>
                      <td className="px-4 py-3 text-slate-600">{row.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold">Pola Bantuan Kontekstual</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Tiap menu di sidebar sekarang punya ikon bantuan kecil yang langsung membuka dokumentasi modul terkait.
              Jadi tim tidak perlu kembali ke halaman bantuan utama setiap kali bingung dengan satu fitur tertentu.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl pb-10 animate-fade-in">
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
          </div>
        }
      >
        <HelpContent />
      </Suspense>
    </div>
  );
}
