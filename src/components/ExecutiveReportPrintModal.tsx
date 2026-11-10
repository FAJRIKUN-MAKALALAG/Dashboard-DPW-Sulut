import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Member } from '../types';
import { getExpandedStructuralMembers } from '../utils/structureReadinessUtils';
import {
  getMembersFromApi as getMembersFromSupabase,
  isBackendConfigured as isSupabaseConfigured,
} from '../utils/backendClient';
import { loadMembers, saveMembers } from '../utils/storage';
import { useDebounce } from '../hooks/useDebounce';
import {
  exportMembersToExcel,
  exportMembersToCsv,
  exportDpdStatisticsToExcel,
  exportDpdStatisticsToCsv,
} from '../utils/excelUtils';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import {
  ExportScopeMode,
  ExecutiveReportPrintModalProps,
} from './executiveReport/executiveReportTypes';
import {
  getComputedDocTitle,
  getComputedDocSubtitle,
  detectSignatoriesForExecutiveReport,
  isRealEkta,
  isRealNik,
} from './executiveReport/executiveReportUtils';
import { useExecutiveReportData } from './executiveReport/useExecutiveReportData';
import { ExecutiveReportToolbar } from './executiveReport/ExecutiveReportToolbar';
import { ExecutiveReportScopeTabs } from './executiveReport/ExecutiveReportScopeTabs';
import { ExecutiveReportFilterBar } from './executiveReport/ExecutiveReportFilterBar';
import { ExecutiveReportSignatureSettings } from './executiveReport/ExecutiveReportSignatureSettings';
import { ExecutiveReportStatTable } from './executiveReport/ExecutiveReportStatTable';
import { ExecutiveReportNominativeTable } from './executiveReport/ExecutiveReportNominativeTable';
import { ExecutiveReportSignatureBlock } from './executiveReport/ExecutiveReportSignatureBlock';

export type { ExportScopeMode };

export const ExecutiveReportPrintModal: React.FC<ExecutiveReportPrintModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  initialDpd = 'ALL',
  initialReportType = 'STATISTICS',
  customSelectedMembers = null,
}) => {
  // Primary Scope Selector: DPW | DPD | DPC | DPRt | ALL_KADER | STATISTICS
  const [exportScope, setExportScope] = useState<ExportScopeMode>('DPD');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [useCustomSelectionOnly, setUseCustomSelectionOnly] = useState<boolean>(false);

  // Territorial Filters (Per Wilayah)
  const [filterDpd, setFilterDpd] = useState<string>(initialDpd);
  const [filterDpc, setFilterDpc] = useState<string>('ALL');
  const [filterDprt, setFilterDprt] = useState<string>('ALL');
  const [filterSubCouncil, setFilterSubCouncil] = useState<'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR'>('ALL');
  const [filterKaderType] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');
  const [filterStatus] = useState<string>('Aktif');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Grouping & Page-Break per Territory Options
  const [groupByTerritory, setGroupByTerritory] = useState<boolean>(true);
  const [pageBreakPerGroup, setPageBreakPerGroup] = useState<boolean>(false);

  // Signature Panel Toggle
  const [showSignaturePanel, setShowSignaturePanel] = useState<boolean>(false);

  const todayFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const [docCustomTitle, setDocCustomTitle] = useState<string>('');
  const [docNomorSurat] = useState<string>(
    `LAP-OKK/DPW-ND/SULUT/${new Date().getFullYear()}`
  );
  const [signCity, setSignCity] = useState<string>('Manado');
  const [signDate, setSignDate] = useState<string>(todayFormatted);
  const [signLayout, setSignLayout] = useState<'2_COL' | '3_COL' | '1_COL'>('2_COL');
  const [showStampBox, setShowStampBox] = useState<boolean>(false);

  // Signatory 1 (Left)
  const [leftPrefix, setLeftPrefix] = useState<string>('Mengetahui,');
  const [leftTitle, setLeftTitle] = useState<string>('SEKRETARIS DPW PARTAI NASDEM SULUT');
  const [leftName, setLeftName] = useState<string>('');
  const [leftId, setLeftId] = useState<string>('');

  // Signatory 2 (Right)
  const [rightTitle, setRightTitle] = useState<string>('KETUA DPW PARTAI NASDEM SULUT');
  const [rightName, setRightName] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  // Signatory 3 (Center)
  const [centerPrefix, setCenterPrefix] = useState<string>('Menyetujui,');
  const [centerTitle, setCenterTitle] = useState<string>('KOORDINATOR WILAYAH');
  const [centerName, setCenterName] = useState<string>('');
  const [centerId, setCenterId] = useState<string>('');

  const [isSignManuallyEdited, setIsSignManuallyEdited] = useState<boolean>(false);

  // Live members state
  const [liveMembers, setLiveMembers] = useState<Member[]>(members);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (members && members.length > 0) {
      setLiveMembers(members);
    }
  }, [members]);

  // Expanded structural members
  const expandedMembers = useMemo(
    () => getExpandedStructuralMembers(liveMembers),
    [liveMembers]
  );

  // Initialize scope & territory when modal opens
  useEffect(() => {
    if (isOpen) {
      if (customSelectedMembers && customSelectedMembers.length > 0) {
        setExportScope('ALL_KADER');
        setUseCustomSelectionOnly(true);
      } else {
        setUseCustomSelectionOnly(false);
        if (initialReportType === 'STATISTICS') {
          if (session?.role === 'ADMIN_DPRT') setExportScope('DPRt');
          else if (session?.role === 'ADMIN_DPC') setExportScope('DPC');
          else if (session?.role === 'ADMIN_DPD') setExportScope('DPD');
          else setExportScope('DPD');
        } else {
          setExportScope('ALL_KADER');
        }

        if (session && session.dpdAccess && session.dpdAccess !== 'ALL') {
          setFilterDpd(session.dpdAccess);
          if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)') {
            setFilterDpc(session.dpcAccess);
          }
          if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum') {
            setFilterDprt(session.dprtAccess);
          }
        } else if (initialDpd && initialDpd !== 'ALL') {
          setFilterDpd(initialDpd);
        }
      }
    }
  }, [isOpen, customSelectedMembers, initialReportType, session, initialDpd]);

  const refreshFromDatabase = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        const cloudMembers = await getMembersFromSupabase({ force: true });
        if (cloudMembers && cloudMembers.length > 0) {
          setLiveMembers(cloudMembers);
          saveMembers(cloudMembers);
        } else {
          const local = loadMembers();
          if (local && local.length > 0) setLiveMembers(local);
        }
      } else {
        const local = loadMembers();
        if (local && local.length > 0) setLiveMembers(local);
      }
    } catch {
      const local = loadMembers();
      if (local && local.length > 0) setLiveMembers(local);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (isOpen) {
      refreshFromDatabase();
    }
  }, [isOpen, refreshFromDatabase]);

  // Auto-detect signatories based on exportScope & territorial filters
  const autoDetectSignatories = useCallback(
    (forceReset = false) => {
      if (isSignManuallyEdited && !forceReset) return;

      const detected = detectSignatoriesForExecutiveReport(
        exportScope,
        filterDpd,
        filterDpc,
        filterDprt,
        expandedMembers
      );

      setSignCity(detected.city);
      setLeftTitle(detected.leftTitle);
      setRightTitle(detected.rightTitle);

      setRightName(detected.ketua?.namaLengkap || '');
      setRightId(
        detected.ketua
          ? isRealEkta(detected.ketua.nomorEKTA)
            ? `No. e-KTA: ${detected.ketua.nomorEKTA}`
            : isRealNik(detected.ketua.nik)
            ? `NIK: ${detected.ketua.nik}`
            : ''
          : ''
      );

      setLeftName(detected.sekretaris?.namaLengkap || '');
      setLeftId(
        detected.sekretaris
          ? isRealEkta(detected.sekretaris.nomorEKTA)
            ? `No. e-KTA: ${detected.sekretaris.nomorEKTA}`
            : isRealNik(detected.sekretaris.nik)
            ? `NIK: ${detected.sekretaris.nik}`
            : ''
          : ''
      );

      if (forceReset) {
        setIsSignManuallyEdited(false);
      }
    },
    [exportScope, filterDpd, filterDpc, filterDprt, expandedMembers, isSignManuallyEdited]
  );

  useEffect(() => {
    autoDetectSignatories(false);
  }, [autoDetectSignatories]);

  const {
    levelCounts,
    dpdOptionsWithCount,
    dpcOptionsWithCount,
    dprtOptionsWithCount,
    pengurusQuickPickList,
    dpdStats,
    selectedStatDpds,
    setSelectedStatDpds,
    printedDpdStats,
    grandTotal,
    nominativeMembers,
    printedNominativeMembers,
    groupedTerritorySections,
    uncheckedKeys,
    setUncheckedKeys,
    toggleMemberCheck,
    toggleGroupCheck,
  } = useExecutiveReportData({
    liveMembers,
    expandedMembers,
    exportScope,
    useCustomSelectionOnly,
    customSelectedMembers,
    filterDpd,
    filterDpc,
    filterDprt,
    filterSubCouncil,
    filterKaderType,
    filterStatus,
    debouncedSearchQuery,
    groupByTerritory,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (exportScope === 'STATISTICS') {
      exportDpdStatisticsToExcel(printedDpdStats, 'LAPORAN_STATISTIK_DPW_NASDEM_SULUT.xlsx');
    } else {
      const scopeName =
        exportScope === 'DPW'
          ? 'DPW_SULUT'
          : `${exportScope}_${filterDpd === 'ALL' ? 'SELURUH_SULUT' : filterDpd.replace(/\s+/g, '_')}`;
      exportMembersToExcel(
        printedNominativeMembers,
        `DATA_${scopeName}_${printedNominativeMembers.length}_ORANG.xlsx`
      );
    }
  };

  const handleExportCsv = () => {
    if (exportScope === 'STATISTICS') {
      exportDpdStatisticsToCsv(printedDpdStats, 'LAPORAN_STATISTIK_DPW_NASDEM_SULUT.csv');
    } else {
      const scopeName =
        exportScope === 'DPW'
          ? 'DPW_SULUT'
          : `${exportScope}_${filterDpd === 'ALL' ? 'SELURUH_SULUT' : filterDpd.replace(/\s+/g, '_')}`;
      exportMembersToCsv(
        printedNominativeMembers,
        `DATA_${scopeName}_${printedNominativeMembers.length}_ORANG.csv`
      );
    }
  };

  const computedDocTitle = getComputedDocTitle(
    docCustomTitle,
    exportScope,
    filterDpd,
    filterDpc,
    filterDprt
  );

  const computedDocSubtitle = getComputedDocSubtitle(
    exportScope,
    filterDpd,
    filterDpc,
    filterDprt,
    printedNominativeMembers.length
  );

  const modalContent = (
    <div className="print-portal-root fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col print:static print:block print:bg-white print:h-auto print:overflow-visible">
      <style>
        {`
          @media print {
            @page {
              size: A4 ${orientation};
              margin: 10mm 12mm;
            }
          }
        `}
      </style>

      {/* 1. TOP BAR WITH CONTROLS */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Actions */}
          <ExecutiveReportToolbar
            onRefresh={refreshFromDatabase}
            isRefreshing={isRefreshing}
            showSignaturePanel={showSignaturePanel}
            setShowSignaturePanel={setShowSignaturePanel}
            orientation={orientation}
            setOrientation={setOrientation}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onPrint={handlePrint}
            onClose={onClose}
            printDataCountText={
              exportScope === 'STATISTICS'
                ? `${printedDpdStats.length} DPD`
                : `${printedNominativeMembers.length} Data`
            }
          />

          {/* Row 2: Scope Tabs */}
          <ExecutiveReportScopeTabs
            exportScope={exportScope}
            onSelectScope={(scope) => {
              setUseCustomSelectionOnly(false);
              setExportScope(scope);
              if (scope === 'DPW') {
                setFilterDpd('ALL');
                setFilterDpc('ALL');
                setFilterDprt('ALL');
              } else if (scope === 'DPD') {
                setFilterDpc('ALL');
                setFilterDprt('ALL');
              } else if (scope === 'DPC') {
                setFilterDprt('ALL');
              }
            }}
            levelCounts={levelCounts}
            useCustomSelectionOnly={useCustomSelectionOnly}
            onToggleCustomSelectionOnly={() => {
              setExportScope('ALL_KADER');
              setUseCustomSelectionOnly((prev) => !prev);
            }}
            customSelectedMembers={customSelectedMembers}
          />

          {/* Row 3: Cascading Territory Filter Bar */}
          <ExecutiveReportFilterBar
            exportScope={exportScope}
            useCustomSelectionOnly={useCustomSelectionOnly}
            filterDpd={filterDpd}
            setFilterDpd={setFilterDpd}
            setFilterDpc={setFilterDpc}
            setFilterDprt={setFilterDprt}
            dpdOptionsWithCount={dpdOptionsWithCount}
            filterDpc={filterDpc}
            dpcOptionsWithCount={dpcOptionsWithCount}
            filterDprt={filterDprt}
            dprtOptionsWithCount={dprtOptionsWithCount}
            filterSubCouncil={filterSubCouncil}
            setFilterSubCouncil={setFilterSubCouncil}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            groupByTerritory={groupByTerritory}
            setGroupByTerritory={setGroupByTerritory}
            pageBreakPerGroup={pageBreakPerGroup}
            setPageBreakPerGroup={setPageBreakPerGroup}
            hasMultipleSections={groupedTerritorySections.length > 1}
          />

          {/* Signature Settings Panel */}
          <ExecutiveReportSignatureSettings
            showSignaturePanel={showSignaturePanel}
            showStampBox={showStampBox}
            setShowStampBox={setShowStampBox}
            onAutoDetectSignatories={autoDetectSignatories}
            docCustomTitle={docCustomTitle}
            setDocCustomTitle={setDocCustomTitle}
            computedDocTitle={computedDocTitle}
            signCity={signCity}
            setSignCity={setSignCity}
            signDate={signDate}
            setSignDate={setSignDate}
            signLayout={signLayout}
            setSignLayout={setSignLayout}
            setIsSignManuallyEdited={setIsSignManuallyEdited}
            pengurusQuickPickList={pengurusQuickPickList}
            leftTitle={leftTitle}
            setLeftTitle={setLeftTitle}
            leftName={leftName}
            setLeftName={setLeftName}
            leftId={leftId}
            setLeftId={setLeftId}
            rightTitle={rightTitle}
            setRightTitle={setRightTitle}
            rightName={rightName}
            setRightName={setRightName}
            rightId={rightId}
            setRightId={setRightId}
            centerTitle={centerTitle}
            setCenterTitle={setCenterTitle}
            centerName={centerName}
            setCenterName={setCenterName}
            centerId={centerId}
            setCenterId={setCenterId}
          />
        </div>
      </div>

      {/* 2. SCROLLABLE PRINTABLE DOCUMENT */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-5xl mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl p-5 sm:p-10 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none">
          {/* Formal Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 text-center sm:text-left print:text-left">
            <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5">
              <img
                src={nasdemLogo}
                alt="Logo Partai NasDem"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase">
                  {exportScope === 'DPD' && filterDpd !== 'ALL'
                    ? 'DEWAN PIMPINAN DAERAH'
                    : exportScope === 'DPC' && filterDpc !== 'ALL'
                    ? 'DEWAN PIMPINAN CABANG'
                    : exportScope === 'DPRt' && filterDprt !== 'ALL'
                    ? 'DEWAN PIMPINAN RANTING'
                    : 'DEWAN PIMPINAN WILAYAH'}
                </p>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                  PARTAI NASDEM{' '}
                  {exportScope === 'DPD' && filterDpd !== 'ALL'
                    ? filterDpd.toUpperCase()
                    : exportScope === 'DPC' && filterDpc !== 'ALL'
                    ? `KECAMATAN ${filterDpc.toUpperCase()}`
                    : exportScope === 'DPRt' && filterDprt !== 'ALL'
                    ? `DESA/KEL. ${filterDprt.toUpperCase()}`
                    : 'SULAWESI UTARA'}
                </h1>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  {filterDpd !== 'ALL'
                    ? `${filterDpd}${filterDpc !== 'ALL' ? ` • Kecamatan ${filterDpc}` : ''}${
                        filterDprt !== 'ALL' ? ` • Desa/Kel. ${filterDprt}` : ''
                      } — Provinsi Sulawesi Utara`
                    : 'Sekretariat DPW Partai NasDem Provinsi Sulawesi Utara — Kota Manado'}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right print:text-right font-mono text-[10px] text-slate-600 shrink-0">
              <div className="font-bold text-slate-900 uppercase">DOKUMEN RESMI ORGANISASI</div>
              <div>No: {docNomorSurat}</div>
              <div>Tanggal: {signDate}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-5">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 underline underline-offset-4">
              {computedDocTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-1">{computedDocSubtitle}</p>
          </div>

          {/* Table Content */}
          {exportScope === 'STATISTICS' ? (
            <ExecutiveReportStatTable
              dpdStats={dpdStats}
              selectedStatDpds={selectedStatDpds}
              setSelectedStatDpds={setSelectedStatDpds}
              printedDpdStats={printedDpdStats}
              grandTotal={grandTotal}
            />
          ) : (
            <ExecutiveReportNominativeTable
              exportScope={exportScope}
              nominativeMembers={nominativeMembers}
              printedNominativeMembers={printedNominativeMembers}
              groupedTerritorySections={groupedTerritorySections}
              uncheckedKeys={uncheckedKeys}
              onSelectAll={() => setUncheckedKeys(new Set())}
              onToggleMemberCheck={toggleMemberCheck}
              onToggleGroupCheck={toggleGroupCheck}
              groupByTerritory={groupByTerritory}
              pageBreakPerGroup={pageBreakPerGroup}
            />
          )}

          {/* Signatures Block */}
          <ExecutiveReportSignatureBlock
            signLayout={signLayout}
            leftPrefix={leftPrefix}
            setLeftPrefix={setLeftPrefix}
            leftTitle={leftTitle}
            setLeftTitle={setLeftTitle}
            leftName={leftName}
            setLeftName={setLeftName}
            leftId={leftId}
            setLeftId={setLeftId}
            showStampBox={showStampBox}
            signCity={signCity}
            setSignCity={setSignCity}
            signDate={signDate}
            setSignDate={setSignDate}
            rightTitle={rightTitle}
            setRightTitle={setRightTitle}
            rightName={rightName}
            setRightName={setRightName}
            rightId={rightId}
            setRightId={setRightId}
            centerPrefix={centerPrefix}
            setCenterPrefix={setCenterPrefix}
            centerTitle={centerTitle}
            setCenterTitle={setCenterTitle}
            centerName={centerName}
            setCenterName={setCenterName}
            centerId={centerId}
            setCenterId={setCenterId}
            setIsSignManuallyEdited={setIsSignManuallyEdited}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExecutiveReportPrintModal;
