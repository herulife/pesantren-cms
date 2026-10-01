'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { createSantri, getSantri, updateSantri, getClasses } from '@/lib/api';
import { ArrowLeft, ChevronDown, Loader2, Save } from 'lucide-react';

const genderOptions = [
  { value: '', label: 'Pilih Jenis Kelamin' },
  { value: 'l', label: 'Laki-laki' },
  { value: 'p', label: 'Perempuan' },
];

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'pindah', label: 'Pindah' },
  { value: 'cuti', label: 'Cuti' },
];

const categoryOptions = [
  { value: 'reguler', label: 'Reguler' },
  { value: 'yatim', label: 'Yatim' },
  { value: 'dhuafa', label: 'Duafa' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormErrors = Record<string, string>;

const initialForm = {
  nis: '',
  name: '',
  nickname: '',
  gender: '',
  birth_place: '',
  birth_date: '',
  address: '',
  class: '',
  jenjang: '',
  angkatan: '',
  status: 'aktif',
  category: 'reguler',
  parent_name: '',
  parent_phone: '',
  father_name: '',
  father_phone: '',
  mother_name: '',
  mother_phone: '',
  father_occupation: '',
  mother_occupation: '',
  registration_id: 0,
};


type SelectOption = { value: string; label: string };

// Dropdown kustom (bukan <select> native): di Android/Chrome popup native
// beberapa kali langsung nutup sendiri saat diklik sehingga field tak bisa diisi.
function SelectField({
  id,
  label,
  required,
  className,
  value,
  placeholder,
  options,
  error,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  className: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
        return;
      }
      setCursor((c) => {
        const next = e.key === 'ArrowDown' ? c + 1 : c - 1;
        return Math.min(options.length - 1, Math.max(0, next));
      });
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && options[cursor]) pick(options[cursor].value);
      else {
        setOpen(true);
        setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
      }
      return;
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="relative" ref={ref}>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => {
            setOpen((v) => !v);
            setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
          }}
          onKeyDown={onButtonKeyDown}
          className={`${className} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open ? (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((o, i) => (
              <li
                key={o.value === '' ? '__empty__' : o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(o.value)}
                className={`cursor-pointer px-3.5 py-2 text-sm font-medium ${
                  o.value === value
                    ? 'bg-sky-50 text-sky-700'
                    : i === cursor
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700'
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

export default function SantriFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={40} /></div>}>
      <SantriFormContent />
    </Suspense>
  );
}

function SantriFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const id = searchParams.get('id');
  const isEdit = !!id;

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [classOptions, setClassOptions] = useState<string[]>([]);

  useEffect(() => {
    getClasses(true).then((list) => {
      const names = list.map((c) => c.name).filter(Boolean);
      setClassOptions(Array.from(new Set(names)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      getSantri(Number(id)).then((s) => {
        if (s) {
          setForm({
            nis: s.nis,
            name: s.name,
            nickname: s.nickname || '',
            gender: s.gender === 'laki-laki' ? 'l' : s.gender === 'perempuan' ? 'p' : s.gender,
            birth_place: s.birth_place || '',
            birth_date: s.birth_date || '',
            address: s.address || '',
            class: s.class,
            jenjang: (s as { jenjang?: string }).jenjang || '', 
            angkatan: s.angkatan || '',
            status: s.status || 'aktif',
            // Data lama belum punya kategori; perlakukan sebagai reguler supaya
            // dropdown tidak kosong saat form edit dibuka.
            category: s.category || 'reguler',
            parent_name: s.parent_name || '',
            parent_phone: s.parent_phone || '',
            father_name: s.father_name || '',
            father_phone: s.father_phone || '',
            mother_name: s.mother_name || '',
            mother_phone: s.mother_phone || '',
            father_occupation: s.father_occupation || '',
            mother_occupation: s.mother_occupation || '',
            registration_id: s.registration_id || 0,
          });
        } else {
          showToast('error', 'Santri tidak ditemukan');
          router.replace('/admin/kesantrian');
        }
        setLoading(false);
      });
    }
  }, [id, router, showToast]);

  const set = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nis: form.nis.trim(),
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      gender: form.gender,
      birth_place: form.birth_place.trim(),
      birth_date: form.birth_date,
      address: form.address.trim(),
      class: form.class.trim(),
      jenjang: form.jenjang,
      angkatan: form.angkatan.trim(),
      status: form.status,
      // Backend jadi default "reguler" kalau kosong, tapi kirim eksplisit
      // supaya PUT (full-replace) tidak pernah mengosongkan kolom kategori.
      category: form.category || 'reguler',
      parent_name: form.parent_name.trim(),
      parent_phone: form.parent_phone.trim(),
      father_name: form.father_name.trim(),
      father_phone: form.father_phone.trim(),
      mother_name: form.mother_name.trim(),
      mother_phone: form.mother_phone.trim(),
      father_occupation: form.father_occupation.trim(),
      mother_occupation: form.mother_occupation.trim(),
    };

    let res;
    if (isEdit && id) {
      res = await updateSantri(Number(id), payload);
    } else {
      res = await createSantri(payload);
    }

    if (res.ok) {
      showToast('success', isEdit ? 'Santri berhasil diperbarui' : 'Santri berhasil ditambahkan');
      router.push('/admin/kesantrian');
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      showToast('error', res.message || 'Gagal menyimpan data santri');
    }
    setSaving(false);
  };

  const kelasOptions: SelectOption[] = [
    { value: '', label: '-- Pilih Kelas --' },
    ...classOptions.map((c) => ({ value: c, label: c })),
    ...(form.class !== '' && !classOptions.includes(form.class)
      ? [{ value: '__custom__', label: `${form.class} (saat ini)` }]
      : []),
  ];

  const inputClass = (hasError?: string) =>
    `mt-1 w-full rounded-xl border ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10`;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/kesantrian')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600"
      >
        <ArrowLeft size={16} /> Kembali ke Data Santri
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {isEdit ? 'Edit Santri' : 'Tambah Santri'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? 'Perbarui informasi data santri.' : 'Lengkapi data di bawah untuk menambahkan santri baru.'}
        </p>
        {isEdit && form.registration_id > 0 && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
            Asal PSB #{form.registration_id} — data ortu tersalin otomatis
          </p>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Memuat data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                NIS <span className="text-red-500">*</span>
              </label>
              <input
                value={form.nis}
                onChange={set('nis')}
                placeholder="Contoh: 2026001"
                className={inputClass(errors.nis)}
              />
              {errors.nis && <p className="mt-1 text-xs font-semibold text-red-500">{errors.nis}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Nama lengkap santri"
                className={inputClass(errors.name)}
              />
              {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nama Panggilan</label>
              <input
                value={form.nickname}
                onChange={set('nickname')}
                placeholder="Nama panggilan sehari-hari"
                className={inputClass(errors.nickname)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Jenis Kelamin</label>
              <select value={form.gender} onChange={set('gender')} className={inputClass(errors.gender)}>
                {genderOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.gender && <p className="mt-1 text-xs font-semibold text-red-500">{errors.gender}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tempat Lahir</label>
              <input
                value={form.birth_place}
                onChange={set('birth_place')}
                placeholder="Kota kelahiran"
                className={inputClass()}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tanggal Lahir</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={set('birth_date')}
                className={inputClass(errors.birth_date)}
              />
              {errors.birth_date && <p className="mt-1 text-xs font-semibold text-red-500">{errors.birth_date}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Alamat</label>
              <textarea
                value={form.address}
                onChange={set('address')}
                rows={2}
                placeholder="Alamat lengkap"
                className={inputClass()}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Jenjang
              </label>
              <select value={form.jenjang} onChange={set('jenjang')} className={inputClass()}>
                <option value="">-- Pilih Jenjang --</option>
                <option value="smp">SMP</option>
                <option value="smk">SMK</option>
              </select>
            </div>

            <SelectField
              id="field-kelas"
              label="Kelas"
              required
              className={inputClass(errors.class)}
              error={errors.class}
              value={classOptions.includes(form.class) || form.class === '' ? form.class : '__custom__'}
              placeholder="-- Pilih Kelas --"
              options={kelasOptions}
              onChange={(v) => {
                if (v !== '__custom__') setForm((prev) => ({ ...prev, class: v }));
                setErrors((prev) => ({ ...prev, class: '' }));
              }}
            />

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Angkatan</label>
              <input
                value={form.angkatan}
                onChange={set('angkatan')}
                placeholder="Contoh: 2026"
                className={inputClass()}
              />
            </div>

            <SelectField
              id="field-status"
              label="Status"
              className={inputClass()}
              value={form.status}
              options={statusOptions}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, status: v }));
                setErrors((prev) => ({ ...prev, status: '' }));
              }}
            />

            <SelectField
              id="field-category"
              label="Kategori"
              className={inputClass(errors.category)}
              value={form.category}
              options={categoryOptions}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, category: v }));
                setErrors((prev) => ({ ...prev, category: '' }));
              }}
            />
            {errors.category && <p className="mt-1 text-xs font-semibold text-red-500">{errors.category}</p>}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nama Wali</label>
              <input
                value={form.parent_name}
                onChange={set('parent_name')}
                placeholder="Nama orang tua / wali"
                className={inputClass()}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">No. HP Wali</label>
              <input
                value={form.parent_phone}
                onChange={set('parent_phone')}
                placeholder="Contoh: 081234567890"
                className={inputClass(errors.parent_phone)}
              />
              {errors.parent_phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.parent_phone}</p>}
            </div>

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Identitas & Orang Tua</p>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nama Ayah</label>
                  <input
                    value={form.father_name}
                    onChange={set('father_name')}
                    placeholder="Nama ayah kandung"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">No. HP Ayah</label>
                  <input
                    value={form.father_phone}
                    onChange={set('father_phone')}
                    inputMode="tel"
                    placeholder="Contoh: 081234567890"
                    className={inputClass(errors.father_phone)}
                  />
                  {errors.father_phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.father_phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Pekerjaan Ayah</label>
                  <input
                    value={form.father_occupation}
                    onChange={set('father_occupation')}
                    placeholder="Contoh: Wiraswasta, Petani"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Pekerjaan Ibu</label>
                  <input
                    value={form.mother_occupation}
                    onChange={set('mother_occupation')}
                    placeholder="Contoh: Ibu Rumah Tangga"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nama Ibu</label>
                  <input
                    value={form.mother_name}
                    onChange={set('mother_name')}
                    placeholder="Nama ibu kandung"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">No. HP Ibu</label>
                  <input
                    value={form.mother_phone}
                    onChange={set('mother_phone')}
                    inputMode="tel"
                    placeholder="Contoh: 081234567890"
                    className={inputClass(errors.mother_phone)}
                  />
                  {errors.mother_phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.mother_phone}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => router.push('/admin/kesantrian')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
