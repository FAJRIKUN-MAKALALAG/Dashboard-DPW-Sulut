export type MemberStatus =
  | 'Aktif'
  | 'Non-Aktif (Meninggal)'
  | 'Non-Aktif (Pindah Partai/Mundur)'
  | 'Non-Aktif (Pindah Domisili)';

export interface Member {
  id?: string; // Primary key penugasan unik (e.g. NIK_TINGKAT_DPC)
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
  // Atribusi Ketua Langsung (Hierarkis berdasarkan struktur organisasi)
  ketuaLangsungNik?: string;
  ketuaLangsungNama?: string;
  ketuaLangsungJabatan?: string;
  ketuaLangsungTingkat?: string;
  // Urutan tampil dalam matriks (sesuai urutan baris berkas Excel saat import)
  urutan?: number;
  // Daftar jabatan struktural yang diemban kader (1 orang bisa menduduki >1 jabatan)
  positions?: MemberPosition[];
}

export interface MemberPosition {
  id: string;
  tingkatKepengurusan: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  dpd: string;
  dpc?: string;
  dprt?: string;
  wilayahPenugasan?: string;
  jabatan?: string;
  nomorSK?: string;
  tanggalSK?: string;
  urutan?: number;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_DPW' | 'ADMIN_DPD' | 'ADMIN_DPC' | 'ADMIN_DPRT';

export interface UserSession {
  role: UserRole;
  dpdAccess: string; // 'ALL' for Super Admin / DPW or specific DPD name
  dpcAccess?: string; // specific DPC (Kecamatan) name or undefined
  dprtAccess?: string; // specific DPRt (Kelurahan/Desa) name or undefined
  adminName: string;
  adminNik?: string;
  jabatan: string;
}

export interface AppUser {
  id: string;
  memberNik?: string;
  nomorEkta?: string;
  username: string; // NIK, E-KTA, atau custom username
  password?: string;
  fullName: string;
  role: UserRole;
  dpdAccess: string; // 'ALL' atau nama DPD
  dpcAccess?: string; // 'ALL' atau nama DPC
  dprtAccess?: string; // 'ALL' atau nama DPRt
  jabatan?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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

// ---------------- Fitur Kode Referral & Tracking ----------------
export interface DirectLeaderInfo {
  nik: string;
  nama: string;
  jabatan: string;
  tingkat: string;
  kodeReferral?: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  error?: string;
  recruiter?: {
    nik: string;
    namaLengkap: string;
    jabatan: string;
    tingkatKepengurusan: string;
    dpd: string;
    dpc: string;
    dprt: string;
    kodeReferral: string;
  };
  directLeader?: DirectLeaderInfo;
}

export interface MyReferralProfile {
  isMemberLinked: boolean;
  kodeReferral: string;
  namaLengkap: string;
  nik: string;
  nomorEkta?: string;
  jabatan: string;
  tingkatKepengurusan: string;
  dpd: string;
  dpc: string;
  dprt: string;
  ketuaLangsung: DirectLeaderInfo | null;
  totalRecruits: number;
}

export interface ReferralLeaderboardEntry {
  nama: string;
  jabatan: string;
  kodeReferral: string;
  dpd: string;
  totalRekrut: number;
}

export interface ReferralTrackingData {
  myStats: {
    kodeReferral: string;
    totalDirect: number;
    totalTeam: number;
    isLeader: boolean;
  };
  myRecruits: Member[];
  teamRecruits: Member[];
  leaderboard: ReferralLeaderboardEntry[];
}

