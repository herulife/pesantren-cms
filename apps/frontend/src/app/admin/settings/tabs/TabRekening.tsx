'use client';

import React, { useState } from 'react';
import { Banknote, GraduationCap, Wallet } from 'lucide-react';
import TabPembayaranPSB from './TabPembayaranPSB';
import TabRekeningSPP from './TabRekeningSPP';

const SUB_TABS = [
  { key: 'PSB', label: 'PSB', icon: GraduationCap },
  { key: 'SPP', label: 'SPP', icon: Wallet },
] as const;

export default function TabRekening() {
  const [active, setActive] = useState<string>('PSB');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Banknote size={22} />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-black uppercase tracking-tight text-slate-900">Pengaturan No. Rekening</h2>
          <p className="text-sm font-medium text-slate-500">Kelola rekening tujuan transfer PSB, dan SPP dalam satu tempat.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/70 p-2 whitespace-nowrap">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black tracking-[0.08em] transition-all sm:px-6 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in transition-all">
        {active === 'PSB' ? <TabPembayaranPSB /> : null}
        {active === 'SPP' ? <TabRekeningSPP /> : null}
      </div>
    </div>
  );
}
