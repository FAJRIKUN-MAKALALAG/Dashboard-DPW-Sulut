import React from 'react';
import { AnalyticsData, AnalyticsScreenId } from '../types';
import { Award, Maximize2, ExternalLink } from 'lucide-react';

interface TerritoryLeaderboardChartProps {
  analyticsData: AnalyticsData;
  fmt: (n: number) => string;
  isSolo?: boolean;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId) => void;
  onSelectDpd: (dpdLabel: string) => void;
}

export const TerritoryLeaderboardChart: React.FC<TerritoryLeaderboardChartProps> = ({
  analyticsData,
  fmt,
  isSolo = false,
  onOpenFullscreen,
  onOpenStandalone,
  onSelectDpd,
}) => {
  const { leaderboard } = analyticsData;
  const highestCount = leaderboard[0]?.total || 1;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Peringkat Wilayah Terbanyak
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Urutan 15 DPD Kabupaten / Kota Berdasarkan Headcount Anggota Riil
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Layar Penuh Leaderboard"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          <button
            onClick={() => onOpenStandalone('leaderboard')}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors cursor-pointer"
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
              onClick={() => onSelectDpd(item.label)}
              className={`group flex items-center gap-3 p-2.5 rounded-md border transition-all cursor-pointer ${
                isRank1
                  ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-900/40'
                  : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/80'
              }`}
            >
              {/* Rank Badge */}
              <span
                className={`w-7 text-center font-bold text-xs shrink-0 font-mono ${
                  isRank1
                    ? 'text-amber-400'
                    : isRank2
                    ? 'text-zinc-200'
                    : isRank3
                    ? 'text-amber-300'
                    : 'text-zinc-500'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Region details */}
              <div className="w-48 sm:w-64 shrink-0 truncate">
                <span className={`font-bold text-xs block leading-tight ${isRank1 ? 'text-amber-300' : 'text-zinc-200 group-hover:text-blue-400'}`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  <strong className="text-amber-400">{item.officialDpcCount}</strong> DPC &bull; <strong className="text-emerald-400">{item.officialDprtCount}</strong> DPRt &bull; Zona {item.zone}
                </span>
              </div>

              {/* Relative progress bar */}
              <div className="flex-1 h-2.5 sm:h-3 bg-zinc-900 rounded p-0.5 border border-zinc-800">
                <div
                  className={`h-full rounded-xs transition-all duration-300 ${
                    isRank1 ? 'bg-amber-500' : 'bg-blue-600'
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
                <span className="text-[10px] text-blue-400 font-mono block mt-0.5">
                  {item.percentage.toFixed(1)}% Sulut
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
        KLIK BARIS WILAYAH UNTUK RINCIAN KECAMATAN
      </div>
    </div>
  );
};
