"use client";

import React, { Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { login, googleLogin } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {fromPSB ? "Masuk ke Portal Wali Santri" : "Selamat Datang"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-sky-600 text-white rounded-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
            {isLoading ? "MEMPROSES..." : "MASUK"}
          </button>
        </form>
      </div>
    </div>
  );

  if (!GOOGLE_LOGIN_ENABLED) return formContent;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{formContent}</GoogleOAuthProvider>;
}

function LoginLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
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
