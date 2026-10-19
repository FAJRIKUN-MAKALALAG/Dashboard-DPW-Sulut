import React from 'react';
import { UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { Filter } from 'lucide-react';

interface DashboardScopeFilterProps {
  session?: UserSession;
  selectedDpdFilter: string;
  onSelectDpdFilter: (dpd: string) => void;
  onReset: () => void;
}

export const DashboardScopeFilter: React.FC<DashboardScopeFilterProps> = ({
  session,
  selectedDpdFilter,
  onSelectDpdFilter,
  onReset,
}) => {
  const canFilterAllSulut = !session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl shadow-xs transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Lingkup Wilayah Pantauan:
        </span>

        {!canFilterAllSulut ? (
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded">
            {session.jabatan} ({session.dpdAccess}
            {session.dpcAccess && session.dpcAccess !== 'ALL' ? ` › Kec. ${session.dpcAccess}` : ''}
            {session.dprtAccess && session.dprtAccess !== 'ALL' ? ` › ${session.dprtAccess}` : ''})
          </span>
        ) : (
          <select
            value={selectedDpdFilter}
            onChange={(e) => onSelectDpdFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Seluruh Sulawesi Utara (15 DPD Kab/Kota)</option>
            {SULUT_REGIONS.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {canFilterAllSulut && selectedDpdFilter !== 'ALL' && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded font-medium">
            Filter Terpasang: <strong>{selectedDpdFilter}</strong>
          </span>
          <button
            onClick={onReset}
            className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reset ke Semua
          </button>
        </div>
      )}
    </div>
  );
};
