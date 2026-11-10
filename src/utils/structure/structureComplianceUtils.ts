import { Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  DPW_STRUCTURE_TEMPLATE,
  DPD_STRUCTURE_TEMPLATE,
  DPC_STRUCTURE_TEMPLATE,
  DPRT_STRUCTURE_TEMPLATE,
} from '../../data/structureTemplates';
import { isJobTitleMatch } from '../jobMatchingUtils';
import {
  normalizeDpdName,
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
} from './territoryNormalization';

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

export interface DpdPimpinanSlotCompliance {
  no: number;
  subOrg: string;
  jabatan: string;
  isFilled: boolean;
  member?: Member;
}

export interface DpdPimpinanCompliance {
  dpdName: string;
  totalRequired: number; // 36
  filledCount: number;
  vacantCount: number;
  percentage: number;
  isComplete: boolean;
  slots: DpdPimpinanSlotCompliance[];
  vacantSlots: DpdPimpinanSlotCompliance[];
  filledSlots: DpdPimpinanSlotCompliance[];
  ksbStatus: {
    ketua: boolean;
    sekretaris: boolean;
    bendahara: boolean;
  };
}

export type DpdComplianceInfo = DpdPimpinanCompliance;
export type DpdComplianceResult = DpdPimpinanCompliance;

const kpiStatsCache = new WeakMap<Member[], Map<string, StructureKpiStats>>();
const dpdComplianceCache = new WeakMap<Member[], Map<string, DpdPimpinanCompliance>>();

/**
 * Menghitung seluruh keterisian posisi struktur organisasi resmi
 * (DPW, DPD, DPC, DPRt) berdasarkan template susunan pengurus
 * dengan rincian Dewan Pimpinan, Dewan Pertimbangan, dan Dewan Pakar
 */
export function computeStructureKpiStats(
  members: Member[],
  selectedDpdFilter: string = 'ALL',
  selectedDpcFilter?: string,
  selectedDprtFilter?: string
): StructureKpiStats {
  const cacheKey = `${selectedDpdFilter || 'ALL'}__${selectedDpcFilter || ''}__${selectedDprtFilter || ''}`;
  let memberCacheMap = kpiStatsCache.get(members);
  if (memberCacheMap) {
    const cachedStats = memberCacheMap.get(cacheKey);
    if (cachedStats) return cachedStats;
  } else {
    memberCacheMap = new Map<string, StructureKpiStats>();
    kpiStatsCache.set(members, memberCacheMap);
  }

  const activeMembers = getExpandedStructuralMembers(members).filter((m) => m.status === 'Aktif');
  const membersByDpd = new Map<string, Member[]>();
  for (const m of activeMembers) {
    const normDpd = normalizeDpdName(m.dpd);
    if (!normDpd) continue;
    let bucket = membersByDpd.get(normDpd);
    if (!bucket) {
      bucket = [];
      membersByDpd.set(normDpd, bucket);
    }
    bucket.push(m);
  }

  const isDprtScoped = Boolean(selectedDprtFilter && selectedDprtFilter !== 'ALL');
  const isDpcScoped = Boolean(!isDprtScoped && selectedDpcFilter && selectedDpcFilter !== 'ALL');
  const isDpdScoped = Boolean(!isDprtScoped && !isDpcScoped && selectedDpdFilter && selectedDpdFilter !== 'ALL');
  const isAllSulut = !isDprtScoped && !isDpcScoped && !isDpdScoped;

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
    const regionMembers = membersByDpd.get(normalizeDpdName(region.name)) || [];

    // A. DPD level untuk region ini (Hanya jika bukan DPC/DPRt scoped)
    if (!isDpcScoped && !isDprtScoped) {
      dpdRequired += dpdTemplate.length;
      dpdBreakdown.pimpinanRequired += dpdPimSlots.length;
      dpdBreakdown.pertimbanganRequired += dpdPerSlots.length;
      dpdBreakdown.pakarRequired += dpdPakSlots.length;

      const dpdMembers = regionMembers.filter((m) => {
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOtherLevel = m.tingkatKepengurusan !== 'DPC' && m.tingkatKepengurusan !== 'DPRt' && m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPD' ||
          jLower.includes('dpd') ||
          jLower.includes('daerah') ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          !m.dpc ||
          m.dpc === '-' ||
          (m.isPengurus && isNotOtherLevel) ||
          (m.jabatan && m.jabatan !== 'Anggota Biasa' && isNotOtherLevel && !jLower.includes('dpc') && !jLower.includes('ranting'))
        );
      });

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
    }

    // B. DPC level untuk kecamatan di region ini
    region.subdistricts.forEach((sub) => {
      // Jika DPC-scoped, lewati kecamatan yang bukan wilayah tugasnya
      if (isDpcScoped && !isDpcMatch(sub.name, selectedDpcFilter)) {
        return;
      }

      const subAllMembers = regionMembers.filter((m) => isDpcMatch(m.dpc, sub.name));

      // Jika DPRt-scoped, lewati evaluasi jabatan DPC
      if (!isDprtScoped) {
        dpcRequired += dpcTemplate.length;
        dpcBreakdown.pimpinanRequired += dpcPimSlots.length;
        dpcBreakdown.pertimbanganRequired += dpcPerSlots.length;
        dpcBreakdown.pakarRequired += dpcPakSlots.length;

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
      }

      // C. DPRt level untuk desa/kelurahan di kecamatan ini
      sub.villages.forEach((village) => {
        // Jika DPRt-scoped, hanya hitung desa spesifik tersebut
        if (isDprtScoped && !isDprtMatch(village, selectedDprtFilter)) {
          return;
        }

        dprtRequired += dprtTemplate.length;
        if (subAllMembers.length === 0) return;

        const villageMembers = subAllMembers.filter(
          (m) =>
            isDprtMatch(m.dprt, village) &&
            (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
        );
        if (villageMembers.length === 0) return;

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

  const territoryName = isDprtScoped
    ? selectedDprtFilter!
    : isDpcScoped
    ? selectedDpcFilter!
    : isDpdScoped
    ? selectedDpdFilter
    : 'Sulawesi Utara';

  const result: StructureKpiStats = {
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
    territoryName,
  };
  memberCacheMap.set(cacheKey, result);
  return result;
}

/**
 * Memeriksa kepatuhan formasi DPD Bagian A (Dewan Pimpinan Daerah / 36 Jabatan Baku).
 * Mengembalikan status keterisian x/36 dan daftar jabatan mana saja yang belum terisi (lowong).
 */
export function getDpdPimpinanCompliance(
  dpdName: string,
  allMembers: Member[]
): DpdPimpinanCompliance {
  const safeMembers = allMembers || [];
  const normKey = normalizeDpdName(dpdName);
  let compMap = dpdComplianceCache.get(safeMembers);
  if (compMap) {
    const cached = compMap.get(normKey);
    if (cached) return cached;
  } else {
    compMap = new Map<string, DpdPimpinanCompliance>();
    dpdComplianceCache.set(safeMembers, compMap);
  }

  const pimpinanSlots = DPD_STRUCTURE_TEMPLATE.filter(
    (s) => getSlotSubOrgCategory(s) === 'PIMPINAN'
  );
  const totalRequired = pimpinanSlots.length || 36;

  // Anggota DPD untuk pimpinan daerah ini
  const dpdMembers = getExpandedStructuralMembers(safeMembers).filter((m) => {
    if (m.status !== 'Aktif') return false;
    if (!isDpdMatch(m.dpd, dpdName)) return false;
    const isDpdLevel =
      m.tingkatKepengurusan === 'DPD' ||
      (!m.tingkatKepengurusan && (m.isPengurus || Boolean(m.nomorSK)));
    if (!isDpdLevel) return false;
    // Bukan pertimbangan dan bukan pakar
    const cat = getMemberSubOrgCategory(m);
    return cat === 'PIMPINAN';
  });

  const usedMemberNiks = new Set<string>();
  const slots: DpdPimpinanSlotCompliance[] = [];
  const filledSlots: DpdPimpinanSlotCompliance[] = [];
  const vacantSlots: DpdPimpinanSlotCompliance[] = [];

  for (const slot of pimpinanSlots) {
    // Cari anggota yang cocok dengan jabatan slot ini
    const matched = dpdMembers.find(
      (m) => !usedMemberNiks.has(m.nik) && isJobTitleMatch(m.jabatan, slot.jabatan)
    );

    if (matched) {
      usedMemberNiks.add(matched.nik);
      const item: DpdPimpinanSlotCompliance = {
        no: slot.no,
        subOrg: slot.subOrg,
        jabatan: slot.jabatan,
        isFilled: true,
        member: matched,
      };
      slots.push(item);
      filledSlots.push(item);
    } else {
      const item: DpdPimpinanSlotCompliance = {
        no: slot.no,
        subOrg: slot.subOrg,
        jabatan: slot.jabatan,
        isFilled: false,
      };
      slots.push(item);
      vacantSlots.push(item);
    }
  }

  const filledCount = filledSlots.length;
  const vacantCount = vacantSlots.length;
  const percentage = Math.round((filledCount / totalRequired) * 100);

  const hasKetua = filledSlots.some((s) => s.jabatan.trim().toLowerCase() === 'ketua');
  const hasSekretaris = filledSlots.some((s) => s.jabatan.trim().toLowerCase() === 'sekretaris');
  const hasBendahara = filledSlots.some((s) => s.jabatan.trim().toLowerCase() === 'bendahara');

  const compResult: DpdPimpinanCompliance = {
    dpdName,
    totalRequired,
    filledCount,
    vacantCount,
    percentage,
    isComplete: filledCount >= totalRequired,
    slots,
    vacantSlots,
    filledSlots,
    ksbStatus: {
      ketua: hasKetua,
      sekretaris: hasSekretaris,
      bendahara: hasBendahara,
    },
  };
  compMap.set(normKey, compResult);
  return compResult;
}

