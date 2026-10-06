import type { Metadata } from "next";
import AuditDashboard from "@/components/audit/AuditDashboard";

export const metadata: Metadata = {
  title: "Audit Teknis | Darussunnah Parung",
  description:
    "Dashboard audit teknis internal aplikasi Darussunnah Parung — keamanan, performa, SEO, aksesibilitas, kualitas kode, dan keandalan.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://darussunnahparung.com/audit",
  },
};

export default function AuditPage() {
  return <AuditDashboard />;
}
