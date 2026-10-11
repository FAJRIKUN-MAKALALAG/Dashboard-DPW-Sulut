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
  dpd: string; // Kabupaten / Kota in Sulut
  dpc: string; // Kecamatan
  dprt: string; // Kelurahan / Desa
  jabatan: string; // Jabatan di partai
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
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_DPD';

export interface UserSession {
  role: UserRole;
  dpdAccess: string; // 'ALL' for Super Admin or specific DPD name
  adminName: string;
  jabatan: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  memberNik: string;
  memberName: string;
  action: 'STATUS_CHANGE' | 'CREATE' | 'IMPORT_MASSAL' | 'UPDATE';
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
