import React from 'react';
import { UserRole, Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
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
} from 'lucide-react';

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

  availableSubdistricts,
  availableVillages,
}) => {
  if (!isFormOpen) return null;

  return (
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
          onClick={onClose}
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

      <form onSubmit={onSave} className="space-y-4">
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
                onClick={() => setShowFormPassword((prev) => !prev)}
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
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{editingUserId ? 'Simpan Perubahan' : 'Terbitkan Akun Admin'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

