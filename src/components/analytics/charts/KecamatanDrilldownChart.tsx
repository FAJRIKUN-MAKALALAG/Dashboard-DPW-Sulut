import React from 'react';
import { DrilldownData, AnalyticsScreenId, SULUT_15_KABKOTA } from '../types';
import { ArrowLeft, ChevronDown, Maximize2, ExternalLink } from 'lucide-react';

interface KecamatanDrilldownChartProps {
  drilldownData: DrilldownData;
  selectedDrilldownDpd: string;
  setSelectedDrilldownDpd: (dpd: string) => void;
  fmt: (n: number) => string;
  isSolo?: boolean;
  onOpenFullscreen: () => void;
  onOpenStandalone: (screen: AnalyticsScreenId, dpd?: string) => void;
  onBackToColumn15: () => void;
  onSelectDpcForDrawer?: (dpdName: string, dpcName: string) => void;
}

export const KecamatanDrilldownChart: React.FC<KecamatanDrilldownChartProps> = ({
  drilldownData,
  selectedDrilldownDpd,
  setSelectedDrilldownDpd,
  fmt,
  isSolo = false,
  onOpenFullscreen,
  onOpenStandalone,
  onBackToColumn15,
  onSelectDpcForDrawer,
}) => {
  const { dpdName, totalCount, pengurusCount, anggotaCount, subdistricts, maxSubCount, officialDpcCount, officialDprtCount } = drilldownData;
  const barHeightClass = isSolo ? 'h-7 sm:h-8' : 'h-6 sm:h-7';
  const maxListHeight = isSolo ? 'max-h-[calc(100vh-270px)]' : 'max-h-[520px]';
  const listSpacingClass = isSolo ? 'space-y-2' : 'space-y-1.5';

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-lg p-6 flex flex-col ${isSolo ? 'min-h-[calc(100vh-140px)] justify-between' : ''}`}>
      {/* Header with DPD Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToColumn15}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Kembali ke Grafik 15 Kab/Kota"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Rincian Kecamatan: {dpdName}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-blue-400 border border-zinc-800">
                {fmt(totalCount)} Kader
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-amber-400 border border-zinc-800">
                {officialDpcCount} DPC
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-emerald-400 border border-zinc-800">
                {officialDprtCount} DPRt
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sebaran anggota &amp; kelengkapan struktur pengurus DPC tingkat kecamatan se-{dpdName}
            </p>
          </div>
        </div>

        {/* DPD Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedDrilldownDpd}
              onChange={(e) => setSelectedDrilldownDpd(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-blue-600 cursor-pointer appearance-none"
            >
              {SULUT_15_KABKOTA.map((item) => (
                <option key={item.key} value={item.label} className="bg-zinc-900 text-zinc-200">
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {!isSolo && (
            <button
              onClick={onOpenFullscreen}
              className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Layar Penuh Drilldown"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}

          <button
            onClick={() => onOpenStandalone('drilldown', selectedDrilldownDpd)}
            className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors cursor-pointer"
            title="Buka di Jendela / Monitor Eksternal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subdistrict Bars List with Compact Pure Color Bars */}
      <div className={`${listSpacingClass} my-2 ${maxListHeight} overflow-y-auto pr-2`}>
        {subdistricts.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Belum ada data kader yang terpetakan untuk kecamatan di wilayah {dpdName}.
          </div>
        ) : (
          subdistricts.map((sub, idx) => {
            const barPercent = maxSubCount > 0 ? (sub.count / maxSubCount) * 100 : 0;
            const isTop1 = idx === 0 && sub.count > 0;
            const isTop3 = idx < 3 && sub.count > 0;

            return (
              <div
                key={sub.name}
                onClick={() => {
                  if (onSelectDpcForDrawer) {
                    onSelectDpcForDrawer(dpdName, sub.name);
                  }
                }}
                className={`group flex items-center gap-3 p-2 rounded-md border transition-all cursor-pointer ${
                  isTop1
                    ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-900/40'
                    : 'bg-zinc-950 hover:bg-zinc-900/50 border-zinc-900 hover:border-zinc-800'
                }`}
                title={`Klik untuk membuka rincian DPRt di Kec. ${sub.name}`}
              >
                {/* Rank Index Badge */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 border transition-colors ${
                    isTop1
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : isTop3
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Kecamatan Details */}
                <div className={`${isSolo ? 'w-48 sm:w-60' : 'w-40 sm:w-48'} shrink-0 truncate`}>
                  <span className={`font-semibold text-xs sm:text-sm block truncate transition-colors ${
                    isTop1 ? 'text-amber-400' : 'text-zinc-200 group-hover:text-blue-400'
                  }`}>
                    Kec. {sub.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    {sub.dprtCount} DPRt (Desa/Kel) &bull; {sub.count > 0 ? `${sub.percentage.toFixed(1)}% wilayah` : '0 kader'}
                  </span>
                </div>

                {/* Clean Flat Progress Bar Container */}
                <div className={`flex-1 ${barHeightClass} bg-zinc-900 rounded overflow-hidden p-0.5 border border-zinc-800 relative flex items-center`}>
                  {/* The Filled Bar - Pure Solid Color */}
                  <div
                    className={`h-full rounded-xs transition-all duration-300 ${
                      isTop1 ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.max(barPercent, sub.count > 0 ? 5 : 0)}%`,
                    }}
                  />

                  {/* Value label inside bar */}
                  {sub.count > 0 && barPercent >= 16 && (
                    <span className="absolute left-2.5 text-[11px] font-mono font-bold text-white pointer-events-none">
                      {fmt(sub.count)} Kader
                    </span>
                  )}
                </div>

                {/* Exact Number & % */}
                <div className="w-20 sm:w-24 text-right shrink-0">
                  <span className="font-mono font-bold text-white text-xs sm:text-sm block leading-none">
                    {fmt(sub.count)}
                  </span>
                  <span className={`text-[10px] sm:text-[11px] font-mono block mt-0.5 ${
                    isTop1 ? 'text-amber-400' : 'text-zinc-400'
                  }`}>
                    {sub.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Total: <strong className="text-white">{subdistricts.length} DPC Kecamatan</strong> &bull; <strong className="text-emerald-400">{officialDprtCount} DPRt Desa/Kel</strong></span>
          <span>&bull;</span>
          <span>Pengurus SK: <strong className="text-amber-400">{fmt(pengurusCount)}</strong></span>
          <span>&bull;</span>
          <span>Anggota KTP: <strong className="text-blue-400">{fmt(anggotaCount)}</strong></span>
        </div>
        <button
          onClick={onBackToColumn15}
          className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
        >
          &larr; Ringkasan 15 Kab/Kota
        </button>
      </div>
    </div>
  );
};
