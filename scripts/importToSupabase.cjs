const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function importDirectly() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.log('Perhatian: Kredensial Supabase belum terisi di .env');
    console.log('Silakan isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env terlebih dahulu,');
    console.log('atau copy isi file "import_minsel_to_supabase.sql" langsung ke Supabase SQL Editor.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const dataPath = path.join(__dirname, 'minsel_pengurus_data.json');
  const records = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`Mengunggah ${records.length} data pengurus Minsel ke Supabase...`);

  // Batch insert per 50 rows
  const chunkSize = 50;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase.from('members').upsert(chunk, { onConflict: 'nik' });
    if (error) {
      console.error(`Error pada batch ${i + 1}-${i + chunk.length}:`, error);
    } else {
      console.log(`Berhasil mengunggah batch ${i + 1} s/d ${Math.min(i + chunkSize, records.length)}`);
    }
  }

  console.log('Import selesai!');
}

importDirectly();
