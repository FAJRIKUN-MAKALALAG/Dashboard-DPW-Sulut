import { Member, SulutRegion } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  DPW_STRUCTURE_TEMPLATE,
  DPD_STRUCTURE_TEMPLATE,
  DPC_STRUCTURE_TEMPLATE,
  DPRT_STRUCTURE_TEMPLATE,
} from '../data/structureTemplates';
import { isJobTitleMatch } from './jobMatchingUtils';

export interface TerritoryReadiness {
  id: string;
  name: string;
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  parentDpd?: string;
  parentDpc?: string;
  totalRequired: number;
  totalFilled: number;
  totalEmpty: number;
  percentage: number;
  status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG';
  filledMembers: Member[];
  missingPositions: string[];
}

export interface SulutStructureSummary {
  // Overall Counts
  totalMembersActive: number;
  totalMembersInactive: number;
  totalRegistered: number;
  totalPengurusBerSk: number;
  totalAnggotaBiasa: number;

  // Level Breakdown
  dpw: TerritoryReadiness;
  dpdList: TerritoryReadiness[];
  
  // High-level summary of completed areas
  fullyCompletedDpds: string[];
  partiallyFilledDpds: string[];
  emptyDpds: string[];

  totalDpcCount: number;
  completedDpcCount: number;
  totalDprtCount: number;
  completedDprtCount: number;
}

/**
 * Standard position count targets based on official templates:
 * - DPW: 34 jabatan inti dewan pimpinan wilayah
 * - DPD: 34 jabatan susunan pengurus kabupaten/kota
 * - DPC: 17 jabatan pengurus kecamatan
 * - DPRt: 9 jabatan pengurus ranting desa/kelurahan
 */
export const REQUIRED_POSITIONS = {
  DPW: DPW_STRUCTURE_TEMPLATE.filter((s) => s.subOrg === 'DEWAN PIMPINAN WILAYAH').length || 36, // 36 inti DPW
  DPD: DPD_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN DAERAH')).length || 36, // 36 inti DPD
  DPC: DPC_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN CABANG')).length || 17, // 17 inti DPC
  DPRt: DPRT_STRUCTURE_TEMPLATE.length, // 9
};

/**
 * Membersihkan dan menstandarkan nama DPD (Kabupaten/Kota)
 * Memisahkan secara ketat daerah yang memiliki kata dasar serupa
 * (misal: Kabupaten Minahasa vs Kabupaten Minahasa Selatan vs Minahasa Utara vs Minahasa Tenggara)
 */
export function normalizeDpdName(raw?: string): string {
  if (!raw) return '';
  let str = raw
    .toLowerCase()
    .trim()
    .replace(/^(kabupaten|kab\.|kab|kota|kotamadya)\s+/gi, '')
    .trim();

  // Alias / Singkatan resmi daerah Sulut
  if (str === 'bolmong' || str === 'bm') return 'bolaang mongondow';
  if (str === 'bolmut') return 'bolaang mongondow utara';
  if (str === 'bolsel') return 'bolaang mongondow selatan';
  if (str === 'boltim') return 'bolaang mongondow timur';
  if (str === 'minsel') return 'minahasa selatan';
  if (str === 'minut') return 'minahasa utara';
  if (str === 'mitra') return 'minahasa tenggara';
  if (str === 'sitaro' || str.includes('tagulandang')) return 'kepulauan siau tagulandang biaro';
  if (str === 'sangihe') return 'kepulauan sangihe';
  if (str === 'talaud') return 'kepulauan talaud';

  // Hapus karakter khusus dan normalisasi spasi
  return str.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Robust matching for DPD names:
 * Menjamin kesesuaian eksak setelah normalisasi agar Minahasa dan Minahasa Selatan/Utara/Tenggara tidak tertukar.
 */
export function isDpdMatch(memberDpd?: string, targetDpd?: string): boolean {
  if (!memberDpd || !targetDpd) return false;
  const norm1 = normalizeDpdName(memberDpd);
  const norm2 = normalizeDpdName(targetDpd);
  return norm1 === norm2;
}

/**
 * Membersihkan dan menstandarkan nama DPC (Kecamatan)
 */
export function normalizeDpcName(raw?: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/^(kecamatan|kec\.|kec)\s+/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust matching for DPC names (handles 'Kec.', 'Kecamatan', case-insensitive, exact match)
 */
export function isDpcMatch(memberDpc?: string, targetDpc?: string): boolean {
  if (!memberDpc || !targetDpc) return false;
  const norm1 = normalizeDpcName(memberDpc);
  const norm2 = normalizeDpcName(targetDpc);
  return norm1 === norm2;
}

/**
 * Membersihkan dan menstandarkan nama DPRt (Desa/Kelurahan)
 */
export function normalizeDprtName(raw?: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust matching for DPRt names (handles 'Desa', 'Kelurahan', 'Kel.', case-insensitive, exact match)
 */
export function isDprtMatch(memberDprt?: string, targetDprt?: string): boolean {
  if (!memberDprt || !targetDprt) return false;
  const norm1 = normalizeDprtName(memberDprt);
  const norm2 = normalizeDprtName(targetDprt);
  return norm1 === norm2;
}

/**
 * Normalizes strings to match positions flexibly
 */
export function cleanJobTitle(j: string): string {
  return j
    .toLowerCase()
    .replace(/bidang/g, 'bid')
    .replace(/usaha mikro kecil dan menengah/g, 'umkm')
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Computes completeness analysis for DPW, DPD, DPC, and DPRt across all Sulut
 */
export function computeStructureReadiness(members: Member[]): SulutStructureSummary {
  const activeMembers = members.filter((m) => m.status === 'Aktif');
  const inactiveMembers = members.filter((m) => m.status !== 'Aktif');
  const pengurusBerSk = activeMembers.filter((m) => m.isPengurus);
  const anggotaBiasa = activeMembers.filter((m) => !m.isPengurus);

  // 1. DPW Analysis
  const dpwMembers = activeMembers.filter(
    (m) => m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara'
  );
  const dpwMissing = DPW_STRUCTURE_TEMPLATE.filter(
    (slot) => !dpwMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
  ).map((s) => s.jabatan);

  const dpwReadiness: TerritoryReadiness = {
    id: 'DPW_SULUT',
    name: 'Sulawesi Utara',
    level: 'DPW',
    totalRequired: REQUIRED_POSITIONS.DPW,
    totalFilled: Math.min(dpwMembers.length, REQUIRED_POSITIONS.DPW),
    totalEmpty: Math.max(0, REQUIRED_POSITIONS.DPW - dpwMembers.length),
    percentage: Math.round((Math.min(dpwMembers.length, REQUIRED_POSITIONS.DPW) / REQUIRED_POSITIONS.DPW) * 100),
    status:
      dpwMembers.length >= REQUIRED_POSITIONS.DPW
        ? 'LENGKAP'
        : dpwMembers.length > 0
        ? 'SEBAGIAN'
        : 'KOSONG',
    filledMembers: dpwMembers,
    missingPositions: dpwMissing,
  };

  // 2. DPD Analysis (15 Kab/Kota)
  const fullyCompletedDpds: string[] = [];
  const partiallyFilledDpds: string[] = [];
  const emptyDpds: string[] = [];

  const dpdList: TerritoryReadiness[] = SULUT_REGIONS.map((region) => {
    // Only count official DPD pengurus (tingkat DPD or Umum DPD or Wilayah DPD)
    const dpdMembers = activeMembers.filter(
      (m) =>
        isDpdMatch(m.dpd, region.name) &&
        (m.tingkatKepengurusan === 'DPD' ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD')) ||
          (m.isPengurus && (!m.dpc || m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)')))
    );

    const coreDpdTemplate = DPD_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN DAERAH'));
    const missing = coreDpdTemplate.filter(
      (slot) => !dpdMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
    ).map((s) => s.jabatan);

    const filledCount = Math.min(dpdMembers.length, REQUIRED_POSITIONS.DPD);
    const pct = Math.round((filledCount / REQUIRED_POSITIONS.DPD) * 100);
    const status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' =
      filledCount >= REQUIRED_POSITIONS.DPD ? 'LENGKAP' : filledCount > 0 ? 'SEBAGIAN' : 'KOSONG';

    if (status === 'LENGKAP') fullyCompletedDpds.push(region.name);
    else if (status === 'SEBAGIAN') partiallyFilledDpds.push(region.name);
    else emptyDpds.push(region.name);

    return {
      id: region.id,
      name: region.name,
      level: 'DPD',
      parentDpd: region.name,
      totalRequired: REQUIRED_POSITIONS.DPD,
      totalFilled: filledCount,
      totalEmpty: Math.max(0, REQUIRED_POSITIONS.DPD - filledCount),
      percentage: pct,
      status,
      filledMembers: dpdMembers,
      missingPositions: missing,
    };
  });

  // 3. Count total DPC & DPRt
  let totalDpcCount = 0;
  let completedDpcCount = 0;
  let totalDprtCount = 0;
  let completedDprtCount = 0;

  SULUT_REGIONS.forEach((region) => {
    totalDpcCount += region.subdistricts.length;
    region.subdistricts.forEach((sub) => {
      totalDprtCount += sub.villages.length;
      const subMembers = activeMembers.filter(
        (m) =>
          isDpdMatch(m.dpd, region.name) &&
          isDpcMatch(m.dpc, sub.name) &&
          (m.tingkatKepengurusan === 'DPC' ||
            (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );
      if (subMembers.length >= REQUIRED_POSITIONS.DPC) {
        completedDpcCount++;
      }
    });
  });

  return {
    totalMembersActive: activeMembers.length,
    totalMembersInactive: inactiveMembers.length,
    totalRegistered: members.length,
    totalPengurusBerSk: pengurusBerSk.length,
    totalAnggotaBiasa: anggotaBiasa.length,
    dpw: dpwReadiness,
    dpdList,
    fullyCompletedDpds,
    partiallyFilledDpds,
    emptyDpds,
    totalDpcCount,
    completedDpcCount,
    totalDprtCount,
    completedDprtCount,
  };
}

/**
 * Calculates DPC level completeness for a specific DPD
 */
export function computeDpcReadinessForDpd(
  regionName: string,
  members: Member[]
): TerritoryReadiness[] {
  const region = SULUT_REGIONS.find((r) => isDpdMatch(r.name, regionName));
  if (!region) return [];

  const activeMembers = members.filter((m) => m.status === 'Aktif' && isDpdMatch(m.dpd, region.name));

  return region.subdistricts.map((sub) => {
    const dpcMembers = activeMembers.filter(
      (m) =>
        isDpcMatch(m.dpc, sub.name) &&
        (m.tingkatKepengurusan === 'DPC' ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
    );

    const coreDpcTemplate = DPC_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN CABANG'));
    const missing = coreDpcTemplate.filter(
      (slot) => !dpcMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
    ).map((s) => s.jabatan);

    const filledCount = Math.min(dpcMembers.length, REQUIRED_POSITIONS.DPC);
    const pct = Math.round((filledCount / REQUIRED_POSITIONS.DPC) * 100);
    const status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' =
      filledCount >= REQUIRED_POSITIONS.DPC ? 'LENGKAP' : filledCount > 0 ? 'SEBAGIAN' : 'KOSONG';

    return {
      id: `${region.id}_${sub.name}`,
      name: sub.name,
      level: 'DPC',
      parentDpd: region.name,
      parentDpc: sub.name,
      totalRequired: REQUIRED_POSITIONS.DPC,
      totalFilled: filledCount,
      totalEmpty: Math.max(0, REQUIRED_POSITIONS.DPC - filledCount),
      percentage: pct,
      status,
      filledMembers: dpcMembers,
      missingPositions: missing,
    };
  });
}

/**
 * Calculates DPRt level completeness for a specific DPC in a DPD
 */
export function computeDprtReadinessForDpc(
  regionName: string,
  subdistrictName: string,
  members: Member[]
): TerritoryReadiness[] {
  const region = SULUT_REGIONS.find((r) => isDpdMatch(r.name, regionName));
  if (!region) return [];

  const sub = region.subdistricts.find((s) => isDpcMatch(s.name, subdistrictName));
  if (!sub) return [];

  const activeMembers = members.filter(
    (m) =>
      m.status === 'Aktif' &&
      isDpdMatch(m.dpd, region.name) &&
      isDpcMatch(m.dpc, sub.name)
  );

  return sub.villages.map((village) => {
    const dprtMembers = activeMembers.filter(
      (m) =>
        isDprtMatch(m.dprt, village) &&
        (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
    );

    const missing = DPRT_STRUCTURE_TEMPLATE.filter(
      (slot) => !dprtMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
    ).map((s) => s.jabatan);

    const filledCount = Math.min(dprtMembers.length, REQUIRED_POSITIONS.DPRt);
    const pct = Math.round((filledCount / REQUIRED_POSITIONS.DPRt) * 100);
    const status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' =
      filledCount >= REQUIRED_POSITIONS.DPRt ? 'LENGKAP' : filledCount > 0 ? 'SEBAGIAN' : 'KOSONG';

    return {
      id: `${region.id}_${sub.name}_${village}`,
      name: village,
      level: 'DPRt',
      parentDpd: region.name,
      parentDpc: sub.name,
      totalRequired: REQUIRED_POSITIONS.DPRt,
      totalFilled: filledCount,
      totalEmpty: Math.max(0, REQUIRED_POSITIONS.DPRt - filledCount),
      percentage: pct,
      status,
      filledMembers: dprtMembers,
      missingPositions: missing,
    };
  });
}

export type SubOrgCategory = 'PERTIMBANGAN' | 'PAKAR' | 'PIMPINAN';

export function getMemberSubOrgCategory(m: Member): SubOrgCategory {
  const jLower = (m.jabatan || '').toLowerCase();
  const wLower = (m.wilayahPenugasan || '').toLowerCase();
  if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) return 'PERTIMBANGAN';
  if (jLower.includes('pakar') || wLower.includes('pakar')) return 'PAKAR';
  return 'PIMPINAN';
}

export function getSlotSubOrgCategory(slot: { subOrg: string }): SubOrgCategory {
  const sLower = slot.subOrg.toLowerCase();
  if (sLower.includes('pertimbangan')) return 'PERTIMBANGAN';
  if (sLower.includes('pakar')) return 'PAKAR';
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

export interface SubOrgBreakdown {
  pimpinanRequired: number;
  pimpinanFilled: number;
  pertimbanganRequired: number;
  pertimbanganFilled: number;
  pakarRequired: number;
  pakarFilled: number;
}

export interface StructureKpiStats {
  dpwRequired: number;
  dpwFilled: number;
  dpwBreakdown: SubOrgBreakdown;

  dpdRequired: number;
  dpdFilled: number;
  dpdBreakdown: SubOrgBreakdown;

  dpcRequired: number;
  dpcFilled: number;
  dpcBreakdown: SubOrgBreakdown;

  dprtRequired: number;
  dprtFilled: number;

  totalRequired: number;
  totalFilled: number;
  totalEmpty: number;
  percentage: number;
  isAllSulut: boolean;
  territoryName: string;
}

/**
 * Menghitung seluruh keterisian posisi struktur organisasi resmi
 * (DPW, DPD, DPC, DPRt) berdasarkan template susunan pengurus
 * dengan rincian Dewan Pimpinan, Dewan Pertimbangan, dan Dewan Pakar
 */
export function computeStructureKpiStats(
  members: Member[],
  selectedDpdFilter: string = 'ALL'
): StructureKpiStats {
  const activeMembers = members.filter((m) => m.status === 'Aktif');
  const isAllSulut = !selectedDpdFilter || selectedDpdFilter === 'ALL';

  let dpwRequired = 0;
  let dpwFilled = 0;
  const dpwBreakdown: SubOrgBreakdown = {
    pimpinanRequired: 0,
    pimpinanFilled: 0,
    pertimbanganRequired: 0,
    pertimbanganFilled: 0,
    pakarRequired: 0,
    pakarFilled: 0,
  };

  let dpdRequired = 0;
  let dpdFilled = 0;
  const dpdBreakdown: SubOrgBreakdown = {
    pimpinanRequired: 0,
    pimpinanFilled: 0,
    pertimbanganRequired: 0,
    pertimbanganFilled: 0,
    pakarRequired: 0,
    pakarFilled: 0,
  };

  let dpcRequired = 0;
  let dpcFilled = 0;
  const dpcBreakdown: SubOrgBreakdown = {
    pimpinanRequired: 0,
    pimpinanFilled: 0,
    pertimbanganRequired: 0,
    pertimbanganFilled: 0,
    pakarRequired: 0,
    pakarFilled: 0,
  };

  let dprtRequired = 0;
  let dprtFilled = 0;

  // 1. DPW Level (Hanya dihitung jika melihat seluruh Sulut)
  if (isAllSulut) {
    const dpwMembers = activeMembers.filter(
      (m) => m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara'
    );

    const pimSlots = DPW_STRUCTURE_TEMPLATE.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
    const perSlots = DPW_STRUCTURE_TEMPLATE.filter((s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN');
    const pakSlots = DPW_STRUCTURE_TEMPLATE.filter((s) => getSlotSubOrgCategory(s) === 'PAKAR');

    const pimFilled = pimSlots.filter((slot) =>
      dpwMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PIMPINAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    const perFilled = perSlots.filter((slot) =>
      dpwMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    const pakFilled = pakSlots.filter((slot) =>
      dpwMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PAKAR' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    dpwBreakdown.pimpinanRequired = pimSlots.length;
    dpwBreakdown.pimpinanFilled = Math.min(pimFilled, pimSlots.length);
    dpwBreakdown.pertimbanganRequired = perSlots.length;
    dpwBreakdown.pertimbanganFilled = Math.min(perFilled, perSlots.length);
    dpwBreakdown.pakarRequired = pakSlots.length;
    dpwBreakdown.pakarFilled = Math.min(pakFilled, pakSlots.length);

    dpwRequired = DPW_STRUCTURE_TEMPLATE.length;
    dpwFilled =
      dpwBreakdown.pimpinanFilled +
      dpwBreakdown.pertimbanganFilled +
      dpwBreakdown.pakarFilled;
  }

  // 2. Tentukan daftar Region yang dievaluasi
  const targetRegions = isAllSulut
    ? SULUT_REGIONS
    : SULUT_REGIONS.filter((r) => isDpdMatch(r.name, selectedDpdFilter));

  const dpdTemplate = DPD_STRUCTURE_TEMPLATE;
  const dpdPimSlots = dpdTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
  const dpdPerSlots = dpdTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN');
  const dpdPakSlots = dpdTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PAKAR');

  const dpcTemplate = DPC_STRUCTURE_TEMPLATE;
  const dpcPimSlots = dpcTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
  const dpcPerSlots = dpcTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN');
  const dpcPakSlots = dpcTemplate.filter((s) => getSlotSubOrgCategory(s) === 'PAKAR');

  const dprtTemplate = DPRT_STRUCTURE_TEMPLATE;

  targetRegions.forEach((region) => {
    // A. DPD level untuk region ini
    dpdRequired += dpdTemplate.length;
    dpdBreakdown.pimpinanRequired += dpdPimSlots.length;
    dpdBreakdown.pertimbanganRequired += dpdPerSlots.length;
    dpdBreakdown.pakarRequired += dpdPakSlots.length;

    const dpdMembers = activeMembers.filter(
      (m) =>
        isDpdMatch(m.dpd, region.name) &&
        (m.tingkatKepengurusan === 'DPD' ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD')) ||
          (m.isPengurus && (!m.dpc || m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)')))
    );

    const regPimFilled = dpdPimSlots.filter((slot) =>
      dpdMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PIMPINAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    const regPerFilled = dpdPerSlots.filter((slot) =>
      dpdMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    const regPakFilled = dpdPakSlots.filter((slot) =>
      dpdMembers.some(
        (m) => getMemberSubOrgCategory(m) === 'PAKAR' && isJobTitleMatch(m.jabatan, slot.jabatan)
      )
    ).length;

    dpdBreakdown.pimpinanFilled += Math.min(regPimFilled, dpdPimSlots.length);
    dpdBreakdown.pertimbanganFilled += Math.min(regPerFilled, dpdPerSlots.length);
    dpdBreakdown.pakarFilled += Math.min(regPakFilled, dpdPakSlots.length);
    dpdFilled +=
      Math.min(regPimFilled, dpdPimSlots.length) +
      Math.min(regPerFilled, dpdPerSlots.length) +
      Math.min(regPakFilled, dpdPakSlots.length);

    // B. DPC level untuk kecamatan di region ini
    region.subdistricts.forEach((sub) => {
      dpcRequired += dpcTemplate.length;
      dpcBreakdown.pimpinanRequired += dpcPimSlots.length;
      dpcBreakdown.pertimbanganRequired += dpcPerSlots.length;
      dpcBreakdown.pakarRequired += dpcPakSlots.length;

      const subMembers = activeMembers.filter(
        (m) =>
          isDpdMatch(m.dpd, region.name) &&
          isDpcMatch(m.dpc, sub.name) &&
          (m.tingkatKepengurusan === 'DPC' ||
            (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );

      const subPimFilled = dpcPimSlots.filter((slot) =>
        subMembers.some(
          (m) => getMemberSubOrgCategory(m) === 'PIMPINAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
        )
      ).length;

      const subPerFilled = dpcPerSlots.filter((slot) =>
        subMembers.some(
          (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN' && isJobTitleMatch(m.jabatan, slot.jabatan)
        )
      ).length;

      const subPakFilled = dpcPakSlots.filter((slot) =>
        subMembers.some(
          (m) => getMemberSubOrgCategory(m) === 'PAKAR' && isJobTitleMatch(m.jabatan, slot.jabatan)
        )
      ).length;

      dpcBreakdown.pimpinanFilled += Math.min(subPimFilled, dpcPimSlots.length);
      dpcBreakdown.pertimbanganFilled += Math.min(subPerFilled, dpcPerSlots.length);
      dpcBreakdown.pakarFilled += Math.min(subPakFilled, dpcPakSlots.length);
      dpcFilled +=
        Math.min(subPimFilled, dpcPimSlots.length) +
        Math.min(subPerFilled, dpcPerSlots.length) +
        Math.min(subPakFilled, dpcPakSlots.length);

      // C. DPRt level untuk desa/kelurahan di kecamatan ini
      sub.villages.forEach((village) => {
        dprtRequired += dprtTemplate.length;
        const villageMembers = activeMembers.filter(
          (m) =>
            isDpdMatch(m.dpd, region.name) &&
            isDpcMatch(m.dpc, sub.name) &&
            isDprtMatch(m.dprt, village) &&
            (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
        );
        const villageFilledCount = dprtTemplate.filter((slot) =>
          villageMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
        ).length;
        dprtFilled += Math.min(villageFilledCount, dprtTemplate.length);
      });
    });
  });

  const totalRequired = dpwRequired + dpdRequired + dpcRequired + dprtRequired;
  const totalFilled = dpwFilled + dpdFilled + dpcFilled + dprtFilled;
  const totalEmpty = Math.max(0, totalRequired - totalFilled);
  const percentage = totalRequired > 0 ? Number(((totalFilled / totalRequired) * 100).toFixed(1)) : 0;

  return {
    dpwRequired,
    dpwFilled,
    dpwBreakdown,
    dpdRequired,
    dpdFilled,
    dpdBreakdown,
    dpcRequired,
    dpcFilled,
    dpcBreakdown,
    dprtRequired,
    dprtFilled,
    totalRequired,
    totalFilled,
    totalEmpty,
    percentage,
    isAllSulut,
    territoryName: isAllSulut ? 'Sulawesi Utara' : selectedDpdFilter,
  };
}
