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
    summary: 'Halaman pertama setelah masuk. Menunjukkan pendaftaran sudah sampai mana dan apa yang masih kurang.',
    quickActions: [
      'Lihat status pendaftaran: kurang apa, sudah beres apa.',
      'Klik tombol yang disarankan untuk melengkapi yang kurang.',
      'Lihat ringkasan data anak dan dokumen yang sudah masuk.',
    ],
    workflows: [
      {
        title: 'Cara tahu pendaftaran kurang apa',
        steps: [
          'Masuk ke portal, lihat halaman depannya.',
          'Baca status dan daftar yang masih kurang (biasanya ada tandanya).',
          'Klik tombolnya untuk langsung ke halaman yang harus dilengkapi.',
        ],
      },
    ],
    tips: [
      'Kalau status belum berubah setelah melengkapi, tunggu sebentar lalu muat ulang halamannya.',
      'Ikuti saja tombol yang disarankan, urutannya sudah benar.',
    ],
  },
  {
    id: 'biodata',
    title: 'Isi Biodata Anak & Wali',
    href: '/portal/biodata',
    summary: 'Formulir data diri anak dan orang tua. Ini wajib diisi dulu sebelum bisa upload dokumen.',
    quickActions: [
      'Isi data anak: nama, NIK, alamat, program yang dipilih.',
      'Isi data ayah dan ibu/wali.',
      'Tekan Simpan setiap selesai mengisi.',
    ],
    workflows: [
      {
        title: 'Cara mengisi biodata',
        steps: [
          'Buka halaman Biodata.',
          'Isi semua kolom yang ada tanda bintangnya (wajib).',
          'Samakan dengan dokumen asli (KK/KTP). Jangan dikira-kira.',
          'Tekan tombol Simpan. Pastikan muncul pesan berhasil.',
        ],
      },
    ],
    tips: [
      'NIK ada 16 angka, ada di KK. Salah 1 angka bisa ditolak panitia.',
      'Kalau salah isi, betulkan dulu baru upload dokumen.',
    ],
  },
  {
    id: 'documents',
    title: 'Upload Dokumen (KK, Raport, Foto)',
    href: '/portal/documents',
    summary: 'Tempat mengunggah foto dokumen: KK, raport/ijazah, dan pas foto anak.',
    quickActions: [
      'Foto/scan KK, raport/ijazah, dan pas foto anak.',
      'Upload satu-satu di kolomnya masing-masing.',
      'Tekan Simpan & Lanjutkan kalau semuanya sudah terunggah.',
    ],
    workflows: [
      {
        title: 'Cara upload dokumen',
        steps: [
          'Siapkan dulu fotonya. Foto dokumen di tempat terang, lurus, semua tulisan terbaca.',
          'Di tiap jenis dokumen, klik tombol Upload/Pilih Foto, pilih file dari HP.',
          'Foto maksimal 5MB. Kalau gagal, kecilkan dulu fotonya.',
          'Tunggu sampai ada tanda berhasil di tiap dokumen.',
          'Kalau semua sudah beres, tekan Simpan & Lanjutkan.',
        ],
      },
    ],
    tips: [
      'Foto buram = ditolak panitia = kerja dua kali. Foto yang jelas sekalian.',
      'Format yang bisa: JPG, PNG. Foto iPhone (HEIC) tidak bisa, ubah dulu ke JPG.',
      'Jangan keluar halaman sebelum ada tanda berhasil.',
    ],
  },
  {
    id: 'payment',
    title: 'Bayar Pendaftaran & Upload Bukti',
    href: '/portal/payment',
    summary: 'Transfer biaya pendaftaran ke rekening pondok, lalu unggah buktinya di sini. Panitia akan memverifikasi.',
    quickActions: [
      'Salin nomor rekening dan nominal yang harus ditransfer.',
      'Isi nominal transfer dan tanggal bayar sesuai bukti.',
      'Unggah foto bukti transfer lalu tekan Kirim Bukti Pembayaran.',
      'Pantau status: Menunggu Verifikasi → Lunas.',
    ],
    workflows: [
      {
        title: 'Cara membayar pendaftaran',
        steps: [
          'Buka halaman Bayar Pendaftaran.',
          'Lihat rekening tujuan (bank, nomor, atas nama) dan nominal diharapkan.',
          'Transfer dari m-banking / ATM / e-banking sesuai nominal.',
          'Kembali ke halaman bayar, isi nominal dan tanggal transfer.',
          'Klik Pilih Bukti, lalu pilih foto bukti transfer.',
          'Tekan Kirim Bukti Pembayaran. Status berubah menjadi Menunggu Verifikasi.',
          'Cek status di halaman ini, biasanya diverifikasi dalam 1-2 hari kerja.',
        ],
      },
    ],
    tips: [
      'Isi nominal sesuai bukti transfer. Salah nominal bisa membuat verifikasi ditolak.',
      'Jangan kirim ulang / upload ganda saat status masih Menunggu Verifikasi.',
      'Kalau bukti ditolak, baca Catatan Panitia lalu upload ulang bukti yang benar.',
      'Butuh bantuan? Gunakan tombol Chat Panitia PSB di halaman pembayaran.',
    ],
  },
  {
    id: 'academics',
    title: 'Lihat Nilai & Raport Anak',
    href: '/portal/raport',
    summary: 'Tempat wali melihat nilai, absen, dan hafalan anak. Datanya diisi guru/admin, wali tinggal melihat.',
    quickActions: [
      'Lihat nilai tiap mata pelajaran.',
      'Lihat rekap absen: hadir, izin, sakit, alpha.',
      'Lihat progres hafalan anak.',
      'Cetak/simpan raport kalau perlu arsip.',
    ],
    workflows: [
      {
        title: 'Cara melihat raport anak',
        steps: [
          'Klik menu Raport di sebelah kiri.',
          'Lihat ringkasan nilai dan tabel pelajarannya.',
          'Scroll untuk melihat absen dan hafalan.',
          'Kalau mau arsip, klik tombol Cetak lalu simpan sebagai PDF.',
        ],
      },
    ],
    tips: [
      'Nilai belum muncul? Berarti guru belum selesai mengisi. Tunggu 1-2 hari.',
      'Kalau ada nilai yang janggal, hubungi admin pondok (jangan diubah sendiri, memang tidak bisa).',
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
