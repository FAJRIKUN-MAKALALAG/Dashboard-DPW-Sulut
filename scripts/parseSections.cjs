const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wb = xlsx.readFile(filePath);
const sheet = wb.Sheets['Sheet1'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Row 376:', rows[375]);
console.log('Row 377:', rows[376]);
console.log('Row 378:', rows[377]);
console.log('Row 379:', rows[378]);
console.log('Row 380:', rows[379]);

let filledCount = 0;
let lastFilledRow = 0;

rows.forEach((r, idx) => {
  const nonEmpties = r.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
  if (nonEmpties.length > 0) {
    filledCount++;
    lastFilledRow = idx + 1;
  }
});

console.log('Total filled rows:', filledCount, 'Last filled row:', lastFilledRow);

// Tampilkan contoh data baris DPD
for (let i = 377; i < Math.min(lastFilledRow, 420); i++) {
  console.log(`Row ${i+1}:`, rows[i]);
}
