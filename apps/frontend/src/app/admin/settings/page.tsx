'use client';

// Pengaturan Website (jilid 8): tab + filter role + init ?tab=.
// Model akses mengikuti backend: semua tab superadmin-only KECUALI
// Staf Mengajar (superadmin + tim_media). API settings tetap
// RequireRole("superadmin") di server; teachers API tidak berubah.

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

import TabUmum from './tabs/TabUmum';
import TabBannerHero from './tabs/TabBannerHero';
import TabKartuInfo from './tabs/TabKartuInfo';
import TabKontak from './tabs/TabKontak';
import TabSosmed from './tabs/TabSosmed';
import TabSambutan from './tabs/TabSambutan';
import TabAIConfig from './tabs/TabAIConfig';
import TabRekening from './tabs/TabRekening';
import TabStafMengajar from './tabs/TabStafMengajar';

type TabDef = { id: string; roles: string[] };

const TABS: TabDef[] = [
  { id: 'Umum', roles: ['superadmin'] },
  { id: 'Slider Beranda', roles: ['superadmin'] },
  { id: 'Kartu Info', roles: ['superadmin'] },
  { id: 'Kontak', roles: ['superadmin'] },
  { id: 'Sosmed', roles: ['superadmin'] },
  { id: 'Sambutan', roles: ['superadmin'] },
  { id: 'AI Config', roles: ['superadmin'] },
  { id: 'No. Rekening', roles: ['superadmin'] },
  { id: 'Staf Mengajar', roles: ['superadmin', 'tim_media'] },
];

export default function SettingsAdminPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const visibleTabs = TABS.filter(
    (t) => role === 'superadmin' || t.roles.includes(role),
  );
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'Umum';
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab && TABS.some((t) => t.id === tab) ? tab : 'Umum';
  });

  const effectiveTab = visibleTabs.some((t) => t.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id || 'Umum';

  const renderActiveTab = () => {
    switch (effectiveTab) {
      case 'Umum': return <TabUmum />;
      case 'Slider Beranda': return <TabBannerHero />;
      case 'Kartu Info': return <TabKartuInfo />;
      case 'Kontak': return <TabKontak />;
      case 'Sosmed': return <TabSosmed />;
      case 'Sambutan': return <TabSambutan />;
      case 'AI Config': return <TabAIConfig />;
      case 'No. Rekening': return <TabRekening />;
      case 'Staf Mengajar': return <TabStafMengajar />;
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
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2.5 text-xs font-black tracking-[0.08em] transition-all duration-300 sm:px-6 sm:py-3 sm:text-sm sm:tracking-wide ${
                  effectiveTab === tab.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.id}
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
