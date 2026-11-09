import React from 'react';
import { Search, UserPlus } from 'lucide-react';

interface UserFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  onOpenCreateForm: () => void;
}

export const UserFilterToolbar: React.FC<UserFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onOpenCreateForm,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, NIK, username, wilayah..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 dark:text-slate-300"
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
        onClick={onOpenCreateForm}
        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Buat Akun Admin Baru</span>
      </button>
    </div>
  );
};

