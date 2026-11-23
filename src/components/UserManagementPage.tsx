import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, Member, UserRole, UserSession } from '../types';
import { UserService, MASTER_SUPER_ADMIN } from '../services/userService';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  isDelegatedAdminRole,
  isDpcScopedRole,
  isDpdScopedRole,
  isDprtScopedRole,
  isDpwScopedRole,
  isGlobalTerritoryRole,
  isKetuaRole,
  isPengurusRole,
} from '../utils/permissionUtils';
import { useDialog } from './ui/AppDialogProvider';
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  UserPlus,
  Users,
  Crown,
  UserCheck,
  Settings2,
  Search,
  Info,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { UserFormModal } from './userManagement/UserFormModal';
import { UserDesktopTable } from './userManagement/UserDesktopTable';
import { UserMobileCards } from './userManagement/UserMobileCards';

type RoleCategoryTab = 'ALL' | 'KETUA' | 'DELEGASI' | 'PENGURUS' | 'SISTEM';
type LevelFilter = 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRT';

interface UserManagementPageProps {
  members: Member[];
  session: UserSession;
  onBackToDashboard?: () => void;
  onRecordAudit?: (payload: {
    memberNik: string;
    memberName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    reason: string;
    actor: string;
    dpd: string;
  }) => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  members,
  session,
  onBackToDashboard,
  onRecordAudit,
}) => {
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL');
  const [categoryTab, setCategoryTab] = useState<RoleCategoryTab>('ALL');
  const [showRoleGuide, setShowRoleGuide] = useState<boolean>(false);

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
  const [formPassword, setFormPassword] = useState<string>('');
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [formRole, setFormRole] = useState<UserRole>('ADMIN_DPD');
  const [formDpdAccess, setFormDpdAccess] = useState<string>(
    SULUT_REGIONS[0]?.name || 'Kabupaten Minahasa Selatan'
  );
  const [formDpcAccess, setFormDpcAccess] = useState<string>('ALL');
  const [formDprtAccess, setFormDprtAccess] = useState<string>('ALL');
  const [formDelegatedForKetuaNik, setFormDelegatedForKetuaNik] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

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
    fetchUsers();
  }, []);

  // Cascading territory options
  const selectedDpdObject = useMemo(() => {
    return (
      SULUT_REGIONS.find((r) => r.name.toLowerCase() === formDpdAccess.toLowerCase()) ||
      SULUT_REGIONS[0]
    );
  }, [formDpdAccess]);

  const availableSubdistricts = useMemo(() => {
    return selectedDpdObject?.subdistricts || [];
  }, [selectedDpdObject]);

  const availableVillages = useMemo(() => {
    if (formDpcAccess === 'ALL') return [];
    const sub = availableSubdistricts.find(
      (s) => s.name.toLowerCase() === formDpcAccess.toLowerCase()
    );
    return sub?.villages || [];
  }, [availableSubdistricts, formDpcAccess]);

  // Member search suggestions
  const memberSuggestions = useMemo(() => {
    if (!memberSearchTerm || memberSearchTerm.length < 2) return [];
    const term = memberSearchTerm.toLowerCase();
    return members
      .filter(
        (m) =>
          m.namaLengkap.toLowerCase().includes(term) ||
          m.nik.toLowerCase().includes(term) ||
          (m.nomorEKTA && m.nomorEKTA.toLowerCase().includes(term))
      )
      .slice(0, 6);
  }, [members, memberSearchTerm]);

  const handleSelectMember = (m: Member) => {
    setFormNik(m.nik);
    setFormNomorEkta(m.nomorEKTA || '');
    setFormFullName(m.namaLengkap);
    setFormJabatan(m.jabatan || 'Pengurus');
    setFormUsername(m.nik);
    setMemberSearchTerm(`${m.namaLengkap} (${m.nik})`);
    setShowMemberDropdown(false);

    if (m.dpd) {
      const matchedDpd = SULUT_REGIONS.find((r) =>
        r.name.toLowerCase().includes(m.dpd.toLowerCase())
      );
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
    setFormPassword('');
    setFormRole('KETUA_DPD');
    setFormDpdAccess(SULUT_REGIONS[0]?.name || 'Kabupaten Minahasa Selatan');
    setFormDpcAccess('ALL');
    setFormDprtAccess('ALL');
    setFormDelegatedForKetuaNik('');
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
    setFormPassword('');
    setShowFormPassword(false);
    setFormRole(user.role);
    setFormDpdAccess(user.dpdAccess);
    setFormDpcAccess(user.dpcAccess || 'ALL');
    setFormDprtAccess(user.dprtAccess || 'ALL');
    setFormDelegatedForKetuaNik(user.delegatedForKetuaNik || '');
    setFormIsActive(user.isActive);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formFullName.trim()) {
      setFormError('Nama lengkap akun wajib diisi.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Username / NIK login wajib diisi.');
      return;
    }
    if (!editingUserId && !formPassword.trim()) {
      setFormError('Password login wajib diisi untuk akun baru.');
      return;
    }
    if (!editingUserId && formPassword.trim().length < 6) {
      setFormError('Password akun baru minimal 6 karakter.');
      return;
    }
    if (editingUserId && formPassword.trim() && formPassword.trim().length < 6) {
      setFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (isDpcScopedRole(formRole) && (formDpcAccess === 'ALL' || !formDpcAccess.trim())) {
      setFormError(`Untuk Role ${formRole}, wajib memilih wilayah Kecamatan (DPC) spesifik.`);
      return;
    }

    if (isDprtScopedRole(formRole)) {
      if (formDpcAccess === 'ALL' || !formDpcAccess.trim()) {
        setFormError(`Untuk Role ${formRole}, wajib memilih wilayah Kecamatan (DPC).`);
        return;
      }
      if (formDprtAccess === 'ALL' || !formDprtAccess.trim()) {
        setFormError(`Untuk Role ${formRole}, wajib memilih Desa/Kelurahan (DPRt) spesifik.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const isGlobalRole =
        isGlobalTerritoryRole(formRole) ||
        formRole === 'ADMIN_INVENTORY' ||
        formRole === 'WAKIL_BENDAHARA';
      const defaultJabatanForRole =
        formRole === 'ADMIN_INVENTORY'
          ? 'Admin Inventaris Kantor DPW Sulut'
          : formRole === 'WAKIL_BENDAHARA'
          ? 'Wakil Bendahara DPW Sulut'
          : `Pengurus ${formRole}`;
      const cleanDelegatedNik = isDelegatedAdminRole(formRole)
        ? formDelegatedForKetuaNik.trim() || undefined
        : undefined;

      if (editingUserId) {
        await UserService.update(editingUserId, {
          memberNik: formNik.trim() || undefined,
          nomorEkta: formNomorEkta.trim() || undefined,
          username: formUsername.trim(),
          password: formPassword.trim() || undefined,
          fullName: formFullName.trim(),
          role: formRole,
          dpdAccess: isGlobalRole ? 'ALL' : formDpdAccess,
          dpcAccess: isDpcScopedRole(formRole) || isDprtScopedRole(formRole) ? formDpcAccess : 'ALL',
          dprtAccess: isDprtScopedRole(formRole) ? formDprtAccess : 'ALL',
          jabatan: formJabatan.trim() || defaultJabatanForRole,
          delegatedForKetuaNik: cleanDelegatedNik ?? '',
          isActive: formIsActive,
        });

        onRecordAudit?.({
          memberNik: formNik || formUsername,
          memberName: formFullName,
          action: 'UPDATE',
          reason: `Super Admin memperbarui hak akses akun ${formFullName} (${formRole})`,
          actor: session.adminName,
          dpd: isGlobalRole ? 'DPW Sulawesi Utara' : formDpdAccess,
        });

        setFormSuccess('Akun berhasil diperbarui.');
      } else {
        await UserService.create({
          memberNik: formNik.trim() || undefined,
          nomorEkta: formNomorEkta.trim() || undefined,
          username: formUsername.trim(),
          password: formPassword.trim(),
          fullName: formFullName.trim(),
          role: formRole,
          dpdAccess: isGlobalRole ? 'ALL' : formDpdAccess,
          dpcAccess: isDpcScopedRole(formRole) || isDprtScopedRole(formRole) ? formDpcAccess : 'ALL',
          dprtAccess: isDprtScopedRole(formRole) ? formDprtAccess : 'ALL',
          jabatan: formJabatan.trim() || defaultJabatanForRole,
          delegatedForKetuaNik: cleanDelegatedNik,
          isActive: true,
        });

        onRecordAudit?.({
          memberNik: formNik || formUsername,
          memberName: formFullName,
          action: 'CREATE',
          reason: `Super Admin menerbitkan akun baru untuk ${formFullName} (Role: ${formRole}, Wilayah: ${
            isGlobalRole ? 'DPW Sulawesi Utara' : formDpdAccess
          })`,
          actor: session.adminName,
          dpd: isGlobalRole ? 'DPW Sulawesi Utara' : formDpdAccess,
        });

        setFormSuccess('Akun baru berhasil diterbitkan dan disimpan.');
      }

      await fetchUsers();
      setTimeout(() => {
        setIsFormOpen(false);
      }, 900);
    } catch (err: any) {
      console.error('Error saving admin account:', err);
      setFormError(err.message || 'Gagal menyimpan akun. Silakan periksa kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.username === MASTER_SUPER_ADMIN.username) {
      await showAlert({
        variant: 'warning',
        title: 'Akses Dilindungi Sistem',
        message:
          'Akun Super Administrator Utama merupakan pemegang otoritas tertinggi sistem dan tidak dapat dinonaktifkan.',
        detail: `${user.fullName} (${user.username})`,
      });
      return;
    }
    const newStatus = !user.isActive;
    try {
      await UserService.toggleStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
      );
      onRecordAudit?.({
        memberNik: user.memberNik || user.username,
        memberName: user.fullName,
        action: 'UPDATE',
        reason: `Super Admin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} akun ${user.fullName}`,
        actor: session.adminName,
        dpd: user.dpdAccess,
      });
    } catch (err) {
      console.error('Gagal mengubah status aktif user:', err);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (
      user.username === MASTER_SUPER_ADMIN.username ||
      user.username === '7106033003050001'
    ) {
      await showAlert({
        variant: 'warning',
        title: 'Akses Dilindungi Sistem',
        message:
          'Akun Super Administrator Utama merupakan akun inti sistem dan tidak dapat dihapus.',
        detail: `${user.fullName} (${user.username})`,
      });
      return;
    }

    const confirmed = await showConfirm({
      variant: 'danger',
      title: 'Hapus Akses Akun',
      message:
        'Apakah Anda yakin ingin menghapus akses akun ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.',
      detail: `${user.fullName} (${user.username})`,
      confirmText: 'Ya, Hapus Akun',
      cancelText: 'Batal',
    });

    if (!confirmed) return;

    try {
      await UserService.delete(user.id, user.username);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      onRecordAudit?.({
        memberNik: user.memberNik || user.username,
        memberName: user.fullName,
        action: 'DELETE',
        reason: `Super Admin menghapus akun ${user.fullName} (${user.role})`,
        actor: session.adminName,
        dpd: user.dpdAccess,
      });
    } catch (err: any) {
      await showAlert({
        variant: 'danger',
        title: 'Gagal Menghapus Akun',
        message: err.message || 'Gagal menghapus akun.',
      });
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    const ketua = users.filter((u) => isKetuaRole(u.role)).length;
    const delegasi = users.filter((u) => isDelegatedAdminRole(u.role)).length;
    const pengurus = users.filter((u) => isPengurusRole(u.role)).length;
    const sistem = users.filter(
      (u) =>
        u.role === 'SUPER_ADMIN' ||
        u.role === 'WAKIL_BENDAHARA' ||
        u.role === 'ADMIN_INVENTORY'
    ).length;
    return {
      total: users.length,
      active,
      inactive: users.length - active,
      ketua,
      delegasi,
      pengurus,
      sistem,
      dpw: users.filter((u) => isDpwScopedRole(u.role)).length,
      dpd: users.filter((u) => isDpdScopedRole(u.role)).length,
      dpc: users.filter((u) => isDpcScopedRole(u.role)).length,
      dprt: users.filter((u) => isDprtScopedRole(u.role)).length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (categoryTab === 'KETUA' && !isKetuaRole(u.role)) return false;
      if (categoryTab === 'DELEGASI' && !isDelegatedAdminRole(u.role)) return false;
      if (categoryTab === 'PENGURUS' && !isPengurusRole(u.role)) return false;
      if (
        categoryTab === 'SISTEM' &&
        u.role !== 'SUPER_ADMIN' &&
        u.role !== 'WAKIL_BENDAHARA' &&
        u.role !== 'ADMIN_INVENTORY'
      ) {
        return false;
      }

      if (levelFilter === 'DPW' && !isDpwScopedRole(u.role) && u.role !== 'SUPER_ADMIN' && u.role !== 'WAKIL_BENDAHARA' && u.role !== 'ADMIN_INVENTORY') return false;
      if (levelFilter === 'DPD' && !isDpdScopedRole(u.role)) return false;
      if (levelFilter === 'DPC' && !isDpcScopedRole(u.role)) return false;
      if (levelFilter === 'DPRT' && !isDprtScopedRole(u.role)) return false;

      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.memberNik && u.memberNik.toLowerCase().includes(q)) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        u.dpdAccess.toLowerCase().includes(q) ||
        (u.dpcAccess && u.dpcAccess.toLowerCase().includes(q)) ||
        (u.dprtAccess && u.dprtAccess.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery, levelFilter, categoryTab]);

  if (session.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Clean Dashboard-Style Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 transition-colors">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Dashboard</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1A3282] text-white uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3 h-3 text-[#FFDD00]" />
              SUPER ADMIN
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              DPW {stats.dpw} &bull; DPD {stats.dpd} &bull; DPC {stats.dpc} &bull; DPRt {stats.dprt}
            </span>
          </div>

          <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Manajemen Akun Admin &amp; Hak Akses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            Kelola akun Super Admin, Ketua Wilayah, Admin Delegasi Kepercayaan Ketua (referral terpisah), dan Pengurus Struktural se-Sulawesi Utara.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRoleGuide((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shadow-2xs ${
              showRoleGuide
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Panduan Role</span>
            {showRoleGuide ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            title="Muat ulang daftar akun"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FFDD00]" />
            <span>Buat Akun Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Role Hierarchy Reference (Clean Dashboard Card) */}
      {showRoleGuide && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
              <span>Ringkasan Batasan Hak Akses 3-Lapis</span>
            </h2>
            <span className="text-[11px] text-slate-400">Berlaku seragam di Frontend &amp; API Backend</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-700 text-white">
                KETUA (DPW / DPD / DPC / DPRt)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Akses penuh Dashboard (termasuk Mini Dashboard DPRt), Matriks Struktur, Edit/Status Kader, dan Supervisi Referral wilayahnya. Hanya <strong>Super Admin</strong> &amp; <strong>Ketua DPW</strong> yang bisa hapus langsung &amp; approve penghapusan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                ADMIN DELEGASI KETUA
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Pengurus kepercayaan yang diangkat Super Admin setingkat Ketua wilayah (Dashboard, Matriks, Edit). <strong>Kode referral pribadi tetap miliknya sendiri</strong>, dan kode Ketua wilayah tetap terpisah.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                PENGURUS (DPW / DPD / DPC / DPRt)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Hanya dapat melakukan <strong>Rekrutmen Anggota Biasa</strong>, edit profil dirinya sendiri, dan melihat daftar anggota wilayahnya (read-only). Tanpa Dashboard, tanpa Matriks, dan tanpa akses lihat/approve penghapusan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                SISTEM &amp; OPERASIONAL DPW
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                <strong>Super Admin</strong> (akses penuh + kelola akun), <strong>Wakil Bendahara</strong> (Keuangan &amp; Inventaris), dan <strong>Admin Inventory</strong> (khusus aset gedung 5 lantai).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Summary Cards (Dashboard Theme: Crisp White Cards + Colored Top Border) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setCategoryTab('ALL');
            setLevelFilter('ALL');
          }}
          className={`text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer border-t-[3px] border-t-[#1A3282] ${
            categoryTab === 'ALL'
              ? 'border-slate-300 dark:border-slate-700 ring-1 ring-[#1A3282]/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Akun
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.active} Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.inactive > 0 ? `${stats.inactive} akun dinonaktifkan` : 'Seluruh akun berstatus aktif'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryTab(categoryTab === 'KETUA' ? 'DELEGASI' : 'KETUA');
            setLevelFilter('ALL');
          }}
          className={`text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer border-t-[3px] border-t-[#21409A] ${
            categoryTab === 'KETUA' || categoryTab === 'DELEGASI'
              ? 'border-slate-300 dark:border-slate-700 ring-1 ring-[#21409A]/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ketua &amp; Delegasi
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.ketua + stats.delegasi}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.ketua} Ketua &bull; {stats.delegasi} Delegasi
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pengelola penuh dashboard &amp; matriks</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryTab('PENGURUS');
            setLevelFilter('ALL');
          }}
          className={`text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer border-t-[3px] border-t-[#FDB813] ${
            categoryTab === 'PENGURUS'
              ? 'border-slate-300 dark:border-slate-700 ring-1 ring-[#FDB813]/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pengurus Struktural
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.pengurus}
            </span>
            <span className="text-[11px] text-slate-500">Akun Pengurus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rekrutmen &amp; baca data wilayah</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryTab('SISTEM');
            setLevelFilter('ALL');
          }}
          className={`text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer border-t-[3px] border-t-emerald-600 ${
            categoryTab === 'SISTEM'
              ? 'border-slate-300 dark:border-slate-700 ring-1 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sistem &amp; Kantor DPW
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Settings2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.sistem}
            </span>
            <span className="text-[11px] text-slate-500">Akun Khusus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Super Admin, Bendahara &amp; Inventaris</p>
        </button>
      </div>

      {/* 4. Inline Create/Edit Panel (Smooth Clean Card above Table) */}
      <UserFormModal
        isFormOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingUserId={editingUserId}
        formError={formError}
        formSuccess={formSuccess}
        isSaving={isSaving}
        onSave={handleSaveForm}
        memberSearchTerm={memberSearchTerm}
        setMemberSearchTerm={setMemberSearchTerm}
        showMemberDropdown={showMemberDropdown}
        setShowMemberDropdown={setShowMemberDropdown}
        memberSuggestions={memberSuggestions}
        onSelectMember={handleSelectMember}
        formFullName={formFullName}
        setFormFullName={setFormFullName}
        formNik={formNik}
        setFormNik={setFormNik}
        formNomorEkta={formNomorEkta}
        setFormNomorEkta={setFormNomorEkta}
        formJabatan={formJabatan}
        setFormJabatan={setFormJabatan}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        showFormPassword={showFormPassword}
        setShowFormPassword={setShowFormPassword}
        formRole={formRole}
        setFormRole={setFormRole}
        formDpdAccess={formDpdAccess}
        setFormDpdAccess={setFormDpdAccess}
        formDpcAccess={formDpcAccess}
        setFormDpcAccess={setFormDpcAccess}
        formDprtAccess={formDprtAccess}
        setFormDprtAccess={setFormDprtAccess}
        formDelegatedForKetuaNik={formDelegatedForKetuaNik}
        setFormDelegatedForKetuaNik={setFormDelegatedForKetuaNik}
        availableSubdistricts={availableSubdistricts}
        availableVillages={availableVillages}
      />

      {/* 5. Main Accounts Directory Workspace Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden transition-colors">
        {/* Toolbar: Category Tabs + Search + Role Dropdown */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Category Segmented Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `Semua (${stats.total})` },
                  { id: 'KETUA', label: `Ketua (${stats.ketua})` },
                  { id: 'DELEGASI', label: `Admin Delegasi (${stats.delegasi})` },
                  { id: 'PENGURUS', label: `Pengurus (${stats.pengurus})` },
                  { id: 'SISTEM', label: `Sistem/Kantor (${stats.sistem})` },
                ] as { id: RoleCategoryTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategoryTab(tab.id);
                    setLevelFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoryTab === tab.id
                      ? 'bg-[#1A3282] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Level Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 xl:max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, username, jabatan, atau wilayah..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#1A3282] dark:focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
                className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#1A3282] outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Tingkatan</option>
                <option value="DPW">Tingkat DPW (Provinsi)</option>
                <option value="DPD">Tingkat DPD (Kab/Kota)</option>
                <option value="DPC">Tingkat DPC (Kecamatan)</option>
                <option value="DPRT">Tingkat DPRt (Desa/Kel)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table & Mobile Cards */}
        <UserDesktopTable
          isLoading={isLoading}
          users={filteredUsers}
          onToggleStatus={handleToggleStatus}
          onEditUser={handleOpenEditForm}
          onDeleteUser={handleDeleteUser}
        />

        <UserMobileCards
          isLoading={isLoading}
          users={filteredUsers}
          onToggleStatus={handleToggleStatus}
          onEditUser={handleOpenEditForm}
          onDeleteUser={handleDeleteUser}
        />

        {/* Clean Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400 shrink-0" />
            <span>
              Hanya Super Admin yang berwenang menerbitkan dan mengubah otoritas akun. Seluruh perubahan tercatat di log audit.
            </span>
          </div>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            Menampilkan {filteredUsers.length} dari {users.length} akun
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
