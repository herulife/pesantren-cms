'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  MapPin,
  Music2,
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const eventDate = new Date('2026-06-27T06:45:00+07:00').getTime();

const detailItems = [
  { label: 'Hari/Tanggal', value: 'Sabtu, 27 Juni 2026', icon: CalendarDays },
  { label: 'Waktu', value: '06.45 - 12.30 WIB', icon: Clock },
  { label: 'Tempat', value: 'Darussunnah 2 Putra', icon: MapPin },
];

function getCountdown() {
  const distance = Math.max(eventDate - Date.now(), 0);
  return {
    hari: Math.floor(distance / (1000 * 60 * 60 * 24)),
    jam: Math.floor((distance / (1000 * 60 * 60)) % 24),
    menit: Math.floor((distance / (1000 * 60)) % 60),
    detik: Math.floor((distance / 1000) % 60),
  };
}

export default function UndanganTasmiePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdownItems = useMemo(
    () => [
      { label: 'Hari', value: countdown.hari },
      { label: 'Jam', value: countdown.jam },
      { label: 'Menit', value: countdown.menit },
      { label: 'Detik', value: countdown.detik },
    ],
    [countdown],
  );

  return (
    <PublicLayout>
    <main className="min-h-screen bg-[#f7f5ef] text-[#152524]">
      {!isOpen && (
        <section className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#112f2f] px-5 text-white">
          <div className="absolute inset-0">
            <Image
              src="/assets/img/tasmi-logo-2026.jpg"
              alt="Logo Tasmi Darussunnah"
              fill
              priority
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,31,31,0.35),rgba(5,18,18,0.96))]" />
          </div>
          <div className="absolute left-0 top-0 h-40 w-40 border-l-[18px] border-t-[18px] border-[#b59b55]/70" />
          <div className="absolute bottom-0 right-0 h-40 w-40 border-b-[18px] border-r-[18px] border-[#b59b55]/70" />

          <div className="relative mx-auto max-w-md text-center">
            <div className="mx-auto mb-7 h-24 w-24 overflow-hidden rounded-full border-4 border-white/70 bg-white shadow-2xl">
              <Image
                src="/assets/img/tasmi-logo-2026.jpg"
                alt="Darussunnah Islamic Boarding School"
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#e2c66f]">Undangan</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white">
              Tasmi Akhir & Pelepasan
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/78">
              SMP Angkatan XI & SMA Angkatan IX Darussunnah Islamic Boarding School
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-white/62">Kepada Bapak/Ibu</p>
            <p className="mt-2 text-2xl font-black text-[#f6e7ad]">Orangtua/Walisantri</p>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d27a] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#173635] shadow-[0_22px_50px_-25px_rgba(240,210,122,0.9)] transition hover:bg-white"
            >
              <ExternalLink size={17} />
              Buka Undangan
            </button>
          </div>
        </section>
      )}

      <section id="home" className="relative flex min-h-screen items-end overflow-hidden bg-[#102f2f] px-4 pb-12 pt-28 text-white sm:px-6 lg:px-8">
        <Image
          src="/assets/img/tasmi-logo-2026.jpg"
          alt="Tasmi Angkatan XI dan IX Darussunnah"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,26,26,0.2)_0%,rgba(8,26,26,0.72)_42%,rgba(8,26,26,0.98)_100%)]" />
        <div className="absolute left-8 top-8 h-28 w-28 border-l-[12px] border-t-[12px] border-[#c4a95c]/75" />
        <div className="absolute bottom-8 right-8 h-28 w-28 border-b-[12px] border-r-[12px] border-[#c4a95c]/75" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-[#e7cd7a]/50 bg-[#e7cd7a]/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f2db8a]">
              1447 H / 2026 M
            </p>
            <h1 className="mt-7 text-4xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Tasmi Akhir & Pelepasan
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
              Mengiringi langkah para santri SMP Angkatan XI dan SMA Angkatan IX dengan doa,
              syukur, dan kebahagiaan keluarga besar Darussunnah Islamic Boarding School.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#acara" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d27a] px-6 py-3 text-sm font-black text-[#163635] shadow-lg transition hover:bg-white">
                <CalendarDays size={18} />
                Detail Acara
              </a>
              <a href="#lokasi" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-[#163635]">
                <MapPin size={18} />
                Lihat Lokasi
              </a>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {countdownItems.map((item) => (
              <div key={item.label} className="border border-white/16 bg-white/10 px-3 py-5 text-center shadow-[0_20px_50px_-34px_rgba(0,0,0,0.7)] backdrop-blur">
                <p className="text-2xl font-black text-[#f3d878] sm:text-4xl">{String(item.value).padStart(2, '0')}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/68">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5ef] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-3xl font-black leading-relaxed text-[#173635]">السلام عليكم ورحمة الله وبركاته</p>
          <p className="mt-7 text-base leading-8 text-[#435957]">
            Teriring salam hangat dan bahagia, kami mengundang Bapak/Ibu Orangtua/Walisantri
            Kelas IX dan XII untuk hadir dalam acara Tasmie Akhir & Pelepasan Tahun Pendidikan
            2025/2026.
          </p>
          <div className="mx-auto mt-8 h-px w-32 bg-[#b59b55]" />
        </div>
      </section>

      <section id="acara" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,#f7f5ef,rgba(247,245,239,0))]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#907326]">Detail Acara</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-[#173635] sm:text-5xl">
                Save the date untuk momen penuh doa.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#5b6e6b]">
                Kami berharap kehadiran Bapak/Ibu menjadi penyempurna kebahagiaan para santri
                dalam menutup masa belajar dan mengawali langkah berikutnya.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {detailItems.map((item) => (
                <div key={item.label} className="border border-[#e8dcc0] bg-[#fbfaf6] p-6 shadow-[0_20px_55px_-40px_rgba(21,68,69,0.28)]">
                  <item.icon className="text-[#907326]" size={24} />
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[#907326]">{item.label}</p>
                  <p className="mt-3 text-xl font-black leading-snug text-[#173635]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border border-[#d8c58d] bg-[#173635] p-6 text-white shadow-[0_30px_80px_-50px_rgba(23,54,53,0.8)] md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0d27a]">Acara Utama</p>
                <h3 className="mt-3 text-2xl font-black">Tasmie Akhir & Pelepasan</h3>
                <p className="mt-2 text-sm leading-7 text-white/72">SMP Angkatan XI & SMA Angkatan IX</p>
              </div>
              <div className="flex items-center gap-3 text-[#f0d27a]">
                <GraduationCap size={36} />
                <p className="text-right text-sm font-black uppercase tracking-[0.2em]">Tahun Pendidikan<br />2025/2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lokasi" className="bg-[#173635] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f0d27a]">Lokasi</p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Darussunnah 2 Putra</h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              Kp. Muara Jaya, Ds. Ciaruteun Ilir RT. 01/RW. 05,
              Kec. Cibungbulang, Bogor 16630.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Darussunnah%202%20Putra%20Ciaruteun%20Ilir%20Cibungbulang%20Bogor"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d27a] px-6 py-3 text-sm font-black text-[#173635] transition hover:bg-white"
            >
              <MapPin size={18} />
              Buka Google Maps
            </a>
          </div>

          <div className="relative min-h-[360px] overflow-hidden border border-white/14 bg-white/8 p-4">
            <div className="absolute inset-4 border border-[#f0d27a]/35" />
            <div className="relative flex h-full min-h-[328px] flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(240,210,122,0.32),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] p-7">
              <MapPin size={54} className="text-[#f0d27a]" />
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.28em] text-[#f0d27a]">Alamat Acara</p>
              <p className="mt-3 text-2xl font-black leading-tight">Kp. Muara Jaya, Ciaruteun Ilir</p>
              <p className="mt-3 text-sm leading-7 text-white/72">Mohon hadir tepat waktu agar rangkaian acara dapat berlangsung tertib dan khidmat.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="galeri" className="bg-[#f7f5ef] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#907326]">Preview Undangan</p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-[#173635] sm:text-5xl">Informasi acara dalam satu tampilan.</h2>
            </div>
            <a
              href="/assets/img/tasmi-undangan-2026.jpg"
              download
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cdb777] bg-white px-5 py-3 text-sm font-black text-[#173635] shadow-sm transition hover:bg-[#173635] hover:text-white"
            >
              <Download size={18} />
              Unduh Gambar
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="overflow-hidden border border-[#d9c58f] bg-white p-3 shadow-[0_30px_80px_-55px_rgba(21,68,69,0.45)]">
              <Image
                src="/assets/img/tasmi-undangan-2026.jpg"
                alt="Undangan Tasmie Akhir dan Pelepasan Darussunnah"
                width={920}
                height={1280}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="grid gap-4">
              <div className="border border-[#e8dcc0] bg-white p-7">
                <Music2 className="text-[#907326]" size={28} />
                <h3 className="mt-5 text-2xl font-black text-[#173635]">Doa dan kehadiran Bapak/Ibu sangat berarti.</h3>
                <p className="mt-4 text-sm leading-7 text-[#5b6e6b]">
                  Semoga acara ini menjadi wasilah kebaikan bagi para santri, keluarga, dan seluruh
                  keluarga besar Darussunnah.
                </p>
              </div>
              <div className="border border-[#e8dcc0] bg-white p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#907326]">Wassalamu'alaikum</p>
                <p className="mt-4 text-lg font-black leading-relaxed text-[#173635]">
                  Panitia Tasmie Akhir & Pelepasan Darussunnah Islamic Boarding School
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#102f2f] px-4 py-10 text-center text-white sm:px-6 lg:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0d27a]">Darussunnah Islamic Boarding School</p>
        <p className="mt-3 text-sm text-white/62">https://darussunnahparung.com</p>
      </footer>
    </main>
    </PublicLayout>
  );
}
