import React, { useState, useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import { SULUT_15_KABKOTA } from '../analytics/types';
import { isDpdMatch } from '../../utils/structureReadinessUtils';
import { DpdGrowthNode } from '../../utils/growthUtils';

export interface Bar15GrowthItem {
  key: string;
  name: string;
  label: string;
  zone: string;
  total: number;
  percentage: number;
  recruiters: { nama: string; jabatan: string; count: number }[];
  dpcsCount: number;
}

interface Growth15KabKotaChartProps {
  territorialTree: DpdGrowthNode[];
  totalNew: number;
  periodLabel: string;
  onSelectDpd: (dpdLabel: string) => void;
  onOpenAuditModal: () => void;
}

export const Growth15KabKotaChart: React.FC<Growth15KabKotaChartProps> = ({
  territorialTree,
  totalNew,
  periodLabel,
  onSelectDpd,
  onOpenAuditModal,
}) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Map 15 Kab/Kota with territorial growth nodes
  const bars: Bar15GrowthItem[] = useMemo(() => {
    return SULUT_15_KABKOTA.map((item) => {
      const matchedNode = territorialTree.find(
        (node) =>
          isDpdMatch(node.name, item.name) ||
          isDpdMatch(node.name, item.label)
      );
      const addedCount = matchedNode ? matchedNode.count : 0;
      const percentage = totalNew > 0 ? (addedCount / totalNew) * 100 : 0;

      return {
        key: item.key,
        name: item.name,
        label: item.label,
        zone: item.zone,
        total: addedCount,
        percentage,
        recruiters: matchedNode?.recruiters || [],
        dpcsCount: matchedNode?.dpcs.length || 0,
      };
    });
  }, [territorialTree, totalNew]);

  // Find max additions count and top performer
  const maxCount = useMemo(() => Math.max(...bars.map((b) => b.total), 0), [bars]);

  const topPerformer = useMemo(() => {
    const active = bars.filter((b) => b.total > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.total - a.total)[0];
  }, [bars]);

  // Dynamic Y-axis scale calculation
  const { yTicks, maxVal } = useMemo(() => {
    if (maxCount <= 0) {
      return { yTicks: [0, 2, 4, 6, 8, 10], maxVal: 10 };
    }
    if (maxCount <= 5) {
      return { yTicks: [0, 1, 2, 3, 4, 5], maxVal: 5 };
    }
    if (maxCount <= 10) {
      return { yTicks: [0, 2, 4, 6, 8, 10], maxVal: 10 };
    }
    if (maxCount <= 25) {
      return { yTicks: [0, 5, 10, 15, 20, 25], maxVal: 25 };
    }
    if (maxCount <= 50) {
      return { yTicks: [0, 10, 20, 30, 40, 50], maxVal: 50 };
    }
    if (maxCount <= 100) {
      return { yTicks: [0, 25, 50, 75, 100], maxVal: 100 };
    }
    const step = Math.ceil(maxCount / 5 / 10) * 10;
    const top = step * 5;
    return {
      yTicks: [0, step, step * 2, step * 3, step * 4, top],
      maxVal: top,
    };
  }, [maxCount]);

  // SVG coordinate constants
  const svgHeight = 420;
  const svgWidth = 1000;
  const chartTop = 40;
  const chartBottom = svgHeight - 105;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 58;
  const chartRight = svgWidth - 24;
  const chartWidth = chartRight - chartLeft;
  const barSlotWidth = chartWidth / bars.length;
  const barWidth = Math.min(barSlotWidth * 0.62, 42);

  const hoveredBar = hoveredBarIndex !== null ? bars[hoveredBarIndex] : null;

  return (
    <div className="relative bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#1A3282] dark:bg-[#FDB813] shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Grafik Penambahan 15 Kabupaten / Kota
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              {periodLabel}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribusi penambahan kader baru per DPD Kabupaten/Kota se-Sulawesi Utara
          </p>
        </div>

        {/* Action Controls & Legends */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-[10px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-xs bg-[#FDB813]" />
              Tertinggi
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-xs bg-[#1A3282] dark:bg-[#21409A]" />
              Aktif
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-normal">
              <span className="w-2 h-2 rounded-xs bg-slate-200 dark:bg-slate-800" />
              0
            </span>
          </div>

          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Buka Audit Lengkap Modal"
          >
            <Maximize2 className="w-3 h-3 text-slate-500" />
            <span>Audit</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto select-none py-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[600px]"
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
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth={val === 0 ? '1.5' : '1'}
                />
                <text
                  x={chartLeft - 10}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  +{val}
                </text>
              </g>
            );
          })}

          {/* Y-Axis Title */}
          <text
            transform={`rotate(-90, 16, ${chartTop + chartHeight / 2})`}
            x={16}
            y={chartTop + chartHeight / 2}
            fill="#64748B"
            fontSize="9.5"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="1"
          >
            PENAMBAHAN KADER
          </text>

          {/* 15 Regional Bars */}
          {bars.map((item, idx) => {
            const xCenter = chartLeft + idx * barSlotWidth + barSlotWidth / 2;
            const barX = xCenter - barWidth / 2;
            const barH = (item.total / maxVal) * chartHeight;
            const barY = chartBottom - barH;
            const isHovered = hoveredBarIndex === idx;
            const isTopRank = topPerformer !== null && item.key === topPerformer.key && item.total > 0;
            const isEmpty = item.total === 0;

            let barFill = '#1A3282'; // Primary Blue NasDem
            if (isEmpty) {
              barFill = '#CBD5E1';
            } else if (isTopRank) {
              barFill = '#FDB813'; // Gold NasDem for #1 Rank
            } else if (isHovered) {
              barFill = '#21409A'; // Secondary Blue NasDem on hover
            }

            return (
              <g
                key={item.key}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                onClick={() => onSelectDpd(item.label)}
              >
                {/* Column hover background highlight */}
                {isHovered && (
                  <rect
                    x={chartLeft + idx * barSlotWidth + 2}
                    y={chartTop}
                    width={barSlotWidth - 4}
                    height={chartHeight + 6}
                    fill="#94A3B8"
                    fillOpacity="0.12"
                    rx="3"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={barX}
                  y={isEmpty ? chartBottom - 2 : barY}
                  width={barWidth}
                  height={isEmpty ? 2 : Math.max(barH, 3)}
                  fill={barFill}
                  rx="2"
                  ry="2"
                />

                {/* Addition Value on Top of Bar */}
                <text
                  x={xCenter}
                  y={isEmpty ? chartBottom - 8 : barY - 8}
                  fill={isEmpty ? '#94A3B8' : isTopRank ? '#9E6706' : '#1A3282'}
                  className={isEmpty ? '' : isTopRank ? 'dark:fill-[#FDB813]' : 'dark:fill-slate-200'}
                  fontSize="11"
                  fontWeight={isTopRank ? '800' : '700'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isEmpty ? '0' : `+${item.total}`}
                </text>

                {/* Angled 45° X-Axis Label */}
                <g transform={`translate(${xCenter}, ${chartBottom + 14})`}>
                  <text
                    transform="rotate(-40)"
                    fill={isTopRank ? '#9E6706' : isHovered ? '#1A3282' : '#475569'}
                    className={isTopRank ? 'dark:fill-[#FDB813]' : isHovered ? 'dark:fill-white' : 'dark:fill-slate-400'}
                    fontSize="10"
                    fontWeight={isHovered || isTopRank ? '700' : '600'}
                    textAnchor="end"
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
      <div className="mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          {hoveredBar ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white">
                {hoveredBar.label}:
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                +{hoveredBar.total} Kader ({hoveredBar.percentage.toFixed(1)}%)
              </span>
              <span>·</span>
              <span className="font-mono">
                {hoveredBar.dpcsCount} DPC Kecamatan
              </span>
              {hoveredBar.recruiters.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Perekrut: {hoveredBar.recruiters.slice(0, 2).map((r) => `${r.nama.split(',')[0]} (+${r.count})`).join(', ')}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span>
              Klik batang wilayah untuk rincian · Total Periode: <strong className="text-slate-900 dark:text-white font-mono">+{totalNew} Kader</strong>
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          15 DPD · 171 DPC · 1.602 DPRt
        </div>
      </div>
    </div>
  );
};
