import React, { useRef, useState } from 'react';
import { Upload, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ExcelUploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  territoryDisplayName: string;
  existingCount: number;
  onClearTerritory: () => void;
  isClearing: boolean;
  isParsing: boolean;
}

export const ExcelUploadZone: React.FC<ExcelUploadZoneProps> = ({
  selectedFile,
  onFileSelect,
  territoryDisplayName,
  existingCount,
  onClearTerritory,
  isClearing,
  isParsing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
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

      {/* Tombol Pembersihan/Hard Delete Data Wilayah sebelum Import Excel */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Hard Delete / Bersihkan Wilayah:
          </span>
          <span className="ml-1 text-[11px]">
            Hapus data pengurus lama di {territoryDisplayName} agar import Excel menjadi bersih tanpa data duplikat/ganda.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowConfirmClear(true)}
          disabled={isClearing || isParsing || existingCount === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Hapus semua data ${existingCount} pengurus di ${territoryDisplayName} agar bersih sebelum import baru`}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Hapus Semua Data Wilayah Ini ({existingCount})</span>
        </button>
      </div>

      {/* Dialog Konfirmasi Hapus Bersih Data Wilayah */}
      {showConfirmClear && (
        <div className="mt-3 p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/50 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">
                Konfirmasi Hard Delete Seluruh Data Pengurus {territoryDisplayName}?
              </p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                Tindakan ini akan menghapus <strong>{existingCount} pengurus</strong> di {territoryDisplayName} dari database (melalui backend) dan layar matriks. Gunakan untuk memastikan tidak ada pengurus duplikat saat mengunggah file Excel baru.
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
              onClick={() => {
                onClearTerritory();
                setShowConfirmClear(false);
              }}
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
  );
};
