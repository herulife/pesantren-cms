'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgendas, Agenda } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { Sparkles, Calendar, Clock, MapPin, ChevronRight, Bell } from 'lucide-react';

export default function AgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgendas() {
      try {
        const data = await getAgendas();
        // Sort by date (upcoming first)
        const sortedData = data.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        setAgendas(sortedData);
      } catch (e) {
        console.error('Error fetching agendas:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgendas();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
  };

  const getMonthYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const getDay = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-amber-400 py-32 px-8 text-emerald-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/10 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-950/10">
            <Sparkles size={14} />
            Kalender Akademik & Dakwah
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tight leading-tight">Agenda Pondok</h1>
          <p className="text-emerald-900/70 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            Ikuti berbagai kegiatan bermanfaat, mulai dari kajian rutin, seminar, hingga kegiatan santri Darussunnah.
          </p>
        </div>
      </section>

      {/* Agendas List */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : agendas.length > 0 ? (
          <div className="space-y-12">
            {agendas.map((agenda) => (
              <div key={agenda.id} className="group flex flex-col md:flex-row gap-8 items-start hover:bg-slate-50/50 p-6 rounded-[3rem] transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
                <div className="flex flex-col items-center justify-center w-24 h-24 bg-white border-2 border-emerald-600 rounded-3xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg shadow-emerald-100 group-hover:shadow-emerald-200">
                  <span className="text-3xl font-black leading-none mb-1">{getDay(agenda.start_date)}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{getMonthYear(agenda.start_date)}</span>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {agenda.category}
                    </span>
                    <span className="text-slate-300 font-medium text-sm">•</span>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      <Clock size={14} className="text-emerald-500" />
                      {agenda.time_info || '08:00 - Selesai'}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                    {agenda.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                      <MapPin size={16} className="text-rose-500" />
                      {agenda.location || 'Masjid Darussunnah'}
                    </div>
                  </div>
                  
                  <p className="text-slate-400 font-medium leading-relaxed mb-6">
                    {agenda.description || 'Mari hadir dan raih keberkahan dalam majelis ilmu ini.'}
                  </p>
                </div>
                
                <button className="hidden md:flex w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl items-center justify-center group-hover:bg-amber-400 group-hover:text-emerald-950 transition-all self-center">
                  <Bell size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[4rem] py-32 text-center border-2 border-dashed border-slate-200">
            <Calendar className="mx-auto text-slate-200 mb-6" size={64} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada agenda terdekat</p>
          </div>
        )}
      </section>

      {/* CTA section for agenda */}
      <section className="px-8 py-24 mb-24">
        <div className="max-w-4xl mx-auto bg-emerald-950 rounded-[4rem] p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Ingin Menyelenggarakan Kegiatan?</h3>
            <p className="text-emerald-300 font-medium mb-8">Kerjasama dakwah dan kegiatan sosial dapat dilakukan melalui manajemen Darussunnah.</p>
            <Link href="https://wa.me/621234567890" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all">
              Hubungi Sekretariat <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
