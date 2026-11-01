import { Member, AuditLog, UserSession, DeletionRequest } from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'nasdem_sulut_ekta_members_real_v1',
  AUDIT_LOGS: 'nasdem_sulut_ekta_audit_logs_real_v1',
  SESSION: 'nasdem_sulut_ekta_session_v5',
  DELETION_REQUESTS: 'nasdem_sulut_ekta_deletion_requests_real_v1',
};

const STORAGE_DEBOUNCE_MS = 600;
const pendingValues = new Map<string, unknown>();
const pendingTimers = new Map<string, number>();

function flushKeyNow(key: string): void {
  const timer = pendingTimers.get(key);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    pendingTimers.delete(key);
  }
  if (!pendingValues.has(key)) return;
  const val = pendingValues.get(key);
  pendingValues.delete(key);
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Peringatan penyimpanan lokal (${key}): kapasitas localStorage penuh atau dibatasi.`, e);
  }
}

export function flushAllPendingStorage(): void {
  Array.from(pendingValues.keys()).forEach(flushKeyNow);
}

function scheduleDebouncedSave(key: string, value: unknown): void {
  pendingValues.set(key, value);
  const existing = pendingTimers.get(key);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }
  if (typeof window === 'undefined') {
    flushKeyNow(key);
    return;
  }
  const timer = window.setTimeout(() => {
    flushKeyNow(key);
  }, STORAGE_DEBOUNCE_MS);
  pendingTimers.set(key, timer);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAllPendingStorage);
  window.addEventListener('beforeunload', flushAllPendingStorage);
}

// Bersihkan cache dummy lama agar tidak mengotori data riil
try {
  [
    'nasdem_sulut_ekta_members_v3',
    'nasdem_sulut_ekta_members_supabase_only',
    'nasdem_sulut_ekta_audit_logs_v5',
    'nasdem_sulut_ekta_deletion_requests_v4',
  ].forEach((k) => localStorage.removeItem(k));
} catch {}

export const DEFAULT_SUPER_ADMIN: UserSession = {
  role: 'SUPER_ADMIN',
  dpdAccess: 'ALL',
  dpcAccess: 'ALL',
  dprtAccess: 'ALL',
  adminName: 'Bappilu & OKK DPW NasDem Sulut',
  jabatan: 'Super Admin DPW Partai NasDem Sulut',
};

export function loadMembers(): Member[] {
  if (pendingValues.has(STORAGE_KEYS.MEMBERS)) {
    const mem = pendingValues.get(STORAGE_KEYS.MEMBERS);
    if (Array.isArray(mem)) return mem as Member[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading members from localStorage', e);
  }
  return [];
}

export function saveMembers(members: Member[]): void {
  scheduleDebouncedSave(STORAGE_KEYS.MEMBERS, members);
}

export function loadAuditLogs(): AuditLog[] {
  if (pendingValues.has(STORAGE_KEYS.AUDIT_LOGS)) {
    const logs = pendingValues.get(STORAGE_KEYS.AUDIT_LOGS);
    if (Array.isArray(logs)) return logs as AuditLog[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Error loading audit logs', e);
  }
  return [];
}

export function saveAuditLogs(logs: AuditLog[]): void {
  scheduleDebouncedSave(STORAGE_KEYS.AUDIT_LOGS, logs);
}

export function appendAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const currentLogs = loadAuditLogs();
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newEntry: AuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
  };
  
  saveAuditLogs([newEntry, ...currentLogs]);
}

export function loadSession(): UserSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading user session', e);
  }
  return DEFAULT_SUPER_ADMIN;
}

export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session', e);
  }
}

export function resetToDefaultSeeds(): void {
  pendingValues.delete(STORAGE_KEYS.MEMBERS);
  pendingValues.delete(STORAGE_KEYS.AUDIT_LOGS);
  pendingValues.delete(STORAGE_KEYS.DELETION_REQUESTS);
  pendingTimers.forEach((t) => window.clearTimeout(t));
  pendingTimers.clear();
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, '[]');
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DELETION_REQUESTS);
  } catch {}
}

export function loadDeletionRequests(): DeletionRequest[] {
  if (pendingValues.has(STORAGE_KEYS.DELETION_REQUESTS)) {
    const reqs = pendingValues.get(STORAGE_KEYS.DELETION_REQUESTS);
    if (Array.isArray(reqs)) return reqs as DeletionRequest[];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETION_REQUESTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Error loading deletion requests', e);
  }
  return [];
}

export function saveDeletionRequests(requests: DeletionRequest[]): void {
  scheduleDebouncedSave(STORAGE_KEYS.DELETION_REQUESTS, requests);
}

export function appendDeletionRequest(
  request: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>
): DeletionRequest {
  const current = loadDeletionRequests();
  const now = new Date();
  const requestedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newEntry: DeletionRequest = {
    ...request,
    id: `del-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    requestedAt,
    status: 'PENDING',
  };

  saveDeletionRequests([newEntry, ...current]);
  return newEntry;
}

export function updateDeletionRequest(updated: DeletionRequest): void {
  const current = loadDeletionRequests();
  const updatedList = current.map((r) => (r.id === updated.id ? updated : r));
  saveDeletionRequests(updatedList);
}
