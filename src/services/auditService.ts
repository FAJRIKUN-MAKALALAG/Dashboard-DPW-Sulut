import { AuditLog } from '../types';
import { mapApiAuditLog } from './apiMappers';
import { apiFetch } from './http';

interface AuditListResponse {
  items: any[];
  page: number;
  perPage: number;
  total: number;
}

const PAGE_SIZE = 200; // batas per_page di backend
const MAX_LOGS = 500;

/**
 * Service riwayat audit (Audit Logs) melalui backend API.
 * Pencatatan audit dilakukan otomatis oleh backend saat anggota dibuat/diubah/dihapus/diimpor.
 */
export const AuditService = {
  async getAll(): Promise<AuditLog[]> {
    try {
      const logs: any[] = [];
      for (let page = 1; logs.length < MAX_LOGS; page++) {
        const res = await apiFetch<AuditListResponse>('/audit-logs', { query: { page, per_page: PAGE_SIZE } });
        logs.push(...res.items);
        if (res.items.length < PAGE_SIZE || logs.length >= res.total) break;
      }
      return logs.slice(0, MAX_LOGS).map(mapApiAuditLog);
    } catch (err) {
      console.warn('Peringatan membaca audit logs:', err);
      return [];
    }
  },

  /** Log terbaru saja (dipakai polling sinkronisasi). */
  async getRecent(limit = 50): Promise<AuditLog[]> {
    const res = await apiFetch<AuditListResponse>('/audit-logs', { query: { page: 1, per_page: limit } });
    return res.items.map(mapApiAuditLog);
  },

  /**
   * Menghapus seluruh riwayat audit (khusus Super Admin).
   */
  async clearAll(): Promise<boolean> {
    await apiFetch('/audit-logs', { method: 'DELETE' });
    return true;
  },

  /**
   * Backend sudah mencatat audit sendiri untuk setiap aksi data, sehingga pencatatan dari
   * klien tidak lagi dikirim (mencegah catatan ganda dan pemalsuan log).
   */
  async insert(_log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog | null> {
    return null;
  },
};
