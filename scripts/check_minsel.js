const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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
console.log('Connecting to:', url);
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('members')
    .select('nik, nama_lengkap, jabatan, wilayah_penugasan, tingkat_kepengurusan, dpd, dpc')
    .ilike('dpd', '%Minahasa Selatan%')
    .eq('tingkat_kepengurusan', 'DPD');

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total DPD members found:', data.length);
  data.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.nik}] ${m.nama_lengkap} -> jabatan: "${m.jabatan}", wilayah_penugasan: "${m.wilayah_penugasan}"`);
  });
}

run();
