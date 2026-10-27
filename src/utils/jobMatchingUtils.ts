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

  // Normalisasi Tingkat / Hirarki Jabatan (Paling awal dicek agar 'Wakil Ketua Bid' tidak termakan 'Ketua Bid')
  str = str
    .replace(/\b(waka|waket|wakil ketua|wkl ketua|wkl\s*ketua|wk\s*ketua|wakil\s*ktua)\b/g, 'wakil_ketua')
    .replace(/\b(wasek|wakil sekretaris|wakil sekertaris|wkl sekretaris|wkl\s*sekretaris|wk\s*sekretaris)\b/g, 'wakil_sekretaris')
    .replace(/\b(wabendum|wabend|wakil bendahara|wkl bendahara|wkl\s*bendahara|wk\s*bendahara)\b/g, 'wakil_bendahara')
    .replace(/\b(sekertaris)\b/g, 'sekretaris')
    .replace(/\b(wanhat|wantim|dewan pertimbangan)\b/g, 'dewan_pertimbangan')
    .replace(/\b(wanpak|dewan pakar)\b/g, 'dewan_pakar');

  // Normalisasi Pimpinan Bidang yang berdiri sendiri (tanpa kata 'wakil' sebelumnya)
  str = str
    .replace(/\b(ketua bidang|ketua bid|kabid)\b/g, 'wakil_ketua')
    .replace(/\b(sekretaris bidang|sekretaris bid|sekbid)\b/g, 'wakil_sekretaris')
    .replace(/\b(bendahara bidang|bendahara bid)\b/g, 'wakil_bendahara');

  // Penomoran romawi / angka pada wakil bendahara (Wabend 1 = Dana & Aset, Wabend 2 = Galang Dana)
  str = str
    .replace(/\bwakil_bendahara\s*(1|i)\b/g, 'wakil_bendahara dana aset')
    .replace(/\bwakil_bendahara\s*(2|ii)\b/g, 'wakil_bendahara galang dana');

  // Normalisasi Kata Sambung & Singkatan Umum Bidang
  str = str
    .replace(/\b(bidang|bid|bdg|bag|bagian|divisi|div|seksi|seks)\b/g, ' ')
    .replace(/&/g, ' dan ')
    .replace(/\bmasyakarat\b/g, 'masyarakat')
    .replace(/\b(dan|masyarakat|pada|untuk|di|ke)\b/g, ' ');

  // Normalisasi Istilah Khusus Partai NasDem & Sektoral
  str = str
    .replace(/\b(umkm|ukm)\b/g, 'usaha mikro kecil menengah')
    .replace(/\bham\b/g, 'hak asasi manusia')
    .replace(/\bokk\b/g, 'organisasi keanggotaan kaderisasi')
    .replace(/\b(bappilu|bapilu)\b/g, 'pemenangan pemilu')
    .replace(/\blitbang\b/g, 'penelitian pengembangan')
    .replace(/\b(ekraf|industri kreatif|ekonomi kreatif)\b/g, 'industri kreatif')
    .replace(/\bperekonomian\b/g, 'ekonomi')
    .replace(/\b(ketenagakerjaan|ketenaga kerjaan|naker|buruh)\b/g, 'tenaga kerja')
    .replace(/\b(pekerja migran indonesia|pekerja migran|migrasi|pmi)\b/g, 'migran')
    .replace(/\b(hub|hubungan)\b/g, 'hubungan')
    .replace(/\b(pariwisata)\b/g, 'pariwisata')
    .replace(/\b(desa)\b/g, 'desa')
    .replace(/\b(kelautan|perikanan)\b/g, 'maritim')
    .replace(/\bdikbud\b/g, 'pendidikan kebudayaan')
    .replace(/\b(dispora|kepemudaan)\b/g, 'pemuda olahraga')
    .replace(/\blh\b/g, 'lingkungan hidup')
    .replace(/\b(esdm|pertambangan)\b/g, 'energi mineral')
    .replace(/\b(atr|pertanahan)\b/g, 'kehutanan agraria')
    .replace(/\b(sarpras|sarana|prasarana)\b/g, 'pembangunan infrastruktur')
    .replace(/\biok\b/g, 'ideologi organisasi kaderisasi')
    .replace(/\bkesekretariatan\b/g, 'umum administrasi')
    .replace(/\badvokasi\b/g, 'hukum')
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
 * Memetakan jabatan ke signature unik (contoh: "wakil_ketua__pendidikan_kebudayaan")
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

  // Domain terinci dengan prioritas kata majemuk & spesifik terlebih dahulu
  // 1. Kebijakan Publik & Strategis (HARUS didahulukan sebelum Media/Publik agar kata 'publik' tidak tabrakan)
  if (normalized.includes('kebijakan') || normalized.includes('strategis')) {
    return `${level}__kebijakan_publik`;
  }

  // 2. Media & Komunikasi Publik (tidak boleh overlap dengan kebijakan)
  if (
    normalized.includes('media') ||
    normalized.includes('pers') ||
    normalized.includes('komunikasi') ||
    normalized.includes('pemberitaan')
  ) {
    return `${level}__media_komunikasi`;
  }

  // 3. Hukum & Hak Asasi Manusia
  if (normalized.includes('hukum') || normalized.includes('hak asasi manusia')) {
    return `${level}__hukum_ham`;
  }

  // 4. Pemenangan Pemilu
  if (
    normalized.includes('pemenangan pemilu') ||
    normalized.includes('pemilihan umum') ||
    normalized.includes('pemilu')
  ) {
    return `${level}__pemilu`;
  }

  // 5. Ideologi, Organisasi, dan Kaderisasi (Wasek/Waka)
  if (normalized.includes('ideologi')) {
    return `${level}__ideologi_kaderisasi`;
  }

  // 6. Kaderisasi & Pendidikan Politik
  if (
    normalized.includes('politik') ||
    (normalized.includes('kaderisasi') && !normalized.includes('keanggotaan'))
  ) {
    return `${level}__kaderisasi_politik`;
  }

  // 7. Pendidikan & Kebudayaan
  if (
    normalized.includes('kebudayaan') ||
    normalized.includes('budaya') ||
    normalized.includes('pendidikan')
  ) {
    return `${level}__pendidikan_kebudayaan`;
  }

  // 8. Organisasi & Keanggotaan
  if (normalized.includes('organisasi') || normalized.includes('keanggotaan')) {
    return `${level}__organisasi_keanggotaan`;
  }

  // 9. Dana & Aset vs Penggalangan Dana
  if (
    normalized.includes('aset') ||
    normalized.includes('pengelolaan dana') ||
    normalized.includes('dana dan aset') ||
    normalized.includes('dana aset')
  ) {
    return `${level}__dana_aset`;
  }
  if (
    normalized.includes('penggalangan dana') ||
    (normalized.includes('galang') && normalized.includes('dana'))
  ) {
    return `${level}__penggalangan_dana`;
  }

  // 10. Penggalangan & Penggerak Komunitas
  if (
    normalized.includes('penggalangan komunitas') ||
    (normalized.includes('penggalangan') && normalized.includes('komunitas')) ||
    normalized.includes('penggerak komunitas') ||
    normalized.includes('komunitas')
  ) {
    return `${level}__penggalangan_komunitas`;
  }

  // 11. Hubungan Legislatif, Eksekutif, Sayap & Badan
  if (normalized.includes('legislatif')) return `${level}__legislatif`;
  if (normalized.includes('eksekutif')) return `${level}__eksekutif`;
  if (normalized.includes('sayap') || normalized.includes('badan')) return `${level}__sayap_badan`;

  // 12. Bidang-bidang sektoral lainnya
  if (
    normalized.includes('pemilih pemula') ||
    normalized.includes('milenial') ||
    normalized.includes('pemula')
  ) {
    return `${level}__pemilih_pemula_milenial`;
  }
  if (normalized.includes('digital') || normalized.includes('siber')) return `${level}__digital_siber`;
  if (
    normalized.includes('usaha mikro') ||
    normalized.includes('menengah') ||
    normalized.includes('umkm')
  ) {
    return `${level}__umkm`;
  }
  if (normalized.includes('ekonomi')) return `${level}__ekonomi`;
  if (normalized.includes('agama') || normalized.includes('adat')) return `${level}__agama_adat`;
  if (
    normalized.includes('tenaga kerja') ||
    normalized.includes('buruh') ||
    normalized.includes('naker')
  ) {
    return `${level}__tenaga_kerja`;
  }
  if (normalized.includes('kesehatan') || normalized.includes('medis')) return `${level}__kesehatan`;
  if (
    normalized.includes('perempuan') ||
    normalized.includes('anak') ||
    normalized.includes('wanita')
  ) {
    return `${level}__perempuan_anak`;
  }
  if (
    normalized.includes('pariwisata') ||
    normalized.includes('kreatif') ||
    normalized.includes('ekraf')
  ) {
    return `${level}__pariwisata_ekraf`;
  }
  if (normalized.includes('maritim') || normalized.includes('kelautan')) return `${level}__maritim`;
  if (normalized.includes('pemuda') || normalized.includes('olahraga')) return `${level}__pemuda_olahraga`;
  if (
    normalized.includes('pertanian') ||
    normalized.includes('peternakan') ||
    normalized.includes('kemandirian desa')
  ) {
    return `${level}__pertanian_peternakan`;
  }
  if (normalized.includes('lingkungan hidup') || normalized.includes('lingkungan')) {
    return `${level}__lingkungan_hidup`;
  }
  if (normalized.includes('energi') || normalized.includes('mineral')) return `${level}__energi_mineral`;
  if (
    normalized.includes('kehutanan') ||
    normalized.includes('agraria') ||
    normalized.includes('tata ruang')
  ) {
    return `${level}__kehutanan_agraria`;
  }
  if (normalized.includes('migran') || normalized.includes('pmi')) return `${level}__migran`;
  if (normalized.includes('pembangunan') || normalized.includes('infrastruktur')) {
    return `${level}__pembangunan_infrastruktur`;
  }
  if (normalized.includes('umum') || normalized.includes('administrasi')) {
    return `${level}__umum_administrasi`;
  }

  return `${level}__umum`;
}

/**
 * 4. Perhitungan Skor Kecocokan Jabatan (Scored Matcher)
 * Mengembalikan nilai skor 0-100:
 * 100: Exact Match
 * 95: Strip Affixes Exact Match
 * 90: Exact Domain Signature Match
 * 85: Portofolio Khusus Ekuivalen (Waka Kebijakan Publik <===> Wasek Kebijakan Publik di DPD)
 * 60: Partial Fuzzy Match Valid
 * 0: Tidak Cocok / Ditolak
 */
export function calculateJobMatchScore(
  memberTitle?: string,
  templateTitle?: string,
  subOrgContext?: string
): number {
  if (!memberTitle || !templateTitle) return 0;

  const nMem = normalizeJobTitle(memberTitle);
  const nTpl = normalizeJobTitle(templateTitle);

  // 1. Exact Match setelah normalisasi
  if (nMem === nTpl) return 100;

  // Aturan Mutlak: Jangan pernah mencocokkan jabatan Pokok (Ketua/Sekretaris/Bendahara) dengan Wakil
  const isMemWakil = nMem.includes('wakil') || memberTitle.toLowerCase().includes('wakil');
  const isTplWakil = nTpl.includes('wakil') || templateTitle.toLowerCase().includes('wakil');
  if (isMemWakil !== isTplWakil) {
    return 0;
  }

  // 2. Strip Affixes Match
  const sMem = stripOrgAffixes(memberTitle);
  const sTpl = stripOrgAffixes(templateTitle);
  if (sMem && sTpl && sMem === sTpl) return 95;

  // 3. Khusus Dewan Pertimbangan & Dewan Pakar
  const isCouncil =
    (subOrgContext && (subOrgContext.includes('PERTIMBANGAN') || subOrgContext.includes('PAKAR'))) ||
    nMem.includes('dewan_pertimbangan') ||
    nMem.includes('dewan_pakar');

  if (isCouncil) {
    // Dewan Pertimbangan & Dewan Pakar TIDAK PERNAH memiliki portofolio "Bidang"
    const hasBidang = nMem.includes('bidang') || memberTitle.toLowerCase().includes('bidang') || memberTitle.toLowerCase().includes('bid.');
    if (hasBidang) {
      return 0;
    }

    if (sTpl === 'ketua') {
      return (sMem === 'ketua' || nMem.includes('ketua')) && !nMem.includes('wakil_ketua') ? 95 : 0;
    }
    if (sTpl === 'wakil_ketua') {
      return sMem === 'wakil_ketua' || nMem.includes('wakil_ketua') ? 95 : 0;
    }
    if (sTpl === 'sekretaris') {
      return (sMem === 'sekretaris' || nMem.includes('sekretaris')) && !nMem.includes('wakil_sekretaris') ? 95 : 0;
    }
    if (sTpl === 'wakil_sekretaris') {
      return sMem === 'wakil_sekretaris' || nMem.includes('wakil_sekretaris') ? 95 : 0;
    }
    if (sTpl === 'anggota') {
      return sMem === 'anggota' ||
        nMem.includes('anggota') ||
        sMem === '' ||
        nMem === 'dewan_pertimbangan' ||
        nMem === 'dewan_pakar'
        ? 90
        : 0;
    }
  }

  // 4. Pimpinan Pokok: Ketua, Sekretaris, Bendahara (Bukan Dewan)
  if (sTpl === 'ketua') {
    return (sMem === 'ketua' || (nMem.startsWith('ketua') && !nMem.includes('wakil'))) ? 100 : 0;
  }
  if (sTpl === 'sekretaris') {
    return (sMem === 'sekretaris' || (nMem.startsWith('sekretaris') && !nMem.includes('wakil'))) ? 100 : 0;
  }
  if (sTpl === 'bendahara') {
    return (sMem === 'bendahara' || (nMem.startsWith('bendahara') && !nMem.includes('wakil'))) ? 100 : 0;
  }

  // 5. Domain Signature Match
  const sigMem = getJobDomainSignature(nMem);
  const sigTpl = getJobDomainSignature(nTpl);
  const [lvlMem, domMem] = sigMem.split('__');
  const [lvlTpl, domTpl] = sigTpl.split('__');

  // Exact Domain Signature Match
  if (domMem !== 'umum' && sigMem === sigTpl) {
    return 90;
  }

  // Cross-level domain tolerance khusus:
  // Di SK DPD NasDem (seperti Kota Kotamobagu), portofolio Kebijakan Publik dan Isu Strategis
  // sering berstatus "Wakil Ketua Bidang Kebijakan Publik & Strategis", sedangkan di template baku
  // posisinya dialokasikan pada Slot 30 "Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis".
  if (domMem === 'kebijakan_publik' && domTpl === 'kebijakan_publik') {
    if (
      (lvlMem === 'wakil_ketua' && lvlTpl === 'wakil_sekretaris') ||
      (lvlMem === 'wakil_sekretaris' && lvlTpl === 'wakil_ketua')
    ) {
      return 85;
    }
  }

  // JIKA DOMAIN KEDUANYA SUDAH DIKETAHUI TAPI BERBEDA: JANGAN PERNAH COCOK!
  // (Mencegah false positive seperti Media Publik vs Kebijakan Publik)
  if (domMem !== 'umum' && domTpl !== 'umum' && domMem !== domTpl) {
    return 0;
  }

  // 6. Stopwords / kata umum yang DILARANG memicu overlap 1-kata
  const COMMON_STOPWORDS = new Set([
    'publik',
    'komunikasi',
    'organisasi',
    'kaderisasi',
    'pendidikan',
    'dana',
    'penggalangan',
    'hubungan',
    'bidang',
    'daerah',
    'wilayah',
    'umum',
  ]);

  if (nMem.length >= 4 && nTpl.length >= 4) {
    const memIsWaka = nMem.includes('wakil_ketua');
    const tplIsWaka = nTpl.includes('wakil_ketua');
    const memIsWasek = nMem.includes('wakil_sekretaris');
    const tplIsWasek = nTpl.includes('wakil_sekretaris');
    const memIsWabendum = nMem.includes('wakil_bendahara');
    const tplIsWabendum = nTpl.includes('wakil_bendahara');

    if ((memIsWaka && tplIsWaka) || (memIsWasek && tplIsWasek) || (memIsWabendum && tplIsWabendum)) {
      const memWords = sMem
        .split(' ')
        .filter((w) => w.length > 2 && !['wakil_ketua', 'wakil_sekretaris', 'wakil_bendahara'].includes(w));
      const tplWords = sTpl
        .split(' ')
        .filter((w) => w.length > 2 && !['wakil_ketua', 'wakil_sekretaris', 'wakil_bendahara'].includes(w));

      const meaningfulOverlap = memWords.filter(
        (w) =>
          !COMMON_STOPWORDS.has(w) &&
          (tplWords.includes(w) || tplWords.some((tw) => tw.includes(w) || w.includes(tw)))
      );

      if (meaningfulOverlap.length >= 1) {
        return 60;
      }
    }

    if (sMem.length >= 4 && sTpl.length >= 4) {
      if (sMem.includes(sTpl) || sTpl.includes(sMem)) return 60;
    }
  }

  return 0;
}

/**
 * 5. Fungsi Utama Pencocokan Jabatan (Fuzzy Matcher)
 * Mengembalikan true jika jabatan kader cocok dengan posisi template
 */
export function isJobTitleMatch(
  memberTitle?: string,
  templateTitle?: string,
  subOrgContext?: string
): boolean {
  return calculateJobMatchScore(memberTitle, templateTitle, subOrgContext) > 0;
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
    // Sesuai permintaan user: nama jabatan pengurus tetap sama dengan yang diimport dari Excel
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

/**
 * Memeriksa apakah jabatan adalah Ketua Definitif (Ketua DPW, Ketua DPD, Ketua DPC, atau Ketua DPRt).
 * Menolak tegas segala bentuk 'Wakil Ketua' atau 'Ketua Bidang'.
 */
export function isDefinitiveLeader(jabatan?: string): boolean {
  if (!jabatan) return false;
  const j = jabatan.toLowerCase().trim();
  if (
    j.includes('wakil') ||
    j.includes('bidang') ||
    j.includes('bid.') ||
    j.includes('bid ') ||
    j.includes('kabid') ||
    j.includes('sekretaris') ||
    j.includes('bendahara') ||
    j.includes('anggota')
  ) {
    return false;
  }
  return (
    j === 'ketua' ||
    j === 'ketua dpd' ||
    j === 'ketua dpw' ||
    j === 'ketua dpc' ||
    j === 'ketua dprt' ||
    j.startsWith('ketua ')
  );
}

export type JobTier =
  | 'ketua'
  | 'wakil_ketua'
  | 'sekretaris'
  | 'wakil_sekretaris'
  | 'bendahara'
  | 'wakil_bendahara'
  | 'pertimbangan'
  | 'pakar'
  | 'anggota'
  | 'other';

/**
 * Menentukan tingkatan hierarki jabatan untuk perbandingan kompatibilitas antar slot
 */
export function getJobTier(title?: string, subOrg?: string): JobTier {
  if (!title) return 'other';
  const norm = normalizeJobTitle(title);
  const sLower = (subOrg || '').toLowerCase();

  if (sLower.includes('pertimbangan') || norm.includes('dewan_pertimbangan')) return 'pertimbangan';
  if (sLower.includes('pakar') || norm.includes('dewan_pakar')) return 'pakar';

  if (norm.startsWith('wakil_ketua') || norm.includes('wakil_ketua')) return 'wakil_ketua';
  if (isDefinitiveLeader(title) || (norm.startsWith('ketua') && !norm.includes('wakil'))) return 'ketua';

  if (norm.startsWith('wakil_sekretaris') || norm.includes('wakil_sekretaris')) return 'wakil_sekretaris';
  if (norm.startsWith('sekretaris') && !norm.includes('wakil')) return 'sekretaris';

  if (norm.startsWith('wakil_bendahara') || norm.includes('wakil_bendahara')) return 'wakil_bendahara';
  if (norm.startsWith('bendahara') && !norm.includes('wakil')) return 'bendahara';

  if (norm.includes('anggota')) return 'anggota';
  return 'other';
}

/**
 * Mengembalikan peringkat urutan hierarki untuk pengurus.
 * Ketua Definitif (Ketua DPW / DPD / DPC / DPRt) SELALU MENDAPATKAN NOMOR 1.
 */
export function getHierarchicalRank(member: Member): number {
  if (isDefinitiveLeader(member.jabatan)) {
    return 1;
  }
  if (typeof member.urutan === 'number' && member.urutan > 0) {
    return member.urutan === 1 ? 2 : member.urutan;
  }
  return getPimpinanRank(member.jabatan);
}

/**
 * Mengurutkan daftar pengurus secara hierarkis:
 * Ketua Definitif selalu berada di posisi teratas (#1), diikuti pengurus lainnya secara berurutan.
 */
export function sortMembersByHierarchy(membersList: Member[]): Member[] {
  return [...membersList].sort((a, b) => {
    const rankA = getHierarchicalRank(a);
    const rankB = getHierarchicalRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
  });
}

/**
 * 6. Algoritma Pencocokan Slot Cerdas Berbasis Skor & Hierarki (3-Pass Best-Match Assignment)
 * Memasangkan item (kader atau baris Excel) ke slot template resmi secara 1-to-1:
 * - Pass 1: Scored Keyword & Domain Match (skor tertinggi, bonus +5 jika urutan Excel sesuai nomor slot).
 * - Pass 2: Order & Tier Fallback (mencocokkan baris yang tertulis typo/duplikasi di Excel bila urutan dan tingkatan jabatannya sama).
 * - Pass 3: Sequential Tier Fallback (mengisi slot kosong yang tersisa dalam tingkatan yang sama).
 * - Item tersisa dikembalikan sebagai unassignedItems (tidak ada data kader yang hilang).
 * - Slot yang tidak mendapatkan kader tetap kosong (dapat ditampilkan sebagai lowong/kosong berjabatan baku).
 */
export function assignItemsToTemplateSlots<T>(
  slots: PositionSlot[],
  items: T[],
  getJabatan: (item: T) => string,
  getUrutan?: (item: T) => number | undefined
): {
  slotAssignments: Map<number, { item: T; score: number; itemIndex: number }>;
  unassignedItems: { item: T; itemIndex: number }[];
} {
  // Pass 1: Scored Keyword & Domain Match
  const candidatePairs: { itemIndex: number; slotIndex: number; score: number }[] = [];

  items.forEach((item, itemIndex) => {
    const itemJabatan = getJabatan(item);
    const itemUrutan = getUrutan ? getUrutan(item) : undefined;

    slots.forEach((slot, slotIndex) => {
      let score = calculateJobMatchScore(itemJabatan, slot.jabatan, slot.subOrg);
      if (score > 0) {
        // Berikan bonus jika nomor urut asal di Excel cocok dengan nomor slot template
        if (typeof itemUrutan === 'number' && itemUrutan === slot.no) {
          score += 5;
        }
        candidatePairs.push({ itemIndex, slotIndex, score });
      }
    });
  });

  // Urutkan dari skor tertinggi ke terendah
  candidatePairs.sort((a, b) => b.score - a.score);

  const slotAssignments = new Map<number, { item: T; score: number; itemIndex: number }>();
  const assignedItemIndices = new Set<number>();
  const assignedSlotIndices = new Set<number>();

  for (const pair of candidatePairs) {
    if (!assignedItemIndices.has(pair.itemIndex) && !assignedSlotIndices.has(pair.slotIndex)) {
      const slot = slots[pair.slotIndex];
      const item = items[pair.itemIndex];
      slotAssignments.set(slot.no, { item, score: pair.score, itemIndex: pair.itemIndex });
      assignedItemIndices.add(pair.itemIndex);
      assignedSlotIndices.add(pair.slotIndex);
    }
  }

  // Pass 2: Fallback berbasis Nomor Urut untuk Kategori Jabatan yang Kompatibel
  // (Menyelamatkan baris typo/duplikasi di Excel seperti Boltim baris 6, 7, 36)
  slots.forEach((slot, slotIndex) => {
    if (assignedSlotIndices.has(slotIndex)) return;
    const slotTier = getJobTier(slot.jabatan, slot.subOrg);

    items.forEach((item, itemIndex) => {
      if (assignedItemIndices.has(itemIndex)) return;
      const itemUrutan = getUrutan ? getUrutan(item) : undefined;
      const itemJabatan = getJabatan(item);
      const itemTier = getJobTier(itemJabatan);

      if (typeof itemUrutan === 'number' && itemUrutan === slot.no && slotTier === itemTier) {
        slotAssignments.set(slot.no, { item, score: 50, itemIndex });
        assignedItemIndices.add(itemIndex);
        assignedSlotIndices.add(slotIndex);
      }
    });
  });

  // Pass 3: Fallback Sekuensial untuk Jabatan Setingkat yang Masih Kosong
  slots.forEach((slot, slotIndex) => {
    if (assignedSlotIndices.has(slotIndex)) return;
    const slotTier = getJobTier(slot.jabatan, slot.subOrg);
    if (slotTier === 'other') return;

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      if (assignedItemIndices.has(itemIndex)) continue;
      const item = items[itemIndex];
      const itemJabatan = getJabatan(item);
      const itemTier = getJobTier(itemJabatan);

      if (slotTier === itemTier) {
        slotAssignments.set(slot.no, { item, score: 40, itemIndex });
        assignedItemIndices.add(itemIndex);
        assignedSlotIndices.add(slotIndex);
        break;
      }
    }
  });

  const unassignedItems: { item: T; itemIndex: number }[] = [];
  items.forEach((item, itemIndex) => {
    if (!assignedItemIndices.has(itemIndex)) {
      unassignedItems.push({ item, itemIndex });
    }
  });

  return { slotAssignments, unassignedItems };
}
