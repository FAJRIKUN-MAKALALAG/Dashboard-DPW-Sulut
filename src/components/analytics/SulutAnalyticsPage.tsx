import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Member, UserSession, SulutRegion } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { normalizeDpdName, isDpdMatch, normalizeDpcName } from '../../utils/structureReadinessUtils';
import {
  BarChart3,
  PieChart,
  Tv,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  Clock,
  Radio,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
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

// 15 Standard Kabupaten / Kota in Sulawesi Utara (Alphabetical Order matching Highcharts reference)
export const SULUT_15_KABKOTA = [
  { key: 'bolmong', name: 'BOLAANG MONGONDOW', label: 'Bolaang Mongondow', color: '#00E396', zone: 'BMR' },
  { key: 'bolsel', name: 'BOLAANG MONGONDOW SELATAN', label: 'Bolaang Mongondow Selatan', color: '#FEB019', zone: 'BMR' },
  { key: 'boltim', name: 'BOLAANG MONGONDOW TIMUR', label: 'Bolaang Mongondow Timur', color: '#FF4560', zone: 'BMR' },
  { key: 'bolmut', name: 'BOLAANG MONGONDOW UTARA', label: 'Bolaang Mongondow Utara', color: '#775DD0', zone: 'BMR' },
  { key: 'sitaro', name: 'KEP. SIAU TAGULANDANG BIARO', label: 'Kep. Siau Tagulandang Biaro', color: '#E040FB', zone: 'Kepulauan' },
  { key: 'sangihe', name: 'KEPULAUAN SANGIHE', label: 'Kepulauan Sangihe', color: '#00D2D3', zone: 'Kepulauan' },
  { key: 'talaud', name: 'KEPULAUAN TALAUD', label: 'Kepulauan Talaud', color: '#FF5252', zone: 'Kepulauan' },
  { key: 'bitung', name: 'KOTA BITUNG', label: 'Kota Bitung', color: '#FF9F43', zone: 'Daratan Minahasa' },
  { key: 'kotamobagu', name: 'KOTA KOTAMOBAGU', label: 'Kota Kotamobagu', color: '#48DBFB', zone: 'BMR' },
  { key: 'manado', name: 'KOTA MANADO', label: 'Kota Manado', color: '#0090FF', zone: 'Daratan Minahasa' },
  { key: 'tomohon', name: 'KOTA TOMOHON', label: 'Kota Tomohon', color: '#10B981', zone: 'Daratan Minahasa' },
  { key: 'minahasa', name: 'MINAHASA', label: 'Minahasa', color: '#F1C40F', zone: 'Daratan Minahasa' },
  { key: 'minsel', name: 'MINAHASA SELATAN', label: 'Minahasa Selatan', color: '#FF6B4A', zone: 'Daratan Minahasa' },
  { key: 'mitra', name: 'MINAHASA TENGGARA', label: 'Minahasa Tenggara', color: '#6C7A89', zone: 'Daratan Minahasa' },
  { key: 'minut', name: 'MINAHASA UTARA', label: 'Minahasa Utara', color: '#BA68C8', zone: 'Daratan Minahasa' },
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
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [countdown, setCountdown] = useState<number>(30);
  const [isTvCleanBar, setIsTvCleanBar] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Update WITA clock every second
  useEffect(() => {
    const updateWitaTime = () => {
      const now = new Date();
      // WITA is UTC+8
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
      color: string;
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
        color: item.color,
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

        // Tally subdistrict (DPC)
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

    // Also include "Tidak Diketahui" if unassigned exists (matches user reference image)
    const chartBars = [
      ...(unassignedCount > 0
        ? [
            {
              key: 'unknown',
              name: 'TIDAK DIKETAHUI',
              label: 'Tidak Diketahui',
              color: '#64748B',
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

    const maxChartValue = Math.max(...chartBars.map((b) => b.total), 10);

    // Leaderboard sorted descending
    const leaderboard = [...kabKotaList].sort((a, b) => b.total - a.total);

    // 3 Geographic Zones
    const zones = [
      {
        name: 'Daratan Minahasa',
        description: 'Manado, Bitung, Tomohon, Minahasa, Minsel, Mitra, Minut',
        color: '#0090FF',
        regions: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa'),
        total: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa').reduce((s, k) => s + k.total, 0),
      },
      {
        name: 'Bolaang Mongondow Raya (BMR)',
        description: 'Kotamobagu, Bolmong, Bolsel, Boltim, Bolmut',
        color: '#00E396',
        regions: kabKotaList.filter((k) => k.zone === 'BMR'),
        total: kabKotaList.filter((k) => k.zone === 'BMR').reduce((s, k) => s + k.total, 0),
      },
      {
        name: 'Kepulauan Nusa Utara',
        description: 'Sitaro, Sangihe, Talaud',
        color: '#E040FB',
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
      leaderboard,
      zones,
    };
  }, [members]);

  // Selected DPD Subdistricts for Drilldown
  const drilldownData = useMemo(() => {
    // Find matching SulutRegion from dataset
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
          // match subdistrict names
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

    // Sort descending by count
    subdistrictCounts.sort((a, b) => b.count - a.count);
    const maxSubCount = Math.max(...subdistrictCounts.map((s) => s.count), 5);

    return {
      dpdName: targetKabKota?.label || selectedDrilldownDpd,
      totalCount: totalDpdCount,
      pengurusCount: targetKabKota?.pengurus || 0,
      anggotaCount: targetKabKota?.anggota || 0,
      color: targetKabKota?.color || '#FF6B4A',
      subdistricts: subdistrictCounts,
      maxSubCount,
    };
  }, [selectedDrilldownDpd, analyticsData]);

  // Y-axis tick intervals for 15-Kab/Kota chart
  const yTicks = useMemo(() => {
    const max = analyticsData.maxChartValue;
    // create 5 round intervals
    const step = Math.ceil(max / 5 / 10) * 10 || 10;
    const ticks = [];
    for (let i = 0; i <= max + step; i += step) {
      ticks.push(i);
      if (ticks.length >= 6) break;
    }
    return ticks;
  }, [analyticsData.maxChartValue]);

  // Helper formatter for numbers
  const fmt = (n: number) => n.toLocaleString('id-ID');

  // ============================================================================
  // RENDER SECTIONS & CHARTS
  // ============================================================================

  // 1. CHART 1: 15 KABUPATEN/KOTA COLUMN BAR CHART (HIGHCHARTS DARK STYLE)
  const renderColumn15Chart = (isSolo = false) => {
    const bars = analyticsData.chartBars;
    const maxVal = yTicks[yTicks.length - 1] || 100;
    const svgHeight = isSolo ? 650 : 440;
    const svgWidth = 1100;
    const chartTop = 40;
    const chartBottom = svgHeight - 120;
    const chartHeight = chartBottom - chartTop;
    const chartLeft = 70;
    const chartRight = svgWidth - 30;
    const chartWidth = chartRight - chartLeft;
    const barSlotWidth = chartWidth / bars.length;
    const barWidth = Math.min(barSlotWidth * 0.58, 48);

    return (
      <div className={`relative bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
        {/* Chart Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Data Kabupaten di Provinsi SULAWESI UTARA
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  15 Kab / Kota
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Klik pada batang mana saja untuk melihat rincian drilldown tiap Kecamatan
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('column15')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Perbesar Chart Ini ke Layar Penuh"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Layar Tunggal</span>
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('column15')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
              title="Buka di Jendela / Layar Baru untuk Video Wall"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buka Layar Baru</span>
            </button>
          </div>
        </div>

        {/* SVG Highcharts-style Canvas */}
        <div className="w-full overflow-x-auto select-none py-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[750px]"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
          >
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
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray={val === 0 ? 'none' : '3 3'}
                    strokeWidth={val === 0 ? '1.5' : '1'}
                  />
                  <text
                    x={chartLeft - 14}
                    y={y + 4}
                    fill="#94A3B8"
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
              transform={`rotate(-90, 24, ${chartTop + chartHeight / 2})`}
              x={24}
              y={chartTop + chartHeight / 2}
              fill="#94A3B8"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              letterSpacing="1"
            >
              Total Kader &amp; Anggota
            </text>

            {/* Bars & Top Values & X-Labels */}
            {bars.map((item, idx) => {
              const xCenter = chartLeft + idx * barSlotWidth + barSlotWidth / 2;
              const barX = xCenter - barWidth / 2;
              const barH = (item.total / maxVal) * chartHeight;
              const barY = chartBottom - barH;
              const isHovered = hoveredBarIndex === idx;

              return (
                <g
                  key={item.key}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  onClick={() => {
                    setSelectedDrilldownDpd(item.label);
                    setActiveScreen('drilldown');
                  }}
                >
                  {/* Subtle bar background hover highlight */}
                  {isHovered && (
                    <rect
                      x={chartLeft + idx * barSlotWidth}
                      y={chartTop}
                      width={barSlotWidth}
                      height={chartHeight + 10}
                      fill="rgba(255,255,255,0.03)"
                      rx="6"
                    />
                  )}

                  {/* The Bar */}
                  <rect
                    x={barX}
                    y={item.total === 0 ? chartBottom - 2 : barY}
                    width={barWidth}
                    height={item.total === 0 ? 2 : Math.max(barH, 3)}
                    fill={item.color}
                    rx="4"
                    ry="4"
                    opacity={isHovered ? 1 : 0.92}
                    style={{
                      filter: isHovered
                        ? `drop-shadow(0 0 14px ${item.color}) brightness(1.2)`
                        : `drop-shadow(0 2px 6px ${item.color}40)`,
                      transition: 'all 0.2s ease-out',
                    }}
                  />

                  {/* Value sitting bold white directly on top of each bar */}
                  <text
                    x={xCenter}
                    y={item.total === 0 ? chartBottom - 8 : barY - 8}
                    fill={isHovered ? '#FFFFFF' : '#F1F5F9'}
                    fontSize={isSolo ? '14' : '12'}
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 0 4px #000)' : 'none',
                    }}
                  >
                    {fmt(item.total)}
                  </text>

                  {/* Angled 45° X-Axis Label */}
                  <g transform={`translate(${xCenter}, ${chartBottom + 16})`}>
                    <text
                      transform="rotate(-45)"
                      fill={isHovered ? '#38BDF8' : '#CBD5E1'}
                      fontSize={isSolo ? '12' : '10.5'}
                      fontWeight={isHovered ? '700' : '600'}
                      textAnchor="end"
                      letterSpacing="0.3"
                    >
                      {item.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover / Selection Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            {hoveredBarIndex !== null && bars[hoveredBarIndex] ? (
              <div className="flex items-center gap-3 animate-in fade-in duration-150">
                <span className="font-bold text-white text-sm">
                  {bars[hoveredBarIndex].label}:
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {fmt(bars[hoveredBarIndex].total)} Kader ({bars[hoveredBarIndex].percentage.toFixed(1)}%)
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-300">
                  {bars[hoveredBarIndex].pengurus} Pengurus Ber-SK
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-blue-300">
                  {bars[hoveredBarIndex].anggota} Anggota Basis KTP
                </span>
              </div>
            ) : (
              <span className="italic text-slate-500">
                Arahkan kursor ke batang atau klik untuk rincian wilayah tersebut
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            SUMBER: CLOUD DATABASE NASDEM SULUT · 15 KAB/KOTA AKTIF
          </div>
        </div>
      </div>
    );
  };

  // 2. CHART 2: DRILLDOWN DETAIL KECAMATAN (PER KABUPATEN/KOTA)
  const renderDrilldownChart = (isSolo = false) => {
    const { dpdName, totalCount, pengurusCount, anggotaCount, color, subdistricts, maxSubCount } = drilldownData;

    return (
      <div className={`bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
        {/* Header with DPD Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('column15')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Kembali ke Grafik 15 Kab/Kota"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Detail Drilldown: {dpdName}
                </h2>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
                >
                  {fmt(totalCount)} Total
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rincian sebaran anggota dan kepengurusan di tiap Kecamatan (DPC)
              </p>
            </div>
          </div>

          {/* DPD Dropdown Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedDrilldownDpd}
                onChange={(e) => setSelectedDrilldownDpd(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
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
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Layar Penuh Drilldown"
              >
                <Maximize2 className="w-4 h-4 text-blue-400" />
              </button>
            )}

            <button
              onClick={() => handleOpenStandaloneScreen('drilldown', selectedDrilldownDpd)}
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
              title="Buka di Jendela / Monitor Baru"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subdistrict Bars List */}
        <div className="space-y-3.5 my-2 max-h-[550px] overflow-y-auto pr-2">
          {subdistricts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Belum ada data kader yang terpetakan untuk kecamatan di wilayah {dpdName}.
            </div>
          ) : (
            subdistricts.map((sub, idx) => {
              const barPercent = maxSubCount > 0 ? (sub.count / maxSubCount) * 100 : 0;
              return (
                <div key={sub.name} className="group flex items-center gap-3 text-xs">
                  {/* Rank Index */}
                  <span className="w-6 text-slate-500 font-mono font-bold text-right shrink-0">
                    {idx + 1}.
                  </span>

                  {/* Kecamatan Name */}
                  <span className="w-36 sm:w-44 truncate font-semibold text-slate-200 group-hover:text-white shrink-0">
                    Kec. {sub.name}
                  </span>

                  {/* Progress Bar Container */}
                  <div className="flex-1 h-6 bg-slate-800/80 rounded-lg overflow-hidden p-0.5 border border-slate-700/50 relative flex items-center">
                    <div
                      className="h-full rounded-md transition-all duration-300"
                      style={{
                        width: `${Math.max(barPercent, sub.count > 0 ? 3 : 0)}%`,
                        backgroundColor: color,
                        filter: `drop-shadow(0 0 6px ${color}60)`,
                      }}
                    />
                    {sub.count > 0 && (
                      <span className="absolute left-3 text-[11px] font-mono font-bold text-white drop-shadow">
                        {fmt(sub.count)} Kader
                      </span>
                    )}
                  </div>

                  {/* Exact Number & % */}
                  <div className="w-20 text-right shrink-0">
                    <span className="font-mono font-bold text-white text-sm block leading-none">
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
            <span>Total Kecamatan: <strong className="text-white">{subdistricts.length}</strong></span>
            <span>·</span>
            <span>Pengurus Ber-SK: <strong className="text-amber-400">{fmt(pengurusCount)}</strong></span>
            <span>·</span>
            <span>Anggota KTP: <strong className="text-blue-400">{fmt(anggotaCount)}</strong></span>
          </div>
          <button
            onClick={() => setActiveScreen('column15')}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            ← Kembali ke Seluruh Sulut
          </button>
        </div>
      </div>
    );
  };

  // 3. CHART 3: KOMPOSISI PENGURUS VS ANGGOTA (DONUT PIE CHART)
  const renderCompositionChart = (isSolo = false) => {
    const { totalMembers, pengurusCount, anggotaBiasaCount, activeCount, inactiveCount, withKtaCount } = analyticsData;
    const pengurusPct = totalMembers > 0 ? (pengurusCount / totalMembers) * 100 : 0;
    const anggotaPct = totalMembers > 0 ? (anggotaBiasaCount / totalMembers) * 100 : 0;

    // SVG donut calculations
    const size = isSolo ? 320 : 220;
    const strokeWidth = isSolo ? 32 : 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pengurusOffset = circumference - (pengurusPct / 100) * circumference;

    return (
      <div className={`bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Komposisi Keanggotaan
            </h2>
            <p className="text-xs text-slate-400">
              Rasio Pengurus Ber-SK vs Anggota Basis KTP
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('composition')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Komposisi"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('composition')}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
              title="Buka di Jendela / Monitor Baru"
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
              {/* Background circle (Anggota) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#0090FF"
                strokeWidth={strokeWidth}
                opacity={0.85}
              />
              {/* Foreground circle (Pengurus) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#FEB019"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={pengurusOffset}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(254, 176, 25, 0.5))',
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                }}
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
          <div className="space-y-4 w-full sm:max-w-xs">
            {/* Pengurus Card */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  Pengurus Ber-SK
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">
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
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-bold text-blue-300">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                  Anggota Basis KTP
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {anggotaPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {fmt(anggotaBiasaCount)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Kader Akar Rumput
                </span>
              </div>
            </div>

            {/* e-KTA Status */}
            <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-400">
              <span>e-KTA Resmi Terbit:</span>
              <span className="font-mono font-bold text-emerald-400">
                {fmt(withKtaCount)} ({totalMembers > 0 ? ((withKtaCount / totalMembers) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
          KOMPOSISI NASDEM SULUT · PEMUTAKHIRAN REAL-TIME
        </div>
      </div>
    );
  };

  // 4. CHART 4: LEADERBOARD & PERINGKAT TERITORIAL
  const renderLeaderboardChart = (isSolo = false) => {
    const { leaderboard, totalMembers } = analyticsData;
    const highestCount = leaderboard[0]?.total || 1;

    return (
      <div className={`bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Papan Peringkat Teritorial Sulut
            </h2>
            <p className="text-xs text-slate-400">
              Urutan 15 Kabupaten / Kota Berdasarkan Jumlah Kader Terdaftar
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('leaderboard')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Leaderboard"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('leaderboard')}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
              title="Buka di Jendela / Monitor Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Leaderboard rows */}
        <div className={`space-y-2.5 my-2 ${isSolo ? 'overflow-y-visible' : 'max-h-[420px] overflow-y-auto pr-2'}`}>
          {leaderboard.map((item, idx) => {
            const barW = highestCount > 0 ? (item.total / highestCount) * 100 : 0;
            const isTop3 = idx < 3;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

            return (
              <div
                key={item.key}
                onClick={() => {
                  setSelectedDrilldownDpd(item.label);
                  setActiveScreen('drilldown');
                }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isTop3
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-amber-500/20 hover:border-amber-500/50'
                    : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/80'
                }`}
              >
                {/* Medal / Rank */}
                <span className={`w-7 text-center font-bold text-sm shrink-0 ${isTop3 ? 'text-lg' : 'text-slate-500 font-mono'}`}>
                  {medal}
                </span>

                {/* Region details */}
                <div className="w-44 sm:w-56 shrink-0 truncate">
                  <span className="font-bold text-slate-200 group-hover:text-white text-xs block leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Zona: {item.zone}
                  </span>
                </div>

                {/* Relative progress bar */}
                <div className="flex-1 h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(barW, item.total > 0 ? 3 : 0)}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}80`,
                    }}
                  />
                </div>

                {/* Headcount */}
                <div className="w-24 text-right shrink-0">
                  <span className="font-mono font-extrabold text-white text-sm block leading-none">
                    {fmt(item.total)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                    {item.percentage.toFixed(1)}% Sulut
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
          KLIK NAMA WILAYAH UNTUK MEMBUKA DETAIL KECAMATAN
        </div>
      </div>
    );
  };

  // 5. CHART 5: SEBARAN 3 ZONA GEOGRAFIS SULAWESI UTARA
  const renderZonesChart = (isSolo = false) => {
    const { zones, totalMembers } = analyticsData;

    return (
      <div className={`bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Sebaran 3 Zona Geografis Sulut
            </h2>
            <p className="text-xs text-slate-400">
              Daratan Minahasa · Bolaang Mongondow Raya (BMR) · Kepulauan Nusa Utara
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('zones')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Zona"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('zones')}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
              title="Buka di Jendela / Monitor Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Zone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
          {zones.map((zone) => {
            const pct = totalMembers > 0 ? (zone.total / totalMembers) * 100 : 0;
            return (
              <div
                key={zone.name}
                className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: `${zone.color}20`,
                        color: zone.color,
                        border: `1px solid ${zone.color}40`,
                      }}
                    >
                      {zone.name}
                    </span>
                    <span className="font-mono font-extrabold text-sm" style={{ color: zone.color }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-white font-mono block">
                      {fmt(zone.total)}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Total Kader Terdaftar
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-700/50 pt-2 leading-relaxed">
                    {zone.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                  <span>Kab/Kota: <strong className="text-white">{zone.regions.length}</strong></span>
                  <button
                    onClick={() => {
                      if (zone.regions[0]) {
                        setSelectedDrilldownDpd(zone.regions[0].label);
                        setActiveScreen('drilldown');
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Buka Rincian →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
          STRUKTUR GEOGRAFIS WILAYAH SULAWESI UTARA
        </div>
      </div>
    );
  };

  // 6. CHART 6: STATUS, GENDER & DEMOGRAFI
  const renderStatusGenderChart = (isSolo = false) => {
    const { totalMembers, maleCount, femaleCount, unspecGenderCount, activeCount, inactiveCount, withKtaCount, verifiedKtpCount } = analyticsData;
    const malePct = totalMembers > 0 ? (maleCount / totalMembers) * 100 : 0;
    const femalePct = totalMembers > 0 ? (femaleCount / totalMembers) * 100 : 0;

    return (
      <div className={`bg-[#14171F] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Demografi &amp; Status Verifikasi
            </h2>
            <p className="text-xs text-slate-400">
              Rasio Gender, e-KTA Resmi, dan Keaktifan Status Anggota
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isSolo && (
              <button
                onClick={() => setActiveScreen('status_gender')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Layar Penuh Demografi"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
            <button
              onClick={() => handleOpenStandaloneScreen('status_gender')}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
              title="Buka di Jendela / Monitor Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          {/* Gender Ratio Card */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Rasio Gender Kader
            </span>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-blue-400">Laki-laki</span>
                  <span className="font-mono text-white">{fmt(maleCount)} ({malePct.toFixed(1)}%)</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${malePct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-pink-400">Perempuan</span>
                  <span className="font-mono text-white">{fmt(femaleCount)} ({femalePct.toFixed(1)}%)</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${femalePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Verification & e-KTA Card */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Validasi Identitas &amp; Dokumen
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Nomor e-KTA Resmi:</span>
                <span className="font-mono font-bold text-emerald-400">{fmt(withKtaCount)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">KTP Terverifikasi:</span>
                <span className="font-mono font-bold text-blue-400">{fmt(verifiedKtpCount)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-300">Status Aktif:</span>
                <span className="font-mono font-bold text-amber-400">{fmt(activeCount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
          AUDIT DEMOGRAFI &amp; VERIFIKASI KTP SULAWESI UTARA
        </div>
      </div>
    );
  };

  // ============================================================================
  // TOP MONITORING STATUS BAR (WAR ROOM / COMMAND CENTER)
  // ============================================================================
  const renderCommandCenterHeader = () => {
    return (
      <div className="bg-[#10131A] border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        {/* Left Branding & Live Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute" />
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 relative shadow-[0_0_12px_#ef4444]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase">
                COMMAND CENTER DPW SULUT
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                LIVE MONITORING
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Ruang Monitoring &amp; Video Wall Teritorial (15 Kabupaten / Kota)
            </span>
          </div>
        </div>

        {/* Center Screen Navigator Pill Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveScreen('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'grid'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗂️ Grid Panel
          </button>
          <button
            onClick={() => setActiveScreen('column15')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'column15'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 1. Batang 15 Kab
          </button>
          <button
            onClick={() => setActiveScreen('drilldown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'drilldown'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔍 2. Drilldown Kec
          </button>
          <button
            onClick={() => setActiveScreen('composition')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'composition'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🍩 3. Komposisi
          </button>
          <button
            onClick={() => setActiveScreen('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏆 4. Peringkat
          </button>
          <button
            onClick={() => setActiveScreen('zones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'zones'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗺️ 5. Zona Wilayah
          </button>
          <button
            onClick={() => setActiveScreen('status_gender')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeScreen === 'status_gender'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📈 6. Demografi
          </button>
        </div>

        {/* Right Tools: WITA Clock, Refresh, Fullscreen */}
        <div className="flex items-center gap-2.5">
          {/* WITA Digital Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
              {currentTime || '--:--:--'} WITA
            </span>
          </div>

          {/* Auto Refresh Indicator */}
          <div
            title={`Pembaruan otomatis tiap ${autoRefreshInterval} detik (Tersisa: ${countdown}s)`}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
            <span>{countdown}s</span>
          </div>

          {/* Manual Refresh Button */}
          {onRefreshCloud && (
            <button
              onClick={() => onRefreshCloud()}
              disabled={isRefreshingCloud}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Perbarui Data Langsung dari Supabase"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Native Fullscreen TV Mode */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shadow-md"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh TV (Edge-to-Edge)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  };

  // Quick KPI Metric Highlights Bar
  const renderQuickKpiBar = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-[#14171F] border border-slate-800/80 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Kader Terdaftar
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {fmt(analyticsData.totalMembers)}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              15 Kab/Kota
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14171F] border border-slate-800/80 shadow-lg">
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

        <div className="p-4 rounded-xl bg-[#14171F] border border-slate-800/80 shadow-lg">
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

        <div className="p-4 rounded-xl bg-[#14171F] border border-slate-800/80 shadow-lg">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            e-KTA Resmi Terbit
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {fmt(analyticsData.withKtaCount)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Validasi DPW
            </span>
          </div>
        </div>

        <div className="hidden lg:block p-4 rounded-xl bg-[#14171F] border border-slate-800/80 shadow-lg">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
            Wilayah Tertinggi
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white truncate max-w-[140px]" title={analyticsData.leaderboard[0]?.label}>
              {analyticsData.leaderboard[0]?.label || '-'}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {fmt(analyticsData.leaderboard[0]?.total || 0)}
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
    <div className="min-h-screen bg-[#0D1017] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Command Center Top Navigation Bar */}
      {!isTvCleanBar && renderCommandCenterHeader()}

      {/* Floating Toggle to show/hide clean bar on TV walls */}
      {isCleanMode && (
        <button
          onClick={() => setIsTvCleanBar(!isTvCleanBar)}
          className="fixed top-2 right-2 z-50 p-1.5 rounded-lg bg-black/60 hover:bg-black text-slate-400 hover:text-white text-xs opacity-40 hover:opacity-100 transition-opacity"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                LAYAR 1: DIAGRAM BATANG 15 KABUPATEN / KOTA
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                LAYAR 2: DRILLDOWN SEBARAN KECAMATAN
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                LAYAR 3: KOMPOSISI PENGURUS VS ANGGOTA
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                LAYAR 4: PAPAN PERINGKAT TERITORIAL
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                ← Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                LAYAR 6: DEMOGRAFI &amp; STATUS VERIFIKASI
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
