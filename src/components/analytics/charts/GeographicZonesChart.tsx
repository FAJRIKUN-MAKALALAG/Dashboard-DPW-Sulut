import React from 'react';
import { AnalyticsData, AnalyticsScreenId } from '../types';
import { MapPin, Maximize2, ExternalLink } from 'lucide-react';

interface GeographicZonesChartProps {
  analyticsData: AnalyticsData;
  fmt: (n: number) => string;
  isSolo?: boolean;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId) => void;
  onSelectDpd: (dpdLabel: string) => void;
}

export const GeographicZonesChart: React.FC<GeographicZonesChartProps> = ({
  analyticsData,
  fmt,
  isSolo = false,
  onOpenFullscreen,
  onOpenStandalone,
  onSelectDpd,
}) => {
  const { zones, totalMembers } = analyticsData;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between ${isSolo ? 'min-h-[calc(100vh-140px)]' : ''}`}>
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Distribusi 3 Zona Teritorial Sulut
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daratan Minahasa &bull; Bolaang Mongondow Raya (BMR) &bull; Kepulauan Nusa Utara
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Layar Penuh Zona"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          <button
            onClick={() => onOpenStandalone('zones')}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors cursor-pointer"
            title="Buka di Jendela / Monitor Eksternal"
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
              className="p-4 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono"
                    style={{
                      backgroundColor: `${zone.color}20`,
                      color: zone.color,
                      border: `1px solid ${zone.color}50`,
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
                  <span className="text-xs text-zinc-400 mt-1 block">
                    Total Anggota Riil
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 mt-3 border-t border-zinc-800 pt-2 leading-relaxed">
                  {zone.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-white font-bold">{zone.regions.length} DPD</span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-amber-400 font-semibold">{zone.dpcTotal} DPC</span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-emerald-400 font-semibold">{zone.dprtTotal} DPRt</span>
                </div>
                <button
                  onClick={() => {
                    if (zone.regions[0]) {
                      onSelectDpd(zone.regions[0].label);
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Rincian &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
        STRUKTUR TERITORIAL PROVINSI SULAWESI UTARA
      </div>
    </div>
  );
};
