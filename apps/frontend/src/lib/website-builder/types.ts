export const WEBSITE_BUILDER_KEYS = {
  enabled: 'website_builder_enabled',
  themeDraft: 'website_builder_theme_draft',
  themePublished: 'website_builder_theme_published',
  shellDraft: 'website_builder_shell_draft',
  shellPublished: 'website_builder_shell_published',
  homeDraft: 'website_builder_home_draft',
  homePublished: 'website_builder_home_published',
  pagesDraft: 'website_builder_pages_draft',
  pagesPublished: 'website_builder_pages_published',
  revisions: 'website_builder_revisions',
} as const;

export type WebsiteBuilderKey = (typeof WEBSITE_BUILDER_KEYS)[keyof typeof WEBSITE_BUILDER_KEYS];

export type BuilderButtonStyle = 'primary' | 'secondary' | 'ghost' | 'light';

export type BuilderButton = {
  label: string;
  url: string;
  style: BuilderButtonStyle;
};

export type BuilderStatItem = {
  value: string;
  label: string;
};

export type BuilderFactItem = {
  label: string;
  value: string;
};

export type BuilderImageCard = {
  title: string;
  description: string;
  image_url: string;
};

export type PsbWaveItem = {
  label: string;
  date_text: string;
  active: boolean;
};

export type WebsiteBuilderTheme = {
  version: 1;
  palette: {
    primary: 'emerald' | 'teal' | 'blue' | 'amber' | 'slate';
    accent: 'amber' | 'lime' | 'sky' | 'rose' | 'emerald';
    surface: 'slate' | 'stone' | 'zinc' | 'emerald';
    tone: 'fresh' | 'formal' | 'warm' | 'calm';
  };
  typography: {
    heading: 'outfit' | 'plus-jakarta' | 'serif';
    body: 'plus-jakarta' | 'outfit' | 'serif';
    scale: 'compact' | 'normal' | 'large';
  };
  shape: {
    radius: 'soft' | 'rounded' | 'pill' | 'sharp';
    shadow: 'none' | 'soft' | 'bold';
  };
  background: {
    pattern: 'none' | 'soft-blobs' | 'grid' | 'gradient';
    public_page: 'warm-white' | 'clean-white' | 'soft-emerald' | 'slate';
  };
};

export type NavbarMenuItem = {
  label: string;
  url: string;
};

export type WebsiteBuilderShell = {
  version: 1;
  navbar: {
    enabled: boolean;
    variant: 'classic' | 'centered' | 'compact' | 'transparent-over-hero' | 'simple';
    position: 'sticky' | 'static' | 'transparent-over-hero';
    logo_url: string;
    show_school_name: boolean;
    school_name_override: string;
    menu_items: NavbarMenuItem[];
    cta: BuilderButton;
    show_login_link: boolean;
    mobile: {
      variant: 'drawer' | 'sheet' | 'bottom-menu';
      show_cta: boolean;
    };
  };
  floating: {
    whatsapp: {
      enabled: boolean;
      position: 'bottom-right' | 'bottom-left';
      mobile_offset: 'default' | 'above-bottom-nav';
      label: string;
      url: string;
    };
    back_to_top: {
      enabled: boolean;
      position: 'above-whatsapp' | 'bottom-right' | 'bottom-left';
    };
  };
  footer: {
    enabled: boolean;
    variant: 'simple' | 'columns' | 'contact-columns' | 'map-contact' | 'minimal';
    logo_url: string;
    description: string;
    quick_links: NavbarMenuItem[];
    contact_items: NavbarMenuItem[];
    show_logo: boolean;
    show_socials: boolean;
    show_map_link: boolean;
    show_address: boolean;
    copyright_text: string;
    background: 'emerald-dark' | 'slate-dark' | 'light';
  };
};

export type HomeSectionType =
  | 'hero'
  | 'info-cards'
  | 'profile'
  | 'programs'
  | 'extracurriculars'
  | 'gallery'
  | 'videos'
  | 'news'
  | 'agendas'
  | 'cta'
  | 'welcome'
  | 'facilities'
  | 'testimonials'
  | 'faq'
  | 'donation-cta'
  | 'custom-content'
  | 'spacer';

export type HomeSection = {
  id: string;
  type: HomeSectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
};

export type HomeBuilderLayout = {
  version: 1;
  page: 'home';
  updated_at: string;
  sections: HomeSection[];
};

export type ProfilPageBuilderContent = {
  version: 1;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image_url: string;
    highlights: BuilderStatItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    location_chip: string;
    phone_chip: string;
    institution_facts: BuilderFactItem[];
    address_title: string;
    address_text: string;
  };
  vision: {
    eyebrow: string;
    title: string;
    description: string;
  };
  mission: {
    eyebrow: string;
    items: string[];
  };
  cta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary_button: BuilderButton;
    secondary_button: BuilderButton;
  };
};

export type ProgramPageBuilderContent = {
  version: 1;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image_url: string;
    tags: string[];
    highlights: BuilderStatItem[];
  };
  featured: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: BuilderImageCard[];
  };
  curriculum: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tracks: string[];
  };
  extracurricular: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tags: string[];
  };
  listing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty_state: string;
    card_badge: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary_button: BuilderButton;
    secondary_button: BuilderButton;
  };
};

export type PsbPageBuilderContent = {
  version: 1;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image_url: string;
  };
  requirements: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  schedule: {
    eyebrow: string;
    title: string;
    waves: PsbWaveItem[];
  };
  location: {
    eyebrow: string;
    title: string;
    subtitle: string;
    address_text: string;
    image_url: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary_button: BuilderButton;
    secondary_button: BuilderButton;
  };
};

export type ContactPageBuilderContent = {
  version: 1;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  summary: {
    address_title: string;
    address_supporting: string;
    contact_title: string;
    contact_supporting: string;
    hours_title: string;
    hours_supporting: string;
  };
  info_cards: {
    address_title: string;
    contact_title: string;
    hours_title: string;
  };
  form: {
    title: string;
    subtitle: string;
    success_title: string;
    success_message: string;
    submit_label: string;
    submitting_label: string;
    reset_label: string;
  };
  map: {
    eyebrow: string;
    title: string;
    subtitle: string;
    button_label: string;
    button_url: string;
    embed_url: string;
  };
};

export type BuilderPageKey = 'profil' | 'program' | 'psb' | 'kontak';

export type WebsiteBuilderPages = {
  version: 1;
  profil: ProfilPageBuilderContent;
  program: ProgramPageBuilderContent;
  psb: PsbPageBuilderContent;
  kontak: ContactPageBuilderContent;
};

export type WebsiteBuilderSnapshot = {
  theme: WebsiteBuilderTheme;
  shell: WebsiteBuilderShell;
  home: HomeBuilderLayout;
  pages: WebsiteBuilderPages;
};

export type WebsiteBuilderRevisionAction =
  | 'save-draft'
  | 'publish'
  | 'rollback-draft'
  | 'rollback-publish';

export type WebsiteBuilderRevision = {
  id: string;
  created_at: string;
  action: WebsiteBuilderRevisionAction;
  label: string;
  snapshot: WebsiteBuilderSnapshot;
};

export type WebsiteBuilderState = {
  enabled: boolean;
  themeDraft: WebsiteBuilderTheme;
  themePublished: WebsiteBuilderTheme;
  shellDraft: WebsiteBuilderShell;
  shellPublished: WebsiteBuilderShell;
  homeDraft: HomeBuilderLayout;
  homePublished: HomeBuilderLayout;
  pagesDraft: WebsiteBuilderPages;
  pagesPublished: WebsiteBuilderPages;
  revisions: WebsiteBuilderRevision[];
};
