import { GridRowItem } from '../../components/matrix';

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
    localStorage.setItem(matrixStorageKey, JSON.stringify(rowsToSave));
  } catch (e) {
    console.warn('Failed to save custom matrix rows to localStorage:', e);
  }
}

export function getSlotKey(subOrg: string, no: number, jabatan: string): string {
  return `${subOrg.trim().toLowerCase()}__${no}__${jabatan.trim().toLowerCase()}`;
}

