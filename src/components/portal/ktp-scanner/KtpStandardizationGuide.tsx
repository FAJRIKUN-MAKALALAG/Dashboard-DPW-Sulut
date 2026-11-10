import React, { useState } from 'react';
import {
  ShieldCheck,
  Maximize2,
  Sun,
  Focus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Upload,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { KtpImageQualityReport, ExtractedKtpData } from '../../../utils/ktpOcrUtils';

export const KtpStandardizationGuide: React.FC = () => {
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Mobile View (< md): Compact Collapsible Guide so it never clutters the phone screen */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded((prev) => !prev)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#1A3282] dark:text-slate-300 shrink-0" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              Panduan Foto e-KTP (Posisi Rata, Tanpa Flash, Fokus Tajam)
            </span>
          </div>
          {mobileExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {mobileExpanded && (
          <div className="px-3.5 pb-3 pt-1 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Pastikan ke-4 sudut kartu e-KTP masuk penuh di dalam bingkai kamera.</span>
            </div>
            <div className="flex items-start gap-2">
              <Sun className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Hindari pantulan lampu/flash tepat di atas angka NIK dan Nama.</span>
            </div>
            <div className="flex items-start gap-2">
              <Focus className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>Tahan kamera dengan stabil hingga 16 digit angka NIK terlihat jelas.</span>
            </div>
          </div>
        )}
      </div>

      {/* Tablet & Desktop View (md+): Structured 3-Column Standardization Guide */}
      <div className="hidden md:block p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1A3282] dark:text-slate-300" />
            <span>Standar Kualitas Pemotretan & Unggah e-KTP</span>
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            Pemindaian Otomatis e-KTP
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-[11px]">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">1. Posisi Mendatar & Utuh</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Ke-4 sudut kartu e-KTP masuk penuh di dalam bingkai dan tidak terpotong.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Sun className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">2. Bebas Pantulan Cahaya</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Hindari pantulan lampu/flash di atas tulisan NIK & Nama agar mudah terbaca.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Focus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">3. Fokus Teks Tajam</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Pastikan 16 digit angka NIK dan biodata terlihat jelas dan tidak buram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KtpScannedPreviewCardProps {
  fotoKtpUrl: string;
  qualityReport: KtpImageQualityReport | null;
  extractedData: ExtractedKtpData | null;
  onRetakeCamera: () => void;
  onReplaceFileClick: () => void;
  onClearKtp: () => void;
  onProceedNext: () => void;
}

export const KtpScannedPreviewCard: React.FC<KtpScannedPreviewCardProps> = ({
  fotoKtpUrl,
  qualityReport,
  extractedData,
  onRetakeCamera,
  onReplaceFileClick,
  onClearKtp,
  onProceedNext,
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Gambar KTP Terstandarisasi */}
        <div className="md:col-span-5 lg:col-span-6 space-y-2.5">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[1.585/1]">
            <img
              src={fotoKtpUrl}
              alt="Hasil Scan e-KTP"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-[10px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>e-KTP Terstandarisasi</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onRetakeCamera}
              className="btn-white py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Foto Ulang</span>
            </button>
            <button
              type="button"
              onClick={onReplaceFileClick}
              className="btn-white py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Ganti File</span>
            </button>
            <button
              type="button"
              onClick={onClearKtp}
              className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Kualitas Citra & Hasil Pembacaan */}
        <div className="md:col-span-7 lg:col-span-6 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Hasil Pembacaan Data e-KTP
              </span>
              {qualityReport && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Kualitas Foto: {qualityReport.score}%
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-500 shrink-0">NIK:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-right">
                  {extractedData?.nik || 'Belum terbaca otomatis (isi di Tahap 2)'}
                </span>
              </div>
              <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-500 shrink-0">Nama Lengkap:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right truncate">
                  {extractedData?.namaLengkap || 'Dapat dilengkapi di Tahap 2'}
                </span>
              </div>
              <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-500 shrink-0">TTL / Gender:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">
                  {[
                    extractedData?.tempatLahir,
                    extractedData?.tanggalLahir,
                    extractedData?.jenisKelamin,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '-'}
                </span>
              </div>
              {extractedData?.matchedDpd && (
                <div className="flex justify-between gap-2 py-1">
                  <span className="text-slate-500 shrink-0">Wilayah Terdeteksi:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                    {[extractedData.matchedDpd, extractedData.matchedDpc]
                      .filter(Boolean)
                      .join(' › ')}
                  </span>
                </div>
              )}
            </div>

            {qualityReport && qualityReport.warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                {qualityReport.warnings.map((w, idx) => (
                  <p key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onProceedNext}
            className="w-full py-3 px-4 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <span>Lanjut ke Tahap 2: Periksa & Edit Data Diri</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
