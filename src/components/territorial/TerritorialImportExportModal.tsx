import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Terminal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Building,
  MapPin,
  Home,
  Sparkles,
} from 'lucide-react';
import { Member, UserSession } from '../../types';
import { GridRowItem } from '../matrix';
import {
  TerritoryContext,
  ParseTerritoryExcelResult,
  parseTerritorialExcelFile,
  alignAndCheckWithTemplate,
  AiTemplateCheckStats,
} from '../../utils/territorial';
import { parseSqlInsertQuery } from '../../utils/sqlQueryParser';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';
import {
  DownloadTemplateCard,
  ExcelUploadZone,
  SqlImportTab,
  ImportComplianceCard,
  ImportPreviewTable,
} from './import';

interface TerritorialImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  territoryContext: TerritoryContext;
  currentRows?: GridRowItem[];
  currentMembers: Member[];
  session?: UserSession;
  onSaveMembersBatch: (newMembers: Member[]) => void;
  onDeleteMembersBatch?: (niksToDelete: string[], territoryLabel: string) => void;
  onSuccessRefresh?: () => void;
}

export const TerritorialImportExportModal: React.FC<TerritorialImportExportModalProps> = ({
  isOpen,
  onClose,
  territoryContext,
  currentRows,
  currentMembers,
  session,
  onSaveMembersBatch,
  onDeleteMembersBatch,
  onSuccessRefresh,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseTerritoryExcelResult | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'filled' | 'empty'>('filled');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeImportTab, setActiveImportTab] = useState<'excel' | 'sql'>('excel');
  const [sqlQueryInput, setSqlQueryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isAiCleaning, setIsAiCleaning] = useState(false);
  const [aiCheckStats, setAiCheckStats] = useState<AiTemplateCheckStats | null>(null);

  const existingTerritoryMembers = currentMembers.filter((m) => {
    if (territoryContext.level === 'DPW') {
      return (
        m.tingkatKepengurusan === 'DPW' ||
        m.dpd === 'Sulawesi Utara' ||
        m.wilayahPenugasan === 'DPW'
      );
    } else if (territoryContext.level === 'DPD') {
      return isDpdMatch(m.dpd, territoryContext.dpd) && m.tingkatKepengurusan === 'DPD';
    } else if (territoryContext.level === 'DPC') {
      return (
        isDpdMatch(m.dpd, territoryContext.dpd) &&
        isDpcMatch(m.dpc, territoryContext.dpc || '') &&
        m.tingkatKepengurusan === 'DPC'
      );
    } else if (territoryContext.level === 'DPRt') {
      return (
        isDpdMatch(m.dpd, territoryContext.dpd) &&
        isDpcMatch(m.dpc, territoryContext.dpc || '') &&
        isDprtMatch(m.dprt, territoryContext.dprt || '') &&
        m.tingkatKepengurusan === 'DPRt'
      );
    }
    return false;
  });

  const handleClearAllTerritoryData = async () => {
    if (!onDeleteMembersBatch || existingTerritoryMembers.length === 0) return;
    setIsClearing(true);
    setParseError(null);
    try {
      const niksToDelete = existingTerritoryMembers.map((m) => m.nik);
      onDeleteMembersBatch(niksToDelete, territoryDisplayName);
      setSubmitSuccess(
        `Berhasil menghapus ${niksToDelete.length} data pengurus lama di ${territoryDisplayName}. Wilayah kini bersih dan siap diimpor ulang!`
      );
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (err: any) {
      console.error('Error clearing territory:', err);
      setParseError(
        'Gagal menghapus data wilayah: ' + (err?.message || 'Terjadi kesalahan sistem.')
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setSubmitSuccess(null);
    setAiCheckStats(null);

    try {
      const result = await parseTerritorialExcelFile(
        file,
        territoryContext,
        currentMembers,
        session?.adminName || 'Admin'
      );
      setParseResult(result);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setParseError(
        err?.message || 'Gagal membaca berkas Excel. Pastikan format tabel sesuai panduan.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessSqlQuery = () => {
    if (!sqlQueryInput.trim()) {
      setParseError('Silakan tempel kueri SQL terlebih dahulu.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    setSubmitSuccess(null);

    try {
      const result = parseSqlInsertQuery(
        sqlQueryInput,
        territoryContext,
        currentMembers,
        session?.adminName || 'Admin'
      );
      setParseResult(result);
      setSubmitSuccess(`Query SQL berhasil diproses! Menemukan ${result.rows.length} baris.`);
    } catch (err: any) {
      console.error('Error parsing SQL query:', err);
      setParseError(
        err?.message || 'Gagal memproses kueri SQL. Pastikan sintaks SQL INSERT valid.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleAiCleanAndCluster = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    setIsAiCleaning(true);
    setParseError(null);
    try {
      const checkRes = alignAndCheckWithTemplate(
        parseResult,
        currentMembers,
        session?.adminName || 'Admin'
      );

      setParseResult({
        ...parseResult,
        rows: checkRes.rows,
        membersToSave: checkRes.membersToSave,
        stats: {
          totalRows: checkRes.stats.totalRows,
          filledRows: checkRes.stats.filledRows,
          emptyRows: checkRes.stats.vacantSlotsCount,
          matchedPositions: checkRes.stats.matchedCount,
          customPositions: checkRes.stats.extraRowsCount,
        },
        dpdPimpinanCompliance: checkRes.dpdPimpinanCompliance,
      });

      setAiCheckStats(checkRes.stats);
    } catch (err: any) {
      console.error('Error during AI template check:', err);
      setParseError(
        'Gagal memeriksa format template: ' + (err?.message || 'Terjadi kesalahan sistem.')
      );
    } finally {
      setIsAiCleaning(false);
    }
  };

  const handleApplyImport = async () => {
    if (!parseResult || parseResult.membersToSave.length === 0) return;

    setIsSubmitting(true);
    try {
      onSaveMembersBatch(parseResult.membersToSave);
      setSubmitSuccess(
        `Berhasil menyimpan ${parseResult.membersToSave.length} data pengurus untuk ${territoryDisplayName} ke database!`
      );
      if (onSuccessRefresh) onSuccessRefresh();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setParseError(
        'Gagal menyimpan pengurus ke database: ' + (err?.message || 'Terjadi kesalahan sistem.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const territoryDisplayName =
    territoryContext.level === 'DPW'
      ? 'DPW Sulawesi Utara'
      : territoryContext.level === 'DPD'
      ? `DPD ${territoryContext.dpd}`
      : territoryContext.level === 'DPC'
      ? `DPC Kec. ${territoryContext.dpc} (${territoryContext.dpd})`
      : `DPRt Desa/Kel. ${territoryContext.dprt} - Kec. ${territoryContext.dpc}`;

  const getLevelIcon = () => {
    switch (territoryContext.level) {
      case 'DPW':
        return <Building2 className="w-5 h-5 text-indigo-500" />;
      case 'DPD':
        return <Building className="w-5 h-5 text-blue-500" />;
      case 'DPC':
        return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'DPRt':
        return <Home className="w-5 h-5 text-amber-500" />;
    }
  };

  const filteredRows = (parseResult?.rows || []).filter((r) => {
    if (filterMode === 'filled' && !r.isFilled) return false;
    if (filterMode === 'empty' && r.isFilled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.namaLengkap.toLowerCase().includes(q) ||
        r.jabatanExcel.toLowerCase().includes(q) ||
        r.nik.toLowerCase().includes(q) ||
        r.subOrg.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {getLevelIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Import Susunan Pengurus
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {territoryContext.level}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Wilayah:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {territoryDisplayName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Card Download Template Options */}
          <DownloadTemplateCard
            territoryContext={territoryContext}
            currentRows={currentRows}
          />

          {/* Tab Pemilihan Sumber Impor: Berkas Excel vs Query SQL Editor */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveImportTab('excel');
                  setParseError(null);
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeImportTab === 'excel'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Metode 1: Unggah Berkas Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveImportTab('sql');
                  setParseError(null);
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeImportTab === 'sql'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4 shrink-0" />
                <span>Metode 2: Tempel Query SQL Editor (INSERT INTO)</span>
              </button>
            </div>

            {/* Tab 1: Unggah Berkas Excel */}
            {activeImportTab === 'excel' ? (
              <ExcelUploadZone
                selectedFile={selectedFile}
                onFileSelect={handleProcessFile}
                territoryDisplayName={territoryDisplayName}
                existingCount={existingTerritoryMembers.length}
                onClearTerritory={handleClearAllTerritoryData}
                isClearing={isClearing}
                isParsing={isParsing}
              />
            ) : (
              /* Tab 2: Tempel Query SQL Editor */
              <SqlImportTab
                sqlQueryInput={sqlQueryInput}
                setSqlQueryInput={setSqlQueryInput}
                territoryDisplayName={territoryDisplayName}
                existingCount={existingTerritoryMembers.length}
                onClearTerritory={handleClearAllTerritoryData}
                onProcessSql={handleProcessSqlQuery}
                isClearing={isClearing}
                isParsing={isParsing}
                onResetResult={() => {
                  setParseResult(null);
                  setParseError(null);
                }}
              />
            )}
          </div>

          {/* Status Loading Parser */}
          {isParsing && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Sedang membaca dan menganalisis berkas Excel pengurus...</span>
            </div>
          )}

          {/* Pesan Kesalahan */}
          {parseError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Membaca Berkas:</p>
                <p>{parseError}</p>
              </div>
            </div>
          )}

          {/* Hasil Parse & Ringkasan KPI */}
          {parseResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    Total Baris Terbaca
                  </span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {parseResult.stats.totalRows}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">
                    Pengurus Terisi (Nama)
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {parseResult.stats.filledRows}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 block font-medium">
                    Cocok Template Resmi
                  </span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {parseResult.stats.matchedPositions}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 block font-medium">
                    Posisi Tambahan / Kustom
                  </span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {parseResult.stats.customPositions}
                  </span>
                </div>
              </div>

              {/* Status Formasi DPD Bagian A */}
              <ImportComplianceCard
                dpdPimpinanCompliance={parseResult.dpdPimpinanCompliance}
              />

              {/* AI Smart Clean & Cluster Action Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Pembersihan Cerdas & Clustering (Gemini AI)</span>
                      <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded">
                        Opsi B (Supabase Edge)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight mt-0.5">
                      Otomatis memisahkan Dewan Pertimbangan & Dewan Pakar, menormalkan typo jabatan
                      ke 36 slot baku, dan merapikan nama pengurus.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiCleanAndCluster}
                  disabled={isAiCleaning || !parseResult || parseResult.rows.length === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
                >
                  {isAiCleaning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Memeriksa & Menyelaraskan Template...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {aiCheckStats
                          ? '✓ Cek & Rapikan Ulang Format Template'
                          : '✨ AI Check & Clear: Paskan Urutan Sesuai Template'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Hasil AI Check & Clear Format */}
              {aiCheckStats && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/90 to-blue-50/90 dark:from-emerald-950/40 dark:to-blue-950/40 border border-emerald-300 dark:border-emerald-800/60 space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Hasil Pemeriksaan & Penyelarasan Template:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                      🏛️ {aiCheckStats.pertimbanganCount} Dewan Pertimbangan (Terurut)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200">
                      🎓 {aiCheckStats.pakarCount} Dewan Pakar (Terurut)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200">
                      👔{' '}
                      {aiCheckStats.standardSlotsTarget - aiCheckStats.vacantSlotsCount} /{' '}
                      {aiCheckStats.standardSlotsTarget} Dewan Pimpinan Baku Terisi
                    </span>
                    {aiCheckStats.vacantSlotsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200">
                        ⚠️ {aiCheckStats.vacantSlotsCount} Jabatan Kurang (Disisipkan Kosong Sesuai Urutan Baku)
                      </span>
                    )}
                    {aiCheckStats.extraRowsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-200">
                        ➕ {aiCheckStats.extraRowsCount} Jabatan Tambahan (Urutan 37+)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tabel Preview */}
              <ImportPreviewTable
                filteredRows={filteredRows}
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filledRowsCount={parseResult.stats.filledRows}
                totalRowsCount={parseResult.stats.totalRows}
                emptyRowsCount={parseResult.stats.emptyRows}
              />
            </div>
          )}

          {/* Sukses Alert */}
          {submitSuccess && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{submitSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {parseResult ? (
              <span>
                Siap mengimpor{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {parseResult.membersToSave.length}
                </strong>{' '}
                pengurus ke database Supabase
              </span>
            ) : (
              <span>Silakan pilih berkas Excel pengurus terlebih dahulu</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg btn-white cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleApplyImport}
              disabled={!parseResult || parseResult.membersToSave.length === 0 || isSubmitting}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ${
                parseResult && parseResult.membersToSave.length > 0 && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Simpan Data ({parseResult?.membersToSave.length || 0})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritorialImportExportModal;
