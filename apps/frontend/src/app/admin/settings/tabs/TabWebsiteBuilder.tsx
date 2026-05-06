'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  Globe2,
  LayoutDashboard,
  Loader2,
  MonitorSmartphone,
  Navigation,
  Paintbrush,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { getSettingsMap, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
  HomeBuilderLayout,
  HomeSection,
  HomeSectionType,
  parseWebsiteBuilderState,
  serializeBuilderJson,
  WEBSITE_BUILDER_KEYS,
  WebsiteBuilderShell,
  WebsiteBuilderTheme,
} from '@/lib/website-builder';

type BuilderArea = 'Theme' | 'Navbar' | 'Home' | 'Floating' | 'Footer';

const builderAreas: Array<{ title: BuilderArea; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { title: 'Theme', description: 'Warna, font, radius, shadow, dan background global.', icon: Paintbrush },
  { title: 'Navbar', description: 'Logo, menu utama, tombol PSB, dan perilaku mobile menu.', icon: Navigation },
  { title: 'Home', description: 'Susunan block Home dari hero sampai CTA pendaftaran.', icon: LayoutDashboard },
  { title: 'Floating', description: 'WhatsApp, back-to-top, dan jarak tombol di tampilan HP.', icon: MonitorSmartphone },
  { title: 'Footer', description: 'Kolom link, kontak, sosial media, dan copyright.', icon: Globe2 },
];

const blockCatalog: Array<{ type: HomeSectionType; label: string; variant: string }> = [
  { type: 'hero', label: 'Hero', variant: 'photo-single' },
  { type: 'info-cards', label: 'Kartu Info', variant: 'floating' },
  { type: 'profile', label: 'Profil Singkat', variant: 'text-left' },
  { type: 'programs', label: 'Program Inti', variant: 'featured-grid' },
  { type: 'extracurriculars', label: 'Ekstrakurikuler', variant: 'image-cards' },
  { type: 'gallery', label: 'Galeri', variant: 'featured-grid' },
  { type: 'videos', label: 'Video', variant: 'cards' },
  { type: 'news', label: 'Berita', variant: 'featured-side' },
  { type: 'agendas', label: 'Agenda', variant: 'featured-card' },
  { type: 'cta', label: 'CTA Pendaftaran', variant: 'gradient' },
  { type: 'spacer', label: 'Spacer', variant: 'default' },
];

const sectionLabels: Record<HomeSectionType, string> = blockCatalog.reduce(
  (acc, item) => ({ ...acc, [item.type]: item.label }),
  {} as Record<HomeSectionType, string>
);

function freshHomeLayout(): HomeBuilderLayout {
  return {
    ...defaultHomeBuilderLayout,
    updated_at: new Date().toISOString(),
  };
}

function createSection(type: HomeSectionType): HomeSection {
  const catalog = blockCatalog.find((item) => item.type === type) || blockCatalog[0];
  const stamp = Date.now().toString(36);
  return {
    id: `${type}-${stamp}`,
    type,
    enabled: true,
    variant: catalog.variant,
    settings: {
      title: catalog.label,
      subtitle: '',
      button_label: type === 'cta' ? 'Lihat Info PSB' : 'Lihat Selengkapnya',
      button_url: type === 'cta' ? '/psb' : '/',
    },
  };
}

function updateSectionSetting(section: HomeSection, key: string, value: unknown): HomeSection {
  return {
    ...section,
    settings: {
      ...section.settings,
      [key]: value,
    },
  };
}

function updatePrimaryHeroButton(section: HomeSection, key: 'label' | 'url', value: string): HomeSection {
  const rawButtons = Array.isArray(section.settings.buttons) ? section.settings.buttons : [];
  const buttons = rawButtons.length > 0 ? [...rawButtons] : [{ label: 'Lihat Info PSB', url: '/psb', style: 'primary' }];
  const firstButton = buttons[0] && typeof buttons[0] === 'object' ? { ...(buttons[0] as Record<string, unknown>) } : {};
  firstButton[key] = value;
  buttons[0] = firstButton;
  return updateSectionSetting(section, 'buttons', buttons);
}

function SectionEditor({
  section,
  onChange,
}: {
  section: HomeSection;
  onChange: (section: HomeSection) => void;
}) {
  const title = typeof section.settings.title === 'string' ? section.settings.title : '';
  const subtitle = typeof section.settings.subtitle === 'string' ? section.settings.subtitle : '';
  const rawButtons = Array.isArray(section.settings.buttons) ? section.settings.buttons : [];
  const firstButton = rawButtons[0] && typeof rawButtons[0] === 'object' ? (rawButtons[0] as Record<string, unknown>) : {};
  const buttonLabel = typeof section.settings.button_label === 'string' && section.settings.button_label
    ? section.settings.button_label
    : typeof firstButton.label === 'string'
      ? firstButton.label
      : '';
  const buttonUrl = typeof section.settings.button_url === 'string' && section.settings.button_url
    ? section.settings.button_url
    : typeof firstButton.url === 'string'
      ? firstButton.url
      : '';
  const heroTitle = typeof section.settings.title === 'string' ? section.settings.title : '';
  const heroSubtitle = typeof section.settings.subtitle === 'string' ? section.settings.subtitle : '';
  const imageUrl = typeof section.settings.image_url === 'string' ? section.settings.image_url : '';

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Editor Block</p>
        <h4 className="mt-1 text-lg font-black text-slate-950">{sectionLabels[section.type] || section.type}</h4>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Variant</span>
          <select
            value={section.variant}
            onChange={(event) => onChange({ ...section, variant: event.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
          >
            {section.type === 'hero' ? (
              <>
                <option value="slider">Hero Slider</option>
                <option value="photo-single">Foto Tunggal</option>
                <option value="split">Split</option>
                <option value="psb-campaign">PSB Campaign</option>
                <option value="minimal">Minimal</option>
              </>
            ) : null}
            {section.type === 'news' ? (
              <>
                <option value="featured-side">Featured Side</option>
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </>
            ) : null}
            {section.type !== 'hero' && section.type !== 'news' ? <option value={section.variant}>{section.variant}</option> : null}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</span>
          <button
            type="button"
            onClick={() => onChange({ ...section, enabled: !section.enabled })}
            className={`w-full rounded-xl px-4 py-3 text-sm font-black ${section.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            {section.enabled ? 'Aktif' : 'Nonaktif'}
          </button>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Judul</span>
        <input
          value={title || heroTitle}
          onChange={(event) => onChange(updateSectionSetting(section, 'title', event.target.value))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
        />
      </label>

      <label className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subtitle / Deskripsi</span>
        <textarea
          rows={3}
          value={subtitle || heroSubtitle}
          onChange={(event) => onChange(updateSectionSetting(section, 'subtitle', event.target.value))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
        />
      </label>

      {section.type === 'hero' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Gambar</span>
            <input
              value={imageUrl}
              onChange={(event) => onChange(updateSectionSetting(section, 'image_url', event.target.value))}
              placeholder="/uploads/hero.jpg atau /assets/img/gedung.webp"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Overlay</span>
            <select
              value={typeof section.settings.overlay === 'string' ? section.settings.overlay : 'medium'}
              onChange={(event) => onChange(updateSectionSetting(section, 'overlay', event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            >
              <option value="none">Tanpa Overlay</option>
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </label>
        </div>
      ) : null}

      {section.type !== 'info-cards' && section.type !== 'spacer' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Label Tombol</span>
            <input
              value={buttonLabel}
              onChange={(event) => {
                const next = updateSectionSetting(section, 'button_label', event.target.value);
                onChange(section.type === 'hero' ? updatePrimaryHeroButton(next, 'label', event.target.value) : next);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Tombol</span>
            <input
              value={buttonUrl}
              onChange={(event) => {
                const next = updateSectionSetting(section, 'button_url', event.target.value);
                onChange(section.type === 'hero' ? updatePrimaryHeroButton(next, 'url', event.target.value) : next);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export default function TabWebsiteBuilder() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeArea, setActiveArea] = useState<BuilderArea>('Home');
  const [themeDraft, setThemeDraft] = useState<WebsiteBuilderTheme>(defaultWebsiteBuilderTheme);
  const [shellDraft, setShellDraft] = useState<WebsiteBuilderShell>(defaultWebsiteBuilderShell);
  const [homeDraft, setHomeDraft] = useState<HomeBuilderLayout>(freshHomeLayout());
  const [selectedSectionId, setSelectedSectionId] = useState(defaultHomeBuilderLayout.sections[0]?.id || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { showToast } = useToast();

  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);
  const selectedSection = homeDraft.sections.find((section) => section.id === selectedSectionId) || homeDraft.sections[0] || null;
  const draftSectionCount = homeDraft.sections.filter((section) => section.enabled).length;
  const publishedSectionCount = builderState.homePublished.sections.filter((section) => section.enabled).length;

  const syncFromSettings = useCallback((settingsMap: Record<string, string>) => {
    const state = parseWebsiteBuilderState(settingsMap);
    setThemeDraft(state.themeDraft);
    setShellDraft(state.shellDraft);
    setHomeDraft(state.homeDraft);
    setSelectedSectionId(state.homeDraft.sections[0]?.id || '');
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsMap = await getSettingsMap();
      setSettings(settingsMap);
      syncFromSettings(settingsMap);
    } finally {
      setIsLoading(false);
    }
  }, [syncFromSettings]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const nextHome = { ...homeDraft, updated_at: new Date().toISOString() };
      await Promise.all([
        updateSetting(WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(themeDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(shellDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(nextHome)),
      ]);
      showToast('success', 'Draft Website Builder berhasil disimpan.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal menyimpan draft Website Builder.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const publishDraft = async (enableAfterPublish = false) => {
    setIsPublishing(true);
    try {
      const nextHome = { ...homeDraft, updated_at: new Date().toISOString() };
      await Promise.all([
        updateSetting(WEBSITE_BUILDER_KEYS.themePublished, serializeBuilderJson(themeDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.shellPublished, serializeBuilderJson(shellDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.homePublished, serializeBuilderJson(nextHome)),
        updateSetting(WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(themeDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(shellDraft)),
        updateSetting(WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(nextHome)),
        ...(enableAfterPublish ? [updateSetting(WEBSITE_BUILDER_KEYS.enabled, 'true')] : []),
      ]);
      showToast('success', enableAfterPublish ? 'Website Builder berhasil dipublish dan diaktifkan.' : 'Konfigurasi builder berhasil dipublish.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal mempublish konfigurasi builder.');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleBuilder = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      await updateSetting(WEBSITE_BUILDER_KEYS.enabled, String(enabled));
      showToast('success', enabled ? 'Website Builder diaktifkan.' : 'Website Builder dinonaktifkan.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal mengubah status Website Builder.');
    } finally {
      setIsToggling(false);
    }
  };

  const resetDefault = () => {
    const nextHome = freshHomeLayout();
    setThemeDraft(defaultWebsiteBuilderTheme);
    setShellDraft(defaultWebsiteBuilderShell);
    setHomeDraft(nextHome);
    setSelectedSectionId(nextHome.sections[0]?.id || '');
    showToast('success', 'Draft dikembalikan ke default. Klik Simpan Draft untuk menyimpan.');
  };

  const updateSelectedSection = (section: HomeSection) => {
    setHomeDraft((current) => ({
      ...current,
      sections: current.sections.map((item) => (item.id === section.id ? section : item)),
    }));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setHomeDraft((current) => {
      const index = current.sections.findIndex((section) => section.id === id);
      const target = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections };
    });
  };

  const deleteSection = (id: string) => {
    setHomeDraft((current) => {
      const sections = current.sections.filter((section) => section.id !== id);
      if (selectedSectionId === id) {
        setSelectedSectionId(sections[0]?.id || '');
      }
      return { ...current, sections };
    });
  };

  const addSection = (type: HomeSectionType) => {
    const section = createSection(type);
    setHomeDraft((current) => ({ ...current, sections: [...current.sections, section] }));
    setSelectedSectionId(section.id);
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
              Website Builder
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 md:text-3xl">
                Atur Website dari Navbar sampai Footer
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">
                Builder ini memakai draft dan publish. Kamu bisa menyusun Home, mengatur navbar, floating button,
                footer, dan theme, lalu aktifkan setelah siap.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={saveDraft} disabled={isSavingDraft} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:opacity-60">
                {isSavingDraft ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Draft
              </button>
              <button onClick={() => void publishDraft(false)} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60">
                {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                Publish
              </button>
              <button
                type="button"
                onClick={() => window.open('/builder-preview/home', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                <Eye size={16} />
                Preview Draft
              </button>
              <button onClick={() => void publishDraft(true)} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-60">
                <CheckCircle2 size={16} />
                Publish & Aktifkan
              </button>
              <button onClick={() => void toggleBuilder(!builderState.enabled)} disabled={isToggling} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                {isToggling ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                {builderState.enabled ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button onClick={resetDefault} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50">
                Reset Default
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.32)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Status Live</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  {builderState.enabled ? 'Builder Aktif' : 'Builder Nonaktif'}
                </h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${builderState.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {builderState.enabled ? 'Live' : 'Fallback Lama'}
              </span>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Draft Home</p>
                <p className="mt-1 font-black text-slate-900">{draftSectionCount} block aktif</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Published Home</p>
                <p className="mt-1 font-black text-slate-900">{publishedSectionCount} block aktif</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
          {builderAreas.map((area) => {
            const Icon = area.icon;
            return (
              <button
                key={area.title}
                onClick={() => setActiveArea(area.title)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${
                  activeArea === area.title ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {area.title}
              </button>
            );
          })}
        </div>

        <div className="p-6 lg:p-8">
          {activeArea === 'Theme' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Warna Utama</span>
                <select value={themeDraft.palette.primary} onChange={(event) => setThemeDraft((current) => ({ ...current, palette: { ...current.palette, primary: event.target.value as WebsiteBuilderTheme['palette']['primary'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="emerald">Emerald</option>
                  <option value="teal">Teal</option>
                  <option value="blue">Blue</option>
                  <option value="amber">Amber</option>
                  <option value="slate">Slate</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tone</span>
                <select value={themeDraft.palette.tone} onChange={(event) => setThemeDraft((current) => ({ ...current, palette: { ...current.palette, tone: event.target.value as WebsiteBuilderTheme['palette']['tone'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="fresh">Fresh</option>
                  <option value="formal">Formal</option>
                  <option value="warm">Warm</option>
                  <option value="calm">Calm</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Radius</span>
                <select value={themeDraft.shape.radius} onChange={(event) => setThemeDraft((current) => ({ ...current, shape: { ...current.shape, radius: event.target.value as WebsiteBuilderTheme['shape']['radius'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="soft">Soft</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="sharp">Sharp</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Shadow</span>
                <select value={themeDraft.shape.shadow} onChange={(event) => setThemeDraft((current) => ({ ...current, shape: { ...current.shape, shadow: event.target.value as WebsiteBuilderTheme['shape']['shadow'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="none">None</option>
                  <option value="soft">Soft</option>
                  <option value="bold">Bold</option>
                </select>
              </label>
            </div>
          ) : null}

          {activeArea === 'Navbar' ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Variant Navbar</span>
                  <select value={shellDraft.navbar.variant} onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, variant: event.target.value as WebsiteBuilderShell['navbar']['variant'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                    <option value="classic">Classic</option>
                    <option value="centered">Centered</option>
                    <option value="compact">Compact</option>
                    <option value="transparent-over-hero">Transparent</option>
                    <option value="simple">Simple</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CTA Label</span>
                  <input value={shellDraft.navbar.cta.label} onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, cta: { ...current.navbar.cta, label: event.target.value } } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold" />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CTA URL</span>
                  <input value={shellDraft.navbar.cta.url} onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, cta: { ...current.navbar.cta, url: event.target.value } } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold" />
                </label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-950">Menu Navbar</h4>
                  <button onClick={() => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, menu_items: [...current.navbar.menu_items, { label: 'Menu Baru', url: '/' }] } }))} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                    <Plus size={14} /> Tambah Menu
                  </button>
                </div>
                {shellDraft.navbar.menu_items.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]">
                    <input value={item.label} onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, menu_items: current.navbar.menu_items.map((menu, menuIndex) => (menuIndex === index ? { ...menu, label: event.target.value } : menu)) } }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" />
                    <input value={item.url} onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, menu_items: current.navbar.menu_items.map((menu, menuIndex) => (menuIndex === index ? { ...menu, url: event.target.value } : menu)) } }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" />
                    <button onClick={() => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, menu_items: current.navbar.menu_items.filter((_, menuIndex) => menuIndex !== index) } }))} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeArea === 'Home' ? (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {blockCatalog.map((block) => (
                    <button key={block.type} onClick={() => addSection(block.type)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 hover:border-emerald-200 hover:text-emerald-700">
                      <Plus size={13} /> {block.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {homeDraft.sections.map((section) => (
                    <div key={section.id} className={`rounded-2xl border p-4 ${selectedSectionId === section.id ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
                      <button onClick={() => setSelectedSectionId(section.id)} className="block w-full text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{section.type}</p>
                        <p className="mt-1 font-black text-slate-950">{sectionLabels[section.type] || section.type}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{section.enabled ? 'Aktif' : 'Nonaktif'} • {section.variant}</p>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => moveSection(section.id, 'up')} className="rounded-lg bg-white p-2 text-slate-500"><ArrowUp size={14} /></button>
                        <button onClick={() => moveSection(section.id, 'down')} className="rounded-lg bg-white p-2 text-slate-500"><ArrowDown size={14} /></button>
                        <button onClick={() => updateSelectedSection({ ...section, enabled: !section.enabled })} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-600">{section.enabled ? 'Hide' : 'Show'}</button>
                        <button onClick={() => deleteSection(section.id)} className="ml-auto rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedSection ? <SectionEditor section={selectedSection} onChange={updateSelectedSection} /> : null}
            </div>
          ) : null}

          {activeArea === 'Floating' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">WhatsApp Floating</span>
                <input type="checkbox" checked={shellDraft.floating.whatsapp.enabled} onChange={(event) => setShellDraft((current) => ({ ...current, floating: { ...current.floating, whatsapp: { ...current.floating.whatsapp, enabled: event.target.checked } } }))} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">Back To Top</span>
                <input type="checkbox" checked={shellDraft.floating.back_to_top.enabled} onChange={(event) => setShellDraft((current) => ({ ...current, floating: { ...current.floating, back_to_top: { ...current.floating.back_to_top, enabled: event.target.checked } } }))} />
              </label>
            </div>
          ) : null}

          {activeArea === 'Footer' ? (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Variant Footer</span>
                <select value={shellDraft.footer.variant} onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, variant: event.target.value as WebsiteBuilderShell['footer']['variant'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="simple">Simple</option>
                  <option value="columns">Columns</option>
                  <option value="contact-columns">Contact Columns</option>
                  <option value="map-contact">Map Contact</option>
                  <option value="minimal">Minimal</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Background</span>
                <select value={shellDraft.footer.background} onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, background: event.target.value as WebsiteBuilderShell['footer']['background'] } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold">
                  <option value="emerald-dark">Emerald Dark</option>
                  <option value="slate-dark">Slate Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Deskripsi Footer</span>
                <textarea rows={4} value={shellDraft.footer.description} onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, description: event.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium" />
              </label>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
