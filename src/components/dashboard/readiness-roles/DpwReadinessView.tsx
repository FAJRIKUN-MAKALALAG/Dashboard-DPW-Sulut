import React from 'react';
import { Member } from '../../../types';
import { computeStructureReadiness, computeStructureKpiStats } from '../../../utils/structureReadinessUtils';
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

interface DpwReadinessViewProps {
  members: Member[];
  readinessSummary: ReturnType<typeof computeStructureReadiness>;
  showGuidelines: boolean;
  setShowGuidelines: (v: boolean) => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const DpwReadinessView: React.FC<DpwReadinessViewProps> = ({
  members,
  readinessSummary,
  showGuidelines,
  setShowGuidelines,
  onOpenStructureModal,
  onOpenTerritorialMatrix,
}) => {
  const activeMembers = React.useMemo(
    () => members.filter((m) => m.status === 'Aktif'),
    [members]
  );

  const dpwPengurusCount = React.useMemo(
    () =>
      activeMembers.filter(
        (m) =>
          m.isPengurus &&
          (m.tingkatKepengurusan === 'DPW' ||
            m.positions?.some((p) => p.tingkatKepengurusan === 'DPW'))
      ).length,
    [activeMembers]
  );

  const dpdDpcDprtPengurusCount = Math.max(
    0,
    readinessSummary.totalPengurusBerSk - dpwPengurusCount
  );

  const dpwStructureKpi = React.useMemo(
    () => computeStructureKpiStats(members, 'ALL'),
    [members]
  );

  return (
    <>
      {/* 1. Header Banner Khusus DPW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#FDB813]/15 dark:bg-slate-800 text-[#9E6706] dark:text-[#FDB813] border border-[#FDB813]/40 dark:border-slate-700">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#9E6706] dark:text-[#FDB813]" />
              Kesiapan Struktur DPW
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
              DPW Provinsi Sulawesi Utara (15 DPD Kab/Kota)
            </span>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Status Kepengurusan DPW &amp; Keterisian 15 DPD Se-Sulut
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pemantauan keterisian formasi DPW Provinsi, 36 jabatan di 15 DPD Kabupaten/Kota, penetrasi DPC Kecamatan, dan DPRt Desa se-Sulawesi Utara.
          </p>
        </div>

        {/* Action Buttons DPW */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>{showGuidelines ? 'Tutup Panduan' : 'Panduan SK DPW'}</span>
            {showGuidelines ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {onOpenStructureModal && (
            <button
              onClick={() => onOpenStructureModal('ALL', 'ALL')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengurus Ber-SK DPW/DPD</span>
            </button>
          )}

          {onOpenTerritorialMatrix && (
            <button
              onClick={() => onOpenTerritorialMatrix(undefined, undefined, 'DPW')}
              className="px-3 py-1.5 rounded-lg bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Struktur DPW</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards Khusus DPW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Jumlah Anggota Aktif (DPW Sulut) */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
              1. Jumlah Anggota Aktif (DPW Sulut)
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {readinessSummary.totalMembersActive.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Kader Aktif Se-Sulut</span>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                Total Pengurus Ber-SK:
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {readinessSummary.totalPengurusBerSk.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus Tingkat DPW:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {dpwPengurusCount.toLocaleString('id-ID')} Org
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus DPD, DPC &amp; DPRt:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {dpdDpcDprtPengurusCount.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-500">Anggota Biasa (Basis KTP):</span>
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {readinessSummary.totalAnggotaBiasa.toLocaleString('id-ID')} Org
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kesiapan Formasi DPW & 15 DPD */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
              2. Kesiapan Formasi DPW &amp; 15 DPD
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {readinessSummary.fullyCompletedDpds.length}
              <span className="text-sm sm:text-base text-slate-400 font-normal"> / 15 DPD</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  readinessSummary.fullyCompletedDpds.length === 15
                    ? 'bg-emerald-500'
                    : readinessSummary.fullyCompletedDpds.length > 0
                    ? 'bg-slate-900 dark:bg-blue-400'
                    : 'bg-slate-300'
                }`}
              />
              {readinessSummary.fullyCompletedDpds.length === 15
                ? '15 DPD Lengkap'
                : `${readinessSummary.fullyCompletedDpds.length} DPD Lengkap`}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                Formasi DPW Provinsi:
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {dpwStructureKpi.dpwFilled} / {dpwStructureKpi.dpwRequired} Posisi
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                DPD Lengkap (36 Jabatan):
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {readinessSummary.fullyCompletedDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                DPD Sebagian:
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {readinessSummary.partiallyFilledDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                DPD Kosong:
              </span>
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {readinessSummary.emptyDpds.length} DPD
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Penetrasi DPC & DPRt Se-Sulut */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
              3. Penetrasi DPC &amp; DPRt (Se-Sulut)
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {readinessSummary.completedDpcCount}
              <span className="text-sm sm:text-base text-slate-400 font-normal">
                {' '}
                / {readinessSummary.totalDpcCount}
              </span>
            </span>
            <span className="text-xs text-slate-500">DPC Kecamatan Terdata</span>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Target DPC Se-Sulut:</span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {readinessSummary.totalDpcCount} Kecamatan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Desa Terdata:</span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200">
                {readinessSummary.completedDprtCount} DPRt Desa/Kel
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
              <span>Standar Formasi:</span>
              <span className="font-mono">36 DPD · 17 DPC · 11 DPRt</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
