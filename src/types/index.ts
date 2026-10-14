export type MemberStatus =
  | 'Aktif'
  | 'Non-Aktif (Meninggal)'
  | 'Non-Aktif (Pindah Partai/Mundur)'
  | 'Non-Aktif (Pindah Domisili)';

export interface Member {
  nik: string; // 16 digit unique
  nomorEKTA: string; // e.g. KT-7101-2024-XXXX or ND-71XX-2024-XXXX
  namaLengkap: string;
  nomorHP: string;
  email?: string;
  sosmed?: string; // Instagram / Facebook / TikTok / X
  dpd: string; // Domisili Alamat KTP: Kabupaten / Kota in Sulut
  dpc: string; // Domisili Alamat KTP: Kecamatan
  dprt: string; // Domisili Alamat KTP: Kelurahan / Desa
  
  // Wilayah Penugasan Struktural & SK
  isPengurus?: boolean; // true = Pengurus Struktural (Punya SK & Kode Referral), false = Anggota Biasa
  tingkatKepengurusan?: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus';
  wilayahPenugasan?: string; // e.g. 'DPW Sulut', 'DPD Minahasa Selatan', 'DPC Amurang', 'DPRt Ranomeida'
  nomorSK?: string; // Nomor Surat Keputusan (SK)
  tanggalSK?: string; // Tanggal Terbit SK YYYY-MM-DD
  kodeReferral?: string; // Kode referral unik khusus pengurus (e.g. REF-DPW-001)

  jabatan: string; // Jabatan spesifik di partai (Ketua, Sekretaris, Bendahara, Anggota, dll)
  status: MemberStatus;
  tanggalBergabung: string; // YYYY-MM-DD
  catatanMutasi?: string;
  terakhirDiubah?: string;
  diubahOleh?: string;
  fotoProfilUrl?: string; // Base64 data URL or photo URL
  fotoKtpUrl?: string; // Base64 data URL or KTP card scan
  jenisKelamin?: 'Laki-laki' | 'Perempuan';
  tempatLahir?: string;
  tanggalLahir?: string;
  alamatLengkap?: string;
  agama?: string;
  pekerjaan?: string;
  statusKtpVerified?: boolean;
  // Kader Pengusung / Perekrut (Referal Anggota Baru)
  kaderPerekrutNama?: string;
  kaderPerekrutNik?: string;
  kaderPerekrutEkta?: string;
  kaderPerekrutJabatan?: string;
  kaderPerekrutDpd?: string;
  kaderPerekrutKodeReferral?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_DPD' | 'ADMIN_DPC' | 'ADMIN_DPRT';

export interface UserSession {
  role: UserRole;
  dpdAccess: string; // 'ALL' for Super Admin or specific DPD name
  dpcAccess?: string; // specific DPC (Kecamatan) name or undefined
  dprtAccess?: string; // specific DPRt (Kelurahan/Desa) name or undefined
  adminName: string;
  jabatan: string;
}

export type DeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DeletionRequest {
  id: string;
  memberNik: string;
  memberName: string;
  memberNomorEKTA: string;
  dpd: string;
  dpc: string;
  dprt: string;
  statusMember: MemberStatus;
  requestedByRole: UserRole;
  requestedByName: string;
  requestedAt: string; // YYYY-MM-DD HH:mm
  reason: string; // Pernyataan & alasan resmi pengajuan hapus
  status: DeletionRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  memberNik: string;
  memberName: string;
  action: 'STATUS_CHANGE' | 'CREATE' | 'IMPORT_MASSAL' | 'UPDATE' | 'DELETE' | 'DELETE_REQUEST';
  previousStatus?: MemberStatus;
  newStatus?: MemberStatus;
  reason: string;
  actor: string;
  dpd: string;
}

export interface SulutRegion {
  id: string;
  name: string;
  type: 'Kota' | 'Kabupaten';
  zone: 'Daratan Minahasa' | 'BMR' | 'Kepulauan';
  capital: string;
  subdistricts: {
    name: string;
    villages: string[];
  }[];
}
