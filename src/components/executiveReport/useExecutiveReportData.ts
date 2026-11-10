import { useState, useMemo, useEffect } from 'react';
import { Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import { getCouncilRank, getPimpinanRank } from '../../utils/jobMatchingUtils';
import { getStructureTemplate } from '../../data/structureTemplates';
import { DpdStatRow } from '../../utils/excelUtils';
import { ExportScopeMode } from './executiveReportTypes';

interface UseExecutiveReportDataParams {
  liveMembers: Member[];
  expandedMembers: Member[];
  exportScope: ExportScopeMode;
  useCustomSelectionOnly: boolean;
  customSelectedMembers: Member[] | null;
  filterDpd: string;
  filterDpc: string;
  filterDprt: string;
  filterSubCouncil: 'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR';
  filterKaderType: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  filterStatus: string;
  debouncedSearchQuery: string;
  groupByTerritory: boolean;
}

export function useExecutiveReportData({
  liveMembers,
  expandedMembers,
  exportScope,
  useCustomSelectionOnly,
  customSelectedMembers,
  filterDpd,
  filterDpc,
  filterDprt,
  filterSubCouncil,
  filterKaderType,
  filterStatus,
  debouncedSearchQuery,
  groupByTerritory,
}: UseExecutiveReportDataParams) {
  // Counts per level for the top level selector tabs
  const levelCounts = useMemo(() => {
    const activeExpanded = expandedMembers.filter(
      (m) => filterStatus === 'ALL' || m.status === filterStatus
    );
    const dpwCount = activeExpanded.filter(
      (m) => m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara'
    ).length;
    const dpdCount = activeExpanded.filter((m) => m.tingkatKepengurusan === 'DPD').length;
    const dpcCount = activeExpanded.filter((m) => m.tingkatKepengurusan === 'DPC').length;
    const dprtCount = activeExpanded.filter((m) => m.tingkatKepengurusan === 'DPRt').length;
    const allCount = liveMembers.filter(
      (m) => filterStatus === 'ALL' || m.status === filterStatus
    ).length;

    return { dpwCount, dpdCount, dpcCount, dprtCount, allCount };
  }, [expandedMembers, liveMembers, filterStatus]);

  // Available DPD options with counts for the current exportScope
  const dpdOptionsWithCount = useMemo(() => {
    const source = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;
    return SULUT_REGIONS.map((reg) => {
      const count = source.filter((m) => {
        if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
        if (!isDpdMatch(m.dpd, reg.name)) return false;
        if (exportScope === 'DPD') return m.tingkatKepengurusan === 'DPD';
        if (exportScope === 'DPC') return m.tingkatKepengurusan === 'DPC';
        if (exportScope === 'DPRt') return m.tingkatKepengurusan === 'DPRt';
        return true;
      }).length;
      return { name: reg.name, count };
    });
  }, [exportScope, liveMembers, expandedMembers, filterStatus]);

  // Available DPC options with counts for current filterDpd
  const dpcOptionsWithCount = useMemo(() => {
    const subMap = new Map<string, string>();
    if (filterDpd !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, filterDpd));
      reg?.subdistricts.forEach((s) => subMap.set(s.name.toLowerCase().trim(), s.name));
    }
    const source = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;
    source.forEach((m) => {
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return;
      if (m.dpc && m.dpc !== '-' && m.dpc !== 'ALL' && m.dpc !== 'Umum (DPD)') {
        const clean = m.dpc.replace(/^(kecamatan|kec\.|kec)\s+/gi, '').trim();
        if (!Array.from(subMap.keys()).some((k) => isDpcMatch(k, clean))) {
          subMap.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(subMap.values())
      .map((dpcName) => {
        const count = source.filter((m) => {
          if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
          if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
          if (!isDpcMatch(m.dpc, dpcName)) return false;
          if (exportScope === 'DPC') return m.tingkatKepengurusan === 'DPC';
          if (exportScope === 'DPRt') return m.tingkatKepengurusan === 'DPRt';
          return true;
        }).length;
        return { name: dpcName, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exportScope, filterDpd, liveMembers, expandedMembers, filterStatus]);

  // Available DPRt options with counts for current filterDpd and filterDpc
  const dprtOptionsWithCount = useMemo(() => {
    const vilMap = new Map<string, string>();
    if (filterDpd !== 'ALL' && filterDpc !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, filterDpd));
      const sub = reg?.subdistricts.find((s) => isDpcMatch(s.name, filterDpc));
      sub?.villages.forEach((v) => vilMap.set(v.toLowerCase().trim(), v));
    }
    const source = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;
    source.forEach((m) => {
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return;
      if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return;
      if (m.dprt && m.dprt !== '-' && m.dprt !== 'ALL' && m.dprt !== 'Pusat/Umum') {
        const clean = m.dprt.replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '').trim();
        if (!Array.from(vilMap.keys()).some((k) => isDprtMatch(k, clean))) {
          vilMap.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(vilMap.values())
      .map((dprtName) => {
        const count = source.filter((m) => {
          if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
          if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
          if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return false;
          if (!isDprtMatch(m.dprt, dprtName)) return false;
          if (exportScope === 'DPRt') return m.tingkatKepengurusan === 'DPRt';
          return true;
        }).length;
        return { name: dprtName, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exportScope, filterDpd, filterDpc, liveMembers, expandedMembers, filterStatus]);

  const pengurusQuickPickList = useMemo(() => {
    return liveMembers
      .filter(
        (m) =>
          m.status === 'Aktif' &&
          (m.isPengurus || (m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus'))
      )
      .sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
  }, [liveMembers]);

  // 15 DPD Statistics
  const dpdStats: DpdStatRow[] = useMemo(() => {
    return SULUT_REGIONS.map((region, idx) => {
      const regMembers = liveMembers.filter((m) => isDpdMatch(m.dpd, region.name));
      const total = regMembers.length;
      const aktif = regMembers.filter((m) => m.status === 'Aktif').length;
      const meninggal = regMembers.filter((m) => m.status === 'Non-Aktif (Meninggal)').length;
      const pindahPartai = regMembers.filter(
        (m) => m.status === 'Non-Aktif (Pindah Partai/Mundur)'
      ).length;
      const pindahDomisili = regMembers.filter(
        (m) => m.status === 'Non-Aktif (Pindah Domisili)'
      ).length;
      const persentaseAktif = total > 0 ? Math.round((aktif / total) * 100) : 0;

      let statusKesiapan = 'Stabil';
      if (persentaseAktif >= 80) statusKesiapan = 'Tinggi';
      else if (persentaseAktif < 65) statusKesiapan = 'Konsolidasi';

      return {
        no: idx + 1,
        dpd: region.name,
        zona: region.zone,
        dpcCount: region.subdistricts.length,
        total,
        aktif,
        persentaseAktif,
        meninggal,
        pindahPartai,
        pindahDomisili,
        statusKesiapan,
      };
    });
  }, [liveMembers]);

  const [selectedStatDpds, setSelectedStatDpds] = useState<Set<string>>(
    () => new Set(SULUT_REGIONS.map((r) => r.name))
  );

  const printedDpdStats = useMemo(
    () => dpdStats.filter((r) => selectedStatDpds.has(r.dpd)),
    [dpdStats, selectedStatDpds]
  );

  const grandTotal = useMemo(() => {
    const source = printedDpdStats.length > 0 ? printedDpdStats : dpdStats;
    const totalAll = source.reduce((acc, curr) => acc + curr.total, 0);
    const aktifAll = source.reduce((acc, curr) => acc + curr.aktif, 0);
    const meninggalAll = source.reduce((acc, curr) => acc + curr.meninggal, 0);
    const pindahPartaiAll = source.reduce((acc, curr) => acc + curr.pindahPartai, 0);
    const pindahDomisiliAll = source.reduce((acc, curr) => acc + curr.pindahDomisili, 0);
    const dpcAll = source.reduce((acc, curr) => acc + curr.dpcCount, 0);
    const nonAktifAll = totalAll - aktifAll;
    const avgPersen = totalAll > 0 ? Math.round((aktifAll / totalAll) * 100) : 0;

    return {
      totalAll,
      aktifAll,
      meninggalAll,
      pindahPartaiAll,
      pindahDomisiliAll,
      dpcAll,
      nonAktifAll,
      avgPersen,
    };
  }, [dpdStats, printedDpdStats]);

  // Filter nominative members according to exportScope & territorial filters
  const nominativeMembers = useMemo(() => {
    if (useCustomSelectionOnly && customSelectedMembers && customSelectedMembers.length > 0) {
      return customSelectedMembers.filter((m) => {
        if (!debouncedSearchQuery.trim()) return true;
        const q = debouncedSearchQuery.toLowerCase().trim();
        return (
          (m.namaLengkap && m.namaLengkap.toLowerCase().includes(q)) ||
          (m.nik && m.nik.includes(q)) ||
          (m.jabatan && m.jabatan.toLowerCase().includes(q))
        );
      });
    }

    const baseSource = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;

    let list = baseSource.filter((m) => {
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;

      if (exportScope === 'DPW') {
        if (m.tingkatKepengurusan !== 'DPW' && m.dpd !== 'Sulawesi Utara') return false;
        if (filterSubCouncil !== 'ALL' && getMemberSubOrgCategory(m) !== filterSubCouncil) {
          return false;
        }
      } else if (exportScope === 'DPD') {
        if (m.tingkatKepengurusan !== 'DPD') return false;
        if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
        if (filterSubCouncil !== 'ALL' && getMemberSubOrgCategory(m) !== filterSubCouncil) {
          return false;
        }
      } else if (exportScope === 'DPC') {
        if (m.tingkatKepengurusan !== 'DPC') return false;
        if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
        if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return false;
        if (filterSubCouncil !== 'ALL' && getMemberSubOrgCategory(m) !== filterSubCouncil) {
          return false;
        }
      } else if (exportScope === 'DPRt') {
        if (m.tingkatKepengurusan !== 'DPRt') return false;
        if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
        if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return false;
        if (filterDprt !== 'ALL' && !isDprtMatch(m.dprt, filterDprt)) return false;
      } else if (exportScope === 'ALL_KADER') {
        if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return false;
        if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return false;
        if (filterDprt !== 'ALL' && !isDprtMatch(m.dprt, filterDprt)) return false;
        if (filterKaderType === 'PENGURUS' && !m.isPengurus && !m.nomorSK) return false;
        if (filterKaderType === 'ANGGOTA' && (m.isPengurus || Boolean(m.nomorSK))) return false;
      }

      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const match =
          (m.namaLengkap && m.namaLengkap.toLowerCase().includes(q)) ||
          (m.nik && m.nik.includes(q)) ||
          (m.nomorEKTA && m.nomorEKTA.toLowerCase().includes(q)) ||
          (m.jabatan && m.jabatan.toLowerCase().includes(q)) ||
          (m.dpc && m.dpc.toLowerCase().includes(q)) ||
          (m.dprt && m.dprt.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });

    // Sort by official hierarchy within territory
    const tplSlots =
      exportScope === 'DPW' || exportScope === 'DPD' || exportScope === 'DPC' || exportScope === 'DPRt'
        ? getStructureTemplate(exportScope)
        : undefined;

    list = [...list].sort((a, b) => {
      const dpdComp = (a.dpd || '').localeCompare(b.dpd || '');
      if (dpdComp !== 0 && exportScope !== 'DPW') return dpdComp;

      if (exportScope === 'DPC' || exportScope === 'DPRt' || exportScope === 'ALL_KADER') {
        const dpcComp = (a.dpc || '').localeCompare(b.dpc || '');
        if (dpcComp !== 0) return dpcComp;
      }

      if (exportScope === 'DPRt') {
        const dprtComp = (a.dprt || '').localeCompare(b.dprt || '');
        if (dprtComp !== 0) return dprtComp;
      }

      const catOrder: Record<string, number> = { PERTIMBANGAN: 1, PAKAR: 2, PIMPINAN: 3 };
      const catA = catOrder[getMemberSubOrgCategory(a)] || 3;
      const catB = catOrder[getMemberSubOrgCategory(b)] || 3;
      if (catA !== catB) return catA - catB;

      if (typeof a.urutan === 'number' && typeof b.urutan === 'number' && a.urutan !== b.urutan) {
        return a.urutan - b.urutan;
      }

      if (catA === 1 || catA === 2) {
        const rA = getCouncilRank(a.jabatan);
        const rB = getCouncilRank(b.jabatan);
        if (rA !== rB) return rA - rB;
      } else {
        const rA = getPimpinanRank(a.jabatan, tplSlots);
        const rB = getPimpinanRank(b.jabatan, tplSlots);
        if (rA !== rB) return rA - rB;
      }

      return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
    });

    return list;
  }, [
    useCustomSelectionOnly,
    customSelectedMembers,
    exportScope,
    liveMembers,
    expandedMembers,
    filterStatus,
    filterDpd,
    filterDpc,
    filterDprt,
    filterSubCouncil,
    filterKaderType,
    debouncedSearchQuery,
  ]);

  const getMemberKey = (m: Member, idx: number) =>
    m.id || `${m.nik}-${m.tingkatKepengurusan || ''}-${m.dpc || ''}-${m.dprt || ''}-${idx}`;
  const [uncheckedKeys, setUncheckedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUncheckedKeys(new Set());
  }, [
    exportScope,
    useCustomSelectionOnly,
    filterDpd,
    filterDpc,
    filterDprt,
    filterSubCouncil,
    filterKaderType,
    filterStatus,
  ]);

  const printedNominativeMembers = useMemo(
    () => nominativeMembers.filter((m, idx) => !uncheckedKeys.has(getMemberKey(m, idx))),
    [nominativeMembers, uncheckedKeys]
  );

  // Build Grouped Sections per Territory
  const groupedTerritorySections = useMemo(() => {
    const itemsWithKeys = nominativeMembers.map((m, idx) => ({
      member: m,
      key: getMemberKey(m, idx),
    }));

    if (!groupByTerritory) {
      return [
        {
          groupId: 'ALL_COMBINED',
          groupTitle: 'DAFTAR GABUNGAN',
          groupSubtitle: '',
          items: itemsWithKeys,
        },
      ];
    }

    const groupsMap = new Map<
      string,
      {
        groupId: string;
        groupTitle: string;
        groupSubtitle: string;
        items: { member: Member; key: string }[];
      }
    >();

    itemsWithKeys.forEach((entry) => {
      const m = entry.member;
      let groupId = 'DEFAULT';
      let groupTitle = 'DAFTAR KADER';
      let groupSubtitle = '';

      if (exportScope === 'DPW') {
        const subCat = getMemberSubOrgCategory(m);
        groupId = `DPW_${subCat}`;
        groupTitle =
          subCat === 'PERTIMBANGAN'
            ? 'DEWAN PERTIMBANGAN WILAYAH (DPW)'
            : subCat === 'PAKAR'
            ? 'DEWAN PAKAR WILAYAH (DPW)'
            : 'DEWAN PIMPINAN WILAYAH (DPW SULAWESI UTARA)';
        groupSubtitle = 'Provinsi Sulawesi Utara';
      } else if (exportScope === 'DPD') {
        const dpdName = m.dpd || 'Kabupaten/Kota';
        const subCat = getMemberSubOrgCategory(m);
        const subLabel =
          subCat === 'PERTIMBANGAN'
            ? 'Dewan Pertimbangan Daerah'
            : subCat === 'PAKAR'
            ? 'Dewan Pakar Daerah'
            : 'Dewan Pimpinan Daerah (Pengurus Inti)';
        groupId = `DPD_${dpdName}_${subCat}`;
        groupTitle = `DPD ${dpdName.toUpperCase()} — ${subLabel.toUpperCase()}`;
        groupSubtitle = dpdName;
      } else if (exportScope === 'DPC') {
        const dpdName = m.dpd || '-';
        const dpcName = m.dpc && m.dpc !== '-' ? m.dpc : 'Umum';
        groupId = `DPC_${dpdName}_${dpcName}`;
        groupTitle = `DPC KECAMATAN ${dpcName.toUpperCase()}`;
        groupSubtitle = dpdName;
      } else if (exportScope === 'DPRt') {
        const dpdName = m.dpd || '-';
        const dpcName = m.dpc && m.dpc !== '-' ? m.dpc : '-';
        const dprtName = m.dprt && m.dprt !== '-' ? m.dprt : 'Umum';
        groupId = `DPRT_${dpdName}_${dpcName}_${dprtName}`;
        groupTitle = `DPRt DESA / KELURAHAN ${dprtName.toUpperCase()}`;
        groupSubtitle = `Kecamatan ${dpcName} • ${dpdName}`;
      } else {
        const dpdName = m.dpd || 'Sulawesi Utara';
        const dpcName =
          m.dpc && m.dpc !== '-' && m.dpc !== 'ALL' && m.dpc !== 'Umum (DPD)'
            ? ` — KEC. ${m.dpc.toUpperCase()}`
            : '';
        groupId = `KADER_${dpdName}_${m.dpc || ''}`;
        groupTitle = `${dpdName.toUpperCase()}${dpcName}`;
        groupSubtitle = dpdName;
      }

      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          groupId,
          groupTitle,
          groupSubtitle,
          items: [],
        });
      }
      groupsMap.get(groupId)!.items.push(entry);
    });

    return Array.from(groupsMap.values());
  }, [nominativeMembers, groupByTerritory, exportScope]);

  const toggleMemberCheck = (key: string) => {
    setUncheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroupCheck = (groupItems: { member: Member; key: string }[]) => {
    const allChecked = groupItems.every((item) => !uncheckedKeys.has(item.key));
    setUncheckedKeys((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        groupItems.forEach((item) => next.add(item.key));
      } else {
        groupItems.forEach((item) => next.delete(item.key));
      }
      return next;
    });
  };

  return {
    levelCounts,
    dpdOptionsWithCount,
    dpcOptionsWithCount,
    dprtOptionsWithCount,
    pengurusQuickPickList,
    dpdStats,
    selectedStatDpds,
    setSelectedStatDpds,
    printedDpdStats,
    grandTotal,
    nominativeMembers,
    printedNominativeMembers,
    groupedTerritorySections,
    uncheckedKeys,
    setUncheckedKeys,
    toggleMemberCheck,
    toggleGroupCheck,
  };
}

