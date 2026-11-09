import React from 'react';
import { RefreshCw, PenTool, FileSpreadsheet, FileDown, Printer, X } from 'lucide-react';

interface ExecutiveReportToolbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  showSignaturePanel: boolean;
  setShowSignaturePanel: React.Dispatch<React.SetStateAction<boolean>>;
  orientation: 'portrait' | 'landscape';
  setOrientation: (o: 'portrait' | 'landscape') => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onClose: () => void;
  printDataCountText: string;
}

export const ExecutiveReportToolbar: React.FC<ExecutiveReportToolbarProps> = ({
  onRefresh,
  isRefreshing,
  showSignaturePanel,
  setShowSignaturePanel,
  orientation,
  setOrientation,
  onExportExcel,
  onExportCsv,
  onPrint,
  onClose,
  printDataCountText,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-bold text-slate-900">
          Export &amp; Cetak PDF Data Wilayah
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
          title="Sinkronkan ulang dari database"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sinkron</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowSignaturePanel((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${
            showSignaturePanel
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Atur Tanda Tangan</span>
        </button>

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
          title="Unduh Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
          title="Unduh CSV"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">CSV</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak / Simpan PDF ({printDataCountText})</span>
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

