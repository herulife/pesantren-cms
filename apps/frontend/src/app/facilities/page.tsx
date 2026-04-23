'use client';

import React, { useEffect, useState } from 'react';
import { getFacilities, Facility, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { Sparkles, MapPin, Building2, LayoutGrid, LayoutList } from 'lucide-react';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const data = await getFacilities();
        setFacilities(data);
      } catch (e) {
        console.error('Error fetching facilities:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFacilities();
  }, []);

  const categories = ['all', ...Array.from(new Set(facilities.map(f => f.category)))];
  const filteredFacilities = activeCategory === 'all' 
    ? facilities 
    : facilities.filter(f => f.category === activeCategory);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-slate-900 py-32 px-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10 gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10">
              <Sparkles size={14} />
              Kenyamanan Belajar Santri
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tight leading-tight">Fasilitas <br /> & Sarana Pondok</h1>
            <p className="text-emerald-100 font-medium text-lg leading-relaxed">
              Lingkungan yang kondusif dengan fasilitas lengkap untuk mendukung proses belajar dan menghafal Al-Qur'an secara maksimal.
            </p>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="w-40 h-40 bg-emerald-600 rounded-3xl rotate-6 hover:rotate-0 transition-transform"></div>
            <div className="w-40 h-40 bg-amber-400 rounded-3xl -rotate-12 hover:rotate-0 transition-transform mt-8"></div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b border-slate-100 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6 flex overflow-x-auto gap-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                activeCategory === cat 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-600 hover:text-emerald-600'
              }`}
            >
              {cat === 'all' ? 'Semua Fasilitas' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[450px] bg-slate-50 rounded-[3rem] animate-pulse"></div>
            ))}
          </div>
        ) : filteredFacilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredFacilities.map((facility) => (
              <div key={facility.id} className="group bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="aspect-[4/3] relative overflow-hidden">
                  {resolveDisplayImageUrl(facility.image_url) ? (
                    <img 
                      src={resolveDisplayImageUrl(facility.image_url)} 
                      alt={facility.name}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-slate-50">
                      <Building2 size={64} className="mb-4 opacity-20" />
                      <span className="font-black text-[10px] uppercase tracking-widest">Foto Belum Tersedia</span>
                    </div>
                  )}
                  {facility.is_highlight && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-amber-400/90 backdrop-blur-md rounded-xl text-emerald-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                      Fasilitas Unggulan
                    </div>
                  )}
                </div>
                <div className="p-10">
                  <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-black text-[10px] uppercase tracking-widest mb-4">
                    {facility.category}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
                    {facility.description || 'Fasilitas modern yang dirancang untuk mendukung kenyamanan santri.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[4rem] py-32 text-center border-2 border-dashed border-slate-200">
            <Building2 className="mx-auto text-slate-200 mb-6" size={64} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Informasi fasilitas belum tersedia</p>
          </div>
        )}
      </section>

      {/* Info Card */}
      <section className="px-8 py-24 mb-24">
        <div className="max-w-5xl mx-auto bg-emerald-50 rounded-[4rem] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 group">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
            <MapPin size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-4">Lingkungan Aman & Strategis</h3>
            <p className="text-emerald-700 font-medium leading-relaxed text-lg">
              Kampus Darussunnah terletak di lokasi yang tenang namun mudah diakses, memberikan ketenangan bagi santri untuk fokus menghafal dan belajar tanpa gangguan keramaian kota.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
