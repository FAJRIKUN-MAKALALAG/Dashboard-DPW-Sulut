import XLSX, { WorkBook, WorkSheet, Range } from 'xlsx-js-style';
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
 * Helper untuk memberikan styling visual tingkat tinggi pada lembar kerja Excel (XLSX)
 * Dilengkapi warna tematik NasDem (Navy, Emerald, Gold, Indigo), penanda sel kosong/wajib isi (Kuning Cerah),
 * border rapi, text wrapping, dan banner instruksi agar admin tidak bingung saat input manual.
 */
function applyExcelTemplateStyling(options: {
  ws: XLSX.WorkSheet;
  title?: string;
  subtitle: string;
  guideText?: string;
  totalDataRows: number;
}): void {
  const {
    ws,
    title = '★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★',
    subtitle,
    guideText,
    totalDataRows,
  } = options;

  // 1. Lebar Kolom yang Nyaman & Proporsional
  ws['!cols'] = [
    { wch: 7 },  // No
    { wch: 32 }, // Sub Organisasi
    { wch: 40 }, // Jabatan Pengurus
    { wch: 44 }, // * NAMA LENGKAP (WAJIB DIISI) *
    { wch: 28 }, // * NOMOR NIK (KTP 16 DIGIT) *
    { wch: 24 }, // Nomor E-KTA NasDem
    { wch: 18 }, // Jenis Kelamin (L/P)
    { wch: 22 }, // No. WhatsApp / HP
    { wch: 28 }, // Email
    { wch: 36 }, // Alamat Lengkap Domisili
    { wch: 26 }, // STATUS FORMASI
  ];

  // 2. Merges untuk Banner Judul & Legend Bawah
  const merges: Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Row 1 Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Row 2 Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }, // Row 3 Guide
  ];

  const legendStartRow = 5 + totalDataRows + 1;
  merges.push(
    { s: { r: legendStartRow, c: 0 }, e: { r: legendStartRow, c: 10 } },
    { s: { r: legendStartRow + 1, c: 0 }, e: { r: legendStartRow + 1, c: 10 } },
    { s: { r: legendStartRow + 2, c: 0 }, e: { r: legendStartRow + 2, c: 10 } },
    { s: { r: legendStartRow + 3, c: 0 }, e: { r: legendStartRow + 3, c: 10 } },
    { s: { r: legendStartRow + 4, c: 0 }, e: { r: legendStartRow + 4, c: 10 } }
  );

  ws['!merges'] = merges;

  // 3. Tinggi Baris (Row Heights)
  const rowHeights: { hpt: number }[] = [
    { hpt: 34 }, // Row 1 Judul Utama
    { hpt: 26 }, // Row 2 Sub Judul Wilayah
    { hpt: 26 }, // Row 3 Petunjuk
    { hpt: 12 }, // Row 4 Pemisah
    { hpt: 32 }, // Row 5 Table Column Headers
  ];
  for (let i = 0; i < totalDataRows; i++) {
    rowHeights.push({ hpt: 24 }); // Baris Data
  }
  rowHeights.push({ hpt: 14 }); // Pemisah Legend
  rowHeights.push({ hpt: 24 }); // Legend Header
  rowHeights.push({ hpt: 20 }); // Legend 1
  rowHeights.push({ hpt: 20 }); // Legend 2
  rowHeights.push({ hpt: 20 }); // Legend 3
  rowHeights.push({ hpt: 20 }); // Legend 4

  ws['!rows'] = rowHeights;

  const borderThin = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  };

  const borderAmber = {
    top: { style: 'thin', color: { rgb: 'F59E0B' } },
    bottom: { style: 'thin', color: { rgb: 'F59E0B' } },
    left: { style: 'thin', color: { rgb: 'F59E0B' } },
    right: { style: 'thin', color: { rgb: 'F59E0B' } },
  };

  // 4. Style Banner Atas (Rows 0..2)
  for (let c = 0; c <= 10; c++) {
    const r0Ref = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[r0Ref]) ws[r0Ref] = { t: 's', v: '' };
    ws[r0Ref].s = {
      fill: { fgColor: { rgb: '002B66' } },
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const r1Ref = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[r1Ref]) ws[r1Ref] = { t: 's', v: '' };
    ws[r1Ref].s = {
      fill: { fgColor: { rgb: '1E3A8A' } },
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const r2Ref = XLSX.utils.encode_cell({ r: 2, c });
    if (!ws[r2Ref]) ws[r2Ref] = { t: 's', v: '' };
    ws[r2Ref].s = {
      fill: { fgColor: { rgb: 'FEF3C7' } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '92400E' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'FCD34D' } },
        bottom: { style: 'thin', color: { rgb: 'FCD34D' } },
        left: { style: 'thin', color: { rgb: 'FCD34D' } },
        right: { style: 'thin', color: { rgb: 'FCD34D' } },
      },
    };
  }

  // 5. Style Header Tabel (Row 4 / Baris ke-5 di Excel)
  for (let c = 0; c <= 10; c++) {
    const ref = XLSX.utils.encode_cell({ r: 4, c });
    if (!ws[ref]) continue;

    const isNama = c === 3;
    const isNik = c === 4;
    const isStatus = c === 10;

    let bgColor = '0F172A'; // Slate gelap untuk No, Sub-Org, Jabatan
    if (isNama) bgColor = '047857'; // Emerald Green cerah untuk NAMA LENGKAP
    else if (isNik) bgColor = '059669'; // Teal Green untuk NIK
    else if (isStatus) bgColor = '1E1B4B'; // Indigo pekat untuk STATUS
    else if (c >= 5) bgColor = '334155'; // Slate medium

    ws[ref].s = {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '1E293B' } },
        bottom: { style: 'medium', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '1E293B' } },
        right: { style: 'thin', color: { rgb: '1E293B' } },
      },
    };
  }

  // 6. Style Baris Data (Row 5 ke atas)
  for (let r = 5; r < 5 + totalDataRows; r++) {
    const namaRef = XLSX.utils.encode_cell({ r, c: 3 });
    const namaVal = ws[namaRef] && ws[namaRef].v ? String(ws[namaRef].v).trim() : '';
    const isFilled = namaVal.length > 0;

    const subOrgRef = XLSX.utils.encode_cell({ r, c: 1 });
    const subOrgVal = ws[subOrgRef] && ws[subOrgRef].v ? String(ws[subOrgRef].v).toLowerCase() : '';

    let subBg = 'F8FAFC';
    let subColor = '334155';
    if (subOrgVal.includes('pertimbangan')) {
      subBg = 'EEF2FF'; // Lavender lembut
      subColor = '3730A3';
    } else if (subOrgVal.includes('pakar')) {
      subBg = 'FAF5FF'; // Ungu lembut
      subColor = '6B21A8';
    } else if (
      subOrgVal.includes('pimpinan') ||
      subOrgVal.includes('dpd') ||
      subOrgVal.includes('dpw') ||
      subOrgVal.includes('dpc') ||
      subOrgVal.includes('dprt')
    ) {
      subBg = 'EFF6FF'; // Biru lembut
      subColor = '1E40AF';
    }

    const jabatanRef = XLSX.utils.encode_cell({ r, c: 2 });
    const jabatanVal =
      ws[jabatanRef] && ws[jabatanRef].v ? String(ws[jabatanRef].v).toLowerCase() : '';
    const isTopLeader =
      jabatanVal.includes('ketua') ||
      jabatanVal.includes('sekretaris') ||
      jabatanVal.includes('bendahara');

    for (let c = 0; c <= 10; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };

      if (c === 0) {
        // No
        ws[ref].s = {
          fill: { fgColor: { rgb: 'F8FAFC' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '64748B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 1) {
        // Sub Organisasi
        ws[ref].s = {
          fill: { fgColor: { rgb: subBg } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: subColor } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 2) {
        // Jabatan Pengurus
        ws[ref].s = {
          fill: { fgColor: { rgb: isTopLeader ? 'F8FAFC' : 'FFFFFF' } },
          font: {
            name: 'Calibri',
            sz: 10,
            bold: true,
            color: { rgb: isTopLeader ? '002B66' : '0F172A' },
          },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 3) {
        // NAMA LENGKAP: HIGHLIGHT KUNING CERAH JIKA MASIH KOSONG / LOWONG!
        if (isFilled) {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FFFFFF' } },
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderThin,
          };
        } else {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FEF9C3' } }, // KUNING HIGHLIGHTER LEMBUT & JELAS
            font: { name: 'Calibri', sz: 11, bold: false, color: { rgb: '854D0E' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderAmber,
          };
        }
      } else if (c === 4) {
        // NIK: KUNING MUDA JIKA KOSONG
        if (isFilled) {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FFFFFF' } },
            font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '0F172A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin,
          };
        } else {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FEFCE8' } },
            font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '854D0E' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderAmber,
          };
        }
      } else if (c === 10) {
        // STATUS FORMASI
        if (isFilled) {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'DCFCE7' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '166534' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '86EFAC' } },
              bottom: { style: 'thin', color: { rgb: '86EFAC' } },
              left: { style: 'thin', color: { rgb: '86EFAC' } },
              right: { style: 'thin', color: { rgb: '86EFAC' } },
            },
          };
        } else {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FEF3C7' } },
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '92400E' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'FCD34D' } },
              bottom: { style: 'thin', color: { rgb: 'FCD34D' } },
              left: { style: 'thin', color: { rgb: 'FCD34D' } },
              right: { style: 'thin', color: { rgb: 'FCD34D' } },
            },
          };
        }
      } else {
        // F, G, H, I, J
        ws[ref].s = {
          fill: { fgColor: { rgb: 'FFFFFF' } },
          font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '334155' } },
          alignment: { horizontal: c === 6 ? 'center' : 'left', vertical: 'center' },
          border: borderThin,
        };
      }
    }
  }

  // 7. Style Baris Panduan / Legend Bawah
  const legendRows = [
    { rowIdx: legendStartRow, bg: '002B66', fg: 'FFFFFF', bold: true, sz: 10 },
    { rowIdx: legendStartRow + 1, bg: 'FEF9C3', fg: '854D0E', bold: true, sz: 10 },
    { rowIdx: legendStartRow + 2, bg: 'FFFFFF', fg: '334155', bold: false, sz: 10 },
    { rowIdx: legendStartRow + 3, bg: 'EFF6FF', fg: '1E40AF', bold: true, sz: 10 },
    { rowIdx: legendStartRow + 4, bg: 'DCFCE7', fg: '166534', bold: true, sz: 10 },
  ];

  legendRows.forEach(({ rowIdx, bg, fg, bold, sz }) => {
    for (let c = 0; c <= 10; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = {
        fill: { fgColor: { rgb: bg } },
        font: { name: 'Calibri', sz, bold, color: { rgb: fg } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      };
    }
  });
}

/**
 * Styling untuk Sheet 2 (Panduan & Informasi Wilayah)
 */
function applyInfoSheetStyling(ws: XLSX.WorkSheet, totalRows: number): void {
  ws['!cols'] = [{ wch: 34 }, { wch: 60 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
  ];

  for (let c = 0; c <= 1; c++) {
    const r0 = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[r0]) ws[r0] = { t: 's', v: '' };
    ws[r0].s = {
      fill: { fgColor: { rgb: '002B66' } },
      font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  for (let r = 2; r <= 6; r++) {
    const c0 = XLSX.utils.encode_cell({ r, c: 0 });
    const c1 = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws[c0]) {
      ws[c0].s = {
        fill: { fgColor: { rgb: 'F8FAFC' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      };
    }
    if (ws[c1]) {
      ws[c1].s = {
        fill: { fgColor: { rgb: 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '002B66' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      };
    }
  }

  const r8_0 = XLSX.utils.encode_cell({ r: 8, c: 0 });
  const r8_1 = XLSX.utils.encode_cell({ r: 8, c: 1 });
  [r8_0, r8_1].forEach((ref) => {
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = {
      fill: { fgColor: { rgb: '1E3A8A' } },
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  });

  for (let r = 9; r < totalRows; r++) {
    const c0 = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[c0]) {
      ws[c0].s = {
        fill: { fgColor: { rgb: r % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } },
        font: { name: 'Calibri', sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      };
    }
  }
}

/**
 * 2. Menghasilkan dan mendownload Template Excel khusus untuk wilayah terpilih
 * Template sudah otomatis berisi daftar seluruh slot jabatan resmi partai NasDem
 * Diberikan styling visual cerah dan profesional agar admin tidak bingung saat input data.
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

  const headerCols = [
    'No',
    'Sub Organisasi',
    'Jabatan Pengurus',
    '* NAMA LENGKAP (WAJIB DIISI) *',
    '* NOMOR NIK (KTP 16 DIGIT) *',
    'Nomor E-KTA NasDem',
    'Jenis Kelamin (L/P)',
    'No. WhatsApp / HP',
    'Email',
    'Alamat Lengkap Domisili',
    'STATUS FORMASI',
  ];

  // Data Sheet 1: Formulir Pengisian
  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR RESMI INPUT SUSUNAN PENGURUS - TINGKAT ${ctx.level} (${territoryTitle})`],
    [
      '▶ PETUNJUK: Cukup isi kolom [NAMA LENGKAP] (Warna Hijau & Kuning) dan [NOMOR NIK]. Kolom Jabatan baku sudah terkunci rapi.',
    ],
    [], // Baris kosong pemisah
    headerCols,
  ];

  let dataCount = 0;
  if (currentRows && currentRows.length > 0) {
    dataCount = currentRows.length;
    currentRows.forEach((r, idx) => {
      const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
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
        isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
      ]);
    });
  } else {
    dataCount = slots.length;
    slots.forEach((s, idx) => {
      sheetData.push([
        idx + 1,
        s.subOrg,
        s.jabatan,
        '', // Kosong dengan highlight kuning di Excel
        '',
        '',
        '',
        '',
        '',
        '',
        '⚡ LOWONG (Silakan Diisi)',
      ]);
    });
  }

  // Baris panduan visual di bagian bawah
  sheetData.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ POSISI TAMBAHAN ]: Ingin menambah pengurus baru di luar daftar baku ini? Cukup buat baris baru di bawah tabel.'],
    ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Terapkan styling visual lengkap
  applyExcelTemplateStyling({
    ws,
    subtitle: `FORMULIR RESMI INPUT SUSUNAN PENGURUS - TINGKAT ${ctx.level} (${territoryTitle})`,
    totalDataRows: dataCount,
  });

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
  applyInfoSheetStyling(wsInfo, infoData.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form Input Pengurus');
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Panduan Wilayah');

  const filename = getTerritoryFilename(ctx, 'TEMPLATE_INPUT_PENGURUS');
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2b. Menghasilkan dan mendownload Template Excel KHUSUS DEWAN PERTIMBANGAN SAJA
 * Diberikan styling visual bernuansa Lavender/Indigo resmi NasDem.
 */
export function downloadAdvisoryOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes('pertimbangan'));

  const territoryTitle =
    ctx.level === 'DPW' ? 'PROVINSI SULAWESI UTARA' : `${ctx.dpd.toUpperCase()}`;

  const headerCols = [
    'No',
    'Sub Organisasi',
    'Jabatan Pengurus',
    '* NAMA LENGKAP (WAJIB DIISI) *',
    '* NOMOR NIK (KTP 16 DIGIT) *',
    'Nomor E-KTA NasDem',
    'Jenis Kelamin (L/P)',
    'No. WhatsApp / HP',
    'Email',
    'Alamat Lengkap Domisili',
    'STATUS FORMASI',
  ];

  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR KHUSUS: DEWAN PERTIMBANGAN - TINGKAT ${ctx.level} (${territoryTitle})`],
    [
      '▶ PETUNJUK: Berkas ini KHUSUS posisi Dewan Pertimbangan. Isi kolom Nama Lengkap & NIK. Jabatan lain di database tetap aman.',
    ],
    [],
    headerCols,
  ];

  let dataCount = 0;
  if (currentRows && currentRows.length > 0) {
    const targetRows = currentRows.filter((r) =>
      (r.subOrg || '').toLowerCase().includes('pertimbangan')
    );
    if (targetRows.length > 0) {
      dataCount = targetRows.length;
      targetRows.forEach((r, idx) => {
        const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
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
          isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
        ]);
      });
    } else {
      dataCount = slots.length;
      slots.forEach((s, idx) => {
        sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
      });
    }
  } else {
    dataCount = slots.length;
    slots.forEach((s, idx) => {
      sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
    });
  }

  sheetData.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ POSISI TAMBAHAN ]: Jika anggota Dewan Pertimbangan lebih banyak dari slot, cukup buat baris baru di bawah.'],
    ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  applyExcelTemplateStyling({
    ws,
    subtitle: `FORMULIR KHUSUS: DEWAN PERTIMBANGAN - TINGKAT ${ctx.level} (${territoryTitle})`,
    guideText: '▶ PETUNJUK: Berkas ini KHUSUS posisi Dewan Pertimbangan. Cukup isi kolom [NAMA LENGKAP] & [NOMOR NIK].',
    totalDataRows: dataCount,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pertimbangan');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_DEWAN_PERTIMBANGAN_${ctx.level}_${cleanDpd}.xlsx`;
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2c. Menghasilkan dan mendownload Template Excel KHUSUS DEWAN PAKAR SAJA
 * Diberikan styling visual bernuansa Ungu/Purple resmi Dewan Pakar.
 */
export function downloadExpertOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes('pakar'));

  const territoryTitle =
    ctx.level === 'DPW' ? 'PROVINSI SULAWESI UTARA' : `${ctx.dpd.toUpperCase()}`;

  const headerCols = [
    'No',
    'Sub Organisasi',
    'Jabatan Pengurus',
    '* NAMA LENGKAP (WAJIB DIISI) *',
    '* NOMOR NIK (KTP 16 DIGIT) *',
    'Nomor E-KTA NasDem',
    'Jenis Kelamin (L/P)',
    'No. WhatsApp / HP',
    'Email',
    'Alamat Lengkap Domisili',
    'STATUS FORMASI',
  ];

  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR KHUSUS: DEWAN PAKAR - TINGKAT ${ctx.level} (${territoryTitle})`],
    [
      '▶ PETUNJUK: Berkas ini KHUSUS posisi Dewan Pakar. Isi kolom Nama Lengkap & NIK. Jabatan lain di database tetap aman.',
    ],
    [],
    headerCols,
  ];

  let dataCount = 0;
  if (currentRows && currentRows.length > 0) {
    const targetRows = currentRows.filter((r) =>
      (r.subOrg || '').toLowerCase().includes('pakar')
    );
    if (targetRows.length > 0) {
      dataCount = targetRows.length;
      targetRows.forEach((r, idx) => {
        const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
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
          isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
        ]);
      });
    } else {
      dataCount = slots.length;
      slots.forEach((s, idx) => {
        sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
      });
    }
  } else {
    dataCount = slots.length;
    slots.forEach((s, idx) => {
      sheetData.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
    });
  }

  sheetData.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ POSISI TAMBAHAN ]: Jika anggota Dewan Pakar lebih banyak dari slot, cukup buat baris baru di bawah.'],
    ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  applyExcelTemplateStyling({
    ws,
    subtitle: `FORMULIR KHUSUS: DEWAN PAKAR - TINGKAT ${ctx.level} (${territoryTitle})`,
    guideText: '▶ PETUNJUK: Berkas ini KHUSUS posisi Dewan Pakar. Cukup isi kolom [NAMA LENGKAP] & [NOMOR NIK].',
    totalDataRows: dataCount,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pakar');

  const cleanDpd = (ctx.dpd || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `TEMPLATE_KHUSUS_DEWAN_PAKAR_${ctx.level}_${cleanDpd}.xlsx`;
  saveWorkbookToExcel(wb, filename);
}

/**
 * 2d. Menghasilkan dan mendownload Template Excel Gabungan Pertimbangan & Pakar
 * Menggunakan 2 SHEET TERPISAH (Sheet 1: Dewan Pertimbangan, Sheet 2: Dewan Pakar)
 * Masing-masing sheet diformat dengan styling visual lengkap dan warna khas.
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
    '* NAMA LENGKAP (WAJIB DIISI) *',
    '* NOMOR NIK (KTP 16 DIGIT) *',
    'Nomor E-KTA NasDem',
    'Jenis Kelamin (L/P)',
    'No. WhatsApp / HP',
    'Email',
    'Alamat Lengkap Domisili',
    'STATUS FORMASI',
  ];

  // Sheet 1: Dewan Pertimbangan
  const sheet1Data: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR KHUSUS: DEWAN PERTIMBANGAN - TINGKAT ${ctx.level} (${territoryTitle})`],
    ['▶ PETUNJUK: Halaman ini murni untuk posisi Dewan Pertimbangan. Isi kolom Nama Lengkap & NIK.'],
    [],
    headerCols,
  ];

  const currentPertimbangan = (currentRows || []).filter((r) =>
    (r.subOrg || '').toLowerCase().includes('pertimbangan')
  );

  let dataCount1 = 0;
  if (currentPertimbangan.length > 0) {
    dataCount1 = currentPertimbangan.length;
    currentPertimbangan.forEach((r, idx) => {
      const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
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
        isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
      ]);
    });
  } else {
    dataCount1 = pertimbanganSlots.length;
    pertimbanganSlots.forEach((s, idx) => {
      sheet1Data.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
    });
  }

  sheet1Data.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ LIHAT SHEET SEBELAH ]: Buka Sheet \"Dewan Pakar\" di tab bawah untuk posisi Dewan Pakar.'],
    ['[ CARA IMPORT ]: Simpan (Ctrl+S), lalu unggah melalui tombol \"Import Excel\" di sistem dashboard matriks.']
  );

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  applyExcelTemplateStyling({
    ws: ws1,
    subtitle: `FORMULIR KHUSUS: DEWAN PERTIMBANGAN - TINGKAT ${ctx.level} (${territoryTitle})`,
    guideText: '▶ PETUNJUK: Halaman ini murni untuk posisi Dewan Pertimbangan. Isi kolom [NAMA LENGKAP] & [NOMOR NIK].',
    totalDataRows: dataCount1,
  });

  // Sheet 2: Dewan Pakar
  const sheet2Data: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR KHUSUS: DEWAN PAKAR - TINGKAT ${ctx.level} (${territoryTitle})`],
    ['▶ PETUNJUK: Halaman ini murni untuk posisi Dewan Pakar. Isi kolom Nama Lengkap & NIK.'],
    [],
    headerCols,
  ];

  const currentPakar = (currentRows || []).filter((r) =>
    (r.subOrg || '').toLowerCase().includes('pakar')
  );

  let dataCount2 = 0;
  if (currentPakar.length > 0) {
    dataCount2 = currentPakar.length;
    currentPakar.forEach((r, idx) => {
      const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
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
        isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
      ]);
    });
  } else {
    dataCount2 = pakarSlots.length;
    pakarSlots.forEach((s, idx) => {
      sheet2Data.push([idx + 1, s.subOrg, s.jabatan, '', '', '', '', '', '', '', '⚡ LOWONG (Silakan Diisi)']);
    });
  }

  sheet2Data.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ LIHAT SHEET SEBELAH ]: Buka Sheet \"Dewan Pertimbangan\" di tab bawah untuk posisi Dewan Pertimbangan.'],
    ['[ CARA IMPORT ]: Simpan (Ctrl+S), lalu unggah melalui tombol \"Import Excel\" di sistem dashboard matriks.']
  );

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  applyExcelTemplateStyling({
    ws: ws2,
    subtitle: `FORMULIR KHUSUS: DEWAN PAKAR - TINGKAT ${ctx.level} (${territoryTitle})`,
    guideText: '▶ PETUNJUK: Halaman ini murni untuk posisi Dewan Pakar. Isi kolom [NAMA LENGKAP] & [NOMOR NIK].',
    totalDataRows: dataCount2,
  });

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
        const joinedRow = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');

        if (
          firstCell.includes('formulir') ||
          firstCell.includes('panduan') ||
          firstCell.includes('petunjuk') ||
          firstCell.includes('wilayah:') ||
          firstCell.includes('susunan pengurus') ||
          joinedRow.includes('susunan pengurus') ||
          firstCell.includes('partai nasdem')
        ) {
          continue;
        }

        // Jangan jadikan baris cluster ("I. DEWAN PERTIMBANGAN") sebagai header kolom tabel!
        if (
          validCells.length <= 2 &&
          (joinedRow.includes('dewan pertimbangan') ||
            joinedRow.includes('dewan pakar') ||
            joinedRow.includes('dewan pimpinan'))
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
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
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

    let currentSectionSubOrg = defaultSubOrg;

    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      // 1. Cek apakah baris ini merupakan Baris Pemisah / Judul Cluster (Section Header)
      // Contoh dokumen user: "I. DEWAN PERTIMBANGAN", "II. DEWAN PAKAR", "III. DEWAN PIMPINAN DAERAH"
      const nonBlankCells = row.map((c) => String(c || '').trim()).filter(Boolean);
      const rowJoined = nonBlankCells.join(' ').toUpperCase();

      if (
        rowJoined.includes('DEWAN PERTIMBANGAN') ||
        rowJoined.includes('DEWAN PAKAR') ||
        rowJoined.includes('DEWAN PIMPINAN')
      ) {
        if (rowJoined.includes('PERTIMBANGAN')) {
          currentSectionSubOrg = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
        } else if (rowJoined.includes('PAKAR')) {
          currentSectionSubOrg = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
        } else if (rowJoined.includes('PIMPINAN')) {
          currentSectionSubOrg =
            ctx.level === 'DPW'
              ? 'DEWAN PIMPINAN WILAYAH'
              : ctx.level === 'DPD'
              ? 'III. DEWAN PIMPINAN DAERAH'
              : ctx.level === 'DPC'
              ? 'III. DEWAN PIMPINAN CABANG'
              : 'DEWAN PIMPINAN RANTING';
        }
        continue; // Lewati baris judul cluster agar tidak masuk sebagai baris pengurus
      }

      const noVal = colNo !== -1 ? Number(row[colNo]) || parsedRows.length + 1 : parsedRows.length + 1;
      let subOrgVal = colSubOrg !== -1 ? String(row[colSubOrg] || '').trim() : '';
      if (!subOrgVal) subOrgVal = currentSectionSubOrg || defaultSubOrg;

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
      
      // Deteksi final subOrg: keyword jabatan lebih prioritas dari sectionFallback
      let sectionFallback = currentSectionSubOrg || defaultSubOrg;
      const jLow = jabatanVal.toLowerCase();
      // Override jika jabatan mengandung kata kunci dewan yang eksplisit
      if (jLow.includes('pertimbangan') || jLow.includes('wanhat') || jLow.includes('wantim')) {
        sectionFallback = ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
      } else if (jLow.includes('pakar') || jLow.includes('wanpak')) {
        sectionFallback = ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
      }

      let finalSubOrg =
        subOrgVal ||
        sectionFallback ||
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
