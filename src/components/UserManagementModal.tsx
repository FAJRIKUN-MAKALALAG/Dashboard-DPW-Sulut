import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, Member, UserRole, UserSession } from '../types';
import { UserService, MASTER_SUPER_ADMIN } from '../services/userService';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { useDialog } from './ui/AppDialogProvider';
import { ShieldCheck, X, RefreshCw, Lock } from 'lucide-react';
import { UserStatsRibbon } from './userManagement/UserStatsRibbon';
import { UserFilterToolbar } from './userManagement/UserFilterToolbar';
import { UserFormModal } from './userManagement/UserFormModal';
import { UserDesktopTable } from './userManagement/UserDesktopTable';
import { UserMobileCards } from './userManagement/UserMobileCards';

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
  const { showAlert, showConfirm } = useDialog();
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
        await UserService.create({
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
      title: 'Hapus Akses Akun Admin',
      message:
        'Apakah Anda yakin ingin menghapus akses akun admin ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.',
      detail: `${user.fullName} (${user.username})`,
      confirmText: 'Ya, Hapus Akun',
      cancelText: 'Batal',
    });

    if (!confirmed) {
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
      await showAlert({
        variant: 'danger',
        title: 'Gagal Menghapus Akun',
        message: err.message || 'Gagal menghapus akun admin.',
      });
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#002B49] text-white">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                  Manajemen Akun Admin &amp; Hak Akses
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white shrink-0">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 hidden sm:block truncate">
                Otoritas eksklusif Super Admin untuk menerbitkan akun admin, menetapkan peran, dan cakupan teritorial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={fetchUsers}
              title="Refresh Data"
              className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics Pill Ribbon */}
        <UserStatsRibbon stats={stats} />

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {/* Action & Filter Toolbar */}
          <UserFilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            onOpenCreateForm={handleOpenCreateForm}
          />

          {/* User Form Modal / Accordion */}
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
            availableSubdistricts={availableSubdistricts}
            availableVillages={availableVillages}
          />

          {/* Table / List of Admin Accounts */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            {/* 1. Tampilan Desktop & Tablet */}
            <UserDesktopTable
              isLoading={isLoading}
              users={filteredUsers}
              onToggleStatus={handleToggleStatus}
              onEditUser={handleOpenEditForm}
              onDeleteUser={handleDeleteUser}
            />

            {/* 2. Tampilan HP / Smartphone */}
            <UserMobileCards
              isLoading={isLoading}
              users={filteredUsers}
              onToggleStatus={handleToggleStatus}
              onEditUser={handleOpenEditForm}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] leading-tight">
              Hanya Super Admin yang berwenang menerbitkan akun. Akun admin daerah hanya dapat melihat data wilayah yang ditugaskan.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
