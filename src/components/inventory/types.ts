export type InventoryCategory =
  | 'Furnitur & Mebel'
  | 'Elektronik & IT'
  | 'Audio & Perlengkapan Acara'
  | 'Logistik & Atribut'
  | 'Alat Tulis & Dokumen'
  | 'Kendaraan & Operasional';

export type InventoryCondition = 'Baik' | 'Perlu Perbaikan' | 'Rusak';

export interface InventoryItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  lantai: number; // 1 | 2 | 3 | 4 | 5
  ruangan: string;
  jumlah: number;
  jumlahBaik: number;
  jumlahPerbaikan: number;
  jumlahRusak: number;
  satuan: string;
  kondisi: InventoryCondition;
  merkSpesifikasi: string;
  keterangan: string;
  penanggungJawab: string;
  fotoUrl: string;
  diubahOleh?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FloorMetadata {
  lantai: number;
  label: string;
  shortTitle: string;
  fullTitle: string;
  description: string;
  defaultRooms: string[];
}

export const DPW_FLOORS: FloorMetadata[] = [
  {
    lantai: 1,
    label: 'Lantai 1',
    shortTitle: 'Lobi & Pelayanan',
    fullTitle: 'Lantai 1 — Lobi Utama, Resepsionis & Pelayanan e-KTA',
    description: 'Area penerima tamu, loket registrasi kader, dan pusat layanan scan KTP / cetak e-KTA.',
    defaultRooms: [
      'Lobi & Resepsionis',
      'Ruang Pelayanan e-KTA',
      'Ruang Tunggu Tamu',
      'Pos Keamanan Dalam',
    ],
  },
  {
    lantai: 2,
    label: 'Lantai 2',
    shortTitle: 'Sekretariat & Bappilu',
    fullTitle: 'Lantai 2 — Sekretariat Administrasi & Ruang Bappilu',
    description: 'Pusat kerja staf administrasi DPW, pengelolaan berkas SK wilayah, dan ruang kerja Bappilu.',
    defaultRooms: [
      'Ruang Sekretariat & Administrasi',
      'Ruang Bappilu & Data',
      'Ruang Rapat Koordinasi Lt. 2',
      'Ruang Arsip Dokumen',
    ],
  },
  {
    lantai: 3,
    label: 'Lantai 3',
    shortTitle: 'Ruang Pimpinan DPW',
    fullTitle: 'Lantai 3 — Ruang Ketua, Sekretaris, Bendahara & Rapat Eksekutif',
    description: 'Ruang kerja jajaran pimpinan utama DPW Sulut serta ruang rapat pleno terbatas.',
    defaultRooms: [
      'Ruang Ketua & Sekretaris DPW',
      'Ruang Bendahara DPW',
      'Ruang Rapat Pimpinan',
      'Ruang Tamu VIP',
    ],
  },
  {
    lantai: 4,
    label: 'Lantai 4',
    shortTitle: 'Aula Pertemuan',
    fullTitle: 'Lantai 4 — Aula Serbaguna, Konsolidasi & Pelatihan Kader',
    description: 'Hall utama untuk konsolidasi akbar, pendidikan politik, bimtek saksi, dan acara partai.',
    defaultRooms: [
      'Aula Utama Lantai 4',
      'Panggung Aula Lantai 4',
      'Ruang Kontrol Audio Lantai 4',
      'Area Persiapan Konsumsi',
    ],
  },
  {
    lantai: 5,
    label: 'Lantai 5',
    shortTitle: 'Media & Gudang',
    fullTitle: 'Lantai 5 — Media Center, Publikasi Digital & Gudang Logistik',
    description: 'Studio produksi konten media sosial, ruang humas, dan gudang atribut/bendera partai.',
    defaultRooms: [
      'Gudang Logistik Lantai 5',
      'Ruang Media & Publikasi',
      'Studio Podcast & Dokumentasi',
      'Area Teknis & Utilitas Atap',
    ],
  },
];

export const INVENTORY_CATEGORIES: string[] = [
  'Furnitur & Mebel',
  'Elektronik & IT',
  'Audio & Perlengkapan Acara',
  'Logistik & Atribut',
  'Alat Tulis & Dokumen',
  'Kendaraan & Operasional',
];

export const INVENTORY_UNITS: string[] = ['Unit', 'Set', 'Buah', 'Pcs', 'Paket', 'Pasang', 'Lembar'];

// Data dummy dihapus sepenuhnya agar sistem siap digunakan untuk pencatatan riil
export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [];
