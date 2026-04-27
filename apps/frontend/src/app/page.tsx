import Link from 'next/link';
import { Award, BookOpen, Heart, School } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import HomeHeroSlider from '@/components/HomeHeroSlider';

const quickLinks = [
  {
    title: 'Pendaftaran Santri Baru',
    description: 'Jalur informasi awal bagi calon santri SMP-SMA boarding school Darussunnah.',
    href: '/psb',
  },
  {
    title: 'Program Pendidikan',
    description: 'Kenali tahfidz, pembinaan adab, dan ritme belajar berasrama yang kami jalankan.',
    href: '/program',
  },
  {
    title: 'Berita & Informasi',
    description: 'Ikuti kabar kegiatan pondok, agenda santri, dan dinamika kehidupan pesantren.',
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

const dailyRhythms = [
  {
    title: 'Pagi yang Tertib',
    description:
      'Hari dimulai dengan ibadah, murajaah, dan persiapan belajar agar santri terbiasa disiplin sejak awal waktu.',
  },
  {
    title: 'Belajar yang Fokus',
    description:
      'Sesi tahfidz, kajian, dan pembelajaran pendukung berjalan terarah dengan pendampingan ustadz secara berkala.',
  },
  {
    title: 'Malam yang Menenangkan',
    description:
      'Penutup hari diisi evaluasi, penguatan hafalan, dan pembiasaan hidup sederhana dalam suasana asrama.',
  },
];

const nextSteps = [
  {
    title: 'Pelajari Profil Pondok',
    description:
      'Kenali visi, lingkungan belajar, dan gambaran umum pembinaan di Darussunnah Parung.',
    href: '/profil',
    label: 'Buka profil',
  },
  {
    title: 'Simak Informasi PSB',
    description:
      'Lihat persyaratan, alur pendaftaran, dan informasi penting bagi calon wali santri.',
    href: '/psb',
    label: 'Lihat PSB',
  },
  {
    title: 'Ikuti Kabar Terbaru',
    description:
      'Pantau berita kegiatan, agenda, dan informasi terbaru pondok secara berkala.',
    href: '/news',
    label: 'Baca berita',
  },
];

const supportHighlights = [
  {
    title: 'Pendampingan Ustadz',
    description:
      'Santri dibina dengan arahan yang konsisten agar perkembangan hafalan, adab, dan kebiasaan baik tetap terjaga.',
  },
  {
    title: 'Komunikasi Wali',
    description:
      'Informasi penting mengenai kegiatan dan perkembangan santri disiapkan agar wali lebih mudah mengikuti proses pembinaan.',
  },
  {
    title: 'Lingkungan Bertumbuh',
    description:
      'Suasana pondok dibangun untuk menumbuhkan rasa tanggung jawab, kebersamaan, dan semangat memperbaiki diri.',
  },
];

const reasonsToChoose = [
  {
    title: 'Pembinaan Bertahap',
    description:
      'Materi dan kebiasaan disusun berjenjang agar santri bertumbuh secara mantap, bukan terburu-buru.',
  },
  {
    title: 'Arah yang Jelas',
    description:
      'Fokus pendidikan diarahkan pada hafalan, adab, dan kesiapan menjalani tanggung jawab dalam keseharian.',
  },
  {
    title: 'Suasana Terkawal',
    description:
      'Kehidupan pondok dibangun dengan ritme yang teratur sehingga santri lebih mudah menjaga fokus dan semangat belajar.',
  },
];

const closingNotes = [
  {
    title: 'Bagi Calon Wali Santri',
    description:
      'Informasi dasar tentang profil pondok, program, dan pendaftaran kami susun agar mudah ditelusuri dari halaman publik.',
  },
  {
    title: 'Bagi Alumni dan Masyarakat',
    description:
      'Berita, agenda, serta perkembangan kegiatan pondok disajikan agar hubungan dengan Darussunnah tetap terjaga.',
  },
];

const contactHighlights = [
  {
    title: 'Hubungi Kami',
    description:
      'Gunakan halaman kontak untuk memperoleh informasi awal mengenai pondok, program, dan kebutuhan komunikasi lainnya.',
    href: '/kontak',
    label: 'Buka kontak',
  },
  {
    title: 'Lihat Agenda',
    description:
      'Pantau agenda kegiatan dan momen penting pondok yang dibagikan untuk wali santri dan masyarakat.',
    href: '/agendas',
    label: 'Lihat agenda',
  },
];

const closingStats = [
  {
    value: 'Tahfidz',
    label: 'Fokus utama pembinaan hafalan dan murajaah santri.',
  },
  {
    value: 'Adab',
    label: 'Pembiasaan karakter dan disiplin hadir dalam keseharian pondok.',
  },
  {
    value: 'Kemandirian',
    label: 'Santri diarahkan siap belajar, bertanggung jawab, dan mengabdi.',
  },
];

const featuredNews = [
  {
    title: 'Santri Darussunnah menata hafalan dengan ritme harian yang disiplin',
    description:
      'Kegiatan murajaah, setoran, dan evaluasi berjalan bertahap untuk menjaga hafalan tetap kuat dan terarah.',
    href: '/news',
    badge: 'Berita Pilihan',
  },
  {
    title: 'Kegiatan pesantren dibangun agar ilmu dan adab tumbuh bersama',
    description:
      'Lingkungan belajar, ibadah berjamaah, dan pembiasaan tanggung jawab menjadi bagian dari pembinaan harian.',
    href: '/news',
    badge: 'Kabar Pondok',
  },
];

const featuredAgendas = [
  {
    title: 'Pembinaan Pekanan Santri',
    meta: 'Setiap pekan • Aula utama',
  },
  {
    title: 'Pertemuan Wali Santri',
    meta: 'Agenda berkala • Kampus pondok',
  },
  {
    title: 'Kajian dan Evaluasi Hafalan',
    meta: 'Sesi terarah • Ruang pembinaan',
  },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/assets/img/gedung.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/70" />
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-emerald-300 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-200 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24 lg:min-h-[680px] lg:py-28">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Pondok Pesantren Tahfidz
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Pondok Pesantren Tahfidz Al-Qur&apos;an Darussunnah Parung
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
              Lembaga pendidikan pesantren yang menumbuhkan hafalan Al-Qur&apos;an, adab,
              kedisiplinan, dan kemandirian santri dalam suasana belajar yang tertib, tenang, dan terarah.
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
                Lihat Profil Pondok
              </Link>
            </div>
          </div>

          <div className="mt-12">
            <HomeHeroSlider />
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Lingkungan Pesantren
              </p>
              <p className="mt-3 text-lg font-bold text-white">Asrama santri, pendampingan ustadz, dan pembinaan harian</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Fokus Utama
              </p>
              <p className="mt-3 text-lg font-bold text-white">Tahfidz, adab, akademik, dan kedisiplinan harian</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Jenjang Pendidikan
              </p>
              <p className="mt-3 text-lg font-bold text-white">Pembinaan santri jenjang SMP dan SMA dalam naungan pesantren</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 overflow-hidden sm:-mt-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-50 to-white" />
        <div className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
            Tentang Darussunnah
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Menumbuhkan santri yang dekat dengan Al-Qur&apos;an dan kokoh dalam adab.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Darussunnah Parung menghadirkan suasana pendidikan yang tenang, tertib, dan berwibawa,
            dengan pembiasaan ibadah, hafalan, akademik, serta pembentukan karakter santri dalam
            kehidupan pondok pesantren sehari-hari.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {valueCards.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm"
            >
              <div className="mb-4 h-1 w-14 rounded-full bg-emerald-500" />
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
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                Akses Cepat
              </p>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-700 transition group-hover:translate-x-1">
                Buka halaman
              </span>
            </Link>
          ))}
        </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                    Kabar Pesantren
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    Warta Darussunnah
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Potret kegiatan pondok, pembinaan santri, dan dinamika pesantren kami sajikan
                    dengan nuansa yang bersih, tenang, dan mudah diikuti.
                  </p>
                </div>
                <Link
                  href="/news"
                  className="hidden rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 sm:inline-flex"
                >
                  Semua Berita
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {featuredNews.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_28px_60px_-28px_rgba(16,185,129,0.22)]"
                  >
                    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                      {item.badge}
                    </span>
                    <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900 transition group-hover:text-emerald-700">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                    <span className="mt-6 inline-flex text-sm font-bold text-emerald-700 transition group-hover:translate-x-1">
                      Baca selengkapnya
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-[2.25rem] border border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] p-8 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                  Agenda Singkat
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                  Momen penting yang menjaga ritme pembinaan pondok pesantren.
                </h3>
                <div className="mt-8 space-y-4">
                  {featuredAgendas.map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-sm font-black text-emerald-700 shadow-sm">
                          0{index + 1}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                          <p className="mt-2 text-sm text-slate-500">{item.meta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/agendas"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                >
                  Lihat Agenda
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Program Pendidikan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Fokus Pembinaan Santri
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Kami mempertahankan struktur yang ringan, namun tampilannya dibuat lebih kaya agar
              mendekati nuansa halaman lokal yang lebih lengkap.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Kehidupan Santri
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Ritme pembinaan yang dibangun dengan tertib dan berkesinambungan.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Pola kegiatan harian dirancang agar santri bertumbuh dalam kedisiplinan, kebiasaan
              ibadah, dan tanggung jawab terhadap amanah belajar yang dijalani.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {dailyRhythms.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                  Ritme Harian
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-emerald-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              Langkah Berikutnya
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Akses informasi penting dengan jalur yang sederhana dan jelas.
            </h2>
            <p className="mt-4 text-base leading-8 text-emerald-50/85">
              Bagi calon wali santri, alumni, maupun masyarakat umum, halaman-halaman utama kami
              siapkan agar informasi inti bisa ditemukan lebih cepat tanpa membingungkan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {nextSteps.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15"
              >
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-emerald-50/80">{item.description}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-emerald-200">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Pendampingan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Pembinaan tidak berhenti pada ruang kelas, tetapi hadir dalam keseharian santri.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Kami ingin menghadirkan pengalaman belajar yang tertata, hangat, dan bertahap agar
              perkembangan ilmu serta karakter berjalan beriringan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {supportHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-1 w-12 rounded-full bg-emerald-500" />
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Mengapa Darussunnah
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Pembelajaran dirancang agar santri tumbuh dengan arah, adab, dan ketekunan.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Kami ingin proses pendidikan terasa terukur dan menenangkan, sehingga santri dapat
              menapaki target hafalan dan pembinaan karakter dengan lebih mantap dari hari ke hari.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reasonsToChoose.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                  Nilai
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-emerald-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Tetap Terhubung
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Darussunnah Parung membuka ruang informasi yang lebih rapi untuk wali, santri, dan masyarakat.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50/85">
                Kami terus merapikan tampilan publik agar profil pondok, jalur pendaftaran, dan
                kabar kegiatan dapat diakses lebih nyaman tanpa mengurangi kestabilan website.
              </p>
            </div>

            <div className="grid gap-4">
              {closingNotes.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm"
                >
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-emerald-50/80">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              Informasi Lanjutan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Temukan jalur komunikasi dan informasi pondok dengan lebih mudah.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Setelah mengenal profil, program, dan ritme pembinaan santri, Anda dapat melanjutkan
              ke halaman yang paling sesuai dengan kebutuhan informasi Anda.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {contactHighlights.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                  Informasi
                </p>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-emerald-700 transition group-hover:translate-x-1">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              Inti Pembinaan
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Tiga arah yang terus dijaga dalam perjalanan pendidikan santri.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Setiap kegiatan pondok diarahkan agar santri dekat dengan Al-Qur&apos;an, kuat dalam
              adab, dan terbiasa menjalani amanah hidup dengan tanggung jawab.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {closingStats.map((item) => (
              <div
                key={item.value}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-black tracking-tight text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-24 lg:py-28">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center text-white">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/80">
            Langkah Akhir
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
            Siap Bergabung Bersama Darussunnah?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
            Kenali lebih dekat sistem pendidikan Darussunnah dan lanjutkan ke proses pendaftaran
            santri baru melalui halaman PSB atau komunikasi langsung dengan tim pondok.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/psb"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-extrabold text-emerald-900 transition hover:bg-emerald-50"
            >
              Lihat Info PSB
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
