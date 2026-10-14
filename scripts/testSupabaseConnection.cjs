require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Configuration:');
console.log('URL present:', Boolean(url));
if (url) {
  const parts = url.split('.');
  console.log('URL host:', parts[0] + '...supabase.co');
}
console.log('Key present:', Boolean(key));
if (key) {
  console.log('Key length:', key.length);
}

if (!url || !key) {
  console.error('\nERROR: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum terisi di .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConn() {
  try {
    const { data, error } = await supabase.from('members').select('nik').limit(1);
    if (error) {
      console.log('\n[KONEKSI TERSAMBUNG KE HOST SUPABASE]');
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        console.log('STATUS: Tabel "public.members" BELUM dibuat di Supabase.');
        console.log('Solusi: Buka Supabase Dashboard -> SQL Editor, lalu jalankan file "import_minsel_to_supabase.sql" atau "supabase_schema.sql".');
      } else {
        console.error('Supabase Error:', error.message);
      }
    } else {
      console.log('\n[SUCCESS] Berhasil terhubung ke Supabase & Tabel "members" aktif!');
      console.log(`Jumlah baris data saat ini: ${data.length}`);
    }
  } catch (err) {
    console.error('\nConnection Exception:', err.message);
  }
}

testConn();
