'use client';

import { useEffect, useState } from 'react';
import { normalizeApiAssetUrl } from '@/lib/api';

interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Class tambahan untuk warna/ring avatar (dipakai portal: cincin putih). */
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-9 w-9 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
};

// Inisial: 1 huruf untuk staff (sesuai versi lama header), 2 huruf untuk portal
// (meniru perilaku lama di portal/layout.tsx).
function initialsOf(name?: string | null, count: number) {
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
 * Satu komponen dipakai oleh portal, header dashboard, sidebar, dan
 * /admin/akun supaya avatar tidak berbeda di empat tempat.
 *
 * Pakai <img> telanjang, bukan next/image: avatar 36-96px, bukan konten utama,
 * dan next/image hanya menambah request ke image optimizer tanpa benefits
 * (repo juga sudah memakai <img> di beberapa halaman).
 */
export default function UserAvatar({ name, photoUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = normalizeApiAssetUrl(photoUrl);
  const count = size === 'sm' ? 1 : 2;
  // Reset error saat foto berganti: user baru saja pasang foto baru, jadi
  // flag failed dari foto lama tidak boleh masih aktif.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  // src kosong = belum pasang foto. failed = file 404/hilang di server.
  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-black text-white ${className}`}
      >
        {initialsOf(name, count) || 'A'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto profil ${name || 'pengguna'}`}
      onError={() => setFailed(true)}
      className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
