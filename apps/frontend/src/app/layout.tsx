import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL("https://darussunnahparung.com");
const siteTitle = "Pondok Pesantren Tahfidz Al-Qur'an Darussunnah - Parung, Bogor";
const siteDescription = "Mencetak generasi penghafal Al-Qur'an yang berakhlak mulia, mandiri, dan siap memimpin peradaban Rabbani.";
const defaultShareImage = "/assets/img/logo.jpg";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: "%s | Darussunnah Parung",
  },
  description: siteDescription,
  alternates: {
    // No root canonical: each page sets its own via generateMetadata (SEO-03).
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Darussunnah Parung",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: defaultShareImage,
        width: 1200,
        height: 630,
        alt: "Darussunnah Parung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultShareImage],
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
