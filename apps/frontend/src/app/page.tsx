import Link from 'next/link';
import { Award, BookOpen, Heart, School } from 'lucide-react';
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

const programCards = [
  {
    title: "Tahfidz Al-Qur'an",
    description: "Program intensif menghafal Al-Qur'an dengan target 30 juz mutqin.",
    href: '/program#tahfidz',
    icon: BookOpen,
  },
  {
    title: 'Kajian Kitab Kuning',
    description: 'Pendalaman literatur klasik Islam dengan bimbingan asatidz kompeten.',
    href: '/program#kitab-kuning',
    icon: School,
  },
  {
    title: 'Kader Dakwah',
    description: 'Pembinaan keberanian, tanggung jawab, dan keterampilan menyampaikan ilmu.',
    href: '/program#kader-dakwah',
    icon: Heart,
  },
  {
    title: 'Kemandirian Santri',
    description: 'Pembiasaan hidup tertib, mandiri, dan disiplin dalam aktivitas harian.',
    href: '/program#kemandirian',
    icon: Award,
  },
];

const valueCards = [
  {
    title: 'Adab Sebelum Ilmu',
    description:
      'Pembinaan akhlak, disiplin, dan kebiasaan baik menjadi fondasi sebelum santri mendalami ilmu lebih jauh.',
  },
  {
    title: 'Belajar Terarah',
    description:
      'Target hafalan, bimbingan ustadz, dan evaluasi berkala menjaga proses belajar tetap tertib dan terukur.',
  },
  {
    title: 'Siap Mengabdi',
    description:
      'Santri dibiasakan bertanggung jawab, mandiri, dan siap memberi manfaat bagi keluarga, umat, dan masyarakat.',
  },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-emerald-300 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-200 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24 lg:py-28">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Pondok Pesantren Tahfidz
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
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

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Fokus Utama
              </p>
              <p className="mt-3 text-lg font-bold text-white">Tahfidz, Adab, dan Kemandirian</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Lingkungan
              </p>
              <p className="mt-3 text-lg font-bold text-white">Pembinaan disiplin dalam suasana pesantren</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Akses Cepat
              </p>
              <p className="mt-3 text-lg font-bold text-white">Info PSB, program, dan berita terbaru</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
            Tentang Darussunnah
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Menyiapkan santri yang dekat dengan Al-Qur&apos;an dan kokoh dalam adab.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Darussunnah Parung berupaya menghadirkan suasana pendidikan yang tenang, tertib, dan
            fokus pada pembiasaan ibadah, hafalan, serta pembentukan karakter santri dalam
            kehidupan sehari-hari.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {valueCards.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          ))}
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

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Program Pendidikan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Fokus Pembinaan Santri
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Kami kembalikan dulu bagian yang paling aman: gambaran program inti pesantren tanpa
              animasi atau komponen berat.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {programCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                  <span className="mt-auto pt-5 text-sm font-bold text-emerald-700">
                    Pelajari selengkapnya
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
