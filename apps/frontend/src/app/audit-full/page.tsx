import type { Metadata } from "next";
import { cookies } from "next/headers";
import AuditFullDashboard from "@/components/audit/AuditFullDashboard";
import { redirect } from "next/navigation";
import type { Severity } from "@/lib/audit-full-types";
import {
  FINDINGS,
  FORENSIC_FACTS,
  FORENSIC_GAPS,
  FORENSIC_TIMELINE,
  HEADLINE_METRICS,
  METHOD,
  PAGE_AUDIT,
  SCORE,
} from "@/lib/audit-full-data";

export const metadata: Metadata = {
  title: "Audit Lengkap — Keamanan, Performa, Aksesibilitas | Darussunnah Parung",
  description:
    "Laporan audit lengkap aplikasi Darussunnah Parung: temuan keamanan, bug fungsional, performa, aksesibilitas, SEO, kualitas kode, dan rekonstruksi forensik insiden 21 September 2026. Dokumen internal.",
  robots: { index: false, follow: false, nocache: true },
  alternates: {
    canonical: "https://darussunnahparung.com/audit-full",
  },
};

// The report carries file paths and forensic detail, so it is rendered per
// request behind an admin check rather than prerendered into a public file.
export const dynamic = "force-dynamic";

const BACKEND_INTERNAL =
  process.env.INTERNAL_API_URL || "http://darussunnah-backend:8080/api";

/**
 * Confirms the session cookie against the backend and returns the role.
 *
 * The middleware only decodes the JWT to read `exp`; it never verifies the
 * signature, so it cannot be the authority here. This call lets the backend do
 * the verification and the role lookup, and returns null for anything that is
 * not a live superadmin session.
 */
async function resolveRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_INTERNAL}/me`, {
      headers: { Cookie: `darussunnah_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; user?: { role?: string } };
    if (!data.success || !data.user?.role) return null;
    return data.user.role;
  } catch {
    return null;
  }
}

export default async function AuditFullPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  const store = await cookies();
  const token =
    store.get("darussunnah_token")?.value || store.get("token")?.value;

  const role = await resolveRole(token);
  if (role !== "superadmin") {
    redirect("/login?next=/audit-full");
  }

  const { severity } = await searchParams;
  const activeFilter: "all" | Severity =
    severity === "critical" ||
    severity === "high" ||
    severity === "medium" ||
    severity === "low"
      ? severity
      : "all";

  return (
    <AuditFullDashboard
      findings={FINDINGS}
      metrics={HEADLINE_METRICS}
      pageAudit={PAGE_AUDIT}
      timeline={FORENSIC_TIMELINE}
      forensicFacts={FORENSIC_FACTS}
      forensicGaps={FORENSIC_GAPS}
      method={METHOD}
      score={SCORE}
      activeFilter={activeFilter}
    />
  );
}
