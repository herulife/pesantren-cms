import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

/**
 * Halaman lama berisi ringkasan hasil audit. Isinya sekarang sepenuhnya duplikat
 * dari /audit-hacked, jadi halaman ini diarahkan ke sana agar hanya ada satu URL
 * laporan yang bisa dibagikan.
 *
 * 308 (permanent) dipilih supaya tautan lama tidak terus dihitung sebagai URL
 * terpisah dan supaya status tidak berubah lagi setelah di-cache.
 */
export const metadata: Metadata = {
  title: "Hasil Audit Keamanan & Performa — darussunnahparung.com",
  robots: { index: false, follow: false },
};

export default function AuditHasilPage() {
  permanentRedirect("/audit-hacked");
}