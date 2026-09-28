// Shared types and visual tokens for the audit report.
// This module is safe to import from client components: it contains no
// findings, no file paths, and no forensic detail. The data itself lives in
// audit-full-data.ts, which is only ever imported by the server component.

export type Severity = "critical" | "high" | "medium" | "low";

export type Domain =
  | "Keamanan"
  | "Fungsional"
  | "Performa"
  | "Aksesibilitas"
  | "SEO"
  | "Kualitas Kode"
  | "Operasional";

export type Effort = "kecil" | "sedang" | "besar";

export interface Finding {
  id: string;
  severity: Severity;
  domain: Domain;
  title: string;
  impact: string;
  evidence: string[];
  fix: string;
  effort: Effort;
}

export interface Measurement {
  label: string;
  value: string;
  note: string;
  tone: "good" | "warn" | "bad";
}

export interface PageAuditRow {
  path: string;
  label: string;
  status: number;
  ms: number;
  h1: number;
  img: number;
  imgNoDims: number;
  btnNoLabel: number;
  note: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
  tone: "good" | "warn" | "bad";
}

export interface ForensicFact {
  label: string;
  value: string;
  note: string;
}

export interface MethodStep {
  step: string;
  title: string;
  body: string;
}

export interface AuditScore {
  security: number;
  performance: number;
  accessibility: number;
  seo: number;
  reliability: number;
  overall: number;
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export const SEVERITY_META: Record<
  Severity,
  { label: string; rank: number; fg: string; bg: string; border: string }
> = {
  critical: {
    label: "Kritis",
    rank: 0,
    fg: "#8C1D1D",
    bg: "#FBEAEA",
    border: "#E3B4B4",
  },
  high: {
    label: "Tinggi",
    rank: 1,
    fg: "#8A4B08",
    bg: "#FBF0E2",
    border: "#E0C08A",
  },
  medium: {
    label: "Sedang",
    rank: 2,
    fg: "#0A5A6E",
    bg: "#E6F1F4",
    border: "#9FCBD6",
  },
  low: {
    label: "Rendah",
    rank: 3,
    fg: "#4A5560",
    bg: "#EFF1F3",
    border: "#C4CBD2",
  },
};

export const DOMAIN_META: Record<Domain, string> = {
  Keamanan: "#0F6D3F",
  Fungsional: "#0A5A6E",
  Performa: "#8A4B08",
  Aksesibilitas: "#5B3E86",
  SEO: "#0F6D3F",
  "Kualitas Kode": "#4A5560",
  Operasional: "#8C1D1D",
};
