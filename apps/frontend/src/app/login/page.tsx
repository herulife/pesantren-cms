'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { login, googleLogin } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Lock, Mail, ArrowRight, ShieldCheck, Server, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { CredentialResponse, GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Placeholder client ID (User will need to change this in production)
const GOOGLE_CLIENT_ID = "mock_client_id";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();
  const { showToast } = useToast();
  const fromPSB = searchParams.get('from') === 'psb';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        showToast('success', 'Berhasil login!');
        authLogin(res.user);
      } else {
        showToast('error', 'Email atau password salah!');
      }
    } catch {
      showToast('error', 'Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast('error', 'Credential Google tidak tersedia');
      return;
    }

    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.success && res.user) {
        showToast('success', 'Berhasil login via Google!');
        authLogin(res.user);
      } else {
        showToast('error', 'Gagal sinkronisasi akun Google');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-outfit relative overflow-hidden py-10 px-4">
        {/* Decorative Orbs matching HOMEPAGE */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5 }}
          className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-emerald-200/40 rounded-full blur-[100px] lg:blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute bottom-0 left-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-teal-200/40 rounded-full blur-[100px] lg:blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" 
        />

        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1100px] bg-white/70 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3.5rem] border border-white shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col md:flex-row relative z-10"
        >
          {/* Left Side: Form */}
          <div className="w-full md:w-[55%] p-8 sm:p-12 lg:p-20 flex flex-col justify-center">
            <div className="mb-8 text-center md:text-left">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-emerald-500/30 mb-6 mx-auto md:mx-0">D</div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {fromPSB ? 'Masuk ke Portal Wali Santri' : 'Selamat Datang'}
              </h1>
              <p className="text-slate-500 font-medium text-sm sm:text-base">
                {fromPSB ? 'Gunakan akun wali/calon santri untuk melanjutkan biodata dan dokumen pendaftaran.' : 'Masuk ke Portal Manajemen Darussunnah.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-2">
                  <Mail size={14} className="text-emerald-500" /> Alamat Email
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-4 sm:py-5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium outline-none shadow-inner"
                  placeholder="admin@darussunnah.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-2">
                  <Lock size={14} className="text-emerald-500" /> Kata Sandi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-4 sm:py-5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-medium outline-none shadow-inner"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/25 active:translate-y-0 transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 mt-8 group"
              >
                {isLoading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
            
            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center w-full mb-6">
                <div className="flex-1 h-px bg-slate-200"></div>
                <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Atau masuk dengan</div>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              
              <div className="w-full flex justify-center scale-105">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => showToast('error', 'Login Google dibatalkan')}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>

            <div className="mt-8 text-center text-slate-500 font-medium">
               Belum punya akun? <Link href={fromPSB ? "/register?from=psb" : "/register"} className="text-emerald-600 font-bold hover:underline">Daftar sekarang</Link>
            </div>

          </div>

          {/* Right Side: Imagery / Aesthetic */}
          <div className="hidden md:flex w-[45%] bg-emerald-50/50 relative flex-col items-center justify-center p-12 overflow-hidden border-l border-white">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 mix-blend-multiply" />
             <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
             
             <div className="relative z-10 w-full flex flex-col items-center">
                {/* Floating Cards Graphic */}
                <div className="relative mb-14 w-full h-48 flex justify-center items-center">
                   <motion.div 
                     animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] border border-white z-20 flex flex-col items-center transform -rotate-6 -translate-x-12"
                   >
                      <Server className="text-emerald-500 mb-2" size={32} />
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cloud Infra</div>
                   </motion.div>

                   <motion.div 
                     animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] border border-white z-30 flex flex-col items-center"
                   >
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                         <ShieldCheck className="text-emerald-600" size={24} />
                      </div>
                      <div className="text-xs font-black text-emerald-900 uppercase tracking-widest">Admin Pondok</div>
                   </motion.div>

                   <motion.div 
                     animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] border border-white z-10 flex flex-col items-center transform rotate-6 translate-x-14 translate-y-6"
                   >
                      <Globe className="text-emerald-500 mb-2" size={28} />
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Public Web</div>
                   </motion.div>
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-snug text-center">Sistem Informasi<br/><span className="text-emerald-600">Terpadu Darussunnah</span></h2>
                <p className="text-slate-500 mt-5 max-w-[280px] text-center text-sm leading-relaxed font-medium">
                  {fromPSB
                    ? 'Setelah masuk, kamu bisa melengkapi biodata, unggah berkas, dan memantau status verifikasi PSB.'
                    : 'Platform ekosistem modern manajemen digital pendidikan, mencakup CMS, PPDB, dan Donasi.'}
                </p>
             </div>
          </div>

        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}
