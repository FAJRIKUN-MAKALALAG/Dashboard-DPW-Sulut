import { UserSession } from '../types';

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
 * - KETUA DPW (role ADMIN_DPW + Jabatan Ketua): YA (Dashboard Se-Sulut)
 * - KETUA DPD (role ADMIN_DPD + Jabatan Ketua): YA (Dashboard Khusus DPD Wilayahnya)
 * - KETUA DPC (role ADMIN_DPC + Jabatan Ketua): YA (Dashboard Khusus DPC Kecamatannya)
 * - KETUA DPRt: TIDAK (Dashboard dihapus, hanya Portal & Keanggotaan/Pengurusnya)
 * - PENGURUS BIASA (DPW, DPD, DPC, DPRt): TIDAK (Dashboard dihapus!)
 */
export function canAccessDashboard(session?: UserSession): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true;

  const isLeader = isLeaderPosition(session.jabatan);
  if (session.role === 'ADMIN_DPW' && isLeader) return true;
  if (session.role === 'ADMIN_DPD' && isLeader) return true;
  if (session.role === 'ADMIN_DPC' && isLeader) return true;

  return false;
}

/**
 * Aturan Manajemen Akun Admin (User Management):
 * Hanya Super Admin yang memiliki wewenang membuat/mengedit akun admin.
 * Ketua DPW melihat semua data se-Sulut, tetapi TIDAK bisa membuatkan akun admin.
 */
export function canManageUsers(session?: UserSession): boolean {
  return session?.role === 'SUPER_ADMIN';
}

/**
 * Aturan Kode Referral:
 * Super Admin TIDAK memakai kode referral (karena Super Admin adalah administrator teknis).
 * Semua pengurus & ketua lapangan (DPW, DPD, DPC, DPRt) memakai kode referral.
 */
export function isReferralApplicable(session?: UserSession): boolean {
  return session?.role !== 'SUPER_ADMIN';
}

/**
 * Menentukan Tab Awal Default saat Pengguna Login:
 * Jika memiliki hak akses Dashboard -> 'dashboard'
 * Jika pengurus biasa / ketua DPRt (tidak ada dashboard) -> langsung ke 'portal'
 */
export function getDefaultActiveTab(session?: UserSession): 'dashboard' | 'portal' {
  return canAccessDashboard(session) ? 'dashboard' : 'portal';
}

/**
 * Menentukan apakah pengguna boleh melihat matriks struktur teritorial tertentu:
 * - Pengurus Biasa (Non-Ketua): TIDAK bisa akses tab matriks struktur (hanya portal & pencarian teritorial)
 * - Ketua DPRt: Hanya matriks DPRt
 * - Ketua DPC: Matriks DPC dan DPRt di wilayahnya
 * - Ketua DPD: Matriks DPD, DPC, dan DPRt di wilayahnya
 * - Ketua DPW: Semua matriks (DPW, DPD, DPC, DPRt) se-Sulut
 * - Super Admin: Semua matriks
 */
export function canAccessStructureTab(
  tab: 'dpw' | 'dpd' | 'dpc' | 'dprt',
  session?: UserSession
): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true;

  const isLeader = isLeaderPosition(session.jabatan);

  // Pengurus biasa (non-Ketua) hanya menggunakan portal & fitur search
  if (!isLeader) {
    return false;
  }

  // Hak akses struktur untuk posisi KETUA di tiap tingkatan
  if (session.role === 'ADMIN_DPW') {
    return true; // Ketua DPW melihat seluruh tingkatan
  }
  if (session.role === 'ADMIN_DPD') {
    return tab === 'dpd' || tab === 'dpc' || tab === 'dprt';
  }
  if (session.role === 'ADMIN_DPC') {
    return tab === 'dpc' || tab === 'dprt';
  }
  if (session.role === 'ADMIN_DPRT') {
    return tab === 'dprt';
  }

  return false;
}

/**
 * Mendapatkan label wilayah penugasan pengguna untuk ditampilkan di header / breadcrumb
 */
export function getUserTerritoryLabel(session?: UserSession): string {
  if (!session) return '';
  if (session.role === 'SUPER_ADMIN') return 'Seluruh Sulawesi Utara (Super Admin)';
  if (session.role === 'ADMIN_DPW') return 'Tingkat DPW Sulawesi Utara';
  if (session.role === 'ADMIN_DPD') return `DPD ${session.dpdAccess}`;
  if (session.role === 'ADMIN_DPC') return `DPC Kec. ${session.dpcAccess} (${session.dpdAccess})`;
  if (session.role === 'ADMIN_DPRT') return `DPRt Desa/Kel. ${session.dprtAccess}`;
  return session.dpdAccess || 'Sulawesi Utara';
}
