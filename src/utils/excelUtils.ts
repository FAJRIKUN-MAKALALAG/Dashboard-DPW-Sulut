import * as XLSX from 'xlsx';
import { Member, MemberStatus } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { validateRequiredImportColumns } from './generatedIds';

export interface ValidationResult {
  rowNumber: number;
  data: Partial<Member>;
  isValid: boolean;
  errors: string[];
  warning?: string;
}

export function downloadEmptyTemplate(): void {
  const headers = [
    'No',
    'Jabatan Pengurus',
    'Nama Lengkap (Sesuai KTP)',
    'No. NIK',
    'E-KTA NasDem',
    'Email',
    'No Telepon',
    'Sosial Media',
    'DPD (Kabupaten/Kota)',
    'DPC Kecamatan',
    'DPRt (Desa/Kelurahan)',
  ];

  // Include sample instruction rows with all required import columns filled
  const sampleRows = [
    [
      '1',
      'Anggota Biasa',
      'CONTOH KADER MINAHASA SELATAN',
      '7105172908850001',
      '1966795504182866',
      'kader.minsel@nasdem.id',
      '081234567890',
      '@kader_nasdem',
      'Kabupaten Minahasa Selatan',
      'Amurang',
      'Buyungon',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 24 }, // Jabatan Pengurus
    { wch: 34 }, // Nama Lengkap
    { wch: 20 }, // No. NIK
    { wch: 22 }, // E-KTA NasDem
    { wch: 24 }, // Email
    { wch: 18 }, // No Telepon
    { wch: 20 }, // Sosial Media
    { wch: 28 }, // DPD (Kabupaten/Kota)
    { wch: 22 }, // DPC Kecamatan
    { wch: 24 }, // DPRt (Desa/Kelurahan)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Kader NasDem');
  XLSX.writeFile(wb, 'TEMPLATE_IMPORT_KADER_NASDEM_SULUT.xlsx');
}

export function downloadSampleDataCsv(): void {
  const sampleCsvContent = `No,Jabatan Pengurus,Nama Lengkap (Sesuai KTP),No. NIK,E-KTA NasDem,Email,No Telepon,Sosial Media,DPD (Kabupaten/Kota),DPC Kecamatan,DPRt (Desa/Kelurahan)
1,Anggota Biasa,CONTOH KADER AMURANG BARAT,7105173009800001,2133352341474362,,081298765432,,Kabupaten Minahasa Selatan,Amurang Barat,Rumoong Bawah
2,Anggota Biasa,CONTOH KADER AMURANG TIMUR,7105181109740001,2079175003426472,,081345678901,,Kabupaten Minahasa Selatan,Amurang Timur,Ranomea`;

  const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'CONTOH_IMPORT_KADER_SULUT.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function parseUploadedFile(
  file: File,
  existingMembers: Member[]
): Promise<{ results: ValidationResult[]; totalRows: number; validCount: number; errorCount: number }> {
  const existingNiks = new Set(existingMembers.map((m) => m.nik.trim()));
  const seenNiksInFile = new Set<string>();

  const validDpdNames = SULUT_REGIONS.map((r) => r.name.toLowerCase().trim());

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays
  const rawRows: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });

  if (rawRows.length < 2) {
    throw new Error('File tidak memiliki baris data (hanya header atau kosong).');
  }

  // Check if header row exists
  const headerRow = (rawRows[0] || []).map((h) => String(h).toLowerCase().trim());
  
  // Find column indices by header keyword matching
  let nikCol = headerRow.findIndex((h) => h.includes('nik'));
  let namaCol = headerRow.findIndex((h) => h.includes('nama'));
  let ektaCol = headerRow.findIndex((h) => h.includes('kta') || h.includes('e-kta'));
  let jabatanCol = headerRow.findIndex((h) => h.includes('jabatan'));
  let hpCol = headerRow.findIndex((h) => h.includes('telepon') || h.includes('telfon') || h.includes('hp') || h.includes('wa'));
  let sosmedCol = headerRow.findIndex((h) => h.includes('sosial') || h.includes('sosmed') || h.includes('media') || h.includes('email'));
  let dpdCol = headerRow.findIndex((h) => h.includes('dpd') || h.includes('kabupaten') || h.includes('kota'));
  let dpcCol = headerRow.findIndex((h) => h.includes('dpc') || h.includes('kecamatan'));
  let dprtCol = headerRow.findIndex((h) => h.includes('dprt') || h.includes('kelurahan') || h.includes('desa'));
  let skCol = headerRow.findIndex((h) => h.includes('nomor sk') || h.includes('sk pengurus'));
  let tingkatCol = headerRow.findIndex((h) => h.includes('tingkat'));
  let statusCol = headerRow.findIndex((h) => h.includes('status'));

  // Fallback to default positional indices if standard template was used
  const isNamedHeader = nikCol !== -1 && namaCol !== -1;
  if (!isNamedHeader) {
    nikCol = 0;
    ektaCol = 1;
    namaCol = 2;
    hpCol = 3;
    dpdCol = 4;
    dpcCol = 5;
    dprtCol = 6;
    jabatanCol = 7;
    statusCol = 8;
  }

  const results: ValidationResult[] = [];
  let validCount = 0;
  let errorCount = 0;
  let currentDetectedDpc = '';
  let currentDetectedLevel = 'DPC';

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Check if entire row is empty
    if (!row || row.every((c) => String(c).trim() === '')) {
      continue;
    }

    const firstCell = String(row[0] || '').trim();
    // Section headers detection (e.g. from raw exported list)
    if (firstCell.includes('SUSUNAN PENGURUS DPC')) {
      currentDetectedLevel = 'DPC';
      continue;
    }
    if (firstCell.includes('SUSUNAN PENGURUS DPD')) {
      currentDetectedLevel = 'DPD';
      currentDetectedDpc = 'Umum (DPD)';
      continue;
    }
    if (firstCell.startsWith('KECAMATAN ')) {
      currentDetectedDpc = firstCell.replace('KECAMATAN ', '').replace(/,/g, '').trim();
      continue;
    }
    if (firstCell.startsWith('No') || firstCell.includes('Jabatan Pengurus')) {
      continue;
    }

    const rowNum = i + 1;
    const errors: string[] = [];
    let warning: string | undefined;

    // Extract values dynamically
    const rawNik = (nikCol !== -1 ? String(row[nikCol] || '') : '').replace(/[^0-9]/g, '').trim();
    const rawEkta = (ektaCol !== -1 ? String(row[ektaCol] || '') : '').trim();
    const rawNama = (namaCol !== -1 ? String(row[namaCol] || '') : '').trim();
    const rawHp = (hpCol !== -1 ? String(row[hpCol] || '') : '').trim();
    const rawDpd = (dpdCol !== -1 ? String(row[dpdCol] || '') : '').trim() || 'Kabupaten Minahasa Selatan';
    const rawDpc = (dpcCol !== -1 ? String(row[dpcCol] || '') : '').trim() || currentDetectedDpc || 'Umum';
    const rawDprt = (dprtCol !== -1 ? String(row[dprtCol] || '') : '').trim() || 'Belum Terpetakan';
    const rawJabatan = (jabatanCol !== -1 ? String(row[jabatanCol] || '') : '').trim() || 'Pengurus';
    const rawSk = (skCol !== -1 ? String(row[skCol] || '') : '').trim();
    const rawTingkat = (tingkatCol !== -1 ? String(row[tingkatCol] || '') : '').trim() || currentDetectedLevel;
    const rawSosmed = (sosmedCol !== -1 ? String(row[sosmedCol] || '') : '').trim();
    const rawStatus = (statusCol !== -1 ? String(row[statusCol] || '') : '').trim();

    // 1. Validasi ketat 3 kolom wajib: NIK (16 digit), Nomor e-KTA asli, No. Telepon/HP (minimal 8 digit)
    const requiredCheck = validateRequiredImportColumns({
      nik: rawNik,
      nomorEKTA: rawEkta,
      nomorHP: rawHp,
    });
    const cleanNik = requiredCheck.cleanNik;
    if (!requiredCheck.isValid) {
      requiredCheck.missingFields.forEach((field) => {
        errors.push(`${field} wajib diisi lengkap (tidak boleh kosong / placeholder)`);
      });
    }

    if (cleanNik && existingNiks.has(cleanNik)) {
      // allow duplicate with warning or update
      warning = `NIK "${cleanNik}" sudah terdaftar (data akan disinkronkan).`;
    } else if (cleanNik && seenNiksInFile.has(cleanNik)) {
      warning = `NIK "${cleanNik}" ganda dalam berkas (rangkap jabatan DPD/DPC).`;
    } else if (cleanNik) {
      seenNiksInFile.add(cleanNik);
    }

    // 2. Nama validation
    if (!rawNama) {
      errors.push('Nama Lengkap wajib diisi');
    }

    // 3. DPD validation
    let matchedDpd = rawDpd;
    const match = SULUT_REGIONS.find(
      (r) =>
        r.name.toLowerCase().trim() === rawDpd.toLowerCase().trim() ||
        r.name.toLowerCase().includes(rawDpd.toLowerCase().trim()) ||
        rawDpd.toLowerCase().includes(r.id)
    );
    if (match) {
      matchedDpd = match.name;
    }

    // 4. Status validation
    let statusVal: MemberStatus = 'Aktif';
    if (rawStatus.toLowerCase().includes('meninggal')) {
      statusVal = 'Non-Aktif (Meninggal)';
    } else if (rawStatus.toLowerCase().includes('pindah partai') || rawStatus.toLowerCase().includes('mundur')) {
      statusVal = 'Non-Aktif (Pindah Partai/Mundur)';
    } else if (rawStatus.toLowerCase().includes('domisili')) {
      statusVal = 'Non-Aktif (Pindah Domisili)';
    }

    // 5. e-KTA & Nomor HP wajib asli tanpa auto-fallback
    const finalEkta = requiredCheck.cleanEkta;

    const memberData: Partial<Member> = {
      nik: cleanNik,
      nomorEKTA: finalEkta,
      namaLengkap: rawNama,
      nomorHP: requiredCheck.cleanHp,
      email: rawSosmed.includes('@') ? rawSosmed : undefined,
      sosmed: !rawSosmed.includes('@') && rawSosmed !== '-' ? rawSosmed : undefined,
      dpd: matchedDpd,
      dpc: rawDpc,
      dprt: rawDprt,
      jabatan: rawJabatan,
      isPengurus: true,
      tingkatKepengurusan: (rawTingkat as any) || (rawDpc === 'Umum' || rawDpc === 'Umum (DPD)' ? 'DPD' : 'DPC'),
      wilayahPenugasan: rawDpc === 'Umum' || rawDpc === 'Umum (DPD)' ? `DPD ${matchedDpd}` : `DPC Kec. ${rawDpc}`,
      nomorSK: rawSk || (rawDpc === 'Umum' || rawDpc === 'Umum (DPD)' ? 'SK-DPD-MINSEL/001/2024' : `SK-DPC-${rawDpc.replace(/\s+/g, '_')}/2024`),
      tanggalSK: '2024-05-20',
      status: statusVal,
      tanggalBergabung: '2024-05-20',
      catatanMutasi: 'Diimpor dari berkas kepengurusan resmi daerah.',
      diubahOleh: 'Import Berkas DPD Minsel',
    };

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else errorCount++;

    results.push({
      rowNumber: rowNum,
      data: memberData,
      isValid,
      errors,
      warning,
    });
  }

  return {
    results,
    totalRows: results.length,
    validCount,
    errorCount,
  };
}

export function exportMembersToExcel(members: Member[], filename = 'DATA_ANGGOTA_E-KTA_SULUT.xlsx'): void {
  const exportData = members.map((m, idx) => ({
    No: idx + 1,
    'NIK (16 Digit)': m.nik,
    'Nomor e-KTA Pusat': m.nomorEKTA,
    'Nama Lengkap': m.namaLengkap,
    'No HP / WhatsApp': m.nomorHP,
    'DPD (Kab/Kota)': m.dpd,
    'DPC (Kecamatan)': m.dpc,
    'DPRt (Desa/Kel)': m.dprt,
    'Jabatan di Partai': m.jabatan,
    'Status Keanggotaan': m.status,
    'Tanggal Bergabung': m.tanggalBergabung,
    'Catatan Mutasi': m.catatanMutasi || '-',
    'Terakhir Diperbarui': m.terakhirDiubah || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Anggota Sulut');
  XLSX.writeFile(wb, filename);
}

export function exportMembersToCsv(members: Member[], filename = 'DATA_ANGGOTA_TERPILIH_SULUT.csv'): void {
  const headers = [
    'No',
    'NIK (16 Digit)',
    'Nomor e-KTA Pusat',
    'Nama Lengkap',
    'No HP / WhatsApp',
    'DPD (Kab/Kota)',
    'DPC (Kecamatan)',
    'DPRt (Desa/Kel)',
    'Jabatan di Partai',
    'Status Keanggotaan',
    'Tanggal Bergabung',
    'Catatan Mutasi',
    'Terakhir Diperbarui',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = members.map((m, idx) =>
    [
      idx + 1,
      `="${m.nik}"`, // Excel formula wrapper prevents 16-digit truncation into scientific notation (7.102E+15)
      m.nomorEKTA,
      m.namaLengkap,
      m.nomorHP,
      m.dpd,
      m.dpc,
      m.dprt,
      m.jabatan,
      m.status,
      m.tanggalBergabung,
      m.catatanMutasi || '-',
      m.terakhirDiubah || '-',
    ]
      .map(escapeCsv)
      .join(',')
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel and spreadsheet viewers open characters cleanly
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface DpdStatRow {
  no: number;
  dpd: string;
  zona: string;
  dpcCount: number;
  total: number;
  aktif: number;
  persentaseAktif: number;
  meninggal: number;
  pindahPartai: number;
  pindahDomisili: number;
  statusKesiapan: string;
}

export function exportDpdStatisticsToExcel(
  stats: DpdStatRow[],
  filename = 'RINGKASAN_STATISTIK_DPD_SULUT.xlsx'
): void {
  const exportData = stats.map((s) => ({
    No: s.no,
    'DPD Kabupaten / Kota': s.dpd,
    'Zona Wilayah': s.zona,
    'Jumlah DPC': s.dpcCount,
    'Total Terdaftar': s.total,
    'Anggota Aktif Riil': s.aktif,
    'Keaktifan (%)': `${s.persentaseAktif}%`,
    'Status: Meninggal': s.meninggal,
    'Status: Pindah Partai': s.pindahPartai,
    'Status: Pindah Domisili': s.pindahDomisili,
    'Kesiapan Teritorial': s.statusKesiapan,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statistik 15 DPD');
  XLSX.writeFile(wb, filename);
}

export function exportDpdStatisticsToCsv(
  stats: DpdStatRow[],
  filename = 'RINGKASAN_STATISTIK_DPD_SULUT.csv'
): void {
  const headers = [
    'No',
    'DPD Kabupaten / Kota',
    'Zona Wilayah',
    'Jumlah DPC',
    'Total Terdaftar',
    'Anggota Aktif Riil',
    'Keaktifan (%)',
    'Status: Meninggal',
    'Status: Pindah Partai',
    'Status: Pindah Domisili',
    'Kesiapan Teritorial',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = stats.map((s) =>
    [
      s.no,
      s.dpd,
      s.zona,
      s.dpcCount,
      s.total,
      s.aktif,
      `${s.persentaseAktif}%`,
      s.meninggal,
      s.pindahPartai,
      s.pindahDomisili,
      s.statusKesiapan,
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


