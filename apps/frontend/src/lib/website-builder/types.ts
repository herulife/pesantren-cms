export const WEBSITE_BUILDER_KEYS = {
  enabled: 'website_builder_enabled',
  themeDraft: 'website_builder_theme_draft',
  themePublished: 'website_builder_theme_published',
  shellDraft: 'website_builder_shell_draft',
  shellPublished: 'website_builder_shell_published',
  homeDraft: 'website_builder_home_draft',
  homePublished: 'website_builder_home_published',
} as const;

export type WebsiteBuilderKey = (typeof WEBSITE_BUILDER_KEYS)[keyof typeof WEBSITE_BUILDER_KEYS];

export type BuilderButtonStyle = 'primary' | 'secondary' | 'ghost' | 'light';

export type BuilderButton = {
  label: string;
  url: string;
  style: BuilderButtonStyle;
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

export type WebsiteBuilderState = {
  enabled: boolean;
  themeDraft: WebsiteBuilderTheme;
  themePublished: WebsiteBuilderTheme;
  shellDraft: WebsiteBuilderShell;
  shellPublished: WebsiteBuilderShell;
  homeDraft: HomeBuilderLayout;
  homePublished: HomeBuilderLayout;
};
