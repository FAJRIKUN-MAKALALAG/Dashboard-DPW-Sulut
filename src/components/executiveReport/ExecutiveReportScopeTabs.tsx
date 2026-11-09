import React from 'react';
import { ExportScopeMode } from './executiveReportTypes';
import { Member } from '../../types';

interface ExecutiveReportScopeTabsProps {
  exportScope: ExportScopeMode;
  onSelectScope: (scope: ExportScopeMode) => void;
  levelCounts: {
    dpwCount: number;
    dpdCount: number;
    dpcCount: number;
    dprtCount: number;
    allCount: number;
  };
  useCustomSelectionOnly: boolean;
  onToggleCustomSelectionOnly: () => void;
  customSelectedMembers?: Member[] | null;
}

export const ExecutiveReportScopeTabs: React.FC<ExecutiveReportScopeTabsProps> = ({
  exportScope,
  onSelectScope,
  levelCounts,
  useCustomSelectionOnly,
  onToggleCustomSelectionOnly,
  customSelectedMembers,
}) => {
  const tabs: { id: ExportScopeMode; label: string }[] = [
    { id: 'DPW', label: `1. Data DPW (${levelCounts.dpwCount})` },
    { id: 'DPD', label: `2. Data DPD (${levelCounts.dpdCount})` },
    { id: 'DPC', label: `3. Data DPC (${levelCounts.dpcCount})` },
    { id: 'DPRt', label: `4. Data DPRt (${levelCounts.dprtCount})` },
    { id: 'ALL_KADER', label: `5. Semua Kader (${levelCounts.allCount})` },
    { id: 'STATISTICS', label: '6. Rekap 15 DPD' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectScope(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              exportScope === tab.id && !useCustomSelectionOnly
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {customSelectedMembers && customSelectedMembers.length > 0 && (
        <button
          type="button"
          onClick={onToggleCustomSelectionOnly}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
            useCustomSelectionOnly
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          {useCustomSelectionOnly
            ? `Pilihan Tabel Aktif (${customSelectedMembers.length} Orang)`
            : `Gunakan ${customSelectedMembers.length} Pilihan Tabel`}
        </button>
      )}
    </div>
  );
};

