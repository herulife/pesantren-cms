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
  panel?: string; // id panel di ROLE_MENU_PANELS — dirender sebagai blok
  // navigasi terpisah di Sidebar, bukan sebagai kategori biasa
}

// Panel Sidebar: blok menu sendiri (mirip grup navigasi Mode Classic yang dulu
// ada di /admin-bs) untuk menu yang dipindah dari Mode Classic ke Mode Glass,
// supaya tidak tercecer di antara kategori utama.
export const ROLE_MENU_PANELS: { id: string; label: string; hint: string }[] = [
  { id: 'administrasi', label: 'Administrasi', hint: 'Tagihan, kasir & laporan keuangan' },
];

export const ROLE_MENU_DEFS: RoleMenuDef[] = [
  { category: 'Dashboard', label: 'Dashboard Utama', href: '/admin', docRef: 'dashboard' },
  { category: 'Sistem', label: 'Data Pegawai', href: '/admin/employees', roles: ['superadmin', 'bendahara'], docRef: 'teachers' },
  { category: 'Sistem', label: 'Kelas & Tahun Ajaran', href: '/admin/school', roles: ['superadmin', 'bendahara', 'panitia_psb'], docRef: 'santri-data' },
  { category: 'Sistem', label: 'Absensi & Rekap Guru', href: '/admin/teachers/report', roles: ['superadmin', 'bendahara'], docRef: 'teachers' },
  { category: 'Konten & Publikasi', label: 'Data Pengajar', href: '/admin/teachers', roles: ['superadmin', 'tim_media'], docRef: 'teachers' },
  { category: 'Transaksi', label: 'Pembayaran SPP', href: '/admin/payments', roles: ['bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Tagihan SPP', href: '/admin/spp', panel: 'administrasi', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Tagihan Iuran', href: '/admin/iuran', panel: 'administrasi', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Kasir Pembayaran', href: '/admin/kasir', panel: 'administrasi', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Kas & Laba Rugi', href: '/admin/kas', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Transaksi', label: 'Program Donasi', href: '/admin/donations', roles: ['bendahara'], docRef: 'donations' },
  { category: 'Laporan', label: 'Laporan Tagihan', href: '/admin/laporan/tagihan', panel: 'administrasi', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Laporan', label: 'Laporan Transaksi', href: '/admin/laporan/transaksi', panel: 'administrasi', roles: ['superadmin', 'bendahara'], docRef: 'payments' },
  { category: 'Akademik', label: 'eRapor', href: '/admin/raport', roles: ['superadmin', 'admin', 'pimpinan', 'wali_kelas'], docRef: 'academics' },
  { category: 'Akademik', label: 'Nilai Akademik', href: '/admin/academics', roles: ['superadmin', 'admin', 'pimpinan', 'wali_kelas', 'guru', 'ustadz'], docRef: 'academics' },
  { category: 'Akademik', label: 'Project & Kegiatan', href: '/admin/project', roles: ['superadmin', 'admin', 'pimpinan', 'wali_kelas'], docRef: 'academics' },
  { category: 'Akademik', label: 'Kedisiplinan', href: '/admin/disciplines', roles: ['panitia_psb'], docRef: 'disciplines' },
  { category: 'Konten & Publikasi', label: 'Program Pondok', href: '/admin/programs', roles: ['tim_media'], docRef: 'programs' },
  { category: 'Konten & Publikasi', label: 'Berita', href: '/admin/news', roles: ['tim_media'], docRef: 'news' },
  { category: 'Konten & Publikasi', label: 'Agenda Kegiatan', href: '/admin/agendas', roles: ['superadmin', 'tim_media'], docRef: 'agendas' },
  { category: 'Konten & Publikasi', label: 'FAQ', href: '/admin/faqs', roles: ['superadmin', 'tim_media'], docRef: 'faqs' },
  { category: 'Konten & Publikasi', label: 'Galeri Foto', href: '/admin/gallery', roles: ['tim_media'], docRef: 'gallery' },
  { category: 'Konten & Publikasi', label: 'Video Kegiatan', href: '/admin/videos', roles: ['tim_media'], docRef: 'videos' },
  { category: 'Layanan', label: 'Fasilitas Publik', href: '/admin/facilities', roles: ['tim_media'], docRef: 'facilities' },
  { category: 'Layanan', label: 'Pesan & Inbox', href: '/admin/messages', roles: ['panitia_psb'], docRef: 'messages' },
  { category: 'Layanan', label: 'WhatsApp Gateway', href: '/admin/notifications', roles: ['superadmin', 'bendahara'], docRef: 'notifications' },
  { category: 'PSB', label: 'Data Santri (PSB)', href: '/admin/psb', roles: ['panitia_psb'], docRef: 'psb' },
  { category: 'PSB', label: 'Data Santri Aktif', href: '/admin/kesantrian', roles: ['superadmin', 'admin', 'panitia_psb', 'pimpinan', 'wali_kelas'], docRef: 'santri-data' },
  { category: 'PSB', label: 'Pengaturan PSB', href: '/admin/psb/pengaturan', roles: ['superadmin'], docRef: 'psb' },
  { category: 'Sistem', label: 'Manajemen Pengguna', href: '/admin/users', roles: ['superadmin', 'bendahara'], docRef: 'users' },
  { category: 'Sistem', label: 'Log Sistem', href: '/admin/logs', roles: ['superadmin'], docRef: 'logs' },
  { category: 'Sistem', label: 'Pengaturan Utama', href: '/admin/settings', roles: ['superadmin'], docRef: 'settings' },
  { category: 'Sistem', label: 'Tutorial', href: '/admin/help' },
];

export const MANAGEABLE_ROLES = ['bendahara', 'panitia_psb', 'tim_media', 'pimpinan', 'wali_kelas', 'guru', 'ustadz'] as const;

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
  ['superadmin', 'bendahara', 'panitia_psb', 'tim_media', 'user', 'pimpinan', 'wali_kelas', 'guru', 'ustadz'].forEach((r) => {
    perms[r] = standardMenusForRole(r);
  });
  return perms;
}
