import { Member, AuditLog, DeletionRequest, AppUser, DeletionRequestStatus, UserRole } from '../types';
import { mapDbRowToMember } from './mappers';

/** kolom database -> nama field JSON dari backend (camelCase) */
const MEMBER_DB_TO_API: Record<string, string> = {
  nik: 'nik',
  nomor_ekta: 'nomorEKTA',
  nama_lengkap: 'namaLengkap',
  nomor_hp: 'nomorHP',
  email: 'email',
  sosmed: 'sosmed',
  dpd: 'dpd',
  dpc: 'dpc',
  dprt: 'dprt',
  is_pengurus: 'isPengurus',
  tingkat_kepengurusan: 'tingkatKepengurusan',
  wilayah_penugasan: 'wilayahPenugasan',
  nomor_sk: 'nomorSK',
  tanggal_sk: 'tanggalSK',
  kode_referral: 'kodeReferral',
  jabatan: 'jabatan',
  status: 'status',
  tanggal_bergabung: 'tanggalBergabung',
  catatan_mutasi: 'catatanMutasi',
  terakhir_diubah: 'terakhirDiubah',
  diubah_oleh: 'diubahOleh',
  foto_profil_url: 'fotoProfilUrl',
  foto_ktp_url: 'fotoKtpUrl',
  jenis_kelamin: 'jenisKelamin',
  tempat_lahir: 'tempatLahir',
  tanggal_lahir: 'tanggalLahir',
  alamat_lengkap: 'alamatLengkap',
  agama: 'agama',
  pekerjaan: 'pekerjaan',
  status_ktp_verified: 'statusKtpVerified',
  kader_perekrut_nama: 'kaderPerekrutNama',
  kader_perekrut_nik: 'kaderPerekrutNik',
  kader_perekrut_ekta: 'kaderPerekrutEkta',
  kader_perekrut_jabatan: 'kaderPerekrutJabatan',
  kader_perekrut_kode_referral: 'kaderPerekrutKodeReferral',
  ketua_langsung_nik: 'ketuaLangsungNik',
  ketua_langsung_nama: 'ketuaLangsungNama',
  ketua_langsung_jabatan: 'ketuaLangsungJabatan',
  ketua_langsung_tingkat: 'ketuaLangsungTingkat',
  urutan: 'urutan',
};

/**
 * Item anggota dari backend (camelCase) -> Member.
 * Dilewatkan ke mapDbRowToMember agar logika deteksi pengurus / normalisasi wilayah tetap sama.
 */
export function mapApiMember(item: any): Member {
  const row: Record<string, any> = {};
  Object.entries(MEMBER_DB_TO_API).forEach(([dbKey, apiKey]) => {
    if (item[apiKey] !== undefined) row[dbKey] = item[apiKey];
  });
  const m = mapDbRowToMember(row);
  if (Array.isArray(item.positions)) {
    m.positions = item.positions;
  }
  return m;
}

const formatTime = (ts?: string | null): string => {
  if (!ts) return '';
  return ts.includes('T') ? ts.replace('T', ' ').substring(0, 16) : ts;
};

export function mapApiAuditLog(item: any): AuditLog {
  return {
    id: String(item.id),
    timestamp: formatTime(item.timestamp) || formatTime(new Date().toISOString()),
    memberNik: item.memberNik || '',
    memberName: item.memberName || '',
    action: item.action || 'UPDATE',
    previousStatus: item.previousStatus || undefined,
    newStatus: item.newStatus || undefined,
    reason: item.reason || '',
    actor: item.actor || 'Admin',
    dpd: item.dpd || 'Sulawesi Utara',
  };
}

export function mapApiDeletionRequest(item: any): DeletionRequest {
  return {
    id: String(item.id),
    memberNik: item.memberNik || '',
    memberName: item.memberName || '',
    memberNomorEKTA: item.memberNik || '',
    dpd: item.dpd || '',
    dpc: item.dpc || '',
    dprt: item.dprt || '',
    statusMember: 'Aktif',
    requestedByRole: 'ADMIN_DPD',
    requestedByName: item.requestedByName || 'Admin Daerah',
    requestedAt: formatTime(item.requestedAt) || formatTime(new Date().toISOString()),
    reason: item.reason || '',
    status: (item.status as DeletionRequestStatus) || 'PENDING',
    reviewedBy: item.reviewedBy || undefined,
    reviewedAt: item.reviewedAt ? formatTime(item.reviewedAt) : undefined,
    reviewNotes: item.reviewNotes || undefined,
  };
}

/** Password tidak pernah dikirim backend, sehingga selalu string kosong. */
export function mapApiUser(item: any): AppUser {
  return {
    id: String(item.id),
    memberNik: item.memberNik || undefined,
    nomorEkta: item.nomorEkta || undefined,
    username: item.username || '',
    password: '',
    fullName: item.fullName || '',
    role: (item.role as UserRole) || 'ADMIN_DPD',
    dpdAccess: item.dpdAccess || 'ALL',
    dpcAccess: item.dpcAccess || 'ALL',
    dprtAccess: item.dprtAccess || 'ALL',
    jabatan: item.jabatan || '',
    isActive: item.isActive ?? true,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
