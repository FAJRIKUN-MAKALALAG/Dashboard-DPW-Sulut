import XLSX, { Range } from 'xlsx-js-style';

/**
 * Helper untuk memberikan styling visual pada lembar kerja Excel (XLSX) 11-kolom:
 * 0: No | 1: Sub Organisasi | 2: Jabatan | 3: Nama (Wajib) | 4: NIK (Wajib)
 * 5: E-KTA (Wajib) | 6: No. HP (Wajib) | 7: Jenis Kelamin | 8: Email | 9: Alamat | 10: Status Formasi
 * Kolom 4, 5, 6 diformat sebagai Teks ('@') agar angka 16 digit NIK/E-KTA dan angka 0 di awal No. HP tidak hilang di Excel.
 */
export function applyExcelTemplateStyling(options: {
  ws: XLSX.WorkSheet;
  title?: string;
  subtitle: string;
  guideText?: string;
  totalDataRows: number;
}): void {
  const { ws, totalDataRows } = options;
  const lastCol = 10;

  // 1. Lebar Kolom yang Nyaman & Proporsional
  ws['!cols'] = [
    { wch: 7 },  // 0: No
    { wch: 30 }, // 1: Sub Organisasi
    { wch: 42 }, // 2: Jabatan Pengurus
    { wch: 38 }, // 3: * NAMA LENGKAP (WAJIB) *
    { wch: 26 }, // 4: * NOMOR NIK 16 DIGIT (WAJIB) *
    { wch: 26 }, // 5: * NOMOR E-KTA NASDEM (WAJIB) *
    { wch: 22 }, // 6: * NO. WHATSAPP / HP (WAJIB) *
    { wch: 18 }, // 7: Jenis Kelamin (L/P)
    { wch: 26 }, // 8: Email
    { wch: 34 }, // 9: Alamat Lengkap Domisili
    { wch: 24 }, // 10: STATUS FORMASI
  ];

  // 2. Merges untuk Banner Judul & Legend Bawah
  const merges: Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }, // Row 1 Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }, // Row 2 Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } }, // Row 3 Guide
  ];

  const legendStartRow = 5 + totalDataRows + 1;
  for (let offset = 0; offset < 5; offset++) {
    merges.push({
      s: { r: legendStartRow + offset, c: 0 },
      e: { r: legendStartRow + offset, c: lastCol },
    });
  }

  ws['!merges'] = merges;

  // 3. Tinggi Baris (Row Heights)
  const rowHeights: { hpt: number }[] = [
    { hpt: 34 }, // Row 1 Judul Utama
    { hpt: 26 }, // Row 2 Sub Judul Wilayah
    { hpt: 28 }, // Row 3 Petunjuk
    { hpt: 12 }, // Row 4 Pemisah
    { hpt: 34 }, // Row 5 Table Column Headers
  ];
  for (let i = 0; i < totalDataRows; i++) {
    rowHeights.push({ hpt: 24 });
  }
  rowHeights.push({ hpt: 14 });
  rowHeights.push({ hpt: 24 });
  rowHeights.push({ hpt: 20 });
  rowHeights.push({ hpt: 20 });
  rowHeights.push({ hpt: 20 });
  rowHeights.push({ hpt: 20 });

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

  const borderGreen = {
    top: { style: 'thin', color: { rgb: '86EFAC' } },
    bottom: { style: 'thin', color: { rgb: '86EFAC' } },
    left: { style: 'thin', color: { rgb: '86EFAC' } },
    right: { style: 'thin', color: { rgb: '86EFAC' } },
  };

  // 4. Style Banner Atas (Rows 0..2)
  for (let c = 0; c <= lastCol; c++) {
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
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'FCD34D' } },
        bottom: { style: 'thin', color: { rgb: 'FCD34D' } },
        left: { style: 'thin', color: { rgb: 'FCD34D' } },
        right: { style: 'thin', color: { rgb: 'FCD34D' } },
      },
    };
  }

  // 5. Style Header Tabel (Row 4 / Baris ke-5 di Excel)
  for (let c = 0; c <= lastCol; c++) {
    const ref = XLSX.utils.encode_cell({ r: 4, c });
    if (!ws[ref]) continue;

    let bgColor = '0F172A';
    if (c === 3) bgColor = '047857';
    else if (c === 4 || c === 5 || c === 6) bgColor = '059669';
    else if (c === 10) bgColor = '1E1B4B';
    else if (c >= 7) bgColor = '334155';

    ws[ref].s = {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
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
      subBg = 'EEF2FF';
      subColor = '3730A3';
    } else if (subOrgVal.includes('pakar')) {
      subBg = 'FAF5FF';
      subColor = '6B21A8';
    } else if (
      subOrgVal.includes('pimpinan') ||
      subOrgVal.includes('dpd') ||
      subOrgVal.includes('dpw') ||
      subOrgVal.includes('dpc') ||
      subOrgVal.includes('dprt')
    ) {
      subBg = 'EFF6FF';
      subColor = '1E40AF';
    }

    const jabatanRef = XLSX.utils.encode_cell({ r, c: 2 });
    const jabatanVal =
      ws[jabatanRef] && ws[jabatanRef].v ? String(ws[jabatanRef].v).toLowerCase() : '';
    const isTopLeader =
      jabatanVal.includes('ketua') ||
      jabatanVal.includes('sekretaris') ||
      jabatanVal.includes('bendahara');

    for (let c = 0; c <= lastCol; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };

      // Format Teks (@) untuk NIK (4), E-KTA (5), dan No. HP (6)
      const isTextIdCol = c === 4 || c === 5 || c === 6;
      if (isTextIdCol) {
        ws[ref].t = 's';
        ws[ref].z = '@';
        if (ws[ref].v !== undefined && ws[ref].v !== null) {
          ws[ref].v = String(ws[ref].v);
        }
      }

      const cellHasValue = String(ws[ref].v || '').trim().length > 0;

      if (c === 0) {
        ws[ref].s = {
          fill: { fgColor: { rgb: 'F8FAFC' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '475569' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 1) {
        ws[ref].s = {
          fill: { fgColor: { rgb: subBg } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: subColor } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 2) {
        ws[ref].s = {
          fill: { fgColor: { rgb: isTopLeader ? 'FEFCE8' : 'FFFFFF' } },
          font: {
            name: 'Calibri',
            sz: 10,
            bold: isTopLeader,
            color: { rgb: isTopLeader ? '854D0E' : '0F172A' },
          },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: borderThin,
        };
      } else if (c === 3) {
        // NAMA LENGKAP (WAJIB)
        ws[ref].s = isFilled
          ? {
              fill: { fgColor: { rgb: 'F0FDF4' } },
              font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '166534' } },
              alignment: { horizontal: 'left', vertical: 'center' },
              border: borderGreen,
            }
          : {
              fill: { fgColor: { rgb: 'FEF08A' } },
              font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '713F12' } },
              alignment: { horizontal: 'left', vertical: 'center' },
              border: borderAmber,
            };
      } else if (isTextIdCol) {
        // NIK (4), E-KTA (5), NO. HP (6) - WAJIB
        ws[ref].s = cellHasValue
          ? {
              numFmt: '@',
              fill: { fgColor: { rgb: 'F8FAFC' } },
              font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin,
            }
          : {
              numFmt: '@',
              fill: { fgColor: { rgb: 'FEF9C3' } },
              font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '854D0E' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderAmber,
            };
      } else if (c === 10) {
        // STATUS FORMASI
        ws[ref].s = isFilled
          ? {
              fill: { fgColor: { rgb: 'DCFCE7' } },
              font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '166534' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderGreen,
            }
          : {
              fill: { fgColor: { rgb: 'FEF3C7' } },
              font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '92400E' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderAmber,
            };
      } else {
        ws[ref].s = {
          fill: { fgColor: { rgb: 'FFFFFF' } },
          font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '334155' } },
          alignment: { horizontal: c === 7 ? 'center' : 'left', vertical: 'center' },
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
    for (let c = 0; c <= lastCol; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = {
        fill: { fgColor: { rgb: bg } },
        font: { name: 'Calibri', sz, bold, color: { rgb: fg } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin,
      };
    }
  });
}

/**
 * Styling untuk Sheet 2 (Panduan & Informasi Wilayah)
 */
export function applyInfoSheetStyling(ws: XLSX.WorkSheet, totalRows: number): void {
  ws['!cols'] = [{ wch: 36 }, { wch: 68 }];
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
