import { UserSession, Member } from '../types';
import { isDpdMatch, isDpcMatch, isDprtMatch } from './structureReadinessUtils';

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
 * Hak Akses Pusat Visualisasi & Analisis Monitoring (Command Center Multi-Layar):
 * HANYA untuk SUPER_ADMIN dan KETUA DPW (role ADMIN_DPW + Jabatan Ketua).
 */
export function canAccessAnalytics(session?: UserSession): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true;
  if (session.role === 'ADMIN_DPW' && isLeaderPosition(session.jabatan)) return true;
  return false;
}

/**
 * Aturan Kode Referral:
 * - Super Admin: TIDAK memakai kode referral (karena Super Admin adalah administrator teknis).
 * - Anggota Biasa (role ANGGOTA): TIDAK memakai kode referral (hanya mengelola profil diri & e-KTA).
 * - Semua pengurus & ketua lapangan (DPW, DPD, DPC, DPRt): memakai kode referral.
 */
export function isReferralApplicable(session?: UserSession): boolean {
  if (!session) return false;
  return session.role !== 'SUPER_ADMIN' && session.role !== 'ANGGOTA';
}

/**
 * Menentukan apakah pengguna boleh melihat / mengakses database seluruh anggota:
 * Anggota biasa tanpa SK (role ANGGOTA) HANYA boleh melihat profilnya sendiri,
 * dan TIDAK BISA mengakses pencarian atau daftar anggota lain.
 */
export function canAccessMemberDatabase(session?: UserSession): boolean {
  return session?.role !== 'ANGGOTA';
}

/**
 * Memeriksa apakah pengguna berstatus anggota biasa tanpa SK kepengurusan
 */
export function isAnggotaBiasa(session?: UserSession): boolean {
  return session?.role === 'ANGGOTA';
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
 * Memeriksa wewenang pendaftaran/penambahan anggota baru:
 * HANYA Super Admin dan Pengurus struktural resmi pemegang SK yang berwenang.
 * Anggota biasa (role 'ANGGOTA' atau canAddMembers === false) TIDAK BISA menambah anggota.
 */
export function canAddMembers(session?: UserSession): boolean {
  if (!session) return false;
  if (session.role === 'ANGGOTA') return false;
  if (session.canAddMembers !== undefined) return Boolean(session.canAddMembers);
  return true;
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
  if (session.role === 'ANGGOTA') return `Kader Anggota Resmi (${session.dpdAccess || 'Sulut'})`;
  return session.dpdAccess || 'Sulawesi Utara';
}

/**
 * Hak Akses Edit Data Anggota:
 * - SUPER_ADMIN & ADMIN_DPW: Penuh ke seluruh anggota se-Sulut.
 * - ADMIN_DPD: Berhak mengedit seluruh kader di DPD wilayahnya (semua DPC & DPRt).
 * - ADMIN_DPC: Berhak mengedit seluruh kader di DPC kecamatannya (semua DPRt rantingnya).
 * - ADMIN_DPRT: Berhak mengedit kader di DPRt desa/kelurahannya.
 * - ANGGOTA (Kader Biasa): TIDAK BISA mengedit kader lain di database (hanya profil sendiri di Portal).
 */
export function canEditMember(session?: UserSession, member?: Member | null): boolean {
  if (!session || !member) return false;
  if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') return true;
  if (session.role === 'ANGGOTA') return false;

  if (session.role === 'ADMIN_DPD') {
    return isDpdMatch(member.dpd, session.dpdAccess);
  }
  if (session.role === 'ADMIN_DPC') {
    return isDpdMatch(member.dpd, session.dpdAccess) && isDpcMatch(member.dpc, session.dpcAccess);
  }
  if (session.role === 'ADMIN_DPRT') {
    return (
      isDpdMatch(member.dpd, session.dpdAccess) &&
      isDpcMatch(member.dpc, session.dpcAccess) &&
      isDprtMatch(member.dprt, session.dprtAccess)
    );
  }

  return false;
}

/**
 * Hak Akses Hapus Langsung Anggota (Direct Delete) & Persetujuan Permohonan Hapus:
 * HANYA Super Admin dan Admin DPW yang memiliki wewenang menghapus data kader secara langsung
 * maupun menyetujui/menolak permohonan penghapusan dari DPD, DPC, dan DPRt.
 * Pengurus DPD, DPC, dan DPRt harus melalui prosedur 'Ajukan Permohonan Hapus' ke DPW.
 */
export function canDirectDeleteMember(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
}

export function canApproveDeletionRequest(session?: UserSession): boolean {
  if (!session) return false;
  return session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
}

/**
 * Hak Akses Mengubah Status Keanggotaan:
 * Sama dengan hak edit: Super Admin, Admin DPW (seluruh Sulut), dan Admin DPD/DPC/DPRt di wilayahnya masing-masing.
 */
export function canChangeMemberStatus(session?: UserSession, member?: Member | null): boolean {
  return canEditMember(session, member);
}

/**
 * Hak Akses Mengajukan Penghapusan:
 * Admin DPD, DPC, DPRt yang berwenang di wilayah tersebut (bukan Super Admin/Admin DPW karena mereka sudah direct delete).
 */
export function canRequestDeleteMember(session?: UserSession, member?: Member | null): boolean {
  if (!session || !member) return false;
  if (canDirectDeleteMember(session)) return false;
  return canEditMember(session, member);
}
