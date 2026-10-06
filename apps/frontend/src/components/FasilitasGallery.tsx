'use client';

import { motion } from 'framer-motion';
import {
  BedDouble,
  BookOpen,
  Building2,
  Dumbbell,
  FlaskConical,
  Landmark,
  Mic2,
  School,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Stethoscope,
  Trees,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { Facility } from '@/lib/api';

interface Props {
  facilities: Facility[];
}

function facilityIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  const has = (keys: string[]) => keys.some((k) => n.includes(k));

  if (has(['masjid', 'musholla', 'mushola'])) return Landmark;
  if (has(['asrama', 'kamar', 'hunian', 'pondok'])) return BedDouble;
  if (has(['perpus'])) return BookOpen;
  if (has(['lab'])) return FlaskConical;
  if (has(['lapangan', 'olahraga', 'gym', 'futsal', 'basket'])) return Dumbbell;
  if (has(['kantin', 'dapur', 'restoran'])) return UtensilsCrossed;
  if (has(['laundry'])) return Shirt;
  if (has(['klinik', 'kesehatan', 'dokter', 'ukm'])) return Stethoscope;
  if (has(['cctv', 'keamanan', 'security'])) return ShieldCheck;
  if (has(['kelas', 'sekolah', 'belajar', 'ruang'])) return School;
  if (has(['taman', 'hijau', 'lingkungan'])) return Trees;
  if (has(['wifi', 'internet', 'jaringan'])) return Wifi;
  if (has(['aula', 'teater', 'panggung', 'auditorium'])) return Mic2;
  if (has(['koperasi', 'toko', 'warung'])) return ShoppingBag;
  return Building2;
}

export default function FasilitasGallery({ facilities }: Props) {
  const items: Array<{ name: string; category: string }> = facilities.length
    ? facilities.map((f) => ({ name: f.name, category: f.category }))
    : [
        { name: 'Masjid', category: 'Ibadah' },
        { name: 'Asrama Putra', category: 'Hunian' },
        { name: 'Asrama Putri', category: 'Hunian' },
        { name: 'Perpustakaan', category: 'Akademik' },
        { name: 'Laboratorium', category: 'Akademik' },
        { name: 'Lapangan', category: 'Olahraga' },
        { name: 'Kantin', category: 'Fasilitas' },
        { name: 'Laundry', category: 'Fasilitas' },
        { name: 'Klinik', category: 'Kesehatan' },
        { name: 'CCTV 24 Jam', category: 'Keamanan' },
      ];

  return (
    <div>
      <div
        style={{ scrollbarWidth: 'none' }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((f, i) => {
          const Icon = facilityIcon(f.name);
          return (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="group flex w-40 shrink-0 snap-start items-center gap-3 rounded-2xl border border-surface-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{f.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{f.category}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}