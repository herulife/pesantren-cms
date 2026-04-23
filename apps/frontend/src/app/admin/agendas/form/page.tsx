'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addAgenda, Agenda, getAgendas, updateAgenda } from '@/lib/api';
import { ArrowLeft, Calendar, Clock, Info, Loader2, MapPin, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

const CATEGORIES = ['Akademik', 'PSB', 'Libur', 'Event', 'Umum'];

type AgendaFormState = Omit<Agenda, 'id'>;

const createInitialForm = (): AgendaFormState => ({
  title: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: null,
  time_info: '',
  location: '',
  description: '',
  category: 'Umum',
});

export default function AgendaFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <AgendaFormContent />
    </Suspense>
  );
}

function AgendaFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showToast } = useToast();

  const [form, setForm] = useState<AgendaFormState>(createInitialForm());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadAgenda = async () => {
      const agendas = await getAgendas('');
      const current = agendas.find((item) => String(item.id) === id);
      if (!current) {
        showToast('error', 'Agenda tidak ditemukan.');
        router.push('/admin/agendas');
        return;
      }

      setForm({
        title: current.title,
        start_date: current.start_date.split('T')[0],
        end_date: current.end_date ? current.end_date.split('T')[0] : null,
        time_info: current.time_info || '',
        location: current.location || '',
        description: current.description || '',
        category: current.category || 'Umum',
      });
      setIsLoading(false);
    };

    loadAgenda();
  }, [id, router, showToast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.start_date) {
      showToast('error', 'Judul dan tanggal mulai wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        end_date: form.end_date || null,
        time_info: form.time_info || null,
        location: form.location || null,
        description: form.description || null,
      };

      if (id) {
        const res = await updateAgenda(Number(id), payload as Partial<Agenda>);
        if (res.success) {
          showToast('success', 'Agenda berhasil diperbarui.');
          router.push('/admin/agendas');
        } else {
          showToast('error', 'Gagal memperbarui agenda.');
        }
      } else {
        const res = await addAgenda(payload as Omit<Agenda, 'id'>);
        if (res.success) {
          showToast('success', 'Agenda berhasil ditambahkan.');
          router.push('/admin/agendas');
        } else {
          showToast('error', 'Gagal menambahkan agenda.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/agendas')}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form Agenda</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">
            {id ? 'Edit Agenda' : 'Tambah Agenda'}
          </h1>
          <p className="text-sm font-medium text-slate-500">Lengkapi jadwal kegiatan dalam halaman penuh agar lebih nyaman ditinjau.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Info size={12} /> Judul Agenda
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Contoh: Ujian Tahfidz Semester Genap"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar size={12} /> Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar size={12} /> Tanggal Selesai
              </label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value || null }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock size={12} /> Info Waktu
              </label>
              <input
                type="text"
                value={form.time_info || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, time_info: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="08.00 - 11.30 WIB"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <MapPin size={12} /> Lokasi
              </label>
              <input
                type="text"
                value={form.location || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Aula Darussunnah"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category }))}
                    className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      form.category === category ? 'bg-white text-emerald-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-emerald-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi</label>
              <textarea
                rows={6}
                value={form.description || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium leading-relaxed text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Tambahkan keterangan tambahan agenda di sini..."
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/agendas')}
            className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {id ? 'Simpan Perubahan' : 'Simpan Agenda'}
          </button>
        </div>
      </form>
    </div>
  );
}
