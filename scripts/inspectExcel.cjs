const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wb = xlsx.readFile(filePath);
console.log('Sheet Names:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log('\n========================================');
  console.log('SHEET:', name, '| Rows:', json.length);
  console.log('========================================');
  console.log('First 10 rows:');
  console.log(json.slice(0, 10));
}
