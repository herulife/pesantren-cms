import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Insiden — Laporan Peretasan",
  description:
    "Laporan audit forensik insiden peretasan darussunnahparung.com 21 September 2026 — kapan, dari mana, lewat celah apa, dan apa saja yang di-hack.",
  robots: { index: false, follow: false },
  // /audit-full dan /audit-hasil sudah diarahkan ke sini, jadi URL ini yang
  // jadi satu-satunya laporan forensik yang hidup.
  alternates: {
    canonical: "https://darussunnahparung.com/audit-hacked",
  },
};

function Se({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 22,
      }}
    >
      {children}
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 19,
        margin: "0 0 14px",
        color: "#0f172a",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </h2>
  );
}

function Chip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "red" | "amber" | "green" | "slate" | "blue";
}) {
  const colors: Record<string, string> = {
    red: "#fee2e2",
    green: "#dcfce7",
    amber: "#fef3c7",
    blue: "#dbeafe",
    slate: "#f1f5f9",
  };
  const text: Record<string, string> = {
    red: "#991b1b",
    green: "#166534",
    amber: "#92400e",
    blue: "#1e40af",
    slate: "#334155",
  };
  return (
    <span
      style={{
        display: "inline-block",
        background: colors[tone],
        color: text[tone],
        borderRadius: 999,
        padding: "3px 12px",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "8px 10px",
        borderBottom: "1px solid #e2e8f0",
        fontSize: 14,
        verticalAlign: "top",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "8px 10px",
        borderBottom: "2px solid #cbd5e1",
        fontSize: 13,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </th>
  );
}

const timeline: {
  time: string;
  ip: string;
  action: string;
  tone: "red" | "amber" | "green" | "slate" | "blue";
}[] = [
  {
    time: "17:52:53",
    ip: "172.69.166.111",
    action:
      "POST /api/login gagal (401) — percobaan pertama masuk akun admin, User-Agent Chrome 152 Android.",
    tone: "amber",
  },
  {
    time: "17:52:59",
    ip: "172.69.166.111",
    action:
      "POST /api/login berhasil (200) — login ke akun admin dengan kredensial yang sudah ada (bukan register).",
    tone: "red",
  },
  {
    time: "17:53:00–17:53:35",
    ip: "172.69.166.111",
    action:
      "Masuk panel /admin, memanggil GET /api/me lalu GET /api/users (3x) — membaca daftar pengguna.",
    tone: "red",
  },
  {
    time: "17:54:18",
    ip: "162.158.114.200",
    action:
      "POST /api/users (200) — membuat akun superadmin baru darussunnahparung@gmail.com (ID 11) via menu admin.",
    tone: "red",
  },
  {
    time: "17:54:36",
    ip: "162.158.114.200",
    action: "Login sukses sebagai akun superadmin baru (ID 11).",
    tone: "amber",
  },
  {
    time: "17:54:47–17:54:53",
    ip: "162.158.114.200",
    action:
      "DELETE /api/users/10, /9, /8 — menghapus 3 admin asli (termasuk admin@darussunnah.com).",
    tone: "red",
  },
  {
    time: "19:45–19:56",
    ip: "172.71.211.44 & lainnya",
    action:
      "Soft-delete seluruh berita, membuat berita palsu “HACKED BY MR ONE”, dan mengunggah 11 gambar deface ke /uploads.",
    tone: "red",
  },
  {
    time: "19:52 WIB / 12:52 UTC",
    ip: "Cloudflare",
    action:
      "Force-delete permanen semua berita asli — konten berita tidak dapat dipulihkan tanpa backup.",
    tone: "red",
  },
  {
    time: "19:49–20:26",
    ip: "Cloudflare",
    action:
      "Mengubah banner/hero, welcome speech (nama “Mr One”, peran “Hacker”, foto logo site), SEO meta, dan konfigurasi website builder.",
    tone: "red",
  },
  {
    time: "23:00– berikutnya",
    ip: "Cloudflare",
    action:
      "Login ulang berkali-kali hingga 26 September 2026 (log terakhir 01:59 UTC) — mengecek/menjaga akses.",
    tone: "slate",
  },
];

const changes: { item: string; before: string; after: string }[] = [
  {
    item: "Akun admin asli",
    before: "3 akun superadmin/admin aktif",
    after: "Dihapus oleh attacker (ID 8, 9, 10)",
  },
  {
    item: "Akun attacker",
    before: "superadmin baru darussunnahparung@gmail.com",
    after: "Dihapus saat pemulihan",
  },
  {
    item: "Berita",
    before: "11 berita asli (draft & published)",
    after: "Semua dihapus permanen; 1 berita palsu dibuat",
  },
  {
    item: "Banner & hero slides",
    before: "Konten profil yayasan",
    after: "Diganti puisi “Jalan-jalan ke Kota Medan…”",
  },
  {
    item: "Welcome speech",
    before: "Sambutan kepala",
    after: "Nama “Mr One”, peran “Hacker”, gambar catbox.moe",
  },
  {
    item: "Logo & metadata SEO",
    before: "Logo resmi",
    after: "URL gambar catbox.moe, meta description diisi puisi deface",
  },
  {
    item: "Website builder",
    before: "Konfigurasi default",
    after: "Ditimpa (enabled + konten deface)",
  },
  {
    item: "Audit log",
    before: "Riwayat lengkap Mei–September",
    after: "79 baris (ID 32–110) dihapus untuk menyembunyikan jejak",
  },
];

export default function AuditHackedPage() {
  return (
    <main
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "40px 20px 72px",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      <header style={{ marginBottom: 26 }}>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Laporan Audit Forensik — Insiden Peretasan
        </p>
        <h1 style={{ fontSize: 28, margin: "6px 0 8px" }}>
          darussunnahparung.com — Audit Insiden
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip tone="red">Terbukti di-hack</Chip>
          <Chip tone="amber">Serangan lewat panel admin</Chip>
          <Chip tone="green">Responded &amp; dipulihkan</Chip>
        </div>
      </header>

      <Se>
        <H2>1. Kesimpulan Eksekutif</H2>
        <p style={{ margin: "0 0 12px", lineHeight: 1.7 }}>
          Situs <strong>darussunnahparung.com</strong> dibobol pada{" "}
          <strong>21 September 2026, sekitar pukul 17:52 WIB</strong>. Pelaku
          masuk ke panel admin melalui <strong>halaman /api/login</strong>{" "}
          dengan kredensial admin yang sudah ada (bukan lewat pendaftaran
          publik). Setelah masuk dengan hak <em>superadmin</em>, pelaku: (1)
          membuat akun superadmin baru lewat menu <code>/api/users</code>, (2)
          menghapus seluruh admin asli, (3) menghapus semua berita, dan (4)
          menimpa konten publik (banner, sambutan, SEO) dengan pesan deface
          “HACKED BY MR ONE”.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          <strong>Proyeksi akar masalah:</strong> kredensial admin lemah/terbuka
          tanpa 2FA + tidak ada proteksi rate-limit &amp; audit trail yang
          memadai pada endpoint admin. Semua akses memanfaatkan fitur sah
          panel, bukan celah injeksi. Halaman ini sengaja dibuat sebagai
          dokumentasi transparan. <strong>Tidak ada kredensial atau rahasia
          yang dipublikasikan di sini.</strong>
        </p>
      </Se>

      <Se>
        <H2>2. Kronologi (Waktu Indonesia Barat, 21–26 Sep 2026)</H2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Waktu (WIB)</Th>
                <Th>IP tercatat</Th>
                <Th>Aktivitas</Th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row, i) => (
                <tr key={i}>
                  <Td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                    {row.time}
                  </Td>
                  <Td style={{ whiteSpace: "nowrap" }}>
                    <code>{row.ip}</code>
                  </Td>
                  <Td>{row.action}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "10px 0 0" }}>
          IP yang tercatat adalah alamat edge Cloudflare (situs di belakang
          proxy Cloudflare), bukan IP asli pelaku. IP asli tidak tersedia dari
          log sisi server.
        </p>
      </Se>

      <Se>
        <H2>3. Sumber IP &amp; Perangkat</H2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <strong>172.69.166.111</strong> — login awal (Chrome 152, Android).
          </li>
          <li>
            <strong>162.158.114.200</strong> — pembuatan akun superadmin &
            penghapusan admin (Chrome desktop, X11 Linux).
          </li>
          <li>
            <strong>172.71.211.44</strong> &amp; beberapa edge Cloudflare
            lain — sesi deface berita/settings.
          </li>
          <li>
            Semua permintaan melewati proxy Cloudflare; IP asli pelaku tidak
            terekam. Variasi User-Agent (Android, Chrome desktop) menandakan
            pelaku berpindah perangkat/incognito.
          </li>
        </ul>
      </Se>

      <Se>
        <H2>4. Celah yang Dimanfaatkan</H2>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            {
              n: "Kredensial admin lemah / sudah diketahui",
              d: "Login POST /api/login sukses tanpa brute-force masif (hanya 1x 401 lalu 200). Pelaku memasuki panel sebagai superadmin yang ada, kemungkinan via password lemah atau password yang bocor.",
            },
            {
              n: "Tidak ada 2FA / proteksi extra pada admin",
              d: "Setelah masuk, seluruh endpoint admin (lihat user, buat user, hapus user, hapus berita, ubah settings) dapat dijalankan bebas tanpa lapisan verifikasi tambahan.",
            },
            {
              n: "Audit trail bisa dihapus oleh admin",
              d: "79 baris activity_logs (ID 32–110, Mei–September) dihapus — jejak login awal pemulihan/pengintaian disembunyikan; sistem tidak mendeteksi penghapusan log.",
            },
            {
              n: "Register publik (ditutup saat pemulihan)",
              d: "Endpoint /api/register awalnya terbuka untuk publik dan diberi peran ‘user’; dipakai sebagai pintu masuk potensial. Saat insiden justru attacker menggunakan kredensial admin yang ada, tapi register kini dinonaktifkan sepenuhnya.",
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                background: "#f8fafc",
                borderRadius: 10,
                padding: "12px 14px",
                border: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1.2 }}>🔎</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.n}</div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                  {c.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Se>

      <Se>
        <H2>5. Apa Saja yang Di-hack (Perubahan Dibanding Kondisi Semula)</H2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Bidang</Th>
                <Th>Kondisi semula</Th>
                <Th>Setelah peretasan</Th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {c.item}
                  </Td>
                  <Td>{c.before}</Td>
                  <Td>{c.after}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Se>

      <Se>
        <H2>6. Status Pemulihan</H2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li style={{ color: "#166534" }}>
            <strong>Akun attacker dihapus;</strong> akun admin resmi baru
            dibuat dengan kredensial kuat.
          </li>
          <li style={{ color: "#166534" }}>
            <strong>Register publik dimatikan</strong> — POST /api/register
            kini menolak (404) sehingga pintu masuk akun baru lewat web ditutup.
          </li>
          <li style={{ color: "#166534" }}>
            <strong>Konten deface dibersihkan</strong> — banner/hero, welcome
            speech, logo, dan SEO meta dikembalikan ke nilai bersih.
          </li>
          <li style={{ color: "#166534" }}>
            <strong>Berita palsu dihapus</strong>; beranda kembali menampilkan
            konten asli yayasan.
          </li>
          <li style={{ color: "#b91c1c" }}>
            <strong>Berita asli hilang permanen</strong> (force-delete tanpa
            backup) — perlu sumber konten ulang jika ingin dipulihkan.
          </li>
        </ul>
      </Se>

      <footer
        style={{
          marginTop: 34,
          paddingTop: 16,
          borderTop: "1px solid #e2e8f0",
          fontSize: 13,
          color: "#64748b",
        }}
      >
        Dokumen ini dibuat otomatis dari bukti log server (nginx + database)
        sebagai bagian dari penanganan insiden. Tidak memuat kredensial.
      </footer>
    </main>
  );
}