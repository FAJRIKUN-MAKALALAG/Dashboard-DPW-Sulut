import React from 'react';

export interface UserStats {
  total: number;
  active: number;
  superAdmin: number;
  dpw: number;
  dpd: number;
  dpc: number;
  dprt: number;
}

interface UserStatsRibbonProps {
  stats: UserStats;
}

export const UserStatsRibbon: React.FC<UserStatsRibbonProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-xs">
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold uppercase truncate">Total Akun</span>
        <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono">{stats.total}</span>
      </div>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold uppercase truncate">Aktif</span>
        <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{stats.active}</span>
      </div>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 block font-semibold uppercase truncate">Admin DPW</span>
        <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">{stats.dpw}</span>
      </div>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold uppercase truncate">DPD (Kab)</span>
        <span className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{stats.dpd}</span>
      </div>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 block font-semibold uppercase truncate">DPC (Kec)</span>
        <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">{stats.dpc}</span>
      </div>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 block font-semibold uppercase truncate">DPRt (Desa)</span>
        <span className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">{stats.dprt}</span>
      </div>
    </div>
  );
};

