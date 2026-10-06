'use client';

import { Moon, Sun, BookOpen, Coffee, School, BookText, Dumbbell, BookCopy, Bed } from 'lucide-react';

const schedule = [
  { time: '03.30', label: 'Qiyamul Lail', icon: Moon },
  { time: '04.30', label: 'Shalat Subuh', icon: Sun },
  { time: '05.00', label: 'Tahfidz Quran', icon: BookOpen },
  { time: '07.00', label: 'Sarapan', icon: Coffee },
  { time: '08.00', label: 'Pembelajaran', icon: School },
  { time: '13.00', label: 'Kajian Diniyah', icon: BookText },
  { time: '16.00', label: 'Olahraga', icon: Dumbbell },
  { time: '19.00', label: 'Murojaah', icon: BookCopy },
  { time: '21.00', label: 'Istirahat', icon: Bed },
];

export default function TimelineSantri() {
  return (
    <div className="relative">
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 -translate-x-1/2" />
      <div className="lg:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-primary/20" />
      <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
        {schedule.map((item, i) => {
          const Icon = item.icon;
          const isLeft = i % 2 === 0;
          return (
            <div key={item.time} className={`relative lg:col-span-1 ${i >= 6 ? 'lg:col-start-2' : ''}`}>
              <div className="lg:hidden flex items-start gap-4">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shrink-0">
                  <Icon size={18} />
                </div>
                <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm flex-1">
                  <span className="text-xs font-bold text-primary">{item.time}</span>
                  <p className="mt-1 font-bold text-foreground">{item.label}</p>
                </div>
              </div>
              <div className={`hidden lg:flex items-center gap-4 ${isLeft ? 'flex-row-reverse text-right' : ''}`}>
                <div className={`flex-1 ${isLeft ? 'pr-8' : 'pl-8'}`}>
                  <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm">
                    <span className="text-xs font-bold text-primary">{item.time}</span>
                    <p className="mt-1 font-bold text-foreground">{item.label}</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
