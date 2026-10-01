'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { changeMyPassword } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { KeyRound, LogOut, ShieldCheck, UserRound, TriangleAlert } from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10';

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  bendahara: 'Bendahara',
  panitia_psb: 'Panitia PSB',
  tim_media: 'Tim Media',
  pimpinan: 'Pimpinan',
  wali_kelas: 'Wali Kelas',
  guru: 'Guru',
  ustadz: 'Ustadz',
  user: 'Wali Santri',
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const initial = (user?.name || 'A').trim().charAt(0).toUpperCase();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSaving) return;

    // Cek yang paling murah lebih dulu supaya tidak round-trip ke server.
    if (newPassword.length < 8) {
      showToast('error', 'Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi password tidak cocok.');
      return;
    }
    if (newPassword === oldPassword) {
      showToast('error', 'Password baru harus berbeda dari password lama.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await changeMyPassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        // Backend menaikkan token_version -> semua sesi termasuk yang ini jadi
        // tidak valid. logout() tetap jalan karena /api/logout memverifikasi
        // signature JWT saja (tidak mengecek token_version) dan meng-expire
        // cookie di sisi server.
        showToast('success', 'Password berhasil diubah. Silakan login kembali.');
        await logout();
        router.push('/login?password=changed');
      } else {
        showToast('error', res.message || 'Gagal mengubah password.');
        setIsSaving(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-10 font-outfit">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-outfit text-3xl font-black uppercase tracking-tight text-slate-900">
            Akun Saya
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Lihat identitas akun yang sedang dipakai dan ganti password login Anda.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-100 md:flex">
          <ShieldCheck size={20} className="text-sky-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-700">
            Sesi Terenkripsi
          </span>
        </div>
      </div>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-600 text-3xl font-black text-white shadow-lg shadow-sky-600/20">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
              Identitas Akun
            </p>
            <h2 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900">
              {user?.name || 'Administrator'}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{user?.email || '-'}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
              <UserRound size={13} />
              {roleLabels[user?.role || ''] || user?.role || 'staff'}
            </p>
          </div>
        </div>

        <p className="mt-6 border-t border-slate-100 pt-5 text-xs font-medium leading-6 text-slate-500">
          Nama, email, dan role dikelola oleh Super Admin lewat halaman{' '}
          <Link href="/admin/users" className="font-bold text-sky-700 underline-offset-2 hover:underline">
            Manajemen Pengguna
          </Link>
          . Halaman ini hanya mengubah password milik akun Anda sendiri.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Ganti Password</h2>
            <p className="text-sm font-medium text-slate-500">
              Minimal 8 karakter. Password baru harus berbeda dari password lama.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
              Password Lama
            </label>
            <input
              type="password"
              name="old_password"
              autoComplete="current-password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputClass}
              placeholder="Masukkan password yang dipakai sekarang"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
              Password Baru
            </label>
            <input
              type="password"
              name="new_password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Ulangi password baru"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm font-medium leading-6 text-amber-900">
            <p className="flex items-start gap-2">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>
                Setelah password diganti, semua sesi akan langsung keluar — termasuk sesi di HP dan
                laptop ini. Anda akan diarahkan ke halaman masuk untuk login dengan password baru.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <KeyRound size={16} />
              {isSaving ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
