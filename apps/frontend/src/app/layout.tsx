import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pondok Pesantren Tahfidz Al-Qur'an Darussunnah - Parung, Bogor",
  description: "Mencetak generasi penghafal Al-Qur'an yang berakhlak mulia, mandiri, dan siap memimpin peradaban Rabbani.",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
