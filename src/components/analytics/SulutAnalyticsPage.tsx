import React, { useState, useEffect } from 'react';
import { Member, UserSession } from '../../types';
import { Eye, EyeOff } from 'lucide-react';
import { DpcTerritoryDrilldownDrawer } from './DpcTerritoryDrilldownDrawer';
import { AnalyticsScreenId, SULUT_15_KABKOTA } from './types';
import { useSulutAnalyticsData } from './hooks/useSulutAnalyticsData';
import {
  AnalyticsCommandCenterHeader,
  AnalyticsQuickKpiBar,
  AnalyticsTerritorialStructureBar,
} from './components';
import {
  Column15Chart,
  KecamatanDrilldownChart,
  CadreCompositionChart,
  TerritoryLeaderboardChart,
  GeographicZonesChart,
  DemographicsChart,
} from './charts';

// Re-export types & constants for external consumers
export type { AnalyticsScreenId };
export { SULUT_15_KABKOTA };

interface SulutAnalyticsPageProps {
  members: Member[];
  session?: UserSession;
  onRefreshCloud?: () => Promise<void>;
  isRefreshingCloud?: boolean;
  initialScreen?: string | null;
  isCleanMode?: boolean;
}

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
    if (
      initialScreen &&
      ['grid', 'column15', 'drilldown', 'composition', 'leaderboard', 'zones', 'status_gender'].includes(
        initialScreen
      )
    ) {
      return initialScreen as AnalyticsScreenId;
    }
    return 'grid';
  });

  // Selected DPD for drilldown view
  const [selectedDrilldownDpd, setSelectedDrilldownDpd] = useState<string>('Minahasa Selatan');

  // Interactive territorial breakdown state for the 3 Executive Q&A cards
  const [territoryBreakdownTab, setTerritoryBreakdownTab] = useState<'DPD' | 'DPC' | 'DPRt' | null>('DPC');
  const [selectedDpcForDrawer, setSelectedDpcForDrawer] = useState<{ dpdName: string; dpcName: string } | null>(null);
  const [breakdownZoneFilter, setBreakdownZoneFilter] = useState<'ALL' | 'Daratan Minahasa' | 'BMR' | 'Kepulauan'>('ALL');

  // Real-time WITA clock & auto-refresh
  const [currentTime, setCurrentTime] = useState<string>('');
  const [autoRefreshInterval] = useState<number>(30); // 30s default
  const [countdown, setCountdown] = useState<number>(30);
  const [isTvCleanBar, setIsTvCleanBar] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Update WITA clock every second
  useEffect(() => {
    const updateWitaTime = () => {
      const now = new Date();
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

  // Aggregated data and metrics via custom hook
  const { analyticsData, drilldownData, yTicks, fmt } = useSulutAnalyticsData(members, selectedDrilldownDpd);

  // ============================================================================
  // MAIN BODY RENDER (GRID vs SINGLE SCREEN)
  // ============================================================================
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Command Center Top Navigation Bar */}
      {!isTvCleanBar && (
        <AnalyticsCommandCenterHeader
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          currentTime={currentTime}
          autoRefreshInterval={autoRefreshInterval}
          countdown={countdown}
          isRefreshingCloud={isRefreshingCloud}
          onRefreshCloud={onRefreshCloud}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Floating Toggle to show/hide clean bar on TV walls */}
      {isCleanMode && (
        <button
          onClick={() => setIsTvCleanBar(!isTvCleanBar)}
          className="fixed top-2 right-2 z-50 p-1.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 text-xs opacity-60 hover:opacity-100 transition-opacity border border-zinc-800 cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 1: DISTRIBUSI TERITORIAL 15 KABUPATEN / KOTA
              </span>
            </div>
            <Column15Chart
              analyticsData={analyticsData}
              yTicks={yTicks}
              fmt={fmt}
              isSolo={true}
              hoveredBarIndex={hoveredBarIndex}
              setHoveredBarIndex={setHoveredBarIndex}
              onSelectDpd={(dpd) => {
                setSelectedDrilldownDpd(dpd);
                setActiveScreen('drilldown');
              }}
              onOpenFullscreen={() => setActiveScreen('column15')}
              onOpenStandalone={handleOpenStandaloneScreen}
            />
          </div>
        )}

        {activeScreen === 'drilldown' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 2: RINCIAN SEBARAN KECAMATAN (DPC)
              </span>
            </div>
            <KecamatanDrilldownChart
              drilldownData={drilldownData}
              selectedDrilldownDpd={selectedDrilldownDpd}
              setSelectedDrilldownDpd={setSelectedDrilldownDpd}
              fmt={fmt}
              isSolo={true}
              onOpenFullscreen={() => setActiveScreen('drilldown')}
              onOpenStandalone={handleOpenStandaloneScreen}
              onBackToColumn15={() => setActiveScreen('column15')}
              onSelectDpcForDrawer={(dpdName, dpcName) => setSelectedDpcForDrawer({ dpdName, dpcName })}
            />
          </div>
        )}

        {activeScreen === 'composition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 3: KOMPOSISI PENGURUS BER-SK VS ANGGOTA KTP
              </span>
            </div>
            <CadreCompositionChart
              analyticsData={analyticsData}
              fmt={fmt}
              isSolo={true}
              onOpenFullscreen={() => setActiveScreen('composition')}
              onOpenStandalone={handleOpenStandaloneScreen}
            />
          </div>
        )}

        {activeScreen === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 4: PERINGKAT WILAYAH TERBANYAK
              </span>
            </div>
            <TerritoryLeaderboardChart
              analyticsData={analyticsData}
              fmt={fmt}
              isSolo={true}
              onOpenFullscreen={() => setActiveScreen('leaderboard')}
              onOpenStandalone={handleOpenStandaloneScreen}
              onSelectDpd={(dpd) => {
                setSelectedDrilldownDpd(dpd);
                setActiveScreen('drilldown');
              }}
            />
          </div>
        )}

        {activeScreen === 'zones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 5: SEBARAN 3 ZONA GEOGRAFIS SULUT
              </span>
            </div>
            <GeographicZonesChart
              analyticsData={analyticsData}
              fmt={fmt}
              isSolo={true}
              onOpenFullscreen={() => setActiveScreen('zones')}
              onOpenStandalone={handleOpenStandaloneScreen}
              onSelectDpd={(dpd) => {
                setSelectedDrilldownDpd(dpd);
                setActiveScreen('drilldown');
              }}
            />
          </div>
        )}

        {activeScreen === 'status_gender' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveScreen('grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 cursor-pointer"
              >
                &larr; Kembali ke Grid Panel
              </button>
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                LAYAR 6: DEMOGRAFI &amp; STATUS VERIFIKASI DOKUMEN
              </span>
            </div>
            <DemographicsChart
              analyticsData={analyticsData}
              fmt={fmt}
              isSolo={true}
              onOpenFullscreen={() => setActiveScreen('status_gender')}
              onOpenStandalone={handleOpenStandaloneScreen}
            />
          </div>
        )}

        {/* Default Multi-Panel Grid Mode */}
        {activeScreen === 'grid' && (
          <div className="space-y-6">
            {/* Executive Territorial Structure Bar (Answers for Ketua DPW) */}
            <AnalyticsTerritorialStructureBar
              analyticsData={analyticsData}
              members={members}
              fmt={fmt}
              territoryBreakdownTab={territoryBreakdownTab}
              setTerritoryBreakdownTab={setTerritoryBreakdownTab}
              breakdownZoneFilter={breakdownZoneFilter}
              setBreakdownZoneFilter={setBreakdownZoneFilter}
              onSelectDpcForDrawer={(dpdName, dpcName) =>
                setSelectedDpcForDrawer({ dpdName, dpcName })
              }
            />

            {/* Quick KPI Row */}
            <AnalyticsQuickKpiBar analyticsData={analyticsData} fmt={fmt} />

            {/* Row 1: Main 15 Kab/Kota Column Chart */}
            <Column15Chart
              analyticsData={analyticsData}
              yTicks={yTicks}
              fmt={fmt}
              isSolo={false}
              hoveredBarIndex={hoveredBarIndex}
              setHoveredBarIndex={setHoveredBarIndex}
              onSelectDpd={(dpd) => {
                setSelectedDrilldownDpd(dpd);
                setActiveScreen('drilldown');
              }}
              onOpenFullscreen={() => setActiveScreen('column15')}
              onOpenStandalone={handleOpenStandaloneScreen}
            />

            {/* Row 2: Drilldown Kecamatan & Komposisi Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KecamatanDrilldownChart
                drilldownData={drilldownData}
                selectedDrilldownDpd={selectedDrilldownDpd}
                setSelectedDrilldownDpd={setSelectedDrilldownDpd}
                fmt={fmt}
                isSolo={false}
                onOpenFullscreen={() => setActiveScreen('drilldown')}
                onOpenStandalone={handleOpenStandaloneScreen}
                onBackToColumn15={() => setActiveScreen('column15')}
                onSelectDpcForDrawer={(dpdName, dpcName) => setSelectedDpcForDrawer({ dpdName, dpcName })}
              />
              <CadreCompositionChart
                analyticsData={analyticsData}
                fmt={fmt}
                isSolo={false}
                onOpenFullscreen={() => setActiveScreen('composition')}
                onOpenStandalone={handleOpenStandaloneScreen}
              />
            </div>

            {/* Row 3: Leaderboard & 3 Geographics Zones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TerritoryLeaderboardChart
                analyticsData={analyticsData}
                fmt={fmt}
                isSolo={false}
                onOpenFullscreen={() => setActiveScreen('leaderboard')}
                onOpenStandalone={handleOpenStandaloneScreen}
                onSelectDpd={(dpd) => {
                  setSelectedDrilldownDpd(dpd);
                  setActiveScreen('drilldown');
                }}
              />
              <GeographicZonesChart
                analyticsData={analyticsData}
                fmt={fmt}
                isSolo={false}
                onOpenFullscreen={() => setActiveScreen('zones')}
                onOpenStandalone={handleOpenStandaloneScreen}
                onSelectDpd={(dpd) => {
                  setSelectedDrilldownDpd(dpd);
                  setActiveScreen('drilldown');
                }}
              />
            </div>

            {/* Row 4: Demografi & Verifikasi Status */}
            <DemographicsChart
              analyticsData={analyticsData}
              fmt={fmt}
              isSolo={false}
              onOpenFullscreen={() => setActiveScreen('status_gender')}
              onOpenStandalone={handleOpenStandaloneScreen}
            />
          </div>
        )}
      </div>

      {/* 3. DPC & DPRt Micro-Page Drilldown Drawer */}
      <DpcTerritoryDrilldownDrawer
        isOpen={Boolean(selectedDpcForDrawer)}
        onClose={() => setSelectedDpcForDrawer(null)}
        dpdName={selectedDpcForDrawer?.dpdName || null}
        dpcName={selectedDpcForDrawer?.dpcName || null}
        members={members}
        session={session}
      />
    </div>
  );
};
