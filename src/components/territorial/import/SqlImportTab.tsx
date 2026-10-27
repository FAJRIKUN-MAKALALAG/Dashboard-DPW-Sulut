import React, { useState } from 'react';
import { Terminal, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface SqlImportTabProps {
  sqlQueryInput: string;
  setSqlQueryInput: (val: string) => void;
  territoryDisplayName: string;
  existingCount: number;
  onClearTerritory: () => void;
  onProcessSql: () => void;
  isClearing: boolean;
  isParsing: boolean;
  onResetResult: () => void;
}

export const SqlImportTab: React.FC<SqlImportTabProps> = ({
  sqlQueryInput,
  setSqlQueryInput,
  territoryDisplayName,
  existingCount,
  onClearTerritory,
  onProcessSql,
  isClearing,
  isParsing,
  onResetResult,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
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
            disabled={isClearing || isParsing || existingCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Hapus semua data ${existingCount} pengurus di ${territoryDisplayName} agar bersih sebelum import baru`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Hapus Semua Data Wilayah Ini ({existingCount})</span>
          </button>
          {sqlQueryInput.trim() && (
            <button
              type="button"
              onClick={() => {
                setSqlQueryInput('');
                onResetResult();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Bersihkan Editor
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onProcessSql}
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
                Tindakan ini akan menghapus <strong>{existingCount} pengurus</strong> di {territoryDisplayName} dari database dan layar matriks. Gunakan jika import sebelumnya gagal/terpotong atau Anda ingin mengulang import SQL dari awal.
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
