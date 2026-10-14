const fs = require('fs');
const xlsx = require('xlsx');

const workbook = xlsx.readFile('importdatabase/pengurus_dpd_dpc_sulut.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in Sheet:', data.length);

const sections = [];
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  const rowStr = row.map(c => String(c || '').trim()).join(' ');
  if (rowStr.toUpperCase().includes('SUSUNAN PENGURUS')) {
    const nextRow = data[i + 1] ? data[i + 1].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    const nextNextRow = data[i + 2] ? data[i + 2].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    sections.push({
      line: i + 1,
      title: rowStr,
      subtitle: nextRow,
      extra: nextNextRow
    });
  }
}

console.log('Total sections detected:', sections.length);
sections.forEach((s, idx) => {
  console.log(`${idx + 1}. [Line ${s.line}] ${s.title} | ${s.subtitle} ${s.extra ? '(' + s.extra + ')' : ''}`);
});
