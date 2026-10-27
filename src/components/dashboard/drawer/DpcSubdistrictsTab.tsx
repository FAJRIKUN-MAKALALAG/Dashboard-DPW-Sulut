import React from 'react';
import { Search, ChevronRight, Table, ArrowLeft, FileSpreadsheet, MapPin } from 'lucide-react';
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
  dprtSearchTerm,
  setDprtSearchTerm,
  onOpenTerritorialMatrix,
  onClose,
}) => {
  return (
    <div key={selectedDpcForDrilldown ? `drilldown-${selectedDpcForDrilldown}` : 'all-dpc'} className="animate-tab-enter space-y-3">
      {!selectedDpcForDrilldown ? (
        /* LEVEL 1: GRID OF ALL DPC KECAMATAN */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Sebaran {subdistrictDetails.length} DPC Kecamatan se-{regionName}
              </span>
              <span className="text-[11px] text-slate-500">
                Klik kecamatan untuk melihat sebaran seluruh DPRt Desa, atau buka Matriks untuk import Excel.
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
              placeholder="Cari nama kecamatan..."
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
                const { subdistrict, dpcReadiness, subMembers, filledVillagesCount, totalVillagesCount, villageCoveragePercentage } = item;

                return (
                  <div
                    key={subdistrict.name}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs space-y-2.5 group"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Kec. {subdistrict.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {totalVillagesCount} Desa/Kelurahan
                        </span>
                      </div>

                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          dpcReadiness?.status === 'LENGKAP'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : (dpcReadiness?.totalFilled || 0) > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {dpcReadiness?.status === 'LENGKAP'
                          ? '✓ Lengkap (17/17)'
                          : (dpcReadiness?.totalFilled || 0) > 0
                          ? `${dpcReadiness?.totalFilled}/17 Terisi`
                          : 'Belum Ada SK'}
                      </span>
                    </div>

                    {/* Ketua DPC Banner */}
                    {(() => {
                      const ketuaDpc =
                        item.pengurusDpc.find((m) => isDefinitiveLeader(m.jabatan)) ||
                        item.subMembers.find((m) => isDefinitiveLeader(m.jabatan));
                      return (
                        <div className="flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 font-mono shrink-0 shadow-2xs">
                            #1
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">Ketua DPC:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                            {ketuaDpc ? ketuaDpc.namaLengkap : <span className="italic font-normal text-slate-400">Belum terdata</span>}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Progress of DPRt coverage */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="text-slate-500">Cakupan DPRt Desa:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {filledVillagesCount} / {totalVillagesCount} ({villageCoveragePercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            villageCoveragePercentage >= 80
                              ? 'bg-emerald-500'
                              : villageCoveragePercentage > 0
                              ? 'bg-blue-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ width: `${Math.max(villageCoveragePercentage, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Mini metrics bar */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                      <span>Kader Riil KTP:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {subMembers.length} Orang
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDpcForDrilldown(subdistrict.name);
                          setDprtSearchTerm('');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title={`Lihat daftar ${totalVillagesCount} desa/kelurahan di Kec. ${subdistrict.name}`}
                      >
                        <span>Lihat {totalVillagesCount} DPRt</span>
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
                          <span>Matriks & Import</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* LEVEL 2: DRILLDOWN INTO SELECTED DPC'S DPRT VILLAGES */
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
                <span>&larr; Kembali ke Daftar Semua DPC Kecamatan</span>
              </button>

              <div className="flex items-center gap-2">
                {onOpenTerritorialMatrix && activeSubDetail && (
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
                    <span>Matriks DPC</span>
                  </button>
                )}
                {onOpenTerritorialMatrix && activeSubDetail && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTerritorialMatrix(regionName, activeSubDetail.subdistrict.name, 'DPRt');
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Buka matriks DPRt ranting desa untuk kelola kepengurusan & import Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Matriks DPRt (Import Excel)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Detail Info Banner */}
            {activeSubDetail && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Kecamatan {activeSubDetail.subdistrict.name}</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Target {activeSubDetail.totalVillagesCount} Desa/Kelurahan · Keterisian Kader:{' '}
                    {activeSubDetail.filledVillagesCount} / {activeSubDetail.totalVillagesCount} ({activeSubDetail.villageCoveragePercentage}%)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  {activeSubDetail.subMembers.length} Total Kader Riil
                </span>
              </div>
            )}
          </div>

          {/* Search Desa/Kelurahan */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={`Cari nama desa / kelurahan di Kec. ${activeSubDetail?.subdistrict.name}...`}
              value={dprtSearchTerm}
              onChange={(e) => setDprtSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Grid of DPRt Villages */}
          {activeSubDetail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeSubDetail.villageStats
                .filter((v) =>
                  v.name.toLowerCase().includes(dprtSearchTerm.toLowerCase())
                )
                .map((village) => (
                  <div
                    key={village.name}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {village.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          DPRt Tingkat Ranting
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          village.isFilled
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {village.isFilled ? `✓ ${village.cadres.length} Kader` : 'Belum Ada Kader'}
                      </span>
                    </div>

                    {/* Kader Names Preview */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {village.cadres.length > 0 ? (
                        <div className="space-y-1">
                          {(() => {
                            const sortedCadres = sortMembersByHierarchy(village.cadres);
                            const ketuaDprt = sortedCadres.find((c) => isDefinitiveLeader(c.jabatan));
                            const otherCadres = sortedCadres.filter((c) => c.nik !== ketuaDprt?.nik);
                            return (
                              <>
                                {ketuaDprt && (
                                  <div className="flex items-center gap-1.5 text-[10.5px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                                    <span className="font-black text-[9px] font-mono px-1 rounded bg-amber-500 text-slate-950">#1</span>
                                    <span className="font-bold truncate">Ketua DPRt: {ketuaDprt.namaLengkap}</span>
                                  </div>
                                )}
                                {otherCadres.slice(0, 2).map((c) => (
                                  <div key={c.nik} className="truncate text-[10.5px]">
                                    &bull;{' '}
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {c.namaLengkap}
                                    </span>
                                    {c.jabatan && (
                                      <span className="text-slate-400 text-[10px]"> ({c.jabatan})</span>
                                    )}
                                  </div>
                                ))}
                                {otherCadres.length > 2 && (
                                  <span className="text-[10px] text-slate-400 italic block">
                                    +{otherCadres.length - 2} kader lainnya
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10.5px]">
                          Belum ada anggota atau pengurus ranting terdata
                        </span>
                      )}
                    </div>

                    {/* Direct Matriks & Import Button for this DPRt */}
                    {onOpenTerritorialMatrix && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTerritorialMatrix(
                            regionName,
                            activeSubDetail.subdistrict.name,
                            'DPRt'
                          );
                          onClose();
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Buka matriks DPRt desa ini untuk import Excel atau kelola pengurus"
                      >
                        <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Matriks DPRt & Import Excel &rarr;</span>
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
