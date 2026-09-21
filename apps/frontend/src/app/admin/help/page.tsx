'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Check, CircleHelp, ExternalLink, LayoutList, X } from 'lucide-react';
import { adminDocSections, getAdminDocById, roleAccessMatrix } from '@/lib/adminDocs';

function AccessBadge({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      <Check className="h-3.5 w-3.5" /> Boleh
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
      <X className="h-3.5 w-3.5" /> Tidak
    </span>
  );
}

function HelpContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [query, setQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(adminDocSections[0].id);

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

  const requestedTab = getAdminDocById(ref).id;
  const activeTab = filteredSections.some((section) => section.id === (ref ? requestedTab : selectedTab))
    ? (ref ? requestedTab : selectedTab)
    : (filteredSections[0]?.id ?? requestedTab);
  const currentSection = getAdminDocById(activeTab);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <BookOpen className="h-3.5 w-3.5" />
              Panduan Admin
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Cara Pakai Sistem, Klik-Klik Pasti Bisa
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Bingung mau ngapain? Pilih salah satu di daftar kiri, lalu ikuti langkah nomor 1, 2, 3.
              Bahasanya dibuat sederhana supaya yang baru pertama kali pegang pun paham.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Jumlah Panduan</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{adminDocSections.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Cocok Untuk</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">Pemula</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cari: mau ngapain?
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: tambah berita, cek bayar, upload foto..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <LayoutList className="h-4 w-4 text-sky-600" />
              Pilih mau ngapain
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
                        onClick={() => setSelectedTab(section.id)}
                        className={`w-full rounded-xl px-4 py-3 text-left transition ${
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
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Tidak ketemu. Coba kata lain, contoh: berita, foto, bayar, nilai.
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-8 min-w-0">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  <CircleHelp className="h-3.5 w-3.5" />
                  {currentSection.category}
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                  {currentSection.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{currentSection.summary}</p>
                {currentSection.image && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">
                      Tampilan asli halamannya
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <Image
                        src={currentSection.image.src}
                        alt={currentSection.image.alt}
                        width={1440}
                        height={1600}
                        unoptimized
                        className="h-auto w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`${currentSection.href}?from=docs`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Buka Halamannya
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cocok untuk
              </p>
              <div className="flex flex-wrap gap-2">
                {currentSection.audience.map((audience) => (
                  <span
                    key={audience}
                    className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                  >
                    {audience}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Di menu ini bisa apa saja?</h3>
              <div className="mt-4 space-y-3">
                {currentSection.quickActions.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900">Tips biar tidak salah</h3>
              <div className="mt-4 space-y-3">
                {currentSection.tips.map((item) => (
                  <div key={item} className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Langkah-langkah (ikuti nomornya)</h3>
            <div className="mt-5 space-y-5">
              {currentSection.workflows.map((workflow) => (
                <div key={workflow.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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

          {currentSection.visualSteps && currentSection.visualSteps.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Contoh gambar tiap langkah</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Lihat gambar di bawah sambil mengikuti langkahnya satu-satu.
              </p>
              <div className="mt-6 space-y-8">
                {currentSection.visualSteps.map((step, index) => (
                  <article key={step.title} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">
                        Gambar {index + 1}
                      </p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">{step.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <Image
                        src={step.image}
                        alt={step.alt}
                        width={1440}
                        height={1600}
                        unoptimized
                        className="h-auto w-full"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Siapa boleh buka apa</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tandanya gampang: <span className="font-bold text-emerald-700">Boleh</span> artinya bisa dibuka,
              <span className="font-bold text-slate-400"> Tidak</span> artinya tidak bisa dibuka.
            </p>

            <div className="ap-table-wrap mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3">Menu</th>
                    <th className="px-4 py-3">Pimpinan</th>
                    <th className="px-4 py-3">Tim Media</th>
                    <th className="px-4 py-3">Bendahara</th>
                    <th className="px-4 py-3">Panitia PSB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roleAccessMatrix.map((row) => (
                    <tr key={row.module} className="align-top">
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.module}</td>
                      <td className="px-4 py-3"><AccessBadge allowed={row.superadmin === 'Ya'} /></td>
                      <td className="px-4 py-3"><AccessBadge allowed={row.tim_media === 'Ya'} /></td>
                      <td className="px-4 py-3"><AccessBadge allowed={row.bendahara === 'Ya'} /></td>
                      <td className="px-4 py-3"><AccessBadge allowed={row.panitia_psb === 'Ya'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <h3 className="text-xl font-bold">Panduan juga ada di tiap menu</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Di sebelah tiap nama menu ada ikon tanda tanya (?). Klik ikon itu untuk langsung membuka
              panduan menu tersebut. Jadi tidak perlu balik ke halaman ini terus.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl pb-10 animate-fade-in">
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
          </div>
        }
      >
        <HelpContent />
      </Suspense>
    </div>
  );
}
