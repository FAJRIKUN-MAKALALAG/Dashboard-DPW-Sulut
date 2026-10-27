import React from 'react';
import { AnalyticsData, AnalyticsScreenId } from '../types';
import { PieChart, Maximize2, ExternalLink } from 'lucide-react';

interface CadreCompositionChartProps {
  analyticsData: AnalyticsData;
  fmt: (n: number) => string;
  isSolo?: boolean;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId) => void;
}

export const CadreCompositionChart: React.FC<CadreCompositionChartProps> = ({
  analyticsData,
  fmt,
  isSolo = false,
  onOpenFullscreen,
  onOpenStandalone,
}) => {
  const { totalMembers, pengurusCount, anggotaBiasaCount, activeCount, withKtaCount } = analyticsData;
  const pengurusPct = totalMembers > 0 ? (pengurusCount / totalMembers) * 100 : 0;
  const anggotaPct = totalMembers > 0 ? (anggotaBiasaCount / totalMembers) * 100 : 0;

  const size = isSolo ? 300 : 200;
  const strokeWidth = isSolo ? 28 : 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pengurusOffset = circumference - (pengurusPct / 100) * circumference;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Komposisi Struktural
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rasio Pengurus Ber-SK vs Anggota Basis KTP
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Layar Penuh Komposisi"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          <button
            onClick={() => onOpenStandalone('composition')}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors cursor-pointer"
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
            {/* Background circle (Anggota KTP - Solid Blue) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#2563EB"
              strokeWidth={strokeWidth}
            />
            {/* Foreground circle (Pengurus Ber-SK - Solid Amber) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#D97706"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={pengurusOffset}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
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
          <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
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
              <span className="text-[11px] text-zinc-500">
                Struktural DPW - DPRt
              </span>
            </div>
          </div>

          {/* Anggota Biasa Card */}
          <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
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
              <span className="text-[11px] text-zinc-500">
                Kader Non-Struktural
              </span>
            </div>
          </div>

          {/* e-KTA Status */}
          <div className="flex items-center justify-between text-xs px-2 pt-1 text-zinc-400">
            <span>e-KTA Terverifikasi:</span>
            <span className="font-mono font-bold text-emerald-400">
              {fmt(withKtaCount)} ({totalMembers > 0 ? ((withKtaCount / totalMembers) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
        KOMPOSISI RESMI PARTAI NASDEM SULUT
      </div>
    </div>
  );
};
