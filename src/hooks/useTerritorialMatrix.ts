import { useState, useMemo, useEffect } from 'react';
import { Member } from '../types';
import { useDebounce } from './useDebounce';
import { useDialog } from '../components/ui/AppDialogProvider';
import { GridRowItem } from '../components/matrix';
import { UseTerritorialMatrixProps } from './territorial/matrixTypes';
import {
  getTerritoryStorageKeys,
  getStoredDeletedSlotKeys,
  saveCustomMatrixRows,
} from './territorial/matrixStorage';
import { calculateDpdPimpinanCompliance } from './territorial/matrixCompliance';
import { buildTerritorialMatrixGridRows } from './territorial/matrixRowBuilder';
import {
  applyCellChange,
  addNewMatrixRow,
  insertMatrixRow,
  deleteMatrixRow,
  deleteSelectedMatrixRows,
} from './territorial/matrixMutations';
import {
  prepareDatabaseSavePayload,
  exportMatrixToExcel,
  getTerritoryOfficialTitle,
} from './territorial/matrixPersistence';

export type { UseTerritorialMatrixProps };

export function useTerritorialMatrix({
  level,
  members,
  selectedDpd,
  selectedDpc,
  selectedDprt,
  session,
  onSaveMembersBatch,
  onDeleteMembersBatch,
}: UseTerritorialMatrixProps) {
  const { showConfirm } = useDialog();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'empty'>('all');
  const [gridRows, setGridRows] = useState<GridRowItem[]>([]);
  const [rawTerritoryMembers, setRawTerritoryMembers] = useState<Member[]>([]);
  const [deletedMemberNiks, setDeletedMemberNiks] = useState<string[]>([]);
  const [showVacantModal, setShowVacantModal] = useState<boolean>(false);

  // Kepatuhan formasi jabatan DPD Bagian A (Dewan Pimpinan Daerah)
  const dpdPimpinanCompliance = useMemo(() => {
    return calculateDpdPimpinanCompliance(level, selectedDpd, gridRows);
  }, [level, gridRows, selectedDpd]);

  // Local storage keys per territory
  const { territoryKey, matrixStorageKey } = useMemo(() => {
    return getTerritoryStorageKeys(level, selectedDpd, selectedDpc, selectedDprt);
  }, [level, selectedDpd, selectedDpc, selectedDprt]);

  // Build matrix whenever territory changes or members change
  const buildMatrixRows = (currentDeletedKeys?: Set<string>, forceReset: boolean = false) => {
    const deletedKeys = currentDeletedKeys || getStoredDeletedSlotKeys(territoryKey);
    const result = buildTerritorialMatrixGridRows({
      level,
      members,
      selectedDpd,
      selectedDpc,
      selectedDprt,
      matrixStorageKey,
      territoryKey,
      deletedKeys,
      deletedMemberNiks,
      forceReset,
    });
    setGridRows(result.gridRows);
    setRawTerritoryMembers(result.rawTerritoryMembers);
  };

  useEffect(() => {
    buildMatrixRows();
    setIsEditMode(false);
    setSaveSuccessMsg(null);
    setDeletedMemberNiks([]);
  }, [level, selectedDpd, selectedDpc, selectedDprt, members]);

  const handleCellChange = (id: string, field: keyof GridRowItem, value: string) => {
    setGridRows((prev) => applyCellChange(prev, id, field, value, matrixStorageKey));
  };

  const handleAddNewRow = (targetSubOrg?: string) => {
    setGridRows((prev) => addNewMatrixRow(prev, level, matrixStorageKey, targetSubOrg));
    setIsEditMode(true);
  };

  const handleInsertRow = (targetId: string, position: 'above' | 'below' = 'below') => {
    setGridRows((prev) => {
      const updated = insertMatrixRow(prev, targetId, level, matrixStorageKey, position);
      return updated || prev;
    });
    setIsEditMode(true);
  };

  const handleDeleteRow = (id: string) => {
    setGridRows((prev) => {
      const { updatedRows, deletedNik } = deleteMatrixRow(prev, id, territoryKey, matrixStorageKey);
      if (deletedNik) {
        setDeletedMemberNiks((curr) => [...curr, deletedNik]);
      }
      return updatedRows;
    });
    setIsEditMode(true);
  };

  const handleDeleteSelectedRows = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    setGridRows((prev) => {
      const { updatedRows, niksToDelete } = deleteSelectedMatrixRows(prev, selectedIds, matrixStorageKey);
      if (niksToDelete.length > 0 && onDeleteMembersBatch) {
        const territoryLabel = level === 'DPW' ? 'DPW Sulawesi Utara' : `${level} ${selectedDpd}`;
        onDeleteMembersBatch(niksToDelete, territoryLabel);
      }
      setSaveSuccessMsg(`Berhasil hard delete ${niksToDelete.length} data pengurus dari database!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      return updatedRows;
    });
  };

  const handleResetTemplate = async () => {
    const territoryLabel =
      level === 'DPW'
        ? 'DPW Provinsi Sulawesi Utara'
        : level === 'DPD'
        ? `DPD ${selectedDpd}`
        : level === 'DPC'
        ? `DPC Kec. ${selectedDpc} · ${selectedDpd}`
        : `DPRt ${selectedDprt} · Kec. ${selectedDpc}`;

    const confirmed = await showConfirm({
      variant: 'warning',
      title: 'Pulihkan Template Standar',
      message:
        'Pulihkan seluruh susunan baris jabatan matriks pada wilayah ini kembali ke template standar resmi?',
      detail: territoryLabel,
      confirmText: 'Pulihkan Template',
      cancelText: 'Batal',
    });

    if (confirmed) {
      try {
        localStorage.removeItem(territoryKey);
        localStorage.removeItem(matrixStorageKey);
      } catch (e) {
        console.warn(e);
      }
      buildMatrixRows(new Set<string>(), true);
      setSaveSuccessMsg('Template standar berhasil dipulihkan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleSaveToDatabase = () => {
    const { updatedMembersList, updatedGridRows, niksToDelete } = prepareDatabaseSavePayload({
      gridRows,
      members,
      level,
      selectedDpd,
      selectedDpc,
      selectedDprt,
      session,
    });

    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      const territoryDpd = level === 'DPW' ? 'Sulawesi Utara' : selectedDpd;
      onDeleteMembersBatch(niksToDelete, `${level} ${territoryDpd}`);
    }

    onSaveMembersBatch(updatedMembersList, niksToDelete);
    setGridRows(updatedGridRows);
    saveCustomMatrixRows(matrixStorageKey, updatedGridRows);
    setSaveSuccessMsg(
      `Berhasil menyimpan perubahan ${updatedMembersList.length} data pengurus ke database!`
    );
    setIsEditMode(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleExportTemplateExcel = () => {
    exportMatrixToExcel(gridRows, level, selectedDpd, selectedDpc, selectedDprt);
  };

  const totalRows = gridRows.length;
  const filledCount = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const emptyCount = totalRows - filledCount;
  const completionPercentage = totalRows > 0 ? Math.round((filledCount / totalRows) * 100) : 0;

  const displayRows = useMemo(() => {
    return gridRows.filter((r) => {
      const isFilled = r.namaLengkap.trim() !== '';
      if (statusFilter === 'filled' && !isFilled) return false;
      if (statusFilter === 'empty' && isFilled) return false;

      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const matches =
          r.jabatan.toLowerCase().includes(q) ||
          r.namaLengkap.toLowerCase().includes(q) ||
          r.nik.toLowerCase().includes(q) ||
          r.nomorEKTA.toLowerCase().includes(q) ||
          r.subOrg.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [gridRows, statusFilter, debouncedSearchQuery]);

  const getOfficialTitle = () => {
    return getTerritoryOfficialTitle(level, selectedDpd, selectedDpc, selectedDprt);
  };

  return {
    isEditMode,
    setIsEditMode,
    saveSuccessMsg,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    gridRows,
    setGridRows,
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
  };
}
