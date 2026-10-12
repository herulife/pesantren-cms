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
  metadataBase: new URL('https://darussunnahparung.com'),
  title: {
    default: "Pondok Pesantren Tahfidzul Qur'an Darussunnah - Parung, Bogor",
    template: '%s | Darussunnah Parung',
  },
  description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Darussunnah Parung, Bogor. Informasi profil, program, dan pendaftaran santri baru.",
  keywords: ['Pondok Pesantren', 'Tahfidz Quran', 'Darussunnah Parung', 'PSB', 'Santri', 'Bogor', 'Pesantren Tahfidz'],
  authors: [{ name: 'Pondok Pesantren Darussunnah Parung' }],
  creator: 'Darussunnah Parung',
  publisher: 'Darussunnah Parung',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://darussunnahparung.com',
    siteName: 'Darussunnah Parung',
    title: "Pondok Pesantren Tahfidzul Qur'an Darussunnah - Parung, Bogor",
    description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Darussunnah Parung, Bogor. Informasi profil, program, dan pendaftaran santri baru.",
    images: [{ url: '/assets/img/logo.jpg', width: 512, height: 512, alt: 'Logo Darussunnah Parung' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Pondok Pesantren Tahfidzul Qur'an Darussunnah - Parung, Bogor",
    description: "Website resmi Pondok Pesantren Tahfidzul Qur'an Darussunnah Parung, Bogor.",
    images: ['/assets/img/logo.jpg'],
  },
  icons: {
    icon: "/assets/img/logo.jpg",
    shortcut: "/assets/img/logo.jpg",
    apple: "/assets/img/logo.jpg",
  },
  robots: { index: true, follow: true },
};

import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { AuthProvider } from "@/components/AuthProvider";
import PushNotifProvider from "@/components/PushNotifProvider";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: "Pondok Pesantren Tahfidzul Qur'an Darussunnah Parung",
              url: 'https://darussunnahparung.com',
              logo: 'https://darussunnahparung.com/assets/img/logo.jpg',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Parung',
                addressLocality: 'Bogor',
                addressRegion: 'Jawa Barat',
                postalCode: '16330',
                addressCountry: 'ID',
              },
              sameAs: ['https://instagram.com/yayasandarussunnah'],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} min-h-full flex flex-col`}>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ConfirmProvider>
          <PushNotifProvider />
        </ToastProvider>
      </body>
    </html>
  );
}
