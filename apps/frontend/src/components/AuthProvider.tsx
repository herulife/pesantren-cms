'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearUserMeta, saveUserMeta } from '@/lib/auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (user: UserData) => void;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getHomeRouteByRole(role: string) {
  return role === 'user' ? '/portal' : '/admin';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error("Invalid session");

        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          saveUserMeta({ role: data.user.role, name: data.user.name });
          if (pathname.startsWith('/admin') && data.user.role === 'user') {
            router.replace('/portal');
            return;
          }
          if (pathname.startsWith('/portal') && data.user.role !== 'user') {
            router.replace(getHomeRouteByRole(data.user.role));
            return;
          }
        } else {
          throw new Error("Invalid response");
        }
      } catch {
        clearUserMeta();
        setUser(null);
        if (pathname.startsWith('/admin')) {
          router.push('/login');
        }
        if (pathname.startsWith('/portal')) {
          router.push('/login?from=psb');
        }
      } finally {
        setLoading(false);
      }
    };

    void checkUser();
  }, [pathname, router]);

  const login = (userData: UserData) => {
    saveUserMeta({ role: userData.role, name: userData.name });
    setUser(userData);
    router.push(getHomeRouteByRole(userData.role));
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    clearUserMeta();
    setUser(null);
    router.push('/login');
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin') return true; // superadmin has all access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
