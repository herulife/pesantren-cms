'use client';

import React, { useState } from 'react';
import { createContactMessage } from '@/lib/api';
import { useToast } from '@/components/Toast';
import PublicLayout from '@/components/PublicLayout';
import {
  usePublicSiteContext,
  useWebsiteBuilderPageContent,
} from '@/components/PublicSiteContext';
import { defaultWebsiteBuilderPages } from '@/lib/website-builder';
import { Send, MapPin, Phone, Clock, RefreshCw, MessageCircle } from 'lucide-react';

export function ContactPageContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();
  const pageContent = useWebsiteBuilderPageContent('kontak', defaultWebsiteBuilderPages.kontak);
  const context = usePublicSiteContext();
  const settings = context?.settings || {};

  const schoolAddress =
    settings.school_address ||
    'Jl. KH. Ahmad Sugriwa, Kp. Lengkong Barang RT 01 RW 02, Desa Iwul, Kec. Parung, Kab. Bogor 16330';
  const schoolPhone = settings.school_phone || '0814 1324 1748';
  const schoolEmail = settings.school_email || 'info@darussunnahparung.or.id';
  const schoolWebsite = settings.school_website || 'https://darussunnahparung.or.id';
  const adminWhatsAppRaw = settings.whatsapp_admin_numbers || schoolPhone;
  const adminWhatsAppNumbers = adminWhatsAppRaw
    .split(/\r?\n|,/)
    .map((item) => item.replace(/\D/g, '').trim())
    .filter(Boolean);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.message) {
      showToast('error', 'Nama dan Pesan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createContactMessage(formData);
      if (response.success || response.id) {
        setIsSuccess(true);
        showToast('success', 'Pesan Anda berhasil dikirim! Kami akan segera menghubungi Anda.');
        setFormData({ name: '', email: '', whatsapp: '', message: '' });
      } else {
        showToast('error', 'Gagal mengirim pesan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-950/70" />
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-800/30 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-900/20 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-bold tracking-widest text-emerald-200">
            {pageContent.hero.eyebrow.toUpperCase()}
          </div>
          <h1 className="font-outfit mb-6 text-4xl font-black tracking-tight md:text-5xl">
            {pageContent.hero.title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-emerald-100/80">
            {pageContent.hero.subtitle}
          </p>

          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">
                {pageContent.summary.address_title}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/80">{schoolAddress}</p>
              <p className="mt-3 text-xs text-white/70">{pageContent.summary.address_supporting}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">
                {pageContent.summary.contact_title}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">{schoolPhone}</p>
              <p className="mt-1 text-xs text-white/70">{schoolEmail}</p>
              <p className="mt-3 text-xs text-white/70">{pageContent.summary.contact_supporting}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">
                {pageContent.summary.hours_title}
              </p>
              <p className="mt-3 text-sm font-medium text-white/80">{pageContent.summary.hours_supporting}</p>
              <p className="mt-1 text-xs text-white/70">
                {adminWhatsAppNumbers.length > 1
                  ? `${adminWhatsAppNumbers.length} admin siap membantu`
                  : 'Admin siap membantu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-12 max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-start gap-5 rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-black text-slate-800">{pageContent.info_cards.address_title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{schoolAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-5 rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-black text-slate-800">{pageContent.info_cards.contact_title}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">
                    Kontak utama: <span className="font-bold text-slate-700">{schoolPhone}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Email: <span className="font-bold text-slate-700">{schoolEmail}</span>
                  </p>
                </div>
                {adminWhatsAppNumbers.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {adminWhatsAppNumbers.slice(0, 2).map((phone, index) => (
                      <a
                        key={`${phone}-${index}`}
                        href={`https://wa.me/${phone}?text=${encodeURIComponent(
                          'Assalamualaikum, saya ingin bertanya tentang Pondok Pesantren Darussunnah.'
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                      >
                        <MessageCircle size={14} />
                        Chat Admin {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-5 rounded-[2.5rem] border border-slate-100 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-black text-slate-800">{pageContent.info_cards.hours_title}</h3>
                <p className="mb-1 text-sm leading-relaxed text-slate-500">
                  Silakan hubungi kami pada jam kerja:
                </p>
                <p className="block text-sm font-bold text-slate-800">
                  {pageContent.summary.hours_supporting}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Website: <span className="font-bold text-slate-700">{schoolWebsite}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white/96 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-12">
              <div className="mb-10">
                <h2 className="font-outfit mb-2 text-2xl font-black text-slate-800">
                  {pageContent.form.title}
                </h2>
                <p className="text-balance text-sm text-slate-500">{pageContent.form.subtitle}</p>
              </div>

              {isSuccess ? (
                <div className="animate-in zoom-in-95 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Send size={32} />
                  </div>
                  <h3 className="mb-2 text-2xl font-black text-emerald-900">
                    {pageContent.form.success_title}
                  </h3>
                  <p className="mx-auto mb-8 max-w-sm text-emerald-700">
                    {pageContent.form.success_message}
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="rounded-2xl bg-emerald-600 px-8 py-3 font-bold text-white transition hover:bg-emerald-700"
                  >
                    {pageContent.form.reset_label}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Cth: Abdullah"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Cth: 08123456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Cth: abdullah@email.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Pesan / Pertanyaan *
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium leading-relaxed transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-10 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50 md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> {pageContent.form.submitting_label}
                      </>
                    ) : (
                      <>
                        <Send size={18} /> {pageContent.form.submit_label}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-[2.5rem] border border-slate-100 bg-white/96 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-4 px-4 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">
                {pageContent.map.eyebrow}
              </p>
              <h2 className="font-outfit mt-2 text-xl font-black text-slate-800">{pageContent.map.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{pageContent.map.subtitle}</p>
            </div>
            <a
              href={pageContent.map.button_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
            >
              {pageContent.map.button_label}
            </a>
          </div>
          <div className="h-[400px] w-full overflow-hidden rounded-3xl bg-slate-100">
            <iframe
              src={pageContent.map.embed_url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactPageContent />
    </PublicLayout>
  );
}
