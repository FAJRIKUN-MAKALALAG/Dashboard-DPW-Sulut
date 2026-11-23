import React, { useState, useEffect } from 'react';
import { UserRole, Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  getRoleDisplayLabel,
  isDelegatedAdminRole,
  isDpcScopedRole,
  isDpdScopedRole,
  isDprtScopedRole,
  isDpwScopedRole,
  isGlobalTerritoryRole,
  isKetuaRole,
  isPengurusRole,
} from '../../utils/permissionUtils';
import {
  UserPlus,
  Edit3,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Package,
  Wallet,
  Crown,
  UserCheck,
  ShieldCheck,
  Settings2,
  Lock,
  KeyRound,
} from 'lucide-react';

type RoleGroup = 'KETUA' | 'DELEGASI' | 'PENGURUS' | 'SISTEM';
type TerritoryLevel = 'DPW' | 'DPD' | 'DPC' | 'DPRT';

function getRoleSummary(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Akses penuh seluruh sistem, kelola akun admin, dan persetujuan penghapusan data.';
    case 'WAKIL_BENDAHARA':
      return 'Kelola modul Keuangan DPW & Inventaris Gedung Kantor DPW.';
    case 'ADMIN_INVENTORY':
      return 'Kelola Inventaris Gedung Kantor DPW (5 Lantai).';
    case 'KETUA_DPW':
      return 'Akses penuh se-Sulut (Dashboard, Matriks, Edit Kader) + wewenang menyetujui penghapusan data.';
    case 'KETUA_DPD':
      return 'Akses penuh wilayah Kab/Kota (Dashboard, Matriks, Edit & Rekrut Kader), tanpa approve penghapusan.';
    case 'KETUA_DPC':
      return 'Akses penuh wilayah Kecamatan (Dashboard, Matriks, Edit & Rekrut Kader).';
    case 'KETUA_DPRT':
      return 'Mini Dashboard & Matriks wilayah Desa/Kelurahan + Edit & Rekrut Kader DPRt.';
    case 'ADMIN_DPW':
    case 'ADMIN_DPD':
    case 'ADMIN_DPC':
    case 'ADMIN_DPRT':
      return 'Hak kelola wilayah setara Ketua terkait, dengan kode referral pribadi terpisah dari Ketua.';
    case 'PENGURUS_DPW':
    case 'PENGURUS_DPD':
    case 'PENGURUS_DPC':
    case 'PENGURUS_DPRT':
      return 'Hanya rekrutmen anggota biasa, edit profil sendiri, dan lihat daftar anggota wilayahnya (tanpa Dashboard/Matriks/Approve).';
    default:
      return 'Hak akses sesuai konfigurasi akun.';
  }
}

interface UserFormModalProps {
  isFormOpen: boolean;
  onClose: () => void;
  editingUserId: string | null;
  formError: string | null;
  formSuccess: string | null;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => void;

  memberSearchTerm: string;
  setMemberSearchTerm: (val: string) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (val: boolean) => void;
  memberSuggestions: Member[];
  onSelectMember: (m: Member) => void;

  formFullName: string;
  setFormFullName: (val: string) => void;
  formNik: string;
  setFormNik: (val: string) => void;
  formNomorEkta: string;
  setFormNomorEkta: (val: string) => void;
  formJabatan: string;
  setFormJabatan: (val: string) => void;
  formUsername: string;
  setFormUsername: (val: string) => void;
  formPassword: string;
  setFormPassword: (val: string) => void;
  showFormPassword: boolean;
  setShowFormPassword: React.Dispatch<React.SetStateAction<boolean>>;

  formRole: UserRole;
  setFormRole: (val: UserRole) => void;
  formDpdAccess: string;
  setFormDpdAccess: (val: string) => void;
  formDpcAccess: string;
  setFormDpcAccess: (val: string) => void;
  formDprtAccess: string;
  setFormDprtAccess: (val: string) => void;
  formDelegatedForKetuaNik?: string;
  setFormDelegatedForKetuaNik?: (val: string) => void;

  availableSubdistricts: { name: string; villages: string[] }[];
  availableVillages: string[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isFormOpen,
  onClose,
  editingUserId,
  formError,
  formSuccess,
  isSaving,
  onSave,

  memberSearchTerm,
  setMemberSearchTerm,
  showMemberDropdown,
  setShowMemberDropdown,
  memberSuggestions,
  onSelectMember,

  formFullName,
  setFormFullName,
  formNik,
  setFormNik,
  formNomorEkta,
  setFormNomorEkta,
  formJabatan,
  setFormJabatan,
  formUsername,
  setFormUsername,
  formPassword,
  setFormPassword,
  showFormPassword,
  setShowFormPassword,

  formRole,
  setFormRole,
  formDpdAccess,
  setFormDpdAccess,
  formDpcAccess,
  setFormDpcAccess,
  formDprtAccess,
  setFormDprtAccess,
  formDelegatedForKetuaNik = '',
  setFormDelegatedForKetuaNik,

  availableSubdistricts,
  availableVillages,
}) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setIsChangingPassword(false);
  }, [editingUserId, isFormOpen]);

  if (!isFormOpen) return null;

  const roleGroup: RoleGroup = isKetuaRole(formRole)
    ? 'KETUA'
    : isDelegatedAdminRole(formRole)
    ? 'DELEGASI'
    : isPengurusRole(formRole)
    ? 'PENGURUS'
    : 'SISTEM';

  const roleLevel: TerritoryLevel = isDpwScopedRole(formRole)
    ? 'DPW'
    : isDpdScopedRole(formRole)
    ? 'DPD'
    : isDpcScopedRole(formRole)
    ? 'DPC'
    : isDprtScopedRole(formRole)
    ? 'DPRT'
    : 'DPD';

  const buildTerritorialRole = (
    group: Exclude<RoleGroup, 'SISTEM'>,
    level: TerritoryLevel
  ): UserRole => {
    if (group === 'KETUA') return `KETUA_${level}` as UserRole;
    if (group === 'DELEGASI') return `ADMIN_${level}` as UserRole;
    return `PENGURUS_${level}` as UserRole;
  };

  const applyRoleChange = (nextRole: UserRole) => {
    setFormRole(nextRole);
    if (nextRole === 'ADMIN_INVENTORY' && !formJabatan.trim()) {
      setFormJabatan('Admin Inventaris Kantor DPW Sulut');
    } else if (nextRole === 'WAKIL_BENDAHARA' && !formJabatan.trim()) {
      setFormJabatan('Wakil Bendahara DPW Sulut');
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#1A3282] shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1A3282] text-white flex items-center justify-center font-bold shadow-2xs">
            {editingUserId ? <Edit3 className="w-4 h-4 text-[#FFDD00]" /> : <UserPlus className="w-4 h-4 text-[#FFDD00]" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              {editingUserId ? 'Perbarui Hak Akses Akun' : 'Penerbitan Akun & Hak Akses Baru'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {editingUserId
                ? 'Ubah peran, cakupan wilayah, atau kata sandi akun terpilih.'
                : 'Tautkan kader dari database atau isi manual untuk akun operasional DPW.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
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

      {(formRole === 'ADMIN_INVENTORY' || formRole === 'WAKIL_BENDAHARA') && (
        <div className="p-3 mb-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1A3282] text-white flex items-center justify-center shrink-0">
            {formRole === 'WAKIL_BENDAHARA' ? (
              <Wallet className="w-4 h-4 text-sky-300" />
            ) : (
              <Package className="w-4 h-4 text-amber-300" />
            )}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              {formRole === 'WAKIL_BENDAHARA'
                ? 'Mode Akun Wakil Bendahara (Keuangan DPW & Inventaris Kantor)'
                : 'Mode Akun Admin Inventory (Gedung Kantor DPW 5 Lantai)'}
            </span>
            <span className="text-[11px] text-slate-500">
              Cukup isi <strong>Nama Lengkap</strong>, <strong>Username Login</strong> bebas (contoh:{' '}
              <code className="font-mono text-blue-600">
                {formRole === 'WAKIL_BENDAHARA' ? 'wakil_bendahara' : 'admin_inventory'}
              </code>
              ), dan <strong>Password</strong>. Kolom NIK &amp; E-KTA bersifat opsional.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={onSave} autoComplete="off" className="space-y-4">
        {/* Step 1: Auto-search Kader from DB */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Cari Kader dari Database (Nama Lengkap / NIK / E-KTA){' '}
            {(formRole === 'ADMIN_INVENTORY' || formRole === 'WAKIL_BENDAHARA') && (
              <span className="font-normal text-slate-400">
                (Opsional untuk {formRole === 'WAKIL_BENDAHARA' ? 'Wakil Bendahara' : 'Admin Inventory'})
              </span>
            )}
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
                  onClick={() => onSelectMember(m)}
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
              name="account_login_identifier"
              autoComplete="off"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="Username untuk login..."
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none font-mono font-bold text-blue-700 dark:text-blue-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Kata Sandi (Password) {!editingUserId ? '*' : ''}
              </label>
              {editingUserId && isChangingPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setFormPassword('');
                    setIsChangingPassword(false);
                  }}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Batal ubah
                </button>
              )}
            </div>

            {editingUserId && !isChangingPassword ? (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-600 dark:text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Tersimpan aman (tidak berubah)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormPassword('');
                    setIsChangingPassword(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1A3282] dark:text-[#FFDD00] shrink-0 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Reset Sandi</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  name={editingUserId ? 'reset_account_password' : 'new_account_password'}
                  autoComplete="new-password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={
                    editingUserId
                      ? 'Masukkan kata sandi baru (min. 6 karakter)...'
                      : 'Masukkan kata sandi akun (min. 6 karakter)...'
                  }
                  minLength={editingUserId && !formPassword ? undefined : 6}
                  required={!editingUserId}
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: 2-Step Role Selector & Territorial Scope Section */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Pilih Jenis Peran (Role)
            </span>
            <span className="text-[11px] text-slate-500">
              Terpilih: <strong className="text-[#1A3282] dark:text-[#FFDD00]">{getRoleDisplayLabel(formRole)}</strong>
            </span>
          </div>

          {/* Step 1: 4 Clear Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(
              [
                {
                  id: 'KETUA' as RoleGroup,
                  label: 'Ketua Wilayah',
                  desc: 'Akses penuh wilayah & matriks',
                  icon: Crown,
                },
                {
                  id: 'DELEGASI' as RoleGroup,
                  label: 'Admin Kepercayaan',
                  desc: 'Setara Ketua, referral terpisah',
                  icon: ShieldCheck,
                },
                {
                  id: 'PENGURUS' as RoleGroup,
                  label: 'Pengurus Struktural',
                  desc: 'Rekrutmen & lihat wilayah',
                  icon: UserCheck,
                },
                {
                  id: 'SISTEM' as RoleGroup,
                  label: 'Akun Khusus DPW',
                  desc: 'Super Admin / Keuangan / Aset',
                  icon: Settings2,
                },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const active = roleGroup === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.id === 'SISTEM') {
                      applyRoleChange('SUPER_ADMIN');
                    } else {
                      applyRoleChange(buildTerritorialRole(opt.id, roleLevel));
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    active
                      ? 'bg-[#1A3282] text-white border-[#1A3282] shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#1A3282]/50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      active ? 'bg-white/15 text-[#FFDD00]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">{opt.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 leading-snug ${
                        active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step 2: Simple Level / Special Account Select + Territory Isolation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {roleGroup === 'SISTEM' ? '2. Jenis Akun Khusus DPW' : '2. Tingkatan Wilayah'}
              </label>
              {roleGroup === 'SISTEM' ? (
                <select
                  value={formRole}
                  onChange={(e) => applyRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="SUPER_ADMIN">Super Administrator (Akses Penuh)</option>
                  <option value="WAKIL_BENDAHARA">Wakil Bendahara DPW (Keuangan &amp; Aset)</option>
                  <option value="ADMIN_INVENTORY">Admin Inventory (Gedung DPW 5 Lantai)</option>
                </select>
              ) : (
                <select
                  value={roleLevel}
                  onChange={(e) =>
                    applyRoleChange(buildTerritorialRole(roleGroup, e.target.value as TerritoryLevel))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="DPW">DPW — Provinsi Sulawesi Utara</option>
                  <option value="DPD">DPD — Kabupaten / Kota</option>
                  <option value="DPC">DPC — Kecamatan</option>
                  <option value="DPRT">DPRt — Desa / Kelurahan</option>
                </select>
              )}
            </div>

            {/* DPD Access */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Cakupan DPD (Kabupaten/Kota)
              </label>
              {isGlobalTerritoryRole(formRole) ||
              formRole === 'ADMIN_INVENTORY' ||
              formRole === 'WAKIL_BENDAHARA' ? (
                <input
                  type="text"
                  disabled
                  value={
                    formRole === 'ADMIN_INVENTORY'
                      ? 'GEDUNG KANTOR DPW SULUT (5 LANTAI)'
                      : formRole === 'WAKIL_BENDAHARA'
                      ? 'KEUANGAN DPW & INVENTARIS KANTOR'
                      : 'SEMUA KAB/KOTA SE-SULUT (ALL)'
                  }
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none"
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
              {isDpcScopedRole(formRole) || isDprtScopedRole(formRole) ? (
                <select
                  value={formDpcAccess}
                  onChange={(e) => {
                    setFormDpcAccess(e.target.value);
                    setFormDprtAccess('ALL');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none"
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
              {isDprtScopedRole(formRole) ? (
                <select
                  value={formDprtAccess}
                  onChange={(e) => setFormDprtAccess(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#1A3282] outline-none"
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

          {/* 1-Line Permission Summary */}
          <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[#1A3282]/10 text-[#1A3282] dark:bg-blue-950 dark:text-blue-300 font-bold">
              {getRoleDisplayLabel(formRole)}
            </span>
            <span>&mdash; {getRoleSummary(formRole)}</span>
          </div>

          {isDelegatedAdminRole(formRole) && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2">
              <div className="text-[11px] text-amber-900 dark:text-amber-200">
                <strong className="block">Mode Admin Kepercayaan / Delegasi Ketua</strong>
                <span>
                  Akun ini mendapat hak pengelolaan data &amp; matriks setingkat Ketua di wilayah terpilih. Kode referral pribadi pengurus ini tetap milik dirinya sendiri, dan kode referral Ketua wilayah tetap terpisah milik Ketua.
                </span>
              </div>
              {setFormDelegatedForKetuaNik && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIK Ketua yang Didelegasikan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formDelegatedForKetuaNik}
                    onChange={(e) => setFormDelegatedForKetuaNik(e.target.value)}
                    placeholder="Kosongkan untuk deteksi otomatis Ketua aktif di wilayah terpilih..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[#FFDD00]" />}
            <span>{editingUserId ? 'Simpan Perubahan' : 'Terbitkan Akun'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

