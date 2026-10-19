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

async function run() {
  const { data, error } = await supabase
    .from('members')
    .select('nik, nama_lengkap, jabatan, wilayah_penugasan, tingkat_kepengurusan, dpd')
    .ilike('dpd', '%Bolaang Mongondow%');

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total Bolmong members found:', data?.length);
  const dpdOnly = data.filter(m => m.tingkat_kepengurusan === 'DPD' || (m.wilayah_penugasan && m.wilayah_penugasan.includes('DPD')) || (m.wilayah_penugasan && m.wilayah_penugasan.includes('PERTIMBANGAN')) || (m.wilayah_penugasan && m.wilayah_penugasan.includes('PAKAR')));
  console.log('DPD/Dewan level count:', dpdOnly.length);
  dpdOnly.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.nik}] ${m.nama_lengkap} -> jabatan: "${m.jabatan}", wilayah_penugasan: "${m.wilayah_penugasan}"`);
  });
}

run();
