import React from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react';

interface TerritorialPrintToolbarProps {
  activeLevel: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  setActiveLevel: (lvl: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  isSameAsInitialContext: boolean;
  filterMode: 'all' | 'filled';
  setFilterMode: (mode: 'all' | 'filled') => void;
  filledRowsCount: number;
  totalSlotsCount: number;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  orientation: 'portrait' | 'landscape';
  setOrientation: (o: 'portrait' | 'landscape') => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onClose: () => void;
  selectedPrintCount: number;
}

export const TerritorialPrintToolbar: React.FC<TerritorialPrintToolbarProps> = ({
  activeLevel,
  setActiveLevel,
  isSameAsInitialContext,
  filterMode,
  setFilterMode,
  filledRowsCount,
  totalSlotsCount,
  showSettings,
  setShowSettings,
  orientation,
  setOrientation,
  onExportExcel,
  onPrint,
  onClose,
  selectedPrintCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-slate-900 mr-1">Cetak Struktur:</span>

        {/* Level Switcher (DPW, DPD, DPC, DPRt) */}
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          {(['DPW', 'DPD', 'DPC', 'DPRt'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setActiveLevel(lvl)}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                activeLevel === lvl
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {isSameAsInitialContext && (
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('filled')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                filterMode === 'filled'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terisi ({filledRowsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Slot ({totalSlotsCount})
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${
            showSettings
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Atur Tanda Tangan</span>
          {showSettings ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setOrientation('portrait')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
              orientation === 'portrait'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tegak
          </button>
          <button
            type="button"
            onClick={() => setOrientation('landscape')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
              orientation === 'landscape'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mendatar
          </button>
        </div>

        <button
          type="button"
          onClick={onExportExcel}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak / Simpan PDF ({selectedPrintCount})</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

