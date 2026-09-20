'use client';

// Bukti transfer privat (jilid 13): JANGAN pakai <img src=url> mentah —
// browser tidak menyertakan konteks auth yang andal dan respons 401/403
// JSON bisa tampil sebagai "gambar rusak". Komponen ini memuat via fetch
// berauth (cookie alma_token) menjadi blob, plus pesan ramah saat gagal.

import React, { useEffect, useState } from 'react';
import { ImageOff, RefreshCw } from 'lucide-react';
import { resolveDisplayImageUrl } from '@/lib/api';

export async function fetchProofBlobUrl(rawUrl: string | undefined | null): Promise<string> {
  const url = resolveDisplayImageUrl(rawUrl || '');
  if (!url) throw new Error('URL bukti kosong.');
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Sesi berakhir atau tidak ada akses. Masuk kembali lalu coba lagi.');
  }
  if (!res.ok) throw new Error('Bukti tidak dapat dimuat saat ini.');
  return URL.createObjectURL(await res.blob());
}

export function openProofInNewTab(rawUrl: string | undefined | null, onError?: (msg: string) => void): Promise<void> {
  return fetchProofBlobUrl(rawUrl).then((objUrl) => {
    window.open(objUrl, '_blank', 'noopener,noreferrer');
  }).catch((e: unknown) => {
    onError?.(e instanceof Error ? e.message : 'Gagal membuka bukti.');
  });
}

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

export default function ProofImage({ src, alt, className }: Props) {
  // Reset ke loading setiap src berubah (pola adjust-state-during-render
  // yang resmi React — bukan setState di dalam effect).
  const [currentSrc, setCurrentSrc] = useState(src);
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ok'; url?: string; msg?: string }>(() => ({
    status: 'loading',
  }));
  if (currentSrc !== src) {
    setCurrentSrc(src);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    let alive = true;
    let obj = '';
    fetchProofBlobUrl(currentSrc)
      .then((u) => {
        obj = u;
        if (alive) setState({ status: 'ok', url: u });
      })
      .catch((e: unknown) => {
        if (alive) {
          setState({
            status: 'error',
            msg: e instanceof Error ? e.message : 'Bukti tidak dapat dimuat.',
          });
        }
      });
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [currentSrc]);

  if (state.status === 'loading') {
    return (
      <div className={`${className || ''} flex items-center justify-center bg-slate-100`} aria-label="Memuat bukti">
        <RefreshCw size={20} className="animate-spin text-sky-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={`${className || ''} flex flex-col items-center justify-center gap-1 bg-slate-100 p-3 text-center`} role="alert">
        <ImageOff size={20} className="text-slate-400" />
        <p className="text-[11px] font-bold leading-4 text-slate-500">{state.msg}</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={state.url} alt={alt || 'Bukti transfer'} className={className} referrerPolicy="no-referrer" />
  );
}
