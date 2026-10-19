/**
 * repair_all_subOrg_universal.mjs
 * Script universal untuk memperbaiki kolom wilayah_penugasan di Supabase
 * Berlaku untuk SEMUA pengurus (DPW, DPD, DPC, DPRt) - tanpa hardcode nama
 */
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
if (!url || !key) { console.error('VITE_SUPABASE_URL atau KEY tidak ditemukan di .env'); process.exit(1); }
const supabase = createClient(url, key);

function resolveCorrectSubOrg(jabatan, wilayahPenugasan, tingkatKepengurusan) {
  const jLow = (jabatan || '').toLowerCase();
  const wLow = (wilayahPenugasan || '').toLowerCase();
  const lvl = tingkatKepengurusan || 'DPD';
  const PERTIMBANGAN = lvl === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN';
  const PAKAR = lvl === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR';
  const PIMPINAN = lvl === 'DPW' ? 'DEWAN PIMPINAN WILAYAH' : lvl === 'DPD' ? 'III. DEWAN PIMPINAN DAERAH' : lvl === 'DPC' ? 'III. DEWAN PIMPINAN CABANG' : 'DEWAN PIMPINAN RANTING';
  let correctSubOrg;
  if (jLow.includes('pertimbangan') || wLow.includes('pertimbangan') || jLow.includes('wanhat') || jLow.includes('wantim')) { correctSubOrg = PERTIMBANGAN; }
  else if (jLow.includes('pakar') || wLow.includes('pakar') || jLow.includes('wanpak')) { correctSubOrg = PAKAR; }
  else { correctSubOrg = PIMPINAN; }
  if (wilayahPenugasan === correctSubOrg) return null;
  return correctSubOrg;
}

async function repairAllSubOrgs() {
  console.log('Mengambil semua pengurus dari Supabase...');
  const { data: allPengurus, error } = await supabase.from('members').select('nik, nama_lengkap, jabatan, wilayah_penugasan, tingkat_kepengurusan, dpd').eq('is_pengurus', true).not('jabatan', 'is', null);
  if (error) { console.error('Gagal mengambil data:', error.message); return; }
  console.log('Ditemukan ' + allPengurus.length + ' pengurus aktif.');
  const toUpdate = [];
  for (const m of allPengurus) {
    const correct = resolveCorrectSubOrg(m.jabatan, m.wilayah_penugasan, m.tingkat_kepengurusan);
    if (correct !== null) toUpdate.push({ nik: m.nik, nama: m.nama_lengkap, dpd: m.dpd, lvl: m.tingkat_kepengurusan, old: m.wilayah_penugasan, newVal: correct });
  }
  console.log('Perlu diperbaiki: ' + toUpdate.length + ' pengurus');
  if (toUpdate.length === 0) { console.log('Semua wilayah_penugasan sudah benar!'); return; }
  toUpdate.slice(0, 10).forEach(u => console.log('  [' + u.lvl + '] ' + u.dpd + ' | ' + u.nama + ' | "' + u.old + '" -> "' + u.newVal + '"'));
  let successCount = 0, errorCount = 0;
  for (const u of toUpdate) {
    const { error: updErr } = await supabase.from('members').update({ wilayah_penugasan: u.newVal, terakhir_diubah: new Date().toISOString().replace('T', ' ').substring(0, 16) }).eq('nik', u.nik);
    if (updErr) { console.error('Gagal update ' + u.nama + ': ' + updErr.message); errorCount++; } else { successCount++; }
  }
  console.log('Selesai! Berhasil: ' + successCount + ' | Gagal: ' + errorCount);
}

repairAllSubOrgs().catch(err => { console.error('Error:', err); process.exit(1); });
