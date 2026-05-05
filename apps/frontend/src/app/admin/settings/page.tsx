'use client';

import React, { useState } from 'react';

import TabUmum from './tabs/TabUmum';
import TabBannerHero from './tabs/TabBannerHero';
import TabKartuInfo from './tabs/TabKartuInfo';
import TabKontak from './tabs/TabKontak';
import TabSosmed from './tabs/TabSosmed';
import TabSambutan from './tabs/TabSambutan';
import TabAIConfig from './tabs/TabAIConfig';
import TabLisensi from './tabs/TabLisensi';
import TabNotifikasiWA from './tabs/TabNotifikasiWA';
import TabPembayaranPSB from './tabs/TabPembayaranPSB';

export default function SettingsAdminPage() {
  const [activeTab, setActiveTab] = useState('Umum');

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'Umum': return <TabUmum />;
      case 'Slider Beranda': return <TabBannerHero />;
      case 'Kartu Info': return <TabKartuInfo />;
      case 'Kontak': return <TabKontak />;
      case 'Sosmed': return <TabSosmed />;
      case 'Sambutan': return <TabSambutan />;
      case 'AI Config': return <TabAIConfig />;
      case 'Notifikasi WA': return <TabNotifikasiWA />;
      case 'Pembayaran PSB': return <TabPembayaranPSB />;
      case 'Lisensi': return <TabLisensi />;
      default: return <TabUmum />;
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Pengaturan Website</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola profil lembaga, fitur, dan sistem API secara tersentralisasi.</p>
        </div>
      </div>

      <div className="w-full space-y-8">
         {/* Navigation Tabs */}
         <div className="bg-slate-100/70 p-2 rounded-xl flex items-center overflow-x-auto border border-slate-200 mb-8 whitespace-nowrap shadow-sm scrollbar-hide">
            {['Umum', 'Slider Beranda', 'Kartu Info', 'Kontak', 'Sosmed', 'Sambutan', 'AI Config', 'Notifikasi WA', 'Pembayaran PSB', 'Lisensi'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2.5 text-xs font-black tracking-[0.08em] transition-all duration-300 sm:px-6 sm:py-3 sm:text-sm sm:tracking-wide ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
         
         {/* Active Tab Component */}
         <div className="animate-in fade-in transition-all">
           {renderActiveTab()}
         </div>
      </div>
    </>
  );
}
