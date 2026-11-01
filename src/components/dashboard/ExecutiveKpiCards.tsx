import React from 'react';
import { UserSession } from '../../types';
import { UserCheck, TrendingUp, Building2, ChevronRight } from 'lucide-react';
import { StructureKpiStats, isDpdMatch } from '../../utils/structureReadinessUtils';
import { SULUT_REGIONS } from '../../data/sulutRegions';

interface ExecutiveKpiCardsProps {
  session?: UserSession;
  totalActive: number;
  totalRegistered: number;
  activePercentage: number;
  totalPengurusBerSk: number;
  totalAnggotaBiasa: number;
  countPengurusDpw: number;
  selectedDpdFilter: string;
  structureKpi: StructureKpiStats;
  onNavigateToMembers: (filterMembership?: 'ALL' | 'PENGURUS' | 'ANGGOTA') => void;
  onOpenStructureModal: (level: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({
  session,
  totalActive,
  totalPengurusBerSk,
  totalAnggotaBiasa,
  countPengurusDpw,
  selectedDpdFilter,
  structureKpi,
  onNavigateToMembers,
  onOpenStructureModal,
  onOpenTerritorialMatrix,
}) => {
  const isSuperAdminOrDpw = !session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
  const isDpdScoped = session?.role === 'ADMIN_DPD';
  const isDpcScoped = session?.role === 'ADMIN_DPC';
  const isDprtScoped = session?.role === 'ADMIN_DPRT';
  const isRegionalScoped = !isSuperAdminOrDpw;

  const currentRegion = React.useMemo(() => {
    const targetDpd = isRegionalScoped ? session?.dpdAccess : (selectedDpdFilter !== 'ALL' ? selectedDpdFilter : undefined);
    if (!targetDpd) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, targetDpd)) || null;
  }, [isRegionalScoped, session?.dpdAccess, selectedDpdFilter]);

  const totalDpcsInDpd = currentRegion?.subdistricts.length || 0;
  const totalDprtsInDpd = currentRegion?.subdistricts.reduce((sum, s) => sum + s.villages.length, 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* Metric 1: Pengurus & Anggota Riil */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#1A3282] dark:border-t-[#21409A] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Pengurus &amp; Anggota Riil
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight"
              data-tabular="true"
            >
              {totalActive.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 truncate max-w-[180px] sm:max-w-none">
              {isDprtScoped
                ? `Kader Desa ${session?.dprtAccess || ''}`
                : isDpcScoped
                ? `Kader Kec. ${session?.dpcAccess || ''}`
                : isDpdScoped
                ? `Kader ${session?.dpdAccess || ''}`
                : 'Total Kader Aktif'}
            </span>
          </div>

          {/* Pemisahan Terpisah: Data Pengurus vs Data Anggota Biasa */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Box 1: Pengurus Ber-SK */}
            <div
              onClick={() => onNavigateToMembers('PENGURUS')}
              className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-all group min-w-0"
              title="Klik untuk membuka data khusus Pengurus Ber-SK"
            >
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between gap-1">
                <span className="truncate">Pengurus SK</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0 text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5" data-tabular="true">
                {totalPengurusBerSk.toLocaleString('id-ID')}
              </div>
              <div className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Struktural SK Terbit
              </div>
            </div>

            {/* Box 2: Anggota Biasa (Basis KTP) */}
            <div
              onClick={() => onNavigateToMembers('ANGGOTA')}
              className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-all group min-w-0"
              title="Klik untuk membuka data khusus Anggota Biasa (Basis KTP)"
            >
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between gap-1">
                <span className="truncate">Anggota KTP</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0 text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5" data-tabular="true">
                {totalAnggotaBiasa.toLocaleString('id-ID')}
              </div>
              <div className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Kader Basis KTP
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateToMembers('ALL')}
          className="btn-white w-full justify-between mt-3 text-xs font-semibold px-3 py-2 rounded-xl flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
        >
          <span className="truncate"><span className="hidden sm:inline">Buka Semua </span>{totalActive.toLocaleString('id-ID')} Kader</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* Metric 2: Tingkat Keterisian Struktur Riil */}
      <div
        onClick={() => {
          const levelToOpen = isDprtScoped ? 'DPRt' : isDpcScoped ? 'DPC' : isDpdScoped ? 'DPD' : 'ALL';
          onOpenStructureModal(levelToOpen);
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#21409A] dark:border-t-blue-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
        title="Klik untuk membuka rincian kelengkapan seluruh struktur organisasi"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>Keterisian Struktur</span>
              <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:underline">
                (Rincian)
              </span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight"
              data-tabular="true"
            >
              {structureKpi.percentage}%
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  structureKpi.percentage >= 100
                    ? 'bg-emerald-500'
                    : structureKpi.percentage > 0
                    ? 'bg-blue-600'
                    : 'bg-slate-400'
                }`}
              />
              {structureKpi.percentage >= 100 ? 'Lengkap' : 'Proses Pengisian'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500 bg-[#1A3282] dark:bg-[#21409A]"
              style={{ width: `${Math.max(2, Math.min(structureKpi.percentage, 100))}%` }}
            />
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>
                <strong className="text-slate-900 dark:text-white font-mono">{structureKpi.totalFilled.toLocaleString('id-ID')}</strong> / {structureKpi.totalRequired.toLocaleString('id-ID')} jabatan terisi
              </span>
              <span className="hidden sm:inline text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white font-medium transition-colors text-[11px]">
                Detail &raquo;
              </span>
            </p>

            {/* Breakdown Per Tingkatan (Clean Minimal Rows) */}
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              {structureKpi.isAllSulut && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenTerritorialMatrix) {
                      onOpenTerritorialMatrix(undefined, undefined, 'DPW');
                    } else {
                      onOpenStructureModal('DPW');
                    }
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-[11px] cursor-pointer transition-colors group/row"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Tingkat DPW Sulut</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {structureKpi.dpwFilled}/{structureKpi.dpwRequired}
                  </span>
                </div>
              )}

              {!isDpcScoped && !isDprtScoped && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetDpd = isRegionalScoped ? session?.dpdAccess : (selectedDpdFilter !== 'ALL' ? selectedDpdFilter : undefined);
                    if (onOpenTerritorialMatrix) {
                      onOpenTerritorialMatrix(targetDpd, undefined, 'DPD');
                    } else {
                      onOpenStructureModal('DPD');
                    }
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-[11px] cursor-pointer transition-colors group/row"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                    <span className="truncate">{isDpdScoped ? `Tingkat DPD ${session?.dpdAccess || ''}` : 'Tingkat DPD Kab/Kota'}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {structureKpi.dpdFilled}/{structureKpi.dpdRequired}
                  </span>
                </div>
              )}

              {!isDprtScoped && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetDpd = isRegionalScoped ? session?.dpdAccess : (selectedDpdFilter !== 'ALL' ? selectedDpdFilter : undefined);
                    const targetDpc = isDpcScoped ? session?.dpcAccess : undefined;
                    if (onOpenTerritorialMatrix) {
                      onOpenTerritorialMatrix(targetDpd, targetDpc, 'DPC');
                    } else {
                      onOpenStructureModal('DPC');
                    }
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-[11px] cursor-pointer transition-colors group/row"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                    <span className="truncate">{isDpcScoped ? `Tingkat DPC Kec. ${session?.dpcAccess || ''}` : 'Tingkat DPC Kecamatan'}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {structureKpi.dpcFilled}/{structureKpi.dpcRequired}
                  </span>
                </div>
              )}

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const targetDpd = isRegionalScoped ? session?.dpdAccess : (selectedDpdFilter !== 'ALL' ? selectedDpdFilter : undefined);
                  const targetDpc = (isDpcScoped || isDprtScoped) ? session?.dpcAccess : undefined;
                  if (onOpenTerritorialMatrix) {
                    onOpenTerritorialMatrix(targetDpd, targetDpc, 'DPRt');
                  } else {
                    onOpenStructureModal('DPRt');
                  }
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-[11px] cursor-pointer transition-colors group/row"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                  <span className="truncate">
                    {isDprtScoped
                      ? `DPRt Desa ${session?.dprtAccess || ''}`
                      : isDpcScoped
                      ? 'DPRt Desa se-Kecamatan'
                      : 'Tingkat DPRt (Desa/Kel)'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                  {structureKpi.dprtFilled}/{structureKpi.dprtRequired}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric 3: Legalitas SK Teritorial */}
      <div
        onClick={() => {
          if (isDprtScoped) {
            if (onOpenTerritorialMatrix) {
              onOpenTerritorialMatrix(session?.dpdAccess, session?.dpcAccess, 'DPRt');
            } else {
              onOpenStructureModal('DPRt');
            }
          } else if (isDpcScoped) {
            if (onOpenTerritorialMatrix) {
              onOpenTerritorialMatrix(session?.dpdAccess, session?.dpcAccess, 'DPC');
            } else {
              onOpenStructureModal('DPC');
            }
          } else if (isDpdScoped) {
            if (onOpenTerritorialMatrix) {
              onOpenTerritorialMatrix(session?.dpdAccess, undefined, 'DPD');
            } else {
              onOpenStructureModal('DPD');
            }
          } else {
            if (onOpenTerritorialMatrix) {
              onOpenTerritorialMatrix(undefined, undefined, 'DPW');
            } else {
              onOpenStructureModal('DPW');
            }
          }
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#FDB813] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
        title="Klik untuk membuka susunan kepengurusan ber-SK"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              {isDprtScoped
                ? 'Struktur DPRt & SK'
                : isDpcScoped
                ? 'Struktur DPC & SK'
                : isDpdScoped
                ? 'Struktur DPD & SK'
                : 'Struktur DPW & SK'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          {/* Big number & Status Badge */}
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight"
              data-tabular="true"
            >
              {isDprtScoped
                ? structureKpi.dprtFilled
                : isDpcScoped
                ? structureKpi.dpcFilled
                : isDpdScoped
                ? structureKpi.dpdFilled
                : countPengurusDpw > 0
                ? countPengurusDpw
                : 15}
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 truncate max-w-[180px] sm:max-w-none">
              {isDprtScoped
                ? structureKpi.dprtFilled >= 9
                  ? 'Lengkap 9/9'
                  : 'Pengurus Ranting'
                : isDpcScoped
                ? structureKpi.dpcFilled >= 17
                  ? 'Formasi Lengkap'
                  : 'Pengurus DPC'
                : isDpdScoped
                ? structureKpi.dpdFilled >= 36
                  ? 'Formasi Lengkap'
                  : 'Pengurus DPD'
                : countPengurusDpw > 0
                ? 'Pengurus DPW'
                : 'DPD Kab/Kota'}
            </span>
          </div>

          {/* Subtitle Teritorial */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {isDprtScoped
                ? `Desa ${session?.dprtAccess || ''} · Kec. ${session?.dpcAccess || ''}`
                : isDpcScoped
                ? `Kec. ${session?.dpcAccess || ''} · ${structureKpi.dprtRequired / 9 || 0} DPRt`
                : isDpdScoped
                ? `${totalDpcsInDpd} DPC Kecamatan · ${totalDprtsInDpd} DPRt Desa`
                : '15 DPD Kab/Kota · 171 DPC · 1.602 DPRt'}
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {isDprtScoped
                  ? 'Keterisian DPRt:'
                  : isDpcScoped
                  ? 'Pengurus Ber-SK Kec:'
                  : isDpdScoped
                  ? 'Pengurus Ber-SK Wilayah:'
                  : 'Total Pengurus Ber-SK:'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                {isDprtScoped
                  ? `${structureKpi.dprtFilled} / 9`
                  : `${totalPengurusBerSk.toLocaleString('id-ID')} Org`}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
          <span>
            {isDprtScoped
              ? 'Buka Matriks DPRt'
              : isDpcScoped
              ? 'Buka Matriks DPC'
              : isDpdScoped
              ? 'Buka Matriks DPD'
              : 'Buka Matriks DPW'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
