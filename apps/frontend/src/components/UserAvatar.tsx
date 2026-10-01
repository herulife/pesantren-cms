import Image from 'next/image';
import { useState } from 'react';
import { normalizeApiAssetUrl } from '@/lib/api';

interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
}

const SIZE_CLASS: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
};

/**
 * Avatar user: menampilkan foto bila ada, fallback ke inisial huruf.
 * Satu komponen dipakai header, sidebar, dan /admin/akun supaya tampilan
 * avatar tidak berbeda di tiga tempat.
 */
export default function UserAvatar({
  name,
  photoUrl,
  size = 'sm',
  className = '',
  alt,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = normalizeApiAssetUrl(photoUrl);
  const initial = (name || 'A').trim().charAt(0).toUpperCase();
  const dimension = size === 'sm' ? 36 : size === 'md' ? 64 : 96;

  // failed = file lama 404 setelah user ganti foto; jangan tampilkan rusak.
  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-full bg-sky-600 font-black text-white ${className}`}
      >
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? `Foto profil ${name || 'user'}`}
      width={dimension}
      height={dimension}
      onError={() => setFailed(true)}
      className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
