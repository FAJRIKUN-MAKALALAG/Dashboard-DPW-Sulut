import React from 'react';
import { CalendarDays } from 'lucide-react';

interface YearFilterBarProps {
  selectedYear: string;
  availableYears: string[];
  onChangeYear: (year: string) => void;
  label?: string;
  subtitle?: string;
  compact?: boolean;
}

export const YearFilterBar: React.FC<YearFilterBarProps> = ({
  selectedYear,
  availableYears,
  onChangeYear,
  label = 'Periode Tahun:',
  subtitle,
  compact = false,
}) => {
  const yearsDescending = [...availableYears].sort((a, b) => Number(b) - Number(a));

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 ${
        compact
          ? ''
          : 'px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <CalendarDays className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
          <span>{label}</span>
        </span>

        <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 gap-0.5">
          {yearsDescending.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => onChangeYear(yr)}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                selectedYear === yr
                  ? 'bg-[#1A3282] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/60'
              }`}
            >
              {yr}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChangeYear('ALL')}
            className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
              selectedYear === 'ALL'
                ? 'bg-[#1A3282] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/60'
            }`}
          >
            Semua (2026–Berjalan)
          </button>
        </div>
      </div>

      {subtitle && (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {subtitle}
        </span>
      )}
    </div>
  );
};
