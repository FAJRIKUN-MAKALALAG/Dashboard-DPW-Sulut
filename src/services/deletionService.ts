import { DeletionRequest } from '../types';
import { mapApiDeletionRequest } from './apiMappers';
import { apiFetch } from './http';

/**
 * Service permohonan hapus data (Deletion Requests) melalui backend API.
 */
export const DeletionRequestService = {
  async getAll(): Promise<DeletionRequest[]> {
    try {
      const res = await apiFetch<{ items: any[] }>('/deletion-requests');
      return res.items.map(mapApiDeletionRequest);
    } catch (err) {
      console.warn('Peringatan membaca deletion requests:', err);
      return [];
    }
  },

  async insert(
    req: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>
  ): Promise<DeletionRequest | null> {
    try {
      const created = await apiFetch<any>('/deletion-requests', {
        method: 'POST',
        body: { nik: req.memberNik, reason: req.reason },
      });
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
      return true;
    } catch (err) {
      console.error('Gagal memproses permohonan hapus:', err);
      return false;
    }
  },
};
