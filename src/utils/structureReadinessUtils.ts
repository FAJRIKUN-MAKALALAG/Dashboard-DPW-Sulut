import { Member } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  DPW_STRUCTURE_TEMPLATE,
  DPD_STRUCTURE_TEMPLATE,
  DPC_STRUCTURE_TEMPLATE,
  DPRT_STRUCTURE_TEMPLATE,
} from '../data/structureTemplates';
import { isJobTitleMatch } from './jobMatchingUtils';
import {
  normalizeDpdName,
  isDpdMatch,
  normalizeDpcName,
  isDpcMatch,
  normalizeDprtName,
  isDprtMatch,
  cleanJobTitle,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
  getDewanWilayahInfo,
} from './structure/territoryNormalization';
import type {
  SubOrgCategory,
  DewanWilayahInfo,
} from './structure/territoryNormalization';
import {
  computeStructureKpiStats,
  getDpdPimpinanCompliance,
} from './structure/structureComplianceUtils';
import type {
  SubOrgBreakdown,
  StructureKpiStats,
  DpdPimpinanSlotCompliance,
  DpdPimpinanCompliance,
  DpdComplianceInfo,
  DpdComplianceResult,
} from './structure/structureComplianceUtils';

export {
  normalizeDpdName,
  isDpdMatch,
  normalizeDpcName,
  isDpcMatch,
  normalizeDprtName,
  isDprtMatch,
  cleanJobTitle,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
  getDewanWilayahInfo,
  computeStructureKpiStats,
  getDpdPimpinanCompliance,
};

export type {
  SubOrgCategory,
  DewanWilayahInfo,
  SubOrgBreakdown,
  StructureKpiStats,
  DpdPimpinanSlotCompliance,
  DpdPimpinanCompliance,
  DpdComplianceInfo,
  DpdComplianceResult,
};

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
 * - DPW: 36 jabatan inti dewan pimpinan wilayah
 * - DPD: 36 jabatan susunan pengurus kabupaten/kota
 * - DPC: 17 jabatan pengurus kecamatan
 * - DPRt: 11 jabatan pengurus ranting desa/kelurahan
 */
export const REQUIRED_POSITIONS = {
  DPW: DPW_STRUCTURE_TEMPLATE.filter((s) => s.subOrg === 'DEWAN PIMPINAN WILAYAH').length || 36,
  DPD: DPD_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN DAERAH')).length || 36,
  DPC: DPC_STRUCTURE_TEMPLATE.filter((s) => s.subOrg.includes('DEWAN PIMPINAN CABANG')).length || 17,
  DPRt: DPRT_STRUCTURE_TEMPLATE.length,
};

const readinessSummaryCache = new WeakMap<Member[], SulutStructureSummary>();

/**
 * Computes completeness analysis for DPW, DPD, DPC, and DPRt across all Sulut
 */
export function computeStructureReadiness(members: Member[]): SulutStructureSummary {
  const cached = readinessSummaryCache.get(members);
  if (cached) return cached;

  const activeMembers = members.filter((m) => m.status === 'Aktif');
  const inactiveMembers = members.filter((m) => m.status !== 'Aktif');
  const pengurusBerSk = activeMembers.filter((m) => m.isPengurus);
  const anggotaBiasa = activeMembers.filter((m) => !m.isPengurus);
  const structuralActiveMembers = getExpandedStructuralMembers(activeMembers);

  // Pre-index structuralActiveMembers by normalized DPD for O(1) regional lookup
  const membersByDpd = new Map<string, Member[]>();
  for (const m of structuralActiveMembers) {
    const normDpd = normalizeDpdName(m.dpd);
    if (!normDpd) continue;
    let bucket = membersByDpd.get(normDpd);
    if (!bucket) {
      bucket = [];
      membersByDpd.set(normDpd, bucket);
    }
    bucket.push(m);
  }

  // 1. DPW Analysis
  const dpwMembers = structuralActiveMembers.filter(
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
    const compliance = getDpdPimpinanCompliance(region.name, members);
    const filledCount = compliance.filledCount;
    const totalRequired = compliance.totalRequired;
    const pct = compliance.percentage;
    const missing = compliance.vacantSlots.map((s) => s.jabatan);
    const status: 'LENGKAP' | 'SEBAGIAN' | 'KOSONG' =
      compliance.isComplete ? 'LENGKAP' : filledCount > 0 ? 'SEBAGIAN' : 'KOSONG';

    if (status === 'LENGKAP') fullyCompletedDpds.push(region.name);
    else if (status === 'SEBAGIAN') partiallyFilledDpds.push(region.name);
    else emptyDpds.push(region.name);

    return {
      id: region.id,
      name: region.name,
      level: 'DPD',
      parentDpd: region.name,
      totalRequired,
      totalFilled: filledCount,
      totalEmpty: compliance.vacantCount,
      percentage: pct,
      status,
      filledMembers: compliance.filledSlots.map((s) => s.member!).filter(Boolean),
      missingPositions: missing,
    };
  });

  // 3. Count total DPC & DPRt
  let totalDpcCount = 0;
  let completedDpcCount = 0;
  let totalDprtCount = 0;
  let completedDprtCount = 0;

  const coveredDpcKeys = new Set<string>();
  const coveredDprtKeys = new Set<string>();

  SULUT_REGIONS.forEach((region) => {
    totalDpcCount += region.subdistricts.length;
    const normRegDpd = normalizeDpdName(region.name);
    const regionMembers = membersByDpd.get(normRegDpd) || [];

    region.subdistricts.forEach((sub) => {
      totalDprtCount += sub.villages.length;
      const normSubDpcKey = normalizeDpcName(sub.name).replace(/\s+/g, '');
      const subAllMembers = regionMembers.filter((m) => isDpcMatch(m.dpc, sub.name));

      const subMembers = subAllMembers.filter((m) => {
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOtherLevel = m.tingkatKepengurusan !== 'DPD' && m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPC' ||
          jLower.includes('dpc') ||
          jLower.includes('cabang') ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD' && isNotOtherLevel) ||
          (m.jabatan && m.jabatan !== 'Anggota Biasa' && isNotOtherLevel && !jLower.includes('dpd') && !jLower.includes('dpw'))
        );
      });
      if (subMembers.length > 0) {
        const dpcKey = `${normRegDpd}__${normSubDpcKey}`;
        coveredDpcKeys.add(dpcKey);
      }

      if (subAllMembers.length === 0) return;

      // Hitung desa/kelurahan DPRt yang telah memiliki pengurus atau kader terdata
      sub.villages.forEach((village) => {
        const hasVillageMembers = subAllMembers.some((m) => {
          if (!isDprtMatch(m.dprt, village)) return false;
          return (
            m.tingkatKepengurusan === 'DPRt' ||
            m.isPengurus ||
            Boolean(m.dprt && m.dprt.trim() !== '' && m.dprt !== '-' && m.dprt.toLowerCase() !== 'umum' && m.dprt.toLowerCase() !== 'pusat/umum')
          );
        });

        if (hasVillageMembers) {
          const key = `${normRegDpd}__${normSubDpcKey}__${normalizeDprtName(village).replace(/\s+/g, '')}`;
          coveredDprtKeys.add(key);
        }
      });
    });
  });

  // Tambahkan juga DPC kecamatan terdata dari pengurus DPC yang nama kecamatannya diinput langsung
  structuralActiveMembers.forEach((m) => {
    const isDpcLevel =
      m.tingkatKepengurusan === 'DPC' ||
      (m.isPengurus && (m.jabatan || '').toLowerCase().includes('dpc')) ||
      (m.isPengurus && (m.jabatan || '').toLowerCase().includes('cabang'));

    const rawDpc = (m.dpc || '').trim();
    const isLegitDpc =
      rawDpc !== '' &&
      rawDpc !== '-' &&
      rawDpc.toLowerCase() !== 'umum' &&
      rawDpc.toLowerCase() !== 'umum (dpd)' &&
      rawDpc.toLowerCase() !== 'pusat/umum' &&
      rawDpc.toLowerCase() !== 'wilayah dpd' &&
      rawDpc.toLowerCase() !== 'belum terpetakan';

    if (isLegitDpc && m.dpd && (isDpcLevel || m.isPengurus)) {
      const key = `${normalizeDpdName(m.dpd)}__${normalizeDpcName(rawDpc).replace(/\s+/g, '')}`;
      coveredDpcKeys.add(key);
    }
  });

  completedDpcCount = coveredDpcKeys.size;

  // Tambahkan juga desa terdata dari pengurus DPRt yang nama desanya diinput kustom / langsung
  structuralActiveMembers.forEach((m) => {
    const isDprtLevel =
      m.tingkatKepengurusan === 'DPRt' ||
      (m.isPengurus && (m.jabatan || '').toLowerCase().includes('dprt')) ||
      (m.isPengurus && (m.jabatan || '').toLowerCase().includes('ranting'));

    const rawDprt = (m.dprt || '').trim();
    const isLegitDprt =
      rawDprt !== '' &&
      rawDprt !== '-' &&
      rawDprt.toLowerCase() !== 'umum' &&
      rawDprt.toLowerCase() !== 'pusat/umum' &&
      rawDprt.toLowerCase() !== 'wilayah dpd' &&
      rawDprt.toLowerCase() !== 'belum terpetakan';

    if (isDprtLevel && isLegitDprt && m.dpd && m.dpc) {
      const key = `${normalizeDpdName(m.dpd)}__${normalizeDpcName(m.dpc).replace(/\s+/g, '')}__${normalizeDprtName(rawDprt).replace(/\s+/g, '')}`;
      coveredDprtKeys.add(key);
    }
  });

  completedDprtCount = coveredDprtKeys.size;

  const summary: SulutStructureSummary = {
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
  readinessSummaryCache.set(members, summary);
  return summary;
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

  const activeMembers = getExpandedStructuralMembers(members).filter((m) => m.status === 'Aktif' && isDpdMatch(m.dpd, region.name));

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

  const activeMembers = getExpandedStructuralMembers(members).filter(
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
