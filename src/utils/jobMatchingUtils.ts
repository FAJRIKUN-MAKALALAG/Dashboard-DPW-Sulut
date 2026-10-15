/**
 * ============================================================================
 * MODUL CERDAS PENCOCOKAN GELAR & JABATAN STRUKTUR PARTAI NASDEM SULUT
 * File: src/utils/jobMatchingUtils.ts
 * ============================================================================
 * Modul ini menangani:
 * 1. Pembersihan & normalisasi gelar akademik/keagamaan (S.T., S.H., S.E., Ir., dsb)
 * 2. Pencocokan cerdas gelar jabatan (Fuzzy Matcher) antara template resmi partai
 *    dan variasi penulisan yang diimpor dari Excel/database (contoh:
 *    "Wakil Ketua Bid Hukum & HAM" <===> "Wakil Ketua Bidang Hukum dan Hak Asasi Manusia",
 *    "Bid." <===> "Bidang", "UMKM" <===> "Usaha Mikro Kecil dan Menengah",
 *    "Bappilu" <===> "Pemenangan Pemilu", "OKK" <===> "Organisasi dan Keanggotaan").
 * 3. Menyesuaikan nama jabatan pada baris template secara dinamis agar mengikuti
 *    nama jabatan asli yang diimpor, sehingga tidak kaku.
 */

import { PositionSlot } from '../data/structureTemplates';
import { Member } from '../types';

/**
 * 1. Menghapus gelar akademik/keagamaan dan tanda baca nama orang
 * Contoh: "PAULMAN STEVANUS RUNTUWENE, S.T." -> "PAULMAN STEVANUS RUNTUWENE"
 */
export function cleanPersonName(name?: string): string {
  if (!name) return '';
  return name
    .replace(/,\s*(s\.?\s*t\.?|s\.?\s*h\.?|s\.?\s*e\.?|s\.?\s*pd\.?|s\.?\s*sos\.?|s\.?\s*ip\.?|s\.?\s*ak\.?|m\.?\s*si\.?|m\.?\s*m\.?|m\.?\s*h\.?|dr\.?|dra\.?|drs\.?|apt\.?|h\.?|hj\.?|ir\.?)\b/gi, '')
    .trim();
}

/**
 * 2. Normalisasi Cerdas Gelar / Jabatan Partai
 * Menangani singkatan: Bid/Bidang, HAM/Hak Asasi Manusia, & / dan, OKK, Bappilu, UMKM, Ekraf, dsb.
 */
export function normalizeJobTitle(title?: string): string {
  if (!title) return '';
  let str = title.toLowerCase().trim();

  // Bersihkan titik tanda singkatan (contoh: "Bid." -> "Bid", "S.T." dsb)
  str = str.replace(/\./g, ' ');

  // Normalisasi Tingkat / Hirarki Jabatan (Paling awal dicek)
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
 * Memetakan jabatan ke signature unik (contoh: "wakil_ketua__hukum_ham")
 */
export function getJobDomainSignature(normalized: string): string {
  // Level Prefix
  let level = 'anggota';
  if (normalized.startsWith('wakil_ketua')) level = 'wakil_ketua';
  else if (normalized.startsWith('ketua')) level = 'ketua';
  else if (normalized.startsWith('wakil_sekretaris')) level = 'wakil_sekretaris';
  else if (normalized.startsWith('sekretaris')) level = 'sekretaris';
  else if (normalized.startsWith('wakil_bendahara')) level = 'wakil_bendahara';
  else if (normalized.startsWith('bendahara')) level = 'bendahara';

  // Domain / Pokok Tugas Khusus
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
 * Mengembalikan true jika jabatan kader di database cocok dengan posisi template
 */
export function isJobTitleMatch(memberTitle?: string, templateTitle?: string): boolean {
  if (!memberTitle || !templateTitle) return false;

  const nMem = normalizeJobTitle(memberTitle);
  const nTpl = normalizeJobTitle(templateTitle);

  // Exact Match setelah normalisasi singkatan
  if (nMem === nTpl) return true;

  // Domain Signature Match (misal: "Wakil Ketua Bid Hukum & HAM" <===> "Wakil Ketua Bidang Hukum dan Hak Asasi Manusia")
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

/**
 * 5. Pencocokan Anggota ke Slot Template
 * Memilih anggota yang paling cocok untuk suatu slot template.
 * JABATAN PADA SLOT DIUBAH MENGIKUTI JABATAN ASLI YANG DIIMPORT ANGGOTA!
 */
export function matchMemberToSlot(
  slot: PositionSlot,
  availableMembers: Member[],
  assignedNiks: Set<string>
): { matchedMember: Member | null; displayTitle: string } {
  const isSlotPertimbangan = slot.subOrg.toLowerCase().includes('pertimbangan');
  const isSlotPakar = slot.subOrg.toLowerCase().includes('pakar');
  const isSlotPimpinan = !isSlotPertimbangan && !isSlotPakar;

  // Saring kandidat sesuai sub-organisasi
  const candidates = availableMembers.filter((m) => {
    if (assignedNiks.has(m.nik)) return false;
    const jLower = m.jabatan?.toLowerCase() || '';
    const wLower = m.wilayahPenugasan?.toLowerCase() || '';
    const isMemPertimbangan = jLower.includes('pertimbangan') || wLower.includes('pertimbangan');
    const isMemPakar = jLower.includes('pakar') || wLower.includes('pakar');

    if (isSlotPertimbangan) return isMemPertimbangan;
    if (isSlotPakar) return isMemPakar;
    if (isSlotPimpinan) return !isMemPertimbangan && !isMemPakar;
    return true;
  });

  // Cari anggota yang cocok via isJobTitleMatch
  const found = candidates.find((m) => isJobTitleMatch(m.jabatan, slot.jabatan));

  if (found) {
    // Sesuai permintaan user: "template jabatannya tetap mengikuti jabatan yang sekaligus saya import"
    return {
      matchedMember: found,
      displayTitle: found.jabatan || slot.jabatan,
    };
  }

  return {
    matchedMember: null,
    displayTitle: slot.jabatan,
  };
}

/**
 * Normalisasi nama sub-organisasi ke nama standar template resmi
 * Contoh:
 * - "DEWAN PERTIMBANGAN", "I. DEWAN PERTIMBANGAN", "Dewan Pertimbangan Daerah" -> "I. DEWAN PERTIMBANGAN" (DPD/DPC) atau "DEWAN PERTIMBANGAN WILAYAH" (DPW)
 * - "DEWAN PAKAR", "II. DEWAN PAKAR", "Dewan Pakar Daerah" -> "II. DEWAN PAKAR" (DPD/DPC) atau "DEWAN PAKAR WILAYAH" (DPW)
 * - "DEWAN PIMPINAN DAERAH", "III. DEWAN PIMPINAN DAERAH" -> "III. DEWAN PIMPINAN DAERAH"
 */
export function normalizeSubOrgName(
  rawSubOrg?: string,
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt' = 'DPD'
): string {
  const str = (rawSubOrg || '').toLowerCase().trim();
  if (level === 'DPW') {
    if (str.includes('pertimbangan')) return 'DEWAN PERTIMBANGAN WILAYAH';
    if (str.includes('pakar')) return 'DEWAN PAKAR WILAYAH';
    return 'DEWAN PIMPINAN WILAYAH';
  } else if (level === 'DPC') {
    if (str.includes('pertimbangan')) return 'I. DEWAN PERTIMBANGAN';
    if (str.includes('pakar')) return 'II. DEWAN PAKAR';
    return 'III. DEWAN PIMPINAN CABANG';
  } else if (level === 'DPRt') {
    return 'DEWAN PIMPINAN RANTING';
  } else {
    // DPD
    if (str.includes('pertimbangan')) return 'I. DEWAN PERTIMBANGAN';
    if (str.includes('pakar')) return 'II. DEWAN PAKAR';
    return 'III. DEWAN PIMPINAN DAERAH';
  }
}

