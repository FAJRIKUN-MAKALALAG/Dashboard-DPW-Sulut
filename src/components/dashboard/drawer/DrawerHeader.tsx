import React from 'react';
import { X, Table, Users } from 'lucide-react';
import { Member, SulutRegion, UserSession } from '../../../types';
import { DpdComplianceInfo } from '../../../utils/structureReadinessUtils';

interface DrawerHeaderProps {
  regionInfo: SulutRegion;
  compliance: DpdComplianceInfo;
  activeMembersCount: number;
  activeKecamatanCount: number;
  filledDprtVillagesCount?: number;
  countDprtMembers: number;
  totalDprtTarget: number;
  leaders: {
    ketua: Member | null;
    sekretaris: Member | null;
    bendahara: Member | null;
  };
  pengurusInRegionCount: number;
  session?: UserSession;
  onClose: () => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  regionInfo,
  compliance,
  activeMembersCount,
  activeKecamatanCount,
  filledDprtVillagesCount,
  countDprtMembers,
  totalDprtTarget,
  leaders,
  pengurusInRegionCount,
  session,
  onClose,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const isDpcScoped = session?.role === 'ADMIN_DPC';
  const isDprtScoped = session?.role === 'ADMIN_DPRT';

  return (
    <>
      {/* 1. Header Title & Status */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 sticky top-0 z-10">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Zona: {regionInfo.zone || 'Sulawesi Utara'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                compliance.isComplete
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : compliance.filledCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isDpcScoped
                ? `Wilayah DPC Kec. ${session?.dpcAccess}`
                : compliance.isComplete
                ? 'Lengkap 36/36'
                : compliance.filledCount > 0
                ? `${compliance.filledCount}/36 Terisi`
                : 'Belum Ada SK'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {isDpcScoped ? `Kecamatan ${session?.dpcAccess} (${regionInfo.name})` : regionInfo.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-none">
            {isDpcScoped
              ? `Pusat data terpadu struktur kepengurusan DPC dan penetrasi DPRt desa di Kecamatan ${session?.dpcAccess}.`
              : 'Pusat data terpadu struktur kepengurusan DPD, DPC kecamatan, dan DPRt desa.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Top Summary & Quick Actions */}
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 space-y-4">
        {/* Quick Metrics Bar */}
        <div className={`grid gap-2.5 text-xs ${isDpcScoped ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kader Aktif</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {activeMembersCount}
            </span>
            <span className="text-[10px] text-slate-500">{isDpcScoped ? `Kec. ${session?.dpcAccess}` : 'Basis KTP Wilayah'}</span>
          </div>

          {!isDpcScoped && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Formasi DPD</span>
              <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                {compliance.filledCount} / {compliance.totalRequired}
              </span>
              <span className="text-[10px] text-slate-500">{compliance.percentage}% Terisi</span>
            </div>
          )}

          {!isDpcScoped && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">DPC Kecamatan</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                {activeKecamatanCount} / {regionInfo.subdistricts.length}
              </span>
              <span className="text-[10px] text-slate-500">Kecamatan Aktif</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">DPRt Ranting</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {filledDprtVillagesCount !== undefined ? `${filledDprtVillagesCount} / ${totalDprtTarget}` : countDprtMembers}
            </span>
            <span className="text-[10px] text-slate-500">
              {filledDprtVillagesCount !== undefined
                ? `Desa/Kel Aktif (${countDprtMembers} Pengurus)`
                : `Dari ${totalDprtTarget} Desa/Kel`}
            </span>
          </div>
        </div>

        {/* Core Leadership Cards (KSB) - Only for DPW/DPD Admin */}
        {!isDpcScoped && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Ketua */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                K
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Ketua DPD</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                  {leaders.ketua?.namaLengkap || (
                    <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                  )}
                </span>
                {leaders.ketua?.nomorSK && (
                  <span className="text-[9.5px] text-slate-500 font-mono truncate block">
                    SK: {leaders.ketua.nomorSK}
                  </span>
                )}
              </div>
            </div>

            {/* Sekretaris */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                S
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sekretaris DPD</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                  {leaders.sekretaris?.namaLengkap || (
                    <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                  )}
                </span>
              </div>
            </div>

            {/* Bendahara */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs">
                B
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bendahara DPD</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                  {leaders.bendahara?.namaLengkap || (
                    <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {onOpenTerritorialMatrix && (
            <button
              type="button"
              onClick={() => {
                if (isDpcScoped) {
                  onOpenTerritorialMatrix(regionInfo.name, session?.dpcAccess, 'DPRt');
                } else {
                  onOpenTerritorialMatrix(regionInfo.name, undefined, 'DPD');
                }
                onClose();
              }}
              className="w-full sm:w-auto justify-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>
                {isDpcScoped
                  ? `Buka Matriks DPRt Kec. ${session?.dpcAccess} & Import`
                  : 'Buka Tabel Matriks & Input Data'}
              </span>
            </button>
          )}

          {onOpenStructureModal && (
            <button
              type="button"
              onClick={() => {
                onOpenStructureModal(regionInfo.name, isDpcScoped ? 'DPC' : 'ALL');
                onClose();
              }}
              className="w-full sm:w-auto justify-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar {pengurusInRegionCount} Pengurus Ber-SK</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
