import { UserSession } from '../types';

export interface AuthAccount {
  id: string;
  username: string; // Bisa NIK atau username
  nik?: string;
  password: string; // Password login
  session: UserSession;
  label: string;
  badge: string;
  description: string;
}

export const DUMMY_ACCOUNTS: AuthAccount[] = [
  {
    id: 'acc-superadmin-utama',
    username: '7106033003050001',
    nik: '7106033003050001',
    password: 'NasDem15',
    label: 'Super Admin Utama',
    badge: 'Super Administrator',
    description: 'Akses tertinggi sistem: kontrol penuh 15 DPD se-Sulut, approval hapus data, SQL editor, dan manajemen akun.',
    session: {
      role: 'SUPER_ADMIN',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Super Admin Utama NasDem',
      adminNik: '7106033003050001',
      jabatan: 'Super Admin DPW Partai NasDem Sulut',
    },
  },
  {
    id: 'acc-dpw',
    username: 'admin.dpw',
    nik: '7100000000000001',
    password: 'NasDem15',
    label: 'Admin DPW Sulut',
    badge: 'Tingkat Provinsi',
    description: 'Akses tingkat provinsi: kelola kepengurusan DPW & DPD se-Sulut, dan permohonan persetujuan.',
    session: {
      role: 'ADMIN_DPW',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Sekretariat DPW NasDem Sulut',
      adminNik: '7100000000000001',
      jabatan: 'Admin Sekretariat DPW Sulut',
    },
  },
  {
    id: 'acc-dpd-minsel',
    username: 'admin.minsel',
    password: 'nasdem123',
    label: 'Admin DPD Minahasa Selatan',
    badge: 'Tingkat Kab/Kota',
    description: 'Akses terkunci hanya pada wilayah Kabupaten Minahasa Selatan. Wilayah lain disembunyikan.',
    session: {
      role: 'ADMIN_DPD',
      dpdAccess: 'Kabupaten Minahasa Selatan',
      adminName: 'Admin DPD NasDem Minahasa Selatan',
      jabatan: 'Sekretariat DPD NasDem Kab. Minsel',
    },
  },
  {
    id: 'acc-dpc-amurang',
    username: 'admin.amurang',
    password: 'nasdem123',
    label: 'Admin DPC Amurang',
    badge: 'Tingkat Kecamatan',
    description: 'Akses terkunci pada Kec. Amurang (Kab. Minsel). Input hanya fokus pada desa/kelurahan (DPRt).',
    session: {
      role: 'ADMIN_DPC',
      dpdAccess: 'Kabupaten Minahasa Selatan',
      dpcAccess: 'Amurang',
      adminName: 'Admin DPC NasDem Kec. Amurang',
      jabatan: 'Pengurus DPC NasDem Amurang (Minsel)',
    },
  },
  {
    id: 'acc-dprt-buyungon',
    username: 'admin.buyungon',
    password: 'nasdem123',
    label: 'Admin DPRt Buyungon',
    badge: 'Tingkat Kelurahan/Desa',
    description: 'Akses basis terkunci hanya pada Kelurahan Buyungon. Seluruh dropdown teritorial otomatis terisi.',
    session: {
      role: 'ADMIN_DPRT',
      dpdAccess: 'Kabupaten Minahasa Selatan',
      dpcAccess: 'Amurang',
      dprtAccess: 'Buyungon',
      adminName: 'Admin DPRt NasDem Buyungon',
      jabatan: 'Pengurus DPRt NasDem Buyungon (Amurang)',
    },
  },
];
