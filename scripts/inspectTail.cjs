const fs = require('fs');
const xlsx = require('xlsx');

const wb = xlsx.readFile('importdatabase/Susunan_DPW_SULUT.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 890; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  const rowStr = row.map(c => String(c || '').trim()).filter(Boolean).join(' ');
  if (rowStr.toUpperCase().includes('SUSUNAN') || rowStr.toUpperCase().includes('KABUPATEN') || rowStr.toUpperCase().includes('KOTA')) {
    console.log(`Line ${i + 1}: ${rowStr}`);
  }
}
