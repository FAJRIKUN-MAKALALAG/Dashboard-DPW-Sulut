const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wb = xlsx.readFile(filePath);
const sheet = wb.Sheets['Sheet1'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let currentKecamatan = '';
let currentLevel = '';
const parsed = [];

rows.forEach((r, idx) => {
  const line = r.map(c => (c !== null && c !== undefined) ? String(c).trim() : '');
  const text0 = line[0] || '';
  const text1 = line[1] || '';
  
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
  
  // Baris data pengurus memiliki nomor urut di kolom 0 atau jabatan di kolom 1
  const no = parseInt(text0);
  if (!isNaN(no) && line[2] && line[1]) {
    const jabatan = line[1];
    const nama = line[2];
    const rawNik = line[3] || '';
    const rawEkta = line[4] || '';
    const email = line[5] || null;
    const noHp = line[6] || null;
    const sosmed = line[7] || null;
    
    parsed.push({
      rowIdx: idx + 1,
      level: currentLevel,
      kecamatan: currentKecamatan,
      no,
      jabatan,
      nama,
      rawNik,
      nikLength: rawNik.length,
      rawEkta,
      ektaLength: rawEkta.length,
      email,
      noHp,
      sosmed
    });
  }
});

console.log('Total pengurus parsed:', parsed.length);
console.log('Distribusi level:');
const byLevel = {};
parsed.forEach(p => byLevel[p.level] = (byLevel[p.level] || 0) + 1);
console.log(byLevel);

console.log('Distribusi kecamatan:');
const byKec = {};
parsed.forEach(p => byKec[p.kecamatan] = (byKec[p.kecamatan] || 0) + 1);
console.log(byKec);

console.log('\nSample NIK lengths:');
const nikLengths = {};
parsed.forEach(p => nikLengths[p.nikLength] = (nikLengths[p.nikLength] || 0) + 1);
console.log(nikLengths);

console.log('\nSample E-KTA lengths:');
const ektaLengths = {};
parsed.forEach(p => ektaLengths[p.ektaLength] = (ektaLengths[p.ektaLength] || 0) + 1);
console.log(ektaLengths);

console.log('\nContoh 5 data pertama:');
console.log(parsed.slice(0, 5));
console.log('\nContoh 5 data terakhir (DPD):');
console.log(parsed.slice(-5));
