'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSantriList, getSppSummary, getKasSummary, getCampaigns } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { fmtRp, BsTitle } from './ui';

function nowPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BsDashboard() {
  const { user } = useAuth();
  const role = user?.role || '';
  const [santri, setSantri] = useState(0);
  const [tagihan, setTagihan] = useState(0);
  const [kas, setKas] = useState(0);
  const [campaigns, setCampaigns] = useState(0);

  useEffect(() => {
    if (role === 'superadmin' || role === 'panitia_psb') {
      getSantriList({ limit: 1 }).then((r) => setSantri(r.total)).catch(() => {});
    }
    if (role === 'superadmin' || role === 'bendahara') {
      getSppSummary(nowPeriod()).then((s) => setTagihan(s?.outstanding || 0)).catch(() => {});
      getKasSummary().then((s) => setKas(s?.balance || 0)).catch(() => {});
    }
    getCampaigns().then((c) => setCampaigns(Array.isArray(c) ? c.length : 0)).catch(() => {});
  }, [role]);

  const boxes = [
    ...(role === 'superadmin' || role === 'panitia_psb'
      ? [{ label: 'Santri', value: String(santri), color: 'bg-info', icon: 'bi-people', href: '/admin-bs/siswa' }]
      : []),
    ...(role === 'superadmin' || role === 'bendahara'
      ? [
          { label: 'Tunggakan Bulan Ini', value: fmtRp(tagihan), color: 'bg-warning', icon: 'bi-receipt', href: '/admin-bs/lap-tagihan' },
          { label: 'Saldo Kas', value: fmtRp(kas), color: 'bg-success', icon: 'bi-wallet2', href: '/admin-bs/kas' },
        ]
      : []),
    { label: 'Campaign Donasi', value: String(campaigns), color: 'bg-danger', icon: 'bi-gift', href: '/admin-bs/donasi' },
  ];

  return (
    <div>
      <BsTitle>Dashboard</BsTitle>
      <div className="row">
        {boxes.map((b) => (
          <div className="col-lg-3 col-6" key={b.label}>
            <div className={`small-box ${b.color}`}>
              <div className="inner">
                <h3>{b.value}</h3>
                <p>{b.label}</p>
              </div>
              <div className="icon">
                <i className={`bi ${b.icon}`} />
              </div>
              <Link href={b.href} className="small-box-footer">
                Selengkapnya <i className="bi bi-arrow-right-circle" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
