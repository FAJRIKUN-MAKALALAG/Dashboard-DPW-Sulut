import React, { useMemo } from 'react';
import { UserSession } from '../../types';
import { GrowthAnalytics, GrowthPeriod, formatDisplayDate } from '../../utils/growthUtils';
import { Growth15KabKotaChart } from './Growth15KabKotaChart';
import { SULUT_15_KABKOTA } from '../analytics/types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch } from '../../utils/structureReadinessUtils';
import {
  Award,
  Calendar,
  Sparkles,
  Table,
  Maximize2,
  MapPin,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Users,
  Filter,
} from 'lucide-react';

interface RecruitmentAnalyticsSectionProps {
  growthAnalytics: GrowthAnalytics;
  growthPeriod: GrowthPeriod;
  setGrowthPeriod: (period: GrowthPeriod) => void;
  pinnedDate?: string;
  setPinnedDate: (date?: string) => void;
  filterRecruiter?: string;
  setFilterRecruiter: (recruiter?: string) => void;
  growthViewTab: 'territory' | 'recruiters';
  setGrowthViewTab: (tab: 'territory' | 'recruiters') => void;
  expandedDpds: Record<string, boolean>;
  toggleDpdAccordion: (dpdName: string) => void;
  expandedDpcs: Record<string, boolean>;
  toggleDpcAccordion: (dpcKey: string) => void;
  openDrilldownModalWithFocus: (
    dpd?: string,
    dpc?: string,
    dprt?: string,
    recruiter?: string
  ) => void;
  handleLoadTestScenario?: () => void;
  session?: UserSession;
  selectedDpdFilter?: string;
  growthDpdFilter?: string;
  setGrowthDpdFilter?: (dpd: string) => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string) => void;
  hasAddMembers?: boolean;
}

export const RecruitmentAnalyticsSection: React.FC<RecruitmentAnalyticsSectionProps> = ({
  growthAnalytics,
  growthPeriod,
  setGrowthPeriod,
  pinnedDate,
  setPinnedDate,
  filterRecruiter,
  setFilterRecruiter,
  growthViewTab,
  setGrowthViewTab,
  expandedDpds,
  toggleDpdAccordion,
  openDrilldownModalWithFocus,
  handleLoadTestScenario,
  session,
  selectedDpdFilter,
  growthDpdFilter,
  setGrowthDpdFilter,
  onOpenTerritorialMatrix,
  hasAddMembers,
}) => {
  const isSuperAdmin = !session || session.role === 'SUPER_ADMIN';
  const isDpwAdmin = session?.role === 'ADMIN_DPW';
  const canFilterTerritory = isSuperAdmin || isDpwAdmin;
  const isDpdScoped = session?.role === 'ADMIN_DPD';
  const isDpcScoped = session?.role === 'ADMIN_DPC';
  const isDprtScoped = session?.role === 'ADMIN_DPRT';

  // 15 Kab/Kota Data Calculation
  const bars15 = useMemo(() => {
    return SULUT_15_KABKOTA.map((item) => {
      const matchedNode = growthAnalytics.territorialTree.find(
        (node) =>
          isDpdMatch(node.name, item.name) ||
          isDpdMatch(node.name, item.label)
      );
      const addedCount = matchedNode ? matchedNode.count : 0;
      const percentage =
        growthAnalytics.totalNew > 0
          ? (addedCount / growthAnalytics.totalNew) * 100
          : 0;

      return {
        key: item.key,
        name: item.name,
        label: item.label,
        zone: item.zone,
        total: addedCount,
        percentage,
        recruiters: matchedNode?.recruiters || [],
        dpcsCount: matchedNode?.dpcs.length || 0,
        dpcs: matchedNode?.dpcs || [],
      };
    });
  }, [growthAnalytics.territorialTree, growthAnalytics.totalNew]);

  // Sorted leaderboard of 15 Kab/Kota (highest additions first)
  const leaderboard15 = useMemo(() => {
    return [...bars15].sort((a, b) => b.total - a.total);
  }, [bars15]);

  const topDpd = useMemo(() => {
    const active = leaderboard15.filter((b) => b.total > 0);
    return active.length > 0 ? active[0] : null;
  }, [leaderboard15]);

  const activeRegionsCount = useMemo(() => {
    return leaderboard15.filter((b) => b.total > 0).length;
  }, [leaderboard15]);

  // Hanya tampilkan section ini pada role SUPER_ADMIN dan ADMIN_DPW
  if (session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 md:p-6 shadow-2xs transition-colors space-y-4 sm:space-y-5">
      {/* 1. SECTION HEADER */}
      <div className="space-y-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FDB813]/15 dark:bg-slate-800 border border-[#FDB813]/40 dark:border-slate-700 text-[10px] sm:text-[11px] font-bold text-[#9E6706] dark:text-[#FDB813] uppercase tracking-wider">
              <Award className="w-3 h-3 text-[#9E6706] dark:text-[#FDB813] shrink-0" />
              <span>Analitik Rekrutmen Kader</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="font-mono font-normal text-slate-600 dark:text-slate-400">15 DPD Se-Sulut</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isDprtScoped
                ? `Monitoring Penambahan Anggota DPRt Desa ${session?.dprtAccess}`
                : isDpcScoped
                ? `Monitoring Penambahan Anggota DPC Kec. ${session?.dpcAccess}`
                : isDpdScoped
                ? `Monitoring Penambahan Anggota DPD ${session?.dpdAccess}`
                : growthDpdFilter && growthDpdFilter !== 'ALL'
                ? `Monitoring Penambahan Anggota ${growthDpdFilter}`
                : 'Monitoring Penambahan Anggota di 15 Kabupaten / Kota'}
            </h3>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Perbandingan laju penambahan anggota baru hasil rekrutmen kader lapangan dan peringkat keaktifan wilayah.
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Territory Filter Dropdown for Super Admin and DPW Admin */}
            {canFilterTerritory && setGrowthDpdFilter && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-medium shrink-0">Wilayah:</span>
                <select
                  value={growthDpdFilter || 'ALL'}
                  onChange={(e) => setGrowthDpdFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs max-w-[160px] sm:max-w-[200px] truncate"
                >
                  <option value="ALL">Semua Daerah (15 DPD)</option>
                  {SULUT_REGIONS.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Period Selector Segmented Tabs */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs overflow-x-auto max-w-full">
              {(
                [
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7days', label: '7 Hari' },
                  { id: '30days', label: '30 Hari' },
                  { id: 'all', label: 'Semua' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setGrowthPeriod(tab.id);
                    setPinnedDate(undefined);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    growthPeriod === tab.id && !pinnedDate
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {onOpenTerritorialMatrix && (
              <button
                onClick={() =>
                  onOpenTerritorialMatrix(
                    selectedDpdFilter !== 'ALL' ? selectedDpdFilter : 'Kabupaten Minahasa Selatan'
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Buka Matriks Struktur Organisasi"
              >
                <Table className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Matriks Struktur</span>
              </button>
            )}

            <button
              onClick={() => openDrilldownModalWithFocus()}
              className="px-3 py-1.5 rounded-lg bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Buka audit lengkap data anggota baru dalam modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Audit Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR METRIC KPI CARDS (CLEAN MONOCHROME) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Hari Ini */}
        <div
          onClick={() => {
            setGrowthPeriod('today');
            setPinnedDate(undefined);
          }}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthPeriod === 'today' && !pinnedDate
              ? 'bg-slate-50 dark:bg-slate-800/60 border-[#1A3282] dark:border-[#21409A] ring-1 ring-[#1A3282]/15'
              : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
              Hari Ini
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
            +{growthAnalytics.todayCount}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Anggota baru tervalidasi hari ini
          </p>
        </div>

        {/* Card 2: Total Periode */}
        <div
          onClick={() => {
            setGrowthPeriod('30days');
            setPinnedDate(undefined);
          }}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthPeriod === '30days' && !pinnedDate
              ? 'bg-slate-50 dark:bg-slate-800/60 border-[#1A3282] dark:border-[#21409A] ring-1 ring-[#1A3282]/15'
              : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
              Total Periode
            </span>
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
            +{growthAnalytics.totalNew}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Periode: {growthAnalytics.periodLabel}
          </p>
        </div>

        {/* Card 3: Kader Bergerak */}
        <div
          onClick={() => setGrowthViewTab('recruiters')}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthViewTab === 'recruiters'
              ? 'bg-slate-50 dark:bg-slate-800/60 border-[#1A3282] dark:border-[#21409A] ring-1 ring-[#1A3282]/15'
              : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
              Kader Bergerak
            </span>
            <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
            {growthAnalytics.activeRecruitersCount}
            <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1.5 font-sans">Kader</span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Penggerak aktif di lapangan
          </p>
        </div>

        {/* Card 4: Daerah Tertinggi */}
        <div
          onClick={() => {
            if (topDpd) {
              openDrilldownModalWithFocus(topDpd.label);
            }
          }}
          className="p-3 sm:p-4 rounded-xl border bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
                Daerah Tertinggi
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>
            <div
              className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white truncate"
              title={topDpd ? topDpd.label : 'Belum ada data'}
            >
              {topDpd ? topDpd.label : '-'}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs font-mono font-bold text-[#9E6706] dark:text-[#FDB813] mt-0.5 sm:mt-1">
            {topDpd ? `+${topDpd.total} Anggota Baru` : '0 Anggota'}
          </p>
        </div>
      </div>

      {/* 3. ACTIVE FILTER CHIP */}
      {(pinnedDate || filterRecruiter || (canFilterTerritory && growthDpdFilter && growthDpdFilter !== 'ALL')) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              Filter Aktif:{' '}
              {growthDpdFilter && growthDpdFilter !== 'ALL' && (
                <span>
                  Wilayah <strong>{growthDpdFilter}</strong>
                </span>
              )}
              {growthDpdFilter && growthDpdFilter !== 'ALL' && (pinnedDate || filterRecruiter) && <span> · </span>}
              {pinnedDate && (
                <span>
                  Tanggal <strong>{formatDisplayDate(pinnedDate)}</strong>
                </span>
              )}
              {pinnedDate && filterRecruiter && <span> · </span>}
              {filterRecruiter && (
                <span>
                  Direkrut oleh: <strong>{filterRecruiter}</strong>
                </span>
              )}{' '}
              ({growthAnalytics.totalNew} anggota baru)
            </span>
          </div>
          <button
            onClick={() => {
              setPinnedDate(undefined);
              setFilterRecruiter(undefined);
              if (setGrowthDpdFilter) setGrowthDpdFilter('ALL');
            }}
            className="text-slate-900 dark:text-white hover:underline font-semibold cursor-pointer shrink-0 self-end sm:self-auto"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* 4. DESKTOP SIDE-BY-SIDE SPLIT VIEW: CHART (LEFT 7 COLS) + LEADERBOARD / RECRUITERS (RIGHT 5 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* LEFT COLUMN (7 Cols on Desktop): 15-KAB/KOTA BAR CHART */}
        <div className="xl:col-span-7 flex flex-col">
          <Growth15KabKotaChart
            territorialTree={growthAnalytics.territorialTree}
            totalNew={growthAnalytics.totalNew}
            periodLabel={growthAnalytics.periodLabel}
            onSelectDpd={(dpdLabel) => openDrilldownModalWithFocus(dpdLabel)}
            onOpenAuditModal={() => openDrilldownModalWithFocus()}
          />
        </div>

        {/* RIGHT COLUMN (5 Cols on Desktop): LEADERBOARD 15 DPD & ACTIVE RECRUITERS */}
        <div className="xl:col-span-5 bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Tab Toggle Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div className="flex p-0.5 bg-slate-200/70 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto max-w-full">
                <button
                  onClick={() => setGrowthViewTab('territory')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    growthViewTab === 'territory'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Peringkat 15 DPD</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold">
                    {activeRegionsCount}/15
                  </span>
                </button>
                <button
                  onClick={() => setGrowthViewTab('recruiters')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    growthViewTab === 'recruiters'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>Kader Perekrut</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold">
                    {growthAnalytics.recruitersList.length}
                  </span>
                </button>
              </div>

              {isSuperAdmin && hasAddMembers && handleLoadTestScenario && growthAnalytics.totalNew === 0 && (
                <button
                  onClick={handleLoadTestScenario}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Contoh Data</span>
                </button>
              )}
            </div>

            {/* TAB 1: PERINGKAT PENAMBAHAN 15 DPD */}
            {growthViewTab === 'territory' && (
              <div className="mt-3 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {leaderboard15.map((item, idx) => {
                  const isDpdExpanded = !!expandedDpds[item.name];
                  const isTop = idx === 0 && item.total > 0;
                  const hasData = item.total > 0;

                  return (
                    <div
                      key={item.key}
                      className={`rounded-lg border transition-all ${
                        hasData
                          ? isTop
                            ? 'bg-white dark:bg-slate-900 border-[#FDB813] dark:border-[#FDB813]/70 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-75'
                      }`}
                    >
                      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
                        {/* Left Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                              hasData
                                ? isTop
                                  ? 'bg-[#FDB813] text-slate-950 font-black'
                                  : 'bg-[#1A3282] dark:bg-[#21409A] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {item.label}
                              </h5>
                            </div>
                            {hasData ? (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {item.dpcsCount} Kec. menyumbang
                                {item.recruiters.length > 0 &&
                                  ` · ${item.recruiters[0].nama.split(',')[0]} (+${item.recruiters[0].count})`}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400">Belum ada penambahan</div>
                            )}
                          </div>
                        </div>

                        {/* Right Count & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span
                              className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${
                                hasData ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                              }`}
                            >
                              {hasData ? `+${item.total}` : '0'}
                            </span>
                            {hasData && (
                              <span className="block text-[9.5px] font-mono text-slate-400">
                                {item.percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>

                          {hasData && item.dpcs.length > 0 ? (
                            <button
                              onClick={() => toggleDpdAccordion(item.name)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer ${
                                isDpdExpanded
                                  ? 'bg-[#1A3282] dark:bg-[#21409A] text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                              title="Rincian per kecamatan"
                            >
                              <span>DPC ({item.dpcs.length})</span>
                              {isDpdExpanded ? (
                                <ChevronDown className="w-2.5 h-2.5" />
                              ) : (
                                <ChevronRight className="w-2.5 h-2.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => openDrilldownModalWithFocus(item.label)}
                              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 cursor-pointer"
                              title="Audit wilayah"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Sub-List of DPCs */}
                      {isDpdExpanded && item.dpcs.length > 0 && (
                        <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {item.dpcs.map((dpcNode) => (
                              <div
                                key={dpcNode.name}
                                onClick={() => openDrilldownModalWithFocus(item.label, dpcNode.name)}
                                className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors cursor-pointer flex items-center justify-between text-[11px]"
                              >
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  Kec. {dpcNode.name}
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                  +{dpcNode.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: KINERJA KADER PEREKRUT */}
            {growthViewTab === 'recruiters' && (
              <div className="mt-3 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {growthAnalytics.recruitersList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <Users className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs">Belum ada kader penggerak tercatat pada filter ini.</p>
                  </div>
                ) : (
                  growthAnalytics.recruitersList.map((recruiter, idx) => (
                    <div
                      key={recruiter.nama}
                      onClick={() =>
                        openDrilldownModalWithFocus(undefined, undefined, undefined, recruiter.nama)
                      }
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-900 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-md font-bold font-mono text-[11px] flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-[#FDB813] text-slate-950 font-black' : 'bg-[#1A3282] dark:bg-[#21409A] text-white'}`}>
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {recruiter.nama}
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {recruiter.jabatan}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                          +{recruiter.count}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1">
                        {recruiter.territories.slice(0, 2).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                          >
                            Kec. {t.dpc} (+{t.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{activeRegionsCount} dari 15 DPD Aktif</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              Total: +{growthAnalytics.totalNew} Kader
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
