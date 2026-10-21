import React, { useState, useEffect, useMemo } from 'react';
import { Member, UserSession, SulutRegion } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, normalizeDpcName } from '../../utils/structureReadinessUtils';
import {
  BarChart3,
  PieChart,
  Tv,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  Clock,
  ArrowLeft,
  Award,
  Users,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  TrendingUp,
} from 'lucide-react';

export type AnalyticsScreenId =
  | 'grid'
  | 'column15'
  | 'drilldown'
  | 'composition'
  | 'leaderboard'
  | 'zones'
  | 'status_gender';

interface SulutAnalyticsPageProps {
  members: Member[];
  session?: UserSession;
  onRefreshCloud?: () => Promise<void>;
  isRefreshingCloud?: boolean;
  initialScreen?: string | null;
  isCleanMode?: boolean;
}

// 15 Kabupaten / Kota Resmi di Provinsi Sulawesi Utara (Urutan Standar Alfabetis)
export const SULUT_15_KABKOTA = [
  { key: 'bolmong', name: 'BOLAANG MONGONDOW', label: 'Bolaang Mongondow', zone: 'BMR' },
  { key: 'bolsel', name: 'BOLAANG MONGONDOW SELATAN', label: 'Bolaang Mongondow Selatan', zone: 'BMR' },
  { key: 'boltim', name: 'BOLAANG MONGONDOW TIMUR', label: 'Bolaang Mongondow Timur', zone: 'BMR' },
  { key: 'bolmut', name: 'BOLAANG MONGONDOW UTARA', label: 'Bolaang Mongondow Utara', zone: 'BMR' },
  { key: 'sitaro', name: 'KEP. SIAU TAGULANDANG BIARO', label: 'Kep. Siau Tagulandang Biaro', zone: 'Kepulauan' },
  { key: 'sangihe', name: 'KEPULAUAN SANGIHE', label: 'Kepulauan Sangihe', zone: 'Kepulauan' },
  { key: 'talaud', name: 'KEPULAUAN TALAUD', label: 'Kepulauan Talaud', zone: 'Kepulauan' },
  { key: 'bitung', name: 'KOTA BITUNG', label: 'Kota Bitung', zone: 'Daratan Minahasa' },
  { key: 'kotamobagu', name: 'KOTA KOTAMOBAGU', label: 'Kota Kotamobagu', zone: 'BMR' },
  { key: 'manado', name: 'KOTA MANADO', label: 'Kota Manado', zone: 'Daratan Minahasa' },
  { key: 'tomohon', name: 'KOTA TOMOHON', label: 'Kota Tomohon', zone: 'Daratan Minahasa' },
  { key: 'minahasa', name: 'MINAHASA', label: 'Minahasa', zone: 'Daratan Minahasa' },
  { key: 'minsel', name: 'MINAHASA SELATAN', label: 'Minahasa Selatan', zone: 'Daratan Minahasa' },
  { key: 'mitra', name: 'MINAHASA TENGGARA', label: 'Minahasa Tenggara', zone: 'Daratan Minahasa' },
  { key: 'minut', name: 'MINAHASA UTARA', label: 'Minahasa Utara', zone: 'Daratan Minahasa' },
];

export const SulutAnalyticsPage: React.FC<SulutAnalyticsPageProps> = ({
  members,
  session,
  onRefreshCloud,
  isRefreshingCloud = false,
  initialScreen = null,
  isCleanMode = false,
}) => {
  // Screen selection state
  const [activeScreen, setActiveScreen] = useState<AnalyticsScreenId>(() => {
    if (initialScreen && ['grid', 'column15', 'drilldown', 'composition', 'leaderboard', 'zones', 'status_gender'].includes(initialScreen)) {
      return initialScreen as AnalyticsScreenId;
    }
    return 'grid';
  });

  // Selected DPD for drilldown view
  const [selectedDrilldownDpd, setSelectedDrilldownDpd] = useState<string>('Minahasa Selatan');

  // Real-time WITA clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [autoRefreshInterval] = useState<number>(30); // 30s default
  const [countdown, setCountdown] = useState<number>(30);
  const [isTvCleanBar, setIsTvCleanBar] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Update WITA clock every second
  useEffect(() => {
    const updateWitaTime = () => {
      const now = new Date();
      const witaStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(witaStr);
    };

    updateWitaTime();
    const timer = setInterval(updateWitaTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRefreshCloud && !isRefreshingCloud) {
            onRefreshCloud().catch((e) => console.error('Auto refresh failed:', e));
          }
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, onRefreshCloud, isRefreshingCloud]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Open standalone popup / window on another monitor
  const handleOpenStandaloneScreen = (screenId: AnalyticsScreenId, dpd?: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('tab', 'analytics');
    url.searchParams.set('screen', screenId);
    url.searchParams.set('clean', 'true');
    if (dpd) url.searchParams.set('dpd', dpd);
    window.open(url.toString(), `_blank_${screenId}_${Date.now()}`, 'width=1920,height=1080,menubar=no,toolbar=no,location=no');
  };

  // --------------------------------------------------------------------------
  // DATA AGGREGATION ENGINE
  // --------------------------------------------------------------------------
  const analyticsData = useMemo(() => {
    const totalMembers = members.length;
    const pengurusCount = members.filter((m) => m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus')).length;
    const anggotaBiasaCount = totalMembers - pengurusCount;
    const activeCount = members.filter((m) => m.status === 'Aktif').length;
    const inactiveCount = totalMembers - activeCount;
    const withKtaCount = members.filter((m) => m.nomorEKTA && m.nomorEKTA.trim() !== '').length;
    const verifiedKtpCount = members.filter((m) => m.statusKtpVerified).length;

    // Gender breakdown
    const maleCount = members.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const femaleCount = members.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const unspecGenderCount = totalMembers - maleCount - femaleCount;

    // 15 Kab/Kota Data Mapping
    const kabKotaMap = new Map<string, {
      key: string;
      name: string;
      label: string;
      zone: string;
      total: number;
      active: number;
      pengurus: number;
      anggota: number;
      withKta: number;
      subdistrictsMap: Map<string, number>;
    }>();

    SULUT_15_KABKOTA.forEach((item) => {
      kabKotaMap.set(item.name, {
        key: item.key,
        name: item.name,
        label: item.label,
        zone: item.zone,
        total: 0,
        active: 0,
        pengurus: 0,
        anggota: 0,
        withKta: 0,
        subdistrictsMap: new Map<string, number>(),
      });
    });

    let unassignedCount = 0;
    const unassignedMembers: Member[] = [];

    members.forEach((m) => {
      let matchedKey: string | null = null;

      for (const item of SULUT_15_KABKOTA) {
        if (isDpdMatch(m.dpd, item.name) || isDpdMatch(m.dpd, item.label)) {
          matchedKey = item.name;
          break;
        }
      }

      if (matchedKey && kabKotaMap.has(matchedKey)) {
        const entry = kabKotaMap.get(matchedKey)!;
        entry.total += 1;
        if (m.status === 'Aktif') entry.active += 1;
        if (m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus')) {
          entry.pengurus += 1;
        } else {
          entry.anggota += 1;
        }
        if (m.nomorEKTA && m.nomorEKTA.trim() !== '') entry.withKta += 1;

        if (m.dpc && m.dpc.trim()) {
          const normDpc = m.dpc.trim();
          const prev = entry.subdistrictsMap.get(normDpc) || 0;
          entry.subdistrictsMap.set(normDpc, prev + 1);
        }
      } else {
        unassignedCount += 1;
        unassignedMembers.push(m);
      }
    });

    // 15 Kab/Kota List in standard display order
    const kabKotaList = SULUT_15_KABKOTA.map((item) => {
      const data = kabKotaMap.get(item.name)!;
      return {
        ...data,
        percentage: totalMembers > 0 ? (data.total / totalMembers) * 100 : 0,
      };
    });

    const maxChartValue = Math.max(...kabKotaList.map((b) => b.total), 10);
    const topPerformer = [...kabKotaList].sort((a, b) => b.total - a.total)[0];

    // Chart bars list
    const chartBars = [
      ...(unassignedCount > 0
        ? [
            {
              key: 'unknown',
              name: 'TIDAK DIKETAHUI',
              label: 'Tidak Diketahui',
              zone: 'Lainnya',
              total: unassignedCount,
              active: unassignedMembers.filter((m) => m.status === 'Aktif').length,
              pengurus: 0,
              anggota: unassignedCount,
              withKta: 0,
              percentage: totalMembers > 0 ? (unassignedCount / totalMembers) * 100 : 0,
              subdistrictsMap: new Map<string, number>(),
            },
          ]
        : []),
      ...kabKotaList,
    ];

    // Leaderboard sorted descending
    const leaderboard = [...kabKotaList].sort((a, b) => b.total - a.total);

    // 3 Geographic Zones in NasDem Corporate Theme
    const zones = [
      {
        name: 'Daratan Minahasa',
        description: 'Kota Manado, Bitung, Tomohon, Minahasa, Minsel, Mitra, Minut',
        color: '#2563EB', // NasDem Royal Blue
        regions: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa'),
        total: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa').reduce((s, k) => s + k.total, 0),
      },
      {
        name: 'Bolaang Mongondow Raya (BMR)',
        description: 'Kota Kotamobagu, Bolmong, Bolsel, Boltim, Bolmut',
        color: '#F59E0B', // NasDem Amber Gold
        regions: kabKotaList.filter((k) => k.zone === 'BMR'),
        total: kabKotaList.filter((k) => k.zone === 'BMR').reduce((s, k) => s + k.total, 0),
      },
      {
        name: 'Kepulauan Nusa Utara',
        description: 'Kep. Sitaro, Sangihe, Talaud',
        color: '#0284C7', // NasDem Navy Cyan
        regions: kabKotaList.filter((k) => k.zone === 'Kepulauan'),
        total: kabKotaList.filter((k) => k.zone === 'Kepulauan').reduce((s, k) => s + k.total, 0),
      },
    ];

    return {
      totalMembers,
      pengurusCount,
      anggotaBiasaCount,
      activeCount,
      inactiveCount,
      withKtaCount,
      verifiedKtpCount,
      maleCount,
      femaleCount,
      unspecGenderCount,
      kabKotaList,
      chartBars,
      maxChartValue,
      topPerformer,
      leaderboard,
      zones,
    };
  }, [members]);

  // Selected DPD Subdistricts for Drilldown
  const drilldownData = useMemo(() => {
    const matchedRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, selectedDrilldownDpd));
    const targetKabKota = analyticsData.kabKotaList.find(
      (k) => isDpdMatch(k.name, selectedDrilldownDpd) || isDpdMatch(k.label, selectedDrilldownDpd)
    );

    const subdistrictCounts: { name: string; count: number; percentage: number }[] = [];
    const totalDpdCount = targetKabKota?.total || 0;

    if (matchedRegion && matchedRegion.subdistricts) {
      matchedRegion.subdistricts.forEach((sub) => {
        let count = 0;
        if (targetKabKota) {
          for (const [dpcName, dpcVal] of targetKabKota.subdistrictsMap.entries()) {
            if (normalizeDpcName(dpcName) === normalizeDpcName(sub.name)) {
              count += dpcVal;
            }
          }
        }
        subdistrictCounts.push({
          name: sub.name,
          count,
          percentage: totalDpdCount > 0 ? (count / totalDpdCount) * 100 : 0,
        });
      });
    }

    subdistrictCounts.sort((a, b) => b.count - a.count);
    const maxSubCount = Math.max(...subdistrictCounts.map((s) => s.count), 5);

    return {
      dpdName: targetKabKota?.label || selectedDrilldownDpd,
      totalCount: totalDpdCount,
      pengurusCount: targetKabKota?.pengurus || 0,
      anggotaCount: targetKabKota?.anggota || 0,
      subdistricts: subdistrictCounts,
      maxSubCount,
    };
  }, [selectedDrilldownDpd, analyticsData]);

  // Y-axis tick intervals
  const yTicks = useMemo(() => {
    const max = analyticsData.maxChartValue;
    const step = Math.ceil(max / 5 / 10) * 10 || 10;
    const ticks = [];
    for (let i = 0; i <= max + step; i += step) {
      ticks.push(i);
      if (ticks.length >= 6) break;
    }
    return ticks;
  }, [analyticsData.maxChartValue]);

  const fmt = (n: number) => n.toLocaleString('id-ID');

  // ============================================================================
  // RENDER SECTIONS & CHARTS (INTERNATIONAL EXECUTIVE STANDARD)
  // ============================================================================

  // 1. CHART 1: 15 KABUPATEN/KOTA COLUMN BAR CHART (STANDAR INTERNASIONAL NASDEM)
  const renderColumn15Chart = (isSolo = false) => {
    const bars = analyticsData.chartBars;
    const maxVal = yTicks[yTicks.length - 1] || 100;
    const topPerformerKey = analyticsData.topPerformer?.key;
    const svgHeight = isSolo ? 560 : 440;
    const svgWidth = 1100;
    const chartTop = 45;
    const chartBottom = isSolo ? svgHeight - 140 : svgHeight - 110;
    const chartHeight = chartBottom - chartTop;
    const chartLeft = 65;
    const chartRight = svgWidth - 30;
    const chartWidth = chartRight - chartLeft;
    const barSlotWidth = chartWidth / bars.length;
    const barWidth = Math.min(barSlotWidth * 0.52, 42);

    return (
      <div className={`relative bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
        {/* International Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Distribusi Teritorial 15 Kabupaten / Kota
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PROVINSI SULAWESI UTARA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Standar visualisasi terpadu: perbandingan jumlah kader riil terdaftar di tiap DPD se-Sulut
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Color Legend Badge */}
            <div className="hidden lg:flex items-center gap-4 text-[11px] px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Kader DPD
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                Tertinggi (Rank 1)
              </span>
            </div>

            {!isSolo && (
              <button
                onClick={() => setActiveScreen('column15')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors"
                title="Perbesar Chart ke Layar Tunggal"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Layar Tunggal</span>
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('column15')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-colors"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Layar Baru</span>
            </button>
          </div>
        </div>

        {/* SVG High-Precision Executive Canvas */}
        <div className="w-full overflow-x-auto select-none py-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[750px]"
          >
            <defs>
              {/* NasDem Executive Royal Blue Gradient */}
              <linearGradient id="nasdemBlueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.85" />
              </linearGradient>

              {/* NasDem Blue Hover Gradient */}
              <linearGradient id="nasdemBlueHoverGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
              </linearGradient>

              {/* NasDem Signature Amber Gold Gradient (Rank 1 Highlight) */}
              <linearGradient id="nasdemGoldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.9" />
              </linearGradient>

              {/* NasDem Gold Hover */}
              <linearGradient id="nasdemGoldHoverGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="1" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
              </linearGradient>

              {/* Neutral Empty State Gradient */}
              <linearGradient id="nasdemMutedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1E293B" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((val, idx) => {
              const y = chartBottom - (val / maxVal) * chartHeight;
              return (
                <g key={`ytick-${idx}`}>
                  <line
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray={val === 0 ? 'none' : '4 4'}
                    strokeWidth={val === 0 ? '1.5' : '1'}
                  />
                  <text
                    x={chartLeft - 14}
                    y={y + 4}
                    fill="#64748B"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis Title */}
            <text
              transform={`rotate(-90, 22, ${chartTop + chartHeight / 2})`}
              x={22}
              y={chartTop + chartHeight / 2}
              fill="#64748B"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              letterSpacing="1"
            >
              JUMLAH KADER &amp; PENGURUS
            </text>

            {/* Bars & Top Values & X-Labels */}
            {bars.map((item, idx) => {
              const xCenter = chartLeft + idx * barSlotWidth + barSlotWidth / 2;
              const barX = xCenter - barWidth / 2;
              const barH = (item.total / maxVal) * chartHeight;
              const barY = chartBottom - barH;
              const isHovered = hoveredBarIndex === idx;
              const isTopRank = item.key === topPerformerKey && item.total > 0;
              const isEmpty = item.total === 0;

              // Color determination (Professional NasDem Theme: Blue primary, Gold for rank #1, Slate for empty)
              let barFill = 'url(#nasdemBlueGrad)';
              if (isEmpty) {
                barFill = 'url(#nasdemMutedGrad)';
              } else if (isTopRank) {
                barFill = isHovered ? 'url(#nasdemGoldHoverGrad)' : 'url(#nasdemGoldGrad)';
              } else if (isHovered) {
                barFill = 'url(#nasdemBlueHoverGrad)';
              }

              return (
                <g
                  key={item.key}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  onClick={() => {
                    setSelectedDrilldownDpd(item.label);
                    setActiveScreen('drilldown');
                  }}
                >
                  {/* Subtle column hover background */}
                  {isHovered && (
                    <rect
                      x={chartLeft + idx * barSlotWidth + 2}
                      y={chartTop}
                      width={barSlotWidth - 4}
                      height={chartHeight + 6}
                      fill="rgba(59, 130, 246, 0.05)"
                      rx="4"
                    />
                  )}

                  {/* The Bar */}
                  <rect
                    x={barX}
                    y={isEmpty ? chartBottom - 2 : barY}
                    width={barWidth}
                    height={isEmpty ? 2 : Math.max(barH, 4)}
                    fill={barFill}
                    rx="3"
                    ry="3"
                    stroke={isTopRank ? '#F59E0B' : isHovered ? '#60A5FA' : 'rgba(59, 130, 246, 0.4)'}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    style={{
                      filter: isTopRank
                        ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.35))'
                        : isHovered
                        ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))'
                        : 'none',
                      transition: 'all 0.15s ease-out',
                    }}
                  />

                  {/* Exact Number on Top of Bar */}
                  <text
                    x={xCenter}
                    y={isEmpty ? chartBottom - 8 : barY - 8}
                    fill={isEmpty ? '#475569' : isTopRank ? '#FBBF24' : '#E2E8F0'}
                    fontSize={isSolo ? '13' : '11.5'}
                    fontWeight={isTopRank ? '800' : '700'}
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {fmt(item.total)}
                  </text>

                  {/* Angled 45° X-Axis Label */}
                  <g transform={`translate(${xCenter}, ${chartBottom + 16})`}>
                    <text
                      transform="rotate(-45)"
                      fill={isHovered ? '#60A5FA' : isTopRank ? '#FCD34D' : '#94A3B8'}
                      fontSize={isSolo ? '11.5' : '10'}
                      fontWeight={isHovered || isTopRank ? '700' : '600'}
                      textAnchor="end"
                      letterSpacing="0.4"
                    >
                      {item.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Professional Footer Status Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            {hoveredBarIndex !== null && bars[hoveredBarIndex] ? (
              <div className="flex items-center gap-3 animate-in fade-in duration-100">
                <span className="font-bold text-white">
                  {bars[hoveredBarIndex].label}:
                </span>
                <span className="text-blue-400 font-mono font-bold">
                  {fmt(bars[hoveredBarIndex].total)} Kader ({bars[hoveredBarIndex].percentage.toFixed(1)}% Sulut)
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-amber-400">
                  {bars[hoveredBarIndex].pengurus} Pengurus SK
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-300">
                  {bars[hoveredBarIndex].anggota} Anggota KTP
                </span>
              </div>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">&bull;</span>
                Klik pada batang wilayah untuk melakukan drilldown rincian per kecamatan
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            PARTAI NASDEM DPW SULAWESI UTARA &bull; 15 DPD TERDATA
          </div>
        </div>
      </div>
    );
  };

  // 2. CHART 2: DRILLDOWN DETAIL KECAMATAN (STANDAR KORPORAT)
  const renderDrilldownChart = (isSolo = false) => {
    const { dpdName, totalCount, pengurusCount, anggotaCount, subdistricts, maxSubCount } = drilldownData;

    return (
      <div className={`bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
        {/* Header with DPD Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('column15')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Kembali ke Grafik 15 Kab/Kota"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                  Rincian Kecamatan: {dpdName}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {fmt(totalCount)} Kader
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sebaran anggota &amp; kelengkapan struktur pengurus DPC tingkat kecamatan
              </p>
            </div>
          </div>

          {/* DPD Dropdown Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedDrilldownDpd}
                onChange={(e) => setSelectedDrilldownDpd(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                {SULUT_15_KABKOTA.map((item) => (
                  <option key={item.key} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {!isSolo && (
              <button
                onClick={() => setActiveScreen('drilldown')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Layar Penuh Drilldown"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}

            <button
              onClick={() => handleOpenStandaloneScreen('drilldown', selectedDrilldownDpd)}
              className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-colors"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subdistrict Bars List */}
        <div className="space-y-3 my-2 max-h-[520px] overflow-y-auto pr-2">
          {subdistricts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data kader yang terpetakan untuk kecamatan di wilayah {dpdName}.
            </div>
          ) : (
            subdistricts.map((sub, idx) => {
              const barPercent = maxSubCount > 0 ? (sub.count / maxSubCount) * 100 : 0;
              return (
                <div key={sub.name} className="group flex items-center gap-3 text-xs">
                  {/* Rank Index */}
                  <span className="w-6 text-slate-400 font-mono font-bold text-right shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Kecamatan Name */}
                  <span className="w-36 sm:w-44 truncate font-semibold text-slate-300 group-hover:text-white shrink-0">
                    Kec. {sub.name}
                  </span>

                  {/* Progress Bar Container */}
                  <div className="flex-1 h-5 bg-slate-950 rounded-md overflow-hidden p-0.5 border border-slate-800 relative flex items-center">
                    <div
                      className="h-full rounded transition-all duration-300 bg-gradient-to-r from-blue-700 to-blue-500"
                      style={{
                        width: `${Math.max(barPercent, sub.count > 0 ? 3 : 0)}%`,
                      }}
                    />
                    {sub.count > 0 && (
                      <span className="absolute left-2.5 text-[10.5px] font-mono font-bold text-white drop-shadow">
                        {fmt(sub.count)}
                      </span>
                    )}
                  </div>

                  {/* Exact Number & % */}
                  <div className="w-20 text-right shrink-0">
                    <span className="font-mono font-bold text-white text-xs block leading-none">
                      {fmt(sub.count)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {sub.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Total: <strong className="text-white">{subdistricts.length} Kecamatan</strong></span>
            <span>&bull;</span>
            <span>Pengurus SK: <strong className="text-amber-400">{fmt(pengurusCount)}</strong></span>
            <span>&bull;</span>
            <span>Anggota KTP: <strong className="text-blue-400">{fmt(anggotaCount)}</strong></span>
          </div>
          <button
            onClick={() => setActiveScreen('column15')}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            &larr; Ringkasan 15 Kab/Kota
          </button>
        </div>
      </div>
    );
  };

  // 3. CHART 3: KOMPOSISI PENGURUS VS ANGGOTA (ELEGANT DUOTONE DONUT)
  const renderCompositionChart = (isSolo = false) => {
    const { totalMembers, pengurusCount, anggotaBiasaCount, activeCount, withKtaCount } = analyticsData;
    const pengurusPct = totalMembers > 0 ? (pengurusCount / totalMembers) * 100 : 0;
    const anggotaPct = totalMembers > 0 ? (anggotaBiasaCount / totalMembers) * 100 : 0;

    const size = isSolo ? 320 : 210;
    const strokeWidth = isSolo ? 30 : 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pengurusOffset = circumference - (pengurusPct / 100) * circumference;

    return (
      <div className={`bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Komposisi Struktural
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rasio Pengurus Ber-SK vs Anggota Basis KTP
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('composition')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Komposisi"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('composition')}
              className="p-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Donut graphic and stats */}
        <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-8">
          {/* SVG Donut */}
          <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle (Anggota KTP - NasDem Blue) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#2563EB"
                strokeWidth={strokeWidth}
                opacity={0.85}
              />
              {/* Foreground circle (Pengurus Ber-SK - NasDem Amber Gold) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={pengurusOffset}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Kader
              </span>
              <span className={`${isSolo ? 'text-4xl' : 'text-2xl'} font-extrabold text-white font-mono`}>
                {fmt(totalMembers)}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                {activeCount} Aktif ({totalMembers > 0 ? ((activeCount / totalMembers) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="space-y-3 w-full sm:max-w-xs">
            {/* Pengurus Card */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Pengurus Ber-SK
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {pengurusPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {fmt(pengurusCount)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Struktural DPW - DPRt
                </span>
              </div>
            </div>

            {/* Anggota Biasa Card */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-bold text-blue-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Anggota Basis KTP
                </span>
                <span className="font-mono font-bold text-blue-400">
                  {anggotaPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {fmt(anggotaBiasaCount)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Kader Non-Struktural
                </span>
              </div>
            </div>

            {/* e-KTA Status */}
            <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-400">
              <span>e-KTA Terverifikasi:</span>
              <span className="font-mono font-bold text-emerald-400">
                {fmt(withKtaCount)} ({totalMembers > 0 ? ((withKtaCount / totalMembers) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center font-mono">
          KOMPOSISI RESMI PARTAI NASDEM SULUT
        </div>
      </div>
    );
  };

  // 4. CHART 4: LEADERBOARD & PERINGKAT TERITORIAL
  const renderLeaderboardChart = (isSolo = false) => {
    const { leaderboard } = analyticsData;
    const highestCount = leaderboard[0]?.total || 1;

    return (
      <div className={`bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Peringkat Wilayah Terbanyak
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Urutan 15 DPD Kabupaten / Kota Berdasarkan Headcount Anggota Riil
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('leaderboard')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Leaderboard"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('leaderboard')}
              className="p-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Leaderboard rows */}
        <div className={`space-y-2 my-2 ${isSolo ? 'overflow-y-visible' : 'max-h-[420px] overflow-y-auto pr-2'}`}>
          {leaderboard.map((item, idx) => {
            const barW = highestCount > 0 ? (item.total / highestCount) * 100 : 0;
            const isRank1 = idx === 0 && item.total > 0;
            const isRank2 = idx === 1 && item.total > 0;
            const isRank3 = idx === 2 && item.total > 0;

            return (
              <div
                key={item.key}
                onClick={() => {
                  setSelectedDrilldownDpd(item.label);
                  setActiveScreen('drilldown');
                }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isRank1
                    ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30'
                    : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800/80'
                }`}
              >
                {/* Rank Badge */}
                <span
                  className={`w-7 text-center font-bold text-xs shrink-0 font-mono ${
                    isRank1
                      ? 'text-amber-400'
                      : isRank2
                      ? 'text-slate-300'
                      : isRank3
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Region details */}
                <div className="w-44 sm:w-56 shrink-0 truncate">
                  <span className={`font-bold text-xs block leading-tight ${isRank1 ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Zona {item.zone}
                  </span>
                </div>

                {/* Relative progress bar (NasDem Blue, Gold for Rank 1) */}
                <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isRank1 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.max(barW, item.total > 0 ? 3 : 0)}%`,
                    }}
                  />
                </div>

                {/* Headcount */}
                <div className="w-24 text-right shrink-0">
                  <span className="font-mono font-bold text-white text-xs block leading-none">
                    {fmt(item.total)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {item.percentage.toFixed(1)}% Sulut
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center font-mono">
          KLIK BARIS WILAYAH UNTUK RINCIAN KECAMATAN
        </div>
      </div>
    );
  };

  // 5. CHART 5: SEBARAN 3 ZONA GEOGRAFIS SULAWESI UTARA
  const renderZonesChart = (isSolo = false) => {
    const { zones, totalMembers } = analyticsData;

    return (
      <div className={`bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Distribusi 3 Zona Teritorial Sulut
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daratan Minahasa &bull; Bolaang Mongondow Raya (BMR) &bull; Kepulauan Nusa Utara
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('zones')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Zona"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('zones')}
              className="p-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Zone Cards in NasDem Cohesive Palette */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
          {zones.map((zone) => {
            const pct = totalMembers > 0 ? (zone.total / totalMembers) * 100 : 0;
            return (
              <div
                key={zone.name}
                className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono"
                      style={{
                        backgroundColor: `${zone.color}15`,
                        color: zone.color,
                        border: `1px solid ${zone.color}35`,
                      }}
                    >
                      {zone.name}
                    </span>
                    <span className="font-mono font-bold text-xs text-white">
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {fmt(zone.total)}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Total Anggota Riil
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-800/80 pt-2 leading-relaxed">
                    {zone.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{zone.regions.length} Kab/Kota</span>
                  <button
                    onClick={() => {
                      if (zone.regions[0]) {
                        setSelectedDrilldownDpd(zone.regions[0].label);
                        setActiveScreen('drilldown');
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Rincian &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center font-mono">
          STRUKTUR TERITORIAL PROVINSI SULAWESI UTARA
        </div>
      </div>
    );
  };

  // 6. CHART 6: STATUS, GENDER & DEMOGRAFI
  const renderStatusGenderChart = (isSolo = false) => {
    const { totalMembers, maleCount, femaleCount, activeCount, withKtaCount, verifiedKtpCount } = analyticsData;
    const malePct = totalMembers > 0 ? (maleCount / totalMembers) * 100 : 0;
    const femalePct = totalMembers > 0 ? (femaleCount / totalMembers) * 100 : 0;

    return (
      <div className={`bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-md ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Demografi &amp; Status Verifikasi
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rasio Gender, e-KTA Resmi, dan Keaktifan Status Anggota
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('status_gender')}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Demografi"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('status_gender')}
              className="p-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30"
              title="Buka di Jendela / Monitor Eksternal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          {/* Gender Ratio Card */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider font-mono">
              Rasio Gender Kader
            </span>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-blue-400">Laki-laki</span>
                  <span className="font-mono text-white">{fmt(maleCount)} ({malePct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${malePct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-amber-400">Perempuan</span>
                  <span className="font-mono text-white">{fmt(femaleCount)} ({femalePct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${femalePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Verification & e-KTA Card */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider font-mono">
              Validasi Dokumen Identitas
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Nomor e-KTA Resmi:</span>
                <span className="font-mono font-bold text-emerald-400">{fmt(withKtaCount)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">KTP Terverifikasi:</span>
                <span className="font-mono font-bold text-blue-400">{fmt(verifiedKtpCount)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300">Status Keaktifan:</span>
                <span className="font-mono font-bold text-amber-400">{fmt(activeCount)} Aktif</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 text-center font-mono">
          AUDIT VALIDASI DATA KADER NASDEM SULUT
        </div>
      </div>
    );
  };

  // ============================================================================
  // TOP MONITORING STATUS BAR (STANDAR RUANG KONTROL COMMAND CENTER)
  // ============================================================================
  const renderCommandCenterHeader = () => {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        {/* Left Branding & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase font-mono">
                DPW PARTAI NASDEM SULUT
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                LIVE MONITORING
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Pusat Analisis &amp; Visualisasi Data Teritorial 15 Kabupaten / Kota
            </span>
          </div>
        </div>

        {/* Center Screen Navigator Pill Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveScreen('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗂️ Grid Panel
          </button>
          <button
            onClick={() => setActiveScreen('column15')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'column15'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 1. Batang 15 Kab
          </button>
          <button
            onClick={() => setActiveScreen('drilldown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'drilldown'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔍 2. Drilldown Kec
          </button>
          <button
            onClick={() => setActiveScreen('composition')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'composition'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🍩 3. Komposisi
          </button>
          <button
            onClick={() => setActiveScreen('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏆 4. Peringkat
          </button>
          <button
            onClick={() => setActiveScreen('zones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'zones'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗺️ 5. Zona Wilayah
          </button>
          <button
            onClick={() => setActiveScreen('status_gender')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'status_gender'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📈 6. Demografi
          </button>
        </div>

        {/* Right Tools: WITA Clock, Refresh, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* WITA Digital Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
              {currentTime || '--:--:--'} WITA
            </span>
          </div>

          {/* Auto Refresh Indicator */}
          <div
            title={`Pembaruan otomatis tiap ${autoRefreshInterval} detik (Tersisa: ${countdown}s)`}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
            <span>{countdown}s</span>
          </div>

          {/* Manual Refresh Button */}
          {onRefreshCloud && (
            <button
              onClick={() => onRefreshCloud()}
              disabled={isRefreshingCloud}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Perbarui Data Langsung dari Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Native Fullscreen TV Mode */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shadow-sm"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh TV (Edge-to-Edge)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  // Quick KPI Metric Highlights Bar
  const renderQuickKpiBar = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Kader Terdaftar
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {fmt(analyticsData.totalMembers)}
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">
              15 DPD
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Pengurus Ber-SK
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {fmt(analyticsData.pengurusCount)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {analyticsData.totalMembers > 0 ? ((analyticsData.pengurusCount / analyticsData.totalMembers) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
            Anggota Basis KTP
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
              {fmt(analyticsData.anggotaBiasaCount)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {analyticsData.totalMembers > 0 ? ((analyticsData.anggotaBiasaCount / analyticsData.totalMembers) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            e-KTA Resmi Terbit
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {fmt(analyticsData.withKtaCount)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Tervalidasi
            </span>
          </div>
        </div>

        <div className="hidden lg:block p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Kader Tertinggi
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold text-white truncate max-w-[140px]" title={analyticsData.topPerformer?.label}>
              {analyticsData.topPerformer?.label || '-'}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {fmt(analyticsData.topPerformer?.total || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN BODY RENDER (GRID vs SINGLE SCREEN)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Command Center Top Navigation Bar */}
      {!isTvCleanBar && renderCommandCenterHeader()}

      {/* Floating Toggle to show/hide clean bar on TV walls */}
      {isCleanMode && (
        <button
          onClick={() => setIsTvCleanBar(!isTvCleanBar)}
          className="fixed top-2 right-2 z-50 p-1.5 rounded-xl bg-black/70 hover:bg-black text-slate-400 hover:text-white text-xs opacity-50 hover:opacity-100 transition-opacity border border-slate-800"
          title={isTvCleanBar ? 'Tampilkan Bar Kontrol' : 'Sembunyikan Bar Kontrol untuk Layar Bersih'}
        >
          {isTvCleanBar ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* 2. Main Content Viewport */}
      <div className="flex-1 p-4 sm:p-6 max-w-[1800px] w-full mx-auto">
        {/* Render Single Screen Mode if selected */}
        {activeScreen === 'column15' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 1: DISTRIBUSI TERITORIAL 15 KABUPATEN / KOTA
              </span>
            </div>
            {renderColumn15Chart(true)}
          </div>
        )}

        {activeScreen === 'drilldown' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 2: RINCIAN SEBARAN KECAMATAN (DPC)
              </span>
            </div>
            {renderDrilldownChart(true)}
          </div>
        )}

        {activeScreen === 'composition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 3: KOMPOSISI PENGURUS BER-SK VS ANGGOTA KTP
              </span>
            </div>
            {renderCompositionChart(true)}
          </div>
        )}

        {activeScreen === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 4: PERINGKAT WILAYAH TERBANYAK
              </span>
            </div>
            {renderLeaderboardChart(true)}
          </div>
        )}

        {activeScreen === 'zones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 5: SEBARAN 3 ZONA GEOGRAFIS SULUT
              </span>
            </div>
            {renderZonesChart(true)}
          </div>
        )}

        {activeScreen === 'status_gender' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LAYAR 6: DEMOGRAFI &amp; STATUS VERIFIKASI DOKUMEN
              </span>
            </div>
            {renderStatusGenderChart(true)}
          </div>
        )}

        {/* Default Multi-Panel Grid Mode */}
        {activeScreen === 'grid' && (
          <div className="space-y-6">
            {/* Quick KPI Row */}
            {renderQuickKpiBar()}

            {/* Row 1: Main 15 Kab/Kota Column Chart */}
            {renderColumn15Chart(false)}

            {/* Row 2: Drilldown Kecamatan & Komposisi Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderDrilldownChart(false)}
              {renderCompositionChart(false)}
            </div>

            {/* Row 3: Leaderboard & 3 Geographics Zones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderLeaderboardChart(false)}
              {renderZonesChart(false)}
            </div>

            {/* Row 4: Demografi & Verifikasi Status */}
            {renderStatusGenderChart(false)}
          </div>
        )}
      </div>
    </div>
  );
};
