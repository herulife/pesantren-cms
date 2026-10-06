import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

/**
 * Alias lama. Dashboard audit yang aktif ada di /audit-hacked, jadi /audit-full
 * sebelumnya hanya menghasilkan halaman terpisah yang isinya tumpang tindih.
 *
 * Redirect permanen (308) dipilih, bukan 307, supaya mesin pencari berhenti
 * menghitung URL ini sebagai halaman terpisah. Hanya /audit-hacked yang tetap
 * hidup sebagai salinan kanonis laporan forensik.
 */
export const metadata: Metadata = {
  title: "Audit Teknis | Darussunnah Parung",
  robots: { index: false, follow: false },
};

export default function AuditFullPage() {
  permanentRedirect("/audit-hacked");
}