import { DeletionRequest } from '../types';
import { mapApiDeletionRequest } from './apiMappers';
import { apiFetch, getToken } from './http';

const COOLDOWN_MS = 4000;
let inFlightDeletions: Promise<DeletionRequest[]> | null = null;
let cachedDeletions: DeletionRequest[] | null = null;
let cachedDeletionsAt = 0;
let cachedDeletionsToken: string | null = null;

/**
 * Service permohonan hapus data (Deletion Requests) melalui backend API.
 */
export const DeletionRequestService = {
  invalidateCache(): void {
    cachedDeletions = null;
    cachedDeletionsAt = 0;
    cachedDeletionsToken = null;
  },

  async getAll(): Promise<DeletionRequest[]> {
    const token = getToken() || '__anon__';
    if (cachedDeletionsToken && cachedDeletionsToken !== token) {
      cachedDeletions = null;
      cachedDeletionsAt = 0;
    }
    if (cachedDeletions && cachedDeletionsToken === token && Date.now() - cachedDeletionsAt < COOLDOWN_MS) {
      return cachedDeletions;
    }
    if (inFlightDeletions) return inFlightDeletions;

    inFlightDeletions = (async () => {
      try {
        const res = await apiFetch<{ items: any[] }>('/deletion-requests');
        const mapped = res.items.map(mapApiDeletionRequest);
        cachedDeletions = mapped;
        cachedDeletionsAt = Date.now();
        cachedDeletionsToken = token;
        return mapped;
      } catch (err) {
        console.warn('Peringatan membaca deletion requests:', err);
        return [];
      } finally {
        inFlightDeletions = null;
      }
    })();

    return inFlightDeletions;
  },

  async insert(
    req: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>
  ): Promise<DeletionRequest | null> {
    try {
      const created = await apiFetch<any>('/deletion-requests', {
        method: 'POST',
        body: { nik: req.memberNik, reason: req.reason },
      });
      DeletionRequestService.invalidateCache();
      return mapApiDeletionRequest(created);
    } catch (err) {
      console.error('Gagal mengirim permohonan hapus:', err);
      return null;
    }
  },

  /**
   * Review (setujui/tolak) oleh Super Admin. Jika disetujui, backend sekaligus menghapus anggota.
   */
  async update(req: DeletionRequest): Promise<boolean> {
    try {
      await apiFetch(`/deletion-requests/${encodeURIComponent(req.id)}/review`, {
        method: 'POST',
        body: { decision: req.status, notes: req.reviewNotes || '' },
      });
      DeletionRequestService.invalidateCache();
      return true;
    } catch (err) {
      console.error('Gagal memproses permohonan hapus:', err);
      return false;
    }
  },
};
