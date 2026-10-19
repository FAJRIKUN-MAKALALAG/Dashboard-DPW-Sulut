import * as XLSX from 'xlsx';
import { Member } from '../types';
import {
  getStructureTemplate,
  PositionSlot,
  DPD_STRUCTURE_TEMPLATE,
  DPW_STRUCTURE_TEMPLATE,
} from '../data/structureTemplates';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch } from './structureReadinessUtils';
import { isJobTitleMatch, normalizeSubOrgName } from './jobMatchingUtils';
import { GridRowItem } from '../components/matrix';

export interface TerritoryContext {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  dpd: string;
  dpc?: string;
  dprt?: string;
}

export interface ParsedTerritoryRow {
  no: number;
  dpd?: string;
  subOrg: string;
  jabatanExcel: string;
  jabatanMatched?: string;
  isMatched: boolean;
  namaLengkap: string;
  nik: string;
  nomorEKTA: string;
  jenisKelamin: string;
  nomorHP: string;
  email: string;
  alamat?: string;
  status: string;
  isFilled: boolean;
}

export interface ParseTerritoryExcelResult {
  territoryContext: TerritoryContext;
  rows: ParsedTerritoryRow[];
  membersToSave: Member[];
  stats: {
    totalRows: number;
    filledRows: number;
    emptyRows: number;
    matchedPositions: number;
    customPositions: number;
  };
  filename: string;
}

/**
 * 1. Mendapatkan nama berkas Excel yang bersih dan deskriptif
 */
export function getTerritoryFilename(ctx: TerritoryContext, prefix = 'TEMPLATE_PENGURUS'): string {
  const clean = (s?: string) => (s || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  if (ctx.level === 'DPW') {
    return `${prefix}_DPW_SULAWESI_UTARA.xlsx`;
  }
  if (ctx.level === 'DPD') {
    return `${prefix}_DPD_${clean(ctx.dpd)}.xlsx`;
  }
  if (ctx.level === 'DPC') {
    return `${prefix}_DPC_${clean(ctx.dpd)}_KEC_${clean(ctx.dpc)}.xlsx`;
  }
  return `${prefix}_DPRT_${clean(ctx.dpd)}_${clean(ctx.dpc)}_DESA_${clean(ctx.dprt)}.xlsx`;
}

/**
 * Menyimpan dan mendownload berkas Excel secara langsung ke browser pengguna
 * Menggunakan direct Blob URL yang 100% kompatibel dan handal di semua browser.
 */
export function saveWorkbookToExcel(wb: XLSX.WorkBook, filename: string): void {
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 250);
  } catch (err) {
    console.warn('Fallback XLSX.writeFile:', err);
    XLSX.writeFile(wb, filename);
  }
}

/**
 * 2. Menghasilkan dan mendownload Template Excel khusus untuk wilayah terpilih
 * Template sudah otomatis berisi daftar seluruh slot jabatan resmi partai NasDem
 * sehingga pengguna hanya perlu mengisi Nama Lengkap dan NIK tanpa repot mengetik satu per satu.
 */
export function downloadTerritorialExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const slots: PositionSlot[] = getStructureTemplate(ctx.level);

  // Buat label wilayah yang jelas
  const territoryTitle =
    ctx.level === 'DPW'
      ? 'PROVINSI SULAWESI UTARA'
      : ctx.level === 'DPD'
      ? `${ctx.dpd.toUpperCase()}`
      : ctx.level === 'DPC'
      ? `KECAMATAN ${ctx.dpc?.toUpperCase() || '-'} - ${ctx.dpd.toUpperCase()}`
      : `DESA/KELURAHAN ${ctx.dprt?.toUpperCase() || '-'} - KEC. ${ctx.dpc?.toUpperCase() || '-'} (${ctx.dpd.toUpperCase()})`;

  // Data Sheet 1: Formulir Pengisian
  const sheetData: (string | number)[][] = [
    ['FORMULIR RESMI INPUT SUSUNAN PENGURUS PARTAI NASDEM SULUT'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    [
      'PANDUAN PENGISIAN: Cukup isi kolom Nama Lengkap dan NIK. Baris jabatan resmi sudah disiapkan secara otomatis. Anda juga dapat menambahkan baris baru di bawah tabel jika ada pengurus tambahan.',
    ],
    [], // Baris kosong pemisah
    [
      'No',
      'Sub Organisasi',
      'Jabatan Pengurus',
      'Nama Lengkap (dan Gelar)',
      'Nomor NIK (KTP)',
      'Nomor E-KTA NasDem',
      'Jenis Kelamin (L/P)',
      'No. WhatsApp / HP',
      'Email',
      'Alamat Lengkap',
      'Status',
    ],
  ];

  // Gunakan baris saat ini (jika ada data yang sudah terisi di matriks) atau template kosong resmi
  if (currentRows && currentRows.length > 0) {
    currentRows.forEach((r, idx) => {
      sheetData.push([
        idx + 1,
        r.subOrg || `DEWAN PIMPINAN ${ctx.level}`,
        r.jabatan || 'Pengurus',
        r.namaLengkap || '',
        r.nik && !r.nik.startsWith('71002026') ? r.nik : '',
        r.nomorEKTA && !r.nomorEKTA.startsWith('71002026') ? r.nomorEKTA : '',
        '',
        r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
        r.email || '',
        '',
        'Aktif',
      ]);
    });
  } else {
    // Isi otomatis dari template resmi
    slots.forEach((s, idx) => {
      sheetData.push([
        idx + 1,
        s.subOrg,
        s.jabatan,
        '', // Kosong untuk diisi user
        '',
        '',
        '',
        '',
        '',
        '',
        'Aktif',
      ]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Setting lebar kolom agar nyaman dilihat dan dibaca pengguna
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Sub Organisasi
    { wch: 38 }, // Jabatan Pengurus
    { wch: 38 }, // Nama Lengkap
    { wch: 22 }, // NIK
    { wch: 22 }, // E-KTA
    { wch: 18 }, // Jenis Kelamin
    { wch: 22 }, // No WA
    { wch: 28 }, // Email
    { wch: 32 }, // Alamat
    { wch: 12 }, // Status
  ];

  // Sheet 2: Panduan & Informasi Wilayah
  const infoData = [
    ['INFORMASI DAN PANDUAN PENGISIAN STRUKTUR WILAYAH'],
    ['================================================='],
    ['Tingkat Kepengurusan', ctx.level],
    ['Kabupaten / Kota (DPD)', ctx.dpd],
    ['Kecamatan (DPC)', ctx.dpc || '-'],
    ['Desa / Kelurahan (DPRt)', ctx.dprt || '-'],
    ['Total Posisi Template Resmi', slots.length],
    [],
    ['TIPS DAN KETENTUAN PENGISIAN:'],
    ['1. Kolom Nama Lengkap: Boleh menyertakan gelar akademik (contoh: PAULMAN S. RUNTUWENE, S.T., M.M.).'],
    ['2. Kolom NIK: Masukkan 16 digit angka KTP. Jika dikosongkan, sistem akan membuatkan nomor registrasi sementara secara aman.'],
    ['3. Kolom Jabatan: Anda dapat menggunakan nama singkatan seperti "Bid", "HAM", "UMKM", "OKK", atau "Bappilu". Sistem akan mencocokkan secara otomatis.'],
    ['4. Menambah Jabatan: Cukup buat baris baru di bawah nomor terakhir dengan nama jabatan yang diinginkan.'],
    ['5. Setelah selesai mengisi, simpan berkas Excel ini dan unggah kembali melalui tombol "Import Excel" di halaman matriks.'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo['!cols'] = [{ wch: 32 }, { wch: 50 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form Input Pengurus');
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Panduan Wilayah');

  const filename = getTerritoryFilename(ctx, 'TEMPLATE_INPUT_PENGURUS');
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2b. Menghasilkan dan mendownload Template Excel KHUSUS DEWAN PERTIMBANGAN SAJA
 * Murni hanya berisi posisi Dewan Pertimbangan berurutan No 1..N
 */
export function downloadAdvisoryOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes('pertimbangan'));

  const territoryTitle =
    ctx.level === 'DPW' ? 'PROVINSI SULAWESI UTARA' : `${ctx.dpd.toUpperCase()}`;

  const sheetData: (string | number)[][] = [
    ['FORMULIR KHUSUS: DEWAN PERTIMBANGAN PARTAI NASDEM'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    [
      'PETUNJUK: Berkas ini KHUSUS posisi Dewan Pertimbangan saja. Silakan copy-paste seluruh daftar nama dan NIK langsung ke kolom di bawah. Data Dewan Pimpinan & Dewan Pakar di database tetap aman.',
    ],
    [],
    [
      'No',
      'Sub Organisasi',
      'Jabatan Pengurus',
      'Nama Lengkap (dan Gelar)',
      'Nomor NIK (KTP)',
      'Nomor E-KTA NasDem',
      'Jenis Kelamin (L/P)',
      'No. WhatsApp / HP',
      'Email',
      'Alamat Lengkap',
      'Status',
    ],
  ];

  if (currentRows && currentRows.length > 0) {
    const targetRows = currentRows.filter((r) =>
      (r.subOrg || '').toLowerCase().includes('pertimbangan')
    );
    if (targetRows.length > 0) {
      targetRows.forEach((r, idx) => {
        sheetData.push([
          idx + 1,
          r.subOrg,
          r.jabatan || 'Pengurus',
          r.namaLengkap || '',
          r.nik && !r.nik.startsWith('71002026') ? r.nik : '',
          r.nomorEKTA && !r.nomorEKTA.startsWith('71002026') ? r.nomorEKTA : '',
          '',
          r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
          r.email || '',
          '',
          'Aktif',
        ]);
      });
    } else {
      slots.forEach((s, idx) => {
        sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
      });
    }
  } else {
    slots.forEach((s, idx) => {
      sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 28 },
    { wch: 38 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pertimbangan');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_DEWAN_PERTIMBANGAN_${ctx.level}_${cleanDpd}.xlsx`;
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2c. Menghasilkan dan mendownload Template Excel KHUSUS DEWAN PAKAR SAJA
 * Murni hanya berisi posisi Dewan Pakar berurutan No 1..N
 */
export function downloadExpertOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes('pakar'));

  const territoryTitle =
    ctx.level === 'DPW' ? 'PROVINSI SULAWESI UTARA' : `${ctx.dpd.toUpperCase()}`;

  const sheetData: (string | number)[][] = [
    ['FORMULIR KHUSUS: DEWAN PAKAR PARTAI NASDEM'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    [
      'PETUNJUK: Berkas ini KHUSUS posisi Dewan Pakar saja. Silakan copy-paste seluruh daftar nama dan NIK langsung ke kolom di bawah. Data Dewan Pimpinan & Dewan Pertimbangan di database tetap aman.',
    ],
    [],
    [
      'No',
      'Sub Organisasi',
      'Jabatan Pengurus',
      'Nama Lengkap (dan Gelar)',
      'Nomor NIK (KTP)',
      'Nomor E-KTA NasDem',
      'Jenis Kelamin (L/P)',
      'No. WhatsApp / HP',
      'Email',
      'Alamat Lengkap',
      'Status',
    ],
  ];

  if (currentRows && currentRows.length > 0) {
    const targetRows = currentRows.filter((r) =>
      (r.subOrg || '').toLowerCase().includes('pakar')
    );
    if (targetRows.length > 0) {
      targetRows.forEach((r, idx) => {
        sheetData.push([
          idx + 1,
          r.subOrg,
          r.jabatan || 'Pengurus',
          r.namaLengkap || '',
          r.nik && !r.nik.startsWith('71002026') ? r.nik : '',
          r.nomorEKTA && !r.nomorEKTA.startsWith('71002026') ? r.nomorEKTA : '',
          '',
          r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
          r.email || '',
          '',
          'Aktif',
        ]);
      });
    } else {
      slots.forEach((s, idx) => {
        sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
      });
    }
  } else {
    slots.forEach((s, idx) => {
      sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 28 },
    { wch: 38 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pakar');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_DEWAN_PAKAR_${ctx.level}_${cleanDpd}.xlsx`;
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2d. Menghasilkan dan mendownload Template Excel Gabungan Pertimbangan & Pakar
 * Menggunakan 2 SHEET TERPISAH (Sheet 1: Dewan Pertimbangan, Sheet 2: Dewan Pakar)
 * agar tidak tercampur dan tidak membingungkan saat copy-paste
 */
export function downloadAdvisoryAndExpertExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const pertimbanganSlots = allSlots.filter((s) =>
    (s.subOrg || '').toLowerCase().includes('pertimbangan')
  );
  const pakarSlots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes('pakar'));

  const territoryTitle =
    ctx.level === 'DPW' ? 'PROVINSI SULAWESI UTARA' : `${ctx.dpd.toUpperCase()}`;

  const headerCols = [
    'No',
    'Sub Organisasi',
    'Jabatan Pengurus',
    'Nama Lengkap (dan Gelar)',
    'Nomor NIK (KTP)',
    'Nomor E-KTA NasDem',
    'Jenis Kelamin (L/P)',
    'No. WhatsApp / HP',
    'Email',
    'Alamat Lengkap',
    'Status',
  ];

  // Sheet 1: Dewan Pertimbangan
  const sheet1Data: (string | number)[][] = [
    ['FORMULIR KHUSUS: DEWAN PERTIMBANGAN PARTAI NASDEM'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    ['PANDUAN: Halaman ini murni untuk posisi Dewan Pertimbangan.'],
    [],
    headerCols,
  ];

  const currentPertimbangan = (currentRows || []).filter((r) =>
    (r.subOrg || '').toLowerCase().includes('pertimbangan')
  );

  if (currentPertimbangan.length > 0) {
    currentPertimbangan.forEach((r, idx) => {
      sheet1Data.push([
        idx + 1,
        r.subOrg,
        r.jabatan || 'Pengurus',
        r.namaLengkap || '',
        r.nik && !r.nik.startsWith('71002026') ? r.nik : '',
        r.nomorEKTA && !r.nomorEKTA.startsWith('71002026') ? r.nomorEKTA : '',
        '',
        r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
        r.email || '',
        '',
        'Aktif',
      ]);
    });
  } else {
    pertimbanganSlots.forEach((s, idx) => {
      sheet1Data.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
    });
  }

  // Sheet 2: Dewan Pakar
  const sheet2Data: (string | number)[][] = [
    ['FORMULIR KHUSUS: DEWAN PAKAR PARTAI NASDEM'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    ['PANDUAN: Halaman ini murni untuk posisi Dewan Pakar.'],
    [],
    headerCols,
  ];

  const currentPakar = (currentRows || []).filter((r) =>
    (r.subOrg || '').toLowerCase().includes('pakar')
  );

  if (currentPakar.length > 0) {
    currentPakar.forEach((r, idx) => {
      sheet2Data.push([
        idx + 1,
        r.subOrg,
        r.jabatan || 'Pengurus',
        r.namaLengkap || '',
        r.nik && !r.nik.startsWith('71002026') ? r.nik : '',
        r.nomorEKTA && !r.nomorEKTA.startsWith('71002026') ? r.nomorEKTA : '',
        '',
        r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
        r.email || '',
        '',
        'Aktif',
      ]);
    });
  } else {
    pakarSlots.forEach((s, idx) => {
      sheet2Data.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', 'Aktif']);
    });
  }

  const colWidths = [
    { wch: 6 },
    { wch: 32 },
    { wch: 28 },
    { wch: 38 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
    { wch: 12 },
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = colWidths;

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Dewan Pertimbangan');
  XLSX.utils.book_append_sheet(wb, ws2, 'Dewan Pakar');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_PERTIMBANGAN_DAN_PAKAR_${ctx.level}_${cleanDpd}.xlsx`;
  saveWorkbookToExcel(wb, filename);
}

/**
 * Menghasilkan NIK 16-digit unik dan anti-tabrakan untuk pengurus teritorial
 * yang belum memiliki NIK KTP di berkas Excel atau form input.
 * Skema penomoran anti-tabrakan:
 * - Digit 1-2: Kode Provinsi 71 (Sulawesi Utara)
 * - Digit 3-4: Kode DPD (01..15, atau 00 untuk DPW)
 * - Digit 5-6: Kode Sub-Organisasi (11: Dewan Pertimbangan, 22: Dewan Pakar, 33: Dewan Pimpinan, 44: Lainnya)
 * - Digit 7-10: Tahun 2026
 * - Digit 11-16: Nomor urut (000001..999999)
 */
export function generateUniqueTerritoryNik(
  dpdName: string,
  subOrg: string,
  seq: number,
  occupiedNiks: Set<string>
): string {
  const regIdx = SULUT_REGIONS.findIndex((r) => isDpdMatch(r.name, dpdName));
  const dpdCode = regIdx !== -1 ? String(regIdx + 1).padStart(2, '0') : '00';

  const subLower = (subOrg || '').toLowerCase();
  let councilCode = '33'; // Default Dewan Pimpinan
  if (subLower.includes('pertimbangan')) {
    councilCode = '11';
  } else if (subLower.includes('pakar')) {
    councilCode = '22';
  } else if (subLower.includes('cabang') || subLower.includes('ranting')) {
    councilCode = '44';
  }

  let counter = Math.max(1, seq);
  let candidate = '';
  do {
    const seqStr = String(counter).padStart(6, '0').slice(-6);
    candidate = `71${dpdCode}${councilCode}2026${seqStr}`;
    counter++;
  } while (occupiedNiks.has(candidate));

  occupiedNiks.add(candidate);
  return candidate;
}

/**
 * 3. Membaca & Mem-parse berkas Excel yang diunggah pengguna (Mendukung multi-sheet otomatis)
 */
export async function parseTerritorialExcelFile(
  file: File,
  ctx: TerritoryContext,
  currentMembers: Member[],
  adminName = 'Admin Teritorial'
): Promise<ParseTerritoryExcelResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja.');
  }

  const slots = getStructureTemplate(ctx.level);
  const parsedRows: ParsedTerritoryRow[] = [];
  const membersToSave: Member[] = [];
  const occupiedNiks = new Set<string>(currentMembers.map((m) => m.nik));

  const territoryDpd = ctx.level === 'DPW' ? 'Sulawesi Utara' : ctx.dpd;
  const territoryDpc =
    ctx.level === 'DPW'
      ? 'Wilayah DPW'
      : ctx.level === 'DPD'
      ? 'Umum (DPD)'
      : ctx.dpc || 'Umum (DPD)';
  const territoryDprt = ctx.level === 'DPRt' ? ctx.dprt || 'Pusat' : 'Pusat/Umum';

  const isValidNik = (nik?: string): boolean => {
    if (!nik) return false;
    const clean = String(nik).replace(/[^0-9]/g, '');
    if (clean.length < 10) return false;
    if (/^0+$/.test(clean)) return false;
    if (/0{8,}/.test(clean)) return false;
    return true;
  };

  let filledCount = 0;
  let matchedPositions = 0;
  let customPositions = 0;

  // Baca seluruh sheet yang relevan dalam berkas Excel
  for (const sheetName of wb.SheetNames) {
    const sheetLower = sheetName.toLowerCase().trim();
    if (sheetLower.includes('panduan') || sheetLower.includes('info') || sheetLower.includes('petunjuk')) {
      continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rawData || rawData.length === 0) continue;

    // Default subOrg dari nama sheet jika ada
    let defaultSubOrg = '';
    if (sheetLower.includes('pertimbangan')) {
      defaultSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
    } else if (sheetLower.includes('pakar')) {
      defaultSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
    }

    // Cari baris header pada sheet ini secara cerdas & toleran
    let headerRowIdx = -1;
    let colNo = -1;
    let colDpd = -1;
    let colSubOrg = -1;
    let colJabatan = -1;
    let colNama = -1;
    let colNik = -1;
    let colEkta = -1;
    let colGender = -1;
    let colHp = -1;
    let colEmail = -1;
    let colAlamat = -1;

    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i] || [];
      const validCells = row.filter((c) => String(c || '').trim() !== '');
      if (validCells.length >= 2) {
        // Abaikan baris judul formulir / petunjuk yang memiliki teks sangat panjang
        const firstCell = String(row[0] || '').toLowerCase().trim();
        if (
          firstCell.includes('formulir') ||
          firstCell.includes('panduan') ||
          firstCell.includes('petunjuk') ||
          firstCell.includes('wilayah:')
        ) {
          continue;
        }

        const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
        const hasJabatan = rowLower.some(
          (c) =>
            c.length < 50 &&
            (c.includes('jabatan') ||
              c.includes('posisi') ||
              c.includes('tugas') ||
              c.includes('struktur') ||
              c.includes('peran'))
        );
        const hasNama = rowLower.some(
          (c) =>
            c.length < 50 &&
            !c.includes('jabatan') &&
            !c.includes('posisi') &&
            (c.includes('nama') ||
              c.includes('kader') ||
              c.includes('person') ||
              c.includes('lengkap'))
        );
        if (hasJabatan && hasNama) {
          headerRowIdx = i;
          break;
        }
      }
    }

    // Fallback: Jika tidak ada baris header formal, periksa apakah baris awal langsung berisi nama jabatan
    if (headerRowIdx === -1) {
      for (let i = 0; i < Math.min(6, rawData.length); i++) {
        const row = rawData[i] || [];
        const c0 = String(row[0] || '').toLowerCase().trim();
        const c1 = String(row[1] || '').toLowerCase().trim();
        const c2 = String(row[2] || '').toLowerCase().trim();
        const isPos = (s: string) =>
          s.includes('ketua') || s.includes('sekretaris') || s.includes('bendahara') || s.includes('anggota') || s.includes('wakil');
        if (isPos(c0) || isPos(c1) || isPos(c2)) {
          headerRowIdx = i - 1; // loop data akan mulai tepat dari index i
          if (isPos(c0)) {
            colJabatan = 0;
            colNama = 1;
          } else if (isPos(c1)) {
            colJabatan = 1;
            colNama = 2;
          } else {
            colSubOrg = 1;
            colJabatan = 2;
            colNama = 3;
          }
          break;
        }
      }
    }

    if (headerRowIdx === -1 && rawData.length > 0) {
      headerRowIdx = 0;
    }

    if (headerRowIdx !== -1 && (colJabatan === -1 || colNama === -1)) {
      const headers = (rawData[headerRowIdx] || []).map((h) =>
        String(h || '').toLowerCase().trim()
      );

      colNo = headers.findIndex((h) => h === 'no' || h === 'nomor' || h === '#');
      colDpd = headers.findIndex(
        (h) =>
          (h === 'dpd' ||
            h.includes('kabupaten') ||
            h.includes('kota') ||
            h.includes('nama dpd')) &&
          !h.includes('sub') &&
          !h.includes('organisasi')
      );
      colSubOrg = headers.findIndex(
        (h) =>
          (h.includes('sub organisasi') ||
            h.includes('sub_organisasi') ||
            h.includes('sub') ||
            h.includes('organisasi') ||
            h.includes('dewan') ||
            h.includes('divisi') ||
            h.includes('bidang')) &&
          !h.includes('jabatan') &&
          !h.includes('nama')
      );
      colJabatan = headers.findIndex(
        (h) =>
          (h.includes('jabatan') ||
            h.includes('posisi') ||
            h.includes('tugas') ||
            h.includes('struktur') ||
            h.includes('peran')) &&
          !h.includes('sub')
      );
      colNama = headers.findIndex(
        (h) =>
          (h.includes('nama') ||
            h.includes('kader') ||
            h.includes('person') ||
            h.includes('lengkap')) &&
          !h.includes('jabatan') &&
          !h.includes('posisi')
      );
      colNik = headers.findIndex((h) => h.includes('nik') || h.includes('ktp'));
      colEkta = headers.findIndex((h) => (h.includes('kta') || h.includes('ekta')) && !h.includes('kontak'));
      colGender = headers.findIndex(
        (h) => h.includes('kelamin') || h.includes('gender') || h === 'jk' || h === 'sex'
      );
      colHp = headers.findIndex(
        (h) =>
          h.includes('hp') ||
          h.includes('wa') ||
          h.includes('telepon') ||
          h.includes('whatsapp') ||
          h.includes('kontak') ||
          h.includes('telp')
      );
      colEmail = headers.findIndex((h) => h.includes('email') || h.includes('surel') || h.includes('mail'));
      colAlamat = headers.findIndex((h) => h.includes('alamat') || h.includes('domisili'));

      // Jika belum ketemu, cari kolom pertama yang bukan nomor untuk jabatan dan nama
      if (colJabatan === -1) colJabatan = colSubOrg !== -1 ? 2 : 1;
      if (colNama === -1) colNama = colJabatan === 1 ? 2 : 3;
    }

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const noVal = colNo !== -1 ? Number(row[colNo]) || parsedRows.length + 1 : parsedRows.length + 1;
      let subOrgVal = colSubOrg !== -1 ? String(row[colSubOrg] || '').trim() : '';
      if (!subOrgVal && defaultSubOrg) subOrgVal = defaultSubOrg;

      const jabatanVal = colJabatan !== -1 ? String(row[colJabatan] || '').trim() : '';
      const namaVal = colNama !== -1 ? String(row[colNama] || '').trim() : '';
      let nikVal = colNik !== -1 ? String(row[colNik] || '').replace(/[^0-9]/g, '').trim() : '';
      const ektaVal = colEkta !== -1 ? String(row[colEkta] || '').replace(/[^0-9]/g, '').trim() : '';
      const genderVal = colGender !== -1 ? String(row[colGender] || '').trim() : '';
      const hpVal = colHp !== -1 ? String(row[colHp] || '').trim() : '';
      const emailVal = colEmail !== -1 ? String(row[colEmail] || '').trim() : '';
      const alamatVal = colAlamat !== -1 ? String(row[colAlamat] || '').trim() : '';

      // Tentukan wilayah & level baris ini
      let rowDpd = territoryDpd;
      let rowLevel = ctx.level;
      let rowDpc = territoryDpc;
      let rowDprt = territoryDprt;

      if (ctx.level === 'DPD' && colDpd !== -1) {
        const rawRowDpd = String(row[colDpd] || '').trim();
        if (rawRowDpd) {
          const foundReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawRowDpd));
          if (foundReg) {
            rowDpd = foundReg.name;
          }
        }
      }

      if (!jabatanVal && !namaVal) continue;

      const matchedSlot = slots.find((s) => isJobTitleMatch(jabatanVal, s.jabatan));
      const isMatched = !!matchedSlot;
      if (isMatched) {
        matchedPositions++;
      } else if (jabatanVal) {
        customPositions++;
      }

      const isFilled = namaVal.length > 0;
      let finalSubOrg =
        subOrgVal ||
        defaultSubOrg ||
        matchedSlot?.subOrg ||
        (rowLevel === 'DPW'
          ? 'DEWAN PIMPINAN WILAYAH'
          : rowLevel === 'DPD'
          ? 'III. DEWAN PIMPINAN DAERAH'
          : rowLevel === 'DPC'
          ? 'III. DEWAN PIMPINAN CABANG'
          : 'DEWAN PIMPINAN RANTING');
      finalSubOrg = normalizeSubOrgName(finalSubOrg, rowLevel);

      if (isFilled) {
        filledCount++;

        // 1. Cari apakah kader sebelumnya sudah menempati slot persis ini
        const existingSlotMember = currentMembers.find(
          (m) =>
            isDpdMatch(m.dpd, rowDpd) &&
            (m.wilayahPenugasan || '').trim().toLowerCase() === finalSubOrg.trim().toLowerCase() &&
            isJobTitleMatch(m.jabatan, jabatanVal)
        );

        // 2. Tentukan NIK: Jika kosong, dummy/placeholder, atau sudah dipakai baris lain, generate NIK unik anti-tabrakan
        if (!isValidNik(nikVal) || occupiedNiks.has(nikVal)) {
          if (existingSlotMember && isValidNik(existingSlotMember.nik) && !occupiedNiks.has(existingSlotMember.nik)) {
            nikVal = existingSlotMember.nik;
          } else {
            nikVal = generateUniqueTerritoryNik(
              rowDpd,
              finalSubOrg,
              parsedRows.length + 1,
              occupiedNiks
            );
          }
        }
        occupiedNiks.add(nikVal);

        const existingMember =
          existingSlotMember ||
          currentMembers.find(
            (m) => m.nik === nikVal || (ektaVal && m.nomorEKTA === ektaVal)
          );

        const memberObj: Member = {
          ...(existingMember || {}),
          nik: nikVal,
          nomorEKTA: ektaVal || existingMember?.nomorEKTA || nikVal,
          namaLengkap: namaVal,
          email: emailVal || existingMember?.email || undefined,
          nomorHP: hpVal && hpVal !== '-' ? hpVal : (existingMember?.nomorHP || '-'),
          alamatLengkap: alamatVal || existingMember?.alamatLengkap || undefined,
          jenisKelamin:
            genderVal.toUpperCase().startsWith('L') || genderVal.toLowerCase().includes('laki')
              ? 'Laki-laki'
              : genderVal.toUpperCase().startsWith('P') || genderVal.toLowerCase().includes('perem')
              ? 'Perempuan'
              : existingMember?.jenisKelamin || 'Laki-laki',
          dpd: rowDpd,
          dpc: rowDpc,
          dprt: rowDprt,
          isPengurus: true,
          tingkatKepengurusan: rowLevel,
          wilayahPenugasan: finalSubOrg,
          nomorSK:
            existingMember?.nomorSK ||
            `SK-${rowLevel}-${rowDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
          jabatan: jabatanVal || matchedSlot?.jabatan || 'Pengurus',
          status: 'Aktif',
          statusKtpVerified: true,
          tanggalBergabung:
            existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
          terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
          diubahOleh: `${adminName} (Import Excel Teritorial)`,
        };

        membersToSave.push(memberObj);
      }

      parsedRows.push({
        no: noVal,
        dpd: rowDpd,
        subOrg: finalSubOrg,
        jabatanExcel: jabatanVal || 'Pengurus',
        jabatanMatched: matchedSlot?.jabatan,
        isMatched,
        namaLengkap: namaVal,
        nik: nikVal,
        nomorEKTA: ektaVal,
        jenisKelamin: genderVal,
        nomorHP: hpVal,
        email: emailVal,
        alamat: alamatVal,
        status: 'Aktif',
        isFilled,
      });
    }
  }

  if (parsedRows.length === 0) {
    throw new Error(
      'Berkas Excel kosong atau tidak memiliki baris data nama pengurus. Pastikan tabel memiliki kolom "Jabatan Pengurus" dan "Nama Lengkap".'
    );
  }

  return {
    territoryContext: ctx,
    rows: parsedRows,
    membersToSave,
    stats: {
      totalRows: parsedRows.length,
      filledRows: filledCount,
      emptyRows: parsedRows.length - filledCount,
      matchedPositions,
      customPositions,
    },
    filename: file.name,
  };
}
