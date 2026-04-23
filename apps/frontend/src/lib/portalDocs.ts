export interface PortalDocSection {
  id: string;
  title: string;
  href: string;
  summary: string;
  quickActions: string[];
  workflows: Array<{
    title: string;
    steps: string[];
  }>;
  tips: string[];
}

export const portalDocSections: PortalDocSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Portal',
    href: '/portal',
    summary: 'Ringkasan status pendaftaran, progres kelengkapan, dan arahan langkah berikutnya.',
    quickActions: [
      'Lihat status pendaftaran dan progres kelengkapan data.',
      'Ikuti arahan tombol cepat untuk melengkapi biodata atau dokumen.',
      'Cek ringkasan biodata dan dokumen terakhir.',
    ],
    workflows: [
      {
        title: 'Memantau progres pendaftaran',
        steps: [
          'Masuk ke dashboard portal.',
          'Perhatikan status utama dan daftar yang masih kurang.',
          'Klik tombol tindakan cepat untuk melengkapi kekurangan.',
        ],
      },
    ],
    tips: [
      'Jika status masih pending, pastikan biodata dan dokumen sudah lengkap.',
      'Gunakan ringkasan data untuk memastikan tidak ada berkas yang tertinggal.',
    ],
  },
  {
    id: 'biodata',
    title: 'Biodata Pendaftar',
    href: '/portal/biodata',
    summary: 'Form utama untuk mengisi data calon santri dan wali. Wajib diisi sebelum unggah dokumen.',
    quickActions: [
      'Lengkapi data pribadi calon santri dan wali.',
      'Pastikan NIK, alamat, dan program pilihan sudah terisi.',
      'Simpan perubahan setiap selesai mengisi.',
    ],
    workflows: [
      {
        title: 'Mengisi biodata',
        steps: [
          'Buka halaman biodata dan isi seluruh field wajib.',
          'Periksa kembali data yang sudah diisi.',
          'Simpan biodata agar status kelengkapan diperbarui.',
        ],
      },
    ],
    tips: [
      'Gunakan data resmi sesuai dokumen agar tidak terjadi mismatch saat verifikasi.',
      'Jika ada kesalahan, perbaiki sebelum mengunggah dokumen.',
    ],
  },
  {
    id: 'documents',
    title: 'Unggah Dokumen',
    href: '/portal/documents',
    summary: 'Unggah dokumen pendukung seperti KK, raport/ijazah, dan pas foto.',
    quickActions: [
      'Unggah KK, raport/ijazah, dan pas foto dengan file yang jelas.',
      'Perhatikan status unggah per dokumen.',
      'Gunakan tombol Simpan & Lanjutkan setelah semua dokumen lengkap.',
    ],
    workflows: [
      {
        title: 'Mengunggah dokumen',
        steps: [
          'Klik unggah pada setiap jenis dokumen.',
          'Tunggu hingga status berubah menjadi tersimpan.',
          'Periksa ringkasan progres di bagian bawah halaman.',
        ],
      },
    ],
    tips: [
      'Gunakan hasil scan berwarna agar dokumen terbaca jelas.',
      'Jika status upload bermasalah, ulangi unggah dengan file yang lebih kecil.',
    ],
  },
  {
    id: 'academics',
    title: 'Raport Akademik',
    href: '/portal/raport',
    summary: 'Pantau nilai, kehadiran, dan progres tahfidz santri dari portal wali santri.',
    quickActions: [
      'Lihat ringkasan nilai akhir dan jumlah mata pelajaran yang sudah dinilai.',
      'Periksa rekap kehadiran seperti hadir, izin, sakit, dan alpha.',
      'Gunakan tombol cetak jika ingin menyimpan atau mencetak raport akademik.',
    ],
    workflows: [
      {
        title: 'Memantau raport akademik',
        steps: [
          'Buka menu Raport Akademik dari sidebar portal.',
          'Periksa ringkasan nilai, tabel mata pelajaran, dan progres tahfidz.',
          'Gunakan tombol Cetak Raport jika ingin membuat salinan untuk arsip wali santri.',
        ],
      },
    ],
    tips: [
      'Jika data nilai belum muncul, tunggu hingga admin atau guru selesai menginput raport.',
      'Gunakan halaman ini sebagai ringkasan pemantauan, lalu hubungi pondok bila ada data yang terasa janggal.',
    ],
  },
];

export function getPortalDocById(id: string | null | undefined) {
  if (!id) {
    return portalDocSections[0];
  }

  return (
    portalDocSections.find((section) => section.id === id || section.href === id) ||
    portalDocSections.find((section) => id.includes(section.id) || id.includes(section.href.replace('/portal/', ''))) ||
    portalDocSections[0]
  );
}
