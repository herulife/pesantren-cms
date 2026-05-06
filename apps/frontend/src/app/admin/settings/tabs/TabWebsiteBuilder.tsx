'use client';

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  Globe2,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MonitorSmartphone,
  Navigation,
  Paintbrush,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { getSettingsMap, resolveDisplayImageUrl, updateSetting, uploadImage } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
  HomeBuilderLayout,
  HomeSection,
  HomeSectionType,
  NavbarMenuItem,
  parseWebsiteBuilderState,
  serializeBuilderJson,
  WEBSITE_BUILDER_KEYS,
  WebsiteBuilderShell,
  WebsiteBuilderTheme,
} from '@/lib/website-builder';

type BuilderArea = 'Theme' | 'Navbar' | 'Home' | 'Floating' | 'Footer';
type ShellListKey = 'navbar-menu' | 'footer-quick-links' | 'footer-contact-items';

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

function cloneSectionSettings(settings: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(settings)) as Record<string, unknown>;
}

function createSectionId(type: HomeSectionType): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getDefaultSectionTemplate(type: HomeSectionType): HomeSection {
  const defaultSection = defaultHomeBuilderLayout.sections.find((section) => section.type === type);
  if (defaultSection) {
    return {
      ...defaultSection,
      settings: cloneSectionSettings(defaultSection.settings),
    };
  }

  return createSection(type);
}

function readShellList(shell: WebsiteBuilderShell, listKey: ShellListKey): NavbarMenuItem[] {
  switch (listKey) {
    case 'navbar-menu':
      return shell.navbar.menu_items;
    case 'footer-quick-links':
      return shell.footer.quick_links;
    case 'footer-contact-items':
      return shell.footer.contact_items;
    default:
      return [];
  }
}

function writeShellList(shell: WebsiteBuilderShell, listKey: ShellListKey, items: NavbarMenuItem[]): WebsiteBuilderShell {
  switch (listKey) {
    case 'navbar-menu':
      return { ...shell, navbar: { ...shell.navbar, menu_items: items } };
    case 'footer-quick-links':
      return { ...shell, footer: { ...shell.footer, quick_links: items } };
    case 'footer-contact-items':
      return { ...shell, footer: { ...shell.footer, contact_items: items } };
    default:
      return shell;
  }
}

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

function updatePrimaryHeroSlide(section: HomeSection, key: 'title' | 'subtitle' | 'image_url', value: string): HomeSection {
  const rawSlides = Array.isArray(section.settings.slides) ? section.settings.slides : [];
  const slides = rawSlides.length > 0 ? [...rawSlides] : [{ title: '', subtitle: '', image_url: '' }];
  const firstSlide = slides[0] && typeof slides[0] === 'object' ? { ...(slides[0] as Record<string, unknown>) } : {};
  firstSlide[key] = value;
  slides[0] = firstSlide;
  return updateSectionSetting(section, 'slides', slides);
}

function ImageUploadField({
  label,
  value,
  placeholder,
  onChange,
  onUpload,
  isUploading = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}) {
  const inputId = useId();
  const previewUrl = value ? resolveDisplayImageUrl(value) : '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
            isUploading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {isUploading ? 'Uploading...' : 'Upload Gambar'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await onUpload(file);
            event.currentTarget.value = '';
          }}
        />
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {previewUrl ? (
          <div className="relative h-40 w-full">
            <Image src={previewUrl} alt={label} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <ImageIcon size={18} />
            <span className="text-sm font-bold">Belum ada gambar</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onUploadImage,
  isUploadingImage = false,
}: {
  section: HomeSection;
  onChange: (section: HomeSection) => void;
  onUploadImage?: (file: File) => Promise<void>;
  isUploadingImage?: boolean;
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
          onChange={(event) => {
            const nextTitle = event.target.value;
            const next = updateSectionSetting(section, 'title', nextTitle);
            onChange(section.type === 'hero' ? updatePrimaryHeroSlide(next, 'title', nextTitle) : next);
          }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
        />
      </label>

      <label className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subtitle / Deskripsi</span>
        <textarea
          rows={3}
          value={subtitle || heroSubtitle}
          onChange={(event) => {
            const nextSubtitle = event.target.value;
            const next = updateSectionSetting(section, 'subtitle', nextSubtitle);
            onChange(section.type === 'hero' ? updatePrimaryHeroSlide(next, 'subtitle', nextSubtitle) : next);
          }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
        />
      </label>

      {section.type === 'hero' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <ImageUploadField
              label="Gambar Hero"
              value={imageUrl}
              onChange={(value) => {
                const next = updateSectionSetting(section, 'image_url', value);
                onChange(updatePrimaryHeroSlide(next, 'image_url', value));
              }}
              onUpload={async (file) => {
                if (!onUploadImage) return;
                await onUploadImage(file);
              }}
              isUploading={isUploadingImage}
              placeholder="/uploads/hero.jpg atau /assets/img/gedung.webp"
            />
          </div>
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
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [draggingShellItem, setDraggingShellItem] = useState<{ listKey: ShellListKey; index: number } | null>(null);
  const [dragOverShellItem, setDragOverShellItem] = useState<{ listKey: ShellListKey; index: number } | null>(null);
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

  const uploadBuilderAsset = useCallback(
    async (target: string, file: File) => {
      setUploadingTarget(target);
      try {
        const result = await uploadImage(file);
        const uploadedUrl = result?.url || result?.data?.url || '';
        if (!uploadedUrl) {
          throw new Error('URL gambar upload tidak ditemukan.');
        }
        showToast('success', 'Gambar berhasil diunggah.');
        return uploadedUrl;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal mengunggah gambar.';
        showToast('error', message);
        return '';
      } finally {
        setUploadingTarget(null);
      }
    },
    [showToast]
  );

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

  const reorderSections = useCallback((sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setHomeDraft((current) => {
      const sourceIndex = current.sections.findIndex((section) => section.id === sourceId);
      const targetIndex = current.sections.findIndex((section) => section.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current;
      }

      const sections = [...current.sections];
      const [movedSection] = sections.splice(sourceIndex, 1);
      sections.splice(targetIndex, 0, movedSection);
      return { ...current, sections };
    });
  }, []);

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

  const duplicateSection = (id: string) => {
    const section = homeDraft.sections.find((item) => item.id === id);
    if (!section) return;

    const duplicate: HomeSection = {
      ...section,
      id: createSectionId(section.type),
      settings: cloneSectionSettings(section.settings),
    };

    setHomeDraft((current) => {
      const index = current.sections.findIndex((item) => item.id === id);
      if (index < 0) return current;
      const sections = [...current.sections];
      sections.splice(index + 1, 0, duplicate);
      return { ...current, sections };
    });
    setSelectedSectionId(duplicate.id);
    showToast('success', 'Block berhasil diduplikasi.');
  };

  const resetSection = (id: string) => {
    const currentSection = homeDraft.sections.find((item) => item.id === id);
    if (!currentSection) return;

    const resetTemplate = getDefaultSectionTemplate(currentSection.type);
    const nextSection: HomeSection = {
      ...resetTemplate,
      id: currentSection.id,
      enabled: currentSection.enabled,
    };

    updateSelectedSection(nextSection);
    showToast('success', 'Block dikembalikan ke versi default.');
  };

  const handleDragStart = (sectionId: string) => {
    setDraggingSectionId(sectionId);
    setDragOverSectionId(sectionId);
  };

  const handleDragEnd = () => {
    setDraggingSectionId(null);
    setDragOverSectionId(null);
  };

  const handleDropSection = (targetSectionId: string) => {
    if (draggingSectionId && draggingSectionId !== targetSectionId) {
      reorderSections(draggingSectionId, targetSectionId);
    }
    handleDragEnd();
  };

  const addShellListItem = useCallback((listKey: ShellListKey, item: NavbarMenuItem) => {
    setShellDraft((current) => {
      const items = [...readShellList(current, listKey), item];
      return writeShellList(current, listKey, items);
    });
  }, []);

  const updateShellListItem = useCallback((listKey: ShellListKey, index: number, key: keyof NavbarMenuItem, value: string) => {
    setShellDraft((current) => {
      const items = readShellList(current, listKey).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      );
      return writeShellList(current, listKey, items);
    });
  }, []);

  const removeShellListItem = useCallback((listKey: ShellListKey, index: number) => {
    setShellDraft((current) => {
      const items = readShellList(current, listKey).filter((_, itemIndex) => itemIndex !== index);
      return writeShellList(current, listKey, items);
    });
  }, []);

  const moveShellListItem = useCallback((listKey: ShellListKey, index: number, direction: 'up' | 'down') => {
    setShellDraft((current) => {
      const items = [...readShellList(current, listKey)];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return current;
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      return writeShellList(current, listKey, items);
    });
  }, []);

  const reorderShellListItems = useCallback((listKey: ShellListKey, sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    setShellDraft((current) => {
      const items = [...readShellList(current, listKey)];
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= items.length || targetIndex >= items.length) {
        return current;
      }
      const [movedItem] = items.splice(sourceIndex, 1);
      items.splice(targetIndex, 0, movedItem);
      return writeShellList(current, listKey, items);
    });
  }, []);

  const handleShellDragStart = (listKey: ShellListKey, index: number) => {
    setDraggingShellItem({ listKey, index });
    setDragOverShellItem({ listKey, index });
  };

  const handleShellDragEnd = () => {
    setDraggingShellItem(null);
    setDragOverShellItem(null);
  };

  const handleShellDrop = (listKey: ShellListKey, targetIndex: number) => {
    if (draggingShellItem && draggingShellItem.listKey === listKey && draggingShellItem.index !== targetIndex) {
      reorderShellListItems(listKey, draggingShellItem.index, targetIndex);
    }
    handleShellDragEnd();
  };

  const renderLinkListEditor = ({
    title,
    description,
    listKey,
    items,
    addLabel,
    addItem,
    labelPlaceholder,
    urlPlaceholder,
  }: {
    title: string;
    description: string;
    listKey: ShellListKey;
    items: NavbarMenuItem[];
    addLabel: string;
    addItem: NavbarMenuItem;
    labelPlaceholder: string;
    urlPlaceholder: string;
  }) => (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-black text-slate-950">{title}</h4>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          onClick={() => addShellListItem(listKey, addItem)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
          Belum ada item. Tambahkan dulu supaya bagian ini muncul lebih jelas di preview.
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => {
          const isDragging = draggingShellItem?.listKey === listKey && draggingShellItem.index === index;
          const isDragTarget =
            dragOverShellItem?.listKey === listKey &&
            dragOverShellItem.index === index &&
            !(draggingShellItem?.listKey === listKey && draggingShellItem.index === index);

          return (
            <div
              key={`${listKey}-${index}-${item.label}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragOverShellItem?.listKey !== listKey || dragOverShellItem.index !== index) {
                  setDragOverShellItem({ listKey, index });
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleShellDrop(listKey, index);
              }}
              className={`grid gap-3 rounded-xl border p-3 transition-all md:grid-cols-[auto_1fr_1fr_auto_auto_auto] ${
                isDragTarget ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-200' : 'border-slate-200 bg-slate-50'
              } ${isDragging ? 'opacity-60' : ''}`}
            >
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', `${listKey}:${index}`);
                  handleShellDragStart(listKey, index);
                }}
                onDragEnd={handleShellDragEnd}
                className="inline-flex cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-500 active:cursor-grabbing"
                title="Drag untuk ubah urutan"
              >
                <GripVertical size={14} />
              </div>
              <input
                value={item.label}
                onChange={(event) => updateShellListItem(listKey, index, 'label', event.target.value)}
                placeholder={labelPlaceholder}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
              />
              <input
                value={item.url}
                onChange={(event) => updateShellListItem(listKey, index, 'url', event.target.value)}
                placeholder={urlPlaceholder}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
              />
              <button onClick={() => moveShellListItem(listKey, index, 'up')} className="rounded-lg bg-white p-2 text-slate-500">
                <ArrowUp size={14} />
              </button>
              <button onClick={() => moveShellListItem(listKey, index, 'down')} className="rounded-lg bg-white p-2 text-slate-500">
                <ArrowDown size={14} />
              </button>
              <button onClick={() => removeShellListItem(listKey, index)} className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

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
              <div className="grid gap-4 md:grid-cols-2">
                <ImageUploadField
                  label="Logo Navbar"
                  value={shellDraft.navbar.logo_url}
                  onChange={(value) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, logo_url: value } }))}
                  onUpload={async (file) => {
                    const uploadedUrl = await uploadBuilderAsset('navbar-logo', file);
                    if (!uploadedUrl) return;
                    setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, logo_url: uploadedUrl } }));
                  }}
                  isUploading={uploadingTarget === 'navbar-logo'}
                  placeholder="/uploads/logo-navbar.png"
                />
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Override Nama Sekolah</span>
                  <input
                    value={shellDraft.navbar.school_name_override}
                    onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, school_name_override: event.target.value } }))}
                    placeholder="Kosongkan untuk pakai nama sekolah utama"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"
                  />
                </label>
              </div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="font-black text-slate-900">Tampilkan Nama Sekolah</span>
                  <input
                    type="checkbox"
                    checked={shellDraft.navbar.show_school_name}
                    onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, show_school_name: event.target.checked } }))}
                  />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="font-black text-slate-900">Tampilkan Login / Akun</span>
                  <input
                    type="checkbox"
                    checked={shellDraft.navbar.show_login_link}
                    onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, show_login_link: event.target.checked } }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Menu Mobile</span>
                  <select
                    value={shellDraft.navbar.mobile.variant}
                    onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, mobile: { ...current.navbar.mobile, variant: event.target.value as WebsiteBuilderShell['navbar']['mobile']['variant'] } } }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"
                  >
                    <option value="drawer">Drawer</option>
                    <option value="sheet">Sheet</option>
                    <option value="bottom-menu">Bottom Menu</option>
                  </select>
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="font-black text-slate-900">Tampilkan CTA di Mobile</span>
                  <input
                    type="checkbox"
                    checked={shellDraft.navbar.mobile.show_cta}
                    onChange={(event) => setShellDraft((current) => ({ ...current, navbar: { ...current.navbar, mobile: { ...current.navbar.mobile, show_cta: event.target.checked } } }))}
                  />
                </label>
              </div>
              {renderLinkListEditor({
                title: 'Menu Navbar',
                description: 'Atur urutan menu utama. Bisa drag, geser naik-turun, lalu preview sebelum publish.',
                listKey: 'navbar-menu',
                items: shellDraft.navbar.menu_items,
                addLabel: 'Tambah Menu',
                addItem: { label: 'Menu Baru', url: '/' },
                labelPlaceholder: 'Label menu',
                urlPlaceholder: '/profil atau /program',
              })}
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
                    <div
                      key={section.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragOverSectionId !== section.id) {
                          setDragOverSectionId(section.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDropSection(section.id);
                      }}
                      className={`rounded-2xl border p-4 transition-all ${
                        selectedSectionId === section.id ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'
                      } ${
                        dragOverSectionId === section.id && draggingSectionId !== section.id
                          ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-white'
                          : ''
                      } ${draggingSectionId === section.id ? 'opacity-65' : ''}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <button onClick={() => setSelectedSectionId(section.id)} className="block flex-1 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{section.type}</p>
                        <p className="mt-1 font-black text-slate-950">{sectionLabels[section.type] || section.type}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{section.enabled ? 'Aktif' : 'Nonaktif'} • {section.variant}</p>
                        </button>
                        <div
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', section.id);
                            handleDragStart(section.id);
                          }}
                          onDragEnd={handleDragEnd}
                          className="inline-flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 active:cursor-grabbing"
                          title="Drag untuk ubah urutan"
                        >
                          <GripVertical size={14} />
                          Drag
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => moveSection(section.id, 'up')} className="rounded-lg bg-white p-2 text-slate-500"><ArrowUp size={14} /></button>
                        <button onClick={() => moveSection(section.id, 'down')} className="rounded-lg bg-white p-2 text-slate-500"><ArrowDown size={14} /></button>
                        <button onClick={() => updateSelectedSection({ ...section, enabled: !section.enabled })} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-600">{section.enabled ? 'Hide' : 'Show'}</button>
                        <button onClick={() => duplicateSection(section.id)} className="rounded-lg bg-white p-2 text-slate-500" title="Duplikat block"><Copy size={14} /></button>
                        <button onClick={() => resetSection(section.id)} className="rounded-lg bg-white p-2 text-slate-500" title="Reset block ke default"><RotateCcw size={14} /></button>
                        <button onClick={() => deleteSection(section.id)} className="ml-auto rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedSection ? (
                <SectionEditor
                  section={selectedSection}
                  onChange={updateSelectedSection}
                  onUploadImage={async (file) => {
                    const uploadedUrl = await uploadBuilderAsset(`section-${selectedSection.id}-image`, file);
                    if (!uploadedUrl) return;
                    const next = updateSectionSetting(selectedSection, 'image_url', uploadedUrl);
                    updateSelectedSection(updatePrimaryHeroSlide(next, 'image_url', uploadedUrl));
                  }}
                  isUploadingImage={uploadingTarget === `section-${selectedSection.id}-image`}
                />
              ) : null}
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
              <ImageUploadField
                label="Logo Footer"
                value={shellDraft.footer.logo_url}
                onChange={(value) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, logo_url: value } }))}
                onUpload={async (file) => {
                  const uploadedUrl = await uploadBuilderAsset('footer-logo', file);
                  if (!uploadedUrl) return;
                  setShellDraft((current) => ({ ...current, footer: { ...current.footer, logo_url: uploadedUrl } }));
                }}
                isUploading={uploadingTarget === 'footer-logo'}
                placeholder="/uploads/logo-footer.png"
              />
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
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Copyright</span>
                <input
                  value={shellDraft.footer.copyright_text}
                  onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, copyright_text: event.target.value } }))}
                  placeholder={`Copyright ${new Date().getFullYear()} Darussunnah Parung.`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">Tampilkan Logo</span>
                <input
                  type="checkbox"
                  checked={shellDraft.footer.show_logo}
                  onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, show_logo: event.target.checked } }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">Tampilkan Sosial Media</span>
                <input
                  type="checkbox"
                  checked={shellDraft.footer.show_socials}
                  onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, show_socials: event.target.checked } }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">Tampilkan Alamat Default</span>
                <input
                  type="checkbox"
                  checked={shellDraft.footer.show_address}
                  onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, show_address: event.target.checked } }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-black text-slate-900">Tampilkan Tombol Maps</span>
                <input
                  type="checkbox"
                  checked={shellDraft.footer.show_map_link}
                  onChange={(event) => setShellDraft((current) => ({ ...current, footer: { ...current.footer, show_map_link: event.target.checked } }))}
                />
              </label>
              {renderLinkListEditor({
                title: 'Quick Links Footer',
                description: 'Daftar tautan di kolom footer. Cocok untuk Profil, Program, PSB, dan halaman penting lain.',
                listKey: 'footer-quick-links',
                items: shellDraft.footer.quick_links,
                addLabel: 'Tambah Link',
                addItem: { label: 'Link Baru', url: '/' },
                labelPlaceholder: 'Label quick link',
                urlPlaceholder: '/psb atau /kontak',
              })}
              {renderLinkListEditor({
                title: 'Contact Items Footer',
                description: 'Isi manual kalau ingin kolom kontak lebih terarah, misalnya WhatsApp, email, alamat singkat, atau tautan maps.',
                listKey: 'footer-contact-items',
                items: shellDraft.footer.contact_items,
                addLabel: 'Tambah Kontak',
                addItem: { label: 'WhatsApp Admin', url: 'https://wa.me/' },
                labelPlaceholder: 'Label kontak',
                urlPlaceholder: 'Kosongkan untuk teks biasa, atau isi https:// mailto: tel:',
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
