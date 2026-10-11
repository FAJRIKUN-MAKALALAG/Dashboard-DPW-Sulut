import * as XLSX from 'xlsx';
import { Member, MemberStatus } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';

export interface ValidationResult {
  rowNumber: number;
  data: Partial<Member>;
  isValid: boolean;
  errors: string[];
  warning?: string;
}

export function downloadEmptyTemplate(): void {
  const headers = [
    'NIK (Wajib 16 digit)',
    'Nomor e-KTA NasDem (Contoh: ND-71XX-2024-XXXX)',
    'Nama Lengkap (Wajib)',
    'Nomor HP / WhatsApp',
    'DPD Kab/Kota (Wajib)',
    'DPC Kecamatan (Wajib)',
    'DPRt Kelurahan/Desa',
    'Jabatan di Partai NasDem',
    'Status (Default: Aktif)',
  ];

  // Include 1 instruction example row
  const sampleRows = [
    [
      '7102011905840001',
      'ND-7102-2024-0099',
      'Contoh Nama Kader NasDem',
      '081234567890',
      'Kabupaten Minahasa',
      'Tondano Barat',
      'Rerewokan',
      'Kader Penggerak Restorasi',
      'Aktif',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  
  // Column widths
  ws['!cols'] = [
    { wch: 22 }, // NIK
    { wch: 26 }, // No e-KTA
    { wch: 28 }, // Nama
    { wch: 20 }, // No HP
    { wch: 28 }, // DPD
    { wch: 22 }, // DPC
    { wch: 22 }, // DPRt
    { wch: 26 }, // Jabatan
    { wch: 18 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template NasDem Sulut');
  XLSX.writeFile(wb, 'TEMPLATE_IMPORT_KADER_NASDEM_SULUT.xlsx');
}

export function downloadSampleDataCsv(): void {
  const sampleCsvContent = `NIK,Nomor e-KTA Pusat,Nama Lengkap,Nomor HP,DPD,DPC,DPRt,Jabatan,Status
7171011101900001,ND-7171-2024-0301,Johan Rondonuwu,081234567801,Kota Manado,Wenang,Pinaesaan,Kader Penggerak Restorasi,Aktif
7171022202910002,ND-7171-2024-0302,Priscilla Manoppo,081234567802,Kota Manado,Malalayang,Bahu,Pengurus Garnita Malahayati NasDem,Aktif
7102011503880003,ND-7102-2024-0303,Markus Sumendap,081234567803,Kabupaten Minahasa,Langowan Barat,Noongan,Ketua DPRt NasDem (Kelurahan/Desa),Aktif
7174011804920004,ND-7174-2024-0304,Fauzan Mokoginta,081234567804,Kota Kotamobagu,Kotamobagu Barat,Mogolaing,Pengurus Garda Pemuda NasDem,Aktif
7103012505870005,ND-7103-2024-0305,David Tatengkeng,081234567805,Kabupaten Kepulauan Sangihe,Tahuna,Manente,Sekretaris DPC NasDem,Aktif`;

  const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'CONTOH_DATA_KADER_NASDEM_SULUT.csv');
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

  // Row 0 is header, evaluate data starting from row 1
  const results: ValidationResult[] = [];
  let validCount = 0;
  let errorCount = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Check if entire row is empty
    if (!row || row.every((c) => String(c).trim() === '')) {
      continue;
    }

    const rowNum = i + 1;
    const errors: string[] = [];
    let warning: string | undefined;

    // Normalizing columns:
    // [NIK, NoEKTA, Nama, NoHP, DPD, DPC, DPRt, Jabatan, Status]
    const rawNik = String(row[0] || '').replace(/[^0-9]/g, '').trim();
    const rawEkta = String(row[1] || '').trim();
    const rawNama = String(row[2] || '').trim();
    const rawHp = String(row[3] || '').trim();
    const rawDpd = String(row[4] || '').trim();
    const rawDpc = String(row[5] || '').trim();
    const rawDprt = String(row[6] || '').trim();
    const rawJabatan = String(row[7] || '').trim();
    const rawStatus = String(row[8] || '').trim();

    // 1. NIK validation
    if (!rawNik) {
      errors.push('NIK tidak boleh kosong');
    } else if (rawNik.length !== 16) {
      errors.push(`NIK harus tepat 16 digit angka (saat ini ${rawNik.length} digit: "${rawNik}")`);
    } else if (existingNiks.has(rawNik)) {
      errors.push(`NIK "${rawNik}" sudah terdaftar di Shadow Database (Duplikat ditolak)`);
    } else if (seenNiksInFile.has(rawNik)) {
      errors.push(`NIK "${rawNik}" ganda dalam berkas unggahan ini`);
    } else {
      seenNiksInFile.add(rawNik);
    }

    // 2. Nama validation
    if (!rawNama) {
      errors.push('Nama Lengkap wajib diisi');
    }

    // 3. DPD validation
    let matchedDpd = rawDpd;
    if (!rawDpd) {
      errors.push('DPD (Kabupaten/Kota) wajib diisi');
    } else {
      const match = SULUT_REGIONS.find(
        (r) =>
          r.name.toLowerCase().trim() === rawDpd.toLowerCase().trim() ||
          r.name.toLowerCase().includes(rawDpd.toLowerCase().trim()) ||
          rawDpd.toLowerCase().includes(r.id)
      );
      if (!match) {
        errors.push(`DPD "${rawDpd}" tidak cocok dengan 15 Kabupaten/Kota Sulawesi Utara`);
      } else {
        matchedDpd = match.name;
      }
    }

    // 4. Status validation: defaults to "Aktif" if blank or invalid
    let statusVal: MemberStatus = 'Aktif';
    if (rawStatus.toLowerCase().includes('meninggal')) {
      statusVal = 'Non-Aktif (Meninggal)';
    } else if (rawStatus.toLowerCase().includes('pindah partai') || rawStatus.toLowerCase().includes('mundur')) {
      statusVal = 'Non-Aktif (Pindah Partai/Mundur)';
    } else if (rawStatus.toLowerCase().includes('domisili')) {
      statusVal = 'Non-Aktif (Pindah Domisili)';
    } else if (rawStatus && !rawStatus.toLowerCase().includes('aktif')) {
      warning = `Status "${rawStatus}" dialihkan ke default "Aktif"`;
    }

    // 5. Default fallback Nomor e-KTA Pusat if empty
    const finalEkta = rawEkta || `KT-${rawNik.substring(0, 4)}-${new Date().getFullYear()}-${rawNik.substring(12)}`;

    const memberData: Partial<Member> = {
      nik: rawNik,
      nomorEKTA: finalEkta,
      namaLengkap: rawNama,
      nomorHP: rawHp || '-',
      dpd: matchedDpd,
      dpc: rawDpc || 'Umum',
      dprt: rawDprt || 'Umum',
      jabatan: rawJabatan || 'Anggota Biasa',
      status: statusVal,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: 'Diimpor massal dari file excel/csv daerah.',
      diubahOleh: 'Import Massal',
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


