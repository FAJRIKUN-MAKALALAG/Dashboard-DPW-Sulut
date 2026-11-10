import React, { useState, useMemo } from 'react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { DPRT_STRUCTURE_TEMPLATE } from '../../data/structureTemplates';
import {
  computeStructureReadiness,
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  normalizeDpcName,
  normalizeDprtName,
  getDpdPimpinanCompliance,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import {
  isJobTitleMatch,
  sortMembersByHierarchy,
  isDefinitiveLeader,
} from '../../utils/jobMatchingUtils';
import { TerritoryDetailDrawer } from './TerritoryDetailDrawer';
import {
  DpwReadinessView,
  DpdReadinessView,
  DpcReadinessView,
  DprtReadinessView,
} from './readiness-roles';
import {
  ReadinessLegalGuidelines,
  ReadinessTerritorialGrids,
} from './readiness-roles/ReadinessTerritorialGrids';

interface UnifiedTerritorialReadinessProps {
  members: Member[];
  session?: UserSession;
  selectedDpdFilter?: string;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const UnifiedTerritorialReadiness: React.FC<UnifiedTerritorialReadinessProps> = ({
  members,
  session,
  selectedDpdFilter,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG'>('ALL');
  const [dprtSearchTerm, setDprtSearchTerm] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);

  // Selected DPD for slide-over Micro-Page drawer
  const [selectedDrawerRegion, setSelectedDrawerRegion] = useState<string | null>(null);
  const [selectedDrawerInitialTab, setSelectedDrawerInitialTab] = useState<'dpd' | 'dpc' | 'dprt'>('dpd');
  const [selectedDrawerInitialDpc, setSelectedDrawerInitialDpc] = useState<string | null>(null);

  const isSuperAdminOrDpw = !session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
  const isDpcScoped = session?.role === 'ADMIN_DPC';
  const isDprtScoped = session?.role === 'ADMIN_DPRT';
  const isRegionalScoped = !isSuperAdminOrDpw;

  // Active DPD scope (either from role access or Super Admin selection)
  const activeDpdScope = useMemo(() => {
    if (isRegionalScoped && session?.dpdAccess && session.dpdAccess !== 'ALL') {
      return session.dpdAccess;
    }
    if (selectedDpdFilter && selectedDpdFilter !== 'ALL') {
      return selectedDpdFilter;
    }
    return null;
  }, [isRegionalScoped, session, selectedDpdFilter]);

  // Scoped list of regions
  const regionsToDisplay = useMemo(() => {
    let list = SULUT_REGIONS;
    if (activeDpdScope) {
      const filtered = list.filter((r) => isDpdMatch(r.name, activeDpdScope));
      if (filtered.length > 0) list = filtered;
    }
    return list;
  }, [activeDpdScope]);

  // Current active region object if scoped
  const currentRegion = useMemo(() => {
    if (activeDpdScope) {
      const found = SULUT_REGIONS.find((r) => isDpdMatch(r.name, activeDpdScope));
      if (found) return found;
    }
    if (session?.dpcAccess && session.dpcAccess !== 'ALL') {
      const found = SULUT_REGIONS.find((r) =>
        r.subdistricts.some((s) => isDpcMatch(s.name, session.dpcAccess))
      );
      if (found) return found;
    }
    return regionsToDisplay[0] || null;
  }, [activeDpdScope, regionsToDisplay, session]);

  // Current active subdistrict if DPC scoped
  const currentSubdistrict = useMemo(() => {
    const dpcName = session?.dpcAccess;
    if (!dpcName || dpcName === 'ALL') return null;
    if (currentRegion) {
      const sub = currentRegion.subdistricts.find((s) => isDpcMatch(s.name, dpcName));
      if (sub) return sub;
    }
    for (const r of SULUT_REGIONS) {
      const sub = r.subdistricts.find((s) => isDpcMatch(s.name, dpcName));
      if (sub) return sub;
    }
    return null;
  }, [session, currentRegion]);

  // Filtered members by current territorial scope
  const scopedMembers = useMemo(() => {
    let list = members;
    if (isDprtScoped && session?.dprtAccess && activeDpdScope) {
      list = list.filter(
        (m) =>
          isDpdMatch(m.dpd, activeDpdScope) &&
          (!session.dpcAccess || isDpcMatch(m.dpc, session.dpcAccess)) &&
          isDprtMatch(m.dprt, session.dprtAccess)
      );
    } else if (isDpcScoped && session?.dpcAccess && activeDpdScope) {
      list = list.filter((m) => isDpdMatch(m.dpd, activeDpdScope) && isDpcMatch(m.dpc, session.dpcAccess));
    } else if (activeDpdScope) {
      list = list.filter((m) => isDpdMatch(m.dpd, activeDpdScope));
    }
    return list;
  }, [members, activeDpdScope, isDpcScoped, isDprtScoped, session]);

  // Active scoped members & committee breakdown
  const activeScopedMembers = useMemo(
    () => scopedMembers.filter((m) => m.status === 'Aktif'),
    [scopedMembers]
  );
  const activePengurus = useMemo(
    () => activeScopedMembers.filter((m) => m.isPengurus),
    [activeScopedMembers]
  );

  // Fallback provincial readiness summary for Super Admin / DPW
  const readinessSummary = useMemo(() => computeStructureReadiness(members), [members]);

  // DPD Compliance for the scoped DPD
  const dpdCompliance = useMemo(() => {
    if (!currentRegion) return null;
    return getDpdPimpinanCompliance(currentRegion.name, members);
  }, [currentRegion, members]);

  // DPC & DPRt Penetration for the scoped DPD (counts only within this DPD)
  const regionalTerritoryStats = useMemo(() => {
    if (!currentRegion) return null;
    const totalDpcs = currentRegion.subdistricts.length;
    const totalDprts = currentRegion.subdistricts.reduce((sum, s) => sum + s.villages.length, 0);

    const coveredRegionalDpcs = new Set<string>();
    const coveredRegionalDprts = new Set<string>();
    const regionScopedMembers = activeDpdScope
      ? activeScopedMembers
      : activeScopedMembers.filter((m) => isDpdMatch(m.dpd, currentRegion.name));

    currentRegion.subdistricts.forEach((sub) => {
      const subMembers = regionScopedMembers.filter((m) => isDpcMatch(m.dpc, sub.name));
      if (subMembers.length > 0) {
        const subKey = normalizeDpcName(sub.name).replace(/\s+/g, '');
        coveredRegionalDpcs.add(subKey);
        sub.villages.forEach((v) => {
          if (subMembers.some((m) => isDprtMatch(m.dprt, v))) {
            coveredRegionalDprts.add(`${subKey}__${normalizeDprtName(v).replace(/\s+/g, '')}`);
          }
        });
      }
    });

    regionScopedMembers.forEach((m) => {
      const isDpc =
        m.tingkatKepengurusan === 'DPC' ||
        (m.isPengurus && (m.jabatan || '').toLowerCase().includes('dpc')) ||
        (m.isPengurus && (m.jabatan || '').toLowerCase().includes('cabang'));
      const raw = (m.dpc || '').trim();
      if (
        isDpc &&
        raw &&
        raw !== '-' &&
        raw.toLowerCase() !== 'umum' &&
        raw.toLowerCase() !== 'umum (dpd)' &&
        raw.toLowerCase() !== 'pusat/umum' &&
        raw.toLowerCase() !== 'wilayah dpd' &&
        raw.toLowerCase() !== 'belum terpetakan'
      ) {
        coveredRegionalDpcs.add(normalizeDpcName(raw).replace(/\s+/g, ''));
      }
    });

    const filledDpcs = coveredRegionalDpcs.size;

    regionScopedMembers.forEach((m) => {
      const isDprt =
        m.tingkatKepengurusan === 'DPRt' ||
        (m.isPengurus && (m.jabatan || '').toLowerCase().includes('dprt')) ||
        (m.isPengurus && (m.jabatan || '').toLowerCase().includes('ranting'));
      const raw = (m.dprt || '').trim();
      if (
        isDprt &&
        raw &&
        raw !== '-' &&
        raw.toLowerCase() !== 'umum' &&
        raw.toLowerCase() !== 'pusat/umum' &&
        raw.toLowerCase() !== 'belum terpetakan'
      ) {
        coveredRegionalDprts.add(`${normalizeDpcName(m.dpc).replace(/\s+/g, '')}__${normalizeDprtName(raw).replace(/\s+/g, '')}`);
      }
    });

    const filledDprts = coveredRegionalDprts.size;

    return {
      totalDpcs,
      totalDprts,
      filledDpcs,
      filledDprts,
    };
  }, [currentRegion, activeScopedMembers, activeDpdScope]);

  // DPC Scope Stats (if logged in as ADMIN_DPC)
  const dpcScopedStats = useMemo(() => {
    if (!isDpcScoped || !currentSubdistrict) return null;
    const totalVillages = currentSubdistrict.villages.length;
    const filledVillages = currentSubdistrict.villages.filter((v) =>
      activeScopedMembers.some((m) => isDprtMatch(m.dprt, v))
    ).length;
    const dpcPengurusCount = activePengurus.filter(
      (m) =>
        m.tingkatKepengurusan === 'DPC' ||
        (m.jabatan && (m.jabatan.toLowerCase().includes('dpc') || m.jabatan.toLowerCase().includes('cabang')))
    ).length;

    return {
      totalVillages,
      filledVillages,
      dpcPengurusCount,
    };
  }, [isDpcScoped, currentSubdistrict, activeScopedMembers, activePengurus]);

  // DPRt Scope Stats (if logged in as ADMIN_DPRT)
  const dprtScopedStats = useMemo(() => {
    if (!isDprtScoped || !session?.dprtAccess) return null;
    const dprtPengurus = activePengurus.filter(
      (m) =>
        m.tingkatKepengurusan === 'DPRt' ||
        (m.jabatan && (m.jabatan.toLowerCase().includes('dprt') || m.jabatan.toLowerCase().includes('ranting')))
    );
    const dprtPengurusCount = dprtPengurus.length;
    const hasKetua = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('ketua'));
    const hasSekretaris = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('sekretaris'));
    const hasBendahara = dprtPengurus.some((m) => (m.jabatan || '').toLowerCase().includes('bendahara'));

    return {
      villageName: session.dprtAccess,
      dprtPengurusCount,
      ksbStatus: {
        ketua: hasKetua,
        sekretaris: hasSekretaris,
        bendahara: hasBendahara,
      },
    };
  }, [isDprtScoped, session, activePengurus]);

  // DPRt Villages Stats for DPC-scoped / DPRt-scoped view
  const dpcVillagesStats = useMemo(() => {
    if (!currentSubdistrict) return [];

    let targetVillages = currentSubdistrict.villages;
    if (isDprtScoped && session?.dprtAccess) {
      targetVillages = targetVillages.filter((v) => isDprtMatch(v, session.dprtAccess));
    }

    return targetVillages.map((villageName) => {
      const villageMembers = activeScopedMembers.filter((m) => isDprtMatch(m.dprt, villageName));
      const villagePengurus = villageMembers.filter((m) => m.isPengurus || m.tingkatKepengurusan === 'DPRt');

      const dprtTarget = DPRT_STRUCTURE_TEMPLATE.length;
      const filledSlots = DPRT_STRUCTURE_TEMPLATE.filter((slot) =>
        villagePengurus.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
      );
      const filledCount = filledSlots.length;
      const percentage = Math.round((filledCount / dprtTarget) * 100);

      const sortedCadres = sortMembersByHierarchy(villageMembers);
      const ketuaDprt = sortedCadres.find((c) => isDefinitiveLeader(c.jabatan));
      const sekretarisDprt = sortedCadres.find((c) => (c.jabatan || '').toLowerCase().includes('sekretaris'));
      const bendaharaDprt = sortedCadres.find((c) => (c.jabatan || '').toLowerCase().includes('bendahara'));

      let status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' = 'KOSONG';
      if (filledCount >= dprtTarget) {
        status = 'LENGKAP';
      } else if (filledCount > 0 || villageMembers.length > 0) {
        status = 'SEBAGIAN';
      }

      return {
        name: villageName,
        totalCadres: villageMembers.length,
        totalPengurus: villagePengurus.length,
        filledCount,
        percentage,
        status,
        ketuaDprt,
        sekretarisDprt,
        bendaharaDprt,
        cadres: villageMembers,
      };
    });
  }, [currentSubdistrict, activeScopedMembers, isDprtScoped, session]);

  // Filtered DPRt villages by tab and search
  const filteredDprtVillages = useMemo(() => {
    return dpcVillagesStats.filter((v) => {
      if (filterTab !== 'ALL' && v.status !== filterTab) return false;
      if (dprtSearchTerm.trim() && !v.name.toLowerCase().includes(dprtSearchTerm.trim().toLowerCase())) return false;
      return true;
    });
  }, [dpcVillagesStats, filterTab, dprtSearchTerm]);

  // Compute readiness stats per region once for efficiency (used in bottom cards)
  const regionStats = useMemo(() => {
    return regionsToDisplay.map((region) => {
      const compliance = getDpdPimpinanCompliance(region.name, members);
      const regMembers = members.filter((m) => isDpdMatch(m.dpd, region.name) && m.status === 'Aktif');
      const regPengurus = regMembers.filter((m) => m.isPengurus);

      const totalDpcs = region.subdistricts.length;
      const totalDprts = region.subdistricts.reduce((sum, sub) => sum + sub.villages.length, 0);

      const filledDpcs = region.subdistricts.filter((sub) =>
        regMembers.some((m) => isDpcMatch(m.dpc, sub.name))
      ).length;

      let filledDprts = 0;
      region.subdistricts.forEach((sub) => {
        sub.villages.forEach((v) => {
          if (regMembers.some((m) => isDpcMatch(m.dpc, sub.name) && isDprtMatch(m.dprt, v))) {
            filledDprts++;
          }
        });
      });

      const pertimbanganCount = regPengurus.filter(
        (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN'
      ).length;
      const pakarCount = regPengurus.filter(
        (m) => getMemberSubOrgCategory(m) === 'PAKAR'
      ).length;

      let status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' = 'KOSONG';
      if (compliance.isComplete) {
        status = 'LENGKAP';
      } else if (compliance.filledCount > 0) {
        status = 'SEBAGIAN';
      }

      return {
        region,
        compliance,
        status,
        regMembersCount: regMembers.length,
        regPengurusCount: regPengurus.length,
        filledDpcs,
        totalDpcs,
        filledDprts,
        totalDprts,
        pertimbanganCount,
        pakarCount,
      };
    });
  }, [regionsToDisplay, members]);

  // Filter based on tab
  const filteredRegionStats = useMemo(() => {
    if (filterTab === 'ALL') return regionStats;
    return regionStats.filter((r) => r.status === filterTab);
  }, [regionStats, filterTab]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs space-y-5 sm:space-y-6 transition-colors">
      {/* 1 & 2. Tampilan Header & 3 Kartu Ringkasan KPI Terpisah per Role (DPW, DPD, DPC, DPRt) */}
      {isDprtScoped && dprtScopedStats ? (
        <DprtReadinessView
          dpdName={currentRegion?.name || activeDpdScope || 'Sulawesi Utara'}
          dpcName={session?.dpcAccess || currentSubdistrict?.name || ''}
          dprtName={session?.dprtAccess || dprtScopedStats.villageName}
          activeScopedMembers={activeScopedMembers}
          activePengurus={activePengurus}
          dprtScopedStats={dprtScopedStats}
          showGuidelines={showGuidelines}
          setShowGuidelines={setShowGuidelines}
          onOpenStructureModal={onOpenStructureModal}
          onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        />
      ) : isDpcScoped && dpcScopedStats ? (
        <DpcReadinessView
          dpdName={currentRegion?.name || activeDpdScope || 'Sulawesi Utara'}
          dpcName={session?.dpcAccess || currentSubdistrict?.name || ''}
          activeScopedMembers={activeScopedMembers}
          activePengurus={activePengurus}
          dpcScopedStats={dpcScopedStats}
          showGuidelines={showGuidelines}
          setShowGuidelines={setShowGuidelines}
          onOpenStructureModal={onOpenStructureModal}
          onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        />
      ) : activeDpdScope ? (
        <DpdReadinessView
          dpdName={currentRegion?.name || activeDpdScope}
          activeScopedMembers={activeScopedMembers}
          activePengurus={activePengurus}
          dpdCompliance={dpdCompliance}
          regionalTerritoryStats={regionalTerritoryStats}
          showGuidelines={showGuidelines}
          setShowGuidelines={setShowGuidelines}
          onOpenStructureModal={onOpenStructureModal}
          onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        />
      ) : (
        <DpwReadinessView
          members={members}
          readinessSummary={readinessSummary}
          showGuidelines={showGuidelines}
          setShowGuidelines={setShowGuidelines}
          onOpenStructureModal={onOpenStructureModal}
          onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        />
      )}

      {/* 2. Optional Guidelines */}
      {showGuidelines && <ReadinessLegalGuidelines />}

      {/* 4. Filter Tabs & Grid */}
      <ReadinessTerritorialGrids
        isDpcScoped={isDpcScoped}
        isDprtScoped={isDprtScoped}
        activeDpdScope={activeDpdScope}
        currentRegionName={currentRegion?.name || activeDpdScope || 'Kabupaten Minahasa Selatan'}
        currentDpcName={session?.dpcAccess || currentSubdistrict?.name || 'Amurang'}
        dprtAccess={session?.dprtAccess}
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        dprtSearchTerm={dprtSearchTerm}
        setDprtSearchTerm={setDprtSearchTerm}
        dpcVillagesStats={dpcVillagesStats}
        filteredDprtVillages={filteredDprtVillages}
        regionStats={regionStats}
        filteredRegionStats={filteredRegionStats}
        regionsCount={regionsToDisplay.length}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        onSelectDrawer={(regionName, initialTab, initialDpc) => {
          setSelectedDrawerInitialTab(initialTab);
          setSelectedDrawerInitialDpc(initialDpc);
          setSelectedDrawerRegion(regionName);
        }}
      />

      {/* 5. Slide-Over Micro-Page Drawer */}
      <TerritoryDetailDrawer
        isOpen={Boolean(selectedDrawerRegion)}
        onClose={() => setSelectedDrawerRegion(null)}
        regionName={selectedDrawerRegion}
        members={members}
        session={session}
        initialTab={selectedDrawerInitialTab}
        initialDpcName={selectedDrawerInitialDpc}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        onOpenStructureModal={onOpenStructureModal}
      />
    </div>
  );
};

export default UnifiedTerritorialReadiness;
