'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface Props {
  url: string;
  thumbnail?: string;
  title?: string;
}

export default function VideoEmbed({ url, thumbnail, title }: Props) {
  const [playing, setPlaying] = useState(false);

  const getYoutubeId = (u: string) => {
    const match = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(url);

  if (playing && videoId) {
    return (
      <div className="aspect-video rounded-[1.5rem] overflow-hidden shadow-[0_25px_60px_-20px_rgba(0,0,0,0.35)]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title || 'Video Profil'}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-[0_25px_60px_-20px_rgba(0,0,0,0.35)] bg-slate-900 cursor-pointer group"
      onClick={() => setPlaying(true)}
    >
      {thumbnail ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${thumbnail}')` }}
        />
      ) : videoId ? (
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={title || 'Video'}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl scale-150 transition-all duration-500 group-hover:bg-emerald-400/50 group-hover:scale-[2]" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white transition-all duration-500 group-hover:scale-110 group-hover:bg-emerald-500/40 group-hover:border-emerald-300/50 group-hover:shadow-[0_0_50px_rgba(52,211,153,0.3)]">
            <Play size={36} className="ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {title && (
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <p className="text-white text-lg font-bold drop-shadow-lg">{title}</p>
        </div>
      )}

      <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur-md opacity-0 transition-all duration-300 group-hover:opacity-100">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
        Putar Video
      </div>
    </div>
  );
}
