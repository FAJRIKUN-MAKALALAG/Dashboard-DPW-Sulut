import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
} from '../utils/structureReadinessUtils';
import { getCouncilRank, getPimpinanRank } from '../utils/jobMatchingUtils';
import { getStructureTemplate } from '../data/structureTemplates';
import {
  getMembersFromApi as getMembersFromSupabase,
  isBackendConfigured as isSupabaseConfigured,
} from '../utils/backendClient';
import { loadMembers, saveMembers } from '../utils/storage';
import { useDebounce } from '../hooks/useDebounce';
import {
  exportMembersToExcel,
  exportMembersToCsv,
  exportDpdStatisticsToExcel,
  exportDpdStatisticsToCsv,
  DpdStatRow,
} from '../utils/excelUtils';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import {
  ExportScopeMode,
  ExecutiveReportPrintModalProps,
} from './executiveReport/executiveReportTypes';
import {
  getComputedDocTitle,
  getComputedDocSubtitle,
  detectSignatoriesForExecutiveReport,
  isRealEkta,
  isRealNik,
} from './executiveReport/executiveReportUtils';
import { ExecutiveReportToolbar } from './executiveReport/ExecutiveReportToolbar';
import { ExecutiveReportScopeTabs } from './executiveReport/ExecutiveReportScopeTabs';
import { ExecutiveReportFilterBar } from './executiveReport/ExecutiveReportFilterBar';
import { ExecutiveReportSignatureSettings } from './executiveReport/ExecutiveReportSignatureSettings';
import { ExecutiveReportStatTable } from './executiveReport/ExecutiveReportStatTable';
import { ExecutiveReportNominativeTable } from './executiveReport/ExecutiveReportNominativeTable';
import { ExecutiveReportSignatureBlock } from './executiveReport/ExecutiveReportSignatureBlock';

export type { ExportScopeMode };

export const ExecutiveReportPrintModal: React.FC<ExecutiveReportPrintModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  initialDpd = 'ALL',
  initialReportType = 'STATISTICS',
  customSelectedMembers = null,
  customTitleContext = '',
}) => {
  // Primary Scope Selector: DPW | DPD | DPC | DPRt | ALL_KADER | STATISTICS
  const [exportScope, setExportScope] = useState<ExportScopeMode>('DPD');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [useCustomSelectionOnly, setUseCustomSelectionOnly] = useState<boolean>(false);

  // Territorial Filters (Per Wilayah)
  const [filterDpd, setFilterDpd] = useState<string>(initialDpd);
  const [filterDpc, setFilterDpc] = useState<string>('ALL');
  const [filterDprt, setFilterDprt] = useState<string>('ALL');
  const [filterSubCouncil, setFilterSubCouncil] = useState<'ALL' | 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR'>('ALL');
  const [filterKaderType, setFilterKaderType] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('Aktif');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Grouping & Page-Break per Territory Options
  const [groupByTerritory, setGroupByTerritory] = useState<boolean>(true);
  const [pageBreakPerGroup, setPageBreakPerGroup] = useState<boolean>(false);

  // Signature Panel Toggle
  const [showSignaturePanel, setShowSignaturePanel] = useState<boolean>(false);

  const todayFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const [docCustomTitle, setDocCustomTitle] = useState<string>('');
  const [docNomorSurat, setDocNomorSurat] = useState<string>(
    `LAP-OKK/DPW-ND/SULUT/${new Date().getFullYear()}`
  );
  const [signCity, setSignCity] = useState<string>('Manado');
  const [signDate, setSignDate] = useState<string>(todayFormatted);
  const [signLayout, setSignLayout] = useState<'2_COL' | '3_COL' | '1_COL'>('2_COL');
  const [showStampBox, setShowStampBox] = useState<boolean>(false);

  // Signatory 1 (Left)
  const [leftPrefix, setLeftPrefix] = useState<string>('Mengetahui,');
  const [leftTitle, setLeftTitle] = useState<string>('SEKRETARIS DPW PARTAI NASDEM SULUT');
  const [leftName, setLeftName] = useState<string>('');
  const [leftId, setLeftId] = useState<string>('');

  // Signatory 2 (Right)
  const [rightTitle, setRightTitle] = useState<string>('KETUA DPW PARTAI NASDEM SULUT');
  const [rightName, setRightName] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  // Signatory 3 (Center)
  const [centerPrefix, setCenterPrefix] = useState<string>('Menyetujui,');
  const [centerTitle, setCenterTitle] = useState<string>('KOORDINATOR WILAYAH');
  const [centerName, setCenterName] = useState<string>('');
  const [centerId, setCenterId] = useState<string>('');

  const [isSignManuallyEdited, setIsSignManuallyEdited] = useState<boolean>(false);

  // Live members state
  const [liveMembers, setLiveMembers] = useState<Member[]>(members);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (members && members.length > 0) {
      setLiveMembers(members);
    }
  }, [members]);

  // Expanded structural members
  const expandedMembers = useMemo(
    () => getExpandedStructuralMembers(liveMembers),
    [liveMembers]
  );

  // Initialize scope & territory when modal opens
  useEffect(() => {
    if (isOpen) {
      if (customSelectedMembers && customSelectedMembers.length > 0) {
        setExportScope('ALL_KADER');
        setUseCustomSelectionOnly(true);
      } else {
        setUseCustomSelectionOnly(false);
        if (initialReportType === 'STATISTICS') {
          if (session?.role === 'ADMIN_DPRT') setExportScope('DPRt');
          else if (session?.role === 'ADMIN_DPC') setExportScope('DPC');
          else if (session?.role === 'ADMIN_DPD') setExportScope('DPD');
          else setExportScope('DPD');
        } else {
          setExportScope('ALL_KADER');
        }

        if (session && session.dpdAccess && session.dpdAccess !== 'ALL') {
          setFilterDpd(session.dpdAccess);
          if (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)') {
            setFilterDpc(session.dpcAccess);
          }
          if (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum') {
            setFilterDprt(session.dprtAccess);
          }
        } else if (initialDpd && initialDpd !== 'ALL') {
          setFilterDpd(initialDpd);
        }
      }
    }
  }, [isOpen, customSelectedMembers, initialReportType, session, initialDpd]);

  const refreshFromDatabase = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        const cloudMembers = await getMembersFromSupabase({ force: true });
        if (cloudMembers && cloudMembers.length > 0) {
          setLiveMembers(cloudMembers);
          saveMembers(cloudMembers);
        } else {
          const local = loadMembers();
          if (local && local.length > 0) setLiveMembers(local);
        }
      } else {
        const local = loadMembers();
        if (local && local.length > 0) setLiveMembers(local);
      }
    } catch {
      const local = loadMembers();
      if (local && local.length > 0) setLiveMembers(local);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (isOpen) {
      refreshFromDatabase();
    }
  }, [isOpen, refreshFromDatabase]);

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

  // Auto-detect signatories based on exportScope & territorial filters
  const autoDetectSignatories = useCallback(
    (forceReset = false) => {
      if (isSignManuallyEdited && !forceReset) return;

      const detected = detectSignatoriesForExecutiveReport(
        exportScope,
        filterDpd,
        filterDpc,
        filterDprt,
        expandedMembers
      );

      setSignCity(detected.city);
      setLeftTitle(detected.leftTitle);
      setRightTitle(detected.rightTitle);

      setRightName(detected.ketua?.namaLengkap || '');
      setRightId(
        detected.ketua
          ? isRealEkta(detected.ketua.nomorEKTA)
            ? `No. e-KTA: ${detected.ketua.nomorEKTA}`
            : isRealNik(detected.ketua.nik)
            ? `NIK: ${detected.ketua.nik}`
            : ''
          : ''
      );

      setLeftName(detected.sekretaris?.namaLengkap || '');
      setLeftId(
        detected.sekretaris
          ? isRealEkta(detected.sekretaris.nomorEKTA)
            ? `No. e-KTA: ${detected.sekretaris.nomorEKTA}`
            : isRealNik(detected.sekretaris.nik)
            ? `NIK: ${detected.sekretaris.nik}`
            : ''
          : ''
      );

      if (forceReset) {
        setIsSignManuallyEdited(false);
      }
    },
    [exportScope, filterDpd, filterDpc, filterDprt, expandedMembers, isSignManuallyEdited]
  );

  useEffect(() => {
    autoDetectSignatories(false);
  }, [autoDetectSignatories]);

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
      // 1. Sort by DPD
      const dpdComp = (a.dpd || '').localeCompare(b.dpd || '');
      if (dpdComp !== 0 && exportScope !== 'DPW') return dpdComp;

      // 2. Sort by DPC if DPC or DPRt scope
      if (exportScope === 'DPC' || exportScope === 'DPRt' || exportScope === 'ALL_KADER') {
        const dpcComp = (a.dpc || '').localeCompare(b.dpc || '');
        if (dpcComp !== 0) return dpcComp;
      }

      // 3. Sort by DPRt if DPRt scope
      if (exportScope === 'DPRt') {
        const dprtComp = (a.dprt || '').localeCompare(b.dprt || '');
        if (dprtComp !== 0) return dprtComp;
      }

      // 4. Sort by Sub-Council (Pertimbangan -> Pakar -> Pimpinan)
      const catOrder: Record<string, number> = { PERTIMBANGAN: 1, PAKAR: 2, PIMPINAN: 3 };
      const catA = catOrder[getMemberSubOrgCategory(a)] || 3;
      const catB = catOrder[getMemberSubOrgCategory(b)] || 3;
      if (catA !== catB) return catA - catB;

      // 5. Sort by Urutan or Position Rank
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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (exportScope === 'STATISTICS') {
      exportDpdStatisticsToExcel(printedDpdStats, 'LAPORAN_STATISTIK_DPW_NASDEM_SULUT.xlsx');
    } else {
      const scopeName =
        exportScope === 'DPW'
          ? 'DPW_SULUT'
          : `${exportScope}_${filterDpd === 'ALL' ? 'SELURUH_SULUT' : filterDpd.replace(/\s+/g, '_')}`;
      exportMembersToExcel(
        printedNominativeMembers,
        `DATA_${scopeName}_${printedNominativeMembers.length}_ORANG.xlsx`
      );
    }
  };

  const handleExportCsv = () => {
    if (exportScope === 'STATISTICS') {
      exportDpdStatisticsToCsv(printedDpdStats, 'LAPORAN_STATISTIK_DPW_NASDEM_SULUT.csv');
    } else {
      const scopeName =
        exportScope === 'DPW'
          ? 'DPW_SULUT'
          : `${exportScope}_${filterDpd === 'ALL' ? 'SELURUH_SULUT' : filterDpd.replace(/\s+/g, '_')}`;
      exportMembersToCsv(
        printedNominativeMembers,
        `DATA_${scopeName}_${printedNominativeMembers.length}_ORANG.csv`
      );
    }
  };

  const computedDocTitle = getComputedDocTitle(
    docCustomTitle,
    exportScope,
    filterDpd,
    filterDpc,
    filterDprt
  );

  const computedDocSubtitle = getComputedDocSubtitle(
    exportScope,
    filterDpd,
    filterDpc,
    filterDprt,
    printedNominativeMembers.length
  );

  const modalContent = (
    <div className="print-portal-root fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col print:static print:block print:bg-white print:h-auto print:overflow-visible">
      <style>
        {`
          @media print {
            @page {
              size: A4 ${orientation};
              margin: 10mm 12mm;
            }
          }
        `}
      </style>

      {/* 1. TOP BAR WITH CONTROLS */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Actions */}
          <ExecutiveReportToolbar
            onRefresh={refreshFromDatabase}
            isRefreshing={isRefreshing}
            showSignaturePanel={showSignaturePanel}
            setShowSignaturePanel={setShowSignaturePanel}
            orientation={orientation}
            setOrientation={setOrientation}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onPrint={handlePrint}
            onClose={onClose}
            printDataCountText={
              exportScope === 'STATISTICS'
                ? `${printedDpdStats.length} DPD`
                : `${printedNominativeMembers.length} Data`
            }
          />

          {/* Row 2: Scope Tabs */}
          <ExecutiveReportScopeTabs
            exportScope={exportScope}
            onSelectScope={(scope) => {
              setUseCustomSelectionOnly(false);
              setExportScope(scope);
              if (scope === 'DPW') {
                setFilterDpd('ALL');
                setFilterDpc('ALL');
                setFilterDprt('ALL');
              } else if (scope === 'DPD') {
                setFilterDpc('ALL');
                setFilterDprt('ALL');
              } else if (scope === 'DPC') {
                setFilterDprt('ALL');
              }
            }}
            levelCounts={levelCounts}
            useCustomSelectionOnly={useCustomSelectionOnly}
            onToggleCustomSelectionOnly={() => {
              setExportScope('ALL_KADER');
              setUseCustomSelectionOnly((prev) => !prev);
            }}
            customSelectedMembers={customSelectedMembers}
          />

          {/* Row 3: Cascading Territory Filter Bar */}
          <ExecutiveReportFilterBar
            exportScope={exportScope}
            useCustomSelectionOnly={useCustomSelectionOnly}
            filterDpd={filterDpd}
            setFilterDpd={setFilterDpd}
            setFilterDpc={setFilterDpc}
            setFilterDprt={setFilterDprt}
            dpdOptionsWithCount={dpdOptionsWithCount}
            filterDpc={filterDpc}
            dpcOptionsWithCount={dpcOptionsWithCount}
            filterDprt={filterDprt}
            dprtOptionsWithCount={dprtOptionsWithCount}
            filterSubCouncil={filterSubCouncil}
            setFilterSubCouncil={setFilterSubCouncil}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            groupByTerritory={groupByTerritory}
            setGroupByTerritory={setGroupByTerritory}
            pageBreakPerGroup={pageBreakPerGroup}
            setPageBreakPerGroup={setPageBreakPerGroup}
            hasMultipleSections={groupedTerritorySections.length > 1}
          />

          {/* Signature Settings Panel */}
          <ExecutiveReportSignatureSettings
            showSignaturePanel={showSignaturePanel}
            showStampBox={showStampBox}
            setShowStampBox={setShowStampBox}
            onAutoDetectSignatories={autoDetectSignatories}
            docCustomTitle={docCustomTitle}
            setDocCustomTitle={setDocCustomTitle}
            computedDocTitle={computedDocTitle}
            signCity={signCity}
            setSignCity={setSignCity}
            signDate={signDate}
            setSignDate={setSignDate}
            signLayout={signLayout}
            setSignLayout={setSignLayout}
            setIsSignManuallyEdited={setIsSignManuallyEdited}
            pengurusQuickPickList={pengurusQuickPickList}
            leftTitle={leftTitle}
            setLeftTitle={setLeftTitle}
            leftName={leftName}
            setLeftName={setLeftName}
            leftId={leftId}
            setLeftId={setLeftId}
            rightTitle={rightTitle}
            setRightTitle={setRightTitle}
            rightName={rightName}
            setRightName={setRightName}
            rightId={rightId}
            setRightId={setRightId}
            centerTitle={centerTitle}
            setCenterTitle={setCenterTitle}
            centerName={centerName}
            setCenterName={setCenterName}
            centerId={centerId}
            setCenterId={setCenterId}
          />
        </div>
      </div>

      {/* 2. SCROLLABLE PRINTABLE DOCUMENT */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-5xl mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl p-5 sm:p-10 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none">
          {/* Formal Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 text-center sm:text-left print:text-left">
            <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5">
              <img
                src={nasdemLogo}
                alt="Logo Partai NasDem"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase">
                  {exportScope === 'DPD' && filterDpd !== 'ALL'
                    ? 'DEWAN PIMPINAN DAERAH'
                    : exportScope === 'DPC' && filterDpc !== 'ALL'
                    ? 'DEWAN PIMPINAN CABANG'
                    : exportScope === 'DPRt' && filterDprt !== 'ALL'
                    ? 'DEWAN PIMPINAN RANTING'
                    : 'DEWAN PIMPINAN WILAYAH'}
                </p>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                  PARTAI NASDEM{' '}
                  {exportScope === 'DPD' && filterDpd !== 'ALL'
                    ? filterDpd.toUpperCase()
                    : exportScope === 'DPC' && filterDpc !== 'ALL'
                    ? `KECAMATAN ${filterDpc.toUpperCase()}`
                    : exportScope === 'DPRt' && filterDprt !== 'ALL'
                    ? `DESA/KEL. ${filterDprt.toUpperCase()}`
                    : 'SULAWESI UTARA'}
                </h1>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  {filterDpd !== 'ALL'
                    ? `${filterDpd}${filterDpc !== 'ALL' ? ` • Kecamatan ${filterDpc}` : ''}${
                        filterDprt !== 'ALL' ? ` • Desa/Kel. ${filterDprt}` : ''
                      } — Provinsi Sulawesi Utara`
                    : 'Sekretariat DPW Partai NasDem Provinsi Sulawesi Utara — Kota Manado'}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right print:text-right font-mono text-[10px] text-slate-600 shrink-0">
              <div className="font-bold text-slate-900 uppercase">DOKUMEN RESMI ORGANISASI</div>
              <div>No: {docNomorSurat}</div>
              <div>Tanggal: {signDate}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-5">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 underline underline-offset-4">
              {computedDocTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-1">{computedDocSubtitle}</p>
          </div>

          {/* Table Content */}
          {exportScope === 'STATISTICS' ? (
            <ExecutiveReportStatTable
              dpdStats={dpdStats}
              selectedStatDpds={selectedStatDpds}
              setSelectedStatDpds={setSelectedStatDpds}
              printedDpdStats={printedDpdStats}
              grandTotal={grandTotal}
            />
          ) : (
            <ExecutiveReportNominativeTable
              exportScope={exportScope}
              nominativeMembers={nominativeMembers}
              printedNominativeMembers={printedNominativeMembers}
              groupedTerritorySections={groupedTerritorySections}
              uncheckedKeys={uncheckedKeys}
              onSelectAll={() => setUncheckedKeys(new Set())}
              onToggleMemberCheck={toggleMemberCheck}
              onToggleGroupCheck={toggleGroupCheck}
              groupByTerritory={groupByTerritory}
              pageBreakPerGroup={pageBreakPerGroup}
            />
          )}

          {/* Signatures Block */}
          <ExecutiveReportSignatureBlock
            signLayout={signLayout}
            leftPrefix={leftPrefix}
            setLeftPrefix={setLeftPrefix}
            leftTitle={leftTitle}
            setLeftTitle={setLeftTitle}
            leftName={leftName}
            setLeftName={setLeftName}
            leftId={leftId}
            setLeftId={setLeftId}
            showStampBox={showStampBox}
            signCity={signCity}
            setSignCity={setSignCity}
            signDate={signDate}
            setSignDate={setSignDate}
            rightTitle={rightTitle}
            setRightTitle={setRightTitle}
            rightName={rightName}
            setRightName={setRightName}
            rightId={rightId}
            setRightId={setRightId}
            centerPrefix={centerPrefix}
            setCenterPrefix={setCenterPrefix}
            centerTitle={centerTitle}
            setCenterTitle={setCenterTitle}
            centerName={centerName}
            setCenterName={setCenterName}
            centerId={centerId}
            setCenterId={setCenterId}
            setIsSignManuallyEdited={setIsSignManuallyEdited}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExecutiveReportPrintModal;
