import React from 'react';
import { ArrowLeft, CalendarCheck2 } from 'lucide-react';

export interface MonthDrilldownOption {
  ym: string;
  label: string;
  badge?: string;
  hasData?: boolean;
}

interface MonthDrilldownBarProps {
  selectedYear: string;
  focusedMonth: string;
  onSelectMonth: (ym: string) => void;
  months: MonthDrilldownOption[];
  allLabel?: string;
}

export const MonthDrilldownBar: React.FC<MonthDrilldownBarProps> = ({
  selectedYear,
  focusedMonth,
  onSelectMonth,
  months,
  allLabel,
}) => {
  const fullLabel =
    allLabel ||
    (selectedYear === 'ALL'
      ? 'Keseluruhan (2026–Berjalan)'
      : `Keseluruhan Tahun ${selectedYear}`);

  return (
    <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <CalendarCheck2 className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400" />
          <span>Cakupan di Buku {selectedYear === 'ALL' ? 'Semua Tahun' : `Tahun ${selectedYear}`}:</span>
        </span>

        {focusedMonth && (
          <button
            type="button"
            onClick={() => onSelectMonth('')}
            className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke {fullLabel}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSelectMonth('')}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
            focusedMonth === ''
              ? 'bg-[#1A3282] text-white border-[#1A3282] shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {fullLabel}
        </button>

        {months.map((m) => {
          const isActive = focusedMonth === m.ym;
          return (
            <button
              key={m.ym}
              type="button"
              onClick={() => onSelectMonth(isActive ? '' : m.ym)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                  : m.hasData === false
                  ? 'bg-slate-50/60 dark:bg-slate-950/30 text-slate-400 border-slate-200/70 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <span>{m.label}</span>
              {m.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-bold ${
                    isActive
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
