import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getDpdPimpinanCompliance,
  computeDpcReadinessForDpd,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import { isJobTitleMatch } from '../../utils/jobMatchingUtils';
import { ShieldCheck, MapPin, Layers } from 'lucide-react';
import {
  DrawerHeader,
  DpdSlotsTab,
  DpcSubdistrictsTab,
  DprtOverviewTab,
  SubdistrictDetail,
} from './drawer';

interface TerritoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string | null;
  members: Member[];
  session?: UserSession;
  initialTab?: 'dpd' | 'dpc' | 'dprt';
  initialDpcName?: string | null;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const TerritoryDetailDrawer: React.FC<TerritoryDetailDrawerProps> = ({
  isOpen,
  onClose,
  regionName,
  members,
  session,
  initialTab,
  initialDpcName,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const isDpcScoped = session?.role === 'ADMIN_DPC' || (Boolean(session?.dpcAccess && session.dpcAccess !== 'ALL') && session?.role !== 'SUPER_ADMIN' && session?.role !== 'ADMIN_DPW');
  const isDprtScoped = session?.role === 'ADMIN_DPRT';
  const defaultTab = isDpcScoped || isDprtScoped ? 'dprt' : (initialTab || 'dpd');

  const [activeTab, setActiveTab] = useState<'dpd' | 'dpc' | 'dprt'>(defaultTab);
  const [dpdSlotFilter, setDpdSlotFilter] = useState<'ALL' | 'FILLED' | 'VACANT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDpcForDrilldown, setSelectedDpcForDrilldown] = useState<string | null>(session?.dpcAccess || initialDpcName || null);
  const [dpcSearchTerm, setDpcSearchTerm] = useState('');
  const [dprtSearchTerm, setDprtSearchTerm] = useState('');

  // Sync state when drawer opens or region / initialTab changes
  useEffect(() => {
    if (isOpen) {
      if (isDpcScoped || isDprtScoped) {
        setActiveTab('dprt');
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
      setSelectedDpcForDrilldown(session?.dpcAccess || initialDpcName || null);
      setSearchTerm('');
      setDpcSearchTerm('');
      setDprtSearchTerm('');
    }
  }, [isOpen, initialTab, initialDpcName, regionName, isDpcScoped, isDprtScoped, session]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const regionInfo = useMemo(() => {
    if (!regionName) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, regionName));
  }, [regionName]);

  // Data calculations for selected DPD
  const activeMembersInRegion = useMemo(() => {
    if (!regionName) return [];
    return members.filter((m) => isDpdMatch(m.dpd, regionName) && m.status === 'Aktif');
  }, [regionName, members]);

  const pengurusInRegion = useMemo(() => {
    return activeMembersInRegion.filter((m) => m.isPengurus);
  }, [activeMembersInRegion]);

  const compliance = useMemo(() => {
    if (!regionName) return null;
    return getDpdPimpinanCompliance(regionName, members);
  }, [regionName, members]);

  const dpcReadinessList = useMemo(() => {
    if (!regionName) return [];
    return computeDpcReadinessForDpd(regionName, members);
  }, [regionName, members]);

  // Detailed subdistrict statistics (DPC formasi + DPRt villages breakdown)
  const subdistrictDetails: SubdistrictDetail[] = useMemo(() => {
    if (!regionInfo) return [];
    return regionInfo.subdistricts.map((sub) => {
      const dpcReadiness = dpcReadinessList.find((d) =>
        isDpcMatch(d.name, sub.name)
      );

      const subMembers = activeMembersInRegion.filter((m) =>
        isDpcMatch(m.dpc, sub.name)
      );

      const pengurusDpc = subMembers.filter((m) => m.tingkatKepengurusan === 'DPC');

      const villageStats = sub.villages.map((v) => {
        const cadresInVillage = subMembers.filter((m) => isDprtMatch(m.dprt, v));
        const pengurusDprt = cadresInVillage.filter(
          (m) => m.tingkatKepengurusan === 'DPRt' || m.isPengurus
        );
        return {
          name: v,
          cadres: cadresInVillage,
          pengurus: pengurusDprt,
          isFilled: cadresInVillage.length > 0,
        };
      });

      const filledVillagesCount = villageStats.filter((v) => v.isFilled).length;
      const totalVillagesCount = sub.villages.length;
      const villageCoveragePercentage =
        totalVillagesCount > 0
          ? Math.round((filledVillagesCount / totalVillagesCount) * 100)
          : 0;

      return {
        subdistrict: sub,
        dpcReadiness,
        subMembers,
        pengurusDpc,
        villageStats,
        filledVillagesCount,
        totalVillagesCount,
        villageCoveragePercentage,
      };
    });
  }, [regionInfo, dpcReadinessList, activeMembersInRegion]);

  // Active subdistrict currently selected for DPRt drilldown
  const activeSubDetail = useMemo(() => {
    if (!selectedDpcForDrilldown || !subdistrictDetails.length) return null;
    return (
      subdistrictDetails.find((d) =>
        isDpcMatch(d.subdistrict.name, selectedDpcForDrilldown)
      ) || null
    );
  }, [selectedDpcForDrilldown, subdistrictDetails]);

  // Core leadership (Ketua, Sekretaris, Bendahara)
  const leaders = useMemo(() => {
    if (!compliance) {
      return { ketua: null, sekretaris: null, bendahara: null };
    }
    const ketuaSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Ketua') && !s.jabatan.toLowerCase().includes('wakil')
    );
    const sekretarisSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Sekretaris') && !s.jabatan.toLowerCase().includes('wakil')
    );
    const bendaharaSlot = compliance.slots.find(
      (s) => isJobTitleMatch(s.jabatan, 'Bendahara') && !s.jabatan.toLowerCase().includes('wakil')
    );

    return {
      ketua: ketuaSlot?.member || null,
      sekretaris: sekretarisSlot?.member || null,
      bendahara: bendaharaSlot?.member || null,
    };
  }, [compliance]);

  // Council organs
  const pertimbanganMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN');
  }, [pengurusInRegion]);

  const pakarMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => getMemberSubOrgCategory(m) === 'PAKAR');
  }, [pengurusInRegion]);

  // Filtered DPD 36 slots
  const filteredSlots = useMemo(() => {
    if (!compliance) return [];
    return compliance.slots.filter((slot) => {
      if (dpdSlotFilter === 'FILLED' && !slot.isFilled) return false;
      if (dpdSlotFilter === 'VACANT' && slot.isFilled) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchJabatan = slot.jabatan.toLowerCase().includes(query);
        const matchName = slot.member?.namaLengkap?.toLowerCase().includes(query);
        const matchNik = slot.member?.nik?.toLowerCase().includes(query);
        return matchJabatan || matchName || matchNik;
      }
      return true;
    });
  }, [compliance, dpdSlotFilter, searchTerm]);

  // DPRt total stats
  const totalDprtTarget = useMemo(() => {
    if (!regionInfo) return 0;
    return regionInfo.subdistricts.reduce((sum, sub) => sum + sub.villages.length, 0);
  }, [regionInfo]);

  const countDprtMembers = useMemo(() => {
    return pengurusInRegion.filter((m) => m.tingkatKepengurusan === 'DPRt').length;
  }, [pengurusInRegion]);

  if (!isOpen || !regionName || !regionInfo || !compliance) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-backdrop-fade cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container - Mentok ke pojok kanan layar */}
      <div className="fixed inset-y-0 right-0 max-w-full flex justify-end pl-4 sm:pl-10 pointer-events-none z-10">
        <div className="pointer-events-auto w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full animate-drawer-slide">
          
          {/* 1. Header Drawer & KPI Summaries */}
          <DrawerHeader
            regionInfo={regionInfo}
            compliance={compliance}
            activeMembersCount={activeMembersInRegion.length}
            activeKecamatanCount={dpcReadinessList.filter((d) => d.totalFilled > 0).length}
            countDprtMembers={countDprtMembers}
            totalDprtTarget={totalDprtTarget}
            leaders={leaders}
            pengurusInRegionCount={pengurusInRegion.length}
            session={session}
            onClose={onClose}
            onOpenTerritorialMatrix={onOpenTerritorialMatrix}
            onOpenStructureModal={onOpenStructureModal}
          />

          {/* 2. Navigation Tabs */}
          <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 sm:gap-4 text-xs font-medium overflow-x-auto whitespace-nowrap">
            {!isDpcScoped && !isDprtScoped && (
              <button
                type="button"
                onClick={() => setActiveTab('dpd')}
                className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold shrink-0 ${
                  activeTab === 'dpd'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <span className="hidden xs:inline">Formasi </span>36 DPD
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {compliance.filledCount}/36
                </span>
              </button>
            )}

            {!isDpcScoped && !isDprtScoped && (
              <button
                type="button"
                onClick={() => setActiveTab('dpc')}
                className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold shrink-0 ${
                  activeTab === 'dpc'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>DPC Kecamatan ({regionInfo.subdistricts.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('dprt')}
              className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold shrink-0 ${
                activeTab === 'dprt'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isDpcScoped ? `DPRt Desa Kec. ${session?.dpcAccess}` : 'Basis Ranting DPRt'}
              </span>
            </button>
          </div>

          {/* 3. Tab Contents with Micro-animation */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div key={activeTab} className="animate-tab-enter space-y-4">
              {activeTab === 'dpd' && (
                <DpdSlotsTab
                  filteredSlots={filteredSlots}
                  compliance={compliance}
                  dpdSlotFilter={dpdSlotFilter}
                  setDpdSlotFilter={setDpdSlotFilter}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  pertimbanganMembers={pertimbanganMembers}
                  pakarMembers={pakarMembers}
                  regionName={regionInfo.name}
                  onOpenTerritorialMatrix={onOpenTerritorialMatrix}
                  onClose={onClose}
                />
              )}

              {activeTab === 'dpc' && (
                <DpcSubdistrictsTab
                  regionName={regionInfo.name}
                  subdistrictDetails={subdistrictDetails}
                  dpcSearchTerm={dpcSearchTerm}
                  setDpcSearchTerm={setDpcSearchTerm}
                  selectedDpcForDrilldown={selectedDpcForDrilldown}
                  setSelectedDpcForDrilldown={setSelectedDpcForDrilldown}
                  activeSubDetail={activeSubDetail}
                  dprtSearchTerm={dprtSearchTerm}
                  setDprtSearchTerm={setDprtSearchTerm}
                  onOpenTerritorialMatrix={onOpenTerritorialMatrix}
                  onClose={onClose}
                />
              )}

              {activeTab === 'dprt' && (
                <DprtOverviewTab
                  regionName={regionInfo.name}
                  totalDprtTarget={totalDprtTarget}
                  selectedDpcForDrilldown={selectedDpcForDrilldown}
                  setSelectedDpcForDrilldown={setSelectedDpcForDrilldown}
                  activeSubDetail={activeSubDetail}
                  subdistrictDetails={subdistrictDetails}
                  dprtSearchTerm={dprtSearchTerm}
                  setDprtSearchTerm={setDprtSearchTerm}
                  onOpenTerritorialMatrix={onOpenTerritorialMatrix}
                  onClose={onClose}
                />
              )}
            </div>
          </div>

          {/* 4. Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Menekan <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">ESC</kbd> untuk menutup
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
