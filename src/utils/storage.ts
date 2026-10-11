import { Member, AuditLog, UserSession } from '../types';
import { INITIAL_MEMBERS } from '../data/seedMembers';

const STORAGE_KEYS = {
  MEMBERS: 'nasdem_sulut_ekta_members_v3',
  AUDIT_LOGS: 'nasdem_sulut_ekta_audit_logs_v3',
  SESSION: 'nasdem_sulut_ekta_session_v3',
};

export const DEFAULT_SUPER_ADMIN: UserSession = {
  role: 'SUPER_ADMIN',
  dpdAccess: 'ALL',
  adminName: 'Bappilu & OKK DPW NasDem Sulut',
  jabatan: 'Super Admin DPW Partai NasDem Sulut',
};

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      saveMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate that it's updated NasDem data (starts with ND- or contains NasDem roles)
      const hasNasdemData = parsed.some((m: Member) => m.nomorEKTA?.startsWith('ND-') || m.jabatan?.includes('NasDem'));
      if (hasNasdemData) {
        return parsed;
      }
      // If older dummy data was saved, reset to new NasDem seeds
      saveMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
  } catch (e) {
    console.error('Error loading members from localStorage', e);
  }
  return INITIAL_MEMBERS;
}

export function saveMembers(members: Member[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving members to localStorage', e);
  }
}

export function loadAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      // Initial seed audit logs for DPW Partai NasDem Sulut
      const initialLogs: AuditLog[] = [
        {
          id: 'log-1',
          timestamp: '2024-06-20 09:12',
          memberNik: '7171060909930008',
          memberName: 'Ferry Jerry Paat',
          action: 'STATUS_CHANGE',
          previousStatus: 'Aktif',
          newStatus: 'Non-Aktif (Pindah Partai/Mundur)',
          reason: 'Mengundurkan diri karena maju caleg melalui parpol lain. Status dinonaktifkan di shadow DB.',
          actor: 'Admin DPD NasDem Kota Manado',
          dpd: 'Kota Manado',
        },
        {
          id: 'log-2',
          timestamp: '2024-05-18 11:30',
          memberNik: '7171040402880002',
          memberName: 'Christovel Rompis, SH',
          action: 'STATUS_CHANGE',
          previousStatus: 'Aktif',
          newStatus: 'Non-Aktif (Pindah Domisili)',
          reason: 'Pindah penugasan dinas & KTP ke IKN / Kalimantan Timur. Dinonaktifkan di shadow DB daerah.',
          actor: 'Admin DPD NasDem Kota Manado',
          dpd: 'Kota Manado',
        },
        {
          id: 'log-3',
          timestamp: '2024-03-25 15:10',
          memberNik: '7102041212800008',
          memberName: 'Alm. Markus Tumiwa',
          action: 'STATUS_CHANGE',
          previousStatus: 'Aktif',
          newStatus: 'Non-Aktif (Meninggal)',
          reason: 'Telah wafat Maret 2024. Dokumen akta kematian telah diverifikasi DPD NasDem Minahasa.',
          actor: 'Admin DPD NasDem Kab. Minahasa',
          dpd: 'Kabupaten Minahasa',
        },
      ];
      saveAuditLogs(initialLogs);
      return initialLogs;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Error loading audit logs', e);
  }
  return [];
}

export function saveAuditLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving audit logs', e);
  }
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
  saveMembers(INITIAL_MEMBERS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
}
