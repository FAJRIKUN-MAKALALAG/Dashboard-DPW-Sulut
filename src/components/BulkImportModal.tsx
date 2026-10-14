import React, { useState, useRef } from 'react';
import { Member, UserSession } from '../types';
import {
  downloadEmptyTemplate,
  downloadSampleDataCsv,
  parseUploadedFile,
  ValidationResult,
} from '../utils/excelUtils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  session: UserSession;
  onImportSuccess: (newMembers: Member[], count: number) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  session,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validCount, setValidCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setValidationResults([]);

    try {
      const { results, validCount: vCount, errorCount: eCount } = await parseUploadedFile(
        selectedFile,
        existingMembers
      );

      // If user is Admin DPD, enforce their DPD restriction
      if (session.role === 'ADMIN_DPD' && session.dpdAccess !== 'ALL') {
        results.forEach((res) => {
          if (res.data.dpd && res.data.dpd !== session.dpdAccess) {
            res.isValid = false;
            res.errors.push(
              `Anda hanya memiliki akses untuk ${session.dpdAccess}. Baris ini terdaftar di "${res.data.dpd}".`
            );
          }
        });
      }

      const finalValid = results.filter((r) => r.isValid).length;
      const finalError = results.filter((r) => !r.isValid).length;

      setValidationResults(results);
      setValidCount(finalValid);
      setErrorCount(finalError);
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca berkas. Pastikan format Excel (.xlsx) atau CSV valid.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = () => {
    const validRows = validationResults.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newMembersToInsert: Member[] = validRows.map((r) => ({
      nik: r.data.nik!,
      nomorEKTA: r.data.nomorEKTA!,
      namaLengkap: r.data.namaLengkap!,
      nomorHP: r.data.nomorHP || '-',
      dpd: r.data.dpd!,
      dpc: r.data.dpc || 'Umum',
      dprt: r.data.dprt || 'Umum',
      isPengurus: false,
      tingkatKepengurusan: 'Bukan Pengurus',
      jabatan: r.data.jabatan || 'Anggota Biasa',
      status: r.data.status || 'Aktif',
      tanggalBergabung: r.data.tanggalBergabung || new Date().toISOString().split('T')[0],
      catatanMutasi: 'Diimpor massal via formulir digital.',
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
    }));

    onImportSuccess(newMembersToInsert, validRows.length);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setValidationResults([]);
    setValidCount(0);
    setErrorCount(0);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredDisplayResults = validationResults.filter((r) => {
    if (activeTab === 'valid') return r.isValid;
    if (activeTab === 'errors') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Import Massal Kader Partai NasDem Sulut (Excel / CSV)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shadow database DPW Partai NasDem Sulut · Unggah berkas Excel/CSV kader dengan validasi anti-duplikat NIK.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Onboarding Guide & Template Downloads */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Format Kolom Baku NasDem Sulut</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Format kolom resmi: <strong>No, Jabatan Pengurus, Nama Lengkap (Sesuai KTP), No. NIK, E-KTA NasDem, Email, No Telepon, Sosial Media, DPC Kecamatan</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadEmptyTemplate}
                className="btn-white flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
              <button
                onClick={downloadSampleDataCsv}
                className="btn-white flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Unduh Contoh Data (.csv)</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Zone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/20 dark:bg-slate-950/40 dark:hover:bg-amber-500/5 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <FileSpreadsheet className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Tarik berkas Excel atau CSV ke sini, atau klik untuk memilih
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mendukung .xlsx, .xls, dan .csv (Maksimal 5.000 baris per unggahan)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB · {validationResults.length} baris dianalisis
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline cursor-pointer"
                >
                  Ganti Berkas
                </button>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">Kesalahan Pemrosesan Dokumen:</p>
                    <p>{parseError}</p>
                  </div>
                </div>
              )}

              {/* Validation Summary Pill Bars */}
              {validationResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          activeTab === 'all'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Semua ({validationResults.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('valid')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          activeTab === 'valid'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                        }`}
                      >
                        Valid & Siap Impor ({validCount})
                      </button>
                      <button
                        onClick={() => setActiveTab('errors')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          activeTab === 'errors'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400'
                        }`}
                      >
                        Ditolak / Masalah ({errorCount})
                      </button>
                    </div>

                    <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      Default Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aktif</span>
                    </div>
                  </div>

                  {/* Results Table Preview */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        <tr>
                          <th className="p-2.5 w-12 text-center">Baris</th>
                          <th className="p-2.5">Status Validasi</th>
                          <th className="p-2.5">NIK</th>
                          <th className="p-2.5">Nama Lengkap</th>
                          <th className="p-2.5">DPD (Kab/Kota)</th>
                          <th className="p-2.5">DPC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/50">
                        {filteredDisplayResults.map((res) => (
                          <tr key={res.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 text-center text-slate-400 font-mono">{res.rowNumber}</td>
                            <td className="p-2.5">
                              {res.isValid ? (
                                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Siap Impor</span>
                                </span>
                              ) : (
                                <div className="text-[11px] text-rose-700 dark:text-rose-400 space-y-0.5 font-medium">
                                  {res.errors.map((err, eIdx) => (
                                    <div key={eIdx} className="flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{res.data.nik || '-'}</td>
                            <td className="p-2.5 font-medium text-slate-900 dark:text-white">{res.data.namaLengkap || '-'}</td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">{res.data.dpd || '-'}</td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">{res.data.dpc || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {validCount > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {validCount} data valid siap disimpan dengan status "Aktif"
              </span>
            ) : (
              <span>Unggah berkas untuk memvalidasi data</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-white px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              disabled={validCount === 0 || isParsing}
              onClick={handleCommitImport}
              className="btn-white flex items-center gap-2 px-5 py-2 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm cursor-pointer"
            >
              <span>Simpan {validCount} Data ke Database</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
