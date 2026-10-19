import React, { useState, useMemo, useRef } from 'react';
import { DailyGrowthPoint } from '../utils/growthUtils';
import {
  TrendingUp,
  BarChart2,
  LineChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  X,
  MapPin,
  Flame,
} from 'lucide-react';

interface GrowthInteractiveChartProps {
  dailyPoints: DailyGrowthPoint[];
  pinnedDate?: string;
  onPinDate: (date?: string) => void;
  periodLabel: string;
  totalNew: number;
}

export const GrowthInteractiveChart: React.FC<GrowthInteractiveChartProps> = ({
  dailyPoints,
  pinnedDate,
  onPinDate,
  periodLabel,
  totalNew,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Dimension constants
  const svgWidth = 840;
  const svgHeight = 220;
  const padLeft = 44;
  const padRight = 32;
  const padTop = 24;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Max value calculation with nice rounding
  const maxRawCount = Math.max(...dailyPoints.map((p) => p.count), 0);
  const maxVal = maxRawCount > 0 ? Math.ceil(maxRawCount * 1.2) : 10;

  // Peak Day & Average calculations
  const peakPoint = useMemo(() => {
    if (dailyPoints.length === 0) return null;
    return dailyPoints.reduce((max, p) => (p.count > max.count ? p : max), dailyPoints[0]);
  }, [dailyPoints]);

  const dailyAverage = useMemo(() => {
    if (dailyPoints.length === 0) return '0';
    return (totalNew / dailyPoints.length).toFixed(1);
  }, [dailyPoints, totalNew]);

  const activeDaysCount = useMemo(() => {
    return dailyPoints.filter((p) => p.count > 0).length;
  }, [dailyPoints]);

  // Coordinates mapping
  const pointsCoords = useMemo(() => {
    const len = dailyPoints.length;
    if (len === 0) return [];

    return dailyPoints.map((p, idx) => {
      const x = len === 1 ? padLeft + chartWidth / 2 : padLeft + (idx / (len - 1)) * chartWidth;
      const y = padTop + chartHeight - (p.count / maxVal) * chartHeight;
      return { x, y, point: p, index: idx };
    });
  }, [dailyPoints, maxVal, chartWidth, chartHeight]);

  // Generate Smooth Bezier Line Path & Area Path
  const { linePath, areaPath } = useMemo(() => {
    if (pointsCoords.length === 0) return { linePath: '', areaPath: '' };
    if (pointsCoords.length === 1) {
      const p = pointsCoords[0];
      const lp = `M ${padLeft} ${p.y} L ${padLeft + chartWidth} ${p.y}`;
      const ap = `M ${padLeft} ${p.y} L ${padLeft + chartWidth} ${p.y} L ${padLeft + chartWidth} ${padTop + chartHeight} L ${padLeft} ${padTop + chartHeight} Z`;
      return { linePath: lp, areaPath: ap };
    }

    let lp = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 0; i < pointsCoords.length - 1; i++) {
      const curr = pointsCoords[i];
      const next = pointsCoords[i + 1];
      const mx = (curr.x + next.x) / 2;
      lp += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }

    const last = pointsCoords[pointsCoords.length - 1];
    const first = pointsCoords[0];
    const ap = `${lp} L ${last.x} ${padTop + chartHeight} L ${first.x} ${padTop + chartHeight} Z`;

    return { linePath: lp, areaPath: ap };
  }, [pointsCoords, chartWidth, chartHeight]);

  // Selected or hovered point for inspector preview
  const activeInspectorPoint = useMemo(() => {
    if (hoveredIndex !== null && dailyPoints[hoveredIndex]) {
      return dailyPoints[hoveredIndex];
    }
    if (pinnedDate) {
      return dailyPoints.find((p) => p.date === pinnedDate) || null;
    }
    return peakPoint && peakPoint.count > 0 ? peakPoint : dailyPoints[dailyPoints.length - 1] || null;
  }, [hoveredIndex, pinnedDate, dailyPoints, peakPoint]);

  // Y-axis grid ticks (deduplicated unique values sorted ascending)
  const yTicks = useMemo(() => {
    if (maxVal <= 0) return [0];
    const raw = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];
    return Array.from(new Set(raw)).sort((a, b) => a - b);
  }, [maxVal]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-5">
      {/* Chart Top Header & Micro KPI Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Dinamika Laju Rekrutmen
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {periodLabel}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Grafik Penambahan Anggota Baru Hasil Gerakan Kader
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Arahkan kursor atau klik titik/batang tanggal untuk menginspeksi siapa kader yang merekrut dan wilayah basis KTP-nya.
          </p>
        </div>

        {/* Chart View Switcher & KPI Badges */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Micro KPI Badge 1: Peak Day */}
          {peakPoint && peakPoint.count > 0 && (
            <div
              onClick={() => onPinDate(pinnedDate === peakPoint.date ? undefined : peakPoint.date)}
              className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:border-amber-400 transition-colors shadow-2xs"
              title="Klik untuk memfilter hari rekrutmen tertinggi"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <div className="leading-tight">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">Hari Puncak:</span>
                <span className="font-bold text-amber-900 dark:text-amber-200 font-mono text-[11px]">
                  {peakPoint.displayDate} (+{peakPoint.count})
                </span>
              </div>
            </div>
          )}

          {/* Micro KPI Badge 2: Daily Avg */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs leading-tight">
            <span className="text-[10px] text-slate-400 block font-semibold">Rata-rata Harian:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
              +{dailyAverage} / hari
            </span>
          </div>

          {/* Switcher Button: Area vs Bar */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Kurva Halus (Spline Wave)"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kurva</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Batang Glow (Modern Bars)"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Batang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Active Day Inspector Card (Super Informative & Responsive) */}
      {activeInspectorPoint && (
        <div
          className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            pinnedDate === activeInspectorPoint.date
              ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-300 dark:border-amber-700/80 shadow-xs'
              : 'bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeInspectorPoint.dayName}, {activeInspectorPoint.displayDate}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-xs">
                  +{activeInspectorPoint.count} Anggota Baru
                </span>
                {pinnedDate === activeInspectorPoint.date && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Terfilter Aktif
                  </span>
                )}
              </div>

              {/* Recruiter & territory preview in this day */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {Object.keys(activeInspectorPoint.recruitersBreakdown).length > 0 ? (
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      Direkrut oleh:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {Object.entries(activeInspectorPoint.recruitersBreakdown)
                          .map(([nama, c]) => `${nama.split(',')[0]} (+${c})`)
                          .join(', ')}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <span>Pengurus DPD / DPC NasDem</span>
                )}

                {Object.keys(activeInspectorPoint.dpdBreakdown).length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        Wilayah KTP:{' '}
                        {Object.entries(activeInspectorPoint.dpdBreakdown)
                          .map(([dpd, c]) => `${dpd.replace('Kabupaten ', 'Kab. ')} (${c})`)
                          .join(', ')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick CTA button */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {pinnedDate === activeInspectorPoint.date ? (
              <button
                onClick={() => onPinDate(undefined)}
                className="btn-white text-xs px-2.5 py-1.5 rounded-lg text-amber-800 dark:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Lepas Filter Hari</span>
              </button>
            ) : (
              <button
                onClick={() => onPinDate(activeInspectorPoint.date)}
                disabled={activeInspectorPoint.count === 0}
                className="btn-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold cursor-pointer disabled:opacity-40"
              >
                <span>Saring Hari Ini</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG INTERACTIVE CANVAS */}
      <div className="relative w-full overflow-x-auto pt-2 pb-1 select-none">
        <div className="min-w-[650px] sm:min-w-full">
          {/* MODE 1: SMOOTH SPLINE WAVE AREA CHART */}
          {chartType === 'area' && (
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 sm:h-64 overflow-visible"
            >
              <defs>
                {/* Emerald to Blue gradient for Area Fill */}
                <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                {/* Electric Line Gradient */}
                <linearGradient id="growthLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines */}
              {yTicks.map((val, tickIdx) => {
                const y = padTop + chartHeight - (val / maxVal) * chartHeight;
                return (
                  <g key={`ytick-${val}-${tickIdx}`} className="text-slate-300 dark:text-slate-800">
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + chartWidth}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      opacity="0.6"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400 dark:fill-slate-600"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#growthAreaGradient)"
                  className="transition-all duration-300"
                />
              )}

              {/* Glowing Spline Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#growthLineGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lineGlow)"
                  className="transition-all duration-300"
                />
              )}

              {/* Vertical Crosshair Guide on Hover */}
              {hoveredIndex !== null && pointsCoords[hoveredIndex] && (
                <line
                  x1={pointsCoords[hoveredIndex].x}
                  y1={padTop}
                  x2={pointsCoords[hoveredIndex].x}
                  y2={padTop + chartHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-in fade-in duration-150"
                />
              )}

              {/* Interactive Data Points (Circles) */}
              {pointsCoords.map((coord) => {
                const isHovered = hoveredIndex === coord.index;
                const isPinned = pinnedDate === coord.point.date;
                const hasData = coord.point.count > 0;

                return (
                  <g
                    key={coord.point.date}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredIndex(coord.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => {
                      if (hasData) {
                        onPinDate(isPinned ? undefined : coord.point.date);
                      }
                    }}
                  >
                    {/* Hover hotspot transparent area */}
                    <circle cx={coord.x} cy={coord.y} r={18} fill="transparent" />

                    {/* Outer halo when hovered or pinned */}
                    {(isHovered || isPinned) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={hasData ? 11 : 7}
                        fill={isPinned ? '#f59e0b' : '#10b981'}
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}

                    {/* Main Dot */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isPinned ? 6 : isHovered ? 5.5 : hasData ? 4 : 2.5}
                      fill={
                        isPinned
                          ? '#f59e0b'
                          : isHovered
                          ? '#0ea5e9'
                          : hasData
                          ? '#10b981'
                          : '#94a3b8'
                      }
                      stroke="#ffffff"
                      strokeWidth={hasData ? 2 : 1}
                      className="transition-transform duration-150 group-hover:scale-125"
                    />

                    {/* Floating label for values > 0 */}
                    {hasData && (
                      <text
                        x={coord.x}
                        y={coord.y - 10}
                        textAnchor="middle"
                        className={`text-[10px] font-mono font-bold transition-all ${
                          isPinned
                            ? 'fill-amber-600 dark:fill-amber-400 font-black'
                            : isHovered
                            ? 'fill-blue-600 dark:fill-blue-400 font-bold scale-110'
                            : 'fill-emerald-600 dark:fill-emerald-400'
                        }`}
                      >
                        +{coord.point.count}
                      </text>
                    )}

                    {/* Date label at bottom */}
                    <text
                      x={coord.x}
                      y={padTop + chartHeight + 16}
                      textAnchor="middle"
                      className={`text-[10px] font-mono leading-none ${
                        isPinned
                          ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                          : isHovered
                          ? 'fill-slate-900 dark:fill-white font-semibold'
                          : 'fill-slate-500 dark:fill-slate-400'
                      }`}
                    >
                      {coord.point.displayDate}
                    </text>
                    <text
                      x={coord.x}
                      y={padTop + chartHeight + 28}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 leading-none"
                    >
                      {coord.point.dayName}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* MODE 2: MODERN GLOW ROUNDED BARS */}
          {chartType === 'bar' && (
            <div className="pt-8 pb-3 px-2">
              <div className="flex items-end gap-2 sm:gap-3.5 h-48 px-2 border-b border-slate-200 dark:border-slate-800">
                {dailyPoints.map((point, idx) => {
                  const heightPercent =
                    point.count > 0 ? Math.max(Math.round((point.count / maxVal) * 100), 10) : 4;
                  const isPinned = pinnedDate === point.date;
                  const isHovered = hoveredIndex === idx;
                  const hasData = point.count > 0;

                  return (
                    <div
                      key={point.date}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        if (hasData) {
                          onPinDate(isPinned ? undefined : point.date);
                        }
                      }}
                      className={`flex-1 flex flex-col items-center gap-1.5 group select-none transition-all ${
                        hasData ? 'cursor-pointer' : 'cursor-default opacity-40'
                      }`}
                    >
                      {/* Top count badge on hover / pin */}
                      <span
                        className={`text-[11px] font-mono font-bold transition-all ${
                          isPinned
                            ? 'text-amber-600 dark:text-amber-400 scale-110 font-black'
                            : isHovered
                            ? 'text-blue-600 dark:text-blue-400 scale-110'
                            : hasData
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {hasData ? `+${point.count}` : '0'}
                      </span>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[34px] h-36 bg-slate-100 dark:bg-slate-950 rounded-t-xl flex items-end overflow-hidden p-0.5">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 relative ${
                            isPinned
                              ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 shadow-md ring-2 ring-amber-400'
                              : isHovered
                              ? 'bg-gradient-to-t from-blue-600 via-cyan-500 to-emerald-400 shadow-md'
                              : hasData
                              ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-xs'
                              : 'bg-slate-300 dark:bg-slate-800'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {/* Glossy top cap on bar */}
                          {hasData && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-white/40 rounded-t-md"></div>
                          )}
                        </div>
                      </div>

                      {/* Date label */}
                      <div className="text-center pt-1">
                        <div
                          className={`text-[10px] font-mono leading-none ${
                            isPinned
                              ? 'font-bold text-amber-600 dark:text-amber-400'
                              : isHovered
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {point.displayDate}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-none mt-1">
                          {point.dayName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Footer Quick Note */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {activeDaysCount} dari {dailyPoints.length} hari memiliki aktivitas penambahan kader di lapangan.
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Kader Bertambah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Hari Puncak / Dipilih</span>
          </div>
        </div>
      </div>
    </div>
  );
};
