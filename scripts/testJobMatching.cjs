require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

/**
 * 1. Menghapus gelar akademik/keagamaan dan tanda baca nama
 * Contoh: "PAULMAN STEVANUS RUNTUWENE, S.T." -> "PAULMAN STEVANUS RUNTUWENE"
 */
function cleanPersonName(name) {
  if (!name) return '';
  return name
    .replace(/,\s*(s\.?\s*t\.?|s\.?\s*h\.?|s\.?\s*e\.?|s\.?\s*pd\.?|s\.?\s*sos\.?|s\.?\s*ip\.?|s\.?\s*ak\.?|m\.?\s*si\.?|m\.?\s*m\.?|m\.?\s*h\.?|dr\.?|dra\.?|drs\.?|apt\.?|h\.?|hj\.?|ir\.?)\b/gi, '')
    .trim();
}

/**
 * 2. Normalisasi Cerdas Gelar / Jabatan Partai
 * Menangani singkatan: Bid/Bidang, HAM/Hak Asasi Manusia, & / dan, OKK, Bappilu, UMKM, Ekraf, dll.
 */
function normalizeJobTitle(title) {
  if (!title) return '';
  let str = title.toLowerCase().trim();

  // Bersihkan titik tanda singkatan (contoh: "Bid." -> "Bid", "S.T." dsb)
  str = str.replace(/\./g, ' ');

  // Normalisasi Tingkat / Hirarki Jabatan
  str = str
    .replace(/\b(waka|wakil ketua)\b/g, 'wakil_ketua')
    .replace(/\b(wasek|wakil sekretaris)\b/g, 'wakil_sekretaris')
    .replace(/\b(wabendum|wakil bendahara)\b/g, 'wakil_bendahara');

  // Normalisasi Kata Sambung & Singkatan Umum
  str = str
    .replace(/\b(bidang|bid)\b/g, '')
    .replace(/&/g, ' dan ')
    .replace(/\b(dan|masyarakat)\b/g, ' ');

  // Normalisasi Istilah Khusus Partai NasDem
  str = str
    .replace(/\bumkm\b/g, 'usaha mikro kecil menengah')
    .replace(/\bham\b/g, 'hak asasi manusia')
    .replace(/\bokk\b/g, 'organisasi keanggotaan kaderisasi')
    .replace(/\bbappilu\b/g, 'pemenangan pemilu')
    .replace(/\bekraf\b/g, 'industri kreatif')
    .replace(/\bpekerja migran indonesia\b/g, 'migran')
    .replace(/\bmigrasi\b/g, 'migran')
    .replace(/\b(hub|hubungan)\b/g, 'hubungan')
    .replace(/\b(pariwisata)\b/g, 'pariwisata')
    .replace(/\b(desa)\b/g, 'desa')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * 3. Ekstraksi Kata Kunci Topik (Domain Signature)
 */
function getJobDomainSignature(normalized) {
  // Level Prefix
  let level = 'anggota';
  if (normalized.startsWith('wakil_ketua')) level = 'wakil_ketua';
  else if (normalized.startsWith('ketua')) level = 'ketua';
  else if (normalized.startsWith('wakil_sekretaris')) level = 'wakil_sekretaris';
  else if (normalized.startsWith('sekretaris')) level = 'sekretaris';
  else if (normalized.startsWith('wakil_bendahara')) level = 'wakil_bendahara';
  else if (normalized.startsWith('bendahara')) level = 'bendahara';

  // Domain / Pokok Tugas
  const domains = [
    { key: 'hukum_ham', words: ['hukum', 'hak asasi manusia'] },
    { key: 'pemilu', words: ['pemenangan pemilu', 'pemilihan umum', 'pemilu'] },
    { key: 'organisasi_kaderisasi', words: ['organisasi', 'kaderisasi', 'keanggotaan'] },
    { key: 'legislatif', words: ['legislatif'] },
    { key: 'eksekutif', words: ['eksekutif'] },
    { key: 'sayap_badan', words: ['sayap', 'badan'] },
    { key: 'penggalangan_komunitas', words: ['penggalangan', 'komunitas'] },
    { key: 'pemilih_pemula_milenial', words: ['pemilih pemula', 'milenial', 'pemula'] },
    { key: 'digital_siber', words: ['digital', 'siber'] },
    { key: 'media_komunikasi', words: ['media', 'komunikasi'] },
    { key: 'umkm', words: ['usaha mikro', 'umkm', 'menengah'] },
    { key: 'ekonomi', words: ['ekonomi'] },
    { key: 'agama_adat', words: ['agama', 'adat'] },
    { key: 'tenaga_kerja', words: ['tenaga kerja', 'buruh'] },
    { key: 'kesehatan', words: ['kesehatan'] },
    { key: 'perempuan_anak', words: ['perempuan', 'anak', 'wanita'] },
    { key: 'pendidikan_kebudayaan', words: ['pendidikan', 'kebudayaan'] },
    { key: 'pariwisata_ekraf', words: ['pariwisata', 'kreatif', 'ekraf'] },
    { key: 'maritim', words: ['maritim', 'kelautan'] },
    { key: 'pemuda_olahraga', words: ['pemuda', 'olahraga'] },
    { key: 'pertanian_peternakan', words: ['pertanian', 'peternakan', 'desa'] },
    { key: 'lingkungan_hidup', words: ['lingkungan hidup', 'lingkungan'] },
    { key: 'energi_mineral', words: ['energi', 'mineral'] },
    { key: 'kehutanan_agraria', words: ['kehutanan', 'agraria', 'tata ruang'] },
    { key: 'migran', words: ['migran', 'migrasi'] },
    { key: 'pembangunan_infrastruktur', words: ['pembangunan', 'infrastruktur'] },
    { key: 'kebijakan_publik', words: ['kebijakan publik', 'isu strategis', 'strategis'] },
    { key: 'ideologi_kaderisasi', words: ['ideologi', 'kaderisasi'] },
    { key: 'umum_administrasi', words: ['umum', 'administrasi'] },
    { key: 'dana_aset', words: ['pengelolaan dana', 'aset', 'dana'] },
    { key: 'penggalangan_dana', words: ['penggalangan dana'] },
  ];

  let foundDomain = 'umum';
  for (const d of domains) {
    if (d.words.some((w) => normalized.includes(w))) {
      foundDomain = d.key;
      break;
    }
  }

  return `${level}__${foundDomain}`;
}

/**
 * 4. Fungsi Utama Pencocokan Jabatan (Fuzzy Matcher)
 */
function isJobTitleMatch(memberTitle, templateTitle) {
  if (!memberTitle || !templateTitle) return false;

  const nMem = normalizeJobTitle(memberTitle);
  const nTpl = normalizeJobTitle(templateTitle);

  // Exact Match setelah normalisasi singkatan
  if (nMem === nTpl) return true;

  // Domain Signature Match (misal: "Wakil Ketua Bid Hukum & HAM" vs "Wakil Ketua Bidang Hukum dan Hak Asasi Manusia")
  const sigMem = getJobDomainSignature(nMem);
  const sigTpl = getJobDomainSignature(nTpl);

  if (sigMem !== 'umum__umum' && sigMem === sigTpl) {
    return true;
  }

  // Substring match
  if (nMem.length > 5 && nTpl.length > 5) {
    if (nMem.includes(nTpl) || nTpl.includes(nMem)) return true;
  }

  return false;
}

// ============================================================================
// UJI COBA LANGSUNG DENGAN DATABASE SUPABASE
// ============================================================================
async function runTest() {
  console.log('Mengambil data anggota dari Supabase...');
  const { data: members, error } = await supabase.from('members').select('*');
  if (error || !members) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log(`Total data anggota di database: ${members.length}`);

  // Test case user:
  const test1 = isJobTitleMatch(
    'Wakil Ketua Bid Hukum & HAM',
    'Wakil Ketua Bidang Hukum dan Hak Asasi Manusia'
  );
  console.log('\n[TEST KASUS USER]');
  console.log('"Wakil Ketua Bid Hukum & HAM" <===> "Wakil Ketua Bidang Hukum dan Hak Asasi Manusia"');
  console.log('Hasil Pencocokan:', test1 ? '✅ COCOK (MATCH)' : '❌ TIDAK COCOK');

  // Ambil contoh data pengurus DPD di database
  const dpdMembers = members.filter(
    (m) => m.tingkat_kepengurusan === 'DPD' || m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD'
  );
  console.log(`\nJumlah Pengurus DPD di database: ${dpdMembers.length}`);

  // Template DPD Standar
  const dpdTemplate = [
    'Ketua',
    'Wakil Ketua Bidang Pemenangan Pemilu',
    'Wakil Ketua Bidang Organisasi dan Keanggotaan',
    'Wakil Ketua Bidang Kaderisasi dan Pendidikan Politik',
    'Wakil Ketua Bidang Hubungan Legislatif',
    'Wakil Ketua Bidang Hubungan Eksekutif',
    'Wakil Ketua Bidang Hubungan Sayap dan Badan',
    'Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas',
    'Wakil Ketua Bidang Pemilih Pemula dan Milenial',
    'Wakil Ketua Bidang Digital dan Siber',
    'Wakil Ketua Bidang Media dan Komunikasi Publik',
    'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah (UMKM)',
    'Wakil Ketua Bidang Ekonomi',
    'Wakil Ketua Bidang Agama dan Masyarakat Adat',
    'Wakil Ketua Bidang Tenaga Kerja',
    'Wakil Ketua Bidang Kesehatan',
    'Wakil Ketua Bidang Perempuan dan Anak',
    'Wakil Ketua Bidang Pendidikan dan Kebudayaan',
    'Wakil Ketua Bidang Hukum dan Hak Asasi Manusia',
    'Wakil Ketua Bidang Pariwisata dan Industri Kreatif',
    'Wakil Ketua Bidang Maritim',
    'Wakil Ketua Bidang Pemuda dan Olahraga',
    'Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa',
    'Wakil Ketua Bidang Lingkungan Hidup',
    'Wakil Ketua Bidang Energi dan Mineral',
    'Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang',
    'Wakil Ketua Bidang Migran',
    'Wakil Ketua Bidang Pembangunan dan Infrastruktur',
    'Sekretaris',
    'Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis',
    'Wakil Sekretaris Bidang Ideologi, Organisasi dan Kaderisasi',
    'Wakil Sekretaris Bidang Pemenangan Pemilu',
    'Wakil Sekretaris Bidang Umum dan Administrasi',
    'Bendahara',
    'Wakil Bendahara Pengelolaan Dana dan Aset',
    'Wakil Bendahara Penggalangan Dana',
  ];

  console.log('\n--- EVALUASI PENCOCOKAN DATA ANGGOTA KE TEMPLATE JABATAN ---');
  let matchedCount = 0;
  let unmatchedCount = 0;

  dpdMembers.slice(0, 30).forEach((m, idx) => {
    const rawJabatan = m.jabatan || '';
    const matchedSlot = dpdTemplate.find((tpl) => isJobTitleMatch(rawJabatan, tpl));

    if (matchedSlot) {
      matchedCount++;
      console.log(
        `✅ [MATCH] ${m.nama_lengkap} (${m.dpd})\n   DB     : "${rawJabatan}"\n   Template: "${matchedSlot}"\n   Tampilan Matriks: "${rawJabatan}" (Mengikuti jabatan yang diimpor)\n`
      );
    } else {
      unmatchedCount++;
      console.log(
        `⚠️ [UNMATCHED / EXTRA] ${m.nama_lengkap} (${m.dpd})\n   DB     : "${rawJabatan}"\n   Tampilan Matriks: Baris Tambahan Resmi (${rawJabatan})\n`
      );
    }
  });

  console.log(`Evaluasi Selesai: ${matchedCount} cocok, ${unmatchedCount} sebagai baris tambahan dinamis.`);
}

runTest();
