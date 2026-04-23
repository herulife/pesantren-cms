'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addFaq, Faq, getFaqs, updateFaq } from '@/lib/api';
import { ArrowLeft, Eye, EyeOff, HelpCircle, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

type FaqFormState = Omit<Faq, 'id' | 'order_num'>;

const createInitialForm = (): FaqFormState => ({
  question: '',
  answer: '',
  is_active: true,
});

export default function FaqFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <FaqFormContent />
    </Suspense>
  );
}

function FaqFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showToast } = useToast();

  const [form, setForm] = useState<FaqFormState>(createInitialForm());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadFaq = async () => {
      const items = await getFaqs('');
      const current = items.find((item) => String(item.id) === id);
      if (!current) {
        showToast('error', 'FAQ tidak ditemukan.');
        router.push('/admin/faqs');
        return;
      }

      setForm({
        question: current.question,
        answer: current.answer,
        is_active: current.is_active,
      });
      setIsLoading(false);
    };
    loadFaq();
  }, [id, router, showToast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.question || !form.answer) {
      showToast('error', 'Pertanyaan dan jawaban wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      if (id) {
        const res = await updateFaq(Number(id), form);
        if (res.success) {
          showToast('success', 'FAQ berhasil diperbarui.');
          router.push('/admin/faqs');
        } else {
          showToast('error', 'Gagal memperbarui FAQ.');
        }
      } else {
        const res = await addFaq(form);
        if (res.success) {
          showToast('success', 'FAQ berhasil ditambahkan.');
          router.push('/admin/faqs');
        } else {
          showToast('error', 'Gagal menambahkan FAQ.');
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
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/faqs')}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form FAQ</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">{id ? 'Edit FAQ' : 'Tambah FAQ'}</h1>
          <p className="text-sm font-medium text-slate-500">Form FAQ sekarang tampil penuh agar isi pertanyaan dan jawaban lebih nyaman diedit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <HelpCircle size={12} /> Pertanyaan
            </label>
            <input
              type="text"
              required
              value={form.question}
              onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-lg font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Apa saja syarat pendaftaran santri baru?"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jawaban Lengkap</label>
            <textarea
              required
              rows={10}
              value={form.answer}
              onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm font-medium leading-relaxed text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Tuliskan jawaban FAQ di sini..."
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${form.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {form.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-900">Status Publikasi</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{form.is_active ? 'Terlihat oleh publik' : 'Hanya draf admin'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative flex h-8 w-14 items-center rounded-full px-1 transition-all ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-all ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/faqs')}
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
            Simpan FAQ
          </button>
        </div>
      </form>
    </div>
  );
}
