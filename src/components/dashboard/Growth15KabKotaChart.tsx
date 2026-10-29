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

  // SVG coordinate constants matching Column15Chart
  const svgHeight = 440;
  const svgWidth = 1100;
  const chartTop = 45;
  const chartBottom = svgHeight - 110;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 65;
  const chartRight = svgWidth - 30;
  const chartWidth = chartRight - chartLeft;
  const barSlotWidth = chartWidth / bars.length;
  const barWidth = Math.min(barSlotWidth * 0.65, 48);

  const hoveredBar = hoveredBarIndex !== null ? bars[hoveredBarIndex] : null;

  return (
    <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Distribusi Penambahan Anggota 15 Kabupaten / Kota
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-blue-400 border border-zinc-800">
              PROVINSI SULAWESI UTARA
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Perbandingan penambahan anggota baru di tiap DPD se-Sulut ({periodLabel})
          </p>
        </div>

        {/* Action Controls & Legends */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-3 text-[11px] px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
              Penambahan DPD
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
              Tertinggi (Rank 1)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 font-normal">
              <span className="w-2.5 h-2.5 rounded-xs bg-zinc-800" />
              0 Penambahan
            </span>
          </div>

          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
            title="Buka Audit Lengkap Modal"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit Lengkap</span>
          </button>
        </div>
      </div>

      {/* SVG Dark Canvas */}
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
                  +{val}
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
            PENAMBAHAN ANGGOTA BARU
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
                {/* Column hover background highlight */}
                {isHovered && (
                  <rect
                    x={chartLeft + idx * barSlotWidth + 2}
                    y={chartTop}
                    width={barSlotWidth - 4}
                    height={chartHeight + 6}
                    fill="#18181B"
                    rx="2"
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

                {/* Addition Value on Top of Bar */}
                <text
                  x={xCenter}
                  y={isEmpty ? chartBottom - 8 : barY - 8}
                  fill={isEmpty ? '#52525B' : isTopRank ? '#F59E0B' : '#FFFFFF'}
                  fontSize="11.5"
                  fontWeight={isTopRank ? '800' : '700'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isEmpty ? '0' : `+${item.total}`}
                </text>

                {/* Angled 45° X-Axis Label */}
                <g transform={`translate(${xCenter}, ${chartBottom + 16})`}>
                  <text
                    transform="rotate(-45)"
                    fill={isHovered ? '#60A5FA' : isTopRank ? '#F59E0B' : '#A1A1AA'}
                    fontSize="10"
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
          {hoveredBar ? (
            <div className="flex items-center gap-2.5 animate-in fade-in duration-100 flex-wrap">
              <span className="font-bold text-white">
                {hoveredBar.label}:
              </span>
              <span className="text-blue-400 font-mono font-bold">
                +{hoveredBar.total} Anggota Baru ({hoveredBar.percentage.toFixed(1)}% Penambahan Sulut)
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-amber-400 font-mono font-semibold">
                {hoveredBar.dpcsCount} DPC Kecamatan Terlibat
              </span>
              {hoveredBar.recruiters.length > 0 && (
                <>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-emerald-400 font-medium">
                    Direkrut oleh: {hoveredBar.recruiters.slice(0, 2).map((r) => `${r.nama.split(',')[0]} (+${r.count})`).join(', ')}
                  </span>
                </>
              )}
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-400 italic">
                (Klik batang untuk melihat rincian anggota)
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 flex items-center gap-2">
              <span className="text-blue-500 font-bold">&bull;</span>
              <span>Klik batang wilayah untuk audit rincian anggota dan kader perekrut</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-500">
                Total Penambahan Periode: <strong className="text-white">+{totalNew} Anggota Baru</strong> di 15 Kabupaten / Kota
              </span>
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
