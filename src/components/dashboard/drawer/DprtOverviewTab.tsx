import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, MapPin, Search, Table } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FILLED' | 'EMPTY'>('ALL');

  // Flatten all DPRt villages across the DPD (or filtered by selected Kecamatan)
  const allDprtItems = useMemo(() => {
    const sourceSubs =
      selectedDpcForDrilldown && activeSubDetail
        ? [activeSubDetail]
        : subdistrictDetails;

    return sourceSubs.flatMap((sub) =>
      sub.villageStats.map((v) => ({
        ...v,
        dpcName: sub.subdistrict.name,
      }))
    );
  }, [selectedDpcForDrilldown, activeSubDetail, subdistrictDetails]);

  const filledCount = useMemo(
    () => allDprtItems.filter((v) => v.isFilled).length,
    [allDprtItems]
  );

  const filteredDprtItems = useMemo(() => {
    return allDprtItems.filter((v) => {
      if (statusFilter === 'FILLED' && !v.isFilled) return false;
      if (statusFilter === 'EMPTY' && v.isFilled) return false;
      if (dprtSearchTerm.trim()) {
        const q = dprtSearchTerm.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.dpcName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allDprtItems, statusFilter, dprtSearchTerm]);

  return (
    <div className="animate-tab-enter space-y-3">
      {/* Header Banner DPRt */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Basis Ranting DPRt Desa / Kelurahan{' '}
                {selectedDpcForDrilldown && activeSubDetail
                  ? `Kec. ${activeSubDetail.subdistrict.name}`
                  : `se-${regionName}`}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Terisi <strong className="text-slate-800 dark:text-slate-200 font-mono">{filledCount}</strong> dari{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{allDprtItems.length}</strong> Desa/Kelurahan
              {!selectedDpcForDrilldown ? ` (Total ${totalDprtTarget} Desa/Kel se-${regionName})` : ''}.
            </p>
          </div>

          {onOpenTerritorialMatrix && (
            <button
              type="button"
              onClick={() => {
                onOpenTerritorialMatrix(
                  regionName,
                  selectedDpcForDrilldown && activeSubDetail
                    ? activeSubDetail.subdistrict.name
                    : subdistrictDetails[0]?.subdistrict.name,
                  'DPRt'
                );
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Buka Matriks DPRt &amp; Import Excel</span>
            </button>
          )}
        </div>

        {/* Filter Bar: Pilih Kecamatan + Status Filter */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500 shrink-0">
              Filter Kecamatan:
            </label>
            <select
              value={selectedDpcForDrilldown && activeSubDetail ? activeSubDetail.subdistrict.name : 'ALL'}
              onChange={(e) =>
                setSelectedDpcForDrilldown(e.target.value === 'ALL' ? null : e.target.value)
              }
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Kecamatan ({totalDprtTarget} Desa/Kel)</option>
              {subdistrictDetails.map((sub) => (
                <option key={sub.subdistrict.name} value={sub.subdistrict.name}>
                  Kec. {sub.subdistrict.name} ({sub.filledVillagesCount}/{sub.totalVillagesCount} Desa)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({allDprtItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FILLED')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'FILLED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Terisi ({filledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('EMPTY')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'EMPTY'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Kosong ({allDprtItems.length - filledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Search Desa / Kelurahan */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Cari nama DPRt desa / kelurahan atau kecamatan..."
          value={dprtSearchTerm}
          onChange={(e) => setDprtSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
        />
      </div>

      {/* Grid of DPRt Desa / Kelurahan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredDprtItems.map((village) => (
          <div
            key={`${village.dpcName}-${village.name}`}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                    DPRt {village.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    Kec. {village.dpcName} · {village.pengurus.length} Pengurus DPRt
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    village.isFilled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {village.isFilled ? `✓ ${village.cadres.length} Kader` : 'Belum Terisi'}
                </span>
              </div>

              {/* Ketua DPRt & Cadres Preview */}
              {village.cadres.length > 0 ? (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                  {(() => {
                    const dprtSource = village.pengurus.length > 0 ? village.pengurus : village.cadres;
                    const sortedCadres = sortMembersByHierarchy(dprtSource);
                    const ketuaDprt = sortedCadres.find((c) => isDefinitiveLeader(c.jabatan));
                    return (
                      <>
                        {ketuaDprt && (
                          <div className="flex items-center gap-1.5 text-[10.5px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
                            <span className="font-black text-[9px] font-mono px-1 rounded bg-amber-500 text-slate-950">
                              #1
                            </span>
                            <span className="font-bold truncate">
                              Ketua DPRt: {ketuaDprt.namaLengkap}
                            </span>
                          </div>
                        )}
                        {sortedCadres
                          .filter((c) => c.nik !== ketuaDprt?.nik)
                          .slice(0, 2)
                          .map((c, idx) => (
                            <div key={`${c.nik}-${idx}`} className="truncate text-[10px] text-slate-500">
                              &bull; {c.namaLengkap} ({c.jabatan || 'Pengurus DPRt'})
                            </div>
                          ))}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-[10.5px] text-slate-400 italic pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                  Belum ada pengurus DPRt atau kader terdaftar di desa ini
                </div>
              )}
            </div>

            {/* Direct Action */}
            {onOpenTerritorialMatrix && (
              <button
                type="button"
                onClick={() => {
                  onOpenTerritorialMatrix(regionName, village.dpcName, 'DPRt');
                  onClose();
                }}
                className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Matriks DPRt &amp; Import Excel &rarr;</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
