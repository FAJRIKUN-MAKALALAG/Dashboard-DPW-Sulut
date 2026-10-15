import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Search,
  Filter,
  Check,
  Building2,
  Building,
  MapPin,
  Home,
  Sparkles,
  FileText,
  Loader2,
  Terminal,
  Code2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Member, UserSession } from '../../types';
import { GridRowItem } from '../matrix';
import {
  TerritoryContext,
  ParseTerritoryExcelResult,
  downloadTerritorialExcelTemplate,
  downloadAdvisoryOnlyExcelTemplate,
  downloadExpertOnlyExcelTemplate,
  downloadAdvisoryAndExpertExcelTemplate,
  downloadMassAdvisoryOnlyExcelTemplateAllDpds,
  downloadMassExpertOnlyExcelTemplateAllDpds,
  downloadMassAdvisoryAndExpertExcelTemplateAllDpds,
  parseTerritorialExcelFile,
  getTerritoryFilename,
} from '../../utils/territorialExcelTemplateUtils';
import { parseSqlInsertQuery } from '../../utils/sqlQueryParser';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';

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
  const [dragActive, setDragActive] = useState(false);
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil daftar pengurus yang saat ini ada di wilayah target ini
  const existingTerritoryMembers = currentMembers.filter((m) => {
    if (territoryContext.level === 'DPW') {
      return (
        m.tingkatKepengurusan === 'DPW' ||
        m.dpd === 'Sulawesi Utara' ||
        m.wilayahPenugasan === 'DPW' ||
        m.wilayahPenugasan?.includes('DPW') ||
        (m.isPengurus && (m.dpd === 'Sulawesi Utara' || !m.dpd))
      );
    } else if (territoryContext.level === 'DPD') {
      return (
        isDpdMatch(m.dpd, territoryContext.dpd) &&
        (m.tingkatKepengurusan === 'DPD' ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD' || !m.dpc || m.dpc === '-')) ||
          (m.isPengurus && (m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)' || !m.dpc || m.dpc === '-')))
      );
    } else if (territoryContext.level === 'DPC') {
      return (
        isDpdMatch(m.dpd, territoryContext.dpd) &&
        isDpcMatch(m.dpc, territoryContext.dpc || '') &&
        (m.tingkatKepengurusan === 'DPC' ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );
    } else if (territoryContext.level === 'DPRt') {
      return (
        isDpdMatch(m.dpd, territoryContext.dpd) &&
        isDpcMatch(m.dpc, territoryContext.dpc || '') &&
        isDprtMatch(m.dprt, territoryContext.dprt || '') &&
        (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
      );
    }
    return false;
  });

  const handleClearAllTerritoryData = async () => {
    if (existingTerritoryMembers.length === 0) {
      setParseError('Tidak ada data pengurus di wilayah ini untuk dihapus.');
      setShowConfirmClear(false);
      return;
    }

    setIsClearing(true);
    setParseError(null);
    setSubmitSuccess(null);

    try {
      const niksToDelete = existingTerritoryMembers.map((m) => m.nik);
      if (onDeleteMembersBatch) {
        onDeleteMembersBatch(niksToDelete, territoryDisplayName);
      }
      setSubmitSuccess(
        `Semua data (${existingTerritoryMembers.length} pengurus) di ${territoryDisplayName} berhasil dihapus/dibersihkan. Sekarang Anda siap mengimpor kembali kueri SQL yang bersih!`
      );
      setParseResult(null);
      setShowConfirmClear(false);
      if (onSuccessRefresh) onSuccessRefresh();
    } catch (err: any) {
      console.error('Error clearing territory data:', err);
      setParseError(err?.message || 'Gagal menghapus data pengurus wilayah ini.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleProcessSqlQuery = () => {
    if (!sqlQueryInput.trim()) {
      setParseError('Silakan tempel kueri SQL INSERT INTO public.members terlebih dahulu.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setSubmitSuccess(null);

    try {
      const result = parseSqlInsertQuery(
        sqlQueryInput,
        territoryContext,
        currentMembers,
        session?.adminName || 'Admin'
      );
      setParseResult(result);
    } catch (err: any) {
      console.error('Error parsing SQL query:', err);
      setParseError(err?.message || 'Gagal memproses kueri SQL. Pastikan sintaks SQL INSERT valid.');
    } finally {
      setIsParsing(false);
    }
  };

  if (!isOpen) return null;

  // Nama Wilayah untuk Tampilan
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

  // Unduh Template
  const handleDownloadTemplate = () => {
    downloadTerritorialExcelTemplate(territoryContext, currentRows);
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setSubmitSuccess(null);

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
      setParseError(err?.message || 'Gagal membaca berkas Excel. Pastikan format tabel sesuai panduan.');
    } finally {
      setIsParsing(false);
    }
  };

  // Simpan ke Database
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
      setParseError('Gagal menyimpan pengurus ke database: ' + (err?.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rows filter untuk preview
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
                Target Wilayah: <span className="font-semibold text-slate-700 dark:text-slate-200">{territoryDisplayName}</span>
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
          <div className="p-4.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilihan Unduh Template Excel Resmi
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pilih jenis template yang ingin diisi. Mengimpor Dewan Pertimbangan & Dewan Pakar <strong>TIDAK AKAN</strong> menghapus atau mengganggu data Dewan Pimpinan yang sudah lengkap.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Card 1: Khusus Dewan Pertimbangan (100% Terpisah) */}
              {(territoryContext.level === 'DPW' || territoryContext.level === 'DPD') ? (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/25 rounded-xl border border-amber-300 dark:border-amber-900/70 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                      <span className="text-base">🏛️</span>
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Khusus Dewan Pertimbangan
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug mt-1.5">
                      Hanya memuat <strong>Dewan Pertimbangan</strong> (Ketua, Wakil Ketua, Sekretaris, Anggota). Baris berurutan rapi 1, 2, 3.. tanpa tercampur dewan lain, memudahkan copy-paste dari SK/dokumen sebelah.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => downloadAdvisoryOnlyExcelTemplate(territoryContext, currentRows)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs transition-colors"
                      title="Download template khusus Dewan Pertimbangan wilayah ini"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dewan Pertimbangan</span>
                    </button>
                    <button
                      onClick={() => downloadMassAdvisoryOnlyExcelTemplateAllDpds()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 cursor-pointer transition-colors"
                      title="Download template Dewan Pertimbangan untuk SELURUH 15 DPD se-Sulut (60 baris berurutan)"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Masal 15 DPD (Pertimbangan Saja)</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Card 2: Khusus Dewan Pakar (100% Terpisah) */}
              {(territoryContext.level === 'DPW' || territoryContext.level === 'DPD') ? (
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/25 rounded-xl border border-emerald-300 dark:border-emerald-900/70 flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                      <span className="text-base">🎓</span>
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Khusus Dewan Pakar
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug mt-1.5">
                      Hanya memuat <strong>Dewan Pakar</strong> (Ketua, Wakil Ketua, Sekretaris, Anggota). Baris berurutan 1, 2, 3.. terisolasi khusus pakar agar penginput tidak bingung saat salin tempel data.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => downloadExpertOnlyExcelTemplate(territoryContext, currentRows)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                      title="Download template khusus Dewan Pakar wilayah ini"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dewan Pakar</span>
                    </button>
                    <button
                      onClick={() => downloadMassExpertOnlyExcelTemplateAllDpds()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 cursor-pointer transition-colors"
                      title="Download template Dewan Pakar untuk SELURUH 15 DPD se-Sulut (60 baris berurutan)"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Masal 15 DPD (Pakar Saja)</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Card 3: Pilihan 2 Sheet & Template Lengkap */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    <span className="text-base">📑</span>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      Gabungan & Masal Lainnya
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1.5">
                    Format 2 lembar kerja (Sheet 1: Dewan Pertimbangan | Sheet 2: Dewan Pakar) atau template komplit seluruh struktur.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {(territoryContext.level === 'DPW' || territoryContext.level === 'DPD') && (
                    <>
                      <button
                        onClick={() => downloadAdvisoryAndExpertExcelTemplate(territoryContext, currentRows)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                        title="1 Berkas dengan 2 Sheet terpisah: Sheet Dewan Pertimbangan & Sheet Dewan Pakar"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>2 Sheet Terpisah (Wilayah Ini)</span>
                      </button>
                      <button
                        onClick={() => downloadMassAdvisoryAndExpertExcelTemplateAllDpds()}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer transition-colors"
                        title="1 Berkas Masal 15 DPD dengan 2 Sheet terpisah"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>2 Sheet Masal 15 DPD</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                    title="Unduh seluruh struktur resmi jabatan"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template Lengkap (Semua Posisi)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Pemilihan Sumber Impor: Berkas Excel vs Query SQL Editor */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveImportTab('excel');
                  setParseError(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeImportTab === 'excel'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Metode 1: Unggah Berkas Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveImportTab('sql');
                  setParseError(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeImportTab === 'sql'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Metode 2: Tempel Query SQL Editor (INSERT INTO)</span>
              </button>
            </div>

            {/* Konten Tab 1: Unggah Berkas Excel */}
            {activeImportTab === 'excel' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Unggah Berkas Excel Pengurus yang Sudah Diisi:
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas atau seret ke sini'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mendukung format .xlsx, .xls, atau .csv (Sistem akan mencocokkan singkatan jabatan secara cerdas)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Konten Tab 2: Tempel Query SQL Editor */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tempel Kueri SQL (INSERT INTO public.members ...):
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Mendukung penandaan 'DEWAN PERTIMBANGAN' & 'DEWAN PAKAR' otomatis
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={8}
                    value={sqlQueryInput}
                    onChange={(e) => setSqlQueryInput(e.target.value)}
                    placeholder={`INSERT INTO public.members (
  nik, nomor_ekta, nama_lengkap, nomor_hp, email, sosmed,
  dpd, dpc, dprt, is_pengurus, tingkat_kepengurusan, wilayah_penugasan,
  nomor_sk, tanggal_sk, jabatan, status, tanggal_bergabung, catatan_mutasi, diubah_oleh
) VALUES
  ('KOTAMOBAGU-DPD-001', NULL, 'Hi. Londa Simbala, BA RN.DE', NULL, NULL, NULL, 'Kota Kotamobagu', 'Wilayah DPD', 'Pusat/Umum', TRUE, 'DPD', 'DEWAN PERTIMBANGAN', 'SK-DPD-KOTAMOBAGU/2026', '2026-01-15', 'Ketua', 'Aktif', '2026-01-15', 'Pengurus resmi', 'Import Susunan DPD'),
  ('KOTAMOBAGU-DPD-004', NULL, 'Kamran Mukhtar Podomi, ST', NULL, NULL, NULL, 'Kota Kotamobagu', 'Wilayah DPD', 'Pusat/Umum', TRUE, 'DPD', 'DEWAN PAKAR', 'SK-DPD-KOTAMOBAGU/2026', '2026-01-15', 'Ketua', 'Aktif', '2026-01-15', 'Pengurus resmi', 'Import Susunan DPD');`}
                    className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(true)}
                      disabled={isClearing || isParsing || existingTerritoryMembers.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`Hapus semua data ${existingTerritoryMembers.length} pengurus di ${territoryDisplayName} agar bersih sebelum import baru`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Hapus Semua Data Wilayah Ini ({existingTerritoryMembers.length})</span>
                    </button>
                    {sqlQueryInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSqlQueryInput('');
                          setParseResult(null);
                          setParseError(null);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                      >
                        Bersihkan Editor
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessSqlQuery}
                    disabled={isParsing || !sqlQueryInput.trim()}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors ${
                      sqlQueryInput.trim() && !isParsing
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>⚡ Proses & Muat Query SQL</span>
                  </button>
                </div>

                {/* Dialog Konfirmasi Hapus Bersih Data Wilayah */}
                {showConfirmClear && (
                  <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/50 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-900 dark:text-rose-200">
                        <p className="font-bold">
                          Konfirmasi Bersihkan Seluruh Data Pengurus {territoryDisplayName}?
                        </p>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                          Tindakan ini akan menghapus <strong>{existingTerritoryMembers.length} pengurus</strong> di {territoryDisplayName} dari database dan layar matriks. Gunakan jika import sebelumnya gagal/terpotong atau Anda ingin mengulang import SQL dari awal.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(false)}
                        disabled={isClearing}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllTerritoryData}
                        disabled={isClearing}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isClearing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            <span>Ya, Hapus Semua Data Wilayah Ini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              {/* Statistik Ringkas */}
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

              {/* Filter & Search Bar Tabel Preview */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setFilterMode('filled')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      filterMode === 'filled'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Hanya Yang Terisi ({parseResult.stats.filledRows})
                  </button>
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      filterMode === 'all'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Semua ({parseResult.stats.totalRows})
                  </button>
                  <button
                    onClick={() => setFilterMode('empty')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      filterMode === 'empty'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Posisi Kosong ({parseResult.stats.emptyRows})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau jabatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tabel Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 w-10">No</th>
                      <th className="py-2 px-3">Jabatan di Excel</th>
                      <th className="py-2 px-3">Nama Lengkap & Gelar</th>
                      <th className="py-2 px-3">No. NIK</th>
                      <th className="py-2 px-3">Kesesuaian Template</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                          Tidak ada baris yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={r.isFilled ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400'}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {r.no}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            <div>
                              <span>{r.jabatanExcel}</span>
                              {r.dpd && (
                                <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                  {r.dpd} · {r.subOrg}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {r.namaLengkap ? (
                              <span className="font-semibold text-blue-700 dark:text-blue-300">
                                {r.namaLengkap}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">(Belum Terisi)</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {r.nik || '-'}
                          </td>
                          <td className="py-2 px-3">
                            {r.isMatched ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                <Check className="w-3 h-3" /> Cocok Template
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                                <Sparkles className="w-3 h-3" /> Posisi Kustom
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
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
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg btn-white cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleApplyImport}
              disabled={!parseResult || parseResult.membersToSave.length === 0 || isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ${
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
                    Simpan & Terapkan Data ({parseResult?.membersToSave.length || 0})
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
