'use client';

import { useState } from 'react';
import { normalizeApiAssetUrl } from '@/lib/api';

interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'h10' | 'h14';
  /** Class tambahan untuk warna/ring avatar (dipakai portal: cincin putih). */
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-9 w-9 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
  // j70: dua ukuran ini khusus FloatingQuickMenu — panelnya h-10 dan tombol
  // bulatnya h-14, dan tidak ada kunci lain yang cocok. Menambah kunci di sini
  // lebih dapat diprediksi daripada className yang menimpa h-8/h-9.
  h10: 'h-10 w-10 text-sm',
  h14: 'h-14 w-14 text-base',
};

// Inisial: 1 huruf untuk staff (sesuai versi lama header), 2 huruf untuk portal
// (meniru perilaku lama di portal/layout.tsx).
function initialsOf(name: string | null | undefined, count: number) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/**
 * Avatar user: tampilkan foto bila ada, fallback ke inisial.
 *
 * Satu komponen dipakai oleh portal, header dashboard, sidebar admin, menu
 * cepat mengambang, dan /admin/akun supaya avatar tidak berbeda di lima tempat.
 *
 * Pakai <img> telanjang, bukan next/image: avatar 36-96px, bukan konten utama,
 * dan next/image hanya menambah request ke image optimizer tanpa benefits
 * (repo juga sudah memakai <img> di beberapa halaman).
 */
export default function UserAvatar({ name, photoUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const src = normalizeApiAssetUrl(photoUrl);
  // j70: h10/h14 ikut 1 huruf supaya sama dengan tampilan FAB lama.
  const count = size === 'sm' || size === 'h10' || size === 'h14' ? 1 : 2;
  // Simpan path yang GAGAL dimuat, bukan boolean. Kalau src berganti (foto baru),
  // failedSrc lama otomatis tidak sama dengan src sehingga tampil inisial tanpa
  // perlu reset manual. Pola ini menghindari setState di dalam effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  // src kosong = belum pasang foto. failed = foto ini 404/hilang di server.
  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 font-black text-white ${className}`}
      >
        {initialsOf(name, count) || 'A'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto profil ${name || 'pengguna'}`}
      onError={() => setFailedSrc(src)}
      className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
