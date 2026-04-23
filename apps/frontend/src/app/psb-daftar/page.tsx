'use client';

import React from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { useAuth } from '@/components/AuthProvider';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

export default function PSBDaftarPage() {
  const { user } = useAuth();
  const isPortalUser = user?.role === 'user';

  const steps = [
    {
      title: 'Buat akun portal',
      desc: 'Calon wali santri membuat akun terlebih dahulu agar proses pendaftaran tersimpan rapi.',
      icon: UserPlus,
    },
    {
      title: 'Lengkapi biodata',
      desc: 'Isi data calon santri dan data orang tua secara bertahap melalui portal.',
      icon: FileText,
    },
    {
      title: 'Unggah berkas',
      desc: 'Dokumen persyaratan diunggah dari portal dan dipantau status verifikasinya.',
      icon: CheckCircle2,
    },
  ];

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-800 bg-emerald-950 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.3),transparent_50%)]" />
        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <span className="mb-6 inline-flex rounded-full bg-amber-400 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-950">
            Alur Pendaftaran PSB
          </span>
          <h1 className="font-outfit text-4xl font-black uppercase tracking-tight md:text-5xl">
            Mulai Pendaftaran dari Portal Wali Santri
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-emerald-100/90">
            Pendaftaran PSB tidak lagi memakai formulir lepas. Semua proses sekarang dipusatkan ke akun portal agar data, dokumen, dan status seleksi lebih mudah dipantau.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50/80 p-8 shadow-sm">
              <h2 className="font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                Flow Yang Dipakai Sekarang
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Supaya data pendaftar tidak tercecer, langkah daftar dibuat satu jalur dari akun portal sampai unggah dokumen.
              </p>

              <div className="mt-8 space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4 rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                          Langkah {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">{step.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2.5rem] border border-emerald-100 bg-emerald-50 p-8 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <ShieldCheck size={26} />
                </div>
                <h2 className="font-outfit text-2xl font-black uppercase tracking-tight text-emerald-950">
                  {isPortalUser ? 'Akun Portal Sudah Aktif' : 'Belum Punya Akun?'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-emerald-900/75">
                  {isPortalUser
                    ? 'Kamu sudah login sebagai wali/calon santri. Lanjutkan saja proses pendaftaran dari portal.'
                    : 'Silakan buat akun portal terlebih dahulu. Setelah itu semua proses PSB dilakukan dari satu tempat.'}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  {isPortalUser ? (
                    <Link
                      href="/portal"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                    >
                      Buka Portal Wali Santri <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register?from=psb"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                      >
                        Buat Akun Portal Wali Santri <UserPlus size={16} />
                      </Link>
                      <Link
                        href="/login?from=psb"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Sudah Punya Akun <LogIn size={16} />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">
                  Yang Bisa Dilakukan di Portal
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
                  <li>Melengkapi biodata calon santri dan data orang tua.</li>
                  <li>Mengunggah dokumen persyaratan secara bertahap.</li>
                  <li>Memantau status verifikasi dari panitia PSB.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
