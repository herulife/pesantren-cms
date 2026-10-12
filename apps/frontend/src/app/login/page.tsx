"use client";

import React, { Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { login, googleLogin } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Lock, Mail, ArrowRight, Loader2, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { CredentialResponse, GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const GOOGLE_CLIENT_ID = "mock_client_id";
const GOOGLE_LOGIN_ENABLED = GOOGLE_CLIENT_ID.trim() !== "" && GOOGLE_CLIENT_ID !== "mock_client_id";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();
  const { showToast } = useToast();
  const fromPSB = searchParams.get("from") === "psb";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        showToast("success", "Berhasil login!");
        authLogin(res.user);
      } else {
        showToast("error", "Email atau password salah!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal terhubung ke server.";
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast("error", "Credential Google tidak tersedia");
      return;
    }
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res.success && res.user) {
        showToast("success", "Berhasil login via Google!");
        authLogin(res.user);
      } else {
        showToast("error", "Gagal sinkronisasi akun Google");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem";
      showToast("error", message);
    }
  };

  const formContent = (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/40 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-5">
              <HeartPulse className="text-white" size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {fromPSB ? "Portal Wali Santri" : "Masuk ke Sistem"}
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              {fromPSB ? "Lanjutkan proses pendaftaran santri" : "Silakan masuk dengan akun Anda"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {GOOGLE_LOGIN_ENABLED && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">atau</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => showToast("error", "Login Google dibatalkan")}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link
              href={fromPSB ? "/register?from=psb" : "/register"}
              className="text-sky-600 font-semibold hover:text-sky-700"
            >
              Daftar
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Pondok Pesantren Tahfidzul Qur&apos;an Darussunnah Parung
        </p>
      </motion.div>
    </div>
  );

  if (!GOOGLE_LOGIN_ENABLED) return formContent;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{formContent}</GoogleOAuthProvider>;
}

function LoginLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
        <p className="text-sm text-slate-600">Memuat...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
