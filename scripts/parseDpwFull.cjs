const fs = require('fs');
const xlsx = require('xlsx');

const wb = xlsx.readFile('importdatabase/Susunan_DPW_SULUT.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in file:', data.length);

let currentContext = {
  tingkat: 'DPW',
  dpd: 'Sulawesi Utara',
  dpc: 'DPW',
  subOrg: 'DEWAN PIMPINAN WILAYAH'
};

const rowsParsed = [];

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;

  const rawCol0 = row[0] !== undefined ? String(row[0]).trim() : '';
  const rawCol1 = row[1] !== undefined ? String(row[1]).trim() : '';
  const lineStr = row.map(c => String(c || '').trim()).filter(Boolean).join(' ');

  // Detect Main Header
  if (lineStr.toUpperCase().includes('SUSUNAN PENGURUS DEWAN PIMPINAN WILAYAH')) {
    currentContext = {
      tingkat: 'DPW',
      dpd: 'Sulawesi Utara',
      dpc: 'Wilayah DPW',
      subOrg: 'DPW Sulut'
    };
    continue;
  }

  if (lineStr.toUpperCase().includes('SUSUNAN PENGURUS DPC PARTAI NASDEM')) {
    // Next row usually has kecamatan
    const nextRow = data[i + 1] ? data[i + 1].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    let kec = nextRow.replace(/KECAMATAN/i, '').trim();
    currentContext = {
      tingkat: 'DPC',
      dpd: 'Kabupaten Minahasa Selatan', // DPC sections in this file are Minsel subdistricts
      dpc: kec || 'Kecamatan',
      subOrg: `DPC ${kec}`
    };
    continue;
  }

  if (lineStr.toUpperCase().includes('SUSUNAN PENGURUS DPD PARTAI NASDEM')) {
    const nextRow = data[i + 1] ? data[i + 1].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    let regName = nextRow.replace(/PROVINSI SULAWESI UTARA/i, '').trim();
    currentContext = {
      tingkat: 'DPD',
      dpd: regName || 'Daerah',
      dpc: 'Umum (DPD)',
      subOrg: `DPD ${regName}`
    };
    continue;
  }

  // Detect Sub-organization (e.g. I. DEWAN PERTIMBANGAN, II. DEWAN PAKAR, III. DEWAN PIMPINAN DAERAH)
  if (rawCol0.startsWith('I.') || rawCol0.startsWith('II.') || rawCol0.startsWith('III.') || rawCol0.startsWith('IV.') || rawCol0 === 'DEWAN PIMPINAN WILAYAH') {
    currentContext.subOrg = rawCol0;
    continue;
  }

  // Detect table header row
  if (rawCol0.toLowerCase() === 'no' || rawCol1.toLowerCase() === 'jabatan pengurus') {
    continue;
  }

  // Check if this is a data row: Col 0 is number, Col 1 is Jabatan, Col 2 is Nama
  const noNum = parseInt(rawCol0, 10);
  if (!isNaN(noNum) && noNum > 0 && row.length >= 3) {
    const jabatan = String(row[1] || '').trim();
    const nama = String(row[2] || '').trim();
    const rawNik = row[3] !== undefined ? String(row[3]).trim() : '';
    const rawEkta = row[4] !== undefined ? String(row[4]).trim() : '';
    const email = row[5] !== undefined ? String(row[5]).trim() : '';
    const noHp = row[6] !== undefined ? String(row[6]).trim() : '';
    const sosmed = row[7] !== undefined ? String(row[7]).trim() : '';

    if (nama && nama.length > 1) {
      rowsParsed.push({
        line: i + 1,
        no: noNum,
        tingkat: currentContext.tingkat,
        dpd: currentContext.dpd,
        dpc: currentContext.dpc,
        subOrg: currentContext.subOrg,
        jabatan,
        nama,
        rawNik,
        rawEkta,
        email,
        noHp,
        sosmed
      });
    }
  }
}

console.log('Total parsed members:', rowsParsed.length);

const summaryByDpd = {};
const summaryByTingkat = {};
rowsParsed.forEach(r => {
  summaryByDpd[r.dpd] = (summaryByDpd[r.dpd] || 0) + 1;
  summaryByTingkat[r.tingkat] = (summaryByTingkat[r.tingkat] || 0) + 1;
});

console.log('Summary by Tingkat:', summaryByTingkat);
console.log('Summary by DPD/Wilayah:', summaryByDpd);
console.log('First 5 parsed:', rowsParsed.slice(0, 5));
console.log('Sample parsed from each category:');
const dpwSample = rowsParsed.find(r => r.tingkat === 'DPW');
const dpcSample = rowsParsed.find(r => r.tingkat === 'DPC');
const dpdSample = rowsParsed.find(r => r.tingkat === 'DPD');
console.log('DPW sample:', dpwSample);
console.log('DPC sample:', dpcSample);
console.log('DPD sample:', dpdSample);
