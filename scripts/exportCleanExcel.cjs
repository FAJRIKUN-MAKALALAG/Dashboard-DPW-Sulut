const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelSrcPath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wbSrc = xlsx.readFile(excelSrcPath);
const sheet = wbSrc.Sheets['Sheet1'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let currentKecamatan = '';
let currentLevel = '';
const exportRows = [];

rows.forEach((r, idx) => {
  const line = r.map(c => (c !== null && c !== undefined) ? String(c).trim() : '');
  const text0 = line[0] || '';
  
  if (text0.includes('KECAMATAN')) {
    currentKecamatan = text0.replace('KECAMATAN', '').trim();
    currentLevel = 'DPC';
    return;
  }
  if (text0.includes('DPD PARTAI NASDEM')) {
    currentKecamatan = 'Umum (DPD)';
    currentLevel = 'DPD';
    return;
  }
  
  const no = parseInt(text0);
  if (!isNaN(no) && line[2] && line[1]) {
    exportRows.push({
      'No': exportRows.length + 1,
      'Tingkat': currentLevel,
      'Kecamatan (DPC)': currentLevel === 'DPD' ? 'Umum (DPD)' : currentKecamatan,
      'Kabupaten/Kota (DPD)': 'Kabupaten Minahasa Selatan',
      'Jabatan Pengurus': line[1].trim(),
      'Nama Lengkap (Sesuai KTP)': line[2].trim(),
      'No. NIK': line[3] ? line[3].trim() : '',
      'E-KTA NasDem': line[4] ? line[4].trim() : '',
      'Email': '',
      'No Telepon': '',
      'Sosial Media': '',
      'Nomor SK': currentLevel === 'DPD' ? 'SK-DPD-MINSEL/001/2024' : `SK-DPC-${currentKecamatan.replace(/\s+/g, '_')}/2024`,
      'Tanggal SK': '2024-05-20',
      'Status Keanggotaan': 'Aktif'
    });
  }
});

const newWb = xlsx.utils.book_new();
const newWs = xlsx.utils.json_to_sheet(exportRows);
xlsx.utils.book_append_sheet(newWb, newWs, 'Pengurus Minsel Real');
xlsx.writeFile(newWb, path.join(__dirname, '..', 'DATA_PENGURUS_MINSEL_SIAP_IMPORT.xlsx'));
console.log(`Berhasil mengekspor ${exportRows.length} baris ke DATA_PENGURUS_MINSEL_SIAP_IMPORT.xlsx!`);
