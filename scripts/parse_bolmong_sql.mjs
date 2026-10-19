import fs from 'fs';

const content = fs.readFileSync('migrasi_dpw_sulut_lengkap.sql', 'utf-8');
const lines = content.split('\n');
const results = [];

for (let i = 464; i < 510; i++) {
  const l = lines[i];
  if (!l || !l.includes('Kabupaten Bolaang Mongondow')) continue;

  const commaIdxs = [];
  let inQuotes = false;
  for (let c = 0; c < l.length; c++) {
    if (l[c] === "'") inQuotes = !inQuotes;
    else if (l[c] === ',' && !inQuotes) commaIdxs.push(c);
  }
  const nik = l.substring(l.indexOf("'") + 1, commaIdxs[0]).trim().replace(/'/g, '');
  const nama = l.substring(commaIdxs[1] + 1, commaIdxs[2]).trim().replace(/'/g, '');
  const subOrg = l.substring(commaIdxs[10] + 1, commaIdxs[11]).trim().replace(/'/g, '');
  const jabatan = l.substring(commaIdxs[13] + 1, commaIdxs[14]).trim().replace(/'/g, '');
  results.push({ nik, nama, subOrg, jabatan });
}

console.log('Total extracted:', results.length);
results.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.subOrg}] ${r.jabatan} -> ${r.nama}`);
});
