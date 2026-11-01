import { AuditLog } from '../types';
import { mapApiAuditLog } from './apiMappers';
import { apiFetch, getToken } from './http';

interface AuditListResponse {
  items: any[];
  page: number;
  perPage: number;
  total: number;
  serverTime?: string;
}

export interface RecentAuditResult {
  items: AuditLog[];
  serverTime?: string;
}

const PAGE_SIZE = 200; // batas per_page di backend
const MAX_LOGS = 500;
const COOLDOWN_MS = 5000;

let inFlightAuditAll: Promise<AuditLog[]> | null = null;
let cachedAuditLogs: AuditLog[] | null = null;
let cachedAuditAt = 0;
let cachedAuditToken: string | null = null;

/**
 * Service riwayat audit (Audit Logs) melalui backend API.
 * Pencatatan audit dilakukan otomatis oleh backend saat anggota dibuat/diubah/dihapus/diimpor.
 */
export const AuditService = {
  invalidateCache(): void {
    cachedAuditLogs = null;
    cachedAuditAt = 0;
    cachedAuditToken = null;
  },

  async getAll(): Promise<AuditLog[]> {
    const token = getToken() || '__anon__';
    if (cachedAuditToken && cachedAuditToken !== token) {
      cachedAuditLogs = null;
      cachedAuditAt = 0;
    }
    if (cachedAuditLogs && cachedAuditToken === token && Date.now() - cachedAuditAt < COOLDOWN_MS) {
      return cachedAuditLogs;
    }
    if (inFlightAuditAll) return inFlightAuditAll;

    inFlightAuditAll = (async () => {
      try {
        const logs: any[] = [];
        for (let page = 1; logs.length < MAX_LOGS; page++) {
          const res = await apiFetch<AuditListResponse>('/audit-logs', {
            query: { page, per_page: PAGE_SIZE },
          });
          logs.push(...res.items);
          if (res.items.length < PAGE_SIZE || logs.length >= res.total) break;
        }
        const mapped = logs.slice(0, MAX_LOGS).map(mapApiAuditLog);
        cachedAuditLogs = mapped;
        cachedAuditAt = Date.now();
        cachedAuditToken = token;
        return mapped;
      } catch (err) {
        console.warn('Peringatan membaca audit logs:', err);
        return [];
      } finally {
        inFlightAuditAll = null;
      }
    })();

    return inFlightAuditAll;
  },

  /** Log terbaru saja (kompatibilitas pemanggil standar). */
  async getRecent(limit = 50): Promise<AuditLog[]> {
    const res = await apiFetch<AuditListResponse>('/audit-logs', {
      query: { page: 1, per_page: limit, skip_count: 'true' },
    });
    return res.items.map(mapApiAuditLog);
  },

  /**
   * Polling delta ringan untuk sinkronisasi 100+ user aktif:
   * hanya mengambil baris audit baru sejak `since` tanpa menjalankan COUNT(*) penuh di database.
   */
  async getRecentDelta(limit = 40, since?: string): Promise<RecentAuditResult> {
    const res = await apiFetch<AuditListResponse>('/audit-logs', {
      query: {
        page: 1,
        per_page: limit,
        since: since || undefined,
        skip_count: 'true',
      },
    });
    return {
      items: res.items.map(mapApiAuditLog),
      serverTime: res.serverTime,
    };
  },

  /**
   * Menghapus seluruh riwayat audit (khusus Super Admin).
   */
  async clearAll(): Promise<boolean> {
    await apiFetch('/audit-logs', { method: 'DELETE' });
    AuditService.invalidateCache();
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
