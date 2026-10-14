import { UserSession } from '../types';

export interface AuthAccount {
  id: string;
  username: string;
  password: string; // Dummy password for verification
  session: UserSession;
  label: string;
  badge: string;
  description: string;
}

export const DUMMY_ACCOUNTS: AuthAccount[] = [
  {
    id: 'acc-dpw',
    username: 'superadmin.dpw',
    password: 'nasdem123',
    label: 'Super Admin DPW Sulut',
    badge: 'Tingkat Provinsi',
    description: 'Akses penuh ke 15 Kabupaten/Kota, monitoring peta se-Sulut, dan hak persetujuan hapus data.',
    session: {
      role: 'SUPER_ADMIN',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Bappilu & OKK DPW NasDem Sulut',
      jabatan: 'Super Admin DPW Partai NasDem Sulut',
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
