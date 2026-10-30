import React from 'react';
import { Member } from '../../../types';
import { getMemberSubOrgCategory } from '../../../utils/structureReadinessUtils';
import {
  CheckCircle2,
  AlertTriangle,
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

interface DpdReadinessViewProps {
  dpdName: string;
  activeScopedMembers: Member[];
  activePengurus: Member[];
  dpdCompliance: {
    filledCount: number;
    isComplete: boolean;
    percentage: number;
    ksbStatus: {
      ketua: boolean;
      sekretaris: boolean;
      bendahara: boolean;
    };
  } | null;
  regionalTerritoryStats: {
    totalDpcs: number;
    totalDprts: number;
    filledDpcs: number;
    filledDprts: number;
  } | null;
  showGuidelines: boolean;
  setShowGuidelines: (v: boolean) => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

/**
 * Tampilan Kesiapan Struktur & KPI khusus untuk Role: ADMIN_DPD (Tingkat Kabupaten/Kota DPD).
 * Mudah dicari dan dikonfigurasi khusus untuk level DPD.
 */
export const DpdReadinessView: React.FC<DpdReadinessViewProps> = ({
  dpdName,
  activeScopedMembers,
  activePengurus,
  dpdCompliance,
  regionalTerritoryStats,
  showGuidelines,
  setShowGuidelines,
  onOpenStructureModal,
  onOpenTerritorialMatrix,
}) => {
  const totalAnggotaBiasa = Math.max(0, activeScopedMembers.length - activePengurus.length);

  // Pisahkan Pengurus Tingkat DPD (Kab/Kota) vs Pengurus DPC & DPRt (Kecamatan & Desa) agar tidak ambigu
  const pengurusTingkatDpd = React.useMemo(
    () =>
      activePengurus.filter(
        (m) =>
          m.tingkatKepengurusan === 'DPD' ||
          m.positions?.some((p) => p.tingkatKepengurusan === 'DPD') ||
          (!m.tingkatKepengurusan &&
            (!m.dpc || m.dpc === '-' || m.dpc === 'Umum (DPD)'))
      ),
    [activePengurus]
  );

  const pengurusDpcDprtCount = Math.max(0, activePengurus.length - pengurusTingkatDpd.length);

  // Pertimbangan & Pakar khusus tingkat DPD
  const dpdPertimbanganPakarCount = React.useMemo(
    () =>
      pengurusTingkatDpd.filter((m) => {
        const cat = getMemberSubOrgCategory(m);
        return cat === 'PERTIMBANGAN' || cat === 'PAKAR';
      }).length,
    [pengurusTingkatDpd]
  );

  return (
    <>
      {/* 1. Header Banner Khusus DPD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
              Kesiapan Struktur DPD
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
              DPD {dpdName}
            </span>
          </div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Status Kepengurusan DPD &amp; Keterisian Wilayah {dpdName}
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Pemantauan keterisian 36 jabatan formasi DPD Kabupaten/Kota, penetrasi DPC Kecamatan, dan DPRt Desa di {dpdName}.
          </p>
        </div>

        {/* Action Buttons DPD */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{showGuidelines ? 'Tutup Panduan' : 'Panduan SK DPD'}</span>
            {showGuidelines ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {onOpenStructureModal && (
            <button
              onClick={() => onOpenStructureModal(dpdName, 'DPD')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengurus Ber-SK DPD</span>
            </button>
          )}

          {onOpenTerritorialMatrix && (
            <button
              onClick={() => onOpenTerritorialMatrix(dpdName, undefined, 'DPD')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Struktur DPD</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards Khusus DPD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Jumlah Anggota Aktif DPD */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              1. Jumlah Anggota Aktif DPD
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeScopedMembers.length.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Kader Aktif Riil DPD</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Total Pengurus Ber-SK (Se-DPD):
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {activePengurus.length.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus Tingkat DPD (Kab/Kota):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {pengurusTingkatDpd.length.toLocaleString('id-ID')} Org
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 pl-5">
              <span>Pengurus DPC &amp; DPRt (Kec/Desa):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {pengurusDpcDprtCount.toLocaleString('id-ID')} Org
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Anggota Biasa DPD (Basis KTP):</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {totalAnggotaBiasa.toLocaleString('id-ID')} Org
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kesiapan Formasi DPD */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              2. Kesiapan Formasi DPD
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {dpdCompliance?.filledCount || 0}
              <span className="text-sm sm:text-base text-slate-400 font-normal"> / 36</span>
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                dpdCompliance?.isComplete
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : (dpdCompliance?.filledCount || 0) > 0
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {dpdCompliance?.isComplete
                ? 'Lengkap 100%'
                : (dpdCompliance?.filledCount || 0) > 0
                ? 'Sebagian Terisi'
                : 'Belum Terisi SK'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Dewan Pimpinan DPD (36 Posisi):
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {dpdCompliance?.filledCount || 0} / 36 Terisi
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Pertimbangan &amp; Pakar DPD:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {dpdPertimbanganPakarCount} Org
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Status KSB Inti DPD:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                K: {dpdCompliance?.ksbStatus?.ketua ? '✓' : '—'} · S:{' '}
                {dpdCompliance?.ksbStatus?.sekretaris ? '✓' : '—'} · B:{' '}
                {dpdCompliance?.ksbStatus?.bendahara ? '✓' : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Penetrasi DPC & DPRt (Wilayah DPD) */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300">
              3. Penetrasi DPC &amp; DPRt (Wilayah DPD)
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {regionalTerritoryStats?.filledDpcs || 0}
              <span className="text-sm sm:text-base text-slate-400 font-normal">
                {' '}
                / {regionalTerritoryStats?.totalDpcs || 0}
              </span>
            </span>
            <span className="text-xs text-slate-500">DPC Kecamatan Terdata</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Target DPC di {dpdName}:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {regionalTerritoryStats?.totalDpcs || 0} Kecamatan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">DPRt Basis Desa:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {regionalTerritoryStats?.filledDprts || 0} / {regionalTerritoryStats?.totalDprts || 0} Desa
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400">
              <span>Standar Formasi DPD:</span>
              <span className="font-mono">36 DPD · 17 DPC · 9 DPRt</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

