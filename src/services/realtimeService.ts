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

const BASE_POLL_MS = 15000;
const JITTER_MS = 7000; // sebar polling antar 100+ user di rentang 15-22 detik (anti thundering herd)
const MAX_BACKOFF_MS = 60000;
const MAX_MEMBER_REFRESH_PER_TICK = 20;
const MAX_SEEN_IDS = 1000;
const NIK_PATTERN = /^\d{16}$/;

/**
 * Sinkronisasi perubahan data antar pengguna lewat smart delta polling ke backend:
 * - Dilengkapi Random Jitter (15-22 detik) agar ratusan browser tidak menembak server di detik yang sama
 * - Menggunakan parameter delta `since` berbasis jam server sehingga saat tidak ada perubahan beban query mendekati nol
 * - Berhenti otomatis saat tab browser diminimize/tidak aktif (`document.hidden`)
 * - Exponential backoff otomatis jika koneksi sedang lambat
 */
export function subscribeToAllRealtime(callbacks: RealtimeCallbacks): () => void {
  if (!isBackendConfigured()) {
    return () => {};
  }

  let stopped = false;
  let timerId: number | undefined;
  let isTickRunning = false;
  let auditPrimed = false;
  let requestsPrimed = false;
  let lastServerTime: string | undefined;
  let tickCounter = 0;
  let consecutiveErrors = 0;

  const seenAuditIds = new Set<string>();
  const requestStatus = new Map<string, string>();

  function rememberAuditId(id: string) {
    seenAuditIds.add(id);
    if (seenAuditIds.size > MAX_SEEN_IDS) {
      const oldest = seenAuditIds.values().next().value;
      if (oldest) seenAuditIds.delete(oldest);
    }
  }

  async function pollAudit(): Promise<boolean> {
    const { items: logs, serverTime } = await AuditService.getRecentDelta(
      auditPrimed ? 40 : 50,
      auditPrimed ? lastServerTime : undefined
    );
    if (serverTime) {
      lastServerTime = serverTime;
    }

    if (!auditPrimed) {
      logs.forEach((l) => rememberAuditId(l.id));
      auditPrimed = true;
      return false;
    }

    const fresh = logs.filter((l) => !seenAuditIds.has(l.id)).reverse(); // terlama dulu
    fresh.forEach((l) => rememberAuditId(l.id));

    let hasDeletionActivity = false;
    const touched = new Map<string, string>(); // nik -> action terakhir
    fresh.forEach((log) => {
      callbacks.onAuditLogInsert?.(log);
      if (log.action === 'DELETE_REQUEST' || log.action === 'DELETE') {
        hasDeletionActivity = true;
      }
      if (NIK_PATTERN.test(log.memberNik)) touched.set(log.memberNik, log.action);
    });

    if (touched.size > 0) {
      MemberService.invalidateCache();
    }

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

    return hasDeletionActivity;
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

  function scheduleNext(customDelayMs?: number) {
    if (stopped) return;
    if (timerId !== undefined) window.clearTimeout(timerId);

    const jitter = Math.floor(Math.random() * JITTER_MS);
    const delay =
      customDelayMs !== undefined
        ? customDelayMs
        : consecutiveErrors > 0
        ? Math.min(BASE_POLL_MS * Math.pow(2, consecutiveErrors), MAX_BACKOFF_MS) + jitter
        : BASE_POLL_MS + jitter;

    timerId = window.setTimeout(tick, delay);
  }

  async function tick() {
    if (stopped) return;
    if (document.hidden || !getToken()) {
      scheduleNext();
      return;
    }
    if (isTickRunning) {
      scheduleNext();
      return;
    }

    isTickRunning = true;
    tickCounter++;
    try {
      const hasDeletionActivity = await pollAudit();
      if (hasDeletionActivity) {
        DeletionRequestService.invalidateCache();
      }
      // Poll deletion requests saat pertama kali, saat ada aktivitas hapus, atau setiap 2 siklus (~35 detik)
      if (!requestsPrimed || hasDeletionActivity || tickCounter % 2 === 0) {
        await pollDeletionRequests();
      }
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors = Math.min(consecutiveErrors + 1, 4);
      console.warn('[Sync] Polling backend tertunda, menjadwalkan ulang dengan backoff:', err);
    } finally {
      isTickRunning = false;
      scheduleNext();
    }
  }

  function handleVisibilityChange() {
    if (!stopped && !document.hidden && getToken() && !isTickRunning) {
      // Jitter kecil (400-2000ms) saat user kembali membuka tab
      scheduleNext(400 + Math.floor(Math.random() * 1600));
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Tunda tick awal 1.5-3.5 detik setelah mount agar tidak bertabrakan dengan initial load saat login
  scheduleNext(1500 + Math.floor(Math.random() * 2000));

  return () => {
    stopped = true;
    if (timerId !== undefined) window.clearTimeout(timerId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
