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

export interface StructureKpiStats {
  dpwRequired: number;
  dpwFilled: number;
  dpdRequired: number;
  dpdFilled: number;
  dpcRequired: number;
  dpcFilled: number;
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
 * Jika posisi di template masih kosong/belum ada pengurus, maka terhitung belum lengkap
 */
export function computeStructureKpiStats(
  members: Member[],
  selectedDpdFilter: string = 'ALL'
): StructureKpiStats {
  const activeMembers = members.filter((m) => m.status === 'Aktif');
  const isAllSulut = !selectedDpdFilter || selectedDpdFilter === 'ALL';

  let dpwRequired = 0;
  let dpwFilled = 0;
  let dpdRequired = 0;
  let dpdFilled = 0;
  let dpcRequired = 0;
  let dpcFilled = 0;
  let dprtRequired = 0;
  let dprtFilled = 0;

  // 1. DPW Level (Hanya dihitung jika melihat seluruh Sulut)
  if (isAllSulut) {
    dpwRequired = DPW_STRUCTURE_TEMPLATE.length;
    const dpwMembers = activeMembers.filter(
      (m) => m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara'
    );
    const dpwFilledCount = DPW_STRUCTURE_TEMPLATE.filter((slot) =>
      dpwMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
    ).length;
    dpwFilled = Math.min(dpwFilledCount, dpwRequired);
  }

  // 2. Tentukan daftar Region yang dievaluasi
  const targetRegions = isAllSulut
    ? SULUT_REGIONS
    : SULUT_REGIONS.filter((r) => isDpdMatch(r.name, selectedDpdFilter));

  const dpdTemplate = DPD_STRUCTURE_TEMPLATE;
  const dpcTemplate = DPC_STRUCTURE_TEMPLATE;
  const dprtTemplate = DPRT_STRUCTURE_TEMPLATE;

  targetRegions.forEach((region) => {
    // A. DPD level untuk region ini
    dpdRequired += dpdTemplate.length;
    const dpdMembers = activeMembers.filter(
      (m) =>
        isDpdMatch(m.dpd, region.name) &&
        (m.tingkatKepengurusan === 'DPD' ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD')) ||
          (m.isPengurus && (!m.dpc || m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)')))
    );
    const dpdFilledCount = dpdTemplate.filter((slot) =>
      dpdMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
    ).length;
    dpdFilled += Math.min(dpdFilledCount, dpdTemplate.length);

    // B. DPC level untuk kecamatan di region ini
    region.subdistricts.forEach((sub) => {
      dpcRequired += dpcTemplate.length;
      const subMembers = activeMembers.filter(
        (m) =>
          isDpdMatch(m.dpd, region.name) &&
          isDpcMatch(m.dpc, sub.name) &&
          (m.tingkatKepengurusan === 'DPC' ||
            (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );
      const subFilledCount = dpcTemplate.filter((slot) =>
        subMembers.some((m) => isJobTitleMatch(m.jabatan, slot.jabatan))
      ).length;
      dpcFilled += Math.min(subFilledCount, dpcTemplate.length);

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
    dpdRequired,
    dpdFilled,
    dpcRequired,
    dpcFilled,
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
