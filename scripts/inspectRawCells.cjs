const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wb = xlsx.readFile(filePath, { raw: true });
const sheet = wb.Sheets['Sheet1'];

console.log('Sample cell C5 (Nama):', sheet['C5']);
console.log('Sample cell D5 (NIK raw):', sheet['D5']);
console.log('Sample cell E5 (EKTA raw):', sheet['E5']);

console.log('Sample cell D379 (DPD NIK raw):', sheet['D379']);
console.log('Sample cell E379 (DPD EKTA raw):', sheet['E379']);

// Periksa beberapa baris di DPC lain
console.log('Sample DPC Amurang Barat C26, D26, E26:');
console.log('C26:', sheet['C26']);
console.log('D26:', sheet['D26']);
console.log('E26:', sheet['E26']);
