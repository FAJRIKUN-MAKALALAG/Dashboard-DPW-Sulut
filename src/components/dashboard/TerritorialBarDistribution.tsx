import React from 'react';
import { Member, UserSession } from '../../types';
import {
  Building2,
  MapPin,
  Table,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Layers,
} from 'lucide-react';

export interface DistributionItem {
  name: string;
  id: string;
  active: number;
  inactive: number;
  total: number;
  dpdPengurusCount: number;
  dpcPengurusCount: number;
  percentage: number;
  totalDpc: number;
  dpcBreakdown: {
    name: string;
    active: number;
    inactive: number;
    total: number;
    percentage: number;
  }[];
}

export interface CurrentDpcItem {
  name: string;
  villages?: string[];
  active: number;
  inactive: number;
  total: number;
  percentage: number;
}

interface TerritorialBarDistributionProps {
  session?: UserSession;
  distributionData: DistributionItem[];
  currentDpcList: CurrentDpcItem[];
  maxActiveCount: number;
  maxDpcActiveCount: number;
  selectedDpdFilter: string;
  setSelectedDpdFilter: (dpd: string) => void;
  expandedBars: Record<string, boolean>;
  toggleBarExpansion: (key: string) => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string) => void;
  scopedMembers: Member[];
}

export const TerritorialBarDistribution: React.FC<TerritorialBarDistributionProps> = ({
  session,
  distributionData,
  currentDpcList,
  maxActiveCount,
  maxDpcActiveCount,
  selectedDpdFilter,
  setSelectedDpdFilter,
  expandedBars,
  toggleBarExpansion,
  onOpenTerritorialMatrix,
  scopedMembers,
}) => {
  const isSuperAdmin = !session || session.role === 'SUPER_ADMIN';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase">
              Grafik Batang Distribusi
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isSuperAdmin ? '15 Kabupaten/Kota' : `DPD ${session?.dpdAccess}`}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {isSuperAdmin
              ? 'Sebaran Jumlah Anggota Aktif per DPD'
              : 'Sebaran Jumlah Anggota Aktif per DPC (Kecamatan)'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin ? (
              <>
                Klik <strong className="text-blue-600 dark:text-blue-400">▼ Detail</strong> pada
                setiap DPD untuk melihat distribusi anggota per DPC (Kecamatan).
              </>
            ) : (
              <>
                Distribusi anggota di setiap kecamatan (DPC) dalam wilayah{' '}
                <strong className="text-blue-600 dark:text-blue-400">{session?.dpdAccess}</strong>.
                Klik untuk melihat rincian DPRt (Kelurahan/Desa).
              </>
            )}
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Aktif Riil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-400 rounded-xs"></span>
            <span className="text-rose-700 dark:text-rose-400 font-medium">Non-Aktif</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart - Interactive with DPC Drill-Down */}
      <div className="space-y-2">
        {/* ===== SUPER ADMIN: 15 DPD Distribution ===== */}
        {isSuperAdmin ? (
          <>
            {distributionData.map((item, index) => {
              const barWidthPercent = Math.max(
                Math.round((item.active / maxActiveCount) * 100),
                4
              );
              const isSelected = selectedDpdFilter === item.name;
              const isBarExpanded = !!expandedBars[item.id];
              const maxDpcActive = Math.max(...item.dpcBreakdown.map((d) => d.active), 1);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                    isBarExpanded
                      ? 'border-blue-300 dark:border-blue-700 shadow-sm bg-white dark:bg-slate-900'
                      : isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  {/* Main Bar Row */}
                  <div className="flex items-center gap-0">
                    {/* Left: Territory Click Area (Opens Table Directly) */}
                    <div
                      onClick={() => {
                        if (onOpenTerritorialMatrix) {
                          onOpenTerritorialMatrix(item.name);
                        } else {
                          setSelectedDpdFilter(isSelected ? 'ALL' : item.name);
                        }
                      }}
                      className="flex-1 p-2.5 cursor-pointer group hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                      title={`Klik untuk melihat tabel susunan pengurus ${item.name}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-slate-400 dark:text-slate-500 font-mono text-[11px] text-right font-medium">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <Table className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </span>
                          {isSelected && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-medium">
                              Terpilih
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          {item.dpdPengurusCount > 0 && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-semibold">
                              <span className="font-bold">{item.dpdPengurusCount}</span> Pengurus
                              DPD
                            </span>
                          )}
                          <span
                            className="text-emerald-600 dark:text-emerald-400 font-bold"
                            data-tabular="true"
                          >
                            {item.active} Aktif
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span
                            className="text-slate-600 dark:text-slate-400"
                            data-tabular="true"
                          >
                            {item.total} Total
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Bar representation */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full rounded-l-full transition-all duration-300 shadow-xs"
                          style={{ width: `${barWidthPercent}%` }}
                          title={`${item.active} Anggota Aktif`}
                        ></div>
                        {item.inactive > 0 && (
                          <div
                            className="bg-rose-400/80 h-full transition-all duration-300"
                            style={{
                              width: `${Math.max(
                                Math.round((item.inactive / maxActiveCount) * 100),
                                2
                              )}%`,
                            }}
                            title={`${item.inactive} Anggota Non-Aktif`}
                          ></div>
                        )}
                      </div>
                    </div>

                    {/* Right: Matriks Struktur & DPC Buttons */}
                    <div className="flex items-center shrink-0 border-l border-slate-100 dark:border-slate-800">
                      {onOpenTerritorialMatrix && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTerritorialMatrix(item.name);
                          }}
                          className="px-2.5 py-4 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-r border-slate-100 dark:border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Buka Tabel Matriks Jabatan Pengurus ${item.name}`}
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-[11px]">Tabel Matriks</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleBarExpansion(item.id)}
                        className={`px-3 py-4 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium shrink-0 ${
                          isBarExpanded
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-blue-600'
                        }`}
                        title={isBarExpanded ? 'Tutup rincian DPC' : `Lihat ${item.totalDpc} DPC`}
                      >
                        {isBarExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tutup</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {item.dpcBreakdown.length} DPC
                            </span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded DPC Detail Panel */}
                  {isBarExpanded && (
                    <div className="border-t border-blue-100 dark:border-blue-900/60 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          Distribusi per DPC (Kecamatan) di {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.dpcBreakdown.length} / {item.totalDpc} DPC aktif
                        </span>
                      </div>

                      {item.dpcBreakdown.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic text-center py-3">
                          Belum ada anggota terdaftar di wilayah ini
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {item.dpcBreakdown.map((dpc) => {
                            const dpcBarWidth = Math.max(
                              Math.round((dpc.active / maxDpcActive) * 100),
                              6
                            );
                            const dpcColor =
                              dpc.percentage >= 80
                                ? 'emerald'
                                : dpc.percentage >= 60
                                ? 'blue'
                                : 'amber';

                            return (
                              <div
                                key={dpc.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenTerritorialMatrix) {
                                    onOpenTerritorialMatrix(item.name, dpc.name);
                                  }
                                }}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xs transition-all cursor-pointer group/dpc"
                                title={`Klik untuk buka tabel susunan pengurus DPC Kec. ${dpc.name}`}
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-indigo-400 group-hover/dpc:text-blue-500 shrink-0 transition-colors" />
                                    <span className="font-medium text-slate-700 dark:text-slate-300 group-hover/dpc:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      Kec. {dpc.name}
                                    </span>
                                    <Table className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/dpc:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span
                                      className={`font-semibold text-${dpcColor}-600 dark:text-${dpcColor}-400`}
                                    >
                                      {dpc.active} Aktif
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">/</span>
                                    <span className="text-slate-500">{dpc.total}</span>
                                    <span
                                      className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                        dpc.percentage >= 80
                                          ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                          : dpc.percentage >= 60
                                          ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                          : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                                      }`}
                                    >
                                      {dpc.percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* DPC Mini Bar */}
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                                  <div
                                    className={`h-full rounded-l-full transition-all duration-300 ${
                                      dpc.percentage >= 80
                                        ? 'bg-emerald-500'
                                        : dpc.percentage >= 60
                                        ? 'bg-blue-500'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${dpcBarWidth}%` }}
                                  ></div>
                                  {dpc.inactive > 0 && (
                                    <div
                                      className="bg-rose-400/60 h-full transition-all duration-300"
                                      style={{
                                        width: `${Math.max(
                                          Math.round((dpc.inactive / maxDpcActive) * 100),
                                          3
                                        )}%`,
                                      }}
                                    ></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Summary Footer */}
                      <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>
                          {item.totalDpc - item.dpcBreakdown.length} DPC belum memiliki anggota
                        </span>
                        <div className="flex items-center gap-3">
                          {onOpenTerritorialMatrix && (
                            <button
                              onClick={() => onOpenTerritorialMatrix(item.name)}
                              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Table className="w-3 h-3" />
                              <span>Buka Tabel Matriks {item.name}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDpdFilter(item.name);
                              toggleBarExpansion(item.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Filter ke {item.name}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          /* ===== NON-SUPER ADMIN: DPC Distribution ===== */
          <>
            {currentDpcList.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center py-8">
                Belum ada data anggota terdaftar di wilayah {session?.dpdAccess}.
              </div>
            ) : (
              currentDpcList.map((dpcItem, index) => {
                const barWidthPercent = Math.max(
                  Math.round((dpcItem.active / maxDpcActiveCount) * 100),
                  4
                );
                const dpcColor =
                  dpcItem.percentage >= 80
                    ? 'emerald'
                    : dpcItem.percentage >= 60
                    ? 'blue'
                    : 'amber';
                const isBarExpanded = !!expandedBars[dpcItem.name];

                // Get village (DPRt) breakdown for this DPC
                const villageBreakdown = (dpcItem.villages || [])
                  .map((village: string) => {
                    const vMembers = scopedMembers.filter(
                      (m) => m.dpc === dpcItem.name && m.dprt === village
                    );
                    const vActive = vMembers.filter((m) => m.status === 'Aktif').length;
                    return {
                      name: village,
                      active: vActive,
                      inactive: vMembers.length - vActive,
                      total: vMembers.length,
                      percentage:
                        vMembers.length > 0 ? Math.round((vActive / vMembers.length) * 100) : 0,
                    };
                  })
                  .filter((v) => v.total > 0)
                  .sort((a, b) => b.active - a.active);

                const maxVillageActive = Math.max(
                  ...villageBreakdown.map((v) => v.active),
                  1
                );

                return (
                  <div
                    key={dpcItem.name}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isBarExpanded
                        ? 'border-blue-300 dark:border-blue-700 shadow-sm bg-white dark:bg-slate-900'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                  >
                    {/* Main Bar Row */}
                    <div className="flex items-center gap-0">
                      <div className="flex-1 p-2.5 group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-slate-400 dark:text-slate-500 font-mono text-[11px] text-right font-medium">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Kec. {dpcItem.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span
                              className={`font-bold text-${dpcColor}-600 dark:text-${dpcColor}-400`}
                              data-tabular="true"
                            >
                              {dpcItem.active} Aktif
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span
                              className="text-slate-600 dark:text-slate-400"
                              data-tabular="true"
                            >
                              {dpcItem.total} Total
                            </span>
                            <span
                              className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                dpcItem.percentage >= 80
                                  ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                  : dpcItem.percentage >= 60
                                  ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                  : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                              }`}
                            >
                              {dpcItem.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Bar representation */}
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-l-full transition-all duration-300 shadow-xs ${
                              dpcItem.percentage >= 80
                                ? 'bg-emerald-500'
                                : dpcItem.percentage >= 60
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${barWidthPercent}%` }}
                            title={`${dpcItem.active} Anggota Aktif`}
                          ></div>
                          {dpcItem.inactive > 0 && (
                            <div
                              className="bg-rose-400/80 h-full transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  Math.round((dpcItem.inactive / maxDpcActiveCount) * 100),
                                  2
                                )}%`,
                              }}
                              title={`${dpcItem.inactive} Anggota Non-Aktif`}
                            ></div>
                          )}
                        </div>
                      </div>

                      {/* Right: Expand DPRt (Villages) Button */}
                      <button
                        onClick={() => toggleBarExpansion(dpcItem.name)}
                        className={`px-3 py-4 border-l transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium shrink-0 ${
                          isBarExpanded
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                            : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-blue-600'
                        }`}
                        title={isBarExpanded ? 'Tutup rincian DPRt' : 'Lihat DPRt (Kel/Desa)'}
                      >
                        {isBarExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tutup</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {villageBreakdown.length} DPRt
                            </span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded DPRt Detail Panel */}
                    {isBarExpanded && (
                      <div className="border-t border-blue-100 dark:border-blue-900/60 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            Distribusi per DPRt (Kelurahan/Desa) di Kec. {dpcItem.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {villageBreakdown.length} / {(dpcItem.villages || []).length} DPRt aktif
                          </span>
                        </div>

                        {villageBreakdown.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic text-center py-3">
                            Belum ada anggota terdaftar di kelurahan/desa kecamatan ini
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {villageBreakdown.map((village) => {
                              const vBarWidth = Math.max(
                                Math.round((village.active / maxVillageActive) * 100),
                                6
                              );
                              const vColor =
                                village.percentage >= 80
                                  ? 'emerald'
                                  : village.percentage >= 60
                                  ? 'blue'
                                  : 'amber';

                              return (
                                <div
                                  key={village.name}
                                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                                >
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {village.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono">
                                      <span
                                        className={`font-semibold text-${vColor}-600 dark:text-${vColor}-400`}
                                      >
                                        {village.active} Aktif
                                      </span>
                                      <span className="text-slate-300 dark:text-slate-600">/</span>
                                      <span className="text-slate-500">{village.total}</span>
                                      <span
                                        className={`text-[10px] px-1 py-0.5 rounded border font-semibold ${
                                          village.percentage >= 80
                                            ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                            : village.percentage >= 60
                                            ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50'
                                            : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                                        }`}
                                      >
                                        {village.percentage}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Village Mini Bar */}
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                                    <div
                                      className={`h-full rounded-l-full transition-all duration-300 ${
                                        village.percentage >= 80
                                          ? 'bg-emerald-500'
                                          : village.percentage >= 60
                                          ? 'bg-blue-500'
                                          : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${vBarWidth}%` }}
                                    ></div>
                                    {village.inactive > 0 && (
                                      <div
                                        className="bg-rose-400/60 h-full transition-all duration-300"
                                        style={{
                                          width: `${Math.max(
                                            Math.round(
                                              (village.inactive / maxVillageActive) * 100
                                            ),
                                            3
                                          )}%`,
                                        }}
                                      ></div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {(dpcItem.villages || []).length - villageBreakdown.length} DPRt belum
                            memiliki anggota
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};
