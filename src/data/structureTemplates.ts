export interface PositionSlot {
  no: number;
  subOrg: string; // e.g. 'DEWAN PIMPINAN WILAYAH', 'I. DEWAN PERTIMBANGAN', 'II. DEWAN PAKAR', 'III. DEWAN PIMPINAN DAERAH'
  jabatan: string;
}

// 1. TEMPLATE STRUKTUR DPW (Sulawesi Utara)
export const DPW_STRUCTURE_TEMPLATE: PositionSlot[] = [
  // DEWAN PIMPINAN WILAYAH
  { no: 1, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Ketua' },
  { no: 2, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pemenangan Pemilu' },
  { no: 3, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Organisasi dan Keanggotaan' },
  { no: 4, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Kaderisasi dan Pendidikan Politik' },
  { no: 5, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Hubungan Legislatif' },
  { no: 6, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Hubungan Eksekutif' },
  { no: 7, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Hubungan Sayap dan Badan' },
  { no: 8, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas' },
  { no: 9, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pemilih Pemula dan Milenial' },
  { no: 10, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Digital dan Siber' },
  { no: 11, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Media dan Komunikasi Publik' },
  { no: 12, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Ekonomi' },
  { no: 13, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah' },
  { no: 14, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Agama dan Masyarakat Adat' },
  { no: 15, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Tenaga Kerja' },
  { no: 16, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Kesehatan' },
  { no: 17, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Perempuan dan Anak' },
  { no: 18, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pendidikan dan Kebudayaan' },
  { no: 19, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Hukum dan Hak Asasi Manusia' },
  { no: 20, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pariwisata dan Industri Kreatif' },
  { no: 21, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa' },
  { no: 22, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Maritim' },
  { no: 23, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pemuda dan Olahraga' },
  { no: 24, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Energi dan Mineral' },
  { no: 25, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Lingkungan Hidup' },
  { no: 26, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang' },
  { no: 27, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Migran' },
  { no: 28, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Ketua Bidang Pembangunan dan Infrastruktur' },
  { no: 29, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Sekretaris' },
  { no: 30, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis' },
  { no: 31, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Sekretaris Bidang Ideologi, Organisasi dan Kaderisasi' },
  { no: 32, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Sekretaris Bidang Pemenangan Pemilu' },
  { no: 33, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Sekretaris Bidang Umum dan Administrasi' },
  { no: 34, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Bendahara' },
  { no: 35, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Bendahara Pengelolaan Dana dan Aset' },
  { no: 36, subOrg: 'DEWAN PIMPINAN WILAYAH', jabatan: 'Wakil Bendahara Penggalangan Dana' },

  // DEWAN PERTIMBANGAN WILAYAH
  { no: 1, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Ketua' },
  { no: 2, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 4, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 5, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 6, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 7, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Sekretaris' },
  { no: 8, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Sekretaris' },
  { no: 9, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Wakil Sekretaris' },
  { no: 10, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },
  { no: 11, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },
  { no: 12, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },
  { no: 13, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },
  { no: 14, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },
  { no: 15, subOrg: 'DEWAN PERTIMBANGAN WILAYAH', jabatan: 'Anggota' },

  // DEWAN PAKAR WILAYAH
  { no: 1, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Ketua' },
  { no: 2, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 4, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 5, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 6, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Ketua' },
  { no: 7, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Sekretaris' },
  { no: 8, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Sekretaris' },
  { no: 9, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Wakil Sekretaris' },
  { no: 10, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 11, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 12, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 13, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 14, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 15, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 16, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 17, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 18, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' },
  { no: 19, subOrg: 'DEWAN PAKAR WILAYAH', jabatan: 'Anggota' }
];

// 2. TEMPLATE STRUKTUR DPD (15 Kabupaten/Kota)
export const DPD_STRUCTURE_TEMPLATE: PositionSlot[] = [
  // I. DEWAN PERTIMBANGAN DAERAH
  { no: 1, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Ketua' },
  { no: 2, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Sekretaris' },
  { no: 4, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Anggota' },

  // II. DEWAN PAKAR DAERAH
  { no: 1, subOrg: 'II. DEWAN PAKAR', jabatan: 'Ketua' },
  { no: 2, subOrg: 'II. DEWAN PAKAR', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'II. DEWAN PAKAR', jabatan: 'Sekretaris' },
  { no: 4, subOrg: 'II. DEWAN PAKAR', jabatan: 'Anggota' },

  // III. DEWAN PIMPINAN DAERAH
  { no: 1, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Ketua' },
  { no: 2, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pemenangan Pemilu' },
  { no: 3, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Organisasi dan Keanggotaan' },
  { no: 4, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Kaderisasi dan Pendidikan Politik' },
  { no: 5, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Hubungan Legislatif' },
  { no: 6, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Hubungan Eksekutif' },
  { no: 7, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Hubungan Sayap dan Badan' },
  { no: 8, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas' },
  { no: 9, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pemilih Pemula dan Milenial' },
  { no: 10, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Digital dan Siber' },
  { no: 11, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Media dan Komunikasi Publik' },
  { no: 12, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah (UMKM)' },
  { no: 13, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Ekonomi' },
  { no: 14, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Agama dan Masyarakat Adat' },
  { no: 15, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Tenaga Kerja' },
  { no: 16, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Kesehatan' },
  { no: 17, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Perempuan dan Anak' },
  { no: 18, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pendidikan dan Kebudayaan' },
  { no: 19, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Hukum dan Hak Asasi Manusia' },
  { no: 20, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pariwisata dan Industri Kreatif' },
  { no: 21, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Maritim' },
  { no: 22, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pemuda dan Olahraga' },
  { no: 23, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa' },
  { no: 24, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Lingkungan Hidup' },
  { no: 25, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Energi dan Mineral' },
  { no: 26, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang' },
  { no: 27, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Migran' },
  { no: 28, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Ketua Bidang Pembangunan dan Infrastruktur' },
  { no: 29, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Sekretaris' },
  { no: 30, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis' },
  { no: 31, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Sekretaris Bidang Ideologi, Organisasi dan Kaderisasi' },
  { no: 32, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Sekretaris Bidang Pemenangan Pemilu' },
  { no: 33, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Sekretaris Bidang Umum dan Administrasi' },
  { no: 34, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Bendahara' },
  { no: 35, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Bendahara Pengelolaan Dana dan Aset' },
  { no: 36, subOrg: 'III. DEWAN PIMPINAN DAERAH', jabatan: 'Wakil Bendahara Penggalangan Dana' },
];

// 3. TEMPLATE STRUKTUR DPC (Kecamatan)
export const DPC_STRUCTURE_TEMPLATE: PositionSlot[] = [
  // I. DEWAN PERTIMBANGAN CABANG
  { no: 1, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Ketua' },
  { no: 2, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Sekretaris' },
  { no: 4, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Anggota' },

  // II. DEWAN PAKAR CABANG
  { no: 1, subOrg: 'II. DEWAN PAKAR', jabatan: 'Ketua' },
  { no: 2, subOrg: 'II. DEWAN PAKAR', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'II. DEWAN PAKAR', jabatan: 'Sekretaris' },
  { no: 4, subOrg: 'II. DEWAN PAKAR', jabatan: 'Anggota' },

  // III. DEWAN PIMPINAN CABANG
  { no: 1, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Ketua' },
  { no: 2, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Pemilihan Umum' },
  { no: 3, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Organisasi dan Keanggotaan' },
  { no: 4, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah (UMKM)' },
  { no: 5, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Agama dan Adat' },
  { no: 6, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Kesehatan' },
  { no: 7, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Pariwisata dan Industri Kreatif' },
  { no: 8, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Perempuan dan Anak' },
  { no: 9, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa' },
  { no: 10, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang' },
  { no: 11, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Pemuda dan Olahraga' },
  { no: 12, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Migrasi' },
  { no: 13, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Ketua Bidang Pembangunan dan Infrastruktur' },
  { no: 14, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Sekretaris' },
  { no: 15, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Sekretaris' },
  { no: 16, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Bendahara' },
  { no: 17, subOrg: 'III. DEWAN PIMPINAN CABANG', jabatan: 'Wakil Bendahara' }
];

// 4. TEMPLATE STRUKTUR DPRt (Kelurahan/Desa)
export const DPRT_STRUCTURE_TEMPLATE: PositionSlot[] = [
  { no: 1, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Ketua' },
  { no: 2, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Wakil Ketua' },
  { no: 3, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Sekretaris' },
  { no: 4, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Wakil Sekretaris' },
  { no: 5, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Bendahara' },
  { no: 6, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Wakil Bendahara' },
  { no: 7, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Seksi Organisasi, Keanggotaan & Kaderisasi' },
  { no: 8, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Seksi Pemenangan Pemilu' },
  { no: 9, subOrg: 'DEWAN PIMPINAN RANTING', jabatan: 'Seksi Penggalangan Komunitas & Saksi TPS' }
];

export function getStructureTemplate(tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt'): PositionSlot[] {
  switch (tingkat) {
    case 'DPW':
      return DPW_STRUCTURE_TEMPLATE;
    case 'DPD':
      return DPD_STRUCTURE_TEMPLATE;
    case 'DPC':
      return DPC_STRUCTURE_TEMPLATE;
    case 'DPRt':
      return DPRT_STRUCTURE_TEMPLATE;
    default:
      return DPD_STRUCTURE_TEMPLATE;
  }
}
