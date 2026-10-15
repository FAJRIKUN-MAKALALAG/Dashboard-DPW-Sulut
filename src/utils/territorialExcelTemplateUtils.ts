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
import { isJobTitleMatch } from './jobMatchingUtils';
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
  XLSX.writeFile(wb, filename);
}

/**
 * 2b. Menghasilkan dan mendownload Template Excel KHUSUS Dewan Pertimbangan & Dewan Pakar
 * Berguna saat data Dewan Pimpinan sudah terisi dan admin hanya ingin mengisi Dewan Pertimbangan dan Dewan Pakar
 */
export function downloadAdvisoryAndExpertExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => {
    const sub = (s.subOrg || '').toLowerCase();
    return sub.includes('pertimbangan') || sub.includes('pakar');
  });

  const territoryTitle =
    ctx.level === 'DPW'
      ? 'PROVINSI SULAWESI UTARA'
      : `${ctx.dpd.toUpperCase()}`;

  const sheetData: (string | number)[][] = [
    ['FORMULIR KHUSUS: INPUT DEWAN PERTIMBANGAN & DEWAN PAKAR PARTAI NASDEM'],
    [`WILAYAH: TINGKAT ${ctx.level} | ${territoryTitle}`],
    [
      'PANDUAN: Khusus untuk mengisi posisi Dewan Pertimbangan & Dewan Pakar. Data Dewan Pimpinan yang sudah ada di database akan tetap aman dan tidak terhapus.',
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
    const targetRows = currentRows.filter((r) => {
      const sub = (r.subOrg || '').toLowerCase();
      return sub.includes('pertimbangan') || sub.includes('pakar');
    });

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
        sheetData.push([
          idx + 1,
          s.subOrg,
          s.jabatan,
          '',
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
  } else {
    slots.forEach((s, idx) => {
      sheetData.push([
        idx + 1,
        s.subOrg,
        s.jabatan,
        '',
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
  XLSX.utils.book_append_sheet(wb, ws, 'Pakar & Pertimbangan');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_PAKAR_DAN_PERTIMBANGAN_${ctx.level}_${cleanDpd}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 2c. Menghasilkan dan mendownload Template Excel MASAL Dewan Pertimbangan & Dewan Pakar untuk SELURUH 15 DPD se-Sulut
 * 1 berkas langsung memuat 15 DPD x 8 posisi (Dewan Pertimbangan & Pakar)
 */
export function downloadMassAdvisoryAndExpertExcelTemplateAllDpds(): void {
  const sheetData: (string | number)[][] = [
    ['FORMULIR MASAL: DEWAN PERTIMBANGAN & DEWAN PAKAR SELURUH 15 DPD KABUPATEN/KOTA'],
    ['DEWAN PIMPINAN WILAYAH (DPW) PARTAI NASDEM PROVINSI SULAWESI UTARA'],
    [
      'PETUNJUK: Masukkan Nama Lengkap dan NIK untuk masing-masing DPD. Kolom Nama DPD menentukan ke DPD mana pengurus tersebut akan disimpan secara otomatis.',
    ],
    [],
    [
      'No',
      'Nama DPD (Kabupaten/Kota)',
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

  let rowCounter = 1;
  const dpdSlots = DPD_STRUCTURE_TEMPLATE.filter((s) => {
    const sub = (s.subOrg || '').toLowerCase();
    return sub.includes('pertimbangan') || sub.includes('pakar');
  });

  SULUT_REGIONS.forEach((region) => {
    dpdSlots.forEach((slot) => {
      sheetData.push([
        rowCounter++,
        region.name,
        slot.subOrg,
        slot.jabatan,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Aktif',
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 28 },
    { wch: 22 },
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
  XLSX.utils.book_append_sheet(wb, ws, 'Pakar & Pertimbangan 15 DPD');
  XLSX.writeFile(wb, 'TEMPLATE_MASAL_PAKAR_DAN_PERTIMBANGAN_15_DPD_SULUT.xlsx');
}

/**
 * 3. Membaca & Mem-parse berkas Excel yang diunggah pengguna
 */
export async function parseTerritorialExcelFile(
  file: File,
  ctx: TerritoryContext,
  currentMembers: Member[],
  adminName = 'Admin Teritorial'
): Promise<ParseTerritoryExcelResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (rawData.length === 0) {
    throw new Error('Berkas Excel kosong atau tidak dapat dibaca.');
  }

  // Cari baris header (bisa baris 0 atau setelah baris banner panduan)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i] || [];
    // Baris header tabel yang sebenarnya memiliki beberapa kolom (minimal 3 sel terisi)
    const validCells = row.filter((c) => String(c || '').trim() !== '');
    if (validCells.length >= 3) {
      const rowLower = row.map((c) => String(c || '').toLowerCase().trim());
      const hasJabatan = rowLower.some((c) => c.includes('jabatan') || c.includes('posisi'));
      const hasNama = rowLower.some((c) => c.includes('nama'));
      if (hasJabatan && hasNama) {
        headerRowIdx = i;
        break;
      }
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'Format header tabel tidak dikenali. Pastikan tabel memiliki kolom "Jabatan Pengurus" dan "Nama Lengkap".'
    );
  }

  const headers = (rawData[headerRowIdx] || []).map((h) =>
    String(h || '').toLowerCase().trim()
  );

  const colNo = headers.findIndex((h) => h === 'no' || h === 'nomor');
  const colDpd = headers.findIndex(
    (h) =>
      h === 'dpd' ||
      h.includes('kabupaten') ||
      h.includes('kota') ||
      h.includes('daerah') ||
      h.includes('wilayah') ||
      h.includes('nama dpd')
  );
  const colSubOrg = headers.findIndex((h) => h.includes('sub organisasi') || h.includes('sub'));
  const colJabatan = headers.findIndex((h) => h.includes('jabatan') || h.includes('posisi'));
  const colNama = headers.findIndex((h) => h.includes('nama'));
  const colNik = headers.findIndex((h) => h.includes('nik') || h.includes('ktp'));
  const colEkta = headers.findIndex((h) => h.includes('kta') || h.includes('ekta'));
  const colGender = headers.findIndex((h) => h.includes('kelamin') || h.includes('gender') || h === 'jk');
  const colHp = headers.findIndex(
    (h) => h.includes('hp') || h.includes('wa') || h.includes('telepon') || h.includes('whatsapp')
  );
  const colEmail = headers.findIndex((h) => h.includes('email') || h.includes('surel'));
  const colAlamat = headers.findIndex((h) => h.includes('alamat'));

  const slots = getStructureTemplate(ctx.level);
  const parsedRows: ParsedTerritoryRow[] = [];
  const membersToSave: Member[] = [];

  const territoryDpd = ctx.dpd;
  const territoryDpc =
    ctx.level === 'DPW'
      ? 'Wilayah DPW'
      : ctx.level === 'DPD'
      ? 'Umum (DPD)'
      : ctx.dpc || 'Umum (DPD)';
  const territoryDprt = ctx.level === 'DPRt' ? ctx.dprt || 'Pusat/Umum' : 'Pusat/Umum';

  let filledCount = 0;
  let matchedPositions = 0;
  let customPositions = 0;

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const noVal = colNo !== -1 ? Number(row[colNo]) || parsedRows.length + 1 : parsedRows.length + 1;
    const subOrgVal = colSubOrg !== -1 ? String(row[colSubOrg] || '').trim() : '';
    const jabatanVal = colJabatan !== -1 ? String(row[colJabatan] || '').trim() : '';
    const namaVal = colNama !== -1 ? String(row[colNama] || '').trim() : '';
    let nikVal = colNik !== -1 ? String(row[colNik] || '').replace(/[^0-9]/g, '').trim() : '';
    const ektaVal = colEkta !== -1 ? String(row[colEkta] || '').replace(/[^0-9]/g, '').trim() : '';
    const genderVal = colGender !== -1 ? String(row[colGender] || '').trim() : '';
    const hpVal = colHp !== -1 ? String(row[colHp] || '').trim() : '';
    const emailVal = colEmail !== -1 ? String(row[colEmail] || '').trim() : '';
    const alamatVal = colAlamat !== -1 ? String(row[colAlamat] || '').trim() : '';

    // Periksa apakah baris ini memiliki spesifikasi DPD (misalnya dari berkas template masal 15 DPD)
    let rowDpd = territoryDpd;
    let rowLevel = ctx.level;
    if (colDpd !== -1) {
      const rawRowDpd = String(row[colDpd] || '').trim();
      if (rawRowDpd) {
        const foundReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawRowDpd));
        if (foundReg) {
          rowDpd = foundReg.name;
          rowLevel = 'DPD';
        }
      }
    }

    // Lewati baris kosong jika tidak ada nama maupun jabatan
    if (!jabatanVal && !namaVal) continue;

    // Evaluasi kecocokan dengan slot template resmi
    const matchedSlot = slots.find((s) => isJobTitleMatch(jabatanVal, s.jabatan));
    const isMatched = !!matchedSlot;
    if (isMatched) {
      matchedPositions++;
    } else if (jabatanVal) {
      customPositions++;
    }

    const isFilled = namaVal.length > 0;
    if (isFilled) {
      filledCount++;

      // Generate fallback NIK jika kosong atau tidak valid (<10 digit)
      if (!nikVal || nikVal.length < 10) {
        nikVal = `71002026${String(10000000 + i).slice(-8)}`;
      }

      // Cari existing member di database untuk mempertahankan data awal
      const existingMember = currentMembers.find(
        (m) => m.nik === nikVal || (ektaVal && m.nomorEKTA === ektaVal)
      );

      const memberObj: Member = {
        ...(existingMember || {}),
        nik: nikVal,
        nomorEKTA: ektaVal || existingMember?.nomorEKTA || nikVal,
        namaLengkap: namaVal,
        email: emailVal || existingMember?.email || undefined,
        nomorHP: hpVal || existingMember?.nomorHP || '-',
        alamatLengkap: alamatVal || existingMember?.alamatLengkap || undefined,
        jenisKelamin:
          genderVal.toUpperCase().startsWith('L') || genderVal.toLowerCase().includes('laki')
            ? 'Laki-laki'
            : genderVal.toUpperCase().startsWith('P') || genderVal.toLowerCase().includes('perem')
            ? 'Perempuan'
            : existingMember?.jenisKelamin || 'Laki-laki',
        dpd: rowDpd,
        dpc: rowLevel === 'DPW' ? 'Wilayah DPW' : territoryDpc,
        dprt: territoryDprt,
        isPengurus: true,
        tingkatKepengurusan: rowLevel,
        wilayahPenugasan:
          subOrgVal ||
          matchedSlot?.subOrg ||
          (rowLevel === 'DPD' ? 'III. DEWAN PIMPINAN DAERAH' : `DEWAN PIMPINAN ${rowLevel}`),
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
      subOrg: subOrgVal || matchedSlot?.subOrg || `DEWAN PIMPINAN ${rowLevel}`,
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
