'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserRole, deleteUser } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { 
  Shield, 
  Users, 
  Search, 
  ChevronDown,
  UserCog,
  Crown,
  Wallet,
  GraduationCap,
  Camera,
  User,
  AlertCircle,
  Clock,
  Trash2,
  X,
  UserCheck
} from 'lucide-react';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_login_at?: string | null;
}

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  { value: 'bendahara', label: 'Bendahara', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  { value: 'panitia_psb', label: 'Panitia PSB', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  { value: 'tim_media', label: 'Tim Media', icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200' },
  { value: 'user', label: 'User Biasa', icon: User, color: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-200' },
];

function getRoleConfig(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[ROLE_OPTIONS.length - 1];
}

function getUsageStatus(user: UserRow, currentUserId?: number | null) {
  if (user.id === currentUserId) {
    return {
      label: 'Sedang Dipakai',
      tone: 'text-emerald-700 bg-emerald-50',
      detail: 'Akun yang sedang aktif digunakan sekarang.',
    };
  }

  if (user.last_login_at) {
    return {
      label: 'Sudah Pernah Dipakai',
      tone: 'text-emerald-600 bg-emerald-50',
      detail: 'Akun ini pernah dipakai masuk ke sistem.',
    };
  }

  return {
    label: 'Belum Pernah Dipakai',
    tone: 'text-amber-700 bg-amber-50',
    detail: 'Akun sudah dibuat, tetapi belum pernah login.',
  };
}

export default function UsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchUsers = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    try {
      const data = await getUsers(search);
      setUsers(data);
    } catch {
      showToast('error', 'Gagal memuat data pengguna.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(selectedId);
      if (res.success) {
        showToast('success', 'Pengguna berhasil dihapus permanen.');
        fetchUsers();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus pengguna.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (userId === currentUser?.id) {
      showToast('error', 'Keamanan Sistem: Tidak diizinkan merubah otoritas diri sendiri.');
      return;
    }

    setUpdating(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        showToast('success', `Otoritas User berhasil dialihkan ke ${getRoleConfig(newRole).label}`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal merubah role';
      showToast('error', message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredByRole = users.filter(u => !roleFilter || u.role === roleFilter);

  // Quick stats
  const roleCounts = ROLE_OPTIONS.reduce((acc, r) => {
    acc[r.value] = users.filter(u => u.role === r.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="pb-10 font-outfit">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola akun, role, dan akses user yang digunakan dalam sistem pondok.</p>
        </div>
        <div className="hidden md:flex gap-2 bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm shadow-slate-100">
           <UserCheck size={20} className="text-emerald-500" />
           <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Sistem RBAC Terintegrasi</span>
        </div>
      </div>

      {/* Role Distribution Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5 mb-10">
        {ROLE_OPTIONS.map(role => {
          const RoleIcon = role.icon;
          const count = roleCounts[role.value] || 0;
          return (
            <button 
              key={role.value}
              onClick={() => setRoleFilter(roleFilter === role.value ? '' : role.value)}
              className={`p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-left group ${
                roleFilter === role.value 
                  ? `${role.bg} border-current ${role.color} shadow-xl shadow-slate-200/50`
                  : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className={`p-3 rounded-2xl w-fit mb-4 transition-transform group-hover:rotate-12 ${role.bg} ${role.color}`}>
                <RoleIcon size={24} />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none">{count >= 10 ? count : `0${count}`}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-2">{role.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-6">
          <div className="flex-1 relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Cari user berdasarkan identitas nama atau email terdaftar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 rounded-xl text-sm font-bold transition-all outline-none shadow-inner"
            />
          </div>
          
          <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {roleFilter && (
              <button 
                onClick={() => setRoleFilter('')}
                className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
              >
                <X size={14} /> Reset
              </button>
            )}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-xl shadow-inner">
              <Users size={18} className="text-slate-400" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{filteredByRole.length} User</span>
            </div>
          </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden mb-12">
        {isLoading && users.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-slate-200" size={40} />
            </div>
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">Sinkronisasi Database Otoritas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="pl-10 pr-6 py-8 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">ID/Token</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Profil Personel</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Detail Otentikasi</th>
                  <th className="px-6 py-8 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tingkat Otoritas</th>
                  <th className="pr-10 pl-6 py-8 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Manajemen Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredByRole.length > 0 ? filteredByRole.map(u => {
                  const roleConfig = getRoleConfig(u.role);
                  const RoleIcon = roleConfig.icon;
                  const isSelf = u.id === currentUser?.id;
                  const usageStatus = getUsageStatus(u, currentUser?.id);

                  return (
                    <tr key={u.id} className={`group hover:bg-emerald-50/40 transition-colors duration-500 ${isSelf ? 'bg-emerald-50/40' : ''}`}>
                      <td className="pl-10 pr-6 py-8">
                        <span className="text-[10px] font-black font-mono text-slate-300 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-inner group-hover:bg-white group-hover:text-emerald-500 transition-all">#{u.id}</span>
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-lg ${roleConfig.bg} ${roleConfig.color} flex items-center justify-center font-black text-xl shadow-lg ring-4 ${roleConfig.ring} group-hover:scale-110 transition-transform duration-500`}>
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase tracking-tight text-lg">{u.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${usageStatus.tone}`}>{usageStatus.label}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <p className="text-xs font-bold text-slate-400 mb-1.5">{u.email}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          <Clock size={12} />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-slate-500">
                          {u.last_login_at
                            ? `Login terakhir ${new Date(u.last_login_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : usageStatus.detail}
                        </p>
                      </td>
                      <td className="px-6 py-8">
                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${roleConfig.bg} ${roleConfig.color} border-current/10`}>
                          <RoleIcon size={14} className="fill-current/20" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="pr-10 pl-6 py-8 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {!isSelf && (
                            <div className="relative group/select">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                disabled={updating === u.id}
                                className={`appearance-none pl-6 pr-12 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer transition-all shadow-sm ${
                                  updating === u.id 
                                    ? 'bg-slate-50 border-slate-100 text-slate-300'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                                }`}
                              >
                                {ROLE_OPTIONS.map(r => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-emerald-600 transition-colors" />
                            </div>
                          )}
                          
                          {updating === u.id && (
                             <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                          )}

                          {!isSelf && (
                            <button 
                              onClick={() => { setSelectedId(u.id); setIsDeleteOpen(true); }}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-40 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <AlertCircle className="text-slate-200" size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Personel Tidak Ditemukan</h3>
                        <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Sistem tidak mendeteksi user dengan kriteria pencarian tersebut.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Access Permission Legend */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 p-12 rounded-xl text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl transition-colors group-hover:bg-emerald-500/20"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
           <div className="max-w-md">
              <div className="bg-emerald-500/15 p-4 rounded-xl w-fit mb-6 border border-emerald-500/20">
                <UserCog size={32} className="text-emerald-300" />
              </div>
              <h4 className="text-4xl font-black uppercase tracking-tight mb-4 font-outfit">Siklus Otoritas</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Darussunnah menggunakan sistem perizinan yang ketat. Pastikan setiap penugasan role sesuai dengan tupoksi pengurus demi keamanan data yayasan.
              </p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
              {[
                { role: 'Super Admin', access: 'Kontrol Penuh', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                { role: 'Bendahara', access: 'Keuangan & Akad', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { role: 'Panitia PSB', access: 'Adm. Santri Baru', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { role: 'Tim Media', access: 'Berita & Edukasi', icon: Camera, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.role} className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/5 flex items-center gap-6 hover:bg-white/10 transition-all">
                    <div className={`p-4 rounded-2xl ${item.bg} ${item.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white mb-1">{item.role}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.access}</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Musnahkan Akun User?"
        message="Data personel ini akan dihapus permanen dari sistem otentikasi Darussunnah. Akses mereka akan segera terblokir."
        confirmText="YA, HAPUS PERMANEN"
      />
    </div>
  );
}
