import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, Member, UserRole, UserSession } from '../types';
import { UserService, MASTER_SUPER_ADMIN } from '../services/userService';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Users,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  RefreshCw,
  Building,
  Home,
  Check,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  session: UserSession;
  onRecordAudit?: (payload: {
    memberNik: string;
    memberName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    reason: string;
    actor: string;
    dpd: string;
  }) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  onRecordAudit,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form Fields
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [formNik, setFormNik] = useState<string>('');
  const [formNomorEkta, setFormNomorEkta] = useState<string>('');
  const [formFullName, setFormFullName] = useState<string>('');
  const [formJabatan, setFormJabatan] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('NasDem123');
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [formRole, setFormRole] = useState<UserRole>('ADMIN_DPD');
  const [formDpdAccess, setFormDpdAccess] = useState<string>(SULUT_REGIONS[0]?.name || 'Kabupaten Minahasa Selatan');
  const [formDpcAccess, setFormDpcAccess] = useState<string>('ALL');
  const [formDprtAccess, setFormDprtAccess] = useState<string>('ALL');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Load users when opened
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await UserService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Gagal mengambil data user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Derived Subdistricts & Villages for cascading scope selection
  const selectedDpdObject = useMemo(() => {
    return SULUT_REGIONS.find((r) => r.name.toLowerCase() === formDpdAccess.toLowerCase()) || SULUT_REGIONS[0];
  }, [formDpdAccess]);

  const availableSubdistricts = useMemo(() => {
    return selectedDpdObject?.subdistricts || [];
  }, [selectedDpdObject]);

  const availableVillages = useMemo(() => {
    if (formDpcAccess === 'ALL') return [];
    const sub = availableSubdistricts.find((s) => s.name.toLowerCase() === formDpcAccess.toLowerCase());
    return sub?.villages || [];
  }, [availableSubdistricts, formDpcAccess]);

  // Member search suggestions from existing database
  const memberSuggestions = useMemo(() => {
    if (!memberSearchTerm || memberSearchTerm.length < 2) return [];
    const term = memberSearchTerm.toLowerCase();
    return members
      .filter(
        (m) =>
          m.namaLengkap.toLowerCase().includes(term) ||
          m.nik.toLowerCase().includes(term) ||
          m.nomorEKTA.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [members, memberSearchTerm]);

  const handleSelectMember = (m: Member) => {
    setFormNik(m.nik);
    setFormNomorEkta(m.nomorEKTA);
    setFormFullName(m.namaLengkap);
    setFormJabatan(m.jabatan || 'Pengurus');
    setFormUsername(m.nik); // default username is NIK
    setMemberSearchTerm(`${m.namaLengkap} (${m.nik})`);
    setShowMemberDropdown(false);

    // Auto set wilayah if available
    if (m.dpd) {
      const matchedDpd = SULUT_REGIONS.find((r) => r.name.toLowerCase().includes(m.dpd.toLowerCase()));
      if (matchedDpd) setFormDpdAccess(matchedDpd.name);
    }
    if (m.dpc) setFormDpcAccess(m.dpc);
    if (m.dprt) setFormDprtAccess(m.dprt);
  };

  const handleOpenCreateForm = () => {
    setEditingUserId(null);
    setMemberSearchTerm('');
    setFormNik('');
    setFormNomorEkta('');
    setFormFullName('');
    setFormJabatan('');
    setFormUsername('');
    setFormPassword('NasDem123');
    setFormRole('ADMIN_DPD');
    setFormDpdAccess(SULUT_REGIONS[0]?.name || 'Kabupaten Minahasa Selatan');
    setFormDpcAccess('ALL');
    setFormDprtAccess('ALL');
    setFormIsActive(true);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: AppUser) => {
    setEditingUserId(user.id);
    setMemberSearchTerm(user.fullName);
    setFormNik(user.memberNik || '');
    setFormNomorEkta(user.nomorEkta || '');
    setFormFullName(user.fullName);
    setFormJabatan(user.jabatan || '');
    setFormUsername(user.username);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormDpdAccess(user.dpdAccess);
    setFormDpcAccess(user.dpcAccess || 'ALL');
    setFormDprtAccess(user.dprtAccess || 'ALL');
    setFormIsActive(user.isActive);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formFullName.trim()) {
      setFormError('Nama lengkap admin wajib diisi.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Username / NIK login wajib diisi.');
      return;
    }
    if (!formPassword.trim()) {
      setFormError('Password login wajib diisi.');
      return;
    }

    if (formRole === 'ADMIN_DPC' && (formDpcAccess === 'ALL' || !formDpcAccess.trim())) {
      setFormError('Untuk Akun Role Admin DPC, wajib memilih wilayah Kecamatan (DPC) spesifik.');
      return;
    }

    if (formRole === 'ADMIN_DPRT') {
      if (formDpcAccess === 'ALL' || !formDpcAccess.trim()) {
        setFormError('Untuk Akun Role Admin DPRt, wajib memilih wilayah Kecamatan (DPC).');
        return;
      }
      if (formDprtAccess === 'ALL' || !formDprtAccess.trim()) {
        setFormError('Untuk Akun Role Admin DPRt, wajib memilih desa/kelurahan (DPRt) spesifik.');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingUserId) {
        // Edit Existing User
        await UserService.update(editingUserId, {
          memberNik: formNik.trim() || undefined,
          nomorEkta: formNomorEkta.trim() || undefined,
          username: formUsername.trim(),
          password: formPassword.trim(),
          fullName: formFullName.trim(),
          role: formRole,
          dpdAccess: formRole === 'ADMIN_DPW' || formRole === 'SUPER_ADMIN' ? 'ALL' : formDpdAccess,
          dpcAccess: formRole === 'ADMIN_DPC' || formRole === 'ADMIN_DPRT' ? formDpcAccess : 'ALL',
          dprtAccess: formRole === 'ADMIN_DPRT' ? formDprtAccess : 'ALL',
          jabatan: formJabatan.trim(),
          isActive: formIsActive,
        });

        onRecordAudit?.({
          memberNik: formNik || formUsername,
          memberName: formFullName,
          action: 'UPDATE',
          reason: `Super Admin memperbarui hak akses akun admin ${formFullName} (${formRole})`,
          actor: session.adminName,
          dpd: formDpdAccess,
        });

        setFormSuccess('Akun admin berhasil diperbarui.');
      } else {
        // Create New User
        const created = await UserService.create({
          memberNik: formNik.trim() || undefined,
          nomorEkta: formNomorEkta.trim() || undefined,
          username: formUsername.trim(),
          password: formPassword.trim(),
          fullName: formFullName.trim(),
          role: formRole,
          dpdAccess: formRole === 'ADMIN_DPW' || formRole === 'SUPER_ADMIN' ? 'ALL' : formDpdAccess,
          dpcAccess: formRole === 'ADMIN_DPC' || formRole === 'ADMIN_DPRT' ? formDpcAccess : 'ALL',
          dprtAccess: formRole === 'ADMIN_DPRT' ? formDprtAccess : 'ALL',
          jabatan: formJabatan.trim() || `Admin ${formRole}`,
          isActive: true,
        });

        onRecordAudit?.({
          memberNik: formNik || formUsername,
          memberName: formFullName,
          action: 'CREATE',
          reason: `Super Admin membuat akun admin baru untuk ${formFullName} (Role: ${formRole}, Wilayah: ${formDpdAccess})`,
          actor: session.adminName,
          dpd: formDpdAccess,
        });

        setFormSuccess('Akun admin baru berhasil dibuat dan disimpan ke database.');
      }

      await fetchUsers();
      setTimeout(() => {
        setIsFormOpen(false);
      }, 900);
    } catch (err: any) {
      console.error('Error saving admin account:', err);
      setFormError(err.message || 'Gagal menyimpan akun admin. Silakan periksa kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.username === MASTER_SUPER_ADMIN.username) {
      alert('Akun Super Administrator Utama tidak boleh dinonaktifkan.');
      return;
    }
    const newStatus = !user.isActive;
    try {
      await UserService.toggleStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
      onRecordAudit?.({
        memberNik: user.memberNik || user.username,
        memberName: user.fullName,
        action: 'UPDATE',
        reason: `Super Admin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} akses akun admin ${user.fullName}`,
        actor: session.adminName,
        dpd: user.dpdAccess,
      });
    } catch (err) {
      console.error('Gagal mengubah status aktif user:', err);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.username === MASTER_SUPER_ADMIN.username || user.username === '7106033003050001') {
      alert('Akun Super Administrator Utama tidak boleh dihapus.');
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus akses akun admin "${user.fullName}" (${user.username})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    try {
      await UserService.delete(user.id, user.username);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      onRecordAudit?.({
        memberNik: user.memberNik || user.username,
        memberName: user.fullName,
        action: 'DELETE',
        reason: `Super Admin menghapus akun admin ${user.fullName} (${user.role})`,
        actor: session.adminName,
        dpd: user.dpdAccess,
      });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun admin.');
    }
  };

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.memberNik && u.memberNik.includes(searchQuery)) ||
        u.dpdAccess.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      superAdmin: users.filter((u) => u.role === 'SUPER_ADMIN').length,
      dpw: users.filter((u) => u.role === 'ADMIN_DPW').length,
      dpd: users.filter((u) => u.role === 'ADMIN_DPD').length,
      dpc: users.filter((u) => u.role === 'ADMIN_DPC').length,
      dprt: users.filter((u) => u.role === 'ADMIN_DPRT').length,
    };
  }, [users]);

  if (!isOpen || session.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#002B49] text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Manajemen Akun Admin &amp; Hak Akses
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                  Khusus Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Otoritas eksklusif Super Admin untuk menerbitkan akun admin, menetapkan peran, dan cakupan teritorial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              title="Refresh Data"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics Pill Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Akun</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{stats.total}</span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold uppercase">Akun Aktif</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{stats.active}</span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-semibold uppercase">Admin DPW</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">{stats.dpw}</span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold uppercase">Admin DPD (Kab)</span>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{stats.dpd}</span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold uppercase">Admin DPC (Kec)</span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">{stats.dpc}</span>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-semibold uppercase">Admin DPRt (Desa)</span>
            <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">{stats.dprt}</span>
          </div>
        </div>

        {/* Content Body: Split View or Filter Bar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, username, atau wilayah..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Peran</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN_DPW">Admin DPW</option>
                <option value="ADMIN_DPD">Admin DPD</option>
                <option value="ADMIN_DPC">Admin DPC</option>
                <option value="ADMIN_DPRT">Admin DPRt</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Buat Akun Admin Baru</span>
            </button>
          </div>

          {/* User Form Modal / Accordion */}
          {isFormOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/60 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    {editingUserId ? <Edit3 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {editingUserId ? 'Perbarui Hak Akses Akun Admin' : 'Penerbitan Akun Admin & Hak Akses Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Step 1: Auto-search Kader from DB */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Cari Kader dari Database (Nama Lengkap / NIK / E-KTA)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        setShowMemberDropdown(true);
                      }}
                      onFocus={() => setShowMemberDropdown(true)}
                      placeholder="Ketik nama atau NIK pengurus untuk mengisi otomatis data..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none shadow-inner"
                    />
                  </div>

                  {/* Dropdown Suggestions */}
                  {showMemberDropdown && memberSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {memberSuggestions.map((m) => (
                        <div
                          key={m.nik}
                          onClick={() => handleSelectMember(m)}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {m.namaLengkap}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              NIK: {m.nik} &bull; E-KTA: {m.nomorEKTA || '-'}
                            </div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400">
                              {m.jabatan || 'Anggota'} &bull; {m.dpd} {m.dpc ? `> ${m.dpc}` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Pilih
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid Inputs: Personal & Credential Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nama Lengkap Admin *
                    </label>
                    <input
                      type="text"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Contoh: Jemmy Tambun"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      NIK KTP Pengurus
                    </label>
                    <input
                      type="text"
                      value={formNik}
                      onChange={(e) => {
                        setFormNik(e.target.value);
                        if (!editingUserId) setFormUsername(e.target.value);
                      }}
                      placeholder="16 digit NIK..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nomor E-KTA
                    </label>
                    <input
                      type="text"
                      value={formNomorEkta}
                      onChange={(e) => setFormNomorEkta(e.target.value)}
                      placeholder="KT-71XX-XXXX"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Jabatan Struktural
                    </label>
                    <input
                      type="text"
                      value={formJabatan}
                      onChange={(e) => setFormJabatan(e.target.value)}
                      placeholder="Contoh: Ketua DPD Minsel / Sekretariat"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Username Login (NIK / E-KTA / Custom) *
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Username untuk login..."
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none font-mono font-bold text-blue-700 dark:text-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Kata Sandi (Password) *
                    </label>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Masukkan password akun..."
                        required
                        className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Role & Territorial Scope Section */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tingkat Peran & Pembatasan Wilayah Akses
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sistem akan mengisolasi data daerah sesuai pilihan ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Role Choice */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Tingkat Peran (Role)
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-amber-600 dark:text-amber-400"
                      >
                        <option value="SUPER_ADMIN">★ SUPER ADMINISTRATOR (Akses Tertinggi)</option>
                        <option value="ADMIN_DPW">ADMIN DPW (Tingkat Provinsi)</option>
                        <option value="ADMIN_DPD">ADMIN DPD (Tingkat Kab/Kota)</option>
                        <option value="ADMIN_DPC">ADMIN DPC (Tingkat Kecamatan)</option>
                        <option value="ADMIN_DPRT">ADMIN DPRT (Tingkat Kelurahan/Desa)</option>
                      </select>
                    </div>

                    {/* DPD Access */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Cakupan DPD (Kabupaten/Kota)
                      </label>
                      {formRole === 'ADMIN_DPW' || formRole === 'SUPER_ADMIN' ? (
                        <input
                          type="text"
                          disabled
                          value="SEMUA KAB/KOTA SE-SULUT (ALL)"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-400 font-bold"
                        />
                      ) : (
                        <select
                          value={formDpdAccess}
                          onChange={(e) => {
                            setFormDpdAccess(e.target.value);
                            setFormDpcAccess('ALL');
                            setFormDprtAccess('ALL');
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                        >
                          {SULUT_REGIONS.map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* DPC Access */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Cakupan DPC (Kecamatan)
                      </label>
                      {formRole === 'ADMIN_DPC' || formRole === 'ADMIN_DPRT' ? (
                        <select
                          value={formDpcAccess}
                          onChange={(e) => {
                            setFormDpcAccess(e.target.value);
                            setFormDprtAccess('ALL');
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                        >
                          <option value="ALL">-- Pilih Kecamatan --</option>
                          {availableSubdistricts.map((sub) => (
                            <option key={sub.name} value={sub.name}>
                              Kec. {sub.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value="SEMUA KECAMATAN (ALL)"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-400"
                        />
                      )}
                    </div>

                    {/* DPRt Access */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Cakupan DPRt (Desa/Kelurahan)
                      </label>
                      {formRole === 'ADMIN_DPRT' ? (
                        <select
                          value={formDprtAccess}
                          onChange={(e) => setFormDprtAccess(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none"
                        >
                          <option value="ALL">-- Pilih Desa/Kelurahan --</option>
                          {availableVillages.map((vil) => (
                            <option key={vil} value={vil}>
                              {vil}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value="SEMUA RANTING / DESA (ALL)"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-400"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingUserId ? 'Simpan Perubahan' : 'Terbitkan Akun Admin'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table / List of Admin Accounts */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Nama & Jabatan</th>
                    <th className="py-3 px-4">Username & NIK</th>
                    <th className="py-3 px-4">Tingkat Peran</th>
                    <th className="py-3 px-4">Cakupan Wilayah Akses</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        <span>Memuat daftar akun admin dari Supabase...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada akun admin yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isMaster = user.username === MASTER_SUPER_ADMIN.username || user.username === '7106033003050001';

                      const roleBadgeColor: Record<string, string> = {
                        SUPER_ADMIN: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                        ADMIN_DPW: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
                        ADMIN_DPD: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
                        ADMIN_DPC: 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700',
                        ADMIN_DPRT: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                        ANGGOTA: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                      };
                      const userBadge = roleBadgeColor[user.role] || 'bg-slate-100 text-slate-700';

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Nama & Jabatan */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                  user.role === 'SUPER_ADMIN'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{user.fullName}</span>
                                  {isMaster && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-500 text-slate-950 uppercase">
                                      Utama
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {user.jabatan || 'Pengurus Partai NasDem'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username & NIK */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-blue-700 dark:text-blue-400">
                              {user.username}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {user.memberNik ? `NIK: ${user.memberNik}` : user.nomorEkta || '-'}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${userBadge}`}
                            >
                              {user.role}
                            </span>
                          </td>

                          {/* Scope Territory */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                {user.dpdAccess === 'ALL' ? (
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    Seluruh Sulawesi Utara (15 DPD)
                                  </span>
                                ) : (
                                  <div>
                                    <span className="font-semibold">{user.dpdAccess}</span>
                                    {user.dpcAccess && user.dpcAccess !== 'ALL' && (
                                      <span className="text-slate-500 text-[11px] block">
                                        &rsaquo; Kec. {user.dpcAccess}
                                        {user.dprtAccess && user.dprtAccess !== 'ALL' && ` &rsaquo; ${user.dprtAccess}`}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status Active / Inactive */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isMaster}
                              title={isMaster ? 'Super Admin Utama selalu aktif' : 'Klik untuk ganti status aktif/nonaktif'}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                user.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300'
                              }`}
                            >
                              {user.isActive ? '● Aktif' : '○ Non-Aktif'}
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditForm(user)}
                                title="Edit Akun & Hak Akses"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {!isMaster && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  title="Hapus Akun Admin"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Hanya Super Admin yang berwenang menerbitkan akun. Akun admin daerah hanya dapat melihat data wilayah yang ditugaskan.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
export default UserManagementModal;
