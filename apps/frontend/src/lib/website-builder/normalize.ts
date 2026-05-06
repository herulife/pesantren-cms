import { SettingsMap } from '@/lib/api';
import {
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderPages,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
} from './defaults';
import {
  BuilderButton,
  BuilderButtonStyle,
  BuilderFactItem,
  BuilderImageCard,
  BuilderStatItem,
  ContactPageBuilderContent,
  HomeBuilderLayout,
  HomeSection,
  HomeSectionType,
  NavbarMenuItem,
  ProfilPageBuilderContent,
  ProgramPageBuilderContent,
  PsbPageBuilderContent,
  PsbWaveItem,
  WEBSITE_BUILDER_KEYS,
  WebsiteBuilderPages,
  WebsiteBuilderRevision,
  WebsiteBuilderRevisionAction,
  WebsiteBuilderShell,
  WebsiteBuilderSnapshot,
  WebsiteBuilderState,
  WebsiteBuilderTheme,
} from './types';

type PlainRecord = Record<string, unknown>;

const homeSectionTypes: HomeSectionType[] = [
  'hero',
  'info-cards',
  'profile',
  'programs',
  'extracurriculars',
  'gallery',
  'videos',
  'news',
  'agendas',
  'cta',
  'welcome',
  'facilities',
  'testimonials',
  'faq',
  'donation-cta',
  'custom-content',
  'spacer',
];

const buttonStyles: BuilderButtonStyle[] = ['primary', 'secondary', 'ghost', 'light'];
const revisionActions: WebsiteBuilderRevisionAction[] = [
  'save-draft',
  'publish',
  'rollback-draft',
  'rollback-publish',
];

const WEBSITE_BUILDER_REVISION_LIMIT = 20;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is PlainRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function asChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function asRecord(value: unknown): PlainRecord {
  return isRecord(value) ? value : {};
}

function safeParseJson(value: string | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeButton(value: unknown, fallback: BuilderButton): BuilderButton {
  const record = asRecord(value);
  return {
    label: asString(record.label, fallback.label),
    url: asString(record.url, fallback.url),
    style: asChoice(record.style, buttonStyles, fallback.style),
  };
}

function normalizeMenuItems(value: unknown, fallback: NavbarMenuItem[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .filter(isRecord)
    .map((item) => ({
      label: asString(item.label).trim(),
      url: asString(item.url).trim(),
    }))
    .filter((item) => item.label && item.url);
  return items.length > 0 ? items : cloneJson(fallback);
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return items.length > 0 ? items : cloneJson(fallback);
}

function normalizeStatItems(value: unknown, fallback: BuilderStatItem[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .filter(isRecord)
    .map((item) => ({
      value: asString(item.value).trim(),
      label: asString(item.label).trim(),
    }))
    .filter((item) => item.value && item.label);
  return items.length > 0 ? items : cloneJson(fallback);
}

function normalizeFactItems(value: unknown, fallback: BuilderFactItem[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .filter(isRecord)
    .map((item) => ({
      label: asString(item.label).trim(),
      value: asString(item.value).trim(),
    }))
    .filter((item) => item.label && item.value);
  return items.length > 0 ? items : cloneJson(fallback);
}

function normalizeImageCards(value: unknown, fallback: BuilderImageCard[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .filter(isRecord)
    .map((item) => ({
      title: asString(item.title).trim(),
      description: asString(item.description).trim(),
      image_url: asString(item.image_url).trim(),
    }))
    .filter((item) => item.title && item.description);
  return items.length > 0 ? items : cloneJson(fallback);
}

function normalizePsbWaves(value: unknown, fallback: PsbWaveItem[]) {
  if (!Array.isArray(value)) return cloneJson(fallback);
  const items = value
    .filter(isRecord)
    .map((item) => ({
      label: asString(item.label).trim(),
      date_text: asString(item.date_text).trim(),
      active: asBoolean(item.active, false),
    }))
    .filter((item) => item.label && item.date_text);
  return items.length > 0 ? items : cloneJson(fallback);
}

export function normalizeWebsiteBuilderTheme(value: unknown): WebsiteBuilderTheme {
  const fallback = cloneJson(defaultWebsiteBuilderTheme);
  const record = asRecord(value);
  const palette = asRecord(record.palette);
  const typography = asRecord(record.typography);
  const shape = asRecord(record.shape);
  const background = asRecord(record.background);

  return {
    version: 1,
    palette: {
      primary: asChoice(palette.primary, ['emerald', 'teal', 'blue', 'amber', 'slate'], fallback.palette.primary),
      accent: asChoice(palette.accent, ['amber', 'lime', 'sky', 'rose', 'emerald'], fallback.palette.accent),
      surface: asChoice(palette.surface, ['slate', 'stone', 'zinc', 'emerald'], fallback.palette.surface),
      tone: asChoice(palette.tone, ['fresh', 'formal', 'warm', 'calm'], fallback.palette.tone),
    },
    typography: {
      heading: asChoice(typography.heading, ['outfit', 'plus-jakarta', 'serif'], fallback.typography.heading),
      body: asChoice(typography.body, ['plus-jakarta', 'outfit', 'serif'], fallback.typography.body),
      scale: asChoice(typography.scale, ['compact', 'normal', 'large'], fallback.typography.scale),
    },
    shape: {
      radius: asChoice(shape.radius, ['soft', 'rounded', 'pill', 'sharp'], fallback.shape.radius),
      shadow: asChoice(shape.shadow, ['none', 'soft', 'bold'], fallback.shape.shadow),
    },
    background: {
      pattern: asChoice(background.pattern, ['none', 'soft-blobs', 'grid', 'gradient'], fallback.background.pattern),
      public_page: asChoice(
        background.public_page,
        ['warm-white', 'clean-white', 'soft-emerald', 'slate'],
        fallback.background.public_page
      ),
    },
  };
}

export function normalizeWebsiteBuilderShell(value: unknown): WebsiteBuilderShell {
  const fallback = cloneJson(defaultWebsiteBuilderShell);
  const record = asRecord(value);
  const navbar = asRecord(record.navbar);
  const navbarMobile = asRecord(navbar.mobile);
  const floating = asRecord(record.floating);
  const whatsapp = asRecord(floating.whatsapp);
  const backToTop = asRecord(floating.back_to_top);
  const footer = asRecord(record.footer);

  return {
    version: 1,
    navbar: {
      enabled: asBoolean(navbar.enabled, fallback.navbar.enabled),
      variant: asChoice(
        navbar.variant,
        ['classic', 'centered', 'compact', 'transparent-over-hero', 'simple'],
        fallback.navbar.variant
      ),
      position: asChoice(navbar.position, ['sticky', 'static', 'transparent-over-hero'], fallback.navbar.position),
      logo_url: asString(navbar.logo_url, fallback.navbar.logo_url),
      show_school_name: asBoolean(navbar.show_school_name, fallback.navbar.show_school_name),
      school_name_override: asString(navbar.school_name_override, fallback.navbar.school_name_override),
      menu_items: normalizeMenuItems(navbar.menu_items, fallback.navbar.menu_items),
      cta: normalizeButton(navbar.cta, fallback.navbar.cta),
      show_login_link: asBoolean(navbar.show_login_link, fallback.navbar.show_login_link),
      mobile: {
        variant: asChoice(navbarMobile.variant, ['drawer', 'sheet', 'bottom-menu'], fallback.navbar.mobile.variant),
        show_cta: asBoolean(navbarMobile.show_cta, fallback.navbar.mobile.show_cta),
      },
    },
    floating: {
      whatsapp: {
        enabled: asBoolean(whatsapp.enabled, fallback.floating.whatsapp.enabled),
        position: asChoice(whatsapp.position, ['bottom-right', 'bottom-left'], fallback.floating.whatsapp.position),
        mobile_offset: asChoice(
          whatsapp.mobile_offset,
          ['default', 'above-bottom-nav'],
          fallback.floating.whatsapp.mobile_offset
        ),
        label: asString(whatsapp.label, fallback.floating.whatsapp.label),
        url: asString(whatsapp.url, fallback.floating.whatsapp.url),
      },
      back_to_top: {
        enabled: asBoolean(backToTop.enabled, fallback.floating.back_to_top.enabled),
        position: asChoice(
          backToTop.position,
          ['above-whatsapp', 'bottom-right', 'bottom-left'],
          fallback.floating.back_to_top.position
        ),
      },
    },
    footer: {
      enabled: asBoolean(footer.enabled, fallback.footer.enabled),
      variant: asChoice(
        footer.variant,
        ['simple', 'columns', 'contact-columns', 'map-contact', 'minimal'],
        fallback.footer.variant
      ),
      logo_url: asString(footer.logo_url, fallback.footer.logo_url),
      description: asString(footer.description, fallback.footer.description),
      quick_links: normalizeMenuItems(footer.quick_links, fallback.footer.quick_links),
      contact_items: normalizeMenuItems(footer.contact_items, fallback.footer.contact_items),
      show_logo: asBoolean(footer.show_logo, fallback.footer.show_logo),
      show_socials: asBoolean(footer.show_socials, fallback.footer.show_socials),
      show_map_link: asBoolean(footer.show_map_link, fallback.footer.show_map_link),
      show_address: asBoolean(footer.show_address, fallback.footer.show_address),
      copyright_text: asString(footer.copyright_text, fallback.footer.copyright_text),
      background: asChoice(footer.background, ['emerald-dark', 'slate-dark', 'light'], fallback.footer.background),
    },
  };
}

export function normalizeHomeBuilderLayout(value: unknown): HomeBuilderLayout {
  const fallback = cloneJson(defaultHomeBuilderLayout);
  const record = asRecord(value);
  const sections = Array.isArray(record.sections)
    ? record.sections
        .filter(isRecord)
        .map((section, index): HomeSection | null => {
          const type = asChoice(section.type, homeSectionTypes, '' as HomeSectionType);
          if (!type) return null;
          return {
            id: asString(section.id, `${type}-${index + 1}`),
            type,
            enabled: asBoolean(section.enabled, true),
            variant: asString(section.variant, 'default'),
            settings: asRecord(section.settings),
          };
        })
        .filter((section): section is HomeSection => Boolean(section))
    : [];

  return {
    version: 1,
    page: 'home',
    updated_at: asString(record.updated_at, fallback.updated_at),
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

function normalizeProfilPage(value: unknown): ProfilPageBuilderContent {
  const fallback = cloneJson(defaultWebsiteBuilderPages.profil);
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const about = asRecord(record.about);
  const vision = asRecord(record.vision);
  const mission = asRecord(record.mission);
  const cta = asRecord(record.cta);

  return {
    version: 1,
    hero: {
      eyebrow: asString(hero.eyebrow, fallback.hero.eyebrow),
      title: asString(hero.title, fallback.hero.title),
      subtitle: asString(hero.subtitle, fallback.hero.subtitle),
      background_image_url: asString(hero.background_image_url, fallback.hero.background_image_url),
      highlights: normalizeStatItems(hero.highlights, fallback.hero.highlights),
    },
    about: {
      eyebrow: asString(about.eyebrow, fallback.about.eyebrow),
      title: asString(about.title, fallback.about.title),
      paragraphs: normalizeStringArray(about.paragraphs, fallback.about.paragraphs),
      location_chip: asString(about.location_chip, fallback.about.location_chip),
      phone_chip: asString(about.phone_chip, fallback.about.phone_chip),
      institution_facts: normalizeFactItems(about.institution_facts, fallback.about.institution_facts),
      address_title: asString(about.address_title, fallback.about.address_title),
      address_text: asString(about.address_text, fallback.about.address_text),
    },
    vision: {
      eyebrow: asString(vision.eyebrow, fallback.vision.eyebrow),
      title: asString(vision.title, fallback.vision.title),
      description: asString(vision.description, fallback.vision.description),
    },
    mission: {
      eyebrow: asString(mission.eyebrow, fallback.mission.eyebrow),
      items: normalizeStringArray(mission.items, fallback.mission.items),
    },
    cta: {
      eyebrow: asString(cta.eyebrow, fallback.cta.eyebrow),
      title: asString(cta.title, fallback.cta.title),
      subtitle: asString(cta.subtitle, fallback.cta.subtitle),
      primary_button: normalizeButton(cta.primary_button, fallback.cta.primary_button),
      secondary_button: normalizeButton(cta.secondary_button, fallback.cta.secondary_button),
    },
  };
}

function normalizeProgramPage(value: unknown): ProgramPageBuilderContent {
  const fallback = cloneJson(defaultWebsiteBuilderPages.program);
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const featured = asRecord(record.featured);
  const curriculum = asRecord(record.curriculum);
  const extracurricular = asRecord(record.extracurricular);
  const listing = asRecord(record.listing);
  const cta = asRecord(record.cta);

  return {
    version: 1,
    hero: {
      eyebrow: asString(hero.eyebrow, fallback.hero.eyebrow),
      title: asString(hero.title, fallback.hero.title),
      subtitle: asString(hero.subtitle, fallback.hero.subtitle),
      background_image_url: asString(hero.background_image_url, fallback.hero.background_image_url),
      tags: normalizeStringArray(hero.tags, fallback.hero.tags),
      highlights: normalizeStatItems(hero.highlights, fallback.hero.highlights),
    },
    featured: {
      eyebrow: asString(featured.eyebrow, fallback.featured.eyebrow),
      title: asString(featured.title, fallback.featured.title),
      subtitle: asString(featured.subtitle, fallback.featured.subtitle),
      cards: normalizeImageCards(featured.cards, fallback.featured.cards),
    },
    curriculum: {
      eyebrow: asString(curriculum.eyebrow, fallback.curriculum.eyebrow),
      title: asString(curriculum.title, fallback.curriculum.title),
      subtitle: asString(curriculum.subtitle, fallback.curriculum.subtitle),
      tracks: normalizeStringArray(curriculum.tracks, fallback.curriculum.tracks),
    },
    extracurricular: {
      eyebrow: asString(extracurricular.eyebrow, fallback.extracurricular.eyebrow),
      title: asString(extracurricular.title, fallback.extracurricular.title),
      subtitle: asString(extracurricular.subtitle, fallback.extracurricular.subtitle),
      tags: normalizeStringArray(extracurricular.tags, fallback.extracurricular.tags),
    },
    listing: {
      eyebrow: asString(listing.eyebrow, fallback.listing.eyebrow),
      title: asString(listing.title, fallback.listing.title),
      subtitle: asString(listing.subtitle, fallback.listing.subtitle),
      empty_state: asString(listing.empty_state, fallback.listing.empty_state),
      card_badge: asString(listing.card_badge, fallback.listing.card_badge),
    },
    cta: {
      eyebrow: asString(cta.eyebrow, fallback.cta.eyebrow),
      title: asString(cta.title, fallback.cta.title),
      subtitle: asString(cta.subtitle, fallback.cta.subtitle),
      primary_button: normalizeButton(cta.primary_button, fallback.cta.primary_button),
      secondary_button: normalizeButton(cta.secondary_button, fallback.cta.secondary_button),
    },
  };
}

function normalizePsbPage(value: unknown): PsbPageBuilderContent {
  const fallback = cloneJson(defaultWebsiteBuilderPages.psb);
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const requirements = asRecord(record.requirements);
  const schedule = asRecord(record.schedule);
  const location = asRecord(record.location);
  const cta = asRecord(record.cta);

  return {
    version: 1,
    hero: {
      eyebrow: asString(hero.eyebrow, fallback.hero.eyebrow),
      title: asString(hero.title, fallback.hero.title),
      subtitle: asString(hero.subtitle, fallback.hero.subtitle),
      background_image_url: asString(hero.background_image_url, fallback.hero.background_image_url),
    },
    requirements: {
      eyebrow: asString(requirements.eyebrow, fallback.requirements.eyebrow),
      title: asString(requirements.title, fallback.requirements.title),
      items: normalizeStringArray(requirements.items, fallback.requirements.items),
    },
    schedule: {
      eyebrow: asString(schedule.eyebrow, fallback.schedule.eyebrow),
      title: asString(schedule.title, fallback.schedule.title),
      waves: normalizePsbWaves(schedule.waves, fallback.schedule.waves),
    },
    location: {
      eyebrow: asString(location.eyebrow, fallback.location.eyebrow),
      title: asString(location.title, fallback.location.title),
      subtitle: asString(location.subtitle, fallback.location.subtitle),
      address_text: asString(location.address_text, fallback.location.address_text),
      image_url: asString(location.image_url, fallback.location.image_url),
    },
    cta: {
      eyebrow: asString(cta.eyebrow, fallback.cta.eyebrow),
      title: asString(cta.title, fallback.cta.title),
      subtitle: asString(cta.subtitle, fallback.cta.subtitle),
      primary_button: normalizeButton(cta.primary_button, fallback.cta.primary_button),
      secondary_button: normalizeButton(cta.secondary_button, fallback.cta.secondary_button),
    },
  };
}

function normalizeContactPage(value: unknown): ContactPageBuilderContent {
  const fallback = cloneJson(defaultWebsiteBuilderPages.kontak);
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const summary = asRecord(record.summary);
  const infoCards = asRecord(record.info_cards);
  const form = asRecord(record.form);
  const map = asRecord(record.map);

  return {
    version: 1,
    hero: {
      eyebrow: asString(hero.eyebrow, fallback.hero.eyebrow),
      title: asString(hero.title, fallback.hero.title),
      subtitle: asString(hero.subtitle, fallback.hero.subtitle),
    },
    summary: {
      address_title: asString(summary.address_title, fallback.summary.address_title),
      address_supporting: asString(summary.address_supporting, fallback.summary.address_supporting),
      contact_title: asString(summary.contact_title, fallback.summary.contact_title),
      contact_supporting: asString(summary.contact_supporting, fallback.summary.contact_supporting),
      hours_title: asString(summary.hours_title, fallback.summary.hours_title),
      hours_supporting: asString(summary.hours_supporting, fallback.summary.hours_supporting),
    },
    info_cards: {
      address_title: asString(infoCards.address_title, fallback.info_cards.address_title),
      contact_title: asString(infoCards.contact_title, fallback.info_cards.contact_title),
      hours_title: asString(infoCards.hours_title, fallback.info_cards.hours_title),
    },
    form: {
      title: asString(form.title, fallback.form.title),
      subtitle: asString(form.subtitle, fallback.form.subtitle),
      success_title: asString(form.success_title, fallback.form.success_title),
      success_message: asString(form.success_message, fallback.form.success_message),
      submit_label: asString(form.submit_label, fallback.form.submit_label),
      submitting_label: asString(form.submitting_label, fallback.form.submitting_label),
      reset_label: asString(form.reset_label, fallback.form.reset_label),
    },
    map: {
      eyebrow: asString(map.eyebrow, fallback.map.eyebrow),
      title: asString(map.title, fallback.map.title),
      subtitle: asString(map.subtitle, fallback.map.subtitle),
      button_label: asString(map.button_label, fallback.map.button_label),
      button_url: asString(map.button_url, fallback.map.button_url),
      embed_url: asString(map.embed_url, fallback.map.embed_url),
    },
  };
}

export function normalizeWebsiteBuilderPages(value: unknown): WebsiteBuilderPages {
  const fallback = cloneJson(defaultWebsiteBuilderPages);
  const record = asRecord(value);

  return {
    version: 1,
    profil: normalizeProfilPage(record.profil || fallback.profil),
    program: normalizeProgramPage(record.program || fallback.program),
    psb: normalizePsbPage(record.psb || fallback.psb),
    kontak: normalizeContactPage(record.kontak || fallback.kontak),
  };
}

export function createWebsiteBuilderSnapshot({
  theme,
  shell,
  home,
  pages,
}: {
  theme: WebsiteBuilderTheme;
  shell: WebsiteBuilderShell;
  home: HomeBuilderLayout;
  pages: WebsiteBuilderPages;
}): WebsiteBuilderSnapshot {
  return {
    theme: cloneJson(theme),
    shell: cloneJson(shell),
    home: cloneJson(home),
    pages: cloneJson(pages),
  };
}

function normalizeWebsiteBuilderSnapshot(value: unknown): WebsiteBuilderSnapshot {
  const record = asRecord(value);
  return createWebsiteBuilderSnapshot({
    theme: normalizeWebsiteBuilderTheme(record.theme || defaultWebsiteBuilderTheme),
    shell: normalizeWebsiteBuilderShell(record.shell || defaultWebsiteBuilderShell),
    home: normalizeHomeBuilderLayout(record.home || defaultHomeBuilderLayout),
    pages: normalizeWebsiteBuilderPages(record.pages || defaultWebsiteBuilderPages),
  });
}

export function normalizeWebsiteBuilderRevisions(value: unknown): WebsiteBuilderRevision[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item, index): WebsiteBuilderRevision => {
      const fallbackDate = new Date(index * 1000).toISOString();
      return {
        id: asString(item.id, `website-builder-revision-${index + 1}`),
        created_at: asString(item.created_at, fallbackDate),
        action: asChoice(item.action, revisionActions, 'save-draft'),
        label: asString(item.label, 'Snapshot Builder'),
        snapshot: normalizeWebsiteBuilderSnapshot(item.snapshot),
      };
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, WEBSITE_BUILDER_REVISION_LIMIT);
}

export function appendWebsiteBuilderRevision(
  revisions: WebsiteBuilderRevision[],
  revision: WebsiteBuilderRevision
) {
  return [cloneJson(revision), ...revisions.map((item) => cloneJson(item))].slice(
    0,
    WEBSITE_BUILDER_REVISION_LIMIT
  );
}

export function createWebsiteBuilderRevision({
  action,
  label,
  snapshot,
}: {
  action: WebsiteBuilderRevisionAction;
  label: string;
  snapshot: WebsiteBuilderSnapshot;
}): WebsiteBuilderRevision {
  const timestamp = new Date().toISOString();
  return {
    id: `builder-revision-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: timestamp,
    action,
    label,
    snapshot: normalizeWebsiteBuilderSnapshot(snapshot),
  };
}

export function parseWebsiteBuilderState(settings: SettingsMap): WebsiteBuilderState {
  const draftTheme = safeParseJson(settings[WEBSITE_BUILDER_KEYS.themeDraft]);
  const publishedTheme = safeParseJson(settings[WEBSITE_BUILDER_KEYS.themePublished]);
  const draftShell = safeParseJson(settings[WEBSITE_BUILDER_KEYS.shellDraft]);
  const publishedShell = safeParseJson(settings[WEBSITE_BUILDER_KEYS.shellPublished]);
  const draftHome = safeParseJson(settings[WEBSITE_BUILDER_KEYS.homeDraft]);
  const publishedHome = safeParseJson(settings[WEBSITE_BUILDER_KEYS.homePublished]);
  const draftPages = safeParseJson(settings[WEBSITE_BUILDER_KEYS.pagesDraft]);
  const publishedPages = safeParseJson(settings[WEBSITE_BUILDER_KEYS.pagesPublished]);
  const revisions = safeParseJson(settings[WEBSITE_BUILDER_KEYS.revisions]);

  return {
    enabled: settings[WEBSITE_BUILDER_KEYS.enabled] === 'true',
    themeDraft: normalizeWebsiteBuilderTheme(draftTheme || publishedTheme || defaultWebsiteBuilderTheme),
    themePublished: normalizeWebsiteBuilderTheme(publishedTheme || defaultWebsiteBuilderTheme),
    shellDraft: normalizeWebsiteBuilderShell(draftShell || publishedShell || defaultWebsiteBuilderShell),
    shellPublished: normalizeWebsiteBuilderShell(publishedShell || defaultWebsiteBuilderShell),
    homeDraft: normalizeHomeBuilderLayout(draftHome || publishedHome || defaultHomeBuilderLayout),
    homePublished: normalizeHomeBuilderLayout(publishedHome || defaultHomeBuilderLayout),
    pagesDraft: normalizeWebsiteBuilderPages(draftPages || publishedPages || defaultWebsiteBuilderPages),
    pagesPublished: normalizeWebsiteBuilderPages(publishedPages || defaultWebsiteBuilderPages),
    revisions: normalizeWebsiteBuilderRevisions(revisions),
  };
}

export function serializeBuilderJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
