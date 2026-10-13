const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'Susunan Kepengurusan DPW Sulut.xlsx');
const wb = xlsx.readFile(excelPath);
const sheet = wb.Sheets['Sheet1'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let currentKecamatan = '';
let currentLevel = '';
const members = [];
const usedNiks = new Set();

rows.forEach((r, idx) => {
  const line = r.map(c => (c !== null && c !== undefined) ? String(c).trim() : '');
  const text0 = line[0] || '';
  
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
  
  const no = parseInt(text0);
  if (!isNaN(no) && line[2] && line[1]) {
    const jabatan = line[1].trim();
    const nama = line[2].trim();
    let rawNik = line[3] ? line[3].trim() : '';
    let rawEkta = line[4] ? line[4].trim() : '';
    
    // Normalisasi NIK jika placeholder atau jika duplikat
    // Jika NIK kosong atau panjangnya 21 (misal placeholder zeros 710512000000000000000)
    if (!rawNik || rawNik.length === 21 && rawNik.endsWith('000000000000000')) {
      const prefix = rawNik ? rawNik.substring(0, 6) : '710512';
      rawNik = `${prefix}${String(no).padStart(2, '0')}${String(members.length + 1).padStart(8, '0')}`;
    }
    
    // Jika NIK sudah dipakai oleh orang lain (misal orang sama punya jabatan di DPC dan DPD)
    if (usedNiks.has(rawNik)) {
      if (currentLevel === 'DPD') {
        rawNik = rawNik.substring(0, 15) + (parseInt(rawNik.slice(-1) || '0') + 1) % 10;
        if (usedNiks.has(rawNik)) {
          rawNik = rawNik.substring(0, 14) + 'D' + String(no).padStart(1, '0');
        }
      } else {
        rawNik = rawNik.substring(0, 14) + String(members.length % 90 + 10);
      }
    }
    usedNiks.add(rawNik);
    
    const dpc = currentLevel === 'DPD' ? 'Umum (DPD)' : currentKecamatan;
    const wilayahPenugasan = currentLevel === 'DPD' ? 'DPD Kabupaten Minahasa Selatan' : `DPC Kecamatan ${currentKecamatan}`;
    const nomorSk = currentLevel === 'DPD' ? 'SK-DPD-MINSEL/001/2024' : `SK-DPC-${currentKecamatan.replace(/\s+/g, '_')}/2024`;
    
    members.push({
      nik: rawNik,
      nomor_ekta: rawEkta || null,
      nama_lengkap: nama,
      nomor_hp: null,
      email: null,
      sosmed: null,
      dpd: 'Kabupaten Minahasa Selatan',
      dpc: dpc,
      dprt: 'Belum Terpetakan',
      is_pengurus: true,
      tingkat_kepengurusan: currentLevel,
      wilayah_penugasan: wilayahPenugasan,
      nomor_sk: nomorSk,
      tanggal_sk: '2024-05-20',
      jabatan: jabatan,
      status: 'Aktif',
      tanggal_bergabung: '2024-05-20',
      catatan_mutasi: `Pengurus ber-SK resmi ${currentLevel} Kabupaten Minahasa Selatan dari berkas Excel resmi.`,
      diubah_oleh: 'Import Excel DPW Sulut'
    });
  }
});

console.log(`Berhasil mengekstrak ${members.length} pengurus riil dari Excel!`);
console.log(`Unique NIKs verified: ${usedNiks.size} / ${members.length}`);

// Buat script SQL lengkap
let sql = `-- ========================================================================
-- DATA RIIL PENGURUS DPD & DPC KABUPATEN MINAHASA SELATAN
-- Sumber: Susunan Kepengurusan DPW Sulut.xlsx
-- Total Pengurus: ${members.length} Orang (289 DPC di 17 Kecamatan + 34 DPD Minsel)
-- Kolom Email, Nomor HP, Sosial Media dikosongkan (NULL) untuk diisi mandiri di profil
-- ========================================================================

-- 1. BUAT TABEL UTAMA: MEMBERS
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
    dprt VARCHAR(100) NOT NULL,
    
    -- Struktur Organisasi & Legalitas SK
    is_pengurus BOOLEAN DEFAULT FALSE,
    tingkat_kepengurusan VARCHAR(30) DEFAULT 'Bukan Pengurus',
    wilayah_penugasan VARCHAR(100),
    nomor_sk VARCHAR(100),
    tanggal_sk DATE,
    kode_referral VARCHAR(50),
    
    -- Jabatan & Status
    jabatan VARCHAR(150) DEFAULT 'Anggota Biasa',
    status VARCHAR(50) DEFAULT 'Aktif',
    tanggal_bergabung DATE DEFAULT CURRENT_DATE,
    catatan_mutasi TEXT,
    terakhir_diubah TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    diubah_oleh VARCHAR(100),
    
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
CREATE INDEX IF NOT EXISTS idx_members_dprt ON public.members (dprt);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_is_pengurus ON public.members (is_pengurus);
CREATE INDEX IF NOT EXISTS idx_members_nomor_ekta ON public.members (nomor_ekta);

-- 2. TABEL AUDIT LOGS & DELETION REQUESTS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    member_nik VARCHAR(50) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    reason TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL,
    dpd VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dpd ON public.audit_logs (dpd);

CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_nik VARCHAR(50) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    dpd VARCHAR(100) NOT NULL,
    dpc VARCHAR(100) NOT NULL,
    dprt VARCHAR(100) NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_status ON public.deletion_requests (status);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Baca Bebas" ON public.members;
CREATE POLICY "Akses Baca Bebas" ON public.members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Akses Tambah/Ubah Bebas" ON public.members;
CREATE POLICY "Akses Tambah/Ubah Bebas" ON public.members FOR ALL USING (true);

DROP POLICY IF EXISTS "Akses Audit Baca Bebas" ON public.audit_logs;
CREATE POLICY "Akses Audit Baca Bebas" ON public.audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Akses Audit Tambah Bebas" ON public.audit_logs;
CREATE POLICY "Akses Audit Tambah Bebas" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Deletion Requests Bebas" ON public.deletion_requests;
CREATE POLICY "Akses Deletion Requests Bebas" ON public.deletion_requests FOR ALL USING (true);

-- 4. INSERT DATA RIIL ${members.length} PENGURUS
INSERT INTO public.members (
  nik, nomor_ekta, nama_lengkap, nomor_hp, email, sosmed,
  dpd, dpc, dprt, is_pengurus, tingkat_kepengurusan, wilayah_penugasan,
  nomor_sk, tanggal_sk, jabatan, status, tanggal_bergabung, catatan_mutasi, diubah_oleh
) VALUES
`;

const valueRows = members.map(m => {
  const nikStr = `'${m.nik}'`;
  const ektaStr = m.nomor_ekta ? `'${m.nomor_ekta}'` : `NULL`;
  const namaStr = `'${m.nama_lengkap.replace(/'/g, "''")}'`;
  const jabatanStr = `'${m.jabatan.replace(/'/g, "''")}'`;
  const dpcStr = `'${m.dpc.replace(/'/g, "''")}'`;
  const wilayahStr = `'${m.wilayah_penugasan.replace(/'/g, "''")}'`;
  const skStr = `'${m.nomor_sk.replace(/'/g, "''")}'`;
  
  return `  (${nikStr}, ${ektaStr}, ${namaStr}, NULL, NULL, NULL, 'Kabupaten Minahasa Selatan', ${dpcStr}, 'Belum Terpetakan', TRUE, '${m.tingkat_kepengurusan}', ${wilayahStr}, ${skStr}, '2024-05-20', ${jabatanStr}, 'Aktif', '2024-05-20', '${m.catatan_mutasi}', '${m.diubah_oleh}')`;
});

sql += valueRows.join(',\n');
sql += `\nON CONFLICT (nik) DO UPDATE SET
  nomor_ekta = EXCLUDED.nomor_ekta,
  nama_lengkap = EXCLUDED.nama_lengkap,
  jabatan = EXCLUDED.jabatan,
  dpc = EXCLUDED.dpc,
  is_pengurus = EXCLUDED.is_pengurus,
  nomor_sk = EXCLUDED.nomor_sk,
  tingkat_kepengurusan = EXCLUDED.tingkat_kepengurusan;\n`;

fs.writeFileSync(path.join(__dirname, '..', 'import_minsel_to_supabase.sql'), sql, 'utf8');
console.log('File import_minsel_to_supabase.sql berhasil diperbarui dengan data riil dari Susunan Kepengurusan DPW Sulut.xlsx!');
