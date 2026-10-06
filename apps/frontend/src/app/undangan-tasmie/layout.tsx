import type { Metadata } from 'next';

const title = 'Undangan Tasmie Akhir & Pelepasan Darussunnah 2026';
const description =
  'Undangan Tasmie Akhir & Pelepasan SMP Angkatan XI dan SMA Angkatan IX Darussunnah Islamic Boarding School, Sabtu 27 Juni 2026.';
const url = 'https://darussunnahparung.com/undangan-tasmie';
const image = 'https://darussunnahparung.com/assets/img/tasmi-og-2026.jpg';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url,
    siteName: 'Darussunnah Parung',
    title,
    description,
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

export default function UndanganTasmieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
