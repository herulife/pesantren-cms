import Link from "next/link";
import {
  DOMAIN_META,
  SEVERITY_META,
  SEVERITY_ORDER,
  type AuditScore,
  type Domain,
  type Finding,
  type ForensicFact,
  type Measurement,
  type MethodStep,
  type PageAuditRow,
  type Severity,
  type TimelineEntry,
} from "@/lib/audit-full-types";

const INK = "#12171C";
const MUTED = "#5A6472";
const RULE = "#D6DADE";
const PAPER = "#FCFCFB";
const PANEL = "#FFFFFF";
const MONO =
  "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', monospace";

const SANS =
  "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";

type Filter = Severity | "all";

export interface AuditFullDashboardProps {
  findings: Finding[];
  metrics: Measurement[];
  pageAudit: PageAuditRow[];
  timeline: TimelineEntry[];
  forensicFacts: ForensicFact[];
  forensicGaps: string[];
  method: MethodStep[];
  score: AuditScore;
  activeFilter: Filter;
}

function Pill({
  children,
  fg,
  bg,
  border,
}: {
  children: React.ReactNode;
  fg: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.5,
        color: fg,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 3,
        padding: "1px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Section({
  id,
  title,
  lead,
  aside,
  children,
}: {
  id: string;
  title: string;
  lead: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 24 }}>
      <div
        style={{
          borderTop: `2px solid ${INK}`,
          paddingTop: 12,
          marginBottom: 22,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            color: INK,
          }}
        >
          {title}
        </h2>
        {aside}
      </div>
      <p
        style={{
          margin: "0 0 20px",
          maxWidth: "68ch",
          fontSize: 15,
          lineHeight: 1.65,
          color: MUTED,
        }}
      >
        {lead}
      </p>
      {children}
    </section>
  );
}

// Renders entirely on the server. Passing the findings to a client component
// would let Next inline the payload into a public static chunk, which would
// expose the report to anyone who guesses the chunk filename regardless of the
// auth gate. Disclosure uses native <details>, filtering uses query params, so
// the page needs no client-side JavaScript at all.
export default function AuditFullDashboard({
  findings,
  metrics,
  pageAudit,
  timeline,
  forensicFacts,
  forensicGaps,
  method,
  score,
  activeFilter,
}: AuditFullDashboardProps) {
  const visible =
    activeFilter === "all"
      ? findings
      : findings.filter((f) => f.severity === activeFilter);

  const counts = new Map<Filter, number>([["all", findings.length]]);
  for (const s of SEVERITY_ORDER) {
    counts.set(
      s,
      findings.filter((f) => f.severity === s).length
    );
  }

  const domainCounts: Partial<Record<Domain, number>> = {};
  for (const f of findings) {
    domainCounts[f.domain] = (domainCounts[f.domain] ?? 0) + 1;
  }

  const filterHref = (key: Filter) =>
    key === "all" ? "/audit-full" : `/audit-full?severity=${key}`;

  return (
    <main
      style={{
        background: PAPER,
        color: INK,
        fontFamily: SANS,
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "40px 24px 96px",
        }}
      >
        <header>
          <div
            style={{
              border: "1px solid #E3B4B4",
              background: "#FBEAEA",
              color: "#8C1D1D",
              borderRadius: 4,
              padding: "12px 16px",
              fontSize: 13.5,
              lineHeight: 1.55,
              marginBottom: 32,
            }}
          >
            <strong style={{ fontWeight: 800 }}>Dokumen internal, jangan dipublikasikan.</strong>{" "}
            Halaman ini memuat path berkas, konfigurasi, dan hasil forensik
            insiden. Isinya hanya dirender untuk sesi superadmin, dan tidak
            masuk ke bundel JavaScript mana pun.
          </div>

          <p
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: MUTED,
              margin: "0 0 10px",
            }}
          >
            darussunnahparung.com · audit kode, runtime, peramban, dan forensik
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 5.2vw, 50px)",
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              margin: "0 0 18px",
              maxWidth: "20ch",
            }}
          >
            Dua celah yang membuat situs ini belum siap produksi
          </h1>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: MUTED,
              maxWidth: "62ch",
              margin: "0 0 30px",
            }}
          >
            Rate limiter login bisa dilewati dengan memalsukan satu header, dan
            halaman donasi publik memanggil endpoint yang hanya boleh dibuka
            untuk role bendahara. Keduanya sudah dibuktikan ulang langsung
            terhadap server yang sedang berjalan, bukan dibaca dari asumsi.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              flexWrap: "wrap",
              borderTop: `1px solid ${RULE}`,
              paddingTop: 18,
            }}
          >
            <span
              style={{
                fontSize: 46,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#8A4B08",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score.overall}
            </span>
            <span style={{ fontSize: 14, color: MUTED, maxWidth: "46ch" }}>
              Skor agregat dari enam dimensi, skala 0–100. Bukan standar resmi —
              ini ringkasan proporsi temuan tertutup versus terbuka per dimensi.
            </span>
          </div>
        </header>

        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: INK,
            margin: "40px 0 0",
          }}
        />

        <section style={{ margin: "0 0 56px" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              margin: 0,
              borderLeft: `1px solid ${RULE}`,
            }}
          >
            {metrics.map((m) => {
              const tone =
                m.tone === "bad"
                  ? { fg: "#8C1D1D" }
                  : m.tone === "warn"
                    ? { fg: "#8A4B08" }
                    : { fg: "#0F6D3F" };
              return (
                <div
                  key={m.label}
                  style={{
                    borderRight: `1px solid ${RULE}`,
                    borderTop: `1px solid ${RULE}`,
                    borderBottom: `1px solid ${RULE}`,
                    padding: "18px 18px 20px",
                  }}
                >
                  <dt
                    style={{
                      fontSize: 12,
                      color: MUTED,
                      marginBottom: 8,
                    }}
                  >
                    {m.label}
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 27,
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        color: tone.fg,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {m.value}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        color: MUTED,
                        marginTop: 6,
                        lineHeight: 1.45,
                      }}
                    >
                      {m.note}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <Section
          id="ringkasan"
          title="Ringkasan per dimensi"
          lead="Enam dimensi dinilai dari pengukuran yang bisa diulang, bukan pemeriksaan daftar periksa."
          aside={
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
              skor / 100
            </span>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            {(
              [
                ["Keamanan", "Keamanan", score.security],
                ["Performa", "Performa", score.performance],
                ["Aksesibilitas", "Aksesibilitas", score.accessibility],
                ["SEO", "SEO", score.seo],
                ["Keandalan", "Operasional", score.reliability],
                ["Kualitas kode", "Kualitas Kode", score.overall],
              ] as const
            ).map(([label, domain, value]) => {
              const count = domainCounts[domain] ?? 0;
              return (
                <div key={label} style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 15,
                        fontWeight: 700,
                        color:
                          value < 50
                            ? "#8C1D1D"
                            : value < 70
                              ? "#8A4B08"
                              : "#0F6D3F",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 6,
                      background: "#EBEDEF",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${value}%`,
                        height: "100%",
                        background:
                          value < 50
                            ? "#8C1D1D"
                            : value < 70
                              ? "#B0762A"
                              : "#0F6D3F",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: MUTED,
                      margin: "9px 0 0",
                      lineHeight: 1.45,
                    }}
                  >
                    {count} temuan
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          id="temuan"
          title="Ledger temuan"
          lead="Setiap baris adalah satu temuan dengan bukti file:baris atau angka pengukuran. Buka baris untuk melihat dampak, bukti, dan perbaikannya."
          aside={
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
              {visible.length} dari {findings.length} tampil
            </span>
          }
        >
          <nav
            aria-label="Saring temuan berdasarkan tingkat keparahan"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {(
              [
                ["all", "Semua"],
                ...SEVERITY_ORDER.map((s) => [s, SEVERITY_META[s].label] as const),
              ] as [Filter, string][]
            ).map(([key, label]) => {
              const active = activeFilter === key;
              const meta = key === "all" ? null : SEVERITY_META[key];
              return (
                <Link
                  key={key}
                  href={filterHref(key)}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "7px 13px",
                    borderRadius: 4,
                    border: `1px solid ${active ? INK : RULE}`,
                    background: active ? INK : PANEL,
                    color: active ? "#FFFFFF" : INK,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {meta ? (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: meta.fg,
                      }}
                    />
                  ) : null}
                  {label}
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      opacity: active ? 0.75 : 0.6,
                    }}
                  >
                    {counts.get(key)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {visible.map((f) => {
              const meta = SEVERITY_META[f.severity];
              return (
                <li
                  key={f.id}
                  style={{
                    borderLeft: `3px solid ${meta.fg}`,
                    borderTop: `1px solid ${RULE}`,
                    borderRight: `1px solid ${RULE}`,
                    background: PANEL,
                  }}
                >
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "15px 18px",
                        listStyle: "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 7,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: MUTED,
                          }}
                        >
                          {f.id}
                        </span>
                        <Pill fg={meta.fg} bg={meta.bg} border={meta.border}>
                          {meta.label}
                        </Pill>
                        <span
                          style={{
                            fontSize: 12,
                            color: DOMAIN_META[f.domain],
                            fontWeight: 700,
                          }}
                        >
                          {f.domain}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontFamily: MONO,
                            fontSize: 11,
                            color: MUTED,
                          }}
                        >
                          {f.effort}
                        </span>
                      </div>
                      <span
                        style={{
                          display: "block",
                          fontSize: 15.5,
                          fontWeight: 700,
                          lineHeight: 1.4,
                          color: INK,
                          maxWidth: "68ch",
                        }}
                      >
                        {f.title}
                      </span>
                    </summary>
                    <div
                      style={{
                        padding: "18px",
                        borderTop: `1px solid ${RULE}`,
                        display: "grid",
                        gap: 18,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: MUTED,
                            margin: "0 0 7px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          Dampak
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14.5,
                            lineHeight: 1.65,
                            maxWidth: "72ch",
                          }}
                        >
                          {f.impact}
                        </p>
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: MUTED,
                            margin: "0 0 7px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          Bukti
                        </h3>
                        <ul
                          style={{
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          {f.evidence.map((e) => (
                            <li
                              key={e}
                              style={{
                                fontFamily: MONO,
                                fontSize: 12.5,
                                lineHeight: 1.6,
                                color: "#2A333C",
                                background: "#F4F6F7",
                                borderLeft: `2px solid ${RULE}`,
                                padding: "7px 11px",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: MUTED,
                            margin: "0 0 7px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          Perbaikan
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14.5,
                            lineHeight: 1.65,
                            maxWidth: "72ch",
                            borderLeft: `2px solid #0F6D3F`,
                            paddingLeft: 12,
                          }}
                        >
                          {f.fix}
                        </p>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          <div style={{ borderBottom: `1px solid ${RULE}`, height: 1 }} />
        </Section>

        <Section
          id="halaman"
          title="Hasil per halaman"
          lead="Sepuluh halaman publik diuji dengan Chromium headless pada viewport 1440 x 900. Semua merespons 200 dan tidak ada overflow horizontal di 390, 820, maupun 1440 piksel."
          aside={
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
              10 route publik
            </span>
          }
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 640,
                borderCollapse: "collapse",
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${INK}` }}>
                  {["Route", "H1", "Gambar", "Tanpa dimensi", "Tombol buta", "Catatan"].map(
                    (h, i) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          textAlign: i === 0 || i === 5 ? "left" : "right",
                          padding: "9px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          color: MUTED,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pageAudit.map((p) => {
                  const bad = p.h1 !== 1 || p.imgNoDims > 0 || p.btnNoLabel > 0;
                  return (
                    <tr key={p.path} style={{ borderBottom: `1px solid ${RULE}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 12.5,
                            fontWeight: 700,
                          }}
                        >
                          {p.path}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: MUTED,
                          }}
                        >
                          {p.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontFamily: MONO,
                          color: p.h1 === 1 ? "#0F6D3F" : "#8C1D1D",
                          fontWeight: 700,
                        }}
                      >
                        {p.h1}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontFamily: MONO,
                        }}
                      >
                        {p.img}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontFamily: MONO,
                          color: p.imgNoDims > 0 ? "#8A4B08" : MUTED,
                        }}
                      >
                        {p.imgNoDims}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontFamily: MONO,
                          color: p.btnNoLabel > 0 ? "#8A4B08" : MUTED,
                        }}
                      >
                        {p.btnNoLabel}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: 13,
                          color: bad ? "#2A333C" : MUTED,
                          maxWidth: 320,
                        }}
                      >
                        {p.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="forensik"
          title="Forensik insiden 21 September 2026"
          lead="Insiden ini adalah pencurian kredensial, bukan serangan otomatis. Satu fingerprint perangkat, dua percobaan login, lalu 409 request dalam 21 menit berikutnya."
          aside={
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
              zona waktu WIB
            </span>
          }
        >
          <ol
            style={{
              listStyle: "none",
              margin: "0 0 26px",
              padding: 0,
              borderLeft: `1px solid ${RULE}`,
            }}
          >
            {timeline.map((t) => (
              <li
                key={t.time}
                style={{
                  borderBottom: `1px solid ${RULE}`,
                  padding: "13px 0 13px 20px",
                  marginLeft: 12,
                  position: "relative",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -5,
                    top: 20,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: t.tone === "bad" ? "#8C1D1D" : "#B0762A",
                  }}
                />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: INK,
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  {t.time}
                </span>
                <span style={{ fontSize: 14, color: "#2A333C" }}>{t.event}</span>
              </li>
            ))}
          </ol>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              margin: "0 0 22px",
            }}
          >
            {forensicFacts.map((f) => (
              <div
                key={f.label}
                style={{
                  background: PANEL,
                  border: `1px solid ${RULE}`,
                  borderRadius: 4,
                  padding: "14px 15px",
                }}
              >
                <dt
                  style={{ fontSize: 12, color: MUTED, marginBottom: 5 }}
                >
                  {f.label}
                </dt>
                <dd style={{ margin: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14.5,
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}
                  >
                    {f.value}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      color: MUTED,
                      marginTop: 5,
                      lineHeight: 1.45,
                    }}
                  >
                    {f.note}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div
            style={{
              border: `1px solid ${RULE}`,
              borderLeft: `3px solid #8A4B08`,
              background: PANEL,
              padding: "16px 18px",
              borderRadius: 4,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
              Yang belum bisa dijawab
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                display: "grid",
                gap: 7,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#2A333C",
              }}
            >
              {forensicGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          id="metode"
          title="Metode"
          lead="Empat lapis pemeriksaan. Temuan tanpa bukti terukur tidak dimasukkan."
        >
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {method.map((m) => (
              <li key={m.step} style={{ borderTop: `2px solid ${INK}`, paddingTop: 12 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0F6D3F",
                    display: "block",
                    marginBottom: 7,
                  }}
                >
                  {m.step}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>
                  {m.title}
                </h3>
                <p
                  style={{ fontSize: 13.5, lineHeight: 1.6, color: MUTED, margin: 0 }}
                >
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <footer
          style={{
            borderTop: `2px solid ${INK}`,
            paddingTop: 16,
            fontSize: 12.5,
            color: MUTED,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <span>Audit internal Darussunnah Parung</span>
          <span style={{ fontFamily: MONO }}>
            26 September 2026 · Chromium headless · Next.js 16 / Go chi
          </span>
        </footer>
      </div>
    </main>
  );
}
