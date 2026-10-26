import React from 'react';
import { ArrowLeft, FileSpreadsheet, MapPin, Search, Table, ChevronRight } from 'lucide-react';
import { SubdistrictDetail } from './DpcSubdistrictsTab';
import { isDefinitiveLeader, sortMembersByHierarchy } from '../../../utils/jobMatchingUtils';

interface DprtOverviewTabProps {
  regionName: string;
  totalDprtTarget: number;
  selectedDpcForDrilldown: string | null;
  setSelectedDpcForDrilldown: (dpc: string | null) => void;
  activeSubDetail: SubdistrictDetail | null;
  subdistrictDetails: SubdistrictDetail[];
  dprtSearchTerm: string;
  setDprtSearchTerm: (term: string) => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onClose: () => void;
}

export const DprtOverviewTab: React.FC<DprtOverviewTabProps> = ({
  regionName,
  totalDprtTarget,
  selectedDpcForDrilldown,
  setSelectedDpcForDrilldown,
  activeSubDetail,
  subdistrictDetails,
  dprtSearchTerm,
  setDprtSearchTerm,
  onOpenTerritorialMatrix,
  onClose,
}) => {
  return (
    <div key={selectedDpcForDrilldown ? `dprt-${selectedDpcForDrilldown}` : 'all-dprt'} className="animate-tab-enter space-y-3">
      {selectedDpcForDrilldown && activeSubDetail ? (
        /* If a DPC is already selected, show its DPRt villages grid */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDpcForDrilldown(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>&larr; Lihat Semua Kecamatan</span>
              </button>

              {onOpenTerritorialMatrix && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTerritorialMatrix(regionName, activeSubDetail.subdistrict.name, 'DPRt');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Matriks DPRt Kec. {activeSubDetail.subdistrict.name} (Import Excel)</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>DPRt Ranting Kec. {activeSubDetail.subdistrict.name}</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {activeSubDetail.filledVillagesCount} / {activeSubDetail.totalVillagesCount} Desa Terisi ({activeSubDetail.villageCoveragePercentage}%)
              </span>
            </div>
          </div>

          {/* Search Desa */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={`Cari nama desa / kelurahan di Kec. ${activeSubDetail.subdistrict.name}...`}
              value={dprtSearchTerm}
              onChange={(e) => setDprtSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

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
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      {village.name}
                    </span>
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

                  {/* Ketua DPRt & Cadres Preview */}
                  {village.cadres.length > 0 && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      {(() => {
                        const sortedCadres = sortMembersByHierarchy(village.cadres);
                        const ketuaDprt = sortedCadres.find((c) => isDefinitiveLeader(c.jabatan));
                        return (
                          <>
                            {ketuaDprt && (
                              <div className="flex items-center gap-1.5 text-[10.5px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                                <span className="font-black text-[9px] font-mono px-1 rounded bg-amber-500 text-slate-950">#1</span>
                                <span className="font-bold truncate">Ketua: {ketuaDprt.namaLengkap}</span>
                              </div>
                            )}
                            {sortedCadres.filter((c) => c.nik !== ketuaDprt?.nik).slice(0, 1).map((c) => (
                              <div key={c.nik} className="truncate text-[10px] text-slate-500">
                                &bull; {c.namaLengkap} ({c.jabatan || 'Anggota'})
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Direct Action */}
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
                    >
                      <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Matriks DPRt & Import Excel &rarr;</span>
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* Overview of all Subdistricts' DPRt coverage */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Penetrasi DPRt Ranting Desa / Kelurahan se-{regionName}
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Total {totalDprtTarget} Desa/Kelurahan resmi se-{regionName}. Pilih kecamatan di bawah ini untuk melihat status setiap desa atau buka langsung ke Matriks Struktur DPRt untuk input & import Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {subdistrictDetails.map((item) => {
              const { subdistrict, filledVillagesCount, totalVillagesCount, villageCoveragePercentage, subMembers } = item;

              return (
                <div
                  key={subdistrict.name}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Kec. {subdistrict.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {totalVillagesCount} Desa/Kel
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Desa Terisi Kader:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {filledVillagesCount} / {totalVillagesCount} ({villageCoveragePercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${
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

                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Total Kader Riil:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {subMembers.length} Orang
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDpcForDrilldown(subdistrict.name);
                        setDprtSearchTerm('');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Buka {totalVillagesCount} DPRt</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onOpenTerritorialMatrix && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTerritorialMatrix(regionName, subdistrict.name, 'DPRt');
                          onClose();
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Buka matriks DPRt & import Excel"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Matriks DPRt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
