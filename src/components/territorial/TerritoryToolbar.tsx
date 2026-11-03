import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Plus,
  Save,
  RefreshCw,
  Edit3,
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';

interface TerritoryToolbarProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | 'filled' | 'empty';
  setStatusFilter: (s: 'all' | 'filled' | 'empty') => void;
  totalRows: number;
  filledCount: number;
  emptyCount: number;
  isEditMode: boolean;
  setIsEditMode: (m: boolean) => void;
  saveSuccessMsg: string | null;
  onAddNewRow: () => void;
  onSaveToDatabase: () => void;
  onResetTemplate: () => void;
  onCancelEdit: () => void;
  onDownloadTemplateExcel: () => void;
  onDownloadAdvisoryOnly: () => void;
  onDownloadExpertOnly: () => void;
  onRefreshCloud?: () => Promise<void> | void;
  isRefreshingCloud?: boolean;
  onOpenImportModal: () => void;
  onOpenPrintModal: () => void;
  onExportTemplateExcel: () => void;
}

export const TerritoryToolbar: React.FC<TerritoryToolbarProps> = ({
  level,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalRows,
  filledCount,
  emptyCount,
  isEditMode,
  setIsEditMode,
  saveSuccessMsg,
  onAddNewRow,
  onSaveToDatabase,
  onResetTemplate,
  onCancelEdit,
  onDownloadTemplateExcel,
  onDownloadAdvisoryOnly,
  onDownloadExpertOnly,
  onRefreshCloud,
  isRefreshingCloud = false,
  onOpenImportModal,
  onOpenPrintModal,
  onExportTemplateExcel,
}) => {
  const [showExtraActions, setShowExtraActions] = useState<boolean>(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs flex-1">
          <div className="relative flex-1 min-w-[180px] lg:max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pengurus, jabatan, NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Semua ({totalRows})
            </button>
            <button
              onClick={() => setStatusFilter('filled')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                statusFilter === 'filled'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Terisi ({filledCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                statusFilter === 'empty'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
              <span>Belum Terisi ({emptyCount})</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {isEditMode ? (
            <>
              <button
                onClick={onAddNewRow}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Baris</span>
              </button>
              <button
                onClick={onSaveToDatabase}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1A3282] dark:bg-[#21409A] text-white hover:bg-[#21409A] dark:hover:bg-blue-700 shadow-2xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
              <button
                onClick={onResetTemplate}
                title="Pulihkan seluruh kolom/baris susunan pengurus ke template bawaan standar partai"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={onCancelEdit}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1A3282] dark:bg-[#21409A] text-white hover:bg-[#21409A] dark:hover:bg-blue-700 shadow-2xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mode Edit</span>
            </button>
          )}

          {/* Toggle Extra Tools (Import, Template, Cetak, Ekspor) */}
          <button
            type="button"
            onClick={() => setShowExtraActions(!showExtraActions)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors border ${
              showExtraActions
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{showExtraActions ? 'Tutup Alat' : 'Import & Alat'}</span>
          </button>
        </div>
      </div>

      {/* Extra Action Buttons Drawer */}
      {showExtraActions && (
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={onDownloadTemplateExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>

          {(level === 'DPW' || level === 'DPD') && (
            <>
              <button
                onClick={onDownloadAdvisoryOnly}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <span>Template Pertimbangan</span>
              </button>

              <button
                onClick={onDownloadExpertOnly}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <span>Template Pakar</span>
              </button>
            </>
          )}

          {onRefreshCloud && (
            <button
              onClick={onRefreshCloud}
              disabled={isRefreshingCloud}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  isRefreshingCloud ? 'animate-spin' : ''
                }`}
              />
              <span>{isRefreshingCloud ? 'Menarik...' : 'Sinkron Data'}</span>
            </button>
          )}

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={onExportTemplateExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor (.xlsx)</span>
          </button>
        </div>
      )}
    </div>
  );
};
