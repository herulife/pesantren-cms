'use client';

// Tab Pengaturan Utama — Staf Mengajar (jilid 8).
// Memakai ulang komponen manajemen pengajar yang sama (single source),
// sehingga tidak ada duplikasi CRUD.

import { TeachersManager } from '../../teachers/page';

export default function TabStafMengajar() {
  return <TeachersManager />;
}
