import XLSX from 'xlsx-js-style';
import { PositionSlot, getStructureTemplate } from '../../data/structureTemplates';
import { GridRowItem } from '../../components/matrix';
import { isGeneratedNik, isGeneratedEkta } from '../generatedIds';
import { TerritoryContext } from './excelTypes';
import { applyExcelTemplateStyling, applyInfoSheetStyling } from './excelStyles';

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
  for (const [key, code] of Object.entries(SULUT_DPD_CODES)) {
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

export function generateUniqueTerritoryNik(
  dpdName: string,
  subOrg: string,
  seq: number,
  occupiedNiks: Set<string>
): string {
  const regCode = getDpdPrefix(dpdName);
  const orgCode = getSubOrgPrefix(subOrg);
  const prefix = `${regCode}${orgCode}26`;

  let counter = Math.max(1, seq);
  let candidate = '';
  do {
    candidate = `${prefix}${String(counter).padStart(8, '0')}`;
    counter++;
  } while (occupiedNiks.has(candidate));

  occupiedNiks.add(candidate);
  return candidate;
}

export function downloadTerritorialExcelTemplate(
  ctx: TerritoryContext,
  currentRows?: GridRowItem[]
): void {
  const slots: PositionSlot[] = getStructureTemplate(ctx.level);

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

  const sheetData: (string | number)[][] = [
    ['★ PARTAI NASDEM - DEWAN PIMPINAN WILAYAH SULAWESI UTARA ★'],
    [`FORMULIR RESMI INPUT SUSUNAN PENGURUS - TINGKAT ${ctx.level} (${territoryTitle})`],
    [
      '▶ PETUNJUK: Cukup isi kolom [NAMA LENGKAP] (Warna Hijau & Kuning) dan [NOMOR NIK]. Kolom Jabatan baku sudah terkunci rapi.',
    ],
    [],
    headerCols,
  ];

  let dataCount = 0;

  const pertimbanganSlots = slots.filter((s) => s.subOrg.toUpperCase().includes('PERTIMBANGAN'));
  const pakarSlots = slots.filter((s) => s.subOrg.toUpperCase().includes('PAKAR'));
  const pimpinanSlots = slots.filter(
    (s) =>
      !s.subOrg.toUpperCase().includes('PERTIMBANGAN') &&
      !s.subOrg.toUpperCase().includes('PAKAR')
  );

  const currentPertimbangan = (currentRows || []).filter(
    (r) =>
      (r.subOrg || '').toUpperCase().includes('PERTIMBANGAN') ||
      (r.subOrg || '').toUpperCase().includes('WANKAR')
  );
  const currentPakar = (currentRows || []).filter(
    (r) =>
      (r.subOrg || '').toUpperCase().includes('PAKAR') ||
      (r.subOrg || '').toUpperCase().includes('WANGAN')
  );
  const currentPimpinan = (currentRows || []).filter(
    (r) =>
      !(r.subOrg || '').toUpperCase().includes('PERTIMBANGAN') &&
      !(r.subOrg || '').toUpperCase().includes('WANKAR') &&
      !(r.subOrg || '').toUpperCase().includes('PAKAR') &&
      !(r.subOrg || '').toUpperCase().includes('WANGAN')
  );

  const addRowsForCouncil = (
    councilSubOrg: string,
    existingRows: GridRowItem[],
    defaultSlots: PositionSlot[]
  ) => {
    if (existingRows.length > 0) {
      existingRows.forEach((r, idx) => {
        dataCount++;
        const isRowFilled = Boolean(r.namaLengkap && r.namaLengkap.trim() !== '');
        sheetData.push([
          idx + 1,
          r.subOrg || councilSubOrg,
          r.jabatan || 'Pengurus',
          r.namaLengkap || '',
          r.nik && !isGeneratedNik(r.nik) ? r.nik : '',
          r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
            ? r.nomorEKTA
            : '',
          '',
          r.nomorHP && r.nomorHP !== '-' ? r.nomorHP : '',
          r.email || '',
          '',
          isRowFilled ? '✓ TERISI (Aktif)' : '⚡ LOWONG (Silakan Diisi)',
        ]);
      });
    } else {
      defaultSlots.forEach((s, idx) => {
        dataCount++;
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
          '⚡ LOWONG (Silakan Diisi)',
        ]);
      });
    }
  };

  addRowsForCouncil(
    ctx.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN',
    currentPertimbangan,
    pertimbanganSlots.length > 0
      ? pertimbanganSlots
      : [
          { no: 1, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Ketua' },
          { no: 2, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Wakil Ketua' },
          { no: 3, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Sekretaris' },
          { no: 4, subOrg: 'I. DEWAN PERTIMBANGAN', jabatan: 'Anggota' },
        ]
  );

  addRowsForCouncil(
    ctx.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR',
    currentPakar,
    pakarSlots.length > 0
      ? pakarSlots
      : [
          { no: 1, subOrg: 'II. DEWAN PAKAR', jabatan: 'Ketua' },
          { no: 2, subOrg: 'II. DEWAN PAKAR', jabatan: 'Wakil Ketua' },
          { no: 3, subOrg: 'II. DEWAN PAKAR', jabatan: 'Sekretaris' },
          { no: 4, subOrg: 'II. DEWAN PAKAR', jabatan: 'Anggota' },
        ]
  );

  addRowsForCouncil(
    ctx.level === 'DPW'
      ? 'DEWAN PIMPINAN WILAYAH'
      : ctx.level === 'DPD'
      ? 'III. DEWAN PIMPINAN DAERAH'
      : ctx.level === 'DPC'
      ? 'III. DEWAN PIMPINAN CABANG'
      : 'DEWAN PIMPINAN RANTING',
    currentPimpinan,
    pimpinanSlots
  );

  sheetData.push(
    [],
    ['★ PANDUAN WARNA & PENGISIAN FORMULIR EXCEL:'],
    ['[ WARNA KUNING TERANG ]: Kolom Nama Lengkap & NIK yang WAJIB Anda isi untuk posisi yang masih LOWONG.'],
    ['[ WARNA PUTIH ]: Kolom opsional (E-KTA, Gender, WhatsApp, Email, Alamat) atau posisi yang sudah terisi.'],
    ['[ POSISI TAMBAHAN ]: Ingin menambah pengurus baru di luar daftar baku ini? Cukup buat baris baru di bawah tabel.'],
    ['[ CARA IMPORT ]: Simpan berkas ini (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  applyExcelTemplateStyling({
    ws,
    subtitle: `FORMULIR RESMI INPUT SUSUNAN PENGURUS - TINGKAT ${ctx.level} (${territoryTitle})`,
    totalDataRows: dataCount,
  });

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
          r.nik && !isGeneratedNik(r.nik) ? r.nik : '',
          r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
            ? r.nomorEKTA
            : '',
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
          r.nik && !isGeneratedNik(r.nik) ? r.nik : '',
          r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
            ? r.nomorEKTA
            : '',
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
        r.nik && !isGeneratedNik(r.nik) ? r.nik : '',
        r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
          ? r.nomorEKTA
          : '',
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
    ['[ LIHAT SHEET SEBELAH ]: Buka Sheet "Dewan Pakar" di tab bawah untuk posisi Dewan Pakar.'],
    ['[ CARA IMPORT ]: Simpan (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
  );

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  applyExcelTemplateStyling({
    ws: ws1,
    subtitle: `FORMULIR KHUSUS: DEWAN PERTIMBANGAN - TINGKAT ${ctx.level} (${territoryTitle})`,
    guideText: '▶ PETUNJUK: Halaman ini murni untuk posisi Dewan Pertimbangan. Isi kolom [NAMA LENGKAP] & [NOMOR NIK].',
    totalDataRows: dataCount1,
  });

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
        r.nik && !isGeneratedNik(r.nik) ? r.nik : '',
        r.nomorEKTA && !isGeneratedEkta(r.nomorEKTA) && !r.nomorEKTA.startsWith('71002026')
          ? r.nomorEKTA
          : '',
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
    ['[ LIHAT SHEET SEBELAH ]: Buka Sheet "Dewan Pertimbangan" di tab bawah untuk posisi Dewan Pertimbangan.'],
    ['[ CARA IMPORT ]: Simpan (Ctrl+S), lalu unggah melalui tombol "Import Excel" di sistem dashboard matriks.']
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
