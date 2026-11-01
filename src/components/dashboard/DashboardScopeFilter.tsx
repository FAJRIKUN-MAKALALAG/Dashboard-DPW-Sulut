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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl shadow-2xs transition-colors">
      <div className="flex flex-col xs:flex-row xs:items-center gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Lingkup Wilayah:
          </span>
        </div>

        {!canFilterAllSulut ? (
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg max-w-full break-words">
            {session.jabatan} ({session.dpdAccess}
            {session.dpcAccess && session.dpcAccess !== 'ALL' ? ` › Kec. ${session.dpcAccess}` : ''}
            {session.dprtAccess && session.dprtAccess !== 'ALL' ? ` › ${session.dprtAccess}` : ''})
          </span>
        ) : (
          <select
            value={selectedDpdFilter}
            onChange={(e) => onSelectDpdFilter(e.target.value)}
            className="w-full sm:w-auto max-w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer truncate"
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
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium truncate max-w-[200px] sm:max-w-none">
            Filter: <strong>{selectedDpdFilter}</strong>
          </span>
          <button
            onClick={onReset}
            className="btn-white text-xs px-2.5 py-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 font-medium border border-slate-200 dark:border-slate-700"
          >
            Reset ke Semua
          </button>
        </div>
      )}
    </div>
  );
};
