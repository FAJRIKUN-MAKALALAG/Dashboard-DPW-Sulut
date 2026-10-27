import { useMemo } from 'react';
import { Member } from '../../../types';
import { SULUT_REGIONS } from '../../../data/sulutRegions';
import { isDpdMatch, normalizeDpcName } from '../../../utils/structureReadinessUtils';
import {
  SULUT_15_KABKOTA,
  AnalyticsData,
  KabKotaAnalyticsItem,
  DrilldownData,
  SubdistrictDrilldownItem,
  ZoneSummary,
} from '../types';

export function useSulutAnalyticsData(members: Member[], selectedDrilldownDpd: string) {
  // --------------------------------------------------------------------------
  // 1. DATA AGGREGATION ENGINE
  // --------------------------------------------------------------------------
  const analyticsData: AnalyticsData = useMemo(() => {
    const totalMembers = members.length;
    const pengurusCount = members.filter(
      (m) => m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus')
    ).length;
    const anggotaBiasaCount = totalMembers - pengurusCount;
    const activeCount = members.filter((m) => m.status === 'Aktif').length;
    const inactiveCount = totalMembers - activeCount;
    const withKtaCount = members.filter((m) => m.nomorEKTA && m.nomorEKTA.trim() !== '').length;
    const verifiedKtpCount = members.filter((m) => m.statusKtpVerified).length;

    // Gender breakdown
    const maleCount = members.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const femaleCount = members.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const unspecGenderCount = totalMembers - maleCount - femaleCount;

    // 15 Kab/Kota Data Mapping
    const kabKotaMap = new Map<string, {
      key: string;
      name: string;
      label: string;
      zone: string;
      total: number;
      active: number;
      pengurus: number;
      anggota: number;
      withKta: number;
      subdistrictsMap: Map<string, number>;
    }>();

    SULUT_15_KABKOTA.forEach((item) => {
      kabKotaMap.set(item.name, {
        key: item.key,
        name: item.name,
        label: item.label,
        zone: item.zone,
        total: 0,
        active: 0,
        pengurus: 0,
        anggota: 0,
        withKta: 0,
        subdistrictsMap: new Map<string, number>(),
      });
    });

    let unassignedCount = 0;
    const unassignedMembers: Member[] = [];

    members.forEach((m) => {
      let matchedKey: string | null = null;

      for (const item of SULUT_15_KABKOTA) {
        if (isDpdMatch(m.dpd, item.name) || isDpdMatch(m.dpd, item.label)) {
          matchedKey = item.name;
          break;
        }
      }

      if (matchedKey && kabKotaMap.has(matchedKey)) {
        const entry = kabKotaMap.get(matchedKey)!;
        entry.total += 1;
        if (m.status === 'Aktif') entry.active += 1;
        if (m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus')) {
          entry.pengurus += 1;
        } else {
          entry.anggota += 1;
        }
        if (m.nomorEKTA && m.nomorEKTA.trim() !== '') entry.withKta += 1;

        if (m.dpc && m.dpc.trim()) {
          const normDpc = m.dpc.trim();
          const prev = entry.subdistrictsMap.get(normDpc) || 0;
          entry.subdistrictsMap.set(normDpc, prev + 1);
        }
      } else {
        unassignedCount += 1;
        unassignedMembers.push(m);
      }
    });

    // -------------------------------------------------------------------------
    // STATISTIK STRUKTUR TERITORIAL RESMI SULUT (JAWABAN PERTANYAAN KETUA DPW)
    // -------------------------------------------------------------------------
    const totalDpdOfficial = 15;
    const totalDpcOfficial = 171;
    const totalDprtOfficial = 1602;

    // Menghitung jangkauan unik DPC dan DPRt yang telah memiliki kader terdaftar
    const coveredDpcSet = new Set<string>();
    const coveredDprtSet = new Set<string>();

    members.forEach((m) => {
      if (m.dpd && m.dpc && m.dpc.trim() && m.dpc !== '-') {
        coveredDpcSet.add(`${normalizeDpcName(m.dpd)}__${normalizeDpcName(m.dpc)}`);
        if (m.dprt && m.dprt.trim() && m.dprt !== '-') {
          coveredDprtSet.add(`${normalizeDpcName(m.dpd)}__${normalizeDpcName(m.dpc)}__${m.dprt.trim().toLowerCase()}`);
        }
      }
    });

    const coveredDpcCount = coveredDpcSet.size;
    const coveredDprtCount = coveredDprtSet.size;

    // 15 Kab/Kota List in standard display order with official territorial counts
    const kabKotaList: KabKotaAnalyticsItem[] = SULUT_15_KABKOTA.map((item) => {
      const data = kabKotaMap.get(item.name)!;
      const matchedRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, item.name) || isDpdMatch(r.name, item.label));
      const officialDpcCount = matchedRegion?.subdistricts.length || 0;
      const officialDprtCount = matchedRegion?.subdistricts.reduce((sum, sub) => sum + sub.villages.length, 0) || 0;
      return {
        ...data,
        officialDpcCount,
        officialDprtCount,
        percentage: totalMembers > 0 ? (data.total / totalMembers) * 100 : 0,
      };
    });

    const maxChartValue = Math.max(...kabKotaList.map((b) => b.total), 10);
    const topPerformer = [...kabKotaList].sort((a, b) => b.total - a.total)[0];

    // Chart bars list
    const chartBars: KabKotaAnalyticsItem[] = [
      ...(unassignedCount > 0
        ? [
            {
              key: 'unknown',
              name: 'TIDAK DIKETAHUI',
              label: 'Tidak Diketahui',
              zone: 'Lainnya',
              total: unassignedCount,
              active: unassignedMembers.filter((m) => m.status === 'Aktif').length,
              pengurus: 0,
              anggota: unassignedCount,
              withKta: 0,
              officialDpcCount: 0,
              officialDprtCount: 0,
              percentage: totalMembers > 0 ? (unassignedCount / totalMembers) * 100 : 0,
              subdistrictsMap: new Map<string, number>(),
            },
          ]
        : []),
      ...kabKotaList,
    ];

    // Leaderboard sorted descending
    const leaderboard = [...kabKotaList].sort((a, b) => b.total - a.total);

    // 3 Geographic Zones in NasDem Clean Palette
    const zones: ZoneSummary[] = [
      {
        name: 'Daratan Minahasa',
        description: 'Kota Manado, Bitung, Tomohon, Minahasa, Minsel, Mitra, Minut',
        color: '#2563EB',
        regions: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa'),
        total: kabKotaList.filter((k) => k.zone === 'Daratan Minahasa').reduce((s, k) => s + k.total, 0),
        dpcTotal: 88,
        dprtTotal: 816,
      },
      {
        name: 'Bolaang Mongondow Raya (BMR)',
        description: 'Kota Kotamobagu, Bolmong, Bolsel, Boltim, Bolmut',
        color: '#D97706',
        regions: kabKotaList.filter((k) => k.zone === 'BMR'),
        total: kabKotaList.filter((k) => k.zone === 'BMR').reduce((s, k) => s + k.total, 0),
        dpcTotal: 39,
        dprtTotal: 438,
      },
      {
        name: 'Kepulauan Nusa Utara',
        description: 'Kep. Sitaro, Sangihe, Talaud',
        color: '#0284C7',
        regions: kabKotaList.filter((k) => k.zone === 'Kepulauan'),
        total: kabKotaList.filter((k) => k.zone === 'Kepulauan').reduce((s, k) => s + k.total, 0),
        dpcTotal: 44,
        dprtTotal: 348,
      },
    ];

    return {
      totalMembers,
      pengurusCount,
      anggotaBiasaCount,
      activeCount,
      inactiveCount,
      withKtaCount,
      verifiedKtpCount,
      maleCount,
      femaleCount,
      unspecGenderCount,
      totalDpdOfficial,
      totalDpcOfficial,
      totalDprtOfficial,
      coveredDpcCount,
      coveredDprtCount,
      kabKotaList,
      chartBars,
      maxChartValue,
      topPerformer,
      leaderboard,
      zones,
    };
  }, [members]);

  // --------------------------------------------------------------------------
  // 2. SELECTED DPD DRILLDOWN DATA
  // --------------------------------------------------------------------------
  const drilldownData: DrilldownData = useMemo(() => {
    const matchedRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, selectedDrilldownDpd));
    const targetKabKota = analyticsData.kabKotaList.find(
      (k) => isDpdMatch(k.name, selectedDrilldownDpd) || isDpdMatch(k.label, selectedDrilldownDpd)
    );

    const subdistrictCounts: SubdistrictDrilldownItem[] = [];
    const totalDpdCount = targetKabKota?.total || 0;
    const officialDpcCount = matchedRegion?.subdistricts.length || 0;
    const officialDprtCount = matchedRegion?.subdistricts.reduce((sum, s) => sum + s.villages.length, 0) || 0;

    if (matchedRegion && matchedRegion.subdistricts) {
      matchedRegion.subdistricts.forEach((sub) => {
        let count = 0;
        if (targetKabKota) {
          for (const [dpcName, dpcVal] of targetKabKota.subdistrictsMap.entries()) {
            if (normalizeDpcName(dpcName) === normalizeDpcName(sub.name)) {
              count += dpcVal;
            }
          }
        }
        subdistrictCounts.push({
          name: sub.name,
          count,
          percentage: totalDpdCount > 0 ? (count / totalDpdCount) * 100 : 0,
          dprtCount: sub.villages.length,
        });
      });
    }

    subdistrictCounts.sort((a, b) => b.count - a.count);
    const maxSubCount = Math.max(...subdistrictCounts.map((s) => s.count), 5);

    return {
      dpdName: targetKabKota?.label || selectedDrilldownDpd,
      totalCount: totalDpdCount,
      pengurusCount: targetKabKota?.pengurus || 0,
      anggotaCount: targetKabKota?.anggota || 0,
      officialDpcCount,
      officialDprtCount,
      subdistricts: subdistrictCounts,
      maxSubCount,
    };
  }, [selectedDrilldownDpd, analyticsData]);

  // --------------------------------------------------------------------------
  // 3. Y-AXIS TICKS
  // --------------------------------------------------------------------------
  const yTicks = useMemo(() => {
    const max = analyticsData.maxChartValue;
    const step = Math.ceil(max / 5 / 10) * 10 || 10;
    const ticks: number[] = [];
    for (let i = 0; i <= max + step; i += step) {
      ticks.push(i);
      if (ticks.length >= 6) break;
    }
    return ticks;
  }, [analyticsData.maxChartValue]);

  const fmt = (n: number) => n.toLocaleString('id-ID');

  return {
    analyticsData,
    drilldownData,
    yTicks,
    fmt,
  };
}
