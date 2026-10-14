const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'minsel_pengurus_data.json'), 'utf8'));

// Format 1: Template Kosong Khusus Minsel
const templateHeaders = [
  'Jabatan Pengurus',
  'Nama Lengkap (Sesuai KTP)',
  'No. NIK (16 Digit)',
  'Nomor e-KTA NasDem Pusat',
  'No Telepon / WhatsApp',
  'Nama Sosial Media / Email',
  'DPC Kecamatan',
  'DPRt Kelurahan/Desa',
  'Nomor SK Pengurus',
  'Tingkat Kepengurusan'
];

const sampleRows = [
  [
    'Ketua DPD',
    'PAULMAN STEVANUS RUNTUWENE, S.T., MBA.',
    '7105172908850001',
    '1966795504182866',
    '081234567890',
    '@paulman_runtuwene',
    'Umum (DPD)',
    'Belum Terpetakan',
    'SK-DPD-MINSEL/001/2024',
    'DPD'
  ],
  [
    'Ketua DPC',
    'SEYFI SARAYAR',
    '7105173009800001',
    '2133352341474362',
    '081298765432',
    '@seyfi_sarayar',
    'Amurang Barat',
    'Belum Terpetakan',
    'SK-DPC-AMURANG_BARAT/2024',
    'DPC'
  ]
];

const wsTemplate = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleRows]);
wsTemplate['!cols'] = [
  { wch: 32 }, { wch: 36 }, { wch: 22 }, { wch: 26 }, { wch: 22 },
  { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 20 }
];
const wbTemplate = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbTemplate, wsTemplate, 'Template Minsel');
XLSX.writeFile(wbTemplate, path.join(__dirname, '..', 'TEMPLATE_IMPORT_PENGURUS_MINSEL.xlsx'));
console.log('Created TEMPLATE_IMPORT_PENGURUS_MINSEL.xlsx');

// Format 2: File Siap Import dengan seluruh 279 Pengurus DPD & DPC Minsel
const dataHeaders = [
  'Jabatan Pengurus',
  'Nama Lengkap (Sesuai KTP)',
  'No. NIK (16 Digit)',
  'Nomor e-KTA NasDem Pusat',
  'No Telepon / WhatsApp',
  'Nama Sosial Media / Email',
  'DPC Kecamatan',
  'DPRt Kelurahan/Desa',
  'Nomor SK Pengurus',
  'Tingkat Kepengurusan'
];

const rows = records.map(r => [
  r.jabatan,
  r.nama_lengkap,
  r.nik,
  r.nomor_ekta,
  r.nomor_hp || '-',
  r.sosmed || r.email || '-',
  r.dpc,
  r.dprt || 'Belum Terpetakan',
  r.nomor_sk,
  r.tingkat_kepengurusan
]);

const wsData = XLSX.utils.aoa_to_sheet([dataHeaders, ...rows]);
wsData['!cols'] = [
  { wch: 35 }, { wch: 38 }, { wch: 22 }, { wch: 26 }, { wch: 20 },
  { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 20 }
];
const wbData = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbData, wsData, 'Data Pengurus Minsel');
XLSX.writeFile(wbData, path.join(__dirname, '..', 'DATA_PENGURUS_MINSEL_SIAP_IMPORT.xlsx'));
console.log('Created DATA_PENGURUS_MINSEL_SIAP_IMPORT.xlsx with ' + rows.length + ' rows');

// Format 3: Versi CSV
const escapeCsv = (str) => {
  const s = String(str ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
};

const csvContent = '\uFEFF' + [
  dataHeaders.map(escapeCsv).join(','),
  ...rows.map(r => r.map(escapeCsv).join(','))
].join('\r\n');

fs.writeFileSync(path.join(__dirname, '..', 'DATA_PENGURUS_MINSEL_SIAP_IMPORT.csv'), csvContent);
console.log('Created DATA_PENGURUS_MINSEL_SIAP_IMPORT.csv');
