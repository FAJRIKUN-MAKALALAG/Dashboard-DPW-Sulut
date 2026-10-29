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
  Building2,
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
  expandedDpcs,
  toggleDpcAccordion,
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-sm transition-colors space-y-4 sm:space-y-6">
      {/* 1. SECTION HEADER (2-TIER: TITLE FULL WIDTH & TOOLBAR ROW) */}
      <div className="space-y-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap self-start shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="tracking-wider uppercase">Cadre Recruitment Analytics</span>
            <span className="text-amber-300 dark:text-amber-700">·</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">Direkrut Kader Penggerak</span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
            {isDprtScoped
              ? `Data dinamika laju rekrutmen dan sebaran anggota baru khusus di wilayah kerja basis DPRt Desa ${session?.dprtAccess} (Kec. ${session?.dpcAccess}).`
              : isDpcScoped
              ? `Data dinamika laju rekrutmen dan sebaran anggota baru khusus di wilayah kerja DPC Kec. ${session?.dpcAccess} (${session?.dpdAccess}).`
              : isDpdScoped
              ? `Data dinamika laju rekrutmen dan sebaran anggota baru di seluruh kecamatan & desa se-${session?.dpdAccess}.`
              : growthDpdFilter && growthDpdFilter !== 'ALL'
              ? `Memantau laju rekrutmen kader dan sebaran anggota baru khusus di wilayah ${growthDpdFilter}.`
              : 'Perbandingan laju penambahan anggota baru hasil rekrutmen kader lapangan di 15 DPD Kabupaten / Kota se-Sulawesi Utara.'}
          </p>
        </div>

        {/* Toolbar / Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5">
          {/* Left Controls: Filter Wilayah & Period Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Territory Filter Dropdown for Super Admin and DPW Admin */}
            {canFilterTerritory && setGrowthDpdFilter && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-slate-500 font-medium shrink-0">Wilayah:</span>
                <select
                  value={growthDpdFilter || 'ALL'}
                  onChange={(e) => setGrowthDpdFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs max-w-[170px] sm:max-w-[220px] truncate"
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

            {/* Scoped Territory Indicator for Regional Admins */}
            {!canFilterTerritory && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isDprtScoped
                    ? `DPRt ${session?.dprtAccess}`
                    : isDpcScoped
                    ? `Kec. ${session?.dpcAccess}`
                    : `${session?.dpdAccess}`}
                </span>
              </div>
            )}

            {/* Period Selector Segmented Tabs */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs overflow-x-auto max-w-full shadow-2xs">
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
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    growthPeriod === tab.id && !pinnedDate
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenTerritorialMatrix && (
              <button
                onClick={() =>
                  onOpenTerritorialMatrix(
                    selectedDpdFilter !== 'ALL' ? selectedDpdFilter : 'Kabupaten Minahasa Selatan'
                  )
                }
                className="btn-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shadow-2xs"
                title="Buka Matriks Struktur Organisasi & Input Template Berurut"
              >
                <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Matriks Struktur</span>
              </button>
            )}

            <button
              onClick={() => openDrilldownModalWithFocus()}
              className="btn-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Buka audit lengkap data anggota baru dalam modal"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Audit Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR METRIC KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Hari Ini */}
        <div
          onClick={() => {
            setGrowthPeriod('today');
            setPinnedDate(undefined);
          }}
          className={`p-2.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthPeriod === 'today' && !pinnedDate
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">Hari Ini</span>
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{growthAnalytics.todayCount}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Anggota baru tervalidasi
          </p>
        </div>

        {/* Card 2: Total Periode */}
        <div
          onClick={() => {
            setGrowthPeriod('30days');
            setPinnedDate(undefined);
          }}
          className={`p-2.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthPeriod === '30days' && !pinnedDate
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">Total Periode</span>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-tight">
            +{growthAnalytics.totalNew}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Periode: {growthAnalytics.periodLabel}
          </p>
        </div>

        {/* Card 3: Kader Bergerak */}
        <div
          onClick={() => setGrowthViewTab('recruiters')}
          className={`p-2.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            growthViewTab === 'recruiters'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 shadow-xs ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 truncate">Kader Bergerak</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {growthAnalytics.activeRecruitersCount}
            <span className="text-xs sm:text-sm font-semibold ml-1 uppercase font-sans">Kader</span>
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
          className="p-2.5 sm:p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 truncate">Daerah Tertinggi</span>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>
            <div
              className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white truncate"
              title={topDpd ? topDpd.label : 'Belum ada data'}
            >
              {topDpd ? topDpd.label : '-'}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
            {topDpd ? `+${topDpd.total} Anggota Baru` : '0 Anggota'}
          </p>
        </div>
      </div>

      {/* 3. ACTIVE FILTER CHIP */}
      {(pinnedDate || filterRecruiter || (canFilterTerritory && growthDpdFilter && growthDpdFilter !== 'ALL')) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 px-4 py-2.5 rounded-xl text-xs gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
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
            className="text-amber-700 dark:text-amber-300 hover:underline font-semibold cursor-pointer shrink-0 self-end sm:self-auto"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* 4. 15-KABUPATEN/KOTA BAR CHART (DISTRIBUSI PENAMBAHAN ANGGOTA 15 DPD) */}
      <Growth15KabKotaChart
        territorialTree={growthAnalytics.territorialTree}
        totalNew={growthAnalytics.totalNew}
        periodLabel={growthAnalytics.periodLabel}
        onSelectDpd={(dpdLabel) => openDrilldownModalWithFocus(dpdLabel)}
        onOpenAuditModal={() => openDrilldownModalWithFocus()}
      />

      {/* 5. TAB TOGGLE: PERINGKAT 15 DPD vs KADER PEREKRUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => setGrowthViewTab('territory')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              growthViewTab === 'territory'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>1. Peringkat Penambahan 15 DPD</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold">
              {activeRegionsCount} Bergerak
            </span>
          </button>
          <button
            onClick={() => setGrowthViewTab('recruiters')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              growthViewTab === 'recruiters'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>2. Kader Perekrut Teraktif</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-mono font-bold">
              {growthAnalytics.recruitersList.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && hasAddMembers && handleLoadTestScenario && growthAnalytics.totalNew === 0 && (
            <button
              onClick={handleLoadTestScenario}
              className="btn-white text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>Muat Contoh Rekrutmen (+100 Minsel, +50 Manado)</span>
            </button>
          )}
          <span className="text-xs text-slate-500 font-mono">
            {growthAnalytics.totalNew} Anggota Baru Direkrut
          </span>
        </div>
      </div>

      {/* 6. VIEW 1: PERINGKAT PENAMBAHAN 15 DPD */}
      {growthViewTab === 'territory' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
            <span>Rincian penambahan anggota baru berdasarkan domisili KTP faktual di 15 DPD se-Sulawesi Utara:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {activeRegionsCount} dari 15 DPD Memiliki Penambahan
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {leaderboard15.map((item, idx) => {
              const isDpdExpanded = !!expandedDpds[item.name];
              const isTop = idx === 0 && item.total > 0;
              const hasData = item.total > 0;

              return (
                <div
                  key={item.key}
                  className={`rounded-xl border transition-all ${
                    hasData
                      ? isTop
                        ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/50 opacity-80'
                  }`}
                >
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Info: Rank, Name, Zone, Recruiters */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          hasData
                            ? isTop
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {item.label}
                          </h5>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {item.zone}
                          </span>
                        </div>

                        {hasData ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>{item.dpcsCount} Kecamatan menyumbang</span>
                            {item.recruiters.length > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                  Perekrut: {item.recruiters.slice(0, 2).map((r) => `${r.nama.split(',')[0]} (+${r.count})`).join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Belum ada penambahan anggota pada periode ini
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Numbers & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Addition Count & Percentage Progress */}
                      <div className="text-left sm:text-right">
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <span
                            className={`font-mono font-extrabold text-sm sm:text-base ${
                              hasData ? (isTop ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400') : 'text-slate-400'
                            }`}
                          >
                            {hasData ? `+${item.total}` : '0'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">Anggota</span>
                        </div>
                        {hasData && (
                          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${isTop ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-slate-500">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDrilldownModalWithFocus(item.label)}
                          className="btn-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Buka daftar lengkap anggota baru di DPD ini"
                        >
                          <Maximize2 className="w-3 h-3 text-blue-500" />
                          <span className="text-slate-700 dark:text-slate-300">Audit</span>
                        </button>

                        {hasData && item.dpcs.length > 0 && (
                          <button
                            onClick={() => toggleDpdAccordion(item.name)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDpdExpanded
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                            }`}
                            title="Tampilkan rincian per kecamatan"
                          >
                            <span>{isDpdExpanded ? 'Tutup' : `DPC (${item.dpcs.length})`}</span>
                            {isDpdExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sub-List of DPCs if user toggled accordion */}
                  {isDpdExpanded && item.dpcs.length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                        Sebaran per DPC (Kecamatan) di {item.label}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {item.dpcs.map((dpcNode) => (
                          <div
                            key={dpcNode.name}
                            onClick={() => openDrilldownModalWithFocus(item.label, dpcNode.name)}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                Kec. {dpcNode.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {dpcNode.dprts.length} Desa/Kelurahan
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
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
        </div>
      )}

      {/* 7. VIEW 2: KINERJA KADER PEREKRUT */}
      {growthViewTab === 'recruiters' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
            <span>Daftar kader penggerak yang aktif merekrut dan mendaftarkan anggota baru di lapangan:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {growthAnalytics.recruitersList.length} Kader Menggerakkan Rekrutmen
            </span>
          </div>

          {growthAnalytics.recruitersList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                Belum ada kader penggerak yang tercatat merekrut pada filter ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {growthAnalytics.recruitersList.map((recruiter, idx) => (
                <div
                  key={recruiter.nama}
                  onClick={() =>
                    openDrilldownModalWithFocus(undefined, undefined, undefined, recruiter.nama)
                  }
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-950 transition-all cursor-pointer shadow-2xs hover:shadow-sm group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {recruiter.nama}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {recruiter.jabatan}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                        +{recruiter.count}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Sebaran Alamat KTP Rekrutan:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {recruiter.territories.slice(0, 3).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                          >
                            Kec. {t.dpc} ({t.dprt}: +{t.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Lihat Anggota Rekrutan</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
