const fs = require('fs');
const path = require('path');

function generateSql() {
  const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'minsel_pengurus_data.json'), 'utf8'));

  // Ensure unique NIKs for primary key
  const seenNiks = new Map();
  const sanitized = records.map((r, idx) => {
    let nik = r.nik;
    if (seenNiks.has(nik)) {
      const count = seenNiks.get(nik) + 1;
      seenNiks.set(nik, count);
      // If it's the exact same person holding 2 roles (DPD + DPC), preserve with suffix or note
      nik = `${nik.substring(0, 14)}${String(count).padStart(2, '0')}`;
    } else {
      seenNiks.set(nik, 1);
    }
    return { ...r, nik };
  });

  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  let sql = `-- ========================================================================\n`;
  sql += `-- IMPORT DATA PENGURUS DPD & 17 DPC KABUPATEN MINAHASA SELATAN KE SUPABASE\n`;
  sql += `-- Total: ${sanitized.length} Pengurus Ber-SK Resmi\n`;
  sql += `-- ========================================================================\n\n`;

  sql += `INSERT INTO public.members (\n`;
  sql += `  nik, nomor_ekta, nama_lengkap, nomor_hp, email, sosmed,\n`;
  sql += `  dpd, dpc, dprt, is_pengurus, tingkat_kepengurusan, wilayah_penugasan,\n`;
  sql += `  nomor_sk, tanggal_sk, jabatan, status, tanggal_bergabung, catatan_mutasi, diubah_oleh\n`;
  sql += `) VALUES\n`;

  const values = sanitized.map((r) => {
    return `  (${escapeSql(r.nik)}, ${escapeSql(r.nomor_ekta)}, ${escapeSql(r.nama_lengkap)}, ${escapeSql(r.nomor_hp)}, ${escapeSql(r.email)}, ${escapeSql(r.sosmed)}, ${escapeSql(r.dpd)}, ${escapeSql(r.dpc)}, ${escapeSql(r.dprt)}, ${r.is_pengurus ? 'TRUE' : 'FALSE'}, ${escapeSql(r.tingkat_kepengurusan)}, ${escapeSql(r.wilayah_penugasan)}, ${escapeSql(r.nomor_sk)}, ${escapeSql(r.tanggal_sk)}, ${escapeSql(r.jabatan)}, ${escapeSql(r.status)}, ${escapeSql(r.tanggal_bergabung)}, ${escapeSql(r.catatan_mutasi)}, ${escapeSql(r.diubah_oleh)})`;
  });

  sql += values.join(',\n');
  sql += `\nON CONFLICT (nik) DO UPDATE SET\n`;
  sql += `  nomor_ekta = EXCLUDED.nomor_ekta,\n`;
  sql += `  nama_lengkap = EXCLUDED.nama_lengkap,\n`;
  sql += `  jabatan = EXCLUDED.jabatan,\n`;
  sql += `  dpc = EXCLUDED.dpc,\n`;
  sql += `  is_pengurus = EXCLUDED.is_pengurus,\n`;
  sql += `  nomor_sk = EXCLUDED.nomor_sk,\n`;
  sql += `  tingkat_kepengurusan = EXCLUDED.tingkat_kepengurusan;\n`;

  fs.writeFileSync(path.join(__dirname, '..', 'import_minsel_to_supabase.sql'), sql);
  console.log('SQL generated successfully: import_minsel_to_supabase.sql with ' + sanitized.length + ' rows.');
}

generateSql();
