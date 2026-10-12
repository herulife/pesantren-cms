import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
        Halaman tidak ketemu
      </p>
      <h1 className="mt-5 text-6xl font-black tracking-tight text-slate-900">404</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
        Alamat yang dibuka salah atau halamannya sudah dipindah. Coba kembali ke halaman depan
        atau hubungi admin kalau Anda yakin alamatnya benar.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
          Ke Beranda
        </Link>
        <Link href="/kontak" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-emerald-300">
          Hubungi Admin
        </Link>
      </div>
    </div>
  );
}
