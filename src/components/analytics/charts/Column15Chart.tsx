import React from 'react';
import { AnalyticsData, AnalyticsScreenId } from '../types';
import { Maximize2, ExternalLink } from 'lucide-react';

interface Column15ChartProps {
  analyticsData: AnalyticsData;
  yTicks: number[];
  fmt: (n: number) => string;
  isSolo?: boolean;
  hoveredBarIndex: number | null;
  setHoveredBarIndex: (idx: number | null) => void;
  onSelectDpd: (dpdLabel: string) => void;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId, dpd?: string) => void;
}

export const Column15Chart: React.FC<Column15ChartProps> = ({
  analyticsData,
  yTicks,
  fmt,
  isSolo = false,
  hoveredBarIndex,
  setHoveredBarIndex,
  onSelectDpd,
  onOpenFullscreen,
  onOpenStandalone,
}) => {
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
  const barWidth = Math.min(barSlotWidth * 0.65, 48);

  return (
    <div className={`relative bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Distribusi Teritorial 15 Kabupaten / Kota
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-blue-400 border border-zinc-800">
              PROVINSI SULAWESI UTARA
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Perbandingan jumlah kader riil terdaftar di tiap DPD se-Sulut
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Color Legend Badge */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
              Kader DPD
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
              Tertinggi (Rank 1)
            </span>
          </div>

          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
              title="Perbesar Chart ke Layar Tunggal"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Layar Tunggal</span>
            </button>
          )}
          <button
            onClick={() => onOpenStandalone('column15')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
            title="Buka di Jendela / Monitor Eksternal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layar Baru</span>
          </button>
        </div>
      </div>

      {/* SVG High-Precision Dark Canvas */}
      <div className="w-full overflow-x-auto select-none py-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[750px]"
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
                  stroke="#27272A"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth={val === 0 ? '1.5' : '1'}
                />
                <text
                  x={chartLeft - 12}
                  y={y + 4}
                  fill="#71717A"
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
            transform={`rotate(-90, 20, ${chartTop + chartHeight / 2})`}
            x={20}
            y={chartTop + chartHeight / 2}
            fill="#71717A"
            fontSize="10"
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

            // Pure solid flat color
            let barFill = '#2563EB';
            if (isEmpty) {
              barFill = '#27272A';
            } else if (isTopRank) {
              barFill = '#D97706';
            } else if (isHovered) {
              barFill = '#3B82F6';
            }

            return (
              <g
                key={item.key}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                onClick={() => onSelectDpd(item.label)}
              >
                {/* Subtle column hover background */}
                {isHovered && (
                  <rect
                    x={chartLeft + idx * barSlotWidth + 2}
                    y={chartTop}
                    width={barSlotWidth - 4}
                    height={chartHeight + 6}
                    fill="#18181B"
                    rx="1"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={barX}
                  y={isEmpty ? chartBottom - 2 : barY}
                  width={barWidth}
                  height={isEmpty ? 2 : Math.max(barH, 3)}
                  fill={barFill}
                  rx="1"
                  ry="1"
                />

                {/* Exact Number on Top of Bar */}
                <text
                  x={xCenter}
                  y={isEmpty ? chartBottom - 8 : barY - 8}
                  fill={isEmpty ? '#52525B' : isTopRank ? '#F59E0B' : '#FFFFFF'}
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
                    fill={isHovered ? '#60A5FA' : isTopRank ? '#F59E0B' : '#A1A1AA'}
                    fontSize={isSolo ? '11.5' : '10'}
                    fontWeight={isHovered || isTopRank ? '700' : '600'}
                    textAnchor="end"
                    letterSpacing="0.2"
                  >
                    {item.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Status Bar */}
      <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-zinc-400">
          {hoveredBarIndex !== null && bars[hoveredBarIndex] ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-100 flex-wrap">
              <span className="font-bold text-white">
                {bars[hoveredBarIndex].label}:
              </span>
              <span className="text-blue-400 font-mono font-bold">
                {fmt(bars[hoveredBarIndex].total)} Kader ({bars[hoveredBarIndex].percentage.toFixed(1)}% Sulut)
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-amber-400 font-mono font-semibold">
                {bars[hoveredBarIndex].officialDpcCount} DPC (Kec)
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {bars[hoveredBarIndex].officialDprtCount} DPRt (Desa/Kel)
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-300 font-medium">
                {bars[hoveredBarIndex].pengurus} Pengurus SK &bull; {bars[hoveredBarIndex].anggota} Anggota
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 flex items-center gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>Klik batang wilayah untuk drilldown rincian per kecamatan</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-500">Total Resmi: <strong>15 DPD</strong> &bull; <strong>171 DPC</strong> &bull; <strong>1.602 DPRt</strong></span>
            </span>
          )}
        </div>

        <div className="text-[11px] text-zinc-400 font-mono">
          PARTAI NASDEM DPW SULUT &bull; <strong className="text-white">15 DPD</strong> &bull; <strong className="text-amber-400">171 DPC</strong> &bull; <strong className="text-emerald-400">1.602 DPRt</strong>
        </div>
      </div>
    </div>
  );
};
