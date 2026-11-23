import { UserRole, UserSession, Member } from '../types';
import { isDpdMatch, isDpcMatch, isDprtMatch } from './structureReadinessUtils';

export const KETUA_ROLES: UserRole[] = ['KETUA_DPW', 'KETUA_DPD', 'KETUA_DPC', 'KETUA_DPRT'];
export const DELEGATED_ADMIN_ROLES: UserRole[] = ['ADMIN_DPW', 'ADMIN_DPD', 'ADMIN_DPC', 'ADMIN_DPRT'];
export const PENGURUS_ROLES: UserRole[] = [
  'PENGURUS_DPW',
  'PENGURUS_DPD',
  'PENGURUS_DPC',
  'PENGURUS_DPRT',
];

export const DPW_ROLES: UserRole[] = ['KETUA_DPW', 'ADMIN_DPW', 'PENGURUS_DPW'];
export const DPD_ROLES: UserRole[] = ['KETUA_DPD', 'ADMIN_DPD', 'PENGURUS_DPD'];
export const DPC_ROLES: UserRole[] = ['KETUA_DPC', 'ADMIN_DPC', 'PENGURUS_DPC'];
export const DPRT_ROLES: UserRole[] = ['KETUA_DPRT', 'ADMIN_DPRT', 'PENGURUS_DPRT'];

export function isKetuaRole(role?: UserRole): boolean {
  return Boolean(role && KETUA_ROLES.includes(role));
}

export function isDelegatedAdminRole(role?: UserRole): boolean {
  return Boolean(role && DELEGATED_ADMIN_ROLES.includes(role));
}

export function isPengurusRole(role?: UserRole): boolean {
  return Boolean(role && PENGURUS_ROLES.includes(role));
}

export function isTerritoryManagerRole(role?: UserRole): boolean {
  return Boolean(
    role && (role === 'SUPER_ADMIN' || isKetuaRole(role) || isDelegatedAdminRole(role))
  );
}

export function isDpwScopedRole(role?: UserRole): boolean {
  return Boolean(role && DPW_ROLES.includes(role));
}

export function isDpdScopedRole(role?: UserRole): boolean {
  return Boolean(role && DPD_ROLES.includes(role));
}

export function isDpcScopedRole(role?: UserRole): boolean {
  return Boolean(role && DPC_ROLES.includes(role));
}

export function isDprtScopedRole(role?: UserRole): boolean {
  return Boolean(role && DPRT_ROLES.includes(role));
}

export function isGlobalTerritoryRole(role?: UserRole): boolean {
  return Boolean(role === 'SUPER_ADMIN' || isDpwScopedRole(role));
}

export function getRoleTerritoryLevel(role?: UserRole): 'DPW' | 'DPD' | 'DPC' | 'DPRt' | null {
  if (!role) return null;
  if (role === 'SUPER_ADMIN' || isDpwScopedRole(role)) return 'DPW';
  if (isDpdScopedRole(role)) return 'DPD';
  if (isDpcScopedRole(role)) return 'DPC';
  if (isDprtScopedRole(role)) return 'DPRt';
  return null;
}

export function getRoleDisplayLabel(role?: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'KETUA_DPW':
      return 'Ketua DPW';
    case 'KETUA_DPD':
      return 'Ketua DPD';
    case 'KETUA_DPC':
      return 'Ketua DPC';
    case 'KETUA_DPRT':
      return 'Ketua DPRt';
    case 'ADMIN_DPW':
      return 'Admin Delegasi DPW';
    case 'ADMIN_DPD':
      return 'Admin Delegasi DPD';
    case 'ADMIN_DPC':
      return 'Admin Delegasi DPC';
    case 'ADMIN_DPRT':
      return 'Admin Delegasi DPRt';
    case 'PENGURUS_DPW':
      return 'Pengurus DPW';
    case 'PENGURUS_DPD':
      return 'Pengurus DPD';
    case 'PENGURUS_DPC':
      return 'Pengurus DPC';
    case 'PENGURUS_DPRT':
      return 'Pengurus DPRt';
    case 'WAKIL_BENDAHARA':
      return 'Wakil Bendahara';
    case 'ADMIN_INVENTORY':
      return 'Admin Inventory';
    case 'ANGGOTA':
      return 'Anggota Biasa';
    default:
      return role || '-';
  }
}

/**
 * Memeriksa apakah jabatan pengguna merupakan posisi "Ketua"
 * (misal: Ketua DPW, Ketua DPD, Ketua DPC, Ketua DPRt, Ketua Umum, dll),
 * dan bukan Wakil Ketua, Sekretaris, Bendahara, atau pengurus lainnya.
 */
export function isLeaderPosition(jabatan?: string): boolean {
  if (!jabatan) return false;
  const j = jabatan.trim().toLowerCase();
  return j.startsWith('ketua') && !j.includes('wakil');
}

/**
 * Aturan Akses Dashboard Utama:
 * - SUPER_ADMIN: YA (Dashboard Eksekutif Se-Sulut)
 * - KETUA_DPW / ADMIN_DPW (Delegasi): YA (Dashboard Se-Sulut)
 * - KETUA_DPD / ADMIN_DPD (Delegasi): YA (Dashboard Khusus DPD Wilayahnya)
 * - KETUA_DPC / ADMIN_DPC (Delegasi): YA (Dashboard Khusus DPC Kecamatannya)
 * - KETUA_DPRT / ADMIN_DPRT (Delegasi): YA (Mini Dashboard Khusus DPRt Wilayahnya)
 * - PENGURUS_* (Non-Ketua & Non-Delegasi): TIDAK (Langsung ke Portal Pengurus)
 */
export function canAccessDashboard(session?: UserSession): boolean {
  if (!session) return false;
  return isTerritoryManagerRole(session.role);
}

/**
 * Aturan Manajemen Akun Admin (User Management):
 * Hanya Super Admin yang memiliki wewenang membuat/mengedit akun admin.
 */
export function canManageUsers(session?: UserSession): boolean {
  return session?.role === 'SUPER_ADMIN';
}

/**
 * Hak Akses Modul Inventaris Kantor DPW Sulut (5 Lantai):
 * HANYA untuk SUPER_ADMIN, ADMIN_INVENTORY, dan WAKIL_BENDAHARA.
 */
export function canAccessInventory(session?: UserSession): boolean {
  if (!session) return false;
  return (
    session.role === 'SUPER_ADMIN' ||
    session.role === 'ADMIN_INVENTORY' ||
    session.role === 'WAKIL_BENDAHARA'
  );
}

/**
 * Hak Akses Modul Keuangan DPW (Iuran Fraksi, DPP, Kas Bank & Operasional):
 * HANYA untuk SUPER_ADMIN dan WAKIL_BENDAHARA.
 */
export function canAccessFinance(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'WAKIL_BENDAHARA';
}

/**
 * Hak Akses Pusat Visualisasi & Analisis Monitoring (Command Center Multi-Layar):
 * HANYA untuk SUPER_ADMIN, KETUA_DPW, dan ADMIN_DPW (Delegasi Ketua DPW).
 */
export function canAccessAnalytics(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'KETUA_DPW' || session.role === 'ADMIN_DPW';
}

/**
 * Aturan Kode Referral:
 * - SUPER_ADMIN, ADMIN_INVENTORY, WAKIL_BENDAHARA, ANGGOTA: TIDAK memakai kode referral.
 * - Semua KETUA_*, ADMIN_* (Delegasi), dan PENGURUS_* (DPW–DPRt): memiliki kode referral pribadi.
 */
export function isReferralApplicable(session?: UserSession): boolean {
  if (!session) return false;
  return (
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_INVENTORY' &&
    session.role !== 'WAKIL_BENDAHARA' &&
    session.role !== 'ANGGOTA'
  );
}

/**
 * Supervisi tim & leaderboard referral (khusus Super Admin, Ketua, dan Admin Delegasi).
 */
export function canViewTeamReferral(session?: UserSession): boolean {
  if (!session) return false;
  return isTerritoryManagerRole(session.role);
}

/**
 * Menentukan apakah pengguna boleh melihat / mengakses database anggota di wilayahnya:
 * Semua role teritorial (Ketua, Admin Delegasi, Pengurus) & Super Admin dapat melihat (read),
 * sedangkan ANGGOTA, ADMIN_INVENTORY, WAKIL_BENDAHARA tidak.
 */
export function canAccessMemberDatabase(session?: UserSession): boolean {
  return (
    session?.role !== 'ANGGOTA' &&
    session?.role !== 'ADMIN_INVENTORY' &&
    session?.role !== 'WAKIL_BENDAHARA'
  );
}

export function isAnggotaBiasa(session?: UserSession): boolean {
  return session?.role === 'ANGGOTA';
}

/**
 * Menentukan Tab Awal Default saat Pengguna Login:
 * - ADMIN_INVENTORY -> 'inventory'
 * - WAKIL_BENDAHARA -> 'finance'
 * - SUPER_ADMIN / KETUA_* / ADMIN_* -> 'dashboard'
 * - PENGURUS_* / ANGGOTA -> 'portal'
 */
export function getDefaultActiveTab(
  session?: UserSession
): 'dashboard' | 'portal' | 'inventory' | 'finance' {
  if (session?.role === 'ADMIN_INVENTORY') return 'inventory';
  if (session?.role === 'WAKIL_BENDAHARA') return 'finance';
  return canAccessDashboard(session) ? 'dashboard' : 'portal';
}

/**
 * Menentukan apakah pengguna boleh melihat & mengelola matriks struktur teritorial tertentu:
 * - PENGURUS_* (Non-Ketua & Non-Delegasi): TIDAK boleh mengakses matriks struktur.
 * - KETUA_DPRT / ADMIN_DPRT: Hanya matriks DPRt wilayahnya.
 * - KETUA_DPC / ADMIN_DPC: Matriks DPC & DPRt di kecamatannya.
 * - KETUA_DPD / ADMIN_DPD: Matriks DPD, DPC & DPRt di kab/kotanya.
 * - KETUA_DPW / ADMIN_DPW / SUPER_ADMIN: Semua matriks (DPW, DPD, DPC, DPRt).
 */
export function canAccessStructureTab(
  tab: 'dpw' | 'dpd' | 'dpc' | 'dprt',
  session?: UserSession
): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true;
  if (!isTerritoryManagerRole(session.role)) return false;

  const level = getRoleTerritoryLevel(session.role);
  if (level === 'DPW') return true;
  if (level === 'DPD') return tab === 'dpd' || tab === 'dpc' || tab === 'dprt';
  if (level === 'DPC') return tab === 'dpc' || tab === 'dprt';
  if (level === 'DPRt') return tab === 'dprt';
  return false;
}

/**
 * Wewenang pendaftaran/rekrutmen anggota baru:
 * Super Admin, Ketua, Admin Delegasi, dan Pengurus ber-SK boleh mendaftarkan anggota baru.
 */
export function canAddMembers(session?: UserSession): boolean {
  if (!session) return false;
  if (
    session.role === 'ANGGOTA' ||
    session.role === 'ADMIN_INVENTORY' ||
    session.role === 'WAKIL_BENDAHARA'
  ) {
    return false;
  }
  if (session.canAddMembers !== undefined) return Boolean(session.canAddMembers);
  return true;
}

/**
 * Pengurus non-Ketua hanya merekrut anggota biasa (tidak dapat menetapkan jabatan SK struktural).
 */
export function canAssignStructuralPosition(session?: UserSession): boolean {
  if (!session) return false;
  return isTerritoryManagerRole(session.role);
}

/**
 * Mendapatkan label wilayah penugasan pengguna untuk ditampilkan di header / breadcrumb
 */
export function getUserTerritoryLabel(session?: UserSession): string {
  if (!session) return '';
  if (session.role === 'SUPER_ADMIN') return 'Seluruh Sulawesi Utara (Super Admin)';
  if (session.role === 'ADMIN_INVENTORY') return 'Gedung Kantor DPW Sulut (Admin Inventaris)';
  if (session.role === 'WAKIL_BENDAHARA') return 'Keuangan DPW & Inventaris Kantor Sulut';
  if (isDpwScopedRole(session.role)) return 'Tingkat DPW Sulawesi Utara';
  if (isDpdScopedRole(session.role)) return `DPD ${session.dpdAccess}`;
  if (isDpcScopedRole(session.role)) return `DPC Kec. ${session.dpcAccess} (${session.dpdAccess})`;
  if (isDprtScopedRole(session.role)) return `DPRt Desa/Kel. ${session.dprtAccess}`;
  if (session.role === 'ANGGOTA') return `Kader Anggota Resmi (${session.dpdAccess || 'Sulut'})`;
  return session.dpdAccess || 'Sulawesi Utara';
}

/**
 * Hak Akses Edit Data Anggota Lain:
 * - PENGURUS_* & ANGGOTA: TIDAK BISA mengedit anggota lain (hanya profil sendiri di Portal).
 * - SUPER_ADMIN, KETUA_DPW, ADMIN_DPW: Penuh ke seluruh anggota se-Sulut.
 * - KETUA_DPD / ADMIN_DPD: Kader di DPD wilayahnya.
 * - KETUA_DPC / ADMIN_DPC: Kader di DPC kecamatannya.
 * - KETUA_DPRT / ADMIN_DPRT: Kader di DPRt desa/kelurahannya.
 */
export function canEditMember(session?: UserSession, member?: Member | null): boolean {
  if (!session || !member) return false;
  if (!isTerritoryManagerRole(session.role)) return false;

  const level = getRoleTerritoryLevel(session.role);
  if (level === 'DPW') return true;
  if (level === 'DPD') return isDpdMatch(member.dpd, session.dpdAccess);
  if (level === 'DPC') {
    return isDpdMatch(member.dpd, session.dpdAccess) && isDpcMatch(member.dpc, session.dpcAccess);
  }
  if (level === 'DPRt') {
    return (
      isDpdMatch(member.dpd, session.dpdAccess) &&
      isDpcMatch(member.dpc, session.dpcAccess) &&
      isDprtMatch(member.dprt, session.dprtAccess)
    );
  }
  return false;
}

/**
 * Hak Akses Hapus Langsung Anggota (Direct Delete) & Approve/Reject Permohonan Hapus:
 * HANYA Super Admin dan Ketua DPW.
 * Pengurus DPW maupun Admin Delegasi DPW TIDAK memiliki akses approve/direct delete.
 */
export function canDirectDeleteMember(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'KETUA_DPW';
}

export function canApproveDeletionRequest(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'KETUA_DPW';
}

/**
 * Hak Melihat Antrean & Status Permohonan Penghapusan:
 * HANYA Super Admin, Ketua Wilayah, dan Admin Delegasi Ketua.
 * Semua PENGURUS_* (termasuk PENGURUS_DPW) TIDAK memiliki akses melihat halaman persetujuan.
 */
export function canViewDeletionQueue(session?: UserSession): boolean {
  if (!session) return false;
  return isTerritoryManagerRole(session.role);
}

/**
 * Hak Akses Mengubah Status Keanggotaan: sama dengan hak edit.
 */
export function canChangeMemberStatus(session?: UserSession, member?: Member | null): boolean {
  return canEditMember(session, member);
}

/**
 * Hak Akses Mengajukan Penghapusan:
 * - SUPER_ADMIN & KETUA_DPW memakai hapus langsung (tidak perlu mengajukan).
 * - PENGURUS_DPW & ADMIN_DPW berhak mengajukan permohonan hapus ke Ketua DPW / Super Admin.
 * - KETUA_DPD/DPC/DPRT & ADMIN_DPD/DPC/DPRT berhak mengajukan permohonan hapus kader di wilayahnya.
 * - PENGURUS_DPD/DPC/DPRT & ANGGOTA tidak berwenang.
 */
export function canRequestDeleteMember(session?: UserSession, member?: Member | null): boolean {
  if (!session || !member) return false;
  if (canDirectDeleteMember(session)) return false;
  if (session.role === 'PENGURUS_DPW' || session.role === 'ADMIN_DPW') return true;
  return canEditMember(session, member);
}

/**
 * Mengembalikan penguncian wilayah (DPD/DPC/DPRt) secara terpusat berdasarkan role akun.
 */
export function resolveSessionTerritoryLocks(session?: UserSession) {
  const role = session?.role;
  const isGlobal = !session || isGlobalTerritoryRole(role);
  const rawDpd = (session?.dpdAccess || '').trim();
  const rawDpc = (session?.dpcAccess || '').trim();
  const rawDprt = (session?.dprtAccess || '').trim();

  const lockedDpd =
    !isGlobal && rawDpd && rawDpd !== 'ALL' && rawDpd !== '-' && rawDpd !== 'Sulawesi Utara'
      ? rawDpd
      : undefined;

  const lockedDpc =
    (isDpcScopedRole(role) || isDprtScopedRole(role)) &&
    rawDpc &&
    rawDpc !== 'ALL' &&
    rawDpc !== 'Umum (DPD)' &&
    rawDpc !== '-'
      ? rawDpc
      : undefined;

  const lockedDprt =
    isDprtScopedRole(role) &&
    rawDprt &&
    rawDprt !== 'ALL' &&
    rawDprt !== 'Pusat/Umum' &&
    rawDprt !== '-'
      ? rawDprt
      : undefined;

  return {
    isGlobal,
    lockedDpd,
    lockedDpc,
    lockedDprt,
  };
}
