import React from 'react';
import { Member, SulutRegion } from '../../../types';
import { DPRT_STRUCTURE_TEMPLATE } from '../../../data/structureTemplates';
import { DpdPimpinanCompliance } from '../../../utils/structureReadinessUtils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  MapPin,
  Table,
  ChevronRight,
  ArrowRight,
  Search,
} from 'lucide-react';

export interface DprtVillageStatItem {
  name: string;
  totalCadres: number;
  totalPengurus: number;
  filledCount: number;
  percentage: number;
  status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG';
  ketuaDprt?: Member;
  sekretarisDprt?: Member;
  bendaharaDprt?: Member;
  cadres: Member[];
}

export interface DpdRegionStatItem {
  region: SulutRegion;
  compliance: DpdPimpinanCompliance;
  status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG';
  regMembersCount: number;
  regPengurusCount: number;
  filledDpcs: number;
  totalDpcs: number;
  filledDprts: number;
  totalDprts: number;
  pertimbanganCount: number;
  pakarCount: number;
}

export const ReadinessLegalGuidelines: React.FC = () => (
  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3 animate-in fade-in duration-150">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        Standar Wajib Legalitas Kepengurusan Partai NasDem Sulut:
      </span>
      <span className="text-[10px] font-mono text-slate-400">Ketentuan DPW Sulut</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
          1. Legalitas Formal SK
        </span>
        <p className="text-[11px] text-slate-500">Nomor SK resmi, tanggal penetapan, dan masa bakti pengurus.</p>
      </div>
      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
          2. Formasi 36 Jabatan DPD
        </span>
        <p className="text-[11px] text-slate-500">KSB inti, 27 Wakil Ketua Bidang, Dewan Pertimbangan & Dewan Pakar.</p>
      </div>
      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
          3. Penetrasi DPC & DPRt
        </span>
        <p className="text-[11px] text-slate-500">17 jabatan inti per kecamatan dan kepengurusan ranting basis desa.</p>
      </div>
      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
          4. Validitas Biodata Kader
        </span>
        <p className="text-[11px] text-slate-500">NIK e-KTP 16 digit, e-KTA resmi, dan nomor kontak aktif.</p>
      </div>
    </div>
  </div>
);

interface ReadinessTerritorialGridsProps {
  isDpcScoped: boolean;
  isDprtScoped: boolean;
  activeDpdScope: string | null;
  currentRegionName: string;
  currentDpcName: string;
  dprtAccess?: string;
  filterTab: 'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG';
  setFilterTab: (tab: 'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG') => void;
  dprtSearchTerm: string;
  setDprtSearchTerm: (val: string) => void;
  dpcVillagesStats: DprtVillageStatItem[];
  filteredDprtVillages: DprtVillageStatItem[];
  regionStats: DpdRegionStatItem[];
  filteredRegionStats: DpdRegionStatItem[];
  regionsCount: number;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onSelectDrawer: (regionName: string, initialTab: 'dpd' | 'dpc' | 'dprt', initialDpc: string | null) => void;
}

export const ReadinessTerritorialGrids: React.FC<ReadinessTerritorialGridsProps> = ({
  isDpcScoped,
  isDprtScoped,
  activeDpdScope,
  currentRegionName,
  currentDpcName,
  dprtAccess,
  filterTab,
  setFilterTab,
  dprtSearchTerm,
  setDprtSearchTerm,
  dpcVillagesStats,
  filteredDprtVillages,
  regionStats,
  filteredRegionStats,
  regionsCount,
  onOpenTerritorialMatrix,
  onSelectDrawer,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isDprtScoped
                ? `Wilayah Kerja DPRt Desa ${dprtAccess}:`
                : isDpcScoped
                ? `Wilayah Kerja Kecamatan ${currentDpcName}:`
                : activeDpdScope
                ? `Status Teritorial ${activeDpdScope}:`
                : 'Status 15 DPD Kab/Kota:'}
            </h4>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400">
            {isDpcScoped || isDprtScoped
              ? `(Daftar ${dpcVillagesStats.length} DPRt Basis Desa / Kelurahan di Kec. ${currentDpcName})`
              : '(Klik kartu untuk melihat rincian & audit formasi)'}
          </span>
        </div>

        {/* Action on Header Right */}
        {isDpcScoped || isDprtScoped ? (
          <div className="flex items-center gap-2">
            {onOpenTerritorialMatrix && (
              <button
                type="button"
                onClick={() => onOpenTerritorialMatrix(currentRegionName, currentDpcName, 'DPRt')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Buka Matriks Struktur DPRt untuk input & import Excel"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Matriks DPRt Kec. {currentDpcName}</span>
              </button>
            )}
          </div>
        ) : regionsCount > 1 ? (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs overflow-x-auto max-w-full shrink-0">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({regionStats.length})
            </button>
            <button
              onClick={() => setFilterTab('LENGKAP')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'LENGKAP'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Lengkap ({regionStats.filter((r) => r.status === 'LENGKAP').length})</span>
            </button>
            <button
              onClick={() => setFilterTab('SEBAGIAN')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'SEBAGIAN'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <span className="hidden sm:inline">Perlu Dilengkapi</span>
                <span className="sm:hidden">Sebagian</span> ({regionStats.filter((r) => r.status === 'SEBAGIAN').length})
              </span>
            </button>
            <button
              onClick={() => setFilterTab('KOSONG')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'KOSONG'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <span className="hidden sm:inline">Belum Terisi</span>
                <span className="sm:hidden">Kosong</span> ({regionStats.filter((r) => r.status === 'KOSONG').length})
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              1 Wilayah Terverifikasi
            </span>
          </div>
        )}
      </div>

      {/* DPRt Filter Bar & Search (For DPC/DPRt Admin) */}
      {(isDpcScoped || isDprtScoped) && dpcVillagesStats.length > 1 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Filter Pills for DPRt */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs overflow-x-auto max-w-full shrink-0">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({dpcVillagesStats.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('LENGKAP')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'LENGKAP'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Lengkap ({dpcVillagesStats.filter((r) => r.status === 'LENGKAP').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('SEBAGIAN')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'SEBAGIAN'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <span className="hidden sm:inline">Perlu Dilengkapi</span>
                <span className="sm:hidden">Sebagian</span> ({dpcVillagesStats.filter((r) => r.status === 'SEBAGIAN').length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('KOSONG')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                filterTab === 'KOSONG'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <span className="hidden sm:inline">Belum Terisi</span>
                <span className="sm:hidden">Kosong</span> ({dpcVillagesStats.filter((r) => r.status === 'KOSONG').length})
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama desa / kelurahan..."
              value={dprtSearchTerm}
              onChange={(e) => setDprtSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* 4A. DPRt Villages Grid (For DPC & DPRt Admin) */}
      {isDpcScoped || isDprtScoped ? (
        <div key={`dprt-grid-${filterTab}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 animate-tab-enter">
          {filteredDprtVillages.map((village) => (
            <div
              key={village.name}
              onClick={() => onSelectDrawer(currentRegionName, 'dprt', currentDpcName)}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer space-y-3 group flex flex-col justify-between"
            >
              {/* Header Card */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">DPRt {village.name}</span>
                    </h5>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block">
                      Kec. {currentDpcName}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        village.status === 'LENGKAP'
                          ? 'bg-emerald-500'
                          : village.status === 'SEBAGIAN'
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    {village.status === 'LENGKAP'
                      ? `${DPRT_STRUCTURE_TEMPLATE.length}/${DPRT_STRUCTURE_TEMPLATE.length} Lengkap`
                      : village.filledCount > 0
                      ? `${village.filledCount}/${DPRT_STRUCTURE_TEMPLATE.length} Terisi`
                      : village.totalCadres > 0
                      ? `${village.totalCadres} Kader`
                      : 'Kosong'}
                  </span>
                </div>
              </div>

              {/* Progress Bar Formasi DPRt (11 Inti) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] sm:text-[11px]">
                  <span className="text-slate-500">Formasi DPRt:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {village.percentage}% ({village.filledCount}/{DPRT_STRUCTURE_TEMPLATE.length})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      village.percentage > 0
                        ? 'bg-[#1A3282] dark:bg-[#21409A]'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(village.percentage, village.totalCadres > 0 ? 6 : 2)}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Chips */}
              <div className="grid grid-cols-3 gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                    Formasi
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                    {village.filledCount} / {DPRT_STRUCTURE_TEMPLATE.length}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                    Kader
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                    {village.totalCadres} Org
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                    KSB
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                    {village.ketuaDprt ? 'K✓' : 'K—'} {village.sekretarisDprt ? 'S✓' : 'S—'}
                  </span>
                </div>
              </div>

              {/* Core Leader or Cadre Info */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 min-h-[22px] flex items-center">
                {village.ketuaDprt ? (
                  <div className="flex items-center gap-1.5 text-[10.5px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 w-full truncate">
                    <span className="font-black text-[9px] font-mono px-1 rounded bg-[#FDB813] text-slate-950">K</span>
                    <span className="font-medium truncate">{village.ketuaDprt.namaLengkap}</span>
                  </div>
                ) : village.totalCadres > 0 ? (
                  <div className="text-[10.5px] text-slate-500 truncate">
                    &bull; {village.cadres[0].namaLengkap} ({village.cadres[0].jabatan || 'Anggota'})
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum ada kader terdaftar</span>
                )}
              </div>

              {/* Footer Action Bar */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 font-medium mt-auto">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <span>Rincian DPRt</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                {onOpenTerritorialMatrix && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTerritorialMatrix(currentRegionName, currentDpcName, 'DPRt');
                    }}
                    className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Buka matriks DPRt & import Excel"
                  >
                    <Table className="w-3 h-3" />
                    <span>Matriks</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredDprtVillages.length === 0 && (
            <div className="col-span-full p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500">Tidak ada DPRt desa/kelurahan yang cocok dengan filter atau kata kunci pencarian.</p>
            </div>
          )}
        </div>
      ) : (
        /* 4B. 15 Kab/Kota Grid Cards (Full-Width Desktop 5 Columns -> 4 -> 3 -> 2 -> 1) */
        <div
          key={filterTab}
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            filteredRegionStats.length === 1
              ? 'lg:grid-cols-1 max-w-2xl'
              : 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          } gap-3.5 animate-tab-enter`}
        >
          {filteredRegionStats.map((item) => {
            const {
              region,
              compliance,
              status,
              regMembersCount,
              filledDpcs,
              totalDpcs,
              filledDprts,
              totalDprts,
            } = item;

            return (
              <div
                key={region.id}
                onClick={() => onSelectDrawer(region.name, 'dpd', null)}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer space-y-3 group flex flex-col justify-between"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {region.name}
                    </h5>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block truncate">
                      Zona: {region.zone || 'Sulut'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === 'LENGKAP'
                          ? 'bg-emerald-500'
                          : status === 'SEBAGIAN'
                          ? 'bg-[#FDB813]'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    {status === 'LENGKAP'
                      ? '36/36'
                      : status === 'SEBAGIAN'
                      ? `${compliance.filledCount}/36`
                      : 'Kosong'}
                  </span>
                </div>

                {/* Single Clean Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-[11px]">
                    <span className="text-slate-500">Formasi DPD:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {compliance.percentage}% ({compliance.filledCount}/36)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        compliance.percentage > 0
                          ? 'bg-[#1A3282] dark:bg-[#21409A]'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(compliance.percentage, 2)}%` }}
                    />
                  </div>
                </div>

                {/* 3 Interactive Key Metrics: DPC, DPRt, Total Kader */}
                <div className="grid grid-cols-3 gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Metric 1: DPC */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrawer(region.name, 'dpc', null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group/stat"
                    title="Klik untuk membuka rincian DPC Kecamatan"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        DPC
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:translate-x-0.5 transition-all" />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {filledDpcs}/{totalDpcs}
                    </span>
                  </div>

                  {/* Metric 2: DPRt */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrawer(region.name, 'dprt', null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group/stat"
                    title="Klik untuk melihat sebaran DPRt Desa/Kelurahan"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        DPRt
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover/stat:translate-x-0.5 transition-all" />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {filledDprts}/{totalDprts}
                    </span>
                  </div>

                  {/* Metric 3: Total Kader */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDrawer(region.name, 'dpd', null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer"
                    title="Total kader riil ber-KTP di wilayah ini"
                  >
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                      Kader
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] block mt-0.5">
                      {regMembersCount}
                    </span>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 font-medium mt-auto">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <span>Rincian</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {onOpenTerritorialMatrix && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTerritorialMatrix(region.name, undefined, 'DPD');
                      }}
                      className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Buka matriks DPD & import Excel"
                    >
                      <Table className="w-3 h-3" />
                      <span>Matriks</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

