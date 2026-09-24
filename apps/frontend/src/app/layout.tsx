import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://almaparung.com'),
  title: {
    default: "Pondok Pesantren Tahfidzul Qur'an Al-Maa - Parung, Bogor",
    template: '%s | Al-Maa Parung',
  },
  description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Al-Maa Parung, Bogor. Informasi profil, program, dan pendaftaran santri baru.",
  keywords: ['Pondok Pesantren', 'Tahfidz Quran', 'Al-Maa Parung', 'PSB', 'Santri', 'Bogor', 'Pesantren Tahfidz'],
  authors: [{ name: 'Pondok Pesantren Al-Maa Parung' }],
  creator: 'Al-Maa Parung',
  publisher: 'Al-Maa Parung',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://almaparung.com',
    siteName: 'Al-Maa Parung',
    title: "Pondok Pesantren Tahfidzul Qur'an Al-Maa - Parung, Bogor",
    description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Al-Maa Parung, Bogor. Informasi profil, program, dan pendaftaran santri baru.",
    images: [{ url: '/assets/img/logo-alama.jpg', width: 512, height: 512, alt: 'Logo Al-Maa Parung' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Pondok Pesantren Tahfidzul Qur'an Al-Maa - Parung, Bogor",
    description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Al-Maa Parung, Bogor.",
    images: ['/assets/img/logo-alama.jpg'],
  },
  icons: {
    icon: "/assets/img/logo-alama.jpg",
    shortcut: "/assets/img/logo-alama.jpg",
    apple: "/assets/img/logo-alama.jpg",
  },
  robots: { index: true, follow: true },
};

import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: "Pondok Pesantren Tahfidzul Qur'an Al-Maa Parung",
              url: 'https://almaparung.com',
              logo: 'https://almaparung.com/assets/img/logo-alama.jpg',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Parung',
                addressLocality: 'Bogor',
                addressRegion: 'Jawa Barat',
                postalCode: '16330',
                addressCountry: 'ID',
              },
              sameAs: ['https://instagram.com/yayasanalmaa'],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} min-h-full flex flex-col`}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
