import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CirclePlay,
  Heart,
  ImageIcon,
  Landmark,
  Medal,
  Newspaper,
  Quote,
  School,
  UserRound,
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const programCards = [
  {
    title: "Tahfidz Al-Qur'an",
    description: "Program intensif menghafal Al-Qur'an dengan target 30 juz mutqin.",
    href: '/program#tahfidz',
    icon: BookOpen,
  },
  {
    title: 'Kajian Kitab Kuning',
    description: 'Mendalami literatur klasik Islam dengan bimbingan asatidz kompeten.',
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

const principalMessage = {
  name: 'Ust. Rusdi',
  title: 'Menyiapkan Kader Dai Masa Depan',
  body: `Assalamu'alaikum warahmatullahi wabarakatuh.

Alhamdulillah, segala puji bagi Allah SWT atas nikmat-Nya, sehingga kita dapat terus berkontribusi dalam mencetak generasi penghafal Al-Qur'an. Kami berkomitmen tidak hanya melahirkan hafizh, namun membentuk pribadi berasas tauhid, berakhlak mulia, dan mandiri.

Proses pendidikan di sini diramu secara komprehensif memadukan Tahfidz, kajian Kitab Kuning, serta keterampilan hidup sesungguhnya. Wassalamu'alaikum warahmatullahi wabarakatuh.`,
};

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-[#0f1728] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/img/gedung.webp')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(14,34,53,0.58)_0%,_rgba(13,22,39,0.7)_60%,_rgba(13,22,39,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,_rgba(120,214,233,0.35),_transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,_rgba(160,235,247,0.28),_transparent)]" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-0 top-10 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-24 sm:pt-28 lg:min-h-[760px] lg:pt-36">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Pondok Pesantren Tahfidz
            </p>
            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pondok Pesantren Tahfidz Al-Qur&apos;an Darussunnah Parung
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-100/85 sm:text-lg">
              Lembaga pendidikan pesantren yang menumbuhkan hafalan Al-Qur&apos;an, adab,
              kedisiplinan, dan kemandirian santri dalam suasana belajar yang tertib, tenang, dan terarah.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/psb"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#12d89f] px-8 py-4 text-base font-black text-[#08372d] shadow-[0_25px_55px_-25px_rgba(18,216,159,0.65)] transition hover:bg-[#24e6b0]"
              >
                Daftar Sekarang
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white/8 px-8 py-4 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:bg-white/12"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/12">
                  <CirclePlay size={16} />
                </span>
                Lihat Profil Pondok
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-20 grid gap-6 md:grid-cols-3 lg:mt-24">
            <div className="rounded-[2rem] bg-white p-8 text-left text-slate-900 shadow-[0_35px_70px_-38px_rgba(15,23,42,0.5)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                <School className="text-emerald-600" size={30} />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                Pendaftaran
              </p>
              <p className="mt-3 text-[2rem] font-black leading-tight text-slate-900">PSB Tahun Ajaran 2026/2027</p>
              <p className="mt-4 text-base leading-8 text-slate-500">
                Informasi pendaftaran dan alur bergabung sebagai santri baru.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-8 text-left text-slate-900 shadow-[0_35px_70px_-38px_rgba(15,23,42,0.5)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                <Medal className="text-emerald-600" size={30} />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                Pembinaan
              </p>
              <p className="mt-3 text-[2rem] font-black leading-tight text-slate-900">Tahfidz &amp; Adab Harian</p>
              <p className="mt-4 text-base leading-8 text-slate-500">
                Pembinaan hafalan, ibadah harian, dan pembentukan karakter santri.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-8 text-left text-slate-900 shadow-[0_35px_70px_-38px_rgba(15,23,42,0.5)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                <Landmark className="text-emerald-600" size={30} />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                Tentang Pondok
              </p>
              <p className="mt-3 text-[2rem] font-black leading-tight text-slate-900">Visi, Misi, dan Arah Pendidikan</p>
              <p className="mt-4 text-base leading-8 text-slate-500">
                Gambaran arah pendidikan dan nilai yang dibangun di lingkungan pesantren.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-10 overflow-hidden bg-[linear-gradient(to_bottom,_#ffffff,_#f7fbf8)] py-20">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2.25rem] border border-emerald-100/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(236,253,245,0.88))] p-8 shadow-[0_40px_80px_-42px_rgba(15,23,42,0.22)] lg:p-10">
              <div className="flex items-start gap-6">
                <div className="hidden shrink-0 lg:block">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-slate-50 to-emerald-50 shadow-lg">
                    <UserRound className="text-emerald-600" size={54} />
                  </div>
                  <div className="mx-auto mt-3 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                    Pimpinan
                  </div>
                </div>
                <div className="flex-1">
                  <Quote className="text-emerald-200" size={28} />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
                    Sambutan Pimpinan
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 lg:text-[2.6rem]">
                    {principalMessage.title}
                  </h2>
                  <div className="mt-6 space-y-4 text-base font-medium leading-8 text-slate-700">
                    {principalMessage.body.split('\n\n').map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <p className="mt-8 text-[2rem] font-semibold tracking-tight text-slate-800">
                    {principalMessage.name}
                  </p>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_65px_-42px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">Berita</h3>
                  </div>
                  <Link
                    href="/news"
                    className="rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700"
                  >
                    Lihat
                  </Link>
                </div>
                <div className="mt-10 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <Newspaper className="mx-auto text-slate-300" size={30} />
                  <p className="mt-4 text-lg font-black text-slate-800">Belum ada berita terbaru.</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Kabar kegiatan pondok akan muncul di sini setelah redaksi menerbitkannya.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,_#ffffff,_#ecfdf5)] p-6 shadow-[0_35px_70px_-42px_rgba(16,185,129,0.25)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">
                      Pendaftaran
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                      Penerimaan Santri Baru 2026/2027
                    </h3>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700">
                    Dibuka
                  </span>
                </div>
                <p className="mt-6 text-base leading-8 text-slate-600">
                  Daftarkan putra Anda untuk belajar Al-Qur&apos;an, adab, dan kehidupan pesantren yang tertib.
                </p>
                <Link
                  href="/psb"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0bb783] px-6 py-4 text-sm font-black text-white shadow-[0_20px_45px_-24px_rgba(11,183,131,0.55)] transition hover:brightness-110"
                >
                  Lihat Info Pendaftaran
                  <ArrowRight size={16} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Program Pendidikan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Program Pendidikan Pondok
            </h2>
            <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-400 to-[#0bd39b]" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {programCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_28px_60px_-30px_rgba(16,185,129,0.18)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-6 text-[1.7rem] font-black leading-tight text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#111a31] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Dokumentasi & Kajian
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-5xl">
                Video Kegiatan Pondok
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Rekaman kegiatan, kajian, dan momen penting santri yang dapat disimak kembali kapan saja.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/videos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-[#0f4d3f] px-6 py-3 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[#136050]"
              >
                Lihat Semua Video
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/videos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Kanal YouTube
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white px-6 py-16 text-center shadow-[0_30px_80px_-48px_rgba(0,0,0,0.65)]">
            <CirclePlay className="mx-auto text-slate-500" size={44} />
            <p className="mt-6 text-lg font-black text-slate-800">Video kegiatan dan kajian terbaru akan tampil di sini setelah diunggah.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Berita</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Kabar Utama</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Ringkasan berita, pengumuman, dan berita terbaru dari aktivitas Darussunnah.
              </p>
            </div>
            <Link
              href="/news"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              Lihat Semua Kabar
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_24px_55px_-42px_rgba(15,23,42,0.12)]">
            <Newspaper className="mx-auto text-slate-300" size={40} />
            <p className="mt-6 text-2xl font-black text-slate-900">Belum ada berita terbaru</p>
            <p className="mt-3 text-base leading-8 text-slate-500">
              Kabar terbaru dari pondok akan muncul di sini setelah redaksi menerbitkannya.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[linear-gradient(135deg,_#f6fffb,_#ffffff_70%)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Jadwal Kegiatan</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Agenda Mendatang</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Pantau kegiatan pondok, agenda akademik, dan informasi penting yang akan datang.
            </p>
          </div>
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_24px_55px_-42px_rgba(15,23,42,0.12)]">
            <CalendarDays className="mx-auto text-slate-300" size={40} />
            <p className="mt-6 text-2xl font-black text-slate-900">Belum ada agenda terbaru</p>
            <p className="mt-3 text-base leading-8 text-slate-500">
              Agenda pondok yang akan datang akan ditampilkan di bagian ini.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Dokumentasi Visual</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Potret Pesantren</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Album kegiatan terbaru yang memperlihatkan ritme belajar, ibadah, dan kehidupan santri di Darussunnah.
              </p>
            </div>
            <Link
              href="/galeri"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              Lihat Galeri Lengkap
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_24px_55px_-42px_rgba(15,23,42,0.12)]">
            <ImageIcon className="mx-auto text-slate-300" size={40} />
            <p className="mt-6 text-2xl font-black text-slate-900">Belum ada album galeri terbaru</p>
            <p className="mt-3 text-base leading-8 text-slate-500">
              Album kegiatan terbaru akan muncul di sini setelah dokumentasi dipublikasikan.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-24 lg:py-28">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center text-white">
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
            Siap Bergabung Bersama Kami?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
            Kenali lebih dekat sistem pendidikan Darussunnah dan lanjutkan ke proses pendaftaran
            santri baru melalui halaman PSB atau komunikasi langsung dengan tim pondok.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/psb"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-extrabold text-emerald-900 transition hover:bg-emerald-50"
            >
              Lihat Info PSB
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://wa.me/6281413241748"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/20"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
