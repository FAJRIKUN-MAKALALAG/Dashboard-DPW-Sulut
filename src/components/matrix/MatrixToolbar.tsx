import React from 'react';
import { Plus, Download, Upload, CheckCircle2 } from 'lucide-react';

interface MatrixToolbarProps {
  filledCount: number;
  totalRows: number;
  isEditMode: boolean;
  saveSuccessMsg: string | null;
  onAddNewRow: () => void;
  onExportTemplateExcel: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MatrixToolbar: React.FC<MatrixToolbarProps> = ({
  filledCount,
  totalRows,
  isEditMode,
  saveSuccessMsg,
  onAddNewRow,
  onExportTemplateExcel,
  onImportExcel,
}) => {
  const percentage = totalRows > 0 ? Math.round((filledCount / totalRows) * 100) : 0;

  return (
    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-6">
      {/* Keterisian Indicator */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-xs whitespace-nowrap">
          <span className="text-slate-500 dark:text-slate-400">Keterisian: </span>
          <span className="font-bold text-slate-800 dark:text-white font-mono">
            {filledCount}
          </span>
          <span className="text-slate-400"> / </span>
          <span className="font-mono text-slate-600 dark:text-slate-400">{totalRows} Jabatan</span>
          <span className="ml-1.5 font-bold text-blue-600 dark:text-blue-400 font-mono">
            ({percentage}%)
          </span>
        </div>
        <div className="flex-1 min-w-[80px] sm:flex-initial sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {saveSuccessMsg && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveSuccessMsg}</span>
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-3 sm:flex items-center gap-2">
        <button
          onClick={onAddNewRow}
          className="btn-white text-xs px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Tambah kolom / baris data baru untuk jabatan tambahan"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="whitespace-nowrap"><span className="hidden xs:inline">Tambah </span>Baris</span>
        </button>

        <button
          onClick={onExportTemplateExcel}
          className="btn-white text-xs px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Unduh template Excel dengan urutan jabatan resmi"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="whitespace-nowrap"><span className="hidden xs:inline">Unduh </span>Excel</span>
        </button>

        <label
          className="btn-white text-xs px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Unggah berkas Excel susunan pengurus untuk langsung mengisi tabel"
        >
          <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="whitespace-nowrap">Import<span className="hidden xs:inline"> Excel</span></span>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={onImportExcel}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
