'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Globe2,
  LayoutDashboard,
  Loader2,
  MonitorSmartphone,
  Navigation,
  Paintbrush,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { getSettingsMap, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
  parseWebsiteBuilderState,
  serializeBuilderJson,
  WEBSITE_BUILDER_KEYS,
} from '@/lib/website-builder';

const builderAreas = [
  {
    title: 'Theme',
    description: 'Warna, font, radius, shadow, dan background global.',
    icon: Paintbrush,
  },
  {
    title: 'Navbar',
    description: 'Logo, menu utama, tombol PSB, dan perilaku mobile menu.',
    icon: Navigation,
  },
  {
    title: 'Home',
    description: 'Susunan block Home dari hero sampai CTA pendaftaran.',
    icon: LayoutDashboard,
  },
  {
    title: 'Floating',
    description: 'WhatsApp, back-to-top, dan jarak tombol di tampilan HP.',
    icon: MonitorSmartphone,
  },
  {
    title: 'Footer',
    description: 'Kolom link, kontak, sosial media, dan copyright.',
    icon: Globe2,
  },
];

function withFreshHomeTimestamp() {
  return {
    ...defaultHomeBuilderLayout,
    updated_at: new Date().toISOString(),
  };
}

export default function TabWebsiteBuilder() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const { showToast } = useToast();

  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);

  const publishedSectionCount = builderState.homePublished.sections.filter((section) => section.enabled).length;
  const draftSectionCount = builderState.homeDraft.sections.filter((section) => section.enabled).length;
  const hasPublishedHome = Boolean(settings[WEBSITE_BUILDER_KEYS.homePublished]);
  const hasDraftHome = Boolean(settings[WEBSITE_BUILDER_KEYS.homeDraft]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const settingsMap = await getSettingsMap();
      setSettings(settingsMap);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const saveDefaultDraft = async () => {
    setIsSavingDraft(true);
    try {
      const defaultHome = withFreshHomeTimestamp();
      await Promise.all([
        updateSetting(WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(defaultWebsiteBuilderTheme)),
        updateSetting(WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(defaultWebsiteBuilderShell)),
        updateSetting(WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(defaultHome)),
      ]);
      showToast('success', 'Draft Website Builder berhasil disiapkan.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal menyiapkan draft Website Builder.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const publishDraft = async () => {
    setIsPublishing(true);
    try {
      const draftHome = {
        ...builderState.homeDraft,
        updated_at: new Date().toISOString(),
      };
      await Promise.all([
        updateSetting(WEBSITE_BUILDER_KEYS.themePublished, serializeBuilderJson(builderState.themeDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.shellPublished, serializeBuilderJson(builderState.shellDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.homePublished, serializeBuilderJson(draftHome)),
      ]);
      showToast('success', 'Konfigurasi builder berhasil dipublish. Tampilan live belum berubah sampai renderer diaktifkan.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal mempublish konfigurasi builder.');
    } finally {
      setIsPublishing(false);
    }
  };

  const disableBuilder = async () => {
    setIsDisabling(true);
    try {
      await updateSetting(WEBSITE_BUILDER_KEYS.enabled, 'false');
      showToast('success', 'Website Builder dinonaktifkan.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal menonaktifkan Website Builder.');
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
        <Loader2 className="animate-spin text-emerald-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_54%,#fff7ed_100%)] shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
              <Globe2 size={14} />
              Fondasi Website Builder
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 md:text-3xl">
                Builder dari Navbar sampai Footer
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">
                Fase ini menyiapkan struktur draft, published, dan fallback aman. Website live belum diubah oleh builder
                sampai renderer publik kita aktifkan di fase berikutnya.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveDefaultDraft}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSavingDraft ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Siapkan Draft Default
              </button>
              <button
                onClick={publishDraft}
                disabled={isPublishing}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
              >
                {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                Publish Konfigurasi
              </button>
              {builderState.enabled ? (
                <button
                  onClick={disableBuilder}
                  disabled={isDisabling}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  {isDisabling ? <RefreshCw size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                  Nonaktifkan Builder
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.32)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Status Live</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  {builderState.enabled ? 'Builder Aktif' : 'Builder Belum Aktif'}
                </h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                  builderState.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {builderState.enabled ? 'Aktif' : 'Aman'}
              </span>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Draft Home</p>
                <p className="mt-1 font-black text-slate-900">
                  {hasDraftHome ? `${draftSectionCount} block aktif` : 'Belum dibuat'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Published Home</p>
                <p className="mt-1 font-black text-slate-900">
                  {hasPublishedHome ? `${publishedSectionCount} block aktif` : 'Belum dipublish'}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                  <p className="text-xs font-bold leading-6">
                    Aman untuk disiapkan sekarang. Toggle aktif akan dipakai setelah renderer publik selesai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Peta Area Builder</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-950">
                Yang Akan Bisa Diatur
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Area di bawah ini sudah dipetakan di schema. Form detailnya akan kita aktifkan bertahap di fase berikutnya.
              </p>
            </div>
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 md:inline-flex">
              MVP Foundation
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5 lg:p-8">
          {builderAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="mb-4 inline-flex rounded-xl bg-white p-3 text-emerald-600 shadow-sm">
                  <Icon size={22} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-slate-950">{area.title}</h4>
                <p className="mt-3 text-xs font-medium leading-6 text-slate-500">{area.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Langkah Berikutnya</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-950">
              Renderer Home + Editor Block
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Setelah fondasi ini, kita buat renderer Home dan editor block. Baru setelah itu tombol aktivasi builder
              dipakai untuk mengubah tampilan live.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            <Eye size={16} />
            Preview menyusul
          </div>
        </div>
      </section>
    </div>
  );
}
