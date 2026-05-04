'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserRole, deleteUser, createUser, resetUserPassword } from '@/lib/api';
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
  UserCheck,
  Plus,
  Mail,
  Lock,
  KeyRound
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
  const [isCreating, setIsCreating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await createUser(createForm);
      if (res.success) {
        showToast('success', 'Akun baru berhasil dibuat.');
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'user',
        });
        setShowCreateForm(false);
        await fetchUsers('');
        setSearchQuery('');
        setRoleFilter('');
      } else {
        showToast('error', 'Gagal membuat akun baru.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsCreating(false);
    }
  };

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

  const openResetPasswordDialog = (userRow: UserRow) => {
    setSelectedUser(userRow);
    setResetPasswordForm({
      password: '',
      confirmPassword: '',
    });
    setIsResetPasswordOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (resetPasswordForm.password.length < 8) {
      showToast('error', 'Password baru minimal 8 karakter.');
      return;
    }
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      showToast('error', 'Konfirmasi password belum sama.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await resetUserPassword(selectedUser.id, resetPasswordForm.password);
      if (res.success) {
        showToast('success', `Password untuk ${selectedUser.name} berhasil direset.`);
        setIsResetPasswordOpen(false);
        setSelectedUser(null);
        setResetPasswordForm({
          password: '',
          confirmPassword: '',
        });
      } else {
        showToast('error', 'Gagal mereset password pengguna.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsResettingPassword(false);
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

      <div className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Bootstrap Akun</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Tambah User Dari Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Superadmin bisa membuat akun baru langsung dari panel tanpa menunggu pendaftaran publik. Cocok untuk staf internal seperti bendahara, panitia PSB, dan tim media.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            {showCreateForm ? <X size={16} /> : <Plus size={16} />}
            {showCreateForm ? 'Tutup Form' : 'Tambah User'}
          </button>
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreateUser} className="mt-6 grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <UserCheck size={14} /> Nama
              </span>
              <input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Nama pengguna"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <Mail size={14} /> Email
              </span>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="nama@darussunnah.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <Lock size={14} /> Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Minimal 8 karakter"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <Shield size={14} /> Role
              </span>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-3 border-t border-emerald-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium leading-6 text-slate-500">
                Akun baru akan langsung masuk ke tabel user dan bisa dipakai login sesuai role yang dipilih.
              </p>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Plus size={16} />}
                {isCreating ? 'Menyimpan...' : 'Simpan User'}
              </button>
            </div>
          </form>
        ) : null}
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
                              onClick={() => openResetPasswordDialog(u)}
                              className="p-3 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Reset password"
                            >
                              <KeyRound size={20} />
                            </button>
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

      {isResetPasswordOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              setIsResetPasswordOpen(false);
              setSelectedUser(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Reset Password</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  {selectedUser?.name || 'User'}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Masukkan password baru untuk akun ini. Setelah disimpan, user bisa langsung login memakai password baru tersebut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordOpen(false);
                  setSelectedUser(null);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  <Lock size={14} /> Password Baru
                </span>
                <input
                  type="password"
                  value={resetPasswordForm.password}
                  onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  placeholder="Minimal 8 karakter"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  <Lock size={14} /> Konfirmasi Password
                </span>
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  placeholder="Ulangi password baru"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordOpen(false);
                  setSelectedUser(null);
                }}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResettingPassword}
                onClick={handleResetPassword}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResettingPassword ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <KeyRound size={16} />}
                {isResettingPassword ? 'Menyimpan...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
