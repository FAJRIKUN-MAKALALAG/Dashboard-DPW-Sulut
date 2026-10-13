const fs = require('fs');
const path = require('path');

function parseMinselCsv() {
  const filePath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut - Sheet1.csv');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  let currentLevel = '';
  let currentDpc = '';
  const records = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.replace(/,/g, '').trim() === '') continue;

    if (rawLine.includes('SUSUNAN PENGURUS DPC PARTAI NASDEM')) {
      currentLevel = 'DPC';
      continue;
    }
    if (rawLine.includes('SUSUNAN PENGURUS DPD PARTAI NASDEM')) {
      currentLevel = 'DPD';
      currentDpc = '';
      continue;
    }
    if (rawLine.startsWith('KECAMATAN ')) {
      currentDpc = rawLine.replace(/KECAMATAN /g, '').replace(/,/g, '').trim();
      continue;
    }
    if (rawLine.startsWith('KABUPATEN MINAHASA SELATAN')) {
      currentLevel = 'DPD';
      currentDpc = '';
      continue;
    }
    if (rawLine.startsWith('No,Jabatan Pengurus')) {
      continue;
    }

    // Split CSV correctly respecting quoted strings
    const cols = [];
    let inQuote = false;
    let currentCell = '';
    for (let charIndex = 0; charIndex < rawLine.length; charIndex++) {
      const char = rawLine[charIndex];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        cols.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cols.push(currentCell.trim());

    // Check if valid row starting with a number
    if (cols.length >= 4 && /^\d+$/.test(cols[0])) {
      const no = cols[0];
      const jabatan = cols[1].replace(/^"|"$/g, '').trim();
      const nama = cols[2].replace(/^"|"$/g, '').trim();
      const rawNik = cols[3].replace(/[^0-9]/g, '').trim();
      const rawEkta = (cols[4] || '').replace(/[^0-9A-Za-z-]/g, '').trim();
      const email = cols[5] || '';
      const noHp = cols[6] || '-';
      const sosmed = cols[7] || '';

      // Normalize NIK: if length > 16 (e.g. trailing zeroes from Excel scientific notation), extract first 16 or pad
      let nik = rawNik;
      if (nik.length > 16) {
        nik = nik.substring(0, 16);
      } else if (nik.length < 16 && nik.length > 0) {
        nik = nik.padEnd(16, '0');
      }

      records.push({
        nik: nik || `710599${String(i).padStart(10, '0')}`,
        nomor_ekta: rawEkta,
        nama_lengkap: nama,
        nomor_hp: noHp && noHp !== '-' ? noHp : '-',
        email: email || null,
        sosmed: sosmed || null,
        dpd: 'Kabupaten Minahasa Selatan',
        dpc: currentLevel === 'DPC' ? currentDpc : 'Umum (DPD)',
        dprt: 'Belum Terpetakan',
        is_pengurus: true,
        tingkat_kepengurusan: currentLevel,
        wilayah_penugasan: currentLevel === 'DPD' ? 'DPD Kabupaten Minahasa Selatan' : `DPC Kecamatan ${currentDpc}`,
        nomor_sk: currentLevel === 'DPD' ? 'SK-DPD-MINSEL/001/2024' : `SK-DPC-${currentDpc.replace(/\s+/g, '_')}/2024`,
        tanggal_sk: '2024-05-20',
        jabatan: jabatan,
        status: 'Aktif',
        tanggal_bergabung: '2024-05-20',
        catatan_mutasi: `Pengurus ber-SK resmi ${currentLevel} Kabupaten Minahasa Selatan.`,
        diubah_oleh: 'Import Berkas DPW Sulut'
      });
    }
  }

  return records;
}

const records = parseMinselCsv();
console.log('Total pengurus parsed:', records.length);
const dpd = records.filter(r => r.tingkat_kepengurusan === 'DPD');
const dpc = records.filter(r => r.tingkat_kepengurusan === 'DPC');
console.log('DPD Pengurus Count:', dpd.length);
console.log('DPC Pengurus Count:', dpc.length);
const dpcNames = [...new Set(dpc.map(r => r.dpc))];
console.log('DPC Kecamatan (' + dpcNames.length + '):', dpcNames.join(', '));
console.log('\nSample DPD Record:');
console.log(dpd[0]);
console.log('\nSample DPC Record:');
console.log(dpc[0]);

// Output JSON file so it can be imported directly to Supabase
fs.writeFileSync(
  path.join(__dirname, 'minsel_pengurus_data.json'),
  JSON.stringify(records, null, 2)
);
console.log('\nSaved parsed data to scripts/minsel_pengurus_data.json');
