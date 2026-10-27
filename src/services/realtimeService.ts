import { Member, AuditLog, DeletionRequest } from '../types';
import { isBackendConfigured } from '../config/api';
import { getToken } from './http';
import { AuditService } from './auditService';
import { DeletionRequestService } from './deletionService';
import { MemberService } from './memberService';

export interface RealtimeCallbacks {
  onMemberChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', member: Member | { nik: string }) => void;
  onAuditLogInsert?: (log: AuditLog) => void;
  onDeletionRequestChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', req: DeletionRequest | { id: string }) => void;
}

const POLL_INTERVAL_MS = 15000;
const MAX_MEMBER_REFRESH_PER_TICK = 20;
const NIK_PATTERN = /^\d{16}$/;

/**
 * Sinkronisasi perubahan data antar pengguna lewat polling ke backend (pengganti WebSocket Supabase).
 * - Audit log baru -> callback onAuditLogInsert
 * - Audit log yang menyentuh anggota tertentu -> data anggota tersebut dimuat ulang (INSERT/UPDATE/DELETE)
 * - Permohonan hapus baru / berubah status -> callback onDeletionRequestChange
 * Import/penghapusan massal tidak diuraikan per anggota; gunakan tombol "Tarik Data" untuk memuat ulang penuh.
 */
export function subscribeToAllRealtime(callbacks: RealtimeCallbacks): () => void {
  if (!isBackendConfigured()) {
    return () => {};
  }

  let stopped = false;
  let auditPrimed = false;
  let requestsPrimed = false;
  const seenAuditIds = new Set<string>();
  const requestStatus = new Map<string, string>();

  async function pollAudit() {
    const logs = await AuditService.getRecent();
    if (!auditPrimed) {
      logs.forEach((l) => seenAuditIds.add(l.id));
      auditPrimed = true;
      return;
    }

    const fresh = logs.filter((l) => !seenAuditIds.has(l.id)).reverse(); // terlama dulu
    fresh.forEach((l) => seenAuditIds.add(l.id));

    const touched = new Map<string, string>(); // nik -> action terakhir
    fresh.forEach((log) => {
      callbacks.onAuditLogInsert?.(log);
      if (NIK_PATTERN.test(log.memberNik)) touched.set(log.memberNik, log.action);
    });

    let refreshed = 0;
    for (const [nik, action] of touched) {
      if (!callbacks.onMemberChange || refreshed >= MAX_MEMBER_REFRESH_PER_TICK) break;
      refreshed++;
      if (action === 'DELETE') {
        callbacks.onMemberChange('DELETE', { nik });
        continue;
      }
      const member = await MemberService.getByNik(nik);
      if (member) callbacks.onMemberChange(action === 'CREATE' ? 'INSERT' : 'UPDATE', member);
      else callbacks.onMemberChange('DELETE', { nik });
    }
  }

  async function pollDeletionRequests() {
    const list = await DeletionRequestService.getAll();
    if (!requestsPrimed) {
      list.forEach((r) => requestStatus.set(r.id, r.status));
      requestsPrimed = true;
      return;
    }
    list.forEach((r) => {
      const prev = requestStatus.get(r.id);
      if (prev === undefined) {
        callbacks.onDeletionRequestChange?.('INSERT', r);
      } else if (prev !== r.status) {
        callbacks.onDeletionRequestChange?.('UPDATE', r);
      }
      requestStatus.set(r.id, r.status);
    });
  }

  async function tick() {
    if (stopped || document.hidden || !getToken()) return;
    try {
      await pollAudit();
      await pollDeletionRequests();
    } catch (err) {
      console.warn('[Sync] Polling backend gagal:', err);
    }
  }

  const timer = window.setInterval(tick, POLL_INTERVAL_MS);
  tick();

  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
