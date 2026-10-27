import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import { MatrixTableSheet, RawSourceStructureTable, StructureComparisonTable } from './matrix';
import {
  downloadTerritorialExcelTemplate,
  downloadAdvisoryOnlyExcelTemplate,
  downloadExpertOnlyExcelTemplate,
  TerritoryContext,
} from '../utils/territorialExcelTemplateUtils';
import {
  TerritorialImportExportModal,
  TerritorialStructurePrintModal,
  TerritorySelectorBar,
  TerritoryComplianceBanner,
  TerritoryToolbar,
} from './territorial';
import { useTerritorialMatrix } from '../hooks/useTerritorialMatrix';
import { ShieldAlert, LayoutGrid, FileSpreadsheet, ArrowLeftRight } from 'lucide-react';

interface TerritorialStructurePageProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[]) => void;
  onDeleteMembersBatch?: (niksToDelete: string[], territoryLabel: string) => void;
  initialDpd?: string;
  initialDpc?: string;
  initialDprt?: string;
  onOpenCardModal?: (member: Member) => void;
  onOpenDetailModal?: (member: Member) => void;
  onBackToDashboard?: () => void;
  onRefreshCloud?: () => Promise<void> | void;
  isRefreshingCloud?: boolean;
}

export const TerritorialStructurePage: React.FC<TerritorialStructurePageProps> = ({
  level,
  members,
  session,
  onSaveMembersBatch,
  onDeleteMembersBatch,
  initialDpd,
  initialDpc,
  initialDprt,
  onBackToDashboard,
  onRefreshCloud,
  isRefreshingCloud = false,
}) => {
  const canAccessDpw = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW';

  // Available regions scoped to session role & territory
  const availableRegions = useMemo(() => {
    if (!session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return SULUT_REGIONS;
    }
    if (session.dpdAccess && session.dpdAccess !== 'ALL') {
      const filtered = SULUT_REGIONS.filter((r) => isDpdMatch(r.name, session.dpdAccess));
      return filtered.length > 0 ? filtered : SULUT_REGIONS;
    }
    return SULUT_REGIONS;
  }, [session]);

  // Territory Selector State
  const [selectedDpd, setSelectedDpd] = useState<string>(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW') {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') return session.dpdAccess;
    }
    if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') return initialDpd;
    try {
      const saved = localStorage.getItem(`nasdem_selected_dpd_${level}`);
      if (saved && availableRegions.some((r) => isDpdMatch(r.name, saved))) {
        return saved;
      }
    } catch (e) {
      console.warn(e);
    }
    return availableRegions[0]?.name || 'Kabupaten Minahasa Selatan';
  });

  useEffect(() => {
    if (selectedDpd) {
      try {
        localStorage.setItem(`nasdem_selected_dpd_${level}`, selectedDpd);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [level, selectedDpd]);

  const currentRegion = useMemo(() => {
    return (
      availableRegions.find((r) => isDpdMatch(r.name, selectedDpd)) ||
      availableRegions[0] ||
      SULUT_REGIONS[0]
    );
  }, [availableRegions, selectedDpd]);

  // Subdistricts scoped to session role & territory
  const availableSubdistricts = useMemo(() => {
    const subs = currentRegion?.subdistricts || [];
    if (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') {
      if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)') {
        const filtered = subs.filter((s) => isDpcMatch(s.name, session.dpcAccess));
        return filtered.length > 0 ? filtered : subs;
      }
    }
    return subs;
  }, [currentRegion, session]);

  const [selectedDpc, setSelectedDpc] = useState<string>(() => {
    if (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') {
      if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)')
        return session.dpcAccess;
    }
    if (initialDpc && initialDpc !== 'ALL' && initialDpc !== 'Umum (DPD)') return initialDpc;
    return availableSubdistricts[0]?.name || currentRegion?.subdistricts[0]?.name || 'TUMPAAN';
  });

  const currentSubdistrict = useMemo(() => {
    return (
      availableSubdistricts.find((s) => isDpcMatch(s.name, selectedDpc)) ||
      availableSubdistricts[0] ||
      currentRegion?.subdistricts[0]
    );
  }, [availableSubdistricts, currentRegion, selectedDpc]);

  // Villages scoped to session role & territory
  const availableVillages = useMemo(() => {
    const vils = currentSubdistrict?.villages || [];
    if (session?.role === 'ADMIN_DPRT') {
      if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum') {
        const filtered = vils.filter((v) => isDprtMatch(v, session.dprtAccess));
        return filtered.length > 0 ? filtered : vils;
      }
    }
    return vils;
  }, [currentSubdistrict, session]);

  const [selectedDprt, setSelectedDprt] = useState<string>(() => {
    if (session?.role === 'ADMIN_DPRT') {
      if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum')
        return session.dprtAccess;
    }
    if (initialDprt && initialDprt !== 'ALL' && initialDprt !== 'Pusat/Umum') return initialDprt;
    return availableVillages[0] || currentSubdistrict?.villages[0] || 'Pusat';
  });

  // Keep territory in sync if initial props change or session territory updates
  useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW') {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') {
        const matched = availableRegions.find((r) => isDpdMatch(r.name, session.dpdAccess));
        if (matched) setSelectedDpd(matched.name);
      }
      if (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') {
        if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)') {
          setSelectedDpc(session.dpcAccess);
        }
      }
      if (session.role === 'ADMIN_DPRT') {
        if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum') {
          setSelectedDprt(session.dprtAccess);
        }
      }
    } else {
      if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') {
        setSelectedDpd(initialDpd);
      }
      if (initialDpc && initialDpc !== 'ALL' && initialDpc !== 'Umum (DPD)') {
        setSelectedDpc(initialDpc);
      }
      if (initialDprt && initialDprt !== 'ALL' && initialDprt !== 'Pusat/Umum') {
        setSelectedDprt(initialDprt);
      }
    }
  }, [initialDpd, initialDpc, initialDprt, session, availableRegions]);

  // Modal Import Excel Teritorial & Modal Cetak Dokumen
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Hook for matrix calculations and actions
  const {
    isEditMode,
    setIsEditMode,
    saveSuccessMsg,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    gridRows,
    rawTerritoryMembers,
    showVacantModal,
    setShowVacantModal,
    dpdPimpinanCompliance,
    totalRows,
    filledCount,
    emptyCount,
    completionPercentage,
    displayRows,
    getOfficialTitle,
    buildMatrixRows,
    handleCellChange,
    handleAddNewRow,
    handleInsertRow,
    handleDeleteRow,
    handleDeleteSelectedRows,
    handleResetTemplate,
    handleSaveToDatabase,
    handleExportTemplateExcel,
  } = useTerritorialMatrix({
    level,
    members,
    selectedDpd,
    selectedDpc,
    selectedDprt,
    session,
    onSaveMembersBatch,
    onDeleteMembersBatch,
  });

  // Mode Tampilan: Matriks Template vs Data Asli Berkas SK vs Komparasi
  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'raw_excel' | 'comparison'>('matrix');

  // Territory Context untuk Template Excel dan Import
  const territoryContext: TerritoryContext = useMemo(
    () => ({
      level,
      dpd: level === 'DPW' ? 'Sulawesi Utara' : selectedDpd,
      dpc:
        level === 'DPC' || level === 'DPRt'
          ? selectedDpc
          : level === 'DPW'
          ? 'Wilayah DPW'
          : 'Umum (DPD)',
      dprt: level === 'DPRt' ? selectedDprt : 'Pusat/Umum',
    }),
    [level, selectedDpd, selectedDpc, selectedDprt]
  );

  // Restriksi Akses: Level DPW HANYA untuk Super Admin dan Admin DPW
  if (level === 'DPW' && !canAccessDpw) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-xl mx-auto shadow-sm my-12 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold border border-rose-200 dark:border-rose-800 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Akses Terbatas: Struktur Tingkat DPW
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Susunan Pengurus Tingkat Wilayah (DPW) Provinsi Sulawesi Utara hanya dapat diakses oleh Admin DPW dan Super Administrator.
        </p>
        <div className="mt-4 inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          Hak Akses Anda: <strong>{session?.jabatan || session?.role}</strong> ({session?.dpdAccess})
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Banner & Territory Controls */}
      <TerritorySelectorBar
        level={level}
        selectedDpd={selectedDpd}
        setSelectedDpd={setSelectedDpd}
        selectedDpc={selectedDpc}
        setSelectedDpc={setSelectedDpc}
        selectedDprt={selectedDprt}
        setSelectedDprt={setSelectedDprt}
        availableRegions={availableRegions}
        availableSubdistricts={availableSubdistricts}
        availableVillages={availableVillages}
        completionPercentage={completionPercentage}
        filledCount={filledCount}
        emptyCount={emptyCount}
        totalRows={totalRows}
        onBackToDashboard={onBackToDashboard}
      />

      {/* 2. Banner Kepatuhan Formasi DPD Bagian A (Dewan Pimpinan Daerah - 36 Jabatan Baku) */}
      <TerritoryComplianceBanner
        level={level}
        selectedDpd={selectedDpd}
        dpdPimpinanCompliance={dpdPimpinanCompliance}
        showVacantModal={showVacantModal}
        setShowVacantModal={setShowVacantModal}
        onOpenEditMode={() => setIsEditMode(true)}
      />

      {/* 3. Interactive Toolbar & Controls */}
      <TerritoryToolbar
        level={level}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalRows={totalRows}
        filledCount={filledCount}
        emptyCount={emptyCount}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        saveSuccessMsg={saveSuccessMsg}
        onAddNewRow={() => handleAddNewRow()}
        onSaveToDatabase={handleSaveToDatabase}
        onResetTemplate={handleResetTemplate}
        onCancelEdit={() => {
          buildMatrixRows();
          setIsEditMode(false);
        }}
        onDownloadTemplateExcel={() => downloadTerritorialExcelTemplate(territoryContext, gridRows)}
        onDownloadAdvisoryOnly={() => downloadAdvisoryOnlyExcelTemplate(territoryContext, gridRows)}
        onDownloadExpertOnly={() => downloadExpertOnlyExcelTemplate(territoryContext, gridRows)}
        onRefreshCloud={onRefreshCloud}
        isRefreshingCloud={isRefreshingCloud}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onExportTemplateExcel={handleExportTemplateExcel}
      />

      {/* 4. Mode Tampilan: Matriks Template vs Data Asli SK / Excel vs Komparasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveViewMode('matrix')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all shrink-0 ${
              activeViewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Matriks Standar Template</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeViewMode === 'matrix'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {filledCount}/{totalRows}
            </span>
          </button>

          <button
            onClick={() => setActiveViewMode('raw_excel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all shrink-0 ${
              activeViewMode === 'raw_excel'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Data Asli Berkas SK / Excel</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeViewMode === 'raw_excel'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {rawTerritoryMembers.length} Personil
            </span>
          </button>

          <button
            onClick={() => setActiveViewMode('comparison')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all shrink-0 ${
              activeViewMode === 'comparison'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Komparasi Matriks vs SK</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block px-2">
          {activeViewMode === 'matrix' && 'Menampilkan formasi baku template matriks resmi partai dengan status keterisian.'}
          {activeViewMode === 'raw_excel' && 'Menampilkan daftar personil murni sesuai SK tanpa slot lowong template.'}
          {activeViewMode === 'comparison' && 'Audit perbandingan 1-to-1 antara slot baku matriks dengan data berkas SK.'}
        </div>
      </div>

      {/* Render Active View Component */}
      {activeViewMode === 'matrix' && (
        <div
          key={`${level}-${selectedDpd}-${selectedDpc}-${selectedDprt}-matrix`}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden animate-tab-enter"
        >
          <MatrixTableSheet
            gridRows={displayRows}
            isEditMode={isEditMode}
            officialTitle={getOfficialTitle()}
            onCellChange={handleCellChange}
            onDeleteRow={handleDeleteRow}
            onDeleteSelectedRows={handleDeleteSelectedRows}
            onAddNewRowForSubOrg={handleAddNewRow}
            onInsertRow={handleInsertRow}
          />
        </div>
      )}

      {activeViewMode === 'raw_excel' && (
        <div
          key={`${level}-${selectedDpd}-${selectedDpc}-${selectedDprt}-raw`}
          className="animate-tab-enter"
        >
          <RawSourceStructureTable
            members={rawTerritoryMembers}
            level={level}
            selectedDpd={selectedDpd}
            selectedDpc={selectedDpc}
            selectedDprt={selectedDprt}
            officialTitle={getOfficialTitle()}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {activeViewMode === 'comparison' && (
        <div
          key={`${level}-${selectedDpd}-${selectedDpc}-${selectedDprt}-comparison`}
          className="animate-tab-enter"
        >
          <StructureComparisonTable
            gridRows={displayRows}
            rawMembers={rawTerritoryMembers}
            level={level}
            selectedDpd={selectedDpd}
            officialTitle={getOfficialTitle()}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* 5. Modal Import / Export Excel Teritorial Khusus */}
      <TerritorialImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        territoryContext={territoryContext}
        currentRows={gridRows}
        currentMembers={members}
        session={session}
        onSaveMembersBatch={onSaveMembersBatch}
        onDeleteMembersBatch={onDeleteMembersBatch}
        onSuccessRefresh={() => {
          buildMatrixRows(undefined, true);
        }}
      />

      {/* 6. Modal Cetak Dokumen Resmi Susunan Pengurus */}
      <TerritorialStructurePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        level={level}
        dpd={selectedDpd}
        dpc={selectedDpc}
        dprt={selectedDprt}
        gridRows={gridRows}
        session={session}
      />
    </div>
  );
};

export default TerritorialStructurePage;
