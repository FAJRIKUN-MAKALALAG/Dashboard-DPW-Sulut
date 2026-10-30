import React from 'react';
import { Member } from '../../../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  ShieldCheck,
  Building2,
  MapPin,
  Table,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface DpcReadinessViewProps {
  dpdName: string;
  dpcName: string;
  activeScopedMembers: Member[];
  activePengurus: Member[];
  dpcScopedStats: {
    totalVillages: number;
    filledVillages: number;
    dpcPengurusCount: number;
  };
  showGuidelines: boolean;
  setShowGuidelines: (v: boolean) => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

/**
 * Tampilan Kesiapan Struktur & KPI khusus untuk Role: ADMIN_DPC (Tingkat Kecamatan DPC).
 * Mudah dicari dan dikonfigurasi khusus untuk level DPC.
 */
export const DpcReadinessView: React.FC<DpcReadinessViewProps> = ({
  dpdName,
  dpcName,
  activeScopedMembers,
  activePengurus,
  dpcScopedStats,
  showGuidelines,
  setShowGuidelines,
  onOpenStructureModal,
  onOpenTerritorialMatrix,
}) => {
  const totalAnggotaBiasa = Math.max(0, activeScopedMembers.length - activePengurus.length);
  const dprtPengurusCount = Math.max(0, activePengurus.length - dpcScopedStats.dpcPengurusCount);

  return (
    <>
      {/* 1. Header Banner Khusus DPC */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400" />
              Kesiapan Struktur DPC
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
              DPC Kecamatan {dpcName} ({dpdName})
            </span>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Status Kepengurusan DPC &amp; Penetrasi DPRt Kec. {dpcName}
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pemantauan keterisian 17 jabatan formasi DPC Kecamatan {dpcName} dan penetrasi pengurus DPRt desa/kelurahan di wilayah {dpdName}.
          </p>
        </div>

        {/* Action Buttons DPC */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{showGuidelines ? 'Tutup Panduan' : 'Panduan SK DPC'}</span>
            {showGuidelines ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {onOpenStructureModal && (
            <button
              onClick={() => onOpenStructureModal(dpdName, 'DPC')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengurus Ber-SK DPC</span>
            </button>
          )}

          {onOpenTerritorialMatrix && (
            <button
              onClick={() => onOpenTerritorialMatrix(dpdName, dpcName, 'DPC')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Struktur DPC</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards Khusus DPC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Jumlah Anggota Aktif DPC */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              1. Jumlah Anggota Aktif DPC
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeScopedMembers.length.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Kader Aktif Riil DPC</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Total Pengurus Ber-SK (Se-DPC):
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {activePengurus.length.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus Tingkat DPC (Kecamatan):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {dpcScopedStats.dpcPengurusCount.toLocaleString('id-ID')} Org
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus Tingkat DPRt (Desa/Kel):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {dprtPengurusCount.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Anggota Biasa DPC (Basis KTP):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {totalAnggotaBiasa.toLocaleString('id-ID')} Org
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kesiapan Formasi DPC */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              2. Kesiapan Formasi DPC
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {dpcScopedStats.dpcPengurusCount}
              <span className="text-sm sm:text-base text-slate-400 font-normal"> / 17</span>
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                dpcScopedStats.dpcPengurusCount >= 17
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : dpcScopedStats.dpcPengurusCount > 0
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {dpcScopedStats.dpcPengurusCount >= 17
                ? 'Lengkap 100%'
                : dpcScopedStats.dpcPengurusCount > 0
                ? 'Sebagian Terisi'
                : 'Belum Ada SK DPC'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Target Formasi DPC:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                17 Jabatan Inti DPC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Pengurus DPC Terdaftar:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {dpcScopedStats.dpcPengurusCount} Pengurus DPC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                Kekosongan Jabatan DPC:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {Math.max(0, 17 - dpcScopedStats.dpcPengurusCount)} Jabatan
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Penetrasi DPRt di DPC */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              3. Penetrasi DPRt (di DPC {dpcName})
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {dpcScopedStats.filledVillages}
              <span className="text-sm sm:text-base text-slate-400 font-normal">
                {' '}
                / {dpcScopedStats.totalVillages}
              </span>
            </span>
            <span className="text-xs text-slate-500">DPRt Basis Desa</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Target DPRt di DPC {dpcName}:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {dpcScopedStats.totalVillages} Desa/Kel
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Ber-Kader:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {dpcScopedStats.filledVillages} Desa/Kel
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
              <span>Standar Formasi DPRt:</span>
              <span className="font-mono">9 Jabatan Inti / DPRt</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

