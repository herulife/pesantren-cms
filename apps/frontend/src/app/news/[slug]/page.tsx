import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Newspaper, Tag } from 'lucide-react';
import { getNewsBySlug, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';

const siteUrl = 'https://darussunnahparung.com';
const defaultShareImage = `${siteUrl}/assets/img/logo.jpg`;

type NewsPageProps = {
  params: Promise<{ slug: string }>;
};

function absoluteUrl(value?: string | null) {
  if (!value) {
    return defaultShareImage;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return defaultShareImage;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, siteUrl).toString();
  }
}

function plainText(value?: string | null) {
  return (value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNewsImageUrl(imageUrl: unknown) {
  if (typeof imageUrl === 'string') {
    return absoluteUrl(resolveDisplayImageUrl(imageUrl));
  }

  if (imageUrl && typeof imageUrl === 'object' && 'Valid' in imageUrl && 'String' in imageUrl) {
    const candidate = imageUrl as { Valid?: boolean; String?: string };
    if (candidate.Valid && candidate.String) {
      return absoluteUrl(resolveDisplayImageUrl(candidate.String));
    }
  }

  return defaultShareImage;
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return {
      title: 'Berita tidak ditemukan',
      description: 'Berita yang Anda buka mungkin sudah dihapus atau tautannya tidak valid.',
      robots: { index: false, follow: false },
    };
  }

  const title = news.title || 'Kabar Darussunnah';
  const description =
    plainText(news.excerpt) ||
    plainText(news.content).slice(0, 155) ||
    'Ikuti kabar kegiatan, pengumuman, dan perkembangan terbaru dari Darussunnah Parung.';
  const pageUrl = `${siteUrl}/news/${news.slug || slug}`;
  const image = getNewsImageUrl(news.image_url);

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'id_ID',
      url: pageUrl,
      siteName: 'Darussunnah Parung',
      title,
      description,
      publishedTime: news.created_at || undefined,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

function formatPublishedDate(value: string) {
  if (!value) {
    return 'Baru saja';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Baru saja';
  }

  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Removed extractParagraphs as we now render HTML directly

export default async function NewsDetailPage({
  params,
}: NewsPageProps) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Newspaper className="text-slate-300" size={36} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Berita tidak ditemukan
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
            Berita yang Anda buka mungkin sudah dihapus atau tautannya tidak valid.
          </p>
          <Link
            href="/news"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft size={16} />
            Kembali ke Berita
          </Link>
        </div>
      </PublicLayout>
    );
  }


  const categoryName =
    typeof news.category_name === 'string'
      ? news.category_name
      : news.category_name?.Valid
        ? news.category_name.String
        : '';

  const imageUrl = 
    typeof news.image_url === 'string'
      ? news.image_url
      : news.image_url?.Valid
        ? news.image_url.String
        : '';

  return (
    <PublicLayout>
      <section className="bg-white px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <Link
              href="/news"
              className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-700 shadow-sm"
              title="Kembali ke Berita"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-emerald-600" />
              <span>{formatPublishedDate(news.created_at)}</span>
            </div>
            {categoryName ? (
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-600" />
                <span>{categoryName}</span>
              </div>
            ) : null}
          </div>

          {imageUrl ? (
            <div className="mt-6 sm:mt-8 mb-8 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 sm:border-slate-200 shadow-sm bg-slate-50 mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt={news.title} 
                className="w-full h-auto max-h-[350px] sm:max-h-[500px] object-cover"
              />
            </div>
          ) : null}

          <h1 className="mt-2 sm:mt-6 text-[28px] sm:text-4xl font-black leading-[1.2] tracking-tight text-slate-900 md:text-5xl">
            {news.title}
          </h1>

          {news.excerpt ? (
            <p className="mt-5 sm:mt-6 rounded-2xl sm:rounded-3xl border-l-4 sm:border-l sm:border border-emerald-400 sm:border-emerald-100 bg-emerald-50/50 sm:bg-emerald-50 px-5 sm:px-6 py-4 sm:py-5 text-[15px] sm:text-base leading-relaxed sm:leading-8 text-slate-700 italic sm:not-italic">
              {news.excerpt}
            </p>
          ) : null}

          {/* Share Buttons */}
          <div className="mt-8">
            <p className="text-sm font-bold text-slate-700 mb-3">Share this</p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=https://darussunnahparung.com/news/${news.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded bg-[#1877f2] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>

              {/* Twitter */}
              <a 
                href={`https://twitter.com/intent/tweet?url=https://darussunnahparung.com/news/${news.slug}&text=${encodeURIComponent(news.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded bg-[#1da1f2] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href={`https://www.linkedin.com/shareArticle?mini=true&url=https://darussunnahparung.com/news/${news.slug}&title=${encodeURIComponent(news.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded bg-[#0a66c2] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(news.title + " \nhttps://darussunnahparung.com/news/" + news.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded bg-[#25d366] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>

              {/* Share Count Placeholder */}
              <div className="flex flex-col items-center justify-center ml-2 border-l border-slate-200 pl-4">
                <span className="text-xl font-bold text-slate-800 leading-none">0</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Shares</span>
              </div>
            </div>
          </div>

          <article 
            className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8 text-base leading-8 text-slate-700 prose prose-slate prose-emerald max-w-none prose-img:rounded-xl prose-img:my-6 prose-a:text-emerald-600 hover:prose-a:text-emerald-700"
          >
            {news.content ? (
              <div 
                className="w-full"
                dangerouslySetInnerHTML={{ __html: news.content }} 
              />
            ) : (
              <p className="text-base leading-8 text-slate-500">
                Konten berita belum tersedia.
              </p>
            )}
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
