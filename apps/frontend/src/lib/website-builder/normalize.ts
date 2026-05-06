import { SettingsMap } from '@/lib/api';
import {
  defaultHomeBuilderLayout,
  defaultWebsiteBuilderShell,
  defaultWebsiteBuilderTheme,
} from './defaults';
import {
  BuilderButton,
  BuilderButtonStyle,
  HomeBuilderLayout,
  HomeSection,
  HomeSectionType,
  NavbarMenuItem,
  WEBSITE_BUILDER_KEYS,
  WebsiteBuilderShell,
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

export function parseWebsiteBuilderState(settings: SettingsMap): WebsiteBuilderState {
  const draftTheme = safeParseJson(settings[WEBSITE_BUILDER_KEYS.themeDraft]);
  const publishedTheme = safeParseJson(settings[WEBSITE_BUILDER_KEYS.themePublished]);
  const draftShell = safeParseJson(settings[WEBSITE_BUILDER_KEYS.shellDraft]);
  const publishedShell = safeParseJson(settings[WEBSITE_BUILDER_KEYS.shellPublished]);
  const draftHome = safeParseJson(settings[WEBSITE_BUILDER_KEYS.homeDraft]);
  const publishedHome = safeParseJson(settings[WEBSITE_BUILDER_KEYS.homePublished]);

  return {
    enabled: settings[WEBSITE_BUILDER_KEYS.enabled] === 'true',
    themeDraft: normalizeWebsiteBuilderTheme(draftTheme || publishedTheme || defaultWebsiteBuilderTheme),
    themePublished: normalizeWebsiteBuilderTheme(publishedTheme || defaultWebsiteBuilderTheme),
    shellDraft: normalizeWebsiteBuilderShell(draftShell || publishedShell || defaultWebsiteBuilderShell),
    shellPublished: normalizeWebsiteBuilderShell(publishedShell || defaultWebsiteBuilderShell),
    homeDraft: normalizeHomeBuilderLayout(draftHome || publishedHome || defaultHomeBuilderLayout),
    homePublished: normalizeHomeBuilderLayout(publishedHome || defaultHomeBuilderLayout),
  };
}

export function serializeBuilderJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
