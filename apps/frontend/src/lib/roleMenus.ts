// Katalog menu admin + standar hak akses per role.
// SINGLE SOURCE OF TRUTH: dipakai Sidebar (filter menu) dan
// halaman Manajemen Pengguna (checkbox hak akses).
// Semantik: checkbox hanya menyembunyikan menu yang memang boleh
// dilihat role tersebut (subtractive). Backend tetap menegakkan
// RequireRole, jadi UI tidak bisa memberi akses melebihi role.

export interface RoleMenuDef {
  category: string;
  label: string;
  href: string;
  roles?: string[]; // kosong = selalu tampil untuk semua staf
  docRef?: string;
}

export const ROLE_MENU_DEFS: RoleMenuDef[] = [
  { category: 'Dashboard', label: 'Dashboard Utama', href: '/admin', docRef: 'dashboard' },
  { category: 'Data Master', label: 'Data Pegawai', href: '/admin/employees', roles: ['superadmin', 'admin'], docRef: 'teachers' },
  { category: 'Data Master', label: 'Staf Pengajar', href: '/admin/teachers', roles: ['tim_media'], docRef: 'teachers' },
  { category: 'Transaksi', label: 'Pembayaran SPP', href: '/admin/payments', roles: ['bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Program Donasi', href: '/admin/donations', roles: ['bendahara'], docRef: 'donations' },
  { category: 'Akademik', label: 'eRapor', href: '/admin/raport', roles: ['bendahara'], docRef: 'academics' },
  { category: 'Akademik', label: 'Nilai Akademik', href: '/admin/academics', roles: ['bendahara'], docRef: 'academics' },
  { category: 'Akademik', label: 'Project & Kegiatan', href: '/admin/project', roles: ['bendahara'], docRef: 'academics' },
  { category: 'Akademik', label: 'Kedisiplinan', href: '/admin/disciplines', roles: ['panitia_psb'], docRef: 'disciplines' },
  { category: 'Konten & Publikasi', label: 'Program Pondok', href: '/admin/programs', roles: ['tim_media'], docRef: 'programs' },
  { category: 'Konten & Publikasi', label: 'Berita', href: '/admin/news', roles: ['tim_media'], docRef: 'news' },
  { category: 'Konten & Publikasi', label: 'Agenda Kegiatan', href: '/admin/agendas', docRef: 'agendas' },
  { category: 'Konten & Publikasi', label: 'Galeri Foto', href: '/admin/gallery', roles: ['tim_media'], docRef: 'gallery' },
  { category: 'Konten & Publikasi', label: 'Video Kegiatan', href: '/admin/videos', roles: ['tim_media'], docRef: 'videos' },
  { category: 'Layanan', label: 'Fasilitas Publik', href: '/admin/facilities', roles: ['tim_media'], docRef: 'facilities' },
  { category: 'Layanan', label: 'Pesan & Inbox', href: '/admin/messages', roles: ['panitia_psb'], docRef: 'messages' },
  { category: 'Layanan', label: 'Notifikasi WA', href: '/admin/notifications', roles: ['bendahara'], docRef: 'notifications' },
  { category: 'PSB', label: 'Data Santri (PSB)', href: '/admin/psb', roles: ['panitia_psb'], docRef: 'psb' },
  { category: 'PSB', label: 'Data Santri Aktif', href: '/admin/kesantrian', roles: ['superadmin', 'panitia_psb'], docRef: 'academics' },
  { category: 'PSB', label: 'Pengaturan PSB', href: '/admin/psb/pengaturan', roles: ['superadmin'], docRef: 'psb' },
  { category: 'Sistem', label: 'Manajemen Pengguna', href: '/admin/users', roles: ['superadmin'], docRef: 'users' },
  { category: 'Sistem', label: 'Log Sistem', href: '/admin/logs', roles: ['superadmin'], docRef: 'logs' },
  { category: 'Sistem', label: 'Pengaturan Utama', href: '/admin/settings', roles: ['superadmin'], docRef: 'settings' },
  { category: 'Sistem', label: 'Mode Classic', href: '/admin-bs', docRef: 'dashboard' },
  { category: 'Sistem', label: 'Tutorial', href: '/admin/help' },
];

export const MANAGEABLE_ROLES = ['bendahara', 'panitia_psb', 'tim_media'] as const;

// Standar: semua menu yang boleh dilihat role tersebut.
// superadmin = semua; user (portal) = tidak ada menu admin.
export function standardMenusForRole(role: string): string[] {
  if (role === 'superadmin') return ROLE_MENU_DEFS.map((m) => m.href);
  if (role === 'user') return [];
  return ROLE_MENU_DEFS.filter((m) => !m.roles || m.roles.includes(role)).map((m) => m.href);
}

// Standar lengkap untuk semua role — dipakai Reset Default & seeding DB.
export function standardRolePermissions(): Record<string, string[]> {
  const perms: Record<string, string[]> = {};
  ['superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'user'].forEach((r) => {
    perms[r] = standardMenusForRole(r);
  });
  return perms;
}
