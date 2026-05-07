'use client';

import React, { useCallback, useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Columns2,
  Copy,
  Eye,
  FileText,
  Globe2,
  GripVertical,
  History,
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
import {
  Agenda,
  formatGalleryAlbumTitle,
  GalleryItem,
  getAgendas,
  getGallery,
  getGallerySortTimestamp,
  getNews,
  getPrograms,
  getSettingsMap,
  getVideos,
  News,
  Program,
  resolveDisplayImageUrl,
  updateSetting,
  updateSettingsBatch,
  uploadImage,
  Video,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import PageBuilderEditor from '@/components/website-builder/PageBuilderEditor';
import WebsiteBuilderLivePreview, {
  WebsiteBuilderLivePreviewTarget,
  WebsiteBuilderLivePreviewViewport,
} from '@/components/website-builder/WebsiteBuilderLivePreview';
import {
  appendWebsiteBuilderRevision,
  BuilderPageKey,
  createWebsiteBuilderRevision,
  createWebsiteBuilderSnapshot,
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderPages,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
  HomeBuilderLayout,
  HomeSection,
  HomeSectionType,
  NavbarMenuItem,
  parseWebsiteBuilderState,
  serializeBuilderJson,
  WEBSITE_BUILDER_KEYS,
  WebsiteBuilderPages,
  WebsiteBuilderRevision,
  WebsiteBuilderShell,
  WebsiteBuilderTheme,
} from '@/lib/website-builder';

type BuilderArea = 'Theme' | 'Navbar' | 'Home' | 'Pages' | 'Floating' | 'Footer' | 'Revisions';
type ShellListKey = 'navbar-menu' | 'footer-quick-links' | 'footer-contact-items';
type HeroSlideDraft = {
  title: string;
  subtitle: string;
  image_url: string;
};
type ManualSourceBlockType = 'news' | 'agendas' | 'gallery' | 'videos' | 'programs' | 'extracurriculars';
type BuilderContentOption = {
  id: string;
  label: string;
  meta: string;
};
type BuilderContentCatalog = {
  news: BuilderContentOption[];
  agendas: BuilderContentOption[];
  gallery: BuilderContentOption[];
  videos: BuilderContentOption[];
  programs: BuilderContentOption[];
  extracurriculars: BuilderContentOption[];
};
type BuilderPreviewCollections = {
  news: News[];
  agendas: Agenda[];
  gallery: GalleryItem[];
  videos: Video[];
  programs: Program[];
};

const builderAreas: Array<{ title: BuilderArea; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { title: 'Theme', description: 'Warna, font, radius, shadow, dan background global.', icon: Paintbrush },
  { title: 'Navbar', description: 'Logo, menu utama, tombol PSB, dan perilaku mobile menu.', icon: Navigation },
  { title: 'Home', description: 'Susunan block Home dari hero sampai CTA pendaftaran.', icon: LayoutDashboard },
  { title: 'Pages', description: 'Konten halaman Profil, Program, PSB, dan Kontak.', icon: FileText },
  { title: 'Floating', description: 'WhatsApp, back-to-top, dan jarak tombol di tampilan HP.', icon: MonitorSmartphone },
  { title: 'Footer', description: 'Kolom link, kontak, sosial media, dan copyright.', icon: Globe2 },
  { title: 'Revisions', description: 'Riwayat snapshot builder untuk rollback draft atau publish.', icon: History },
];

const builderPageOptions: Array<{ key: BuilderPageKey; label: string; route: string; description: string }> = [
  { key: 'profil', label: 'Profil', route: '/profil', description: 'Hero, about, visi misi, dan CTA halaman profil.' },
  { key: 'program', label: 'Program', route: '/program', description: 'Hero, highlight program, kurikulum, dan CTA.' },
  { key: 'psb', label: 'PSB', route: '/psb', description: 'Hero, syarat, gelombang, lokasi, dan CTA pendaftaran.' },
  { key: 'kontak', label: 'Kontak', route: '/kontak', description: 'Hero, info kontak, form pesan, dan peta lokasi.' },
];

const livePreviewPageOptions: Array<{
  key: WebsiteBuilderLivePreviewTarget;
  label: string;
  route: string;
}> = [{ key: 'home', label: 'Home', route: '/' }, ...builderPageOptions.map((page) => ({
  key: page.key,
  label: page.label,
  route: page.route,
}))];

const livePreviewViewportOptions: Array<{
  key: WebsiteBuilderLivePreviewViewport;
  label: string;
}> = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'mobile', label: 'Mobile' },
];

const revisionActionLabels: Record<WebsiteBuilderRevision['action'], string> = {
  'save-draft': 'Simpan Draft',
  publish: 'Publish',
  'rollback-draft': 'Pulihkan Draft',
  'rollback-publish': 'Pulihkan Publish',
};

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

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

const defaultHeroSlide: HeroSlideDraft = {
  title: 'Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan',
  subtitle: 'Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.',
  image_url: '/assets/img/gedung.webp',
};

function getSectionStringSetting(section: HomeSection, key: string, fallback = '') {
  const value = section.settings[key];
  return typeof value === 'string' ? value : fallback;
}

function getSectionNumberSetting(section: HomeSection, key: string, fallback: number) {
  const value = section.settings[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getSectionBooleanSetting(section: HomeSection, key: string, fallback: boolean) {
  const value = section.settings[key];
  return typeof value === 'boolean' ? value : fallback;
}

function getHeroSlidesDraft(section: HomeSection): HeroSlideDraft[] {
  const rawSlides = Array.isArray(section.settings.slides) ? section.settings.slides : [];
  const slides = rawSlides
    .filter((slide) => slide && typeof slide === 'object')
    .map((slide) => {
      const record = slide as Record<string, unknown>;
      return {
        title: typeof record.title === 'string' ? record.title : '',
        subtitle: typeof record.subtitle === 'string' ? record.subtitle : '',
        image_url: typeof record.image_url === 'string' ? record.image_url : '',
      };
    });

  if (slides.length > 0) return slides;

  return [
    {
      title: getSectionStringSetting(section, 'title', defaultHeroSlide.title),
      subtitle: getSectionStringSetting(section, 'subtitle', defaultHeroSlide.subtitle),
      image_url: getSectionStringSetting(section, 'image_url', defaultHeroSlide.image_url),
    },
  ];
}

function syncSectionFromPrimaryHeroSlide(section: HomeSection, slide: HeroSlideDraft): HomeSection {
  let next = updateSectionSetting(section, 'title', slide.title);
  next = updateSectionSetting(next, 'subtitle', slide.subtitle);
  next = updateSectionSetting(next, 'image_url', slide.image_url);
  return next;
}

function updateHeroSlides(section: HomeSection, updater: (slides: HeroSlideDraft[]) => HeroSlideDraft[]): HomeSection {
  const currentSlides = getHeroSlidesDraft(section);
  const nextSlides = updater(cloneValue(currentSlides)).map((slide) => ({
    title: slide.title,
    subtitle: slide.subtitle,
    image_url: slide.image_url,
  }));
  const safeSlides = nextSlides.length > 0 ? nextSlides : [cloneValue(defaultHeroSlide)];
  let nextSection = updateSectionSetting(section, 'slides', safeSlides);
  nextSection = syncSectionFromPrimaryHeroSlide(nextSection, safeSlides[0]);
  return nextSection;
}

function updateHeroSlideField(section: HomeSection, index: number, key: keyof HeroSlideDraft, value: string): HomeSection {
  return updateHeroSlides(section, (slides) => {
    if (!slides[index]) return slides;
    slides[index] = { ...slides[index], [key]: value };
    return slides;
  });
}

function addHeroSlide(section: HomeSection): HomeSection {
  return updateHeroSlides(section, (slides) => [...slides, cloneValue(defaultHeroSlide)]);
}

function removeHeroSlide(section: HomeSection, index: number): HomeSection {
  return updateHeroSlides(section, (slides) => slides.filter((_, slideIndex) => slideIndex !== index));
}

function moveHeroSlide(section: HomeSection, index: number, direction: 'up' | 'down'): HomeSection {
  return updateHeroSlides(section, (slides) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return slides;
    [slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]];
    return slides;
  });
}

function getHeroButtonsDraft(section: HomeSection) {
  const rawButtons = Array.isArray(section.settings.buttons) ? section.settings.buttons : [];
  const defaultButtons = [
    { label: 'Lihat Info PSB', url: '/psb', style: 'primary' as const },
    { label: 'Lihat Program', url: '/program', style: 'secondary' as const },
  ];

  return [0, 1].map((index) => {
    const record = rawButtons[index] && typeof rawButtons[index] === 'object' ? (rawButtons[index] as Record<string, unknown>) : {};
    return {
      label: typeof record.label === 'string' ? record.label : defaultButtons[index].label,
      url: typeof record.url === 'string' ? record.url : defaultButtons[index].url,
      style:
        record.style === 'secondary' || record.style === 'ghost' || record.style === 'light' || record.style === 'primary'
          ? record.style
          : defaultButtons[index].style,
    };
  });
}

function updateHeroButtonField(section: HomeSection, index: number, key: 'label' | 'url' | 'style', value: string): HomeSection {
  const buttons = getHeroButtonsDraft(section);
  buttons[index] = {
    ...buttons[index],
    [key]: value,
  };
  return updateSectionSetting(section, 'buttons', buttons);
}

function getDefaultLimit(type: HomeSectionType) {
  switch (type) {
    case 'programs':
    case 'extracurriculars':
      return 4;
    case 'gallery':
    case 'videos':
    case 'news':
    case 'agendas':
      return 3;
    default:
      return 3;
  }
}

function formatBuilderDateLabel(value?: string | null) {
  if (!value) return '';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return '';
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBuilderDateTimeLabel(value?: string | null) {
  if (!value) return '';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return '';
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createContentCatalog(
  newsItems: News[],
  agendaItems: Agenda[],
  galleryItems: GalleryItem[],
  videoItems: Video[],
  programItems: Program[]
): BuilderContentCatalog {
  const groupedGallery = new Map<string, GalleryItem[]>();
  for (const item of galleryItems) {
    const key = item.album_slug || item.album_name || `single-${item.id}`;
    const current = groupedGallery.get(key) || [];
    current.push(item);
    groupedGallery.set(key, current);
  }

  const groupedVideos = new Map<string, Video[]>();
  for (const item of videoItems) {
    const key = item.series_slug || item.series_name || `single-${item.id}`;
    const current = groupedVideos.get(key) || [];
    current.push(item);
    groupedVideos.set(key, current);
  }

  const sortedPrograms = [...programItems].sort((a, b) => {
    const orderDiff = (a.order_index ?? 0) - (b.order_index ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.title.localeCompare(b.title);
  });

  const mapProgramOption = (item: Program, fallbackMeta: string) => ({
    id: String(item.id),
    label: item.title,
    meta: item.excerpt || item.slug || fallbackMeta,
  });

  return {
    news: newsItems.map((item) => ({
      id: String(item.id),
      label: item.title,
      meta: formatBuilderDateLabel(item.created_at) || item.slug || 'Berita',
    })),
    agendas: agendaItems.map((item) => ({
      id: String(item.id),
      label: item.title,
      meta: [formatBuilderDateLabel(item.start_date), item.location].filter(Boolean).join(' • ') || 'Agenda',
    })),
    gallery: Array.from(groupedGallery.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort((a, b) => Number(b.is_album_cover) - Number(a.is_album_cover));
        const cover = sorted[0];
        return {
          id: cover.album_slug || key,
          label: formatGalleryAlbumTitle(cover.album_name || cover.title),
          meta: `${items.length} foto`,
          sortTs: getGallerySortTimestamp(cover.event_date, cover.created_at),
        };
      })
      .sort((a, b) => b.sortTs - a.sortTs)
      .map((item) => ({
        id: item.id,
        label: item.label,
        meta: item.meta,
      })),
    videos: Array.from(groupedVideos.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        const lead = sorted[0];
        return {
          id: lead.series_slug || key,
          label: formatGalleryAlbumTitle(lead.series_name || lead.title),
          meta: `${items.length} video`,
          sortTs: getGallerySortTimestamp(lead.event_date, lead.created_at),
        };
      })
      .sort((a, b) => b.sortTs - a.sortTs)
      .map((item) => ({
        id: item.id,
        label: item.label,
        meta: item.meta,
      })),
    programs: sortedPrograms
      .filter((item) => item.category === 'program')
      .map((item) => mapProgramOption(item, 'Program Inti')),
    extracurriculars: sortedPrograms
      .filter((item) => item.category === 'ekskul')
      .map((item) => mapProgramOption(item, 'Ekstrakurikuler')),
  };
}

function isManualSourceBlockType(type: HomeSectionType): type is ManualSourceBlockType {
  return (
    type === 'news' ||
    type === 'agendas' ||
    type === 'gallery' ||
    type === 'videos' ||
    type === 'programs' ||
    type === 'extracurriculars'
  );
}

function getSectionSource(section: HomeSection) {
  const value = section.settings.source;
  return value === 'manual' ? 'manual' : 'latest';
}

function getSectionManualIds(section: HomeSection) {
  const value = section.settings.manual_ids;
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function updateSectionManualIds(section: HomeSection, ids: string[]) {
  return updateSectionSetting(section, 'manual_ids', ids);
}

function toggleSectionManualId(section: HomeSection, id: string) {
  const currentIds = getSectionManualIds(section);
  const nextIds = currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id];
  return updateSectionManualIds(section, nextIds);
}

function moveSectionManualId(section: HomeSection, id: string, direction: 'up' | 'down') {
  const currentIds = [...getSectionManualIds(section)];
  const index = currentIds.indexOf(id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= currentIds.length) return section;
  [currentIds[index], currentIds[targetIndex]] = [currentIds[targetIndex], currentIds[index]];
  return updateSectionManualIds(section, currentIds);
}

function getVariantOptions(section: HomeSection): Array<{ value: string; label: string }> {
  switch (section.type) {
    case 'hero':
      return [
        { value: 'slider', label: 'Hero Slider' },
        { value: 'photo-single', label: 'Foto Tunggal' },
        { value: 'split', label: 'Split' },
        { value: 'psb-campaign', label: 'PSB Campaign' },
        { value: 'minimal', label: 'Minimal' },
      ];
    case 'news':
      return [
        { value: 'featured-side', label: 'Featured Side' },
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ];
    case 'agendas':
      return [
        { value: 'featured-card', label: 'Featured Card' },
        { value: 'compact-grid', label: 'Compact Grid' },
        { value: 'list', label: 'List' },
      ];
    case 'gallery':
      return [
        { value: 'featured-grid', label: 'Featured Grid' },
        { value: 'cards', label: 'Cards' },
      ];
    case 'videos':
      return [
        { value: 'cards', label: 'Cards' },
        { value: 'spotlight', label: 'Spotlight' },
      ];
    case 'programs':
    case 'extracurriculars':
      return [
        { value: 'featured-grid', label: 'Featured Grid' },
        { value: 'compact-grid', label: 'Compact Grid' },
      ];
    case 'cta':
      return [
        { value: 'gradient', label: 'Gradient' },
        { value: 'panel', label: 'Panel' },
        { value: 'minimal', label: 'Minimal' },
      ];
    default:
      return [{ value: section.variant, label: section.variant }];
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
  onUploadSlideImage,
  contentCatalog,
  uploadingTarget,
  isUploadingImage = false,
}: {
  section: HomeSection;
  onChange: (section: HomeSection) => void;
  onUploadImage?: (file: File) => Promise<void>;
  onUploadSlideImage?: (slideIndex: number, file: File) => Promise<void>;
  contentCatalog: BuilderContentCatalog;
  uploadingTarget?: string | null;
  isUploadingImage?: boolean;
}) {
  const title = getSectionStringSetting(section, 'title');
  const subtitle = getSectionStringSetting(section, 'subtitle');
  const eyebrow = getSectionStringSetting(section, 'eyebrow');
  const buttonLabel = getSectionStringSetting(section, 'button_label');
  const buttonUrl = getSectionStringSetting(section, 'button_url');
  const imageUrl = getSectionStringSetting(section, 'image_url');
  const heroSlides = getHeroSlidesDraft(section);
  const heroButtons = getHeroButtonsDraft(section);
  const secondaryButtonLabel = getSectionStringSetting(section, 'secondary_button_label');
  const secondaryButtonUrl = getSectionStringSetting(section, 'secondary_button_url');
  const kicker = getSectionStringSetting(section, 'kicker');
  const limit = getSectionNumberSetting(section, 'limit', getDefaultLimit(section.type));
  const featuredFirst = getSectionBooleanSetting(section, 'featured_first', true);
  const showDate = getSectionBooleanSetting(section, 'show_date', true);
  const showLocation = getSectionBooleanSetting(section, 'show_location', true);
  const overlay = getSectionStringSetting(section, 'overlay', 'medium');
  const mobileHeight = getSectionStringSetting(section, 'mobile_height', 'compact');
  const textPosition = getSectionStringSetting(section, 'text_position', 'left-top');
  const showGenericText = !['info-cards', 'spacer'].includes(section.type);
  const showButtonFields = !['info-cards', 'spacer'].includes(section.type);
  const showEyebrowField = !['info-cards', 'spacer'].includes(section.type);
  const showLimitField = ['programs', 'extracurriculars', 'gallery', 'videos', 'news', 'agendas'].includes(section.type);
  const showNewsFields = section.type === 'news';
  const showAgendaFields = section.type === 'agendas';
  const showCtaFields = section.type === 'cta';
  const showHeroFields = section.type === 'hero';
  const showSourceSelector = isManualSourceBlockType(section.type);
  const manualSourceType: ManualSourceBlockType | null = showSourceSelector ? (section.type as ManualSourceBlockType) : null;
  const source = getSectionSource(section);
  const manualIds = getSectionManualIds(section);
  const selectableOptions: BuilderContentOption[] = manualSourceType ? contentCatalog[manualSourceType] : [];
  const selectedManualOptions = manualIds
    .map((id) => selectableOptions.find((item) => item.id === id))
    .filter((item): item is BuilderContentOption => Boolean(item));
  const variantOptions = getVariantOptions(section);

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
            {variantOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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

      {showEyebrowField ? (
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Eyebrow / Label Kecil</span>
          <input
            value={showHeroFields ? kicker : eyebrow}
            onChange={(event) =>
              onChange(updateSectionSetting(section, showHeroFields ? 'kicker' : 'eyebrow', event.target.value))
            }
            placeholder={showHeroFields ? 'Darussunnah Parung' : 'Berita Pondok / Agenda / Program'}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
          />
        </label>
      ) : null}

      {showGenericText ? (
        <>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Judul</span>
            <input
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                const next = updateSectionSetting(section, 'title', nextTitle);
                onChange(showHeroFields ? updatePrimaryHeroSlide(next, 'title', nextTitle) : next);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subtitle / Deskripsi</span>
            <textarea
              rows={3}
              value={subtitle}
              onChange={(event) => {
                const nextSubtitle = event.target.value;
                const next = updateSectionSetting(section, 'subtitle', nextSubtitle);
                onChange(showHeroFields ? updatePrimaryHeroSlide(next, 'subtitle', nextSubtitle) : next);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
            />
          </label>
        </>
      ) : null}

      {showHeroFields ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <ImageUploadField
                label="Gambar Hero Utama"
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
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Overlay</span>
                <select
                  value={overlay}
                  onChange={(event) => onChange(updateSectionSetting(section, 'overlay', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                >
                  <option value="none">Tanpa Overlay</option>
                  <option value="soft">Soft</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tinggi Hero Mobile</span>
                <select
                  value={mobileHeight}
                  onChange={(event) => onChange(updateSectionSetting(section, 'mobile_height', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="tall">Tall</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Posisi Konten</span>
                <select
                  value={textPosition}
                  onChange={(event) => onChange(updateSectionSetting(section, 'text_position', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                >
                  <option value="left-top">Kiri</option>
                  <option value="center">Tengah</option>
                  <option value="right">Kanan</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Hero Slides</p>
                <p className="mt-1 text-sm text-slate-500">Tambah beberapa slide untuk variant `slider`, atau tetap satu slide untuk model lain.</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(addHeroSlide(section))}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
              >
                <Plus size={14} /> Tambah Slide
              </button>
            </div>
            <div className="space-y-4">
              {heroSlides.map((slide, index) => (
                <div key={`${section.id}-slide-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Slide {index + 1}</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{slide.title || 'Judul slide belum diisi'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onChange(moveHeroSlide(section, index, 'up'))} className="rounded-lg bg-slate-50 p-2 text-slate-500" disabled={index === 0}>
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => onChange(moveHeroSlide(section, index, 'down'))} className="rounded-lg bg-slate-50 p-2 text-slate-500" disabled={index === heroSlides.length - 1}>
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => onChange(removeHeroSlide(section, index))}
                        className="rounded-lg bg-rose-50 p-2 text-rose-600"
                        disabled={heroSlides.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Judul Slide</span>
                      <input
                        value={slide.title}
                        onChange={(event) => onChange(updateHeroSlideField(section, index, 'title', event.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subtitle Slide</span>
                      <textarea
                        rows={3}
                        value={slide.subtitle}
                        onChange={(event) => onChange(updateHeroSlideField(section, index, 'subtitle', event.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
                      />
                    </label>
                    <ImageUploadField
                      label={`Gambar Slide ${index + 1}`}
                      value={slide.image_url}
                      onChange={(value) => onChange(updateHeroSlideField(section, index, 'image_url', value))}
                      onUpload={async (file) => {
                        if (!onUploadSlideImage) return;
                        await onUploadSlideImage(index, file);
                      }}
                      isUploading={uploadingTarget === `section-${section.id}-slide-${index}-image`}
                      placeholder="/uploads/hero-slide.jpg atau /assets/img/gedung.webp"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Tombol Hero</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tombol Utama</span>
                <input
                  value={heroButtons[0].label}
                  onChange={(event) => onChange(updateHeroButtonField(section, 0, 'label', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Tombol Utama</span>
                <input
                  value={heroButtons[0].url}
                  onChange={(event) => onChange(updateHeroButtonField(section, 0, 'url', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Style Tombol Utama</span>
                <select
                  value={heroButtons[0].style}
                  onChange={(event) => onChange(updateHeroButtonField(section, 0, 'style', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="ghost">Ghost</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <div />
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tombol Kedua</span>
                <input
                  value={heroButtons[1].label}
                  onChange={(event) => onChange(updateHeroButtonField(section, 1, 'label', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Tombol Kedua</span>
                <input
                  value={heroButtons[1].url}
                  onChange={(event) => onChange(updateHeroButtonField(section, 1, 'url', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Style Tombol Kedua</span>
                <select
                  value={heroButtons[1].style}
                  onChange={(event) => onChange(updateHeroButtonField(section, 1, 'style', event.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="ghost">Ghost</option>
                  <option value="light">Light</option>
                </select>
              </label>
            </div>
          </div>
        </>
      ) : null}

      {showLimitField ? (
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Jumlah Item</span>
          <input
            type="number"
            min={1}
            max={12}
            value={limit}
            onChange={(event) =>
              onChange(updateSectionSetting(section, 'limit', Math.max(1, Number(event.target.value) || getDefaultLimit(section.type))))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
          />
        </label>
      ) : null}

      {showSourceSelector ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sumber Data</span>
            <select
              value={source}
              onChange={(event) => onChange(updateSectionSetting(section, 'source', event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
            >
              <option value="latest">Otomatis Terbaru</option>
              <option value="manual">Pilih Manual</option>
            </select>
          </label>

          {source === 'manual' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Urutan Item Terpilih</p>
                {selectedManualOptions.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedManualOptions.map((item, index) => (
                      <div key={`${section.id}-manual-${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900">{item.label}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{item.meta}</p>
                        </div>
                        <button onClick={() => onChange(moveSectionManualId(section, item.id, 'up'))} className="rounded-lg bg-white p-2 text-slate-500" disabled={index === 0}>
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => onChange(moveSectionManualId(section, item.id, 'down'))} className="rounded-lg bg-white p-2 text-slate-500" disabled={index === selectedManualOptions.length - 1}>
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => onChange(toggleSectionManualId(section, item.id))} className="rounded-lg bg-rose-50 p-2 text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Belum ada item dipilih. Centang item di daftar bawah.</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Pilih Item</p>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {selectableOptions.length > 0 ? (
                    selectableOptions.map((option) => {
                      const checked = manualIds.includes(option.id);
                      return (
                        <label
                          key={`${section.id}-option-${option.id}`}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                            checked ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onChange(toggleSectionManualId(section, option.id))}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">{option.meta}</p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      Belum ada data tersedia untuk dipilih.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Block ini akan mengambil item terbaru secara otomatis dari data website.</p>
          )}
        </div>
      ) : null}

      {showNewsFields ? (
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <span className="font-black text-slate-900">Jadikan item pertama sebagai featured</span>
          <input
            type="checkbox"
            checked={featuredFirst}
            onChange={(event) => onChange(updateSectionSetting(section, 'featured_first', event.target.checked))}
          />
        </label>
      ) : null}

      {showAgendaFields ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="font-black text-slate-900">Tampilkan Tanggal</span>
            <input
              type="checkbox"
              checked={showDate}
              onChange={(event) => onChange(updateSectionSetting(section, 'show_date', event.target.checked))}
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="font-black text-slate-900">Tampilkan Lokasi</span>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(event) => onChange(updateSectionSetting(section, 'show_location', event.target.checked))}
            />
          </label>
        </div>
      ) : null}

      {showButtonFields && !showHeroFields ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Label Tombol</span>
            <input
              value={buttonLabel}
              onChange={(event) => onChange(updateSectionSetting(section, 'button_label', event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Tombol</span>
            <input
              value={buttonUrl}
              onChange={(event) => onChange(updateSectionSetting(section, 'button_url', event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
        </div>
      ) : null}

      {showCtaFields ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Label Tombol Kedua</span>
            <input
              value={secondaryButtonLabel}
              onChange={(event) => onChange(updateSectionSetting(section, 'secondary_button_label', event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">URL Tombol Kedua</span>
            <input
              value={secondaryButtonUrl}
              onChange={(event) => onChange(updateSectionSetting(section, 'secondary_button_url', event.target.value))}
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
  const [contentCatalog, setContentCatalog] = useState<BuilderContentCatalog>({
    news: [],
    agendas: [],
    gallery: [],
    videos: [],
    programs: [],
    extracurriculars: [],
  });
  const [previewCollections, setPreviewCollections] = useState<BuilderPreviewCollections>({
    news: [],
    agendas: [],
    gallery: [],
    videos: [],
    programs: [],
  });
  const [activeArea, setActiveArea] = useState<BuilderArea>('Home');
  const [themeDraft, setThemeDraft] = useState<WebsiteBuilderTheme>(defaultWebsiteBuilderTheme);
  const [shellDraft, setShellDraft] = useState<WebsiteBuilderShell>(defaultWebsiteBuilderShell);
  const [homeDraft, setHomeDraft] = useState<HomeBuilderLayout>(freshHomeLayout());
  const [pagesDraft, setPagesDraft] = useState<WebsiteBuilderPages>(defaultWebsiteBuilderPages);
  const [livePreviewPage, setLivePreviewPage] = useState<WebsiteBuilderLivePreviewTarget>('home');
  const [livePreviewViewport, setLivePreviewViewport] = useState<WebsiteBuilderLivePreviewViewport>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState(defaultHomeBuilderLayout.sections[0]?.id || '');
  const [selectedPageKey, setSelectedPageKey] = useState<BuilderPageKey>('profil');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<WebsiteBuilderRevision[]>([]);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [draggingShellItem, setDraggingShellItem] = useState<{ listKey: ShellListKey; index: number } | null>(null);
  const [dragOverShellItem, setDragOverShellItem] = useState<{ listKey: ShellListKey; index: number } | null>(null);
  const { showToast } = useToast();

  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);
  const selectedSection = homeDraft.sections.find((section) => section.id === selectedSectionId) || homeDraft.sections[0] || null;
  const selectedPageOption = builderPageOptions.find((page) => page.key === selectedPageKey) || builderPageOptions[0];
  const draftSectionCount = homeDraft.sections.filter((section) => section.enabled).length;
  const publishedSectionCount = builderState.homePublished.sections.filter((section) => section.enabled).length;
  const deferredThemeDraft = useDeferredValue(themeDraft);
  const deferredShellDraft = useDeferredValue(shellDraft);
  const deferredHomeDraft = useDeferredValue(homeDraft);
  const deferredPagesDraft = useDeferredValue(pagesDraft);

  const syncFromSettings = useCallback((settingsMap: Record<string, string>) => {
    const state = parseWebsiteBuilderState(settingsMap);
    setThemeDraft(state.themeDraft);
    setShellDraft(state.shellDraft);
    setHomeDraft(state.homeDraft);
    setPagesDraft(state.pagesDraft);
    setRevisions(state.revisions);
    setSelectedSectionId((current) =>
      state.homeDraft.sections.some((section) => section.id === current)
        ? current
        : state.homeDraft.sections[0]?.id || ''
    );
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsMap, newsItems, agendaItems, galleryResult, videosResult, programItems] = await Promise.all([
        getSettingsMap(),
        getNews(),
        getAgendas(),
        getGallery({ limit: 60, offset: 0 }),
        getVideos({ limit: 60, offset: 0 }),
        getPrograms(),
      ]);
      setSettings(settingsMap);
      syncFromSettings(settingsMap);
      setContentCatalog(
        createContentCatalog(
          newsItems,
          agendaItems,
          galleryResult.data || [],
          videosResult.data || [],
          Array.isArray(programItems) ? programItems : []
        )
      );
      setPreviewCollections({
        news: newsItems,
        agendas: agendaItems,
        gallery: galleryResult.data || [],
        videos: videosResult.data || [],
        programs: Array.isArray(programItems) ? programItems : [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [syncFromSettings]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeArea === 'Home') {
      setLivePreviewPage('home');
      return;
    }

    if (activeArea === 'Pages') {
      setLivePreviewPage(selectedPageKey);
    }
  }, [activeArea, selectedPageKey]);

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

  const persistBuilderSettings = useCallback(async (entries: Array<[string, string]>) => {
    await updateSettingsBatch(entries.map(([key, value]) => ({ key, value })));
  }, []);

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const nextHome = { ...homeDraft, updated_at: new Date().toISOString() };
      const nextPages = cloneValue(pagesDraft);
      const snapshot = createWebsiteBuilderSnapshot({
        theme: themeDraft,
        shell: shellDraft,
        home: nextHome,
        pages: nextPages,
      });
      const nextRevisions = appendWebsiteBuilderRevision(
        revisions,
        createWebsiteBuilderRevision({
          action: 'save-draft',
          label: 'Simpan Draft Website Builder',
          snapshot,
        })
      );
      await persistBuilderSettings([
        [WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(themeDraft)],
        [WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(shellDraft)],
        [WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(nextHome)],
        [WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(nextPages)],
        [WEBSITE_BUILDER_KEYS.revisions, serializeBuilderJson(nextRevisions)],
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
      const nextPages = cloneValue(pagesDraft);
      const snapshot = createWebsiteBuilderSnapshot({
        theme: themeDraft,
        shell: shellDraft,
        home: nextHome,
        pages: nextPages,
      });
      const nextRevisions = appendWebsiteBuilderRevision(
        revisions,
        createWebsiteBuilderRevision({
          action: 'publish',
          label: enableAfterPublish ? 'Publish & Aktifkan Website Builder' : 'Publish Website Builder',
          snapshot,
        })
      );
      await persistBuilderSettings([
        [WEBSITE_BUILDER_KEYS.themePublished, serializeBuilderJson(themeDraft)],
        [WEBSITE_BUILDER_KEYS.shellPublished, serializeBuilderJson(shellDraft)],
        [WEBSITE_BUILDER_KEYS.homePublished, serializeBuilderJson(nextHome)],
        [WEBSITE_BUILDER_KEYS.pagesPublished, serializeBuilderJson(nextPages)],
        [WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(themeDraft)],
        [WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(shellDraft)],
        [WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(nextHome)],
        [WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(nextPages)],
        [WEBSITE_BUILDER_KEYS.revisions, serializeBuilderJson(nextRevisions)],
        ...(enableAfterPublish ? [[WEBSITE_BUILDER_KEYS.enabled, 'true'] as [string, string]] : []),
      ]);
      showToast('success', enableAfterPublish ? 'Website Builder berhasil dipublish dan diaktifkan.' : 'Konfigurasi builder berhasil dipublish.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal mempublish konfigurasi builder.');
    } finally {
      setIsPublishing(false);
    }
  };

  const restoreRevision = async (revision: WebsiteBuilderRevision, publish: boolean) => {
    setRestoringRevisionId(revision.id);
    try {
      const snapshot = cloneValue(revision.snapshot);
      const nextRevisions = appendWebsiteBuilderRevision(
        revisions,
        createWebsiteBuilderRevision({
          action: publish ? 'rollback-publish' : 'rollback-draft',
          label: publish
            ? `Pulihkan & Publish dari ${revisionActionLabels[revision.action]}`
            : `Pulihkan Draft dari ${revisionActionLabels[revision.action]}`,
          snapshot,
        })
      );

      const entries: Array<[string, string]> = publish
        ? [
            [WEBSITE_BUILDER_KEYS.themePublished, serializeBuilderJson(snapshot.theme)],
            [WEBSITE_BUILDER_KEYS.shellPublished, serializeBuilderJson(snapshot.shell)],
            [WEBSITE_BUILDER_KEYS.homePublished, serializeBuilderJson(snapshot.home)],
            [WEBSITE_BUILDER_KEYS.pagesPublished, serializeBuilderJson(snapshot.pages)],
            [WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(snapshot.theme)],
            [WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(snapshot.shell)],
            [WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(snapshot.home)],
            [WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(snapshot.pages)],
            [WEBSITE_BUILDER_KEYS.revisions, serializeBuilderJson(nextRevisions)],
            [WEBSITE_BUILDER_KEYS.enabled, 'true'],
          ]
        : [
            [WEBSITE_BUILDER_KEYS.themeDraft, serializeBuilderJson(snapshot.theme)],
            [WEBSITE_BUILDER_KEYS.shellDraft, serializeBuilderJson(snapshot.shell)],
            [WEBSITE_BUILDER_KEYS.homeDraft, serializeBuilderJson(snapshot.home)],
            [WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(snapshot.pages)],
            [WEBSITE_BUILDER_KEYS.revisions, serializeBuilderJson(nextRevisions)],
          ];

      await persistBuilderSettings(entries);
      showToast(
        'success',
        publish ? 'Revision berhasil dipulihkan dan dipublish.' : 'Revision berhasil dipulihkan ke draft.'
      );
      await fetchData();
    } catch {
      showToast('error', 'Gagal memulihkan revision Website Builder.');
    } finally {
      setRestoringRevisionId(null);
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
    setPagesDraft(defaultWebsiteBuilderPages);
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

  const duplicateShellListItem = useCallback((listKey: ShellListKey, index: number) => {
    setShellDraft((current) => {
      const items = [...readShellList(current, listKey)];
      const sourceItem = items[index];
      if (!sourceItem) return current;
      const duplicateItem = {
        ...sourceItem,
        label: sourceItem.label ? `${sourceItem.label} Copy` : 'Item Copy',
      };
      items.splice(index + 1, 0, duplicateItem);
      return writeShellList(current, listKey, items);
    });
    showToast('success', 'Item berhasil diduplikasi.');
  }, [showToast]);

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
              className={`grid gap-3 rounded-xl border p-3 transition-all md:grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] ${
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
              <button onClick={() => duplicateShellListItem(listKey, index)} className="rounded-lg bg-white p-2 text-slate-500" title="Duplikat item">
                <Copy size={14} />
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
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 shadow-[0_18px_40px_-32px_rgba(5,150,105,0.35)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Workflow Utama</p>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                  Simpan dulu sebagai draft, lalu publish saat sudah yakin. Tombol paling kanan akan langsung mem-publish sekaligus mengaktifkan hasilnya di website publik.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={saveDraft} disabled={isSavingDraft} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:opacity-60">
                    {isSavingDraft ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan Draft
                  </button>
                  <button onClick={() => void publishDraft(false)} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60">
                    {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    Publish Saja
                  </button>
                  <button onClick={() => void publishDraft(true)} disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-60">
                    <CheckCircle2 size={16} />
                    Publish & Aktifkan
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.22)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Preview & Utilitas</p>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                  Untuk cek hasil di tab terpisah, membandingkan draft dengan versi live, atau mengatur status builder tanpa menyentuh isi draft.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => window.open('/builder-preview/home', '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                  >
                    <Eye size={16} />
                    Buka Preview Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('/builder-compare/home', '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <Columns2 size={16} />
                    Bandingkan Draft
                  </button>
                  <button onClick={() => void toggleBuilder(!builderState.enabled)} disabled={isToggling} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                    {isToggling ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                    {builderState.enabled ? 'Nonaktifkan Builder' : 'Aktifkan Builder'}
                  </button>
                  <button onClick={resetDefault} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50">
                    Reset Default
                  </button>
                </div>
              </div>
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
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pages Builder</p>
                <p className="mt-1 font-black text-slate-900">{builderPageOptions.length} halaman siap edit</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Revision</p>
                <p className="mt-1 font-black text-slate-900">{revisions.length} snapshot tersimpan</p>
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

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)] lg:p-8">
          <div className="min-w-0 space-y-6">
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
                  onUploadSlideImage={async (slideIndex, file) => {
                    const uploadedUrl = await uploadBuilderAsset(`section-${selectedSection.id}-slide-${slideIndex}-image`, file);
                    if (!uploadedUrl) return;
                    updateSelectedSection(updateHeroSlideField(selectedSection, slideIndex, 'image_url', uploadedUrl));
                  }}
                  contentCatalog={contentCatalog}
                  uploadingTarget={uploadingTarget}
                  isUploadingImage={uploadingTarget === `section-${selectedSection.id}-image`}
                />
              ) : null}
            </div>
          ) : null}

          {activeArea === 'Pages' ? (
            <div className="grid gap-6 xl:grid-cols-[0.35fr_0.65fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Pilih Halaman</p>
                  <div className="mt-4 space-y-3">
                    {builderPageOptions.map((page) => (
                      <button
                        key={page.key}
                        type="button"
                        onClick={() => setSelectedPageKey(page.key)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selectedPageKey === page.key
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{page.route}</p>
                        <p className="mt-2 text-base font-black">{page.label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{page.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Preview Halaman</p>
                  <h4 className="mt-2 text-lg font-black text-slate-950">{selectedPageOption.label}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Cek draft untuk halaman terpilih sebelum di-live-kan, atau bandingkan dengan versi published saat ini.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => window.open(`/builder-preview/${selectedPageKey}`, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                    >
                      <Eye size={14} />
                      Preview Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/builder-compare/${selectedPageKey}`, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Columns2 size={14} />
                      Bandingkan
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Page Builder</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">{selectedPageOption.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{selectedPageOption.description}</p>
                </div>

                <PageBuilderEditor
                  pageKey={selectedPageKey}
                  pagesDraft={pagesDraft}
                  onChange={setPagesDraft}
                  onUploadImage={async (target, file) => uploadBuilderAsset(target, file)}
                  uploadingTarget={uploadingTarget}
                />
              </div>
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

          {activeArea === 'Revisions' ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Riwayat Builder</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Snapshot Draft dan Publish</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                  Setiap simpan draft, publish, dan rollback akan masuk ke riwayat. Kamu bisa memulihkan snapshot lama ke draft saja atau langsung ke published.
                </p>
              </div>

              {revisions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-sm font-medium text-slate-500">
                  Belum ada revision tersimpan. Simpan draft atau publish dulu supaya snapshot pertama tercatat di sini.
                </div>
              ) : (
                <div className="space-y-4">
                  {revisions.map((revision) => {
                    const isRestoring = restoringRevisionId === revision.id;
                    const homeCount = revision.snapshot.home.sections.filter((section) => section.enabled).length;

                    return (
                      <div
                        key={revision.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                                {revisionActionLabels[revision.action]}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                {formatBuilderDateTimeLabel(revision.created_at)}
                              </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-950">{revision.label}</h4>
                            <p className="text-sm text-slate-500">
                              Snapshot berisi {homeCount} block Home aktif dan {builderPageOptions.length} halaman builder.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => void restoreRevision(revision, false)}
                              disabled={Boolean(restoringRevisionId)}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                              Pulihkan ke Draft
                            </button>
                            <button
                              type="button"
                              onClick={() => void restoreRevision(revision, true)}
                              disabled={Boolean(restoringRevisionId)}
                              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                            >
                              {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                              Pulihkan & Publish
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          </div>

          <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Live Preview</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">Preview Real-Time di Dalam Admin</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Semua perubahan draft langsung dirender di sini, tanpa perlu simpan dulu. Preview ini visual-only supaya admin tidak kepindah halaman saat mengecek layout.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Halaman Preview</p>
                <div className="flex flex-wrap gap-2">
                  {livePreviewPageOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setLivePreviewPage(option.key)}
                      className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                        livePreviewPage === option.key
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/20'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Viewport</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {livePreviewViewportOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setLivePreviewViewport(option.key)}
                      className={`rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${
                        livePreviewViewport === option.key
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <WebsiteBuilderLivePreview
                previewTarget={livePreviewPage}
                viewport={livePreviewViewport}
                settings={settings}
                theme={deferredThemeDraft}
                shell={deferredShellDraft}
                home={deferredHomeDraft}
                pages={deferredPagesDraft}
                dataSources={previewCollections}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
