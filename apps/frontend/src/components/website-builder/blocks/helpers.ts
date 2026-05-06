import { BuilderButton, BuilderButtonStyle, HomeSection } from '@/lib/website-builder';

type PlainRecord = Record<string, unknown>;

export function asRecord(value: unknown): PlainRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as PlainRecord) : {};
}

export function getSetting(section: HomeSection, key: string) {
  return asRecord(section.settings)[key];
}

export function getString(section: HomeSection, key: string, fallback = '') {
  const value = getSetting(section, key);
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function getNumber(section: HomeSection, key: string, fallback: number) {
  const value = getSetting(section, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function getBoolean(section: HomeSection, key: string, fallback: boolean) {
  const value = getSetting(section, key);
  return typeof value === 'boolean' ? value : fallback;
}

export function getArray<T>(section: HomeSection, key: string): T[] {
  const value = getSetting(section, key);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function getButtons(section: HomeSection): BuilderButton[] {
  const buttons = getArray<Record<string, unknown>>(section, 'buttons')
    .map((button) => ({
      label: typeof button.label === 'string' ? button.label : '',
      url: typeof button.url === 'string' ? button.url : '',
      style: (button.style === 'secondary' || button.style === 'ghost' || button.style === 'light' ? button.style : 'primary') as BuilderButtonStyle,
    }))
    .filter((button) => button.label && button.url);

  return buttons.length > 0
    ? buttons
    : [
        { label: 'Lihat Info PSB', url: '/psb', style: 'primary' },
        { label: 'Lihat Program', url: '/program', style: 'secondary' },
      ];
}
