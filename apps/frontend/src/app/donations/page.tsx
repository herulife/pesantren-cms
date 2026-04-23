'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { getCampaigns, Campaign, resolveDisplayImageUrl } from '@/lib/api';
import { Heart, Activity, CheckCircle, ArrowRight } from 'lucide-react';

export default function DonationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const data = await getCampaigns();
      setCampaigns(data.filter(c => c.is_active));
      setIsLoading(false);
    }
    fetch();
  }, []);

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="relative py-20 bg-emerald-900 border-b border-emerald-800 overflow-hidden">
        <div className="absolute inset-0 bg-emerald-950 opacity-50" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="w-20 h-20 bg-emerald-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-emerald-700/50">
             <Heart className="text-emerald-400" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-outfit uppercase tracking-tight">Donasi & Wakaf</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">Mari bersama-sama membangun generasi penghafal Al-Qur'an dan menyokong kegiatan operasional pondok.</p>
        </div>
      </section>

      {/* Campaigns Loop */}
      <section className="py-20 bg-white min-h-[50vh]">
        <div className="container mx-auto px-4 max-w-6xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
               <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full font-bold"></div>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map(campaign => {
                const progress = campaign.target_amount > 0 ? Math.min(100, Math.round((campaign.collected_amount / campaign.target_amount) * 100)) : 0;

                return (
                  <div key={campaign.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 overflow-hidden group flex flex-col">
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      {resolveDisplayImageUrl(campaign.image_url) ? (
                        <img src={resolveDisplayImageUrl(campaign.image_url)} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-200">
                           <Heart size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                        <Activity size={12} /> Aktif
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-xl font-black text-slate-900 mb-3 font-outfit uppercase tracking-tight leading-tight">{campaign.title}</h3>
                      <p className="text-slate-500 text-sm mb-6 flex-1">{campaign.description}</p>
                      
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold mb-2">
                           <span className="text-slate-400 uppercase tracking-widest">Terkumpul</span>
                           <span className="text-emerald-600">Rp {campaign.collected_amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="mt-2 text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                           Target: Rp {campaign.target_amount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button className="w-full py-4 text-center rounded-[1.5rem] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex justify-center items-center gap-2">
                        Donasi Sekarang <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                  <CheckCircle className="text-slate-300" size={32} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 font-outfit">Belum Ada Program Donasi</h3>
               <p className="text-slate-500 mt-2 max-w-md mx-auto">Saat ini belum ada program donasi / wakaf yang aktif. Silahkan kembali lagi nanti.</p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
