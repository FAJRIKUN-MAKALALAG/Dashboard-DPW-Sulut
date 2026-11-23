import XLSX from 'xlsx-js-style';
import { PositionSlot, getStructureTemplate } from '../../data/structureTemplates';
import { GridRowItem } from '../../components/matrix';
import { isGeneratedNik, isGeneratedEkta, validateRequiredImportColumns } from '../generatedIds';
import { isDpdMatch } from '../structureReadinessUtils';
import { TerritoryContext } from './excelTypes';
import { applyExcelTemplateStyling, applyInfoSheetStyling } from './excelStyles';

export const TEMPLATE_HEADER_COLS: string[] = [
  'No',
  'Sub Organisasi',
  'Jabatan Pengurus',
  '* NAMA LENGKAP (WAJIB) *',
  '* NOMOR NIK 16 DIGIT (WAJIB) *',
  '* NOMOR E-KTA NASDEM (WAJIB) *',
  '* NO. WHATSAPP / HP (WAJIB) *',
  'Jenis Kelamin (L/P)',
  'Email',
  'Alamat Lengkap Domisili',
  'STATUS FORMASI',
];

const STANDARD_GUIDE_ROWS: (string | number)[][] = [
  [],
  ['★ PANDUAN PENGISIAN FORMULIR EXCEL (4 KOLOM WAJIB AGAR LOLOS IMPORT):'],
  [
    '[ WARNA KUNING TERANG ]: 4 Kolom WAJIB diisi agar baris tersimpan -> Nama Lengkap, NIK (16 Digit KTP), Nomor e-KTA NasDem, dan No. WhatsApp/HP (min. 8 digit).',
  ],
  ['[ WARNA PUTIH ]: Kolom pelengkap (Jenis Kelamin L/P untuk kuota 30% perempuan, Email, dan Alamat Domisili).'],
  ['[ POSISI TAMBAHAN ]: Jika ada pengurus tambahan di luar daftar jabatan baku, buat baris baru di bawah tabel.'],
  ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di halaman Matriks wilayah yang sesuai.'],
];

function cleanSlug(s?: string): string {
  return (s || '').trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}

export function getTerritoryFilename(ctx: TerritoryContext, prefix = 'TEMPLATE_PENGURUS'): string {
  if (ctx.level === 'DPW') {
    return `${prefix}_DPW_SULAWESI_UTARA.xlsx`;
  }
  if (ctx.level === 'DPD') {
    return `${prefix}_DPD_${cleanSlug(ctx.dpd)}.xlsx`;
  }
  if (ctx.level === 'DPC') {
    return `${prefix}_DPC_${cleanSlug(ctx.dpd)}_KEC_${cleanSlug(ctx.dpc)}.xlsx`;
  }
  return `${prefix}_DPRT_${cleanSlug(ctx.dpd)}_${cleanSlug(ctx.dpc)}_DESA_${cleanSlug(ctx.dprt)}.xlsx`;
}

function getTerritoryDisplayTitle(ctx: TerritoryContext): string {
  if (ctx.level === 'DPW') return 'PROVINSI SULAWESI UTARA';
  if (ctx.level === 'DPD') return ctx.dpd.toUpperCase();
  if (ctx.level === 'DPC') {
    return `KECAMATAN ${(ctx.dpc || '-').toUpperCase()} - ${ctx.dpd.toUpperCase()}`;
  }
  return `DESA/KELURAHAN ${(ctx.dprt || '-').toUpperCase()} - KEC. ${(ctx.dpc || '-').toUpperCase()} (${ctx.dpd.toUpperCase()})`;
}

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

const SULUT_DPD_CODES: Record<string, string> = {
  'KOTA MANADO': '7171',
  'KOTA BITUNG': '7172',
  'KOTA TOMOHON': '7173',
  'KOTA KOTAMOBAGU': '7174',
  'KABUPATEN BOLAANG MONGONDOW': '7101',
  'KABUPATEN MINAHASA': '7102',
  'KABUPATEN KEPULAUAN SANGIHE': '7103',
  'KABUPATEN KEPULAUAN TALAUD': '7104',
  'KABUPATEN MINAHASA SELATAN': '7105',
  'KABUPATEN MINAHASA UTARA': '7106',
  'KABUPATEN MINAHASA TENGGARA': '7107',
  'KABUPATEN BOLAANG MONGONDOW UTARA': '7108',
  'KABUPATEN KEPULAUAN SIAU TAGULANDANG BIARO': '7109',
  'KABUPATEN KEPULAUAN SITARO': '7109',
  'KABUPATEN BOLAANG MONGONDOW TIMUR': '7110',
  'KABUPATEN BOLAANG MONGONDOW SELATAN': '7111',
};

function getDpdPrefix(dpdName: string): string {
  const norm = (dpdName || '').trim().toUpperCase();
  if (!norm) return '7100';

  for (const [key, code] of Object.entries(SULUT_DPD_CODES)) {
    if (norm === key || isDpdMatch(dpdName, key)) return code;
  }

  const sortedEntries = Object.entries(SULUT_DPD_CODES).sort((a, b) => b[0].length - a[0].length);
  for (const [key, code] of sortedEntries) {
    if (norm.includes(key) || key.includes(norm)) return code;
  }
  return '7100';
}

function getSubOrgPrefix(subOrg: string): string {
  const s = (subOrg || '').toLowerCase();
  if (s.includes('pertimbangan')) return '11';
  if (s.includes('pakar')) return '22';
  if (s.includes('cabang') || s.includes('dpc')) return '33';
  if (s.includes('ranting') || s.includes('dprt')) return '44';
  if (s.includes('pimpinan') || s.includes('dpd') || s.includes('dpw')) return '55';
  return '99';
}

function hashTerritoryScope(scopeKey?: string): string {
  const clean = (scopeKey || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return '0000';
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bucket = (Math.abs(h) % 9000) + 1000;
  return String(bucket);
}

export function generateUniqueTerritoryNik(
  dpdName: string,
  subOrg: string,
  seq: number,
  occupiedNiks: Set<string>,
  scopeKey?: string
): string {
  const regCode = getDpdPrefix(dpdName);
  const orgCode = getSubOrgPrefix(subOrg);
  const prefix = `${regCode}${orgCode}26`;
  const scopePart = hashTerritoryScope(scopeKey);

  let counter = Math.max(1, seq);
  let candidate = '';
  do {
    if (scopePart !== '0000' && counter <= 9999) {
      candidate = `${prefix}${scopePart}${String(counter).padStart(4, '0')}`;
    } else {
      candidate = `${prefix}${String(counter).padStart(8, '0')}`;
    }
    counter++;
  } while (occupiedNiks.has(candidate));

  occupiedNiks.add(candidate);
  return candidate;
}

function buildRowFromExisting(
  idx: number,
  r: GridRowItem,
  fallbackSubOrg: string
): (string | number)[] {
  const cleanName = (r.namaLengkap || '').trim();
  const cleanNik = r.nik && !isGeneratedNik(r.nik) ? r.nik.trim() : '';
  const cleanEkta =
    r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
      ? r.nomorEKTA.trim()
      : '';
  const cleanHp = r.nomorHP && r.nomorHP !== '-' ? r.nomorHP.trim() : '';

  let statusLabel = '⚡ LOWONG (Isi 4 Kolom Wajib)';
  if (cleanName) {
    const check = validateRequiredImportColumns({
      nik: cleanNik,
      nomorEKTA: cleanEkta,
      nomorHP: cleanHp,
    });
    statusLabel = check.isValid
      ? '✓ LENGKAP & AKTIF'
      : `⚠️ LENGKAPI (${check.missingFields.join(', ')})`;
  }

  return [
    idx + 1,
    r.subOrg || fallbackSubOrg,
    r.jabatan || 'Pengurus',
    cleanName,
    cleanNik,
    cleanEkta,
    cleanHp,
    '',
    r.email || '',
    '',
    statusLabel,
  ];
}

function buildVacantSlotRow(idx: number, s: PositionSlot): (string | number)[] {
  return [
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
    '⚡ LOWONG (Isi 4 Kolom Wajib)',
  ];
}

function buildCouncilSheetRows(
  sheetData: (string | number)[][],
  councilSubOrg: string,
  existingRows: GridRowItem[],
  defaultSlots: PositionSlot[]
): number {
  if (existingRows.length > 0) {
    existingRows.forEach((r, idx) => {
      sheetData.push(buildRowFromExisting(idx, r, councilSubOrg));
    });
    return existingRows.length;
  }
  defaultSlots.forEach((s, idx) => {
    sheetData.push(buildVacantSlotRow(idx, s));
  });
  return defaultSlots.length;
}

export function downloadTerritorialExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const slots: PositionSlot[] = getStructureTemplate(ctx.level);
  const territoryTitle = getTerritoryDisplayTitle(ctx);
  const subtitle = `FORMULIR RESMI INPUT SUSUNAN PENGURUS - TINGKAT ${ctx.level} (${territoryTitle})`;

  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [subtitle],
    [
      '▶ WAJIB DIISI AGAR LOLOS IMPORT: (1) Nama Lengkap, (2) NIK 16 Digit, (3) Nomor E-KTA NasDem, (4) No. WhatsApp/HP.',
    ],
    [],
    TEMPLATE_HEADER_COLS,
  ];

  const isPertimbangan = (sub: string) => {
    const up = (sub || '').toUpperCase();
    return up.includes('PERTIMBANGAN') || up.includes('WANKAR');
  };
  const isPakar = (sub: string) => {
    const up = (sub || '').toUpperCase();
    return up.includes('PAKAR') || up.includes('WANGAN');
  };

  const pertimbanganSlots = slots.filter((s) => isPertimbangan(s.subOrg));
  const pakarSlots = slots.filter((s) => isPakar(s.subOrg));
  const pimpinanSlots = slots.filter((s) => !isPertimbangan(s.subOrg) && !isPakar(s.subOrg));

  const currentPertimbangan = (currentRows || []).filter((r) => isPertimbangan(r.subOrg || ''));
  const currentPakar = (currentRows || []).filter((r) => isPakar(r.subOrg || ''));
  const currentPimpinan = (currentRows || []).filter(
    (r) => !isPertimbangan(r.subOrg || '') && !isPakar(r.subOrg || '')
  );

  const pimpinanName =
    ctx.level === 'DPW'
      ? 'DEWAN PIMPINAN WILAYAH'
      : ctx.level === 'DPD'
      ? 'III. DEWAN PIMPINAN DAERAH'
      : ctx.level === 'DPC'
      ? 'III. DEWAN PIMPINAN CABANG'
      : 'DEWAN PIMPINAN RANTING';

  let dataCount = 0;

  if (ctx.level === 'DPW') {
    // Urutan resmi DPW: Dewan Pimpinan Wilayah -> Dewan Pertimbangan -> Dewan Pakar (70 posisi)
    dataCount += buildCouncilSheetRows(sheetData, pimpinanName, currentPimpinan, pimpinanSlots);
    dataCount += buildCouncilSheetRows(
      sheetData,
      'DEWAN PERTIMBANGAN WILAYAH',
      currentPertimbangan,
      pertimbanganSlots
    );
    dataCount += buildCouncilSheetRows(
      sheetData,
      'DEWAN PAKAR WILAYAH',
      currentPakar,
      pakarSlots
    );
  } else {
    // Urutan resmi DPD (44), DPC (25), dan DPRt (11)
    if (ctx.level !== 'DPRt' || currentPertimbangan.length > 0) {
      dataCount += buildCouncilSheetRows(
        sheetData,
        'I. DEWAN PERTIMBANGAN',
        currentPertimbangan,
        pertimbanganSlots
      );
    }
    if (ctx.level !== 'DPRt' || currentPakar.length > 0) {
      dataCount += buildCouncilSheetRows(
        sheetData,
        'II. DEWAN PAKAR',
        currentPakar,
        pakarSlots
      );
    }
    dataCount += buildCouncilSheetRows(sheetData, pimpinanName, currentPimpinan, pimpinanSlots);
  }

  sheetData.push(...STANDARD_GUIDE_ROWS);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  applyExcelTemplateStyling({
    ws,
    subtitle,
    totalDataRows: dataCount,
  });

  const infoData: (string | number)[][] = [
    ['INFORMASI DAN PANDUAN PENGISIAN STRUKTUR WILAYAH'],
    ['================================================='],
    ['Tingkat Kepengurusan', ctx.level],
    ['Kabupaten / Kota (DPD)', ctx.dpd],
    ['Kecamatan (DPC)', ctx.dpc || '-'],
    ['Desa / Kelurahan (DPRt)', ctx.dprt || '-'],
    ['Total Posisi Template Resmi', slots.length],
    [],
    ['ATURAN IMPORT & KETENTUAN PENGISIAN (WAJIB DIBACA):'],
    ['1. Kolom Nama Lengkap: Wajib diisi lengkap (boleh menyertakan gelar akademik).'],
    ['2. Kolom NIK: WAJIB diisi tepat 16 digit angka KTP asli (baris tanpa 16 digit NIK akan ditolak saat import).'],
    ['3. Kolom Nomor E-KTA: WAJIB diisi nomor e-KTA resmi NasDem (baris tanpa e-KTA akan ditolak saat import).'],
    ['4. Kolom No. WhatsApp/HP: WAJIB diisi nomor aktif minimal 8 digit angka (baris tanpa No. HP akan ditolak).'],
    ['5. Kolom Jenis Kelamin: Isi "L" (Laki-laki) atau "P" (Perempuan) untuk perhitungan keterwakilan 30% perempuan.'],
    ['6. Kolom Jabatan: Gunakan jabatan baku yang tersedia, atau tambah baris baru di bawah untuk posisi tambahan.'],
    ['7. Simpan berkas Excel ini lalu unggah kembali melalui tombol "Import Excel" di halaman Matriks terkait.'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  applyInfoSheetStyling(wsInfo, infoData.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form Input Pengurus');
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Panduan Wilayah');

  const filename = getTerritoryFilename(ctx, 'TEMPLATE_INPUT_PENGURUS');
  saveWorkbookToExcel(wb, filename);
}

function buildCouncilOnlyWorksheet(
  ctx: TerritoryContext,
  councilKeyword: 'pertimbangan' | 'pakar',
  currentRows?: GridRowItem[],
  customFooterHint?: string
): { ws: XLSX.WorkSheet; titleLabel: string } {
  const allSlots: PositionSlot[] = getStructureTemplate(ctx.level);
  const slots = allSlots.filter((s) => (s.subOrg || '').toLowerCase().includes(councilKeyword));
  const fallbackSubOrg =
    councilKeyword === 'pertimbangan'
      ? ctx.level === 'DPW'
        ? 'DEWAN PERTIMBANGAN WILAYAH'
        : 'I. DEWAN PERTIMBANGAN'
      : ctx.level === 'DPW'
      ? 'DEWAN PAKAR WILAYAH'
      : 'II. DEWAN PAKAR';

  const titleLabel = councilKeyword === 'pertimbangan' ? 'Dewan Pertimbangan' : 'Dewan Pakar';
  const territoryTitle = getTerritoryDisplayTitle(ctx);
  const subtitle = `FORMULIR KHUSUS: ${titleLabel.toUpperCase()} - TINGKAT ${ctx.level} (${territoryTitle})`;

  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [subtitle],
    [
      `▶ KHUSUS ${titleLabel.toUpperCase()}: Wajib isi Nama Lengkap, NIK 16 Digit, Nomor E-KTA, dan No. WhatsApp/HP. Jabatan lain di database tetap aman.`,
    ],
    [],
    TEMPLATE_HEADER_COLS,
  ];

  const targetRows = (currentRows || []).filter((r) =>
    (r.subOrg || '').toLowerCase().includes(councilKeyword)
  );
  const dataCount = buildCouncilSheetRows(sheetData, fallbackSubOrg, targetRows, slots);

  if (customFooterHint) {
    sheetData.push(
      [],
      ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL (4 KOLOM WAJIB):'],
      [
        '[ WARNA KUNING TERANG ]: 4 Kolom WAJIB agar lolos import -> Nama Lengkap, NIK 16 Digit, Nomor e-KTA, No. WhatsApp/HP.',
      ],
      ['[ WARNA PUTIH ]: Kolom opsional (Jenis Kelamin L/P, Email, Alamat Domisili).'],
      [customFooterHint],
      ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di matriks terkait.']
    );
  } else {
    sheetData.push(...STANDARD_GUIDE_ROWS);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  applyExcelTemplateStyling({
    ws,
    subtitle,
    totalDataRows: dataCount,
  });

  return { ws, titleLabel };
}

export function downloadAdvisoryOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const { ws } = buildCouncilOnlyWorksheet(ctx, 'pertimbangan', currentRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pertimbangan');
  const filename = getTerritoryFilename(ctx, 'TEMPLATE_DEWAN_PERTIMBANGAN');
  saveWorkbookToExcel(wb, filename);
}

export function downloadExpertOnlyExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const { ws } = buildCouncilOnlyWorksheet(ctx, 'pakar', currentRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dewan Pakar');
  const filename = getTerritoryFilename(ctx, 'TEMPLATE_DEWAN_PAKAR');
  saveWorkbookToExcel(wb, filename);
}

export function downloadAdvisoryAndExpertExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const { ws: ws1 } = buildCouncilOnlyWorksheet(
    ctx,
    'pertimbangan',
    currentRows,
    '[ LIHAT SHEET SEBELAH ]: Buka tab "Dewan Pakar" untuk mengisi posisi Dewan Pakar.'
  );
  const { ws: ws2 } = buildCouncilOnlyWorksheet(
    ctx,
    'pakar',
    currentRows,
    '[ LIHAT SHEET SEBELAH ]: Buka tab "Dewan Pertimbangan" untuk mengisi posisi Dewan Pertimbangan.'
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Dewan Pertimbangan');
  XLSX.utils.book_append_sheet(wb, ws2, 'Dewan Pakar');

  const filename = getTerritoryFilename(ctx, 'TEMPLATE_PERTIMBANGAN_DAN_PAKAR');
  saveWorkbookToExcel(wb, filename);
}
