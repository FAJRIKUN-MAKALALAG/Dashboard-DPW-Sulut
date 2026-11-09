import { GridRowItem } from '../components/matrix';
import { apiFetch } from './http';

export interface TerritoryStructureSlotsResponse {
  slots: GridRowItem[];
  total: number;
  filled: number;
  vacant: number;
}

export interface SyncTerritoryStructureSlotsResponse {
  slots: GridRowItem[];
  total: number;
  success: boolean;
}

const territorySlotsCache = new Map<string, TerritoryStructureSlotsResponse>();

function getSlotCacheKey(
  tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
  dpd: string,
  dpc: string = '',
  dprt: string = ''
): string {
  const cDpd = (tingkat === 'DPW' ? 'Sulawesi Utara' : dpd || '').trim().toLowerCase();
  const cDpc = (tingkat === 'DPC' || tingkat === 'DPRt' ? dpc || '' : '').trim().toLowerCase();
  const cDprt = (tingkat === 'DPRt' ? dprt || '' : '').trim().toLowerCase();
  return `${tingkat}__${cDpd}__${cDpc}__${cDprt}`;
}

export const StructureSlotService = {
  getCachedTerritorySlots(
    tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
    dpd: string,
    dpc: string = '',
    dprt: string = ''
  ): TerritoryStructureSlotsResponse | undefined {
    return territorySlotsCache.get(getSlotCacheKey(tingkat, dpd, dpc, dprt));
  },

  invalidateCache(): void {
    territorySlotsCache.clear();
  },

  /**
   * Mengambil seluruh kursi jabatan (baik yang sudah terisi maupun yang masih kosong/lowong `member_nik = NULL`)
   * dari tabel `structure_slots` di database PostgreSQL untuk wilayah terkait.
   */
  async fetchTerritorySlots(
    tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
    dpd: string,
    dpc: string = '',
    dprt: string = '',
    options?: { force?: boolean }
  ): Promise<TerritoryStructureSlotsResponse> {
    const cacheKey = getSlotCacheKey(tingkat, dpd, dpc, dprt);
    if (!options?.force && territorySlotsCache.has(cacheKey)) {
      return territorySlotsCache.get(cacheKey)!;
    }

    const res = await apiFetch<TerritoryStructureSlotsResponse>('/structure-slots', {
      method: 'GET',
      query: {
        tingkat,
        dpd: tingkat === 'DPW' ? 'Sulawesi Utara' : dpd,
        dpc: tingkat === 'DPC' || tingkat === 'DPRt' ? dpc : '',
        dprt: tingkat === 'DPRt' ? dprt : '',
      },
    });
    if (res?.slots) {
      territorySlotsCache.set(cacheKey, res);
    }
    return res;
  },

  /**
   * Menyimpan/menyinkronkan seluruh baris matriks (termasuk kursi kosong/lowong & jabatan tambahan `+ Baris`)
   * ke tabel `structure_slots` di database PostgreSQL.
   */
  async syncTerritorySlots(
    tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
    dpd: string,
    dpc: string = '',
    dprt: string = '',
    rows: GridRowItem[]
  ): Promise<SyncTerritoryStructureSlotsResponse> {
    const cacheKey = getSlotCacheKey(tingkat, dpd, dpc, dprt);
    const res = await apiFetch<SyncTerritoryStructureSlotsResponse>('/structure-slots/sync', {
      method: 'POST',
      body: {
        tingkat,
        dpd: tingkat === 'DPW' ? 'Sulawesi Utara' : dpd,
        dpc: tingkat === 'DPC' || tingkat === 'DPRt' ? dpc : '',
        dprt: tingkat === 'DPRt' ? dprt : '',
        rows,
      },
    });
    if (res?.slots) {
      const filled = res.slots.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '').length;
      territorySlotsCache.set(cacheKey, {
        slots: res.slots,
        total: res.total,
        filled,
        vacant: res.total - filled,
      });
    }
    return res;
  },

  /**
   * Memulihkan kursi jabatan wilayah kembali ke formasi baku standar di tabel `structure_slots` database PostgreSQL.
   */
  async resetTerritorySlots(
    tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt',
    dpd: string,
    dpc: string = '',
    dprt: string = ''
  ): Promise<SyncTerritoryStructureSlotsResponse> {
    const cacheKey = getSlotCacheKey(tingkat, dpd, dpc, dprt);
    const res = await apiFetch<SyncTerritoryStructureSlotsResponse>('/structure-slots/reset', {
      method: 'POST',
      body: {
        tingkat,
        dpd: tingkat === 'DPW' ? 'Sulawesi Utara' : dpd,
        dpc: tingkat === 'DPC' || tingkat === 'DPRt' ? dpc : '',
        dprt: tingkat === 'DPRt' ? dprt : '',
      },
    });
    if (res?.slots) {
      const filled = res.slots.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '').length;
      territorySlotsCache.set(cacheKey, {
        slots: res.slots,
        total: res.total,
        filled,
        vacant: res.total - filled,
      });
    } else {
      territorySlotsCache.delete(cacheKey);
    }
    return res;
  },
};

