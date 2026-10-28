import React from 'react';
import { Clock, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { AnalyticsScreenId } from '../types';

interface AnalyticsCommandCenterHeaderProps {
  activeScreen: AnalyticsScreenId;
  setActiveScreen: (screen: AnalyticsScreenId) => void;
  currentTime: string;
  autoRefreshInterval: number;
  countdown: number;
  isRefreshingCloud: boolean;
  onRefreshCloud?: () => Promise<void>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const AnalyticsCommandCenterHeader: React.FC<AnalyticsCommandCenterHeaderProps> = ({
  activeScreen,
  setActiveScreen,
  currentTime,
  autoRefreshInterval,
  countdown,
  isRefreshingCloud,
  onRefreshCloud,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className="bg-black border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left Branding & Live Status */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase font-mono">
              DPW PARTAI NASDEM SULUT
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 block">
            Pusat Analisis Teritorial &bull; <strong className="text-blue-400 font-mono">15 DPD</strong> &bull; <strong className="text-amber-400 font-mono">171 DPC</strong> &bull; <strong className="text-emerald-400 font-mono">1.602 DPRt</strong>
          </span>
        </div>
      </div>

      {/* Center Screen Navigator Pill Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveScreen('grid')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'grid'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          🗂️ Grid Panel
        </button>
        <button
          onClick={() => setActiveScreen('column15')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'column15'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          📊 1. Batang 15 Kab
        </button>
        <button
          onClick={() => setActiveScreen('drilldown')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'drilldown'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          🔍 2. Drilldown Kec
        </button>
        <button
          onClick={() => setActiveScreen('composition')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'composition'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          🍩 3. Komposisi
        </button>
        <button
          onClick={() => setActiveScreen('leaderboard')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'leaderboard'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          🏆 4. Peringkat
        </button>
        <button
          onClick={() => setActiveScreen('zones')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'zones'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          🗺️ 5. Zona Wilayah
        </button>
        <button
          onClick={() => setActiveScreen('status_gender')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'status_gender'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          📈 6. Demografi
        </button>
      </div>

      {/* Right Tools: WITA Clock, Refresh, Fullscreen */}
      <div className="flex items-center gap-2">
        {/* WITA Digital Clock */}
        <div className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
            {currentTime || '--:--:--'} WITA
          </span>
        </div>

        {/* Auto Refresh Indicator */}
        <div
          title={`Pembaruan otomatis tiap ${autoRefreshInterval} detik (Tersisa: ${countdown}s)`}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
          <span>{countdown}s</span>
        </div>

        {/* Manual Refresh Button */}
        {onRefreshCloud && (
          <button
            onClick={() => onRefreshCloud()}
            disabled={isRefreshingCloud}
            className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Perbarui Data Langsung dari Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Native Fullscreen TV Mode */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 transition-colors cursor-pointer"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh TV (Edge-to-Edge)'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
