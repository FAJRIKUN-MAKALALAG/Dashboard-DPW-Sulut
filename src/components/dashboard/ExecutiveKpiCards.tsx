import React from 'react';
import { UserSession } from '../../types';
import { UserCheck, TrendingUp, Building2, ChevronRight, MapPin } from 'lucide-react';
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
  totalRegistered,
  activePercentage,
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Pengurus & Anggota Riil (Terpisah Secara Spesifik) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
              Pengurus & Anggota Riil
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight"
              data-tabular="true"
            >
              {totalActive.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 truncate max-w-[200px] sm:max-w-none">
              {isDprtScoped
                ? `Kader Desa ${session?.dprtAccess || ''}`
                : isDpcScoped
                ? `Kader Kec. ${session?.dpcAccess || ''}`
                : isDpdScoped
                ? `Kader ${session?.dpdAccess || ''}`
                : 'Total Kader'}
            </span>
          </div>

          {/* Pemisahan Terpisah: Data Pengurus vs Data Anggota Biasa */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            {/* Box 1: Pengurus Ber-SK */}
            <div
              onClick={() => onNavigateToMembers('PENGURUS')}
              className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all group min-w-0"
              title="Klik untuk membuka data khusus Pengurus Ber-SK"
            >
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide flex items-center justify-between gap-1">
                <span className="truncate">Pengurus SK</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-black text-blue-800 dark:text-blue-200 font-mono mt-1" data-tabular="true">
                {totalPengurusBerSk.toLocaleString('id-ID')}
              </div>
              <div className="text-[9px] sm:text-[9.5px] text-blue-600/80 dark:text-blue-400 mt-0.5 font-medium truncate">
                Struktural SK Terbit
              </div>
            </div>

            {/* Box 2: Anggota Biasa (Basis KTP) */}
            <div
              onClick={() => onNavigateToMembers('ANGGOTA')}
              className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-emerald-400 hover:shadow-xs transition-all group min-w-0"
              title="Klik untuk membuka data khusus Anggota Biasa (Basis KTP)"
            >
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center justify-between gap-1">
                <span className="truncate">Anggota KTP</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-200 font-mono mt-1" data-tabular="true">
                {totalAnggotaBiasa.toLocaleString('id-ID')}
              </div>
              <div className="text-[9px] sm:text-[9.5px] text-emerald-600/80 dark:text-emerald-400 mt-0.5 font-medium truncate">
                Kader Basis KTP
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateToMembers('ALL')}
          className="btn-white w-full justify-between mt-3 text-xs font-semibold px-3 py-2 rounded-xl flex items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
        >
          <span className="truncate">Buka Semua {totalActive.toLocaleString('id-ID')} Kader</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        </button>
      </div>

      {/* Metric 2: Tingkat Keterisian Struktur Riil (Adaptif DPD, DPC, DPRt) */}
      <div
        onClick={() => {
          const levelToOpen = isDprtScoped ? 'DPRt' : isDpcScoped ? 'DPC' : isDpdScoped ? 'DPD' : 'ALL';
          onOpenStructureModal(levelToOpen);
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        title="Klik untuk membuka rincian kelengkapan seluruh struktur organisasi"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>Keterisian Struktur Riil</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 opacity-80 group-hover:underline">
              (Klik Rincian)
            </span>
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
          <span
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight"
            data-tabular="true"
          >
            {structureKpi.percentage}%
          </span>
          <span
            className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border truncate max-w-[190px] sm:max-w-none ${
              structureKpi.percentage >= 100
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                : structureKpi.percentage > 0
                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
            }`}
          >
            {structureKpi.percentage >= 100 ? 'Struktur Lengkap' : 'Belum Lengkap'}
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 shadow-xs ${
              structureKpi.percentage >= 80
                ? 'bg-emerald-500'
                : structureKpi.percentage >= 30
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(2, Math.min(structureKpi.percentage, 100))}%` }}
          ></div>
        </div>

        <div className="mt-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>
              <strong>{structureKpi.totalFilled.toLocaleString('id-ID')}</strong> dari{' '}
              <strong>{structureKpi.totalRequired.toLocaleString('id-ID')}</strong> jabatan terisi
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform text-[11px]">
              Lihat Detail &raquo;
            </span>
          </p>

          {/* Breakdown Per Tingkatan & Badan (Pimpinan, Pertimbangan, Pakar) */}
          <div className="space-y-1.5 pt-1">
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
                className="bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-indigo-950/40 p-1.5 rounded-lg border border-slate-200/60 hover:border-indigo-300 dark:border-slate-700/60 dark:hover:border-indigo-700/60 text-[10px] cursor-pointer transition-colors group/row"
                title="Buka Halaman Susunan Pengurus DPW Sulut"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  <span className="text-blue-700 dark:text-blue-300 group-hover/row:underline flex items-center gap-1">
                    <span>Tingkat DPW Sulut</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </span>
                  <span className="font-mono">{structureKpi.dpwFilled}/{structureKpi.dpwRequired}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-slate-600 dark:text-slate-300">
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Pimpinan: <strong className="text-slate-900 dark:text-white">{structureKpi.dpwBreakdown?.pimpinanFilled || 0}</strong>/{structureKpi.dpwBreakdown?.pimpinanRequired || 36}
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Pertimbangan: <strong>{structureKpi.dpwBreakdown?.pertimbanganFilled || 0}</strong>/{structureKpi.dpwBreakdown?.pertimbanganRequired || 15}
                  </span>
                  <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Pakar: <strong>{structureKpi.dpwBreakdown?.pakarFilled || 0}</strong>/{structureKpi.dpwBreakdown?.pakarRequired || 19}
                  </span>
                </div>
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
                className="bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/70 dark:hover:bg-blue-950/40 p-1.5 rounded-lg border border-slate-200/60 hover:border-blue-300 dark:border-slate-700/60 dark:hover:border-blue-700/60 text-[10px] cursor-pointer transition-colors group/row"
                title="Buka Halaman Susunan Pengurus DPD Kab/Kota"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  <span className="text-blue-700 dark:text-blue-300 group-hover/row:underline flex items-center gap-1">
                    <span>{isDpdScoped ? `Tingkat DPD ${session?.dpdAccess || ''}` : 'Tingkat DPD Kab/Kota'}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </span>
                  <span className="font-mono">{structureKpi.dpdFilled}/{structureKpi.dpdRequired}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-slate-600 dark:text-slate-300">
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Pimpinan: <strong className="text-slate-900 dark:text-white">{structureKpi.dpdBreakdown?.pimpinanFilled || 0}</strong>/{structureKpi.dpdBreakdown?.pimpinanRequired || 0}
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Pertimbangan: <strong>{structureKpi.dpdBreakdown?.pertimbanganFilled || 0}</strong>/{structureKpi.dpdBreakdown?.pertimbanganRequired || 0}
                  </span>
                  <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Pakar: <strong>{structureKpi.dpdBreakdown?.pakarFilled || 0}</strong>/{structureKpi.dpdBreakdown?.pakarRequired || 0}
                  </span>
                </div>
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
                className="bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/70 dark:hover:bg-emerald-950/40 p-1.5 rounded-lg border border-slate-200/60 hover:border-emerald-300 dark:border-slate-700/60 dark:hover:border-emerald-700/60 text-[10px] cursor-pointer transition-colors group/row"
                title="Buka Halaman Susunan Pengurus DPC Kecamatan"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  <span className="text-emerald-700 dark:text-emerald-400 group-hover/row:underline flex items-center gap-1">
                    <span>{isDpcScoped ? `Tingkat DPC Kec. ${session?.dpcAccess || ''}` : 'Tingkat DPC Kecamatan'}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </span>
                  <span className="font-mono">{structureKpi.dpcFilled}/{structureKpi.dpcRequired}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-slate-600 dark:text-slate-300">
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Pimpinan: <strong className="text-slate-900 dark:text-white">{structureKpi.dpcBreakdown?.pimpinanFilled || 0}</strong>/{structureKpi.dpcBreakdown?.pimpinanRequired || 0}
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Pertimbangan: <strong>{structureKpi.dpcBreakdown?.pertimbanganFilled || 0}</strong>/{structureKpi.dpcBreakdown?.pertimbanganRequired || 0}
                  </span>
                  <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Pakar: <strong>{structureKpi.dpcBreakdown?.pakarFilled || 0}</strong>/{structureKpi.dpcBreakdown?.pakarRequired || 0}
                  </span>
                </div>
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
              className="flex items-center justify-between bg-slate-50 hover:bg-purple-50 dark:bg-slate-800/70 dark:hover:bg-purple-950/40 px-2 py-1.5 rounded-lg border border-slate-200/60 hover:border-purple-300 dark:border-slate-700/60 dark:hover:border-purple-700/60 text-[10px] cursor-pointer transition-colors group/row"
              title="Buka Halaman Susunan Pengurus DPRt Ranting Desa"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover/row:text-purple-700 dark:group-hover/row:text-purple-300 flex items-center gap-1">
                <span>
                  {isDprtScoped
                    ? `Tingkat DPRt Desa ${session?.dprtAccess || ''}`
                    : isDpcScoped
                    ? `DPRt Desa se-Kecamatan`
                    : 'Tingkat DPRt (Basis Desa/Kel)'}
                </span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{structureKpi.dprtFilled}/{structureKpi.dprtRequired}</span>
            </div>
          </div>

          {structureKpi.totalEmpty > 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
              *Tersisa {structureKpi.totalEmpty.toLocaleString('id-ID')} jabatan kosong yang belum terisi.
            </p>
          )}
        </div>
      </div>

      {/* Metric 3: Legalitas SK Teritorial (Adaptif DPRt, DPC, DPD, DPW) */}
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        title="Klik untuk membuka susunan kepengurusan ber-SK"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
            {isDprtScoped
              ? 'Struktur DPRt & Legalitas SK'
              : isDpcScoped
              ? 'Struktur DPC & Legalitas SK'
              : isDpdScoped
              ? 'Struktur DPD & Legalitas SK'
              : 'Struktur DPW & Legalitas SK'}
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs group-hover:scale-110 transition-transform">
            <Building2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Big number & Status Badge */}
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
          <span
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight"
            data-tabular="true"
          >
            {isDprtScoped
              ? structureKpi.dprtFilled
              : isDpcScoped
              ? structureKpi.dpcFilled
              : isDpdScoped
              ? structureKpi.dpdFilled
              : countPengurusDpw > 0 ? countPengurusDpw : 15}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 sm:px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 truncate max-w-[190px] sm:max-w-none">
            {isDprtScoped
              ? (structureKpi.dprtFilled >= 9 ? 'Lengkap 9/9' : 'Pengurus Ranting')
              : isDpcScoped
              ? (structureKpi.dpcFilled >= 17 ? 'Formasi Lengkap' : 'Pengurus DPC Ber-SK')
              : isDpdScoped
              ? (structureKpi.dpdFilled >= 36 ? 'Formasi Lengkap' : 'Pengurus DPD Ber-SK')
              : countPengurusDpw > 0 ? 'Pengurus DPW Ber-SK' : 'DPD Kab/Kota'}
          </span>
        </div>

        {/* Subtitle Teritorial */}
        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {isDprtScoped
              ? `Basis Desa ${session?.dprtAccess || ''} · Kec. ${session?.dpcAccess || ''}`
              : isDpcScoped
              ? `Kec. ${session?.dpcAccess || ''} · ${structureKpi.dprtRequired / 9 || 0} DPRt Basis Desa`
              : isDpdScoped
              ? `${totalDpcsInDpd} DPC Kecamatan · ${totalDprtsInDpd} DPRt Basis Desa`
              : '15 DPD · 167 DPC · DPRt Basis Desa'}
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 group-hover:underline text-[10px] font-semibold truncate">
            {isDprtScoped
              ? 'Buka Halaman Susunan Pengurus DPRt »'
              : isDpcScoped
              ? 'Buka Halaman Susunan Pengurus DPC »'
              : isDpdScoped
              ? 'Buka Halaman Susunan Pengurus DPD »'
              : 'Buka Halaman Susunan Pengurus DPW »'}
          </p>
        </div>

        {/* Footer Info Box */}
        <div className="mt-3 pt-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 p-2 border border-indigo-100 dark:border-indigo-900/50 flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
          <span className="truncate">
            {isDprtScoped
              ? 'Keterisian Formasi DPRt:'
              : isDpcScoped
              ? 'Total Pengurus Ber-SK di Kec:'
              : isDpdScoped
              ? 'Total Pengurus Ber-SK di Wilayah Ini:'
              : 'Total Pengurus Ber-SK Se-Sulut:'}
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
            {isDprtScoped
              ? `${structureKpi.dprtFilled} / 9 Jabatan`
              : `${totalPengurusBerSk} Orang`}
          </span>
        </div>
      </div>
    </div>
  );
};
