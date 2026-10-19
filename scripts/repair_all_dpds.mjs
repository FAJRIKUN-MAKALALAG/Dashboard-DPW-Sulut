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

// Parse all reference pengurus in migrasi_dpw_sulut_lengkap.sql
const sqlContent = fs.readFileSync('migrasi_dpw_sulut_lengkap.sql', 'utf-8');
const lines = sqlContent.split('\n');
const referenceMap = new Map();

for (const l of lines) {
  if (!l.trim().startsWith("('") || !l.includes('DPD')) continue;
  const commaIdxs = [];
  let inQuotes = false;
  for (let c = 0; c < l.length; c++) {
    if (l[c] === "'") inQuotes = !inQuotes;
    else if (l[c] === ',' && !inQuotes) commaIdxs.push(c);
  }
  if (commaIdxs.length < 15) continue;
  const nama = l.substring(commaIdxs[1] + 1, commaIdxs[2]).trim().replace(/'/g, '');
  const dpd = l.substring(commaIdxs[5] + 1, commaIdxs[6]).trim().replace(/'/g, '');
  const subOrg = l.substring(commaIdxs[10] + 1, commaIdxs[11]).trim().replace(/'/g, '');
  const jabatan = l.substring(commaIdxs[13] + 1, commaIdxs[14]).trim().replace(/'/g, '');

  if (nama && jabatan && subOrg) {
    const key = `${dpd.toLowerCase()}__${nama.toLowerCase()}`;
    referenceMap.set(key, { dpd, nama, subOrg, jabatan });
  }
}

console.log(`Parsed ${referenceMap.size} reference pengurus from migrasi SQL.`);

async function checkAndRepairAll() {
  const { data: allMembers, error } = await supabase
    .from('members')
    .select('nik, nama_lengkap, jabatan, wilayah_penugasan, dpd, tingkat_kepengurusan')
    .eq('tingkat_kepengurusan', 'DPD');

  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log(`Checking ${allMembers.length} DPD members in Supabase across all territories...`);

  let repairCount = 0;
  for (const m of allMembers) {
    const mDpd = (m.dpd || '').toLowerCase();
    const mNama = (m.nama_lengkap || '').toLowerCase();

    // Check direct match or fuzzy include
    let matchedRef = null;
    for (const [key, ref] of referenceMap.entries()) {
      const [refDpd, refNama] = key.split('__');
      if (mDpd.includes(refDpd) || refDpd.includes(mDpd)) {
        if (mNama.includes(refNama) || refNama.includes(mNama)) {
          matchedRef = ref;
          break;
        }
      }
    }

    if (matchedRef) {
      if (m.jabatan !== matchedRef.jabatan || m.wilayah_penugasan !== matchedRef.subOrg) {
        console.log(`Repairing [${m.dpd}] ${m.nama_lengkap}: ${m.jabatan} -> ${matchedRef.jabatan} (${matchedRef.subOrg})`);
        const { error: updErr } = await supabase
          .from('members')
          .update({
            jabatan: matchedRef.jabatan,
            wilayah_penugasan: matchedRef.subOrg,
            terakhir_diubah: new Date().toISOString()
          })
          .eq('nik', m.nik);

        if (updErr) {
          console.error(`Error updating ${m.nama_lengkap}:`, updErr.message);
        } else {
          repairCount++;
        }
      }
    }
  }

  console.log(`Finished global repair! Updated ${repairCount} members.`);
}

checkAndRepairAll();
