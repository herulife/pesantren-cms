'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Gauge,
  Globe,
  Accessibility,
  Code2,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  Lock,
} from 'lucide-react';
import {
  AUDIT_ISSUES,
  computeAllScores,
  severityCounts,
  statusCounts,
  categoryBreakdown,
  TECHNICAL_INFO,
  SCORE_CARDS,
  type AuditIssue,
  type AuditSeverity,
} from '@/lib/audit-data';

const SEVERITY_META: Record<
  AuditSeverity,
  { label: string; badge: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    badge: 'bg-red-100 text-red-700 ring-red-600/20',
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    badge: 'bg-orange-100 text-orange-700 ring-orange-600/20',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    badge: 'bg-sky-100 text-sky-700 ring-sky-600/20',
    dot: 'bg-sky-500',
  },
  info: {
    label: 'Info',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dot: 'bg-slate-400',
  },
};

const CARD_ICON: Record<string, React.ReactNode> = {
  Security: <ShieldCheck className="h-5 w-5" />,
  Performance: <Gauge className="h-5 w-5" />,
  SEO: <Globe className="h-5 w-5" />,
  Accessibility: <Accessibility className="h-5 w-5" />,
  'Code Quality': <Code2 className="h-5 w-5" />,
  Reliability: <Database className="h-5 w-5" />,
};

function scoreTone(score: number): { text: string; bar: string; ring: string } {
  if (score >= 80) return { text: 'text-emerald-600', bar: 'bg-emerald-500', ring: '#059669' };
  if (score >= 60) return { text: 'text-amber-600', bar: 'bg-amber-500', ring: '#d97706' };
  return { text: 'text-red-600', bar: 'bg-red-500', ring: '#dc2626' };
}

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const tone = scoreTone(value);
  return (
    <div className="relative h-36 w-36">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${tone.text}`}>{value}</span>
        <span className="text-xs font-medium text-slate-500">Overall</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${m.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AuditIssue['status'] }) {
  if (status === 'fixed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Fixed
      </span>
    );
  }
  if (status === 'not_measured') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
        <Info className="h-3.5 w-3.5" aria-hidden="true" /> Not measured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">
      Open
    </span>
  );
}

export default function AuditDashboard() {
  const [sevFilter, setSevFilter] = useState<'all' | AuditSeverity>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'fixed'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { scores, overall } = useMemo(() => computeAllScores(), []);
  const sev = useMemo(() => severityCounts(), []);
  const stat = useMemo(() => statusCounts(), []);
  const cats = useMemo(() => categoryBreakdown(), []);

  const categories = useMemo(
    () => Array.from(new Set(AUDIT_ISSUES.map((i) => i.category))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUDIT_ISSUES.filter((i) => {
      if (sevFilter !== 'all' && i.severity !== sevFilter) return false;
      if (catFilter !== 'all' && i.category !== catFilter) return false;
      if (statusFilter === 'open' && i.status !== 'open') return false;
      if (statusFilter === 'fixed' && i.status !== 'fixed') return false;
      if (q) {
        const hay = `${i.id} ${i.title} ${i.description} ${i.category} ${i.recommendation ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const order: AuditSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });
  }, [sevFilter, catFilter, statusFilter, query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Audit Teknis
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Ringkasan hasil audit kode &amp; infrastruktur aplikasi Darussunnah Parung.
              Skor dihitung otomatis dari temuan audit (bukan hardcode).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Halaman internal &amp; terlindungi
          </div>
        </header>

        {/* Overview: overall + cards */}
        <section aria-label="Ringkasan skor" className="mb-8 grid gap-5 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ScoreRing value={overall} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {SCORE_CARDS.map((card) => {
              const s = scores[card.key];
              const tone = scoreTone(s);
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {card.label}
                    </span>
                    <span className="text-slate-400">{CARD_ICON[card.key]}</span>
                  </div>
                  <div className={`mt-2 text-3xl font-extrabold ${tone.text}`}>{s}</div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${s}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary counts */}
        <section aria-label="Ringkasan temuan" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryTile label="Critical" value={sev.critical} tone="text-red-600" icon={<XCircle className="h-4 w-4" />} />
          <SummaryTile label="High" value={sev.high} tone="text-orange-600" icon={<AlertTriangle className="h-4 w-4" />} />
          <SummaryTile label="Medium" value={sev.medium} tone="text-amber-600" icon={<AlertTriangle className="h-4 w-4" />} />
          <SummaryTile label="Low" value={sev.low} tone="text-sky-600" icon={<Info className="h-4 w-4" />} />
          <SummaryTile label="Info" value={sev.info} tone="text-slate-500" icon={<Info className="h-4 w-4" />} />
          <SummaryTile label="Fixed" value={stat.fixed} tone="text-emerald-600" icon={<CheckCircle2 className="h-4 w-4" />} />
        </section>

        {/* Category breakdown */}
        <section aria-label="Skor per kategori" className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
            Skor per Kategori
          </h2>
          <div className="space-y-3">
            {cats.map((c) => {
              const tone = scoreTone(c.score);
              return (
                <div key={c.category} className="grid grid-cols-[10rem_1fr_4rem] items-center gap-3">
                  <span className="truncate text-sm font-medium text-slate-700">{c.category}</span>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-2.5 rounded-full ${tone.bar}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <span className={`text-right text-sm font-bold ${tone.text}`}>{c.score}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Issue explorer */}
        <section aria-label="Eksplorasi temuan" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Temuan ({filtered.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari temuan…"
                  aria-label="Cari temuan"
                  className="w-44 rounded-lg border border-slate-300 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value as 'all' | AuditSeverity)}
                aria-label="Filter severitas"
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">Semua severitas</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter kategori"
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'fixed')}
                aria-label="Filter status"
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">Semua status</option>
                <option value="open">Open</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {filtered.map((issue) => {
              const isOpen = expanded === issue.id;
              return (
                <li key={issue.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : issue.id)}
                    aria-expanded={isOpen}
                    aria-controls={`detail-${issue.id}`}
                    className="flex w-full items-center gap-3 py-3 text-left outline-none hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="w-16 shrink-0 font-mono text-xs text-slate-500">{issue.id}</span>
                    <SeverityBadge severity={issue.severity} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {issue.title}
                    </span>
                    <StatusBadge status={issue.status} />
                  </button>
                  {isOpen && (
                    <div
                      id={`detail-${issue.id}`}
                      className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"
                    >
                      <div className="sm:col-span-2">
                        <Field label="Kategori">{issue.category}</Field>
                        <Field label="Deskripsi">{issue.description}</Field>
                      </div>
                      {issue.impact && (
                        <Field label="Dampak">{issue.impact}</Field>
                      )}
                      {issue.evidence && (
                        <Field label="Bukti">{issue.evidence}</Field>
                      )}
                      {issue.file && (
                        <Field label="Lokasi">
                          <code className="break-all rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                            {issue.file}
                            {issue.line ? `:${issue.line}` : ''}
                          </code>
                        </Field>
                      )}
                      {issue.recommendation && (
                        <div className="sm:col-span-2">
                          <Field label="Rekomendasi">{issue.recommendation}</Field>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-400">Tidak ada temuan yang cocok.</li>
            )}
          </ul>
        </section>

        {/* Technical info */}
        <section aria-label="Informasi teknis" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
            Informasi Teknis &amp; Lingkungan
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <TechRow label="Framework" value={TECHNICAL_INFO.framework} />
            <TechRow label="Backend" value={TECHNICAL_INFO.backend} />
            <TechRow label="Runtime" value={TECHNICAL_INFO.runtime} />
            <TechRow label="Package manager" value={TECHNICAL_INFO.packageManager} />
            <TechRow label="Database" value={TECHNICAL_INFO.database} />
            <TechRow label="Rendering" value={TECHNICAL_INFO.rendering} />
            <TechRow label="Build" value={TECHNICAL_INFO.build} />
            <TechRow label="Lint" value={TECHNICAL_INFO.lint} />
            <TechRow label="Typecheck" value={TECHNICAL_INFO.typecheck} />
            <TechRow label="Tests" value={TECHNICAL_INFO.tests} />
            <TechRow label="Dependency audit" value={TECHNICAL_INFO.dependencyAudit} />
            <TechRow label="Environment" value={TECHNICAL_INFO.environment} />
            <TechRow label="Audit version" value={TECHNICAL_INFO.auditVersion} />
            <TechRow label="Last audit" value={TECHNICAL_INFO.lastAudit} />
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Metodologi: temuan dikumpulkan dari peninjauan kode statis (backend Go &amp; frontend Next.js),
            konfigurasi deploy (nginx/docker-compose/Dockerfile), dan pemindaian dependensi. Skor kategori
            dihitung dari penalti severitas temuan yang masih terbuka. Halaman ini tidak menampilkan kredensial
            atau rahasia apa pun.
          </p>
        </section>
      </div>
    </main>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span className={tone}>{icon}</span>
      </div>
      <div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-700">{children}</dd>
    </div>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-slate-100 py-1.5">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
