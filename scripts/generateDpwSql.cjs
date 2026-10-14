const fs = require('fs');
const xlsx = require('xlsx');

const wb = xlsx.readFile('importdatabase/Susunan_DPW_SULUT.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in file:', data.length);

// Standard DPD names in Sulut
const DPD_CANONICAL = {
  'MINAHASA SELATAN': 'Kabupaten Minahasa Selatan',
  'BOLAANG MONGONDOW': 'Kabupaten Bolaang Mongondow',
  'BOLAANG MONGONDOW TIMUR': 'Kabupaten Bolaang Mongondow Timur',
  'BOLAANG MONGONDOW UTARA': 'Kabupaten Bolaang Mongondow Utara',
  'KOTA MOBAGU': 'Kota Kotamobagu',
  'KOTAMOBAGU': 'Kota Kotamobagu',
  'KOTA MANADO': 'Kota Manado',
  'MANADO': 'Kota Manado',
  'KEPULAUAN SANGIHE': 'Kabupaten Kepulauan Sangihe',
  'SANGIHE': 'Kabupaten Kepulauan Sangihe',
  'MINAHASA UTARA': 'Kabupaten Minahasa Utara',
  'MINAHASA': 'Kabupaten Minahasa',
  'MINAHASA TENGGARA': 'Kabupaten Minahasa Tenggara',
  'BITUNG': 'Kota Bitung',
  'TOMOHON': 'Kota Tomohon',
  'KEPULAUAN SITARO': 'Kabupaten Kepulauan Siau Tagulandang Biaro',
  'SITARO': 'Kabupaten Kepulauan Siau Tagulandang Biaro',
  'KEPULAUAN TALAUD': 'Kabupaten Kepulauan Talaud',
  'TALAUD': 'Kabupaten Kepulauan Talaud',
  'BOLAANG MONGONDOW SELATAN': 'Kabupaten Bolaang Mongondow Selatan',
  'BOLSEL': 'Kabupaten Bolaang Mongondow Selatan'
};

function normalizeDpd(raw) {
  const upper = raw.toUpperCase();
  for (const [key, val] of Object.entries(DPD_CANONICAL)) {
    if (upper.includes(key)) return val;
  }
  return raw;
}

let currentContext = {
  tingkat: 'DPW',
  dpd: 'Sulawesi Utara',
  dpc: 'Wilayah DPW',
  subOrg: 'DEWAN PIMPINAN WILAYAH'
};

const members = [];

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;

  const rowJoined = row.map(c => String(c || '').trim()).filter(Boolean).join(' ');
  const rawCol0 = row[0] !== undefined ? String(row[0]).trim() : '';
  const rawCol1 = row[1] !== undefined ? String(row[1]).trim() : '';

  // 1. Check if DPW header
  if (rowJoined.toUpperCase().includes('SUSUNAN PENGURUS DEWAN PIMPINAN WILAYAH')) {
    currentContext = {
      tingkat: 'DPW',
      dpd: 'Sulawesi Utara',
      dpc: 'Wilayah DPW',
      subOrg: 'DEWAN PIMPINAN WILAYAH'
    };
    continue;
  }

  // 2. Check if DPC header
  if (rowJoined.toUpperCase().includes('SUSUNAN PENGURUS DPC PARTAI NASDEM')) {
    const nextRow = data[i + 1] ? data[i + 1].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    let kec = nextRow.replace(/KECAMATAN/i, '').trim();
    currentContext = {
      tingkat: 'DPC',
      dpd: 'Kabupaten Minahasa Selatan',
      dpc: kec || 'Kecamatan',
      subOrg: `DPC Kecamatan ${kec}`
    };
    continue;
  }

  // 3. Check if DPD header
  if (rowJoined.toUpperCase().includes('SUSUNAN PENGURUS DPD PARTAI NASDEM')) {
    const nextRow = data[i + 1] ? data[i + 1].map(c => String(c || '').trim()).filter(Boolean).join(' ') : '';
    let rawRegion = nextRow.replace(/PROVINSI SULAWESI UTARA/i, '').replace(/KABUPATEN/i, '').trim();
    let norm = normalizeDpd(nextRow || rawRegion);
    currentContext = {
      tingkat: 'DPD',
      dpd: norm,
      dpc: 'Umum (DPD)',
      subOrg: `DPD ${norm}`
    };
    continue;
  }

  // 4. Sub-organ (Dewan Pertimbangan / Dewan Pakar / DPD / DPW)
  if (
    rawCol0.startsWith('I.') ||
    rawCol0.startsWith('II.') ||
    rawCol0.startsWith('III.') ||
    rawCol0.startsWith('IV.') ||
    rawCol0 === 'DEWAN PIMPINAN WILAYAH' ||
    rawCol0 === 'DEWAN PERTIMBANGAN WILAYAH' ||
    rawCol0 === 'DEWAN PAKAR WILAYAH'
  ) {
    currentContext.subOrg = rawCol0;
    continue;
  }

  // 5. Skip header row
  if (rawCol0.toLowerCase() === 'no' || rawCol1.toLowerCase() === 'jabatan pengurus') {
    continue;
  }

  // 6. Data row: Col 0 is number, Col 1 is Jabatan, Col 2 is Nama
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
      members.push({
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

console.log('Total valid members extracted:', members.length);

// Generate SQL
let sql = `-- ========================================================================
-- MIGRASI DATA SUSUNAN PENGURUS DPW, DPD, DAN DPC PARTAI NASDEM SULUT
-- Sumber Berkas: importdatabase/Susunan_DPW_SULUT.xlsx
-- Total Entri: ${members.length} Pengurus (DPW, DPD, DPC)
-- Tanggal Generate: ${new Date().toISOString().substring(0, 10)}
-- ========================================================================

-- 1. PASTIKAN TABEL MEMBERS SUDAH ADA
CREATE TABLE IF NOT EXISTS public.members (
    nik VARCHAR(50) PRIMARY KEY,
    nomor_ekta VARCHAR(50),
    nama_lengkap VARCHAR(255) NOT NULL,
    nomor_hp VARCHAR(50) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    sosmed VARCHAR(150) DEFAULT NULL,
    
    -- Wilayah Domisili
    dpd VARCHAR(100) NOT NULL,
    dpc VARCHAR(100) NOT NULL,
    dprt VARCHAR(100) NOT NULL DEFAULT 'Pusat/Umum',
    
    -- Struktur Organisasi & Legalitas SK
    is_pengurus BOOLEAN DEFAULT TRUE,
    tingkat_kepengurusan VARCHAR(30) DEFAULT 'Bukan Pengurus',
    wilayah_penugasan VARCHAR(100),
    nomor_sk VARCHAR(100),
    tanggal_sk DATE,
    kode_referral VARCHAR(50),
    
    -- Jabatan & Status
    jabatan VARCHAR(150) DEFAULT 'Pengurus',
    status VARCHAR(50) DEFAULT 'Aktif',
    tanggal_bergabung DATE DEFAULT CURRENT_DATE,
    catatan_mutasi TEXT,
    terakhir_diubah TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    diubah_oleh VARCHAR(100) DEFAULT 'Migrasi Excel DPW',
    
    -- Biodata Personal
    foto_profil_url TEXT,
    foto_ktp_url TEXT,
    jenis_kelamin VARCHAR(20),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    alamat_lengkap TEXT,
    agama VARCHAR(50),
    pekerjaan VARCHAR(100),
    status_ktp_verified BOOLEAN DEFAULT TRUE,
    
    -- Atribusi Kader Perekrut
    kader_perekrut_nama VARCHAR(255),
    kader_perekrut_nik VARCHAR(16),
    kader_perekrut_ekta VARCHAR(50),
    kader_perekrut_jabatan VARCHAR(150),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_members_dpd ON public.members (dpd);
CREATE INDEX IF NOT EXISTS idx_members_dpc ON public.members (dpc);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_is_pengurus ON public.members (is_pengurus);
CREATE INDEX IF NOT EXISTS idx_members_nomor_ekta ON public.members (nomor_ekta);

-- 2. INSERT SELURUH DATA PENGURUS
INSERT INTO public.members (
  nik, nomor_ekta, nama_lengkap, nomor_hp, email, sosmed,
  dpd, dpc, dprt, is_pengurus, tingkat_kepengurusan, wilayah_penugasan,
  nomor_sk, tanggal_sk, jabatan, status, tanggal_bergabung, catatan_mutasi, diubah_oleh
) VALUES
`;

const values = members.map((m, idx) => {
  // Determine standard NIK:
  // If rawNik has valid 16 digits, keep as is.
  // If rawNik has scientific or zeroes padding, extract pure digits.
  // If empty, generate stable unique 16-digit NIK identifier based on region & index.
  let cleanNik = m.rawNik.replace(/[^0-9]/g, '');
  if (!cleanNik || cleanNik.length < 10) {
    // Generate deterministic 16-digit NIK
    // Format: 71 + 2 digit region code + 4 digit year + 8 digit sequential
    let regCode = '00';
    if (m.tingkat === 'DPW') regCode = '00';
    else if (m.dpd.includes('Minahasa Selatan')) regCode = '05';
    else if (m.dpd.includes('Bolaang Mongondow Timur')) regCode = '10';
    else if (m.dpd.includes('Bolaang Mongondow Utara')) regCode = '08';
    else if (m.dpd.includes('Bolaang Mongondow')) regCode = '01';
    else if (m.dpd.includes('Kotamobagu')) regCode = '74';
    else if (m.dpd.includes('Manado')) regCode = '71';
    else if (m.dpd.includes('Sangihe')) regCode = '03';
    else if (m.dpd.includes('Minahasa Utara')) regCode = '06';
    cleanNik = `71${regCode}2026${String(10000000 + idx).slice(-8)}`;
  } else if (cleanNik.length > 16) {
    cleanNik = cleanNik.substring(0, 16);
  }

  // Determine standard nomor_ekta:
  // If user provided rawEkta, keep rawEkta 100% as is without prefix
  let cleanEkta = m.rawEkta ? m.rawEkta.replace(/[^0-9A-Za-z-]/g, '') : null;
  const ektaVal = cleanEkta ? `'${cleanEkta}'` : 'NULL';

  const escapeSql = (s) => (s ? `'${s.replace(/'/g, "''")}'` : 'NULL');

  const namaSql = `'${m.nama.replace(/'/g, "''")}'`;
  const jabatanSql = `'${m.jabatan.replace(/'/g, "''")}'`;
  const dpdSql = `'${m.dpd.replace(/'/g, "''")}'`;
  const dpcSql = `'${m.dpc.replace(/'/g, "''")}'`;
  const wilayahSql = `'${(m.subOrg || m.dpd).replace(/'/g, "''")}'`;
  const tingkatSql = `'${m.tingkat}'`;
  const skSql = m.tingkat === 'DPW' 
    ? `'SK-DPW-SULUT/2026-2029'` 
    : (m.tingkat === 'DPD' ? `'SK-DPD-${m.dpd.replace(/[^A-Za-z]/g, '').slice(0, 10).toUpperCase()}/2024'` : `'SK-DPC-${m.dpc.replace(/[^A-Za-z]/g, '').toUpperCase()}/2024'`);

  const catatanSql = `'Pengurus resmi ${m.tingkat} Partai NasDem (${m.subOrg}).'`;

  return `  ('${cleanNik}', ${ektaVal}, ${namaSql}, ${escapeSql(m.noHp)}, ${escapeSql(m.email)}, ${escapeSql(m.sosmed)}, ${dpdSql}, ${dpcSql}, 'Pusat/Umum', TRUE, ${tingkatSql}, ${wilayahSql}, ${skSql}, '2026-01-15', ${jabatanSql}, 'Aktif', '2026-01-15', ${catatanSql}, 'Import Susunan DPW')`;
});

sql += values.join(',\n');
sql += `\nON CONFLICT (nik) DO UPDATE SET
  nomor_ekta = COALESCE(EXCLUDED.nomor_ekta, public.members.nomor_ekta),
  nama_lengkap = EXCLUDED.nama_lengkap,
  jabatan = EXCLUDED.jabatan,
  dpd = EXCLUDED.dpd,
  dpc = EXCLUDED.dpc,
  is_pengurus = EXCLUDED.is_pengurus,
  nomor_sk = EXCLUDED.nomor_sk,
  tingkat_kepengurusan = EXCLUDED.tingkat_kepengurusan,
  wilayah_penugasan = EXCLUDED.wilayah_penugasan;\n`;

fs.writeFileSync('migrasi_dpw_sulut_lengkap.sql', sql, 'utf8');
console.log('Successfully generated migrasi_dpw_sulut_lengkap.sql! Size:', fs.statSync('migrasi_dpw_sulut_lengkap.sql').size, 'bytes');
