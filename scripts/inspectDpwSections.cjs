const fs = require('fs');
const xlsx = require('xlsx');

const wb = xlsx.readFile('importdatabase/Susunan_DPW_SULUT.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in Susunan_DPW_SULUT:', data.length);

const sections = [];
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  const rowStr = row.map(c => String(c || '').trim()).join(' ');
  if (
    rowStr.toUpperCase().includes('SUSUNAN PENGURUS') ||
    rowStr.toUpperCase().includes('DEWAN PIMPINAN') ||
    rowStr.toUpperCase().includes('KECAMATAN') ||
    rowStr.toUpperCase().includes('KABUPATEN') ||
    rowStr.toUpperCase().includes('KOTA')
  ) {
    if (row.length <= 3) {
      sections.push({ line: i + 1, text: rowStr });
    }
  }
}

console.log('Headers / Sections count:', sections.length);
sections.forEach(s => console.log(`Line ${s.line}: ${s.text}`));
