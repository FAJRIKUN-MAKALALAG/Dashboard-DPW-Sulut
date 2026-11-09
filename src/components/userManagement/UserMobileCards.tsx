import React from 'react';
import { AppUser } from '../../types';
import { MASTER_SUPER_ADMIN } from '../../services/userService';
import { MapPin, Edit3, Trash2, RefreshCw } from 'lucide-react';

interface UserMobileCardsProps {
  isLoading: boolean;
  users: AppUser[];
  onToggleStatus: (user: AppUser) => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (user: AppUser) => void;
}

const roleBadgeColor: Record<string, string> = {
  SUPER_ADMIN: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  ADMIN_DPW: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  ADMIN_DPD: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
  ADMIN_DPC: 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700',
  ADMIN_DPRT: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  ANGGOTA: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
};

export const UserMobileCards: React.FC<UserMobileCardsProps> = ({
  isLoading,
  users,
  onToggleStatus,
  onEditUser,
  onDeleteUser,
}) => {
  return (
    <div className="block md:hidden">
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <span className="text-xs">Memuat daftar akun admin dari Supabase...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs px-4">
          Tidak ada akun admin yang sesuai dengan pencarian atau filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => {
            const isMaster = user.username === MASTER_SUPER_ADMIN.username || user.username === '7106033003050001';
            const userBadge = roleBadgeColor[user.role] || 'bg-slate-100 text-slate-700';

            return (
              <div
                key={user.id}
                className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Header: Avatar, Nama & Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        user.role === 'SUPER_ADMIN'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
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

                  <span
                    className={`shrink-0 inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${userBadge}`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Detail Box: Username, NIK, Territory */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Username</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400 truncate block">
                      {user.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">NIK Pengurus</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate block">
                      {user.memberNik || user.nomorEkta || '-'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      {user.dpdAccess === 'ALL' ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Seluruh Sulawesi Utara (15 DPD)
                        </span>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {user.dpdAccess}
                          </span>
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
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onToggleStatus(user)}
                    disabled={isMaster}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 active:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 active:bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.isActive ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{user.isActive ? 'Akun Aktif' : 'Non-Aktif'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditUser(user)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {!isMaster && (
                      <button
                        onClick={() => onDeleteUser(user)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

