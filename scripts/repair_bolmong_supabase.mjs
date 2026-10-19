import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

// Parse migrasi_dpw_sulut_lengkap.sql to get original correct positions for Bolmong
const sqlContent = fs.readFileSync('migrasi_dpw_sulut_lengkap.sql', 'utf-8');
const lines = sqlContent.split('\n');
const correctEntries = [];

for (let i = 464; i < 510; i++) {
  const l = lines[i];
  if (!l || !l.includes('Kabupaten Bolaang Mongondow')) continue;

  const commaIdxs = [];
  let inQuotes = false;
  for (let c = 0; c < l.length; c++) {
    if (l[c] === "'") inQuotes = !inQuotes;
    else if (l[c] === ',' && !inQuotes) commaIdxs.push(c);
  }
  const nama = l.substring(commaIdxs[1] + 1, commaIdxs[2]).trim().replace(/'/g, '');
  const subOrg = l.substring(commaIdxs[10] + 1, commaIdxs[11]).trim().replace(/'/g, '');
  const jabatan = l.substring(commaIdxs[13] + 1, commaIdxs[14]).trim().replace(/'/g, '');
  correctEntries.push({ nama, subOrg, jabatan });
}

console.log(`Found ${correctEntries.length} reference records in migrasi SQL.`);

async function repairBolmong() {
  const { data: currentMembers, error } = await supabase
    .from('members')
    .select('nik, nama_lengkap, jabatan, wilayah_penugasan, dpd')
    .ilike('dpd', '%Bolaang Mongondow%');

  if (error) {
    console.error('Error fetching Bolmong members:', error);
    return;
  }

  console.log(`Currently ${currentMembers.length} Bolmong members in Supabase.`);

  let updatedCount = 0;
  for (const m of currentMembers) {
    const cleanName = m.nama_lengkap.trim().toLowerCase();
    const ref = correctEntries.find(r => cleanName.includes(r.nama.trim().toLowerCase()) || r.nama.trim().toLowerCase().includes(cleanName));
    if (ref) {
      if (m.jabatan !== ref.jabatan || m.wilayah_penugasan !== ref.subOrg) {
        console.log(`Updating ${m.nama_lengkap}: [${m.jabatan}] -> [${ref.jabatan}] in [${ref.subOrg}]`);
        const { error: updErr } = await supabase
          .from('members')
          .update({
            jabatan: ref.jabatan,
            wilayah_penugasan: ref.subOrg,
            terakhir_diubah: new Date().toISOString()
          })
          .eq('nik', m.nik);

        if (updErr) {
          console.error(`Failed to update ${m.nama_lengkap}:`, updErr.message);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Done! Successfully updated ${updatedCount} Bolmong pengurus.`);
}

repairBolmong();
