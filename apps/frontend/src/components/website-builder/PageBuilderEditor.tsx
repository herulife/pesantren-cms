'use client';

import React, { useId } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { resolveDisplayImageUrl } from '@/lib/api';
import {
  BuilderButton,
  BuilderFactItem,
  BuilderImageCard,
  BuilderPageKey,
  BuilderStatItem,
  ProfilPageBuilderContent,
  ProgramPageBuilderContent,
  PsbPageBuilderContent,
  PsbWaveItem,
  WebsiteBuilderPages,
} from '@/lib/website-builder';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceArrayItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function moveArrayItem<T>(items: T[], index: number, direction: 'up' | 'down') {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function SimpleInput({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
      />
    </label>
  );
}

function SimpleTextarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
      />
    </label>
  );
}

function InlineActionButton({
  title,
  onClick,
  children,
  tone = 'default',
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 ${
        tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-white text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function ButtonEditor({
  label,
  button,
  onChange,
}: {
  label: string;
  button: BuilderButton;
  onChange: (button: BuilderButton) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <SimpleInput
          label="Label"
          value={button.label}
          onChange={(value) => onChange({ ...button, label: value })}
        />
        <SimpleInput
          label="URL"
          value={button.url}
          onChange={(value) => onChange({ ...button, url: value })}
          placeholder="/program atau https://..."
        />
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Style</span>
          <select
            value={button.style}
            onChange={(event) => onChange({ ...button, style: event.target.value as BuilderButton['style'] })}
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
  );
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

function StringListEditor({
  title,
  items,
  onChange,
  addLabel = 'Tambah Item',
  placeholder = 'Tulis item',
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_auto_auto_auto]"
          >
            <input
              value={item}
              onChange={(event) => onChange(replaceArrayItem(items, index, event.target.value))}
              placeholder={placeholder}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
            />
            <InlineActionButton title="Naikkan" onClick={() => onChange(moveArrayItem(items, index, 'up'))}>
              <ArrowUp size={14} />
            </InlineActionButton>
            <InlineActionButton title="Turunkan" onClick={() => onChange(moveArrayItem(items, index, 'down'))}>
              <ArrowDown size={14} />
            </InlineActionButton>
            <InlineActionButton
              title="Hapus item"
              tone="danger"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 size={14} />
            </InlineActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: BuilderStatItem[];
  onChange: (items: BuilderStatItem[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...items, { value: '', label: '' }])}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> Tambah Stat
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1.2fr_auto_auto_auto]"
          >
            <input
              value={item.value}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, value: event.target.value }))
              }
              placeholder="Nilai"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <input
              value={item.label}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, label: event.target.value }))
              }
              placeholder="Label"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <InlineActionButton title="Naikkan" onClick={() => onChange(moveArrayItem(items, index, 'up'))}>
              <ArrowUp size={14} />
            </InlineActionButton>
            <InlineActionButton title="Turunkan" onClick={() => onChange(moveArrayItem(items, index, 'down'))}>
              <ArrowDown size={14} />
            </InlineActionButton>
            <InlineActionButton
              title="Hapus stat"
              tone="danger"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 size={14} />
            </InlineActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: BuilderFactItem[];
  onChange: (items: BuilderFactItem[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', value: '' }])}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> Tambah Fakta
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1.2fr_auto_auto_auto]"
          >
            <input
              value={item.label}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, label: event.target.value }))
              }
              placeholder="Label"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <input
              value={item.value}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, value: event.target.value }))
              }
              placeholder="Value"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <InlineActionButton title="Naikkan" onClick={() => onChange(moveArrayItem(items, index, 'up'))}>
              <ArrowUp size={14} />
            </InlineActionButton>
            <InlineActionButton title="Turunkan" onClick={() => onChange(moveArrayItem(items, index, 'down'))}>
              <ArrowDown size={14} />
            </InlineActionButton>
            <InlineActionButton
              title="Hapus fakta"
              tone="danger"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 size={14} />
            </InlineActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageCardListEditor({
  title,
  items,
  onChange,
  onUploadImage,
  uploadingTarget,
  uploadKeyPrefix,
}: {
  title: string;
  items: BuilderImageCard[];
  onChange: (items: BuilderImageCard[]) => void;
  onUploadImage: (target: string, file: File) => Promise<string>;
  uploadingTarget?: string | null;
  uploadKeyPrefix: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <button
          type="button"
          onClick={() => onChange([...items, { title: '', description: '', image_url: '' }])}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> Tambah Kartu
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-900">Kartu {index + 1}</p>
              <div className="flex gap-2">
                <InlineActionButton title="Naikkan" onClick={() => onChange(moveArrayItem(items, index, 'up'))}>
                  <ArrowUp size={14} />
                </InlineActionButton>
                <InlineActionButton title="Turunkan" onClick={() => onChange(moveArrayItem(items, index, 'down'))}>
                  <ArrowDown size={14} />
                </InlineActionButton>
                <InlineActionButton
                  title="Hapus kartu"
                  tone="danger"
                  onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 size={14} />
                </InlineActionButton>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <SimpleInput
                  label="Judul"
                  value={item.title}
                  onChange={(value) => onChange(replaceArrayItem(items, index, { ...item, title: value }))}
                />
                <SimpleTextarea
                  label="Deskripsi"
                  value={item.description}
                  rows={4}
                  onChange={(value) =>
                    onChange(replaceArrayItem(items, index, { ...item, description: value }))
                  }
                />
              </div>
              <ImageUploadField
                label="Gambar Kartu"
                value={item.image_url}
                onChange={(value) => onChange(replaceArrayItem(items, index, { ...item, image_url: value }))}
                onUpload={async (file) => {
                  const uploadedUrl = await onUploadImage(`${uploadKeyPrefix}-${index}`, file);
                  if (!uploadedUrl) return;
                  onChange(replaceArrayItem(items, index, { ...item, image_url: uploadedUrl }));
                }}
                isUploading={uploadingTarget === `${uploadKeyPrefix}-${index}`}
                placeholder="/uploads/kartu-program.jpg"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PsbWaveListEditor({
  items,
  onChange,
}: {
  items: PsbWaveItem[];
  onChange: (items: PsbWaveItem[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-black text-slate-900">Gelombang Pendaftaran</p>
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', date_text: '', active: false }])}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"
        >
          <Plus size={14} /> Tambah Gelombang
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1.4fr_auto_auto_auto_auto]"
          >
            <input
              value={item.label}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, label: event.target.value }))
              }
              placeholder="Label gelombang"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <input
              value={item.date_text}
              onChange={(event) =>
                onChange(replaceArrayItem(items, index, { ...item, date_text: event.target.value }))
              }
              placeholder="Tanggal gelombang"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) =>
                  onChange(replaceArrayItem(items, index, { ...item, active: event.target.checked }))
                }
              />
              Aktif
            </label>
            <InlineActionButton title="Naikkan" onClick={() => onChange(moveArrayItem(items, index, 'up'))}>
              <ArrowUp size={14} />
            </InlineActionButton>
            <InlineActionButton title="Turunkan" onClick={() => onChange(moveArrayItem(items, index, 'down'))}>
              <ArrowDown size={14} />
            </InlineActionButton>
            <InlineActionButton
              title="Hapus gelombang"
              tone="danger"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 size={14} />
            </InlineActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilEditor({
  page,
  onChange,
  onUploadImage,
  uploadingTarget,
}: {
  page: ProfilPageBuilderContent;
  onChange: (page: ProfilPageBuilderContent) => void;
  onUploadImage: (target: string, file: File) => Promise<string>;
  uploadingTarget?: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Hero Profil</p>
          <SimpleInput
            label="Eyebrow"
            value={page.hero.eyebrow}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.hero.title}
            rows={3}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle"
            value={page.hero.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, subtitle: value } })}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ImageUploadField
            label="Background Hero"
            value={page.hero.background_image_url}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, background_image_url: value } })}
            onUpload={async (file) => {
              const uploadedUrl = await onUploadImage('pages-profil-hero', file);
              if (!uploadedUrl) return;
              onChange({ ...page, hero: { ...page.hero, background_image_url: uploadedUrl } });
            }}
            isUploading={uploadingTarget === 'pages-profil-hero'}
            placeholder="/uploads/profil-hero.jpg"
          />
        </div>
      </div>

      <StatListEditor
        title="Highlight Hero"
        items={page.hero.highlights}
        onChange={(items) => onChange({ ...page, hero: { ...page.hero, highlights: items } })}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Tentang</p>
          <SimpleInput
            label="Eyebrow"
            value={page.about.eyebrow}
            onChange={(value) => onChange({ ...page, about: { ...page.about, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.about.title}
            rows={3}
            onChange={(value) => onChange({ ...page, about: { ...page.about, title: value } })}
          />
          <SimpleInput
            label="Chip Lokasi"
            value={page.about.location_chip}
            onChange={(value) => onChange({ ...page, about: { ...page.about, location_chip: value } })}
          />
          <SimpleInput
            label="Chip Telepon"
            value={page.about.phone_chip}
            onChange={(value) => onChange({ ...page, about: { ...page.about, phone_chip: value } })}
          />
          <SimpleInput
            label="Judul Alamat"
            value={page.about.address_title}
            onChange={(value) => onChange({ ...page, about: { ...page.about, address_title: value } })}
          />
          <SimpleTextarea
            label="Isi Alamat"
            value={page.about.address_text}
            rows={3}
            onChange={(value) => onChange({ ...page, about: { ...page.about, address_text: value } })}
          />
        </div>
        <StringListEditor
          title="Paragraf Tentang"
          items={page.about.paragraphs}
          onChange={(items) => onChange({ ...page, about: { ...page.about, paragraphs: items } })}
          addLabel="Tambah Paragraf"
          placeholder="Tulis paragraf penjelasan"
        />
      </div>

      <FactListEditor
        title="Identitas Lembaga"
        items={page.about.institution_facts}
        onChange={(items) => onChange({ ...page, about: { ...page.about, institution_facts: items } })}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Visi</p>
          <SimpleInput
            label="Eyebrow"
            value={page.vision.eyebrow}
            onChange={(value) => onChange({ ...page, vision: { ...page.vision, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.vision.title}
            rows={3}
            onChange={(value) => onChange({ ...page, vision: { ...page.vision, title: value } })}
          />
          <SimpleTextarea
            label="Deskripsi"
            value={page.vision.description}
            rows={5}
            onChange={(value) => onChange({ ...page, vision: { ...page.vision, description: value } })}
          />
        </div>
        <StringListEditor
          title="Daftar Misi"
          items={page.mission.items}
          onChange={(items) => onChange({ ...page, mission: { ...page.mission, items } })}
          addLabel="Tambah Misi"
          placeholder="Tulis butir misi"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">CTA Profil</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.cta.eyebrow}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.cta.title}
            rows={3}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.cta.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, cta: { ...page.cta, subtitle: value } })}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <ButtonEditor
            label="Tombol Utama"
            button={page.cta.primary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, primary_button: button } })}
          />
          <ButtonEditor
            label="Tombol Kedua"
            button={page.cta.secondary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, secondary_button: button } })}
          />
        </div>
      </div>
    </div>
  );
}

function ProgramEditor({
  page,
  onChange,
  onUploadImage,
  uploadingTarget,
}: {
  page: ProgramPageBuilderContent;
  onChange: (page: ProgramPageBuilderContent) => void;
  onUploadImage: (target: string, file: File) => Promise<string>;
  uploadingTarget?: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Hero Program</p>
          <SimpleInput
            label="Eyebrow"
            value={page.hero.eyebrow}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.hero.title}
            rows={3}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle"
            value={page.hero.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, subtitle: value } })}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ImageUploadField
            label="Background Hero"
            value={page.hero.background_image_url}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, background_image_url: value } })}
            onUpload={async (file) => {
              const uploadedUrl = await onUploadImage('pages-program-hero', file);
              if (!uploadedUrl) return;
              onChange({ ...page, hero: { ...page.hero, background_image_url: uploadedUrl } });
            }}
            isUploading={uploadingTarget === 'pages-program-hero'}
            placeholder="/uploads/program-hero.jpg"
          />
        </div>
      </div>

      <StringListEditor
        title="Tag Hero"
        items={page.hero.tags}
        onChange={(items) => onChange({ ...page, hero: { ...page.hero, tags: items } })}
        addLabel="Tambah Tag"
        placeholder="Tahfidz / Adab / Life Skill"
      />
      <StatListEditor
        title="Highlight Hero"
        items={page.hero.highlights}
        onChange={(items) => onChange({ ...page, hero: { ...page.hero, highlights: items } })}
      />

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">Section Program Unggulan</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.featured.eyebrow}
            onChange={(value) => onChange({ ...page, featured: { ...page.featured, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.featured.title}
            rows={3}
            onChange={(value) => onChange({ ...page, featured: { ...page.featured, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.featured.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, featured: { ...page.featured, subtitle: value } })}
        />
      </div>
      <ImageCardListEditor
        title="Kartu Program Unggulan"
        items={page.featured.cards}
        onChange={(items) => onChange({ ...page, featured: { ...page.featured, cards: items } })}
        onUploadImage={onUploadImage}
        uploadingTarget={uploadingTarget}
        uploadKeyPrefix="pages-program-featured-card"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Kurikulum</p>
          <SimpleInput
            label="Eyebrow"
            value={page.curriculum.eyebrow}
            onChange={(value) => onChange({ ...page, curriculum: { ...page.curriculum, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.curriculum.title}
            rows={3}
            onChange={(value) => onChange({ ...page, curriculum: { ...page.curriculum, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle"
            value={page.curriculum.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, curriculum: { ...page.curriculum, subtitle: value } })}
          />
          <StringListEditor
            title="Track Kurikulum"
            items={page.curriculum.tracks}
            onChange={(items) => onChange({ ...page, curriculum: { ...page.curriculum, tracks: items } })}
            addLabel="Tambah Track"
            placeholder="Kurikulum Pondok"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Ekstrakurikuler</p>
          <SimpleInput
            label="Eyebrow"
            value={page.extracurricular.eyebrow}
            onChange={(value) =>
              onChange({ ...page, extracurricular: { ...page.extracurricular, eyebrow: value } })
            }
          />
          <SimpleTextarea
            label="Judul"
            value={page.extracurricular.title}
            rows={3}
            onChange={(value) =>
              onChange({ ...page, extracurricular: { ...page.extracurricular, title: value } })
            }
          />
          <SimpleTextarea
            label="Subtitle"
            value={page.extracurricular.subtitle}
            rows={4}
            onChange={(value) =>
              onChange({ ...page, extracurricular: { ...page.extracurricular, subtitle: value } })
            }
          />
          <StringListEditor
            title="Tag Ekskul"
            items={page.extracurricular.tags}
            onChange={(items) =>
              onChange({ ...page, extracurricular: { ...page.extracurricular, tags: items } })
            }
            addLabel="Tambah Ekskul"
            placeholder="Panahan / Karate / Tata Boga"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">Section Listing Program Dinamis</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.listing.eyebrow}
            onChange={(value) => onChange({ ...page, listing: { ...page.listing, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.listing.title}
            rows={3}
            onChange={(value) => onChange({ ...page, listing: { ...page.listing, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.listing.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, listing: { ...page.listing, subtitle: value } })}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Badge Kartu"
            value={page.listing.card_badge}
            onChange={(value) => onChange({ ...page, listing: { ...page.listing, card_badge: value } })}
          />
          <SimpleTextarea
            label="Pesan Empty State"
            value={page.listing.empty_state}
            rows={3}
            onChange={(value) => onChange({ ...page, listing: { ...page.listing, empty_state: value } })}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">CTA Program</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.cta.eyebrow}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.cta.title}
            rows={3}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.cta.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, cta: { ...page.cta, subtitle: value } })}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <ButtonEditor
            label="Tombol Utama"
            button={page.cta.primary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, primary_button: button } })}
          />
          <ButtonEditor
            label="Tombol Kedua"
            button={page.cta.secondary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, secondary_button: button } })}
          />
        </div>
      </div>
    </div>
  );
}

function PsbEditor({
  page,
  onChange,
  onUploadImage,
  uploadingTarget,
}: {
  page: PsbPageBuilderContent;
  onChange: (page: PsbPageBuilderContent) => void;
  onUploadImage: (target: string, file: File) => Promise<string>;
  uploadingTarget?: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Hero PSB</p>
          <SimpleInput
            label="Eyebrow"
            value={page.hero.eyebrow}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.hero.title}
            rows={3}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle"
            value={page.hero.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, subtitle: value } })}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ImageUploadField
            label="Background Hero"
            value={page.hero.background_image_url}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, background_image_url: value } })}
            onUpload={async (file) => {
              const uploadedUrl = await onUploadImage('pages-psb-hero', file);
              if (!uploadedUrl) return;
              onChange({ ...page, hero: { ...page.hero, background_image_url: uploadedUrl } });
            }}
            isUploading={uploadingTarget === 'pages-psb-hero'}
            placeholder="/uploads/psb-hero.jpg"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Persyaratan</p>
          <SimpleInput
            label="Eyebrow"
            value={page.requirements.eyebrow}
            onChange={(value) =>
              onChange({ ...page, requirements: { ...page.requirements, eyebrow: value } })
            }
          />
          <SimpleTextarea
            label="Judul"
            value={page.requirements.title}
            rows={3}
            onChange={(value) =>
              onChange({ ...page, requirements: { ...page.requirements, title: value } })
            }
          />
          <StringListEditor
            title="Daftar Persyaratan"
            items={page.requirements.items}
            onChange={(items) => onChange({ ...page, requirements: { ...page.requirements, items } })}
            addLabel="Tambah Syarat"
            placeholder="Fotokopi Kartu Keluarga"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Jadwal</p>
          <SimpleInput
            label="Eyebrow"
            value={page.schedule.eyebrow}
            onChange={(value) => onChange({ ...page, schedule: { ...page.schedule, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.schedule.title}
            rows={3}
            onChange={(value) => onChange({ ...page, schedule: { ...page.schedule, title: value } })}
          />
          <PsbWaveListEditor
            items={page.schedule.waves}
            onChange={(items) => onChange({ ...page, schedule: { ...page.schedule, waves: items } })}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Section Lokasi</p>
          <SimpleInput
            label="Eyebrow"
            value={page.location.eyebrow}
            onChange={(value) => onChange({ ...page, location: { ...page.location, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.location.title}
            rows={3}
            onChange={(value) => onChange({ ...page, location: { ...page.location, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle Overlay"
            value={page.location.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, location: { ...page.location, subtitle: value } })}
          />
          <SimpleTextarea
            label="Alamat"
            value={page.location.address_text}
            rows={3}
            onChange={(value) => onChange({ ...page, location: { ...page.location, address_text: value } })}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ImageUploadField
            label="Gambar Lokasi"
            value={page.location.image_url}
            onChange={(value) => onChange({ ...page, location: { ...page.location, image_url: value } })}
            onUpload={async (file) => {
              const uploadedUrl = await onUploadImage('pages-psb-location-image', file);
              if (!uploadedUrl) return;
              onChange({ ...page, location: { ...page.location, image_url: uploadedUrl } });
            }}
            isUploading={uploadingTarget === 'pages-psb-location-image'}
            placeholder="/uploads/psb-lokasi.jpg"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">CTA PSB</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.cta.eyebrow}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.cta.title}
            rows={3}
            onChange={(value) => onChange({ ...page, cta: { ...page.cta, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.cta.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, cta: { ...page.cta, subtitle: value } })}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <ButtonEditor
            label="Tombol Utama"
            button={page.cta.primary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, primary_button: button } })}
          />
          <ButtonEditor
            label="Tombol Kedua"
            button={page.cta.secondary_button}
            onChange={(button) => onChange({ ...page, cta: { ...page.cta, secondary_button: button } })}
          />
        </div>
      </div>
    </div>
  );
}

function ContactEditor({
  page,
  onChange,
}: {
  page: WebsiteBuilderPages['kontak'];
  onChange: (page: WebsiteBuilderPages['kontak']) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">Hero Kontak</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.hero.eyebrow}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.hero.title}
            rows={3}
            onChange={(value) => onChange({ ...page, hero: { ...page.hero, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.hero.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, hero: { ...page.hero, subtitle: value } })}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Kartu Ringkas Header</p>
          <SimpleInput
            label="Judul Alamat"
            value={page.summary.address_title}
            onChange={(value) => onChange({ ...page, summary: { ...page.summary, address_title: value } })}
          />
          <SimpleTextarea
            label="Catatan Alamat"
            value={page.summary.address_supporting}
            rows={3}
            onChange={(value) =>
              onChange({ ...page, summary: { ...page.summary, address_supporting: value } })
            }
          />
          <SimpleInput
            label="Judul Kontak"
            value={page.summary.contact_title}
            onChange={(value) => onChange({ ...page, summary: { ...page.summary, contact_title: value } })}
          />
          <SimpleTextarea
            label="Catatan Kontak"
            value={page.summary.contact_supporting}
            rows={3}
            onChange={(value) =>
              onChange({ ...page, summary: { ...page.summary, contact_supporting: value } })
            }
          />
          <SimpleInput
            label="Judul Layanan"
            value={page.summary.hours_title}
            onChange={(value) => onChange({ ...page, summary: { ...page.summary, hours_title: value } })}
          />
          <SimpleInput
            label="Teks Jam Layanan"
            value={page.summary.hours_supporting}
            onChange={(value) =>
              onChange({ ...page, summary: { ...page.summary, hours_supporting: value } })
            }
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Judul Kartu Info</p>
          <SimpleInput
            label="Kartu Alamat"
            value={page.info_cards.address_title}
            onChange={(value) => onChange({ ...page, info_cards: { ...page.info_cards, address_title: value } })}
          />
          <SimpleInput
            label="Kartu Kontak"
            value={page.info_cards.contact_title}
            onChange={(value) => onChange({ ...page, info_cards: { ...page.info_cards, contact_title: value } })}
          />
          <SimpleInput
            label="Kartu Jam Operasional"
            value={page.info_cards.hours_title}
            onChange={(value) => onChange({ ...page, info_cards: { ...page.info_cards, hours_title: value } })}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Form Pesan</p>
          <SimpleInput
            label="Judul Form"
            value={page.form.title}
            onChange={(value) => onChange({ ...page, form: { ...page.form, title: value } })}
          />
          <SimpleTextarea
            label="Subtitle Form"
            value={page.form.subtitle}
            rows={4}
            onChange={(value) => onChange({ ...page, form: { ...page.form, subtitle: value } })}
          />
          <SimpleInput
            label="Judul Sukses"
            value={page.form.success_title}
            onChange={(value) => onChange({ ...page, form: { ...page.form, success_title: value } })}
          />
          <SimpleTextarea
            label="Pesan Sukses"
            value={page.form.success_message}
            rows={4}
            onChange={(value) => onChange({ ...page, form: { ...page.form, success_message: value } })}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-black text-slate-900">Label Tombol Form</p>
          <SimpleInput
            label="Label Submit"
            value={page.form.submit_label}
            onChange={(value) => onChange({ ...page, form: { ...page.form, submit_label: value } })}
          />
          <SimpleInput
            label="Label Saat Loading"
            value={page.form.submitting_label}
            onChange={(value) => onChange({ ...page, form: { ...page.form, submitting_label: value } })}
          />
          <SimpleInput
            label="Label Reset"
            value={page.form.reset_label}
            onChange={(value) => onChange({ ...page, form: { ...page.form, reset_label: value } })}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">Section Peta</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Eyebrow"
            value={page.map.eyebrow}
            onChange={(value) => onChange({ ...page, map: { ...page.map, eyebrow: value } })}
          />
          <SimpleTextarea
            label="Judul"
            value={page.map.title}
            rows={3}
            onChange={(value) => onChange({ ...page, map: { ...page.map, title: value } })}
          />
        </div>
        <SimpleTextarea
          label="Subtitle"
          value={page.map.subtitle}
          rows={4}
          onChange={(value) => onChange({ ...page, map: { ...page.map, subtitle: value } })}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleInput
            label="Label Tombol Maps"
            value={page.map.button_label}
            onChange={(value) => onChange({ ...page, map: { ...page.map, button_label: value } })}
          />
          <SimpleInput
            label="URL Tombol Maps"
            value={page.map.button_url}
            onChange={(value) => onChange({ ...page, map: { ...page.map, button_url: value } })}
          />
        </div>
        <SimpleTextarea
          label="URL Embed Map"
          value={page.map.embed_url}
          rows={4}
          onChange={(value) => onChange({ ...page, map: { ...page.map, embed_url: value } })}
        />
      </div>
    </div>
  );
}

export default function PageBuilderEditor({
  pageKey,
  pagesDraft,
  onChange,
  onUploadImage,
  uploadingTarget,
}: {
  pageKey: BuilderPageKey;
  pagesDraft: WebsiteBuilderPages;
  onChange: (nextPages: WebsiteBuilderPages) => void;
  onUploadImage: (target: string, file: File) => Promise<string>;
  uploadingTarget?: string | null;
}) {
  const updatePage = <TPageKey extends BuilderPageKey>(
    key: TPageKey,
    nextPage: WebsiteBuilderPages[TPageKey]
  ) => {
    onChange({
      ...pagesDraft,
      [key]: cloneJson(nextPage),
    });
  };

  if (pageKey === 'profil') {
    return (
      <ProfilEditor
        page={pagesDraft.profil}
        onChange={(page) => updatePage('profil', page)}
        onUploadImage={onUploadImage}
        uploadingTarget={uploadingTarget}
      />
    );
  }

  if (pageKey === 'program') {
    return (
      <ProgramEditor
        page={pagesDraft.program}
        onChange={(page) => updatePage('program', page)}
        onUploadImage={onUploadImage}
        uploadingTarget={uploadingTarget}
      />
    );
  }

  if (pageKey === 'psb') {
    return (
      <PsbEditor
        page={pagesDraft.psb}
        onChange={(page) => updatePage('psb', page)}
        onUploadImage={onUploadImage}
        uploadingTarget={uploadingTarget}
      />
    );
  }

  return (
    <ContactEditor
      page={pagesDraft.kontak}
      onChange={(page) => updatePage('kontak', page)}
    />
  );
}
