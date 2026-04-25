import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';

const quickLinks = [
  {
    title: 'Pendaftaran Santri Baru',
    description: 'Lihat alur pendaftaran, persyaratan, dan informasi biaya terbaru.',
    href: '/psb',
  },
  {
    title: 'Program Pendidikan',
    description: 'Pelajari fokus tahfidz, pembinaan adab, dan kegiatan belajar santri.',
    href: '/program',
  },
  {
    title: 'Berita & Informasi',
    description: 'Ikuti pengumuman, dokumentasi kegiatan, dan kabar terbaru dari pondok.',
    href: '/news',
  },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24 lg:py-28">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
            Pondok Pesantren Tahfidz
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Darussunnah Parung
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
            Lembaga pendidikan yang berikhtiar menumbuhkan hafalan Al-Qur&apos;an, adab, dan
            kemandirian santri dalam suasana belajar yang tertib dan terarah.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/psb"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
            >
              Lihat Info PSB
            </Link>
            <Link
              href="/profil"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Profil Pondok
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
            Ringkasan
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Halaman publik sementara kami sederhanakan agar akses website stabil.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Beberapa elemen visual berat sedang kami nonaktifkan sementara saat proses debugging.
            Informasi inti tetap bisa diakses melalui menu utama di atas.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
            >
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-700">
                Buka halaman
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
