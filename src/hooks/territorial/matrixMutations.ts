import { GridRowItem } from '../../components/matrix';
import { isDefinitiveLeader } from '../../utils/jobMatchingUtils';
import { getSlotKey, getStoredDeletedSlotKeys, saveDeletedSlotKeys, saveCustomMatrixRows } from './matrixStorage';

export function applyCellChange(
  gridRows: GridRowItem[],
  id: string,
  field: keyof GridRowItem,
  value: string,
  matrixStorageKey: string
): GridRowItem[] {
  const updated = gridRows.map((row) => (row.id === id ? { ...row, [field]: value } : row));
  saveCustomMatrixRows(matrixStorageKey, updated);
  return updated;
}

export function addNewMatrixRow(
  gridRows: GridRowItem[],
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  matrixStorageKey: string,
  targetSubOrg?: string
): GridRowItem[] {
  const defaultSubOrg =
    targetSubOrg ||
    (level === 'DPD'
      ? 'III. DEWAN PIMPINAN DAERAH'
      : level === 'DPC'
      ? 'III. DEWAN PIMPINAN CABANG'
      : level === 'DPW'
      ? 'DEWAN PIMPINAN WILAYAH'
      : 'DEWAN PIMPINAN RANTING');

  const newId = `new_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newRow: GridRowItem = {
    id: newId,
    no: gridRows.filter((r) => r.subOrg === defaultSubOrg).length + 1,
    subOrg: defaultSubOrg,
    jabatan: defaultSubOrg.includes('PERTIMBANGAN')
      ? 'Anggota Dewan Pertimbangan'
      : defaultSubOrg.includes('PAKAR')
      ? 'Anggota Dewan Pakar'
      : level === 'DPRt'
      ? 'Pengurus Ranting'
      : 'Wakil Ketua Bidang ...',
    namaLengkap: '',
    nik: '',
    nomorEKTA: '',
    email: '',
    nomorHP: '',
    sosmed: '',
    isExisting: false,
  };

  let lastIdxOfSubOrg = -1;
  for (let i = gridRows.length - 1; i >= 0; i--) {
    if (gridRows[i].subOrg === defaultSubOrg) {
      lastIdxOfSubOrg = i;
      break;
    }
  }
  const updated = [...gridRows];
  if (lastIdxOfSubOrg !== -1) {
    updated.splice(lastIdxOfSubOrg + 1, 0, newRow);
  } else {
    updated.push(newRow);
  }

  const counters = new Map<string, number>();
  const normalized = updated.map((r) => {
    const currentCount = (counters.get(r.subOrg) || 0) + 1;
    counters.set(r.subOrg, currentCount);
    return { ...r, no: currentCount };
  });
  saveCustomMatrixRows(matrixStorageKey, normalized);
  return normalized;
}

export function insertMatrixRow(
  gridRows: GridRowItem[],
  targetId: string,
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  matrixStorageKey: string,
  position: 'above' | 'below' = 'below'
): GridRowItem[] | null {
  const targetIndex = gridRows.findIndex((r) => r.id === targetId);
  if (targetIndex === -1) return null;

  const targetRow = gridRows[targetIndex];
  let insertIndex = position === 'below' ? targetIndex + 1 : targetIndex;

  // JANGAN PERNAH menyisipkan baris di atas Ketua definitif (#1)
  if (position === 'above' && isDefinitiveLeader(targetRow.jabatan)) {
    insertIndex = targetIndex + 1;
  }

  const newId = `custom_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let defaultJabatan = 'Wakil Ketua Bidang ...';
  if (targetRow.subOrg.includes('PERTIMBANGAN')) {
    defaultJabatan = 'Anggota Dewan Pertimbangan';
  } else if (targetRow.subOrg.includes('PAKAR')) {
    defaultJabatan = 'Anggota Dewan Pakar';
  } else if (level === 'DPRt') {
    defaultJabatan = 'Pengurus Ranting';
  } else if (targetRow.jabatan.toLowerCase().includes('sekretaris')) {
    defaultJabatan = 'Wakil Sekretaris Bidang ...';
  } else if (targetRow.jabatan.toLowerCase().includes('bendahara')) {
    defaultJabatan = 'Wakil Bendahara ...';
  } else if (targetRow.jabatan.toLowerCase().includes('wakil ketua')) {
    defaultJabatan = 'Wakil Ketua Bidang ...';
  }

  const newRow: GridRowItem = {
    id: newId,
    no: targetRow.no + (position === 'below' ? 1 : 0),
    subOrg: targetRow.subOrg,
    jabatan: defaultJabatan,
    namaLengkap: '',
    nik: '',
    nomorEKTA: '',
    email: '',
    nomorHP: '',
    sosmed: '',
    isExisting: false,
  };

  const updated = [...gridRows];
  updated.splice(insertIndex, 0, newRow);

  const counters = new Map<string, number>();
  const normalized = updated.map((r) => {
    const currentCount = (counters.get(r.subOrg) || 0) + 1;
    counters.set(r.subOrg, currentCount);
    return {
      ...r,
      no: currentCount,
    };
  });
  saveCustomMatrixRows(matrixStorageKey, normalized);
  return normalized;
}

export function deleteMatrixRow(
  gridRows: GridRowItem[],
  id: string,
  territoryKey: string,
  matrixStorageKey: string
): { updatedRows: GridRowItem[]; deletedNik?: string } {
  const targetRow = gridRows.find((r) => r.id === id);
  if (!targetRow) return { updatedRows: gridRows };

  const isCustomRow = targetRow.id.startsWith('custom_row_') || targetRow.id.startsWith('new_row_');
  const isFilled = Boolean(targetRow.namaLengkap && targetRow.namaLengkap.trim() !== '' && targetRow.namaLengkap !== '-');

  // 1. Jika baris ini adalah jabatan baku template yang terisi nama anggota
  // -> Kosongkan data kader di slot ini sehingga menjadi 'Lowong / Belum Terisi'
  if (!isCustomRow && isFilled) {
    const deletedNik = targetRow.nik && !targetRow.id.startsWith('empty_') ? targetRow.nik : undefined;

    const updated = gridRows.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          fotoProfilUrl: '',
          isExisting: false,
          originalNik: r.originalNik || r.nik || undefined,
        };
      }
      return r;
    });
    saveCustomMatrixRows(matrixStorageKey, updated);
    return { updatedRows: updated, deletedNik };
  }

  // 2. Jika baris ini adalah baris kustom (hasil tambah/sisip) ATAU slot kosong yang ingin dihilangkan
  const deletedNik = targetRow.nik && !targetRow.id.startsWith('empty_') ? targetRow.nik : undefined;

  const deletedKeys = getStoredDeletedSlotKeys(territoryKey);
  deletedKeys.add(targetRow.id);
  deletedKeys.add(getSlotKey(targetRow.subOrg, targetRow.no, targetRow.jabatan));
  saveDeletedSlotKeys(territoryKey, deletedKeys);

  const remaining = gridRows.filter((r) => r.id !== id);
  const counters = new Map<string, number>();
  const normalized = remaining.map((r) => {
    const currentCount = (counters.get(r.subOrg) || 0) + 1;
    counters.set(r.subOrg, currentCount);
    return {
      ...r,
      no: currentCount,
    };
  });
  saveCustomMatrixRows(matrixStorageKey, normalized);
  return { updatedRows: normalized, deletedNik };
}

export function deleteSelectedMatrixRows(
  gridRows: GridRowItem[],
  selectedIds: string[],
  matrixStorageKey: string
): { updatedRows: GridRowItem[]; niksToDelete: string[] } {
  if (selectedIds.length === 0) return { updatedRows: gridRows, niksToDelete: [] };

  const idSet = new Set(selectedIds);
  const niksToDelete: string[] = [];

  gridRows.forEach((r) => {
    if (idSet.has(r.id)) {
      const nikTarget = r.originalNik || (r.nik && !r.id.startsWith('empty_') ? r.nik : '');
      if (nikTarget) {
        niksToDelete.push(nikTarget);
      }
    }
  });

  const updated = gridRows.map((row) => {
    if (!idSet.has(row.id)) return row;
    return {
      ...row,
      namaLengkap: '',
      nik: '',
      nomorEKTA: '',
      email: '',
      nomorHP: '',
      sosmed: '',
      isExisting: false,
      originalNik: undefined,
    };
  });
  saveCustomMatrixRows(matrixStorageKey, updated);
  return { updatedRows: updated, niksToDelete };
}

