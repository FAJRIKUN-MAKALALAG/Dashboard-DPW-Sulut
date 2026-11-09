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
  saveDeletedSlotKeys,
  computeDeletedSlotKeysFromRows,
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
import { isBackendConfigured } from '../config/api';
import { getToken, StructureSlotService } from '../services';

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
  const buildMatrixRows = (
    currentDeletedKeys?: Set<string>,
    forceReset: boolean = false
  ): GridRowItem[] => {
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
    return result.gridRows;
  };

  useEffect(() => {
    let isCancelled = false;
    const storedDeletedKeys = getStoredDeletedSlotKeys(territoryKey);

    // Jika cache memori sudah ada untuk wilayah ini, gunakan deletedKeys dari cache sejak awal
    // agar tidak terjadi render ganda saat berpindah tab
    const cachedRes = StructureSlotService.getCachedTerritorySlots(
      level,
      selectedDpd,
      selectedDpc,
      selectedDprt
    );
    const initialDeletedKeys =
      cachedRes?.slots && cachedRes.slots.length > 0
        ? computeDeletedSlotKeysFromRows(level, cachedRes.slots)
        : storedDeletedKeys;

    const localRows = buildMatrixRows(initialDeletedKeys);
    setIsEditMode(false);
    setSaveSuccessMsg(null);
    setDeletedMemberNiks([]);

    if (isBackendConfigured() && getToken() && !cachedRes) {
      StructureSlotService.fetchTerritorySlots(level, selectedDpd, selectedDpc, selectedDprt)
        .then((res) => {
          if (isCancelled || !res?.slots || res.slots.length === 0) return;

          const dbDeletedKeys = computeDeletedSlotKeysFromRows(level, res.slots);
          const localFilled = localRows.filter((r) => r.namaLengkap.trim() !== '').length;
          const dbFilled = res.slots.filter((r) => r.namaLengkap.trim() !== '').length;

          // Kasus A: Jika di browser ini pernah ada penghapusan slot lowong yang belum sempat
          // tersimpan ke DB (misal karena koneksi/error sebelumnya), dorong ke DB sekarang.
          if (storedDeletedKeys.size > 0 && dbDeletedKeys.size === 0) {
            StructureSlotService.syncTerritorySlots(
              level,
              selectedDpd,
              selectedDpc,
              selectedDprt,
              localRows
            ).catch(() => {});
            return;
          }

          // Kasus B: Tabel `structure_slots` di PostgreSQL adalah Sumber Kebenaran Utama lintas akun.
          // Hanya lakukan rebuild matriks jika daftar slot yang dihapus di DB berbeda dengan state saat ini!
          const isDifferent =
            dbDeletedKeys.size !== initialDeletedKeys.size ||
            Array.from(dbDeletedKeys).some((k) => !initialDeletedKeys.has(k));

          saveDeletedSlotKeys(territoryKey, dbDeletedKeys);
          const finalRows = isDifferent ? buildMatrixRows(dbDeletedKeys) : localRows;

          // Jika di DB belum tercatat pengurus yang sudah ada di wilayah ini, sinkronkan ke DB
          if (localFilled > dbFilled) {
            StructureSlotService.syncTerritorySlots(
              level,
              selectedDpd,
              selectedDpc,
              selectedDprt,
              finalRows
            ).catch(() => {});
          }
        })
        .catch(() => {
          // Gunakan hasil buildMatrixRows lokal jika backend belum merespons
        });
    }

    return () => {
      isCancelled = true;
    };
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
    const targetRow = gridRows.find((r) => r.id === id);
    const isTargetFilled = Boolean(
      targetRow &&
        targetRow.namaLengkap &&
        targetRow.namaLengkap.trim() !== '' &&
        targetRow.namaLengkap !== '-'
    );
    const { updatedRows, deletedNik } = deleteMatrixRow(
      gridRows,
      id,
      territoryKey,
      matrixStorageKey
    );
    const updatedDeletedKeys = computeDeletedSlotKeysFromRows(level, updatedRows);
    saveDeletedSlotKeys(territoryKey, updatedDeletedKeys);
    setGridRows(updatedRows);

    if (deletedNik) {
      setDeletedMemberNiks((curr) => [...curr, deletedNik]);
      setIsEditMode(true);
    } else if (!isTargetFilled) {
      // Jika menghapus slot jabatan yang memang sedang lowong (belum terisi),
      // langsung perbarui ke database structure_slots tanpa harus masuk mode edit
      if (isBackendConfigured() && getToken()) {
        StructureSlotService.syncTerritorySlots(
          level,
          selectedDpd,
          selectedDpc,
          selectedDprt,
          updatedRows
        ).catch(() => {});
      }
      setSaveSuccessMsg('Slot jabatan lowong berhasil dihapus dari matriks!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      setIsEditMode(true);
    }
  };

  const handleDeleteSelectedRows = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    const { updatedRows, niksToDelete } = deleteSelectedMatrixRows(
      gridRows,
      selectedIds,
      matrixStorageKey,
      territoryKey
    );
    const updatedDeletedKeys = computeDeletedSlotKeysFromRows(level, updatedRows);
    saveDeletedSlotKeys(territoryKey, updatedDeletedKeys);
    setGridRows(updatedRows);

    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      const territoryLabel =
        level === 'DPW'
          ? 'DPW Sulawesi Utara'
          : level === 'DPD'
          ? `DPD ${selectedDpd}`
          : level === 'DPC'
          ? `DPC ${selectedDpc} (${selectedDpd})`
          : `DPRt ${selectedDprt} (${selectedDpc})`;
      onDeleteMembersBatch(niksToDelete, territoryLabel);
    }

    if (isBackendConfigured() && getToken()) {
      StructureSlotService.syncTerritorySlots(
        level,
        selectedDpd,
        selectedDpc,
        selectedDprt,
        updatedRows
      ).catch(() => {});
    }

    setSaveSuccessMsg(`Berhasil menghapus data pengurus terpilih dari matriks & database!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
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
      if (isBackendConfigured() && getToken()) {
        StructureSlotService.resetTerritorySlots(level, selectedDpd, selectedDpc, selectedDprt).catch(
          (err) => console.warn('Gagal mereset structure_slots di database:', err)
        );
      }
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
    if (isBackendConfigured() && getToken()) {
      StructureSlotService.syncTerritorySlots(
        level,
        selectedDpd,
        selectedDpc,
        selectedDprt,
        updatedGridRows
      ).catch((err) => console.warn('Gagal menyinkronkan structure_slots ke database:', err));
    }
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
