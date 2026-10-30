import React from 'react';
import {
  Search,
  ChevronRight,
  Table,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Users,
  Layers,
} from 'lucide-react';
import { Member } from '../../../types';
import { isDefinitiveLeader, sortMembersByHierarchy } from '../../../utils/jobMatchingUtils';

export interface VillageStat {
  name: string;
  cadres: Member[];
  pengurus: Member[];
  isFilled: boolean;
}

export interface SubdistrictDetail {
  subdistrict: {
    name: string;
    villages: string[];
  };
  dpcReadiness?: {
    status: string;
    totalFilled: number;
  };
  subMembers: Member[];
  pengurusDpc: Member[];
  villageStats: VillageStat[];
  filledVillagesCount: number;
  totalVillagesCount: number;
  villageCoveragePercentage: number;
}

interface DpcSubdistrictsTabProps {
  regionName: string;
  subdistrictDetails: SubdistrictDetail[];
  dpcSearchTerm: string;
  setDpcSearchTerm: (term: string) => void;
  selectedDpcForDrilldown: string | null;
  setSelectedDpcForDrilldown: (dpc: string | null) => void;
  activeSubDetail: SubdistrictDetail | null;
  dprtSearchTerm: string;
  setDprtSearchTerm: (term: string) => void;
  onSwitchToDprt?: (dpcName: string) => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onClose: () => void;
}

export const DpcSubdistrictsTab: React.FC<DpcSubdistrictsTabProps> = ({
  regionName,
  subdistrictDetails,
  dpcSearchTerm,
  setDpcSearchTerm,
  selectedDpcForDrilldown,
  setSelectedDpcForDrilldown,
  activeSubDetail,
  onSwitchToDprt,
  onOpenTerritorialMatrix,
  onClose,
}) => {
  const isDrilledDown = Boolean(selectedDpcForDrilldown && activeSubDetail);

  return (
    <div
      key={isDrilledDown ? `dpc-detail-${selectedDpcForDrilldown}` : 'all-dpc-list'}
      className="animate-tab-enter space-y-3"
    >
      {!isDrilledDown ? (
        /* LEVEL 1: GRID OF ALL DPC KECAMATAN */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Daftar {subdistrictDetails.length} DPC Kecamatan se-{regionName}
              </span>
              <span className="text-[11px] text-slate-500">
                Menampilkan kesiapan formasi 17 jabatan inti pengurus tingkat DPC Kecamatan. Klik kartu untuk melihat susunan pengurus DPC.
              </span>
            </div>

            {onOpenTerritorialMatrix && (
              <button
                type="button"
                onClick={() => {
                  onOpenTerritorialMatrix(regionName, undefined, 'DPC');
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Buka matriks DPC se-kabupaten"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Matriks DPC (Semua Kec.)</span>
              </button>
            )}
          </div>

          {/* Search Kecamatan */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama DPC kecamatan..."
              value={dpcSearchTerm}
              onChange={(e) => setDpcSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Grid of DPC Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subdistrictDetails
              .filter((item) =>
                item.subdistrict.name.toLowerCase().includes(dpcSearchTerm.toLowerCase())
              )
              .map((item) => {
                const {
                  subdistrict,
                  dpcReadiness,
                  subMembers,
                  pengurusDpc,
                  filledVillagesCount,
                  totalVillagesCount,
                } = item;

                const dpcFilledCount = dpcReadiness?.totalFilled ?? pengurusDpc.length;
                const dpcPct = Math.min(100, Math.round((dpcFilledCount / 17) * 100));

                return (
                  <div
                    key={subdistrict.name}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-2xs space-y-2.5 group"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          DPC Kec. {subdistrict.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pengurusDpc.length} Pengurus DPC · {totalVillagesCount} Desa/Kel
                        </span>
                      </div>

                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          dpcReadiness?.status === 'LENGKAP' || dpcFilledCount >= 17
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : dpcFilledCount > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {dpcReadiness?.status === 'LENGKAP' || dpcFilledCount >= 17
                          ? '✓ Lengkap (17/17)'
                          : dpcFilledCount > 0
                          ? `${dpcFilledCount}/17 Jabatan DPC`
                          : 'Belum Ada SK DPC'}
                      </span>
                    </div>

                    {/* Ketua DPC Banner */}
                    {(() => {
                      const ketuaDpc = pengurusDpc.find((m) => isDefinitiveLeader(m.jabatan));
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 font-mono shrink-0 shadow-2xs">
                            #1
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">Ketua DPC:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                            {ketuaDpc ? (
                              ketuaDpc.namaLengkap
                            ) : (
                              <span className="italic font-normal text-slate-400">Belum terdata</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Progress of DPC 17 Formasi */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="text-slate-500">Formasi Pengurus DPC:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {dpcFilledCount} / 17 ({dpcPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            dpcPct >= 100
                              ? 'bg-emerald-500'
                              : dpcPct > 0
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ width: `${Math.max(dpcPct, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Mini metrics bar */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                      <span>Cakupan DPRt: {filledVillagesCount}/{totalVillagesCount} Desa</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {subMembers.length} Kader
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDpcForDrilldown(subdistrict.name)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title={`Lihat daftar pengurus DPC Kec. ${subdistrict.name}`}
                      >
                        <span>Pengurus DPC ({pengurusDpc.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {onOpenTerritorialMatrix && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenTerritorialMatrix(regionName, subdistrict.name, 'DPC');
                            onClose();
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Buka matriks DPC & import Excel"
                        >
                          <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Matriks DPC</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* LEVEL 2: DRILLDOWN INTO SELECTED DPC'S PENGURUS STRUCTURE */
        activeSubDetail && (
          <div className="space-y-3">
            {/* Top Breadcrumb & Action Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDpcForDrilldown(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>&larr; Kembali ke Daftar 17 DPC Kecamatan</span>
                </button>

                <div className="flex items-center gap-2">
                  {onSwitchToDprt && (
                    <button
                      type="button"
                      onClick={() => onSwitchToDprt(activeSubDetail.subdistrict.name)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Lihat {activeSubDetail.totalVillagesCount} DPRt Desa</span>
                    </button>
                  )}

                  {onOpenTerritorialMatrix && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTerritorialMatrix(regionName, activeSubDetail.subdistrict.name, 'DPC');
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Buka matriks DPC Kecamatan ini untuk kelola pengurus & import Excel"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Matriks DPC & Import</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Info Banner */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Susunan Pengurus DPC Kecamatan {activeSubDetail.subdistrict.name}</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Formasi Tingkat DPC: {activeSubDetail.dpcReadiness?.totalFilled ?? activeSubDetail.pengurusDpc.length} / 17 Jabatan Inti Terisi
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400">
                  {activeSubDetail.pengurusDpc.length} Pengurus DPC Ber-SK
                </span>
              </div>
            </div>

            {/* List of Pengurus DPC in this Subdistrict */}
            {activeSubDetail.pengurusDpc.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Belum ada pengurus tingkat DPC yang terdaftar di Kecamatan {activeSubDetail.subdistrict.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Gunakan tombol Matriks DPC &amp; Import di atas untuk mengisi struktur pengurus DPC kecamatan ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortMembersByHierarchy(activeSubDetail.pengurusDpc).map((m, idx) => (
                  <div
                    key={m.id || `${m.nik}-${idx}`}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          DPC
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
                          {m.jabatan || 'Pengurus DPC'}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {m.namaLengkap}
                      </p>
                      <p className="text-[10.5px] font-mono text-slate-500 truncate">
                        NIK: {m.nik} {m.nomorHP && m.nomorHP !== '-' ? `· ${m.nomorHP}` : ''}
                      </p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
