import { Member } from '../../types';

const dpdNormCache = new Map<string, string>();
const dpcNormCache = new Map<string, string>();
const dprtNormCache = new Map<string, string>();
const jobCleanCache = new Map<string, string>();
const expandedMembersCache = new WeakMap<Member[], Member[]>();

/**
 * Membersihkan dan menstandarkan nama DPD (Kabupaten/Kota)
 * Memisahkan secara ketat daerah yang memiliki kata dasar serupa
 * (misal: Kabupaten Minahasa vs Kabupaten Minahasa Selatan vs Minahasa Utara vs Minahasa Tenggara)
 */
export function normalizeDpdName(raw?: string): string {
  if (!raw) return '';
  const cached = dpdNormCache.get(raw);
  if (cached !== undefined) return cached;

  const str = raw
    .toLowerCase()
    .trim()
    .replace(/^(kabupaten|kab\.|kab|kota|kotamadya)\s+/gi, '')
    .trim();

  // Alias / Singkatan resmi daerah Sulut
  let res: string;
  if (str === 'bolmong' || str === 'bm') res = 'bolaang mongondow';
  else if (str === 'bolmut') res = 'bolaang mongondow utara';
  else if (str === 'bolsel') res = 'bolaang mongondow selatan';
  else if (str === 'boltim') res = 'bolaang mongondow timur';
  else if (str === 'minsel') res = 'minahasa selatan';
  else if (str === 'minut') res = 'minahasa utara';
  else if (str === 'mitra') res = 'minahasa tenggara';
  else if (str === 'sitaro' || str.includes('tagulandang')) res = 'kepulauan siau tagulandang biaro';
  else if (str === 'sangihe') res = 'kepulauan sangihe';
  else if (str === 'talaud') res = 'kepulauan talaud';
  else {
    // Hapus karakter khusus dan normalisasi spasi
    res = str.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  dpdNormCache.set(raw, res);
  return res;
}

/**
 * Robust matching for DPD names:
 * Menjamin kesesuaian eksak setelah normalisasi agar Minahasa dan Minahasa Selatan/Utara/Tenggara tidak tertukar.
 */
export function isDpdMatch(memberDpd?: string, targetDpd?: string): boolean {
  if (!memberDpd || !targetDpd) return false;
  if (memberDpd === targetDpd) return true;
  const norm1 = normalizeDpdName(memberDpd);
  const norm2 = normalizeDpdName(targetDpd);
  return norm1 === norm2;
}

/**
 * Membersihkan dan menstandarkan nama DPC (Kecamatan)
 */
export function normalizeDpcName(raw?: string): string {
  if (!raw) return '';
  const cached = dpcNormCache.get(raw);
  if (cached !== undefined) return cached;

  const res = raw
    .toLowerCase()
    .trim()
    .replace(/^(kecamatan|kec\.|kec)\s+/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  dpcNormCache.set(raw, res);
  return res;
}

/**
 * Robust matching for DPC names (handles 'Kec.', 'Kecamatan', case-insensitive, exact match)
 */
export function isDpcMatch(memberDpc?: string, targetDpc?: string): boolean {
  if (!memberDpc || !targetDpc) return false;
  if (memberDpc === targetDpc) return true;
  const norm1 = normalizeDpcName(memberDpc);
  const norm2 = normalizeDpcName(targetDpc);
  if (norm1 === norm2) return true;
  return norm1.replace(/\s+/g, '') === norm2.replace(/\s+/g, '');
}

/**
 * Membersihkan dan menstandarkan nama DPRt (Desa/Kelurahan)
 */
export function normalizeDprtName(raw?: string): string {
  if (!raw) return '';
  const cached = dprtNormCache.get(raw);
  if (cached !== undefined) return cached;

  let str = raw
    .toLowerCase()
    .trim()
    .replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '')
    .trim();

  // Normalize roman numerals and digits to Indonesian words for uniform matching
  str = str
    .replace(/\b(i|1)\b/g, 'satu')
    .replace(/\b(ii|2)\b/g, 'dua')
    .replace(/\b(iii|3)\b/g, 'tiga')
    .replace(/\b(iv|4)\b/g, 'empat')
    .replace(/\b(v|5)\b/g, 'lima');

  const res = str
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  dprtNormCache.set(raw, res);
  return res;
}

/**
 * Robust matching for DPRt names (handles 'Desa', 'Kelurahan', 'Kel.', case-insensitive, exact match)
 */
export function isDprtMatch(memberDprt?: string, targetDprt?: string): boolean {
  if (!memberDprt || !targetDprt) return false;
  if (memberDprt === targetDprt) return true;
  const norm1 = normalizeDprtName(memberDprt);
  const norm2 = normalizeDprtName(targetDprt);
  if (norm1 === norm2) return true;
  return norm1.replace(/\s+/g, '') === norm2.replace(/\s+/g, '');
}

/**
 * Normalizes strings to match positions flexibly
 */
export function cleanJobTitle(j: string): string {
  if (!j) return '';
  const cached = jobCleanCache.get(j);
  if (cached !== undefined) return cached;

  const res = j
    .toLowerCase()
    .replace(/bidang/g, 'bid')
    .replace(/usaha mikro kecil dan menengah/g, 'umkm')
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]/g, '');
  jobCleanCache.set(j, res);
  return res;
}

/**
 * Mengembangkan daftar Member menjadi daftar penugasan struktural teritorial.
 * Jika seorang kader memiliki beberapa jabatan (positions: [...]), fungsi ini akan
 * menghasilkan 1 entitas penugasan untuk setiap jabatan yang dimilikinya, sehingga
 * keterisian struktur DPD/DPC/DPRt tetap 100% lengkap tanpa menggandakan data orang asli di database.
 */
export function getExpandedStructuralMembers(members: Member[]): Member[] {
  if (!Array.isArray(members)) return [];
  const cached = expandedMembersCache.get(members);
  if (cached) return cached;

  const result: Member[] = [];
  for (const m of members) {
    if (Array.isArray(m.positions) && m.positions.length > 0) {
      for (const pos of m.positions) {
        result.push({
          ...m,
          id:
            pos.id ||
            `${m.nik}_${pos.tingkatKepengurusan}_${pos.dpc || 'UMUM'}_${pos.wilayahPenugasan || 'PIMPINAN'}_${(pos.jabatan || '').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
          tingkatKepengurusan: pos.tingkatKepengurusan as any,
          dpd: pos.dpd || m.dpd,
          dpc: pos.dpc || m.dpc,
          dprt: pos.dprt || m.dprt,
          wilayahPenugasan: pos.wilayahPenugasan || m.wilayahPenugasan,
          jabatan: pos.jabatan || m.jabatan,
          nomorSK: pos.nomorSK || m.nomorSK,
          tanggalSK: pos.tanggalSK || m.tanggalSK,
          urutan: pos.urutan ?? m.urutan,
          isPengurus: true,
        });
      }
    } else {
      result.push(m);
    }
  }
  expandedMembersCache.set(members, result);
  return result;
}

export type SubOrgCategory = 'PERTIMBANGAN' | 'PAKAR' | 'PIMPINAN';

export function getMemberSubOrgCategory(m: Member): SubOrgCategory {
  const jLower = (m.jabatan || '').toLowerCase();
  const wLower = (m.wilayahPenugasan || '').toLowerCase();
  if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan') || jLower.includes('wankar') || wLower.includes('wankar')) return 'PERTIMBANGAN';
  if (jLower.includes('pakar') || wLower.includes('pakar') || jLower.includes('wangan') || wLower.includes('wangan')) return 'PAKAR';
  return 'PIMPINAN';
}

export function getSlotSubOrgCategory(slot: { subOrg: string }): SubOrgCategory {
  const sLower = slot.subOrg.toLowerCase();
  if (sLower.includes('pertimbangan') || sLower.includes('wankar')) return 'PERTIMBANGAN';
  if (sLower.includes('pakar') || sLower.includes('wangan')) return 'PAKAR';
  return 'PIMPINAN';
}

export interface DewanWilayahInfo {
  isDewan: boolean;
  category: 'PERTIMBANGAN' | 'PAKAR' | null;
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'UNKNOWN';
  councilName: string; // "Dewan Pertimbangan" | "Dewan Pakar"
  shortLocationLabel: string; // e.g. "DPW Sulut", "DPD Kab. Minahasa Selatan", "DPC Kec. Amurang"
  badgeText: string; // e.g. "Dewan Pertimbangan · DPW Sulut"
  detailedTerritory: string; // e.g. "Tingkat DPW Sulawesi Utara", "DPD Kab. Minahasa Selatan", "DPC Kec. Amurang, Kab. Minahasa Selatan"
}

/**
 * Mendeteksi apakah anggota merupakan Dewan Pakar / Dewan Pertimbangan
 * dan menghasilkan label wilayah teritorial yang sangat jelas (DPW, DPD mana, atau DPC mana).
 */
export function getDewanWilayahInfo(m: Member): DewanWilayahInfo {
  const cat = getMemberSubOrgCategory(m);
  if (cat !== 'PERTIMBANGAN' && cat !== 'PAKAR') {
    return {
      isDewan: false,
      category: null,
      level: 'UNKNOWN',
      councilName: '',
      shortLocationLabel: '',
      badgeText: '',
      detailedTerritory: '',
    };
  }

  const councilName = cat === 'PERTIMBANGAN' ? 'Dewan Pertimbangan' : 'Dewan Pakar';

  // Deteksi Tingkat Kepengurusan
  const tingkat = m.tingkatKepengurusan?.toUpperCase() || '';
  const wil = (m.wilayahPenugasan || '').toUpperCase();
  const dpd = (m.dpd || '').trim();
  const dpc = (m.dpc || '').trim();
  const dprt = (m.dprt || '').trim();

  let level: 'DPW' | 'DPD' | 'DPC' | 'DPRt' = 'DPD';

  if (
    tingkat === 'DPW' ||
    wil.includes('DPW') ||
    dpd === 'Sulawesi Utara' ||
    dpd === 'DPW Sulut' ||
    (!dpd && !dpc)
  ) {
    level = 'DPW';
  } else if (
    tingkat === 'DPC' ||
    wil.includes('DPC') ||
    wil.includes('CABANG') ||
    (dpc && dpc !== '-' && dpc !== 'Wilayah DPD' && dpc !== 'Umum (DPD)' && dpc !== 'Pusat/Umum')
  ) {
    level = 'DPC';
  } else if (tingkat === 'DPRT' || wil.includes('RANTING') || (dprt && dprt !== '-' && dprt !== 'Pusat/Umum')) {
    level = 'DPRt';
  } else {
    level = 'DPD';
  }

  let shortLocationLabel = '';
  let detailedTerritory = '';

  if (level === 'DPW') {
    shortLocationLabel = 'DPW Sulut';
    detailedTerritory = 'Tingkat Provinsi / DPW Sulawesi Utara';
  } else if (level === 'DPD') {
    const cleanDpd = dpd || 'Sulawesi Utara';
    shortLocationLabel = cleanDpd.startsWith('DPD') ? cleanDpd : `DPD ${cleanDpd}`;
    detailedTerritory = cleanDpd.startsWith('DPD') ? cleanDpd : `DPD ${cleanDpd}`;
  } else if (level === 'DPC') {
    const cleanKec = dpc ? dpc.replace(/^(kecamatan|kec\.|kec)\s+/gi, '') : 'Cabang';
    shortLocationLabel = `DPC Kec. ${cleanKec}`;
    detailedTerritory = `DPC Kec. ${cleanKec}${dpd ? `, ${dpd}` : ''}`;
  } else {
    shortLocationLabel = `DPRt ${dprt}`;
    detailedTerritory = `DPRt ${dprt}${dpc ? `, Kec. ${dpc}` : ''}${dpd ? `, ${dpd}` : ''}`;
  }

  return {
    isDewan: true,
    category: cat,
    level,
    councilName,
    shortLocationLabel,
    badgeText: `${councilName} · ${shortLocationLabel}`,
    detailedTerritory,
  };
}

