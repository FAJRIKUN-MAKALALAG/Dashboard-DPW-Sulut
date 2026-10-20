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
    .replace(/\b(waka|wakil ketua|wkl ketua|wkl\s*ketua|wakil\s*ktua)\b/g, 'wakil_ketua')
    .replace(/\b(wasek|wakil sekretaris|wkl sekretaris|wkl\s*sekretaris)\b/g, 'wakil_sekretaris')
    .replace(/\b(wabendum|wakil bendahara|wkl bendahara|wkl\s*bendahara)\b/g, 'wakil_bendahara')
    .replace(/\b(wanhat|wantim|dewan pertimbangan)\b/g, 'dewan_pertimbangan')
    .replace(/\b(wanpak|dewan pakar)\b/g, 'dewan_pakar');

  // Normalisasi Kata Sambung & Singkatan Umum
  str = str
    .replace(/\b(bidang|bid|bag|bagian|divisi|seksi)\b/g, ' ')
    .replace(/&/g, ' dan ')
    .replace(/\b(dan|masyarakat|pada|untuk|di|ke)\b/g, ' ');

  // Normalisasi Istilah Khusus Partai NasDem
  str = str
    .replace(/\bumkm\b/g, 'usaha mikro kecil menengah')
    .replace(/\bham\b/g, 'hak asasi manusia')
    .replace(/\bokk\b/g, 'organisasi keanggotaan kaderisasi')
    .replace(/\bbappilu\b/g, 'pemenangan pemilu')
    .replace(/\blitbang\b/g, 'penelitian pengembangan')
    .replace(/\bekraf\b/g, 'industri kreatif')
    .replace(/\bpekerja migran indonesia\b/g, 'migran')
    .replace(/\bmigrasi\b/g, 'migran')
    .replace(/\b(hub|hubungan)\b/g, 'hubungan')
    .replace(/\b(pariwisata)\b/g, 'pariwisata')
    .replace(/\b(desa)\b/g, 'desa')
    .replace(/[^a-z0-9_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * Pembersihan afiks wilayah / kepengurusan yang sering ditempelkan pada jabatan pokok (misal di Supabase: "Ketua DPD", "Sekretaris DPC", "Ketua Dewan Pertimbangan Daerah")
 */
export function stripOrgAffixes(title: string): string {
  let str = normalizeJobTitle(title);
  // Hilangkan kata-kata tingkat/wilayah/partai yang redundan terhadap nama jabatan inti
  str = str
    .replace(/\b(partai|nasdem|sulawesi utara|sulut)\b/g, ' ')
    .replace(/\b(dpw|dpd|dpc|dprt)\b/g, ' ')
    .replace(/\b(dewan pimpinan wilayah|dewan pimpinan daerah|dewan pimpinan cabang|dewan pimpinan ranting)\b/g, ' ')
    .replace(/\b(wilayah|daerah|cabang|ranting)\b/g, ' ')
    .replace(/\b(kabupaten|kota|kecamatan|kelurahan|desa)\b/g, ' ')
    .replace(/\b(dewan_pertimbangan|dewan_pakar)\b/g, ' ')
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
export function isJobTitleMatch(
  memberTitle?: string,
  templateTitle?: string,
  subOrgContext?: string
): boolean {
  if (!memberTitle || !templateTitle) return false;

  const nMem = normalizeJobTitle(memberTitle);
  const nTpl = normalizeJobTitle(templateTitle);

  // 1. Exact Match setelah normalisasi singkatan
  if (nMem === nTpl) return true;

  // 2. Strip Affixes Match (misal: "Ketua DPD" <===> "Ketua", "Sekretaris DPC" <===> "Sekretaris", "Ketua Dewan Pertimbangan Daerah" <===> "Ketua")
  const sMem = stripOrgAffixes(memberTitle);
  const sTpl = stripOrgAffixes(templateTitle);
  if (sMem && sTpl && sMem === sTpl) return true;

  // 3. Khusus Dewan Pertimbangan & Dewan Pakar
  const isCouncil =
    (subOrgContext && (subOrgContext.includes('PERTIMBANGAN') || subOrgContext.includes('PAKAR'))) ||
    nMem.includes('dewan_pertimbangan') ||
    nMem.includes('dewan_pakar');

  if (isCouncil) {
    // Cocokkan pimpinan & anggota dewan
    if (sTpl === 'ketua') {
      return (sMem === 'ketua' || nMem.includes('ketua')) && !nMem.includes('wakil_ketua');
    }
    if (sTpl === 'wakil_ketua') {
      return sMem === 'wakil_ketua' || nMem.includes('wakil_ketua');
    }
    if (sTpl === 'sekretaris') {
      return (sMem === 'sekretaris' || nMem.includes('sekretaris')) && !nMem.includes('wakil_sekretaris');
    }
    if (sTpl === 'wakil_sekretaris') {
      return sMem === 'wakil_sekretaris' || nMem.includes('wakil_sekretaris');
    }
    if (sTpl === 'anggota') {
      // Kader yang memiliki jabatan 'Anggota Dewan Pertimbangan', 'Anggota Wanhat', atau 'Dewan Pertimbangan'
      return (
        sMem === 'anggota' ||
        nMem.includes('anggota') ||
        sMem === '' ||
        nMem === 'dewan_pertimbangan' ||
        nMem === 'dewan_pakar'
      );
    }
  }

  // 4. Pimpinan Pokok: Ketua, Sekretaris, Bendahara (Bukan Dewan)
  if (sTpl === 'ketua' && (sMem === 'ketua' || (nMem.startsWith('ketua') && !nMem.includes('wakil')))) {
    return true;
  }
  if (sTpl === 'sekretaris' && (sMem === 'sekretaris' || (nMem.startsWith('sekretaris') && !nMem.includes('wakil')))) {
    return true;
  }
  if (sTpl === 'bendahara' && (sMem === 'bendahara' || (nMem.startsWith('bendahara') && !nMem.includes('wakil')))) {
    return true;
  }

  // 5. Domain Signature Match (hanya berlaku jika memiliki domain spesifik dan bukan __umum)
  const sigMem = getJobDomainSignature(nMem);
  const sigTpl = getJobDomainSignature(nTpl);

  if (!sigMem.endsWith('__umum') && sigMem === sigTpl) {
    return true;
  }

  // 6. Substring & Keyword Overlap Match (panjang minimal 4 karakter)
  if (nMem.length >= 4 && nTpl.length >= 4) {
    // Jika keduanya sama-sama wakil ketua, wakil sekretaris, atau wakil bendahara:
    const memIsWaka = nMem.includes('wakil_ketua');
    const tplIsWaka = nTpl.includes('wakil_ketua');
    const memIsWasek = nMem.includes('wakil_sekretaris');
    const tplIsWasek = nTpl.includes('wakil_sekretaris');
    const memIsWabendum = nMem.includes('wakil_bendahara');
    const tplIsWabendum = nTpl.includes('wakil_bendahara');

    if ((memIsWaka && tplIsWaka) || (memIsWasek && tplIsWasek) || (memIsWabendum && tplIsWabendum)) {
      // Ekstrak kata spesifik bidang
      const memWords = sMem.split(' ').filter((w) => w.length > 2 && !['wakil_ketua', 'wakil_sekretaris', 'wakil_bendahara'].includes(w));
      const tplWords = sTpl.split(' ').filter((w) => w.length > 2 && !['wakil_ketua', 'wakil_sekretaris', 'wakil_bendahara'].includes(w));
      
      const overlap = memWords.filter((w) => tplWords.includes(w) || tplWords.some((tw) => tw.includes(w) || w.includes(tw)));
      if (overlap.length >= 1 && memWords.length > 0 && tplWords.length > 0) {
        return true;
      }
    }

    if (sMem.length >= 4 && sTpl.length >= 4) {
      if (sMem.includes(sTpl) || sTpl.includes(sMem)) return true;
    }
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
    const jLower = (m.jabatan || '').toLowerCase();
    const wLower = (m.wilayahPenugasan || '').toLowerCase();
    const isMemPertimbangan =
      jLower.includes('pertimbangan') ||
      jLower.includes('wanhat') ||
      jLower.includes('wantim') ||
      wLower.includes('pertimbangan');
    const isMemPakar =
      jLower.includes('pakar') ||
      jLower.includes('wanpak') ||
      wLower.includes('pakar');

    if (isSlotPertimbangan) return isMemPertimbangan;
    if (isSlotPakar) return isMemPakar;
    if (isSlotPimpinan) return !isMemPertimbangan && !isMemPakar;
    return true;
  });

  // Cari anggota yang cocok via isJobTitleMatch dengan menyertakan context subOrg
  const found = candidates.find((m) => isJobTitleMatch(m.jabatan, slot.jabatan, slot.subOrg));

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
    if (str.includes('pertimbangan') || str.includes('wankar')) return 'DEWAN PERTIMBANGAN WILAYAH';
    if (str.includes('pakar') || str.includes('wangan')) return 'DEWAN PAKAR WILAYAH';
    return 'DEWAN PIMPINAN WILAYAH';
  } else if (level === 'DPC') {
    if (str.includes('pertimbangan') || str.includes('wankar')) return 'I. DEWAN PERTIMBANGAN';
    if (str.includes('pakar') || str.includes('wangan')) return 'II. DEWAN PAKAR';
    return 'III. DEWAN PIMPINAN CABANG';
  } else if (level === 'DPRt') {
    return 'DEWAN PIMPINAN RANTING';
  } else {
    // DPD
    if (str.includes('pertimbangan') || str.includes('wankar')) return 'I. DEWAN PERTIMBANGAN';
    if (str.includes('pakar') || str.includes('wangan')) return 'II. DEWAN PAKAR';
    return 'III. DEWAN PIMPINAN DAERAH';
  }
}

/**
 * Menentukan urutan hierarki jabatan dalam Dewan Pertimbangan / Dewan Pakar
 * (Ketua -> Wakil Ketua -> Sekretaris -> Wakil Sekretaris -> Bendahara -> Wakil Bendahara -> Anggota -> lainnya)
 */
export function getCouncilRank(jabatan?: string): number {
  if (!jabatan) return 99;
  const j = jabatan.toLowerCase().trim();
  if (j === 'ketua' || (j.startsWith('ketua') && !j.includes('wakil'))) return 1;
  if (j.includes('wakil ketua')) return 2;
  if (j === 'sekretaris' || (j.startsWith('sekretaris') && !j.includes('wakil'))) return 3;
  if (j.includes('wakil sekretaris')) return 4;
  if (j === 'bendahara' || (j.startsWith('bendahara') && !j.includes('wakil'))) return 5;
  if (j.includes('wakil bendahara')) return 6;
  if (j.includes('anggota')) return 7;
  return 10;
}

/**
 * Menentukan urutan hierarki jabatan Dewan Pimpinan (DPW / DPD / DPC / DPRt)
 * Mengikuti urutan resmi template: Ketua (1) -> Para Wakil Ketua (2..28) -> Sekretaris (29) -> Para Wakil Sekretaris (30..33) -> Bendahara (34) -> Para Wakil Bendahara (35..36) -> Lainnya.
 */
export function getPimpinanRank(jabatan?: string, slots?: PositionSlot[]): number {
  if (!jabatan) return 999;
  const j = jabatan.toLowerCase().trim();

  // 1. Cek kecocokan dengan slot template resmi jika tersedia
  if (slots && slots.length > 0) {
    const matched = slots.find((s) => isJobTitleMatch(jabatan, s.jabatan, s.subOrg));
    if (matched) {
      return matched.no * 10;
    }
  }

  // 2. Fallback hierarki berbasis kata kunci jabatan
  if (j === 'ketua' || (j.startsWith('ketua') && !j.includes('wakil'))) return 10;
  if (j.includes('wakil ketua')) return 285; // Di kelompok wakil ketua
  if (j === 'sekretaris' || (j.startsWith('sekretaris') && !j.includes('wakil'))) return 290;
  if (j.includes('wakil sekretaris')) return 335; // Di kelompok wakil sekretaris
  if (j === 'bendahara' || (j.startsWith('bendahara') && !j.includes('wakil'))) return 340;
  if (j.includes('wakil bendahara')) return 365; // Di kelompok wakil bendahara
  if (j.includes('koordinator') || j.includes('ketua bidang') || j.includes('kepala')) return 400;
  if (j.includes('anggota') || j.includes('pengurus')) return 500;
  return 600;
}


