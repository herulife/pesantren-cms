'use client';

import React, { useEffect, useState } from 'react';
import { createContactMessage, getPublicSettingsMap, SettingsMap } from '@/lib/api';
import { useToast } from '@/components/Toast';
import PublicLayout from '@/components/PublicLayout';
import { Send, MapPin, Phone, Clock, RefreshCw, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>({});
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      const data = await getPublicSettingsMap();
      setSettings(data || {});
    }

    fetchSettings();
  }, []);

  const schoolAddress = settings.school_address || 'Jl. KH. Ahmad Sugriwa, Kp. Lengkong Barang RT 01 RW 02, Desa Iwul, Kec. Parung, Kab. Bogor 16330';
  const schoolPhone = settings.school_phone || '0814 1324 1748';
  const schoolEmail = settings.school_email || 'info@darussunnahparung.or.id';
  const schoolWebsite = settings.school_website || 'https://darussunnahparung.or.id';
  const adminWhatsAppRaw = settings.whatsapp_admin_numbers || schoolPhone;
  const adminWhatsAppNumbers = adminWhatsAppRaw
    .split(/\r?\n|,/)
    .map((item) => item.replace(/\D/g, '').trim())
    .filter(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      showToast('error', 'Nama dan Pesan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createContactMessage(formData);
      if (res.success || res.id) {
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
    <PublicLayout>
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Section */}
      <div className="bg-slate-950 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-950/70"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800/30 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-900/20 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/15 rounded-full text-emerald-200 text-sm font-bold tracking-widest mb-6">
            HUBUNGI KAMI
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight font-outfit">Hubungi Pondok Darussunnah</h1>
          <p className="text-emerald-100/80 max-w-2xl mx-auto text-lg leading-relaxed">
            Jika ingin bertanya tentang program pondok, pendaftaran, atau kebutuhan informasi lainnya, silakan kirim pesan kepada kami.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3 text-left">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">Alamat</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/80">{schoolAddress}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">Kontak Utama</p>
              <p className="mt-3 text-sm font-semibold text-white">{schoolPhone}</p>
              <p className="mt-1 text-xs text-white/70">{schoolEmail}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">Layanan</p>
              <p className="mt-3 text-sm font-medium text-white/80">Senin - Sabtu, 08:00 - 16:00 WIB</p>
              <p className="mt-1 text-xs text-white/70">
                {adminWhatsAppNumbers.length > 1 ? `${adminWhatsAppNumbers.length} admin siap membantu` : 'Admin siap membantu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-5">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">Alamat Pondok</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {schoolAddress}
                  </p>
               </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-5">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <Phone size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">Telepon / WhatsApp</h3>
                  <div className="space-y-1">
                     <p className="text-slate-500 text-sm">Kontak utama: <span className="font-bold text-slate-700">{schoolPhone}</span></p>
                     <p className="text-slate-500 text-sm">Email: <span className="font-bold text-slate-700">{schoolEmail}</span></p>
                  </div>
                  {adminWhatsAppNumbers.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {adminWhatsAppNumbers.slice(0, 2).map((phone, index) => (
                        <a
                          key={`${phone}-${index}`}
                          href={`https://wa.me/${phone}?text=${encodeURIComponent('Assalamualaikum, saya ingin bertanya tentang Pondok Pesantren Darussunnah.')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                        >
                          <MessageCircle size={14} />
                          Chat Admin {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-5">
               <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Clock size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">Jam Operasional</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-1">Silakan hubungi kami pada jam kerja:</p>
                  <p className="text-slate-800 font-bold block text-sm">Senin - Sabtu: 08:00 - 16:00 WIB</p>
                  <p className="mt-2 text-slate-500 text-sm">Website: <span className="font-bold text-slate-700">{schoolWebsite}</span></p>
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/96 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-10">
                 <h2 className="text-2xl font-black text-slate-800 mb-2 font-outfit">Kirim Pesan</h2>
                 <p className="text-slate-500 text-sm text-balance">Isi form di bawah ini. Insya Allah kami akan membalas melalui WhatsApp atau email yang Anda cantumkan.</p>
              </div>

              {isSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl text-center animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900 mb-2">Pesan Terkirim!</h3>
                  <p className="text-emerald-700 mb-8 max-w-sm mx-auto">Terima kasih. Pesan Anda sudah kami terima dan akan kami tindak lanjuti secepatnya.</p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition"
                  >
                    Kirim Pesan Lagi
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap *</label>
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                        placeholder="Cth: Abdullah"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nomor WhatsApp</label>
                      <input 
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                        placeholder="Cth: 08123456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Alamat Email</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                      placeholder="Cth: abdullah@email.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pesan / Pertanyaan *</label>
                    <textarea 
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm leading-relaxed"
                      placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <><RefreshCw size={18} className="animate-spin" /> MENGIRIM...</>
                    ) : (
                      <><Send size={18} /> KIRIM PESAN</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Large Map Section */}
        <div className="mt-12 bg-white/96 backdrop-blur-sm p-4 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <div className="flex flex-col gap-4 px-4 pb-4 md:flex-row md:items-end md:justify-between">
             <div>
               <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Lokasi Pondok</p>
               <h2 className="mt-2 text-xl font-black text-slate-800 font-outfit">Peta Lokasi</h2>
               <p className="mt-2 max-w-2xl text-sm text-slate-500">
                 Gunakan peta ini untuk menemukan jalur menuju Pondok Pesantren Tahfidz Al-Qur&apos;an Darussunnah di Parung, Bogor.
               </p>
             </div>
             <a
               href="https://maps.google.com/?q=Pondok%20Pesantren%20Darussunnah%20Parung"
               target="_blank"
               rel="noreferrer"
               className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
             >
               Buka di Google Maps
             </a>
           </div>
           <div className="w-full h-[400px] rounded-3xl overflow-hidden bg-slate-100">
             <iframe 
                src="https://maps.google.com/maps?q=Pondok%20Pesantren%20Darussunnah%20Parung&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
             ></iframe>
           </div>
        </div>

      </div>
    </div>
    </PublicLayout>
  );
}
