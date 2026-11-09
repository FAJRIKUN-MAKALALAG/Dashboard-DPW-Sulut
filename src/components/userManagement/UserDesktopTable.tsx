import React from 'react';
import { AppUser } from '../../types';
import { MASTER_SUPER_ADMIN } from '../../services/userService';
import { MapPin, Edit3, Trash2, RefreshCw } from 'lucide-react';

interface UserDesktopTableProps {
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

export const UserDesktopTable: React.FC<UserDesktopTableProps> = ({
  isLoading,
  users,
  onToggleStatus,
  onEditUser,
  onDeleteUser,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
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
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                Tidak ada akun admin yang sesuai dengan pencarian atau filter.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const isMaster = user.username === MASTER_SUPER_ADMIN.username || user.username === '7106033003050001';
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
                      onClick={() => onToggleStatus(user)}
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
                        onClick={() => onEditUser(user)}
                        title="Edit Akun & Hak Akses"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isMaster && (
                        <button
                          onClick={() => onDeleteUser(user)}
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
  );
};

