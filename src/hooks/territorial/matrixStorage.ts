import { GridRowItem } from '../../components/matrix';
import { getStructureTemplate } from '../../data/structureTemplates';

export function cleanTerritorySlug(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function getTerritoryStorageKeys(
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  selectedDpd: string,
  selectedDpc: string,
  selectedDprt: string
) {
  const cleanDpd = cleanTerritorySlug(selectedDpd);
  const cleanDpc = cleanTerritorySlug(selectedDpc);
  const cleanDprt = cleanTerritorySlug(selectedDprt);
  const versionPrefix = level === 'DPRt' ? 'v2_' : '';

  const territoryKey = `nasdem_deleted_slots_${versionPrefix}${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;
  const matrixStorageKey = `nasdem_custom_matrix_rows_${versionPrefix}${level}_${cleanDpd}_${cleanDpc}_${cleanDprt}`;

  return { territoryKey, matrixStorageKey };
}

export function getStoredDeletedSlotKeys(territoryKey: string): Set<string> {
  try {
    const saved = localStorage.getItem(territoryKey);
    if (saved) {
      const rawArray = JSON.parse(saved);
      if (Array.isArray(rawArray)) {
        // Buang key peninggalan bug lama yang terlalu agresif (job_*, slot_*)
        const cleanArray = rawArray.filter(
          (k: string) => !k.startsWith('job_') && !k.startsWith('slot_')
        );
        return new Set<string>(cleanArray);
      }
    }
  } catch (e) {
    console.warn('Failed to read deleted slots from localStorage:', e);
  }
  return new Set<string>();
}

export function saveDeletedSlotKeys(territoryKey: string, keys: Set<string>): void {
  try {
    localStorage.setItem(territoryKey, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Failed to save deleted slots to localStorage:', e);
  }
}

export function saveCustomMatrixRows(matrixStorageKey: string, rowsToSave: GridRowItem[]): void {
  try {
    // Jangan simpan base64 fotoProfilUrl yang berukuran besar ke localStorage matriks agar tidak memblokir main thread
    const lightweightRows = rowsToSave.map((r) =>
      r.fotoProfilUrl && r.fotoProfilUrl.startsWith('data:')
        ? { ...r, fotoProfilUrl: '' }
        : r
    );
    localStorage.setItem(matrixStorageKey, JSON.stringify(lightweightRows));
  } catch (e) {
    console.warn('Failed to save custom matrix rows to localStorage:', e);
  }
}

export function getSlotKey(subOrg: string, no: number, jabatan: string): string {
  return `${subOrg.trim().toLowerCase()}__${no}__${jabatan.trim().toLowerCase()}`;
}

export function computeDeletedSlotKeysFromRows(
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  rows: GridRowItem[]
): Set<string> {
  const template = getStructureTemplate(level);
  const rowCounts = new Map<string, number>();

  rows.forEach((r) => {
    const jab = r.templateJabatan || r.jabatan;
    const key = `${r.subOrg}_${jab}`;
    rowCounts.set(key, (rowCounts.get(key) || 0) + 1);
    if (r.jabatan !== jab) {
      const altKey = `${r.subOrg}_${r.jabatan}`;
      rowCounts.set(altKey, (rowCounts.get(altKey) || 0) + 1);
    }
  });

  const occMap = new Map<string, number>();
  const deletedKeys = new Set<string>();

  template.forEach((tpl) => {
    const baseKey = `${tpl.subOrg}_${tpl.jabatan}`;
    const occ = (occMap.get(baseKey) || 0) + 1;
    occMap.set(baseKey, occ);

    const remainingCount = rowCounts.get(baseKey) || 0;
    if (occ > remainingCount) {
      deletedKeys.add(`${baseKey}#${occ}`);
      if (remainingCount === 0) {
        deletedKeys.add(baseKey);
      }
    }
  });

  return deletedKeys;
}


