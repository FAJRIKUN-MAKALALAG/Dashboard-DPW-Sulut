import React, { useState, useMemo } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { TerritorialGrowthModal } from './TerritorialGrowthModal';
import { StructureDrilldownModal } from './StructureDrilldownModal';
import { exportMembersToExcel } from '../utils/excelUtils';
import {
  GrowthPeriod,
  computeGrowthAnalytics,
  generateTestScenarioMembers,
} from '../utils/growthUtils';
import { isDpdMatch, isDpcMatch, isDprtMatch, computeStructureKpiStats } from '../utils/structureReadinessUtils';
import {
  DashboardHeader,
  DashboardScopeFilter,
  ExecutiveKpiCards,
  ExecutiveLeadershipAnswers,
  StructureReadinessGrid,
  RecruitmentAnalyticsSection,
  ExecutiveOperationalNote,
} from './dashboard';

interface ExecutiveDashboardProps {
  members: Member[];
  session?: UserSession;
  onOpenPrintReport: () => void;
  onNavigateToMembers: (
    filterDpd?: string,
    filterStatus?: MemberStatus,
    filterMembership?: 'ALL' | 'PENGURUS' | 'ANGGOTA'
  ) => void;
  onOpenCardModal?: (member: Member) => void;
  onAddMembers?: (newMembers: Member[]) => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenUserManagement?: () => void;
  onOpenDownloadTemplate?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  members,
  session,
  onOpenPrintReport,
  onNavigateToMembers,
  onOpenCardModal,
  onAddMembers,
  onOpenTerritorialMatrix,
  onOpenUserManagement,
  onOpenDownloadTemplate,
}) => {
  const [selectedDpdFilter, setSelectedDpdFilter] = useState<string>('ALL');

  // Growth Analytics State
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>('30days');
  const [pinnedDate, setPinnedDate] = useState<string | undefined>(undefined);
  const [filterRecruiter, setFilterRecruiter] = useState<string | undefined>(undefined);
  const [growthViewTab, setGrowthViewTab] = useState<'territory' | 'recruiters'>('territory');

  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [modalInitialDpd, setModalInitialDpd] = useState<string | undefined>(undefined);
  const [modalInitialDpc, setModalInitialDpc] = useState<string | undefined>(undefined);
  const [modalInitialDprt, setModalInitialDprt] = useState<string | undefined>(undefined);
  const [modalInitialRecruiter, setModalInitialRecruiter] = useState<string | undefined>(undefined);

  // Structural Drilldown Modal State
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureModalFilter, setStructureModalFilter] = useState<{
    level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt';
    dpd?: string;
  }>({ level: 'ALL', dpd: 'ALL' });

  // Accordion state for territorial tree inline viewing
  const [expandedDpds, setExpandedDpds] = useState<Record<string, boolean>>({});
  const [expandedDpcs, setExpandedDpcs] = useState<Record<string, boolean>>({});

  const toggleDpdAccordion = (dpdName: string) => {
    setExpandedDpds((prev) => ({ ...prev, [dpdName]: !prev[dpdName] }));
  };

  const toggleDpcAccordion = (dpcKey: string) => {
    setExpandedDpcs((prev) => ({ ...prev, [dpcKey]: !prev[dpcKey] }));
  };

  // Filtered members by region if selected or scoped by role with robust matching
  const scopedMembers = useMemo(() => {
    let list = members;
    if (session && session.role !== 'SUPER_ADMIN') {
      if (session.role === 'ADMIN_DPD') {
        list = list.filter((m) => isDpdMatch(m.dpd, session.dpdAccess));
      } else if (session.role === 'ADMIN_DPC') {
        list = list.filter(
          (m) =>
            isDpdMatch(m.dpd, session.dpdAccess) &&
            (!session.dpcAccess || isDpcMatch(m.dpc, session.dpcAccess))
        );
      } else if (session.role === 'ADMIN_DPRT') {
        list = list.filter(
          (m) =>
            isDpdMatch(m.dpd, session.dpdAccess) &&
            (!session.dpcAccess || isDpcMatch(m.dpc, session.dpcAccess)) &&
            (!session.dprtAccess || isDprtMatch(m.dprt, session.dprtAccess))
        );
      }
    } else if (selectedDpdFilter !== 'ALL') {
      list = list.filter((m) => isDpdMatch(m.dpd, selectedDpdFilter));
    }
    return list;
  }, [members, session, selectedDpdFilter]);

  // Executive calculations
  const activeMembers = scopedMembers.filter((m) => m.status === 'Aktif');
  const pengurusList = scopedMembers.filter((m) => m.status === 'Aktif' && m.isPengurus);
  const countPengurusDpw = scopedMembers.filter(
    (m) => m.status === 'Aktif' && m.tingkatKepengurusan === 'DPW'
  ).length;

  const totalRegistered = scopedMembers.length;
  const activePercentage =
    totalRegistered > 0 ? Math.round((activeMembers.length / totalRegistered) * 100) : 0;

  // Compute Real Structural Completeness KPI (DPW, DPD, DPC, DPRt templates)
  const structureKpi = useMemo(() => {
    return computeStructureKpiStats(members, selectedDpdFilter);
  }, [members, selectedDpdFilter]);

  // Calculate Cadre Growth & Recruiter Analytics
  const growthAnalytics = useMemo(() => {
    const targetSource = !session || session.role === 'SUPER_ADMIN' ? members : scopedMembers;
    const activeDpd =
      !session || session.role === 'SUPER_ADMIN' ? selectedDpdFilter : session.dpdAccess;
    return computeGrowthAnalytics(
      targetSource,
      growthPeriod,
      activeDpd,
      pinnedDate,
      filterRecruiter
    );
  }, [members, scopedMembers, session, growthPeriod, selectedDpdFilter, pinnedDate, filterRecruiter]);

  // Handler for quick scenario injection
  const handleLoadTestScenario = () => {
    if (!onAddMembers) return;
    const testCadres = generateTestScenarioMembers();
    onAddMembers(testCadres);
    setGrowthPeriod('7days');
    setPinnedDate(undefined);
    setFilterRecruiter(undefined);
  };

  const openDrilldownModalWithFocus = (
    dpd?: string,
    dpc?: string,
    dprt?: string,
    recruiter?: string
  ) => {
    setModalInitialDpd(dpd);
    setModalInitialDpc(dpc);
    setModalInitialDprt(dprt);
    setModalInitialRecruiter(recruiter);
    setIsGrowthModalOpen(true);
  };

  const handleOpenStructureModal = (
    dpd: string = 'ALL',
    level: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt' = 'ALL'
  ) => {
    setStructureModalFilter({ level, dpd });
    setIsStructureModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <DashboardHeader
        session={session}
        onExportExcel={() =>
          exportMembersToExcel(activeMembers, `ANGGOTA_AKTIF_SULUT_${selectedDpdFilter}.xlsx`)
        }
        onOpenPrintReport={onOpenPrintReport}
        onOpenUserManagement={onOpenUserManagement}
        onOpenDownloadTemplate={onOpenDownloadTemplate}
      />

      {/* 2. Scope & Territory Filter */}
      <DashboardScopeFilter
        session={session}
        selectedDpdFilter={selectedDpdFilter}
        onSelectDpdFilter={(dpd: string) => {
          setSelectedDpdFilter(dpd);
          setPinnedDate(undefined);
          setFilterRecruiter(undefined);
        }}
        onReset={() => {
          setSelectedDpdFilter('ALL');
          setPinnedDate(undefined);
          setFilterRecruiter(undefined);
        }}
      />

      {/* 3. Executive KPI Cards */}
      <ExecutiveKpiCards
        session={session}
        totalActive={activeMembers.length}
        totalRegistered={totalRegistered}
        activePercentage={activePercentage}
        totalPengurusBerSk={pengurusList.length}
        totalAnggotaBiasa={activeMembers.length - pengurusList.length}
        countPengurusDpw={countPengurusDpw}
        selectedDpdFilter={selectedDpdFilter}
        structureKpi={structureKpi}
        onNavigateToMembers={(membership) =>
          onNavigateToMembers(
            selectedDpdFilter === 'ALL' ? undefined : selectedDpdFilter,
            'Aktif',
            membership || 'ALL'
          )
        }
        onOpenStructureModal={(level) => handleOpenStructureModal(selectedDpdFilter, level)}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
      />

      {/* 4. Executive Leadership Answers (Menjawab Pertanyaan Pimpinan DPW: Daerah Lengkap vs Belum) */}
      <ExecutiveLeadershipAnswers
        members={members}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        onOpenStructureModal={handleOpenStructureModal}
      />

      {/* 5. Status Struktur Kepengurusan 15 Kab/Kota */}
      <StructureReadinessGrid
        members={members}
        onOpenStructureModal={(dpdName) => handleOpenStructureModal(dpdName, 'ALL')}
        onOpenAllStructureModal={() => handleOpenStructureModal('ALL', 'ALL')}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
      />

      {/* 6. Cadre-Driven Recruitment Analytics */}
      <RecruitmentAnalyticsSection
        growthAnalytics={growthAnalytics}
        growthPeriod={growthPeriod}
        setGrowthPeriod={setGrowthPeriod}
        pinnedDate={pinnedDate}
        setPinnedDate={setPinnedDate}
        filterRecruiter={filterRecruiter}
        setFilterRecruiter={setFilterRecruiter}
        growthViewTab={growthViewTab}
        setGrowthViewTab={setGrowthViewTab}
        expandedDpds={expandedDpds}
        toggleDpdAccordion={toggleDpdAccordion}
        expandedDpcs={expandedDpcs}
        toggleDpcAccordion={toggleDpcAccordion}
        openDrilldownModalWithFocus={openDrilldownModalWithFocus}
        handleLoadTestScenario={handleLoadTestScenario}
        session={session}
        selectedDpdFilter={selectedDpdFilter}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
        hasAddMembers={!!onAddMembers}
      />

      {/* 7. Operational Notes */}
      <ExecutiveOperationalNote />

      {/* 8. Modals */}
      <TerritorialGrowthModal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
        periodLabel={growthAnalytics.periodLabel}
        territorialTree={growthAnalytics.territorialTree}
        recruitersList={growthAnalytics.recruitersList}
        allFilteredMembers={growthAnalytics.filteredMembers}
        initialDpd={modalInitialDpd}
        initialDpc={modalInitialDpc}
        initialDprt={modalInitialDprt}
        initialRecruiter={modalInitialRecruiter}
        onOpenCardModal={onOpenCardModal}
      />

      <StructureDrilldownModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        members={members}
        session={
          session || {
            role: 'SUPER_ADMIN',
            dpdAccess: 'ALL',
            adminName: 'Admin',
            jabatan: 'DPW',
          }
        }
        initialFilter={structureModalFilter}
        onOpenTerritorialMatrix={onOpenTerritorialMatrix}
      />
    </div>
  );
};
export default ExecutiveDashboard;
