import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Image runtime hanya berisi server.js + dependensi yang benar-benar dipakai,
  // bukan seluruh source dan node_modules. Tanpa ini image jadi ~2.7GB dan
  // langkah `chown -R` di Dockerfile membuat build berjalan belasan menit.
  output: 'standalone',
  async redirects() {
    return [
      {
        // Pendaftaran mandiri dimatikan di backend: route POST /api/register
        // sudah di-comment, dan hanya superadmin yang boleh membuat user lewat
        // POST /api/users. Jadi form pendaftaran lama selalu gagal.
        //
        // Halaman /register sudah dihapus, jadi tanpa aturan ini URL-nya jadi 404
        // dan tautan lama di backlink ikut mati. 308 dipilih supaya mesin pencari
        // berhenti menghitungnya sebagai URL terpisah dan memakai ulang nilainya
        // untuk /login.
        //
        // Catatan: Next hanya menerima 301/302/303/307/308 di sini. Kalau 410
        // Gone lebih diinginkan secara HTTP, aturan ini sebaiknya dipindah ke
        // layer nginx yang sudah aktif di depan aplikasi.
        source: '/register',
        destination: '/login?from=psb',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8080/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;