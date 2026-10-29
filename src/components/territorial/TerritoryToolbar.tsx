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
  Eye,
  EyeOff,
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
      {/* Search & Status Filter */}
      <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengurus, jabatan, NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Semua ({totalRows})
          </button>
          <button
            onClick={() => setStatusFilter('filled')}
            className={`px-2 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer ${
              statusFilter === 'filled'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Terisi ({filledCount})
          </button>
          <button
            onClick={() => setStatusFilter('empty')}
            className={`px-2 py-1 rounded-md font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer ${
              statusFilter === 'empty'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kosong ({emptyCount})
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {isEditMode ? (
          <>
            <button
              onClick={onAddNewRow}
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer text-blue-600 dark:text-blue-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Baris</span>
            </button>
            <button
              onClick={onSaveToDatabase}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
            <button
              onClick={onResetTemplate}
              title="Pulihkan seluruh kolom/baris susunan pengurus ke template bawaan standar partai"
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-400 hover:border-amber-400 cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onCancelEdit}
              className="btn-white px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
            >
              Batal
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Mode Edit</span>
          </button>
        )}

        {/* Toggle Hide / Show Button for Import, Templates, & Export */}
        <button
          type="button"
          onClick={() => setShowExtraActions(!showExtraActions)}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs border ${
            showExtraActions
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
              : 'btn-white text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={showExtraActions ? 'Sembunyikan tombol import, download template, dan cetak' : 'Tampilkan tombol import, download template, dan cetak'}
        >
          {showExtraActions ? (
            <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{showExtraActions ? 'Hide Tombol' : 'Import & Alat'}</span>
        </button>

        {/* Extra Action Buttons - Can be hidden/shown */}
        {showExtraActions && (
          <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
            <button
              onClick={onOpenImportModal}
              title="Import Susunan Pengurus dari Excel (Pra-tinjau & Validasi Otomatis)"
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Import Excel</span>
            </button>

            <button
              onClick={onDownloadTemplateExcel}
              title={`Download Template Input Excel Lengkap Khusus ${level} (Daftar Seluruh Jabatan Resmi)`}
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Template</span>
            </button>

            {(level === 'DPW' || level === 'DPD') && (
              <>
                <button
                  onClick={onDownloadAdvisoryOnly}
                  title="Download Template Dewan Pertimbangan"
                  className="btn-white flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-300 hover:border-amber-400 cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="text-[11px]">🏛️</span>
                  <span className="hidden sm:inline">Pertimbangan</span>
                </button>

                <button
                  onClick={onDownloadExpertOnly}
                  title="Download Template Dewan Pakar"
                  className="btn-white flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="text-[11px]">🎓</span>
                  <span className="hidden sm:inline">Pakar</span>
                </button>
              </>
            )}

            {onRefreshCloud && (
              <button
                onClick={onRefreshCloud}
                disabled={isRefreshingCloud}
                title="Tarik & sinkronkan ulang seluruh data susunan pengurus langsung dari Supabase live"
                className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${
                    isRefreshingCloud ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">{isRefreshingCloud ? 'Menarik...' : 'Sinkron'}</span>
              </button>
            )}

            <button
              onClick={onOpenPrintModal}
              title="Cetak Berkas Susunan Pengurus Resmi (Format Cetak / PDF dengan Kop Surat & Logo Resmi)"
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cetak/PDF</span>
            </button>

            <button
              onClick={onExportTemplateExcel}
              title="Export Data Susunan Pengurus Saat Ini (.xlsx)"
              className="btn-white flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Ekspor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
