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
    title: 'Halaman Depan Portal',
    href: '/portal',
    summary: 'Lihat pendaftaran sudah sampai mana dan apa yang kurang.',
    quickActions: [
      'Lihat status pendaftaran.',
      'Klik tombol yang disarankan.',
      'Lihat data anak dan dokumen.',
    ],
    workflows: [
      {
        title: 'Cek yang kurang',
        steps: [
          'Buka portal, baca status di halaman depan.',
          'Klik tombol yang muncul untuk melengkapi.',
        ],
      },
    ],
    tips: [
      'Status belum berubah? Tunggu sebentar, lalu muat ulang.',
      'Ikuti saja tombol yang disarankan.',
    ],
  },
  {
    id: 'biodata',
    title: 'Isi Biodata Anak & Wali',
    href: '/portal/biodata',
    summary: 'Isi data anak dan orang tua dulu sebelum upload dokumen.',
    quickActions: [
      'Isi data anak.',
      'Isi data ayah dan ibu/wali.',
      'Tekan Simpan.',
    ],
    workflows: [
      {
        title: 'Isi biodata',
        steps: [
          'Buka halaman Biodata.',
          'Isi semua kolom berbintang, samakan dengan KK/KTP.',
          'Tekan Simpan sampai muncul pesan berhasil.',
        ],
      },
    ],
    tips: [
      'NIK 16 angka ada di KK. Salah 1 angka bisa ditolak.',
      'Salah isi? Betulkan dulu, baru upload dokumen.',
    ],
  },
  {
    id: 'documents',
    title: 'Upload Dokumen (KK, Raport, Foto)',
    href: '/portal/documents',
    summary: 'Unggah foto KK, raport/ijazah, dan pas foto anak.',
    quickActions: [
      'Siapkan foto KK, raport/ijazah, pas foto.',
      'Upload di kolomnya masing-masing.',
      'Tekan Simpan & Lanjutkan.',
    ],
    workflows: [
      {
        title: 'Upload dokumen',
        steps: [
          'Foto dokumen di tempat terang, lurus, tulisan terbaca.',
          'Klik Upload di tiap jenis dokumen, pilih file (maks 5MB).',
          'Tunggu tanda berhasil, lalu tekan Simpan & Lanjutkan.',
        ],
      },
    ],
    tips: [
      'Foto buram = ditolak = kerja dua kali.',
      'Foto iPhone (HEIC) tidak bisa, ubah ke JPG dulu.',
    ],
  },
  {
    id: 'academics',
    title: 'Lihat Nilai & Raport Anak',
    href: '/portal/raport',
    summary: 'Lihat nilai, absen, dan hafalan anak. Datanya diisi guru.',
    quickActions: [
      'Lihat nilai tiap pelajaran.',
      'Lihat rekap absen dan hafalan.',
      'Cetak raport bila perlu.',
    ],
    workflows: [
      {
        title: 'Lihat raport',
        steps: [
          'Klik menu Raport.',
          'Baca ringkasan nilai dan tabelnya.',
          'Untuk arsip: klik Cetak, simpan sebagai PDF.',
        ],
      },
    ],
    tips: [
      'Nilai belum muncul? Guru belum selesai mengisi, tunggu 1-2 hari.',
      'Nilai janggal? Hubungi admin, jangan diubah sendiri.',
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
