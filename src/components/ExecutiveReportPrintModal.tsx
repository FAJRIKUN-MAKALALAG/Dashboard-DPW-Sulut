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
  Printer,
  X,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  Search,
  RotateCcw,
  PenTool,
  Layers,
} from 'lucide-react';

export type ExportScopeMode =
  | 'DPW'
  | 'DPD'
  | 'DPC'
  | 'DPRt'
  | 'ALL_KADER'
  | 'STATISTICS';

interface ExecutiveReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  session?: UserSession;
  initialDpd?: string;
  initialReportType?: 'STATISTICS' | 'NOMINATIVE';
  customSelectedMembers?: Member[] | null;
  customTitleContext?: string;
}

const isRealNik = (nik?: string) => {
  if (!nik) return false;
  const clean = nik.trim();
  if (!clean || clean === '-') return false;
  if (/^7100\d{12}$/.test(clean)) return false;
  return true;
};

const isRealEkta = (ekta?: string) => {
  if (!ekta) return false;
  const clean = ekta.trim();
  if (!clean || clean === '-') return false;
  if (/^ND-(GEN|IMP|NEW|DPC|DPRT|DPW|DPD)/i.test(clean)) return false;
  return true;
};

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

  // Expanded structural members (resolves multi-position assignments across DPW/DPD/DPC/DPRt)
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
  }, []);

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
  }, [exportScope, expandedMembers, liveMembers, filterStatus]);

  // Available DPC (Kecamatan) options with counts based on selected DPD and exportScope
  const dpcOptionsWithCount = useMemo(() => {
    const source = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;
    const subMap = new Map<string, string>();

    if (filterDpd !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, filterDpd));
      reg?.subdistricts.forEach((s) => subMap.set(s.name.toLowerCase().trim(), s.name));
    }

    source.forEach((m) => {
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return;
      if (m.dpc && m.dpc !== '-' && m.dpc !== 'ALL' && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD') {
        const clean = m.dpc.replace(/^(kecamatan|kec\.|kec)\s+/gi, '').trim();
        const key = clean.toLowerCase();
        if (!Array.from(subMap.keys()).some((k) => isDpcMatch(k, clean))) {
          subMap.set(key, clean);
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
  }, [exportScope, filterDpd, expandedMembers, liveMembers, filterStatus]);

  // Available DPRt (Desa/Kelurahan) options with counts based on selected DPD & DPC
  const dprtOptionsWithCount = useMemo(() => {
    const source = exportScope === 'ALL_KADER' ? liveMembers : expandedMembers;
    const vilMap = new Map<string, string>();

    if (filterDpd !== 'ALL' && filterDpc !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, filterDpd));
      const sub = reg?.subdistricts.find((s) => isDpcMatch(s.name, filterDpc));
      sub?.villages.forEach((v) => vilMap.set(v.toLowerCase().trim(), v));
    }

    source.forEach((m) => {
      if (filterDpd !== 'ALL' && !isDpdMatch(m.dpd, filterDpd)) return;
      if (filterDpc !== 'ALL' && !isDpcMatch(m.dpc, filterDpc)) return;
      if (
        m.dprt &&
        m.dprt !== '-' &&
        m.dprt !== 'ALL' &&
        m.dprt !== 'Pusat/Umum' &&
        m.dprt !== 'Wilayah DPC'
      ) {
        const clean = m.dprt.replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '').trim();
        const key = clean.toLowerCase();
        if (!Array.from(vilMap.keys()).some((k) => isDprtMatch(k, clean))) {
          vilMap.set(key, clean);
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
  }, [exportScope, filterDpd, filterDpc, expandedMembers, liveMembers, filterStatus]);

  // Auto-detect Ketua & Sekretaris based on selected scope & territory
  const autoDetectSignatories = useCallback(
    (forceReset = false) => {
      if (isSignManuallyEdited && !forceReset) return;

      let targetLevel: 'DPW' | 'DPD' | 'DPC' | 'DPRt' = 'DPW';
      if (exportScope === 'DPW') targetLevel = 'DPW';
      else if (exportScope === 'DPD') targetLevel = filterDpd !== 'ALL' ? 'DPD' : 'DPW';
      else if (exportScope === 'DPC') {
        targetLevel = filterDpc !== 'ALL' ? 'DPC' : filterDpd !== 'ALL' ? 'DPD' : 'DPW';
      } else if (exportScope === 'DPRt') {
        targetLevel =
          filterDprt !== 'ALL'
            ? 'DPRt'
            : filterDpc !== 'ALL'
            ? 'DPC'
            : filterDpd !== 'ALL'
            ? 'DPD'
            : 'DPW';
      } else {
        if (filterDprt !== 'ALL') targetLevel = 'DPRt';
        else if (filterDpc !== 'ALL') targetLevel = 'DPC';
        else if (filterDpd !== 'ALL') targetLevel = 'DPD';
        else targetLevel = 'DPW';
      }

      let detectedCity = 'Manado';
      if (targetLevel !== 'DPW' && filterDpd !== 'ALL') {
        const normDpd = filterDpd.toUpperCase();
        if (normDpd.includes('MINAHASA SELATAN')) detectedCity = 'Amurang';
        else if (normDpd.includes('MINAHASA UTARA')) detectedCity = 'Airmadidi';
        else if (normDpd.includes('MINAHASA TENGGARA')) detectedCity = 'Ratahan';
        else if (normDpd.includes('MINAHASA')) detectedCity = 'Tondano';
        else if (normDpd.includes('BOLAANG MONGONDOW SELATAN')) detectedCity = 'Molibagu';
        else if (normDpd.includes('BOLAANG MONGONDOW TIMUR')) detectedCity = 'Tutuyan';
        else if (normDpd.includes('BOLAANG MONGONDOW UTARA')) detectedCity = 'Boroko';
        else if (normDpd.includes('BOLAANG MONGONDOW')) detectedCity = 'Lolak';
        else if (normDpd.includes('SANGIHE')) detectedCity = 'Tahuna';
        else if (normDpd.includes('TALAUD')) detectedCity = 'Melonguane';
        else if (normDpd.includes('SITARO')) detectedCity = 'Ondong Siau';
        else detectedCity = filterDpd.replace(/^(DPD\s+)?(Kota|Kab\.|Kabupaten)\s+/i, '').trim();
      }
      setSignCity(detectedCity);

      if (targetLevel === 'DPRt' && filterDprt !== 'ALL') {
        setLeftTitle(`SEKRETARIS DPRt ${filterDprt.toUpperCase()}`);
        setRightTitle(`KETUA DPRt ${filterDprt.toUpperCase()}`);
      } else if (targetLevel === 'DPC' && filterDpc !== 'ALL') {
        setLeftTitle(`SEKRETARIS DPC KEC. ${filterDpc.toUpperCase()}`);
        setRightTitle(`KETUA DPC KEC. ${filterDpc.toUpperCase()}`);
      } else if (targetLevel === 'DPD' && filterDpd !== 'ALL') {
        setLeftTitle(`SEKRETARIS DPD ${filterDpd.toUpperCase()}`);
        setRightTitle(`KETUA DPD ${filterDpd.toUpperCase()}`);
      } else {
        setLeftTitle('SEKRETARIS DPW PARTAI NASDEM SULUT');
        setRightTitle('KETUA DPW PARTAI NASDEM SULUT');
      }

      const candidates = expandedMembers.filter((m) => {
        if (m.status !== 'Aktif') return false;
        if (targetLevel === 'DPW') return m.tingkatKepengurusan === 'DPW';
        if (targetLevel === 'DPD') {
          return (
            m.tingkatKepengurusan === 'DPD' && (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd))
          );
        }
        if (targetLevel === 'DPC') {
          return (
            m.tingkatKepengurusan === 'DPC' &&
            (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd)) &&
            (filterDpc === 'ALL' || isDpcMatch(m.dpc, filterDpc))
          );
        }
        if (targetLevel === 'DPRt') {
          return (
            m.tingkatKepengurusan === 'DPRt' &&
            (filterDpd === 'ALL' || isDpdMatch(m.dpd, filterDpd)) &&
            (filterDpc === 'ALL' || isDpcMatch(m.dpc, filterDpc)) &&
            (filterDprt === 'ALL' || isDprtMatch(m.dprt, filterDprt))
          );
        }
        return false;
      });

      const foundKetua = candidates.find((m) => {
        const j = (m.jabatan || '').toUpperCase().trim();
        const subCat = getMemberSubOrgCategory(m);
        return (
          subCat === 'PIMPINAN' &&
          (j === 'KETUA' ||
            j === 'KETUA DPW' ||
            j === 'KETUA DPD' ||
            j === 'KETUA DPC' ||
            j === 'KETUA DPRT' ||
            (j.startsWith('KETUA') && !j.includes('WAKIL') && !j.includes('BIDANG') && !j.includes('BIRO')))
        );
      });

      const foundSekretaris = candidates.find((m) => {
        const j = (m.jabatan || '').toUpperCase().trim();
        const subCat = getMemberSubOrgCategory(m);
        return (
          subCat === 'PIMPINAN' &&
          (j === 'SEKRETARIS' ||
            j === 'SEKERTARIS' ||
            j === 'SEKRETARIS DPW' ||
            j === 'SEKRETARIS DPD' ||
            j === 'SEKRETARIS DPC' ||
            j === 'SEKRETARIS DPRT' ||
            ((j.startsWith('SEKRETARIS') || j.startsWith('SEKERTARIS')) && !j.includes('WAKIL')))
        );
      });

      setRightName(foundKetua?.namaLengkap || '');
      setRightId(
        foundKetua
          ? isRealEkta(foundKetua.nomorEKTA)
            ? `No. e-KTA: ${foundKetua.nomorEKTA}`
            : isRealNik(foundKetua.nik)
            ? `NIK: ${foundKetua.nik}`
            : ''
          : ''
      );

      setLeftName(foundSekretaris?.namaLengkap || '');
      setLeftId(
        foundSekretaris
          ? isRealEkta(foundSekretaris.nomorEKTA)
            ? `No. e-KTA: ${foundSekretaris.nomorEKTA}`
            : isRealNik(foundSekretaris.nik)
            ? `NIK: ${foundSekretaris.nik}`
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

  // Build Grouped Sections per Territory (Per Wilayah / Per Dewan)
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
        // ALL_KADER grouped by DPD & DPC
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

  const computedDocTitle =
    docCustomTitle.trim() ||
    (exportScope === 'STATISTICS'
      ? 'LAPORAN REKAPITULASI DATA KADER & KEPENGURUSAN 15 DPD'
      : exportScope === 'DPW'
      ? 'SUSUNAN PENGURUS DEWAN PIMPINAN WILAYAH (DPW) PARTAI NASDEM'
      : exportScope === 'DPD'
      ? `SUSUNAN PENGURUS DEWAN PIMPINAN DAERAH (DPD) ${
          filterDpd === 'ALL' ? 'SE-SULAWESI UTARA' : filterDpd.toUpperCase()
        }`
      : exportScope === 'DPC'
      ? `SUSUNAN PENGURUS DEWAN PIMPINAN CABANG (DPC) ${
          filterDpc !== 'ALL'
            ? `KECAMATAN ${filterDpc.toUpperCase()}`
            : filterDpd !== 'ALL'
            ? filterDpd.toUpperCase()
            : 'SE-SULAWESI UTARA'
        }`
      : exportScope === 'DPRt'
      ? `SUSUNAN PENGURUS DEWAN PIMPINAN RANTING (DPRt) ${
          filterDprt !== 'ALL'
            ? `DESA/KEL. ${filterDprt.toUpperCase()}`
            : filterDpc !== 'ALL'
            ? `KECAMATAN ${filterDpc.toUpperCase()}`
            : filterDpd !== 'ALL'
            ? filterDpd.toUpperCase()
            : 'SE-SULAWESI UTARA'
        }`
      : useCustomSelectionOnly && customTitleContext
      ? `DAFTAR NOMINATIF KADER & PENGURUS (${customTitleContext.toUpperCase()})`
      : 'DAFTAR NOMINATIF KADER & ANGGOTA PARTAI NASDEM');

  const computedDocSubtitle =
    exportScope === 'STATISTICS'
      ? `Rekapitulasi Wilayah (${printedDpdStats.length} DPD Kab/Kota se-Sulawesi Utara)`
      : exportScope === 'DPW'
      ? `Provinsi Sulawesi Utara • Total Tercetak: ${printedNominativeMembers.length} Pengurus`
      : `Wilayah: ${filterDpd === 'ALL' ? 'Seluruh Sulawesi Utara (15 DPD)' : filterDpd}${
          filterDpc !== 'ALL' ? ` • Kec. ${filterDpc}` : ''
        }${filterDprt !== 'ALL' ? ` • Desa/Kel. ${filterDprt}` : ''} • Total Tercetak: ${
          printedNominativeMembers.length
        } Orang`;

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

      {/* =====================================================================
          1. CLEAN TOP CONTROL BAR WITH JENJANG (DPW/DPD/DPC/DPRt) & WILAYAH SELECTOR
          ===================================================================== */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Title + Main Export Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-900">
                Export &amp; Cetak PDF Data Wilayah
              </span>
              <button
                type="button"
                onClick={refreshFromDatabase}
                disabled={isRefreshing}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                title="Sinkronkan ulang dari database"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sinkron</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSignaturePanel((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${
                  showSignaturePanel
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Atur Tanda Tangan</span>
              </button>

              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tegak
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mendatar
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Unduh Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Unduh CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  Cetak / Simpan PDF (
                  {exportScope === 'STATISTICS'
                    ? `${printedDpdStats.length} DPD`
                    : `${printedNominativeMembers.length} Data`}
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: PILIH JENJANG DATA (DPW, DPD, DPC, DPRt, Semua Kader, Statistik) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              {(
                [
                  { id: 'DPW', label: `1. Data DPW (${levelCounts.dpwCount})` },
                  { id: 'DPD', label: `2. Data DPD (${levelCounts.dpdCount})` },
                  { id: 'DPC', label: `3. Data DPC (${levelCounts.dpcCount})` },
                  { id: 'DPRt', label: `4. Data DPRt (${levelCounts.dprtCount})` },
                  { id: 'ALL_KADER', label: `5. Semua Kader (${levelCounts.allCount})` },
                  { id: 'STATISTICS', label: '6. Rekap 15 DPD' },
                ] as { id: ExportScopeMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setUseCustomSelectionOnly(false);
                    setExportScope(tab.id);
                    if (tab.id === 'DPW') {
                      setFilterDpd('ALL');
                      setFilterDpc('ALL');
                      setFilterDprt('ALL');
                    } else if (tab.id === 'DPD') {
                      setFilterDpc('ALL');
                      setFilterDprt('ALL');
                    } else if (tab.id === 'DPC') {
                      setFilterDprt('ALL');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    exportScope === tab.id && !useCustomSelectionOnly
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {customSelectedMembers && customSelectedMembers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setExportScope('ALL_KADER');
                  setUseCustomSelectionOnly((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                  useCustomSelectionOnly
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {useCustomSelectionOnly
                  ? `Pilihan Tabel Aktif (${customSelectedMembers.length} Orang)`
                  : `Gunakan ${customSelectedMembers.length} Pilihan Tabel`}
              </button>
            )}
          </div>

          {/* Row 3: PILIH PER WILAYAH (CASCADING TERRITORY BAR) */}
          {exportScope !== 'STATISTICS' && !useCustomSelectionOnly && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end text-xs">
              {/* Wilayah DPD Selector (Shown for DPD, DPC, DPRt, ALL_KADER) */}
              {exportScope === 'DPW' ? (
                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Wilayah Tingkat Provinsi
                  </label>
                  <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800">
                    DPW Provinsi Sulawesi Utara
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Pilih Wilayah DPD (Kab/Kota)
                  </label>
                  <select
                    value={filterDpd}
                    onChange={(e) => {
                      setFilterDpd(e.target.value);
                      setFilterDpc('ALL');
                      setFilterDprt('ALL');
                    }}
                    className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
                  >
                    <option value="ALL">Semua 15 Kabupaten/Kota (Per Wilayah)</option>
                    {dpdOptionsWithCount.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} ({r.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Wilayah DPC Selector (Shown for DPC, DPRt, ALL_KADER) */}
              {(exportScope === 'DPC' || exportScope === 'DPRt' || exportScope === 'ALL_KADER') && (
                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Pilih Wilayah DPC (Kecamatan)
                  </label>
                  <select
                    value={filterDpc}
                    onChange={(e) => {
                      setFilterDpc(e.target.value);
                      setFilterDprt('ALL');
                    }}
                    className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
                  >
                    <option value="ALL">
                      Semua Kecamatan ({dpcOptionsWithCount.length} DPC)
                    </option>
                    {dpcOptionsWithCount.map((dpcItem) => (
                      <option key={dpcItem.name} value={dpcItem.name}>
                        Kec. {dpcItem.name} ({dpcItem.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Wilayah DPRt Selector (Shown for DPRt, ALL_KADER) */}
              {(exportScope === 'DPRt' || exportScope === 'ALL_KADER') && (
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Pilih Wilayah DPRt (Desa/Kel)
                  </label>
                  <select
                    value={filterDprt}
                    onChange={(e) => setFilterDprt(e.target.value)}
                    className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
                  >
                    <option value="ALL">
                      Semua Desa/Kel ({dprtOptionsWithCount.length})
                    </option>
                    {dprtOptionsWithCount.map((dprtItem) => (
                      <option key={dprtItem.name} value={dprtItem.name}>
                        {dprtItem.name} ({dprtItem.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-Council Filter (Shown for DPW, DPD, DPC) */}
              {(exportScope === 'DPW' || exportScope === 'DPD' || exportScope === 'DPC') && (
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Bagian Dewan
                  </label>
                  <select
                    value={filterSubCouncil}
                    onChange={(e) => setFilterSubCouncil(e.target.value as any)}
                    className="w-full bg-white text-slate-900 text-xs rounded-lg px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
                  >
                    <option value="ALL">Semua Dewan</option>
                    <option value="PIMPINAN">Pengurus Inti ({exportScope})</option>
                    <option value="PERTIMBANGAN">Dewan Pertimbangan</option>
                    <option value="PAKAR">Dewan Pakar</option>
                  </select>
                </div>
              )}

              {/* Search Input */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                  Cari Nama / Jabatan
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama..."
                    className="w-full bg-white text-slate-900 text-xs rounded-lg pl-8 pr-2 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              {/* Grouping & Page Break Options */}
              <div className="lg:col-span-2 flex flex-col gap-1 justify-center pb-0.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={groupByTerritory}
                    onChange={(e) => setGroupByTerritory(e.target.checked)}
                    className="rounded border-slate-300 accent-slate-900"
                  />
                  <span>Kelompokkan per Wilayah</span>
                </label>
                {groupByTerritory && groupedTerritorySections.length > 1 && (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={pageBreakPerGroup}
                      onChange={(e) => setPageBreakPerGroup(e.target.checked)}
                      className="rounded border-slate-300 accent-slate-900"
                    />
                    <span>Pisah Halaman per Wilayah</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* COLLAPSIBLE MANUAL SIGNATURE SETTINGS PANEL */}
          {showSignaturePanel && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  Pengaturan Manual Tanda Tangan &amp; Kop Dokumen
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={showStampBox}
                      onChange={(e) => setShowStampBox(e.target.checked)}
                      className="rounded border-slate-300 accent-slate-900"
                    />
                    <span>Lingkaran Stempel</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => autoDetectSignatories(true)}
                    className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Deteksi Otomatis Wilayah</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-0.5">Judul Dokumen</label>
                  <input
                    type="text"
                    value={docCustomTitle}
                    onChange={(e) => setDocCustomTitle(e.target.value)}
                    placeholder={computedDocTitle}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Kota</label>
                  <input
                    type="text"
                    value={signCity}
                    onChange={(e) => {
                      setSignCity(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Tanggal</label>
                  <input
                    type="text"
                    value={signDate}
                    onChange={(e) => {
                      setSignDate(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Jumlah Pejabat</label>
                  <select
                    value={signLayout}
                    onChange={(e) => setSignLayout(e.target.value as '2_COL' | '3_COL' | '1_COL')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                  >
                    <option value="2_COL">2 Pejabat (Kiri &amp; Kanan)</option>
                    <option value="3_COL">3 Pejabat (+ Tengah)</option>
                    <option value="1_COL">1 Pejabat (Kanan Saja)</option>
                  </select>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  signLayout === '3_COL'
                    ? 'lg:grid-cols-3'
                    : signLayout === '2_COL'
                    ? 'lg:grid-cols-2'
                    : 'lg:grid-cols-1'
                } gap-2.5`}
              >
                {signLayout !== '1_COL' && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Pejabat Kiri (Sekretaris)
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          const found = pengurusQuickPickList.find((p) => p.nik === e.target.value);
                          if (found) {
                            setLeftName(found.namaLengkap);
                            setLeftId(
                              isRealEkta(found.nomorEKTA)
                                ? `No. e-KTA: ${found.nomorEKTA}`
                                : isRealNik(found.nik)
                                ? `NIK: ${found.nik}`
                                : ''
                            );
                            if (found.jabatan) {
                              setLeftTitle(
                                `${found.jabatan.toUpperCase()} ${found.tingkatKepengurusan || ''}`.trim()
                              );
                            }
                            setIsSignManuallyEdited(true);
                          }
                        }}
                        className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
                      >
                        <option value="">Pilih dari Pengurus...</option>
                        {pengurusQuickPickList.map((p, i) => (
                          <option key={`l-${p.nik}-${i}`} value={p.nik}>
                            {p.namaLengkap} ({p.jabatan})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        value={leftTitle}
                        onChange={(e) => {
                          setLeftTitle(e.target.value);
                          setIsSignManuallyEdited(true);
                        }}
                        placeholder="Jabatan Kiri"
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={leftName}
                        onChange={(e) => {
                          setLeftName(e.target.value);
                          setIsSignManuallyEdited(true);
                        }}
                        placeholder="Ketik Nama Pejabat Kiri..."
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        value={leftId}
                        onChange={(e) => {
                          setLeftId(e.target.value);
                          setIsSignManuallyEdited(true);
                        }}
                        placeholder="No. e-KTA / NIK"
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Pejabat Kanan (Ketua)
                    </span>
                    <select
                      value=""
                      onChange={(e) => {
                        const found = pengurusQuickPickList.find((p) => p.nik === e.target.value);
                        if (found) {
                          setRightName(found.namaLengkap);
                          setRightId(
                            isRealEkta(found.nomorEKTA)
                              ? `No. e-KTA: ${found.nomorEKTA}`
                              : isRealNik(found.nik)
                              ? `NIK: ${found.nik}`
                              : ''
                          );
                          if (found.jabatan) {
                            setRightTitle(
                              `${found.jabatan.toUpperCase()} ${found.tingkatKepengurusan || ''}`.trim()
                            );
                          }
                          setIsSignManuallyEdited(true);
                        }
                      }}
                      className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
                    >
                      <option value="">Pilih dari Pengurus...</option>
                      {pengurusQuickPickList.map((p, i) => (
                        <option key={`r-${p.nik}-${i}`} value={p.nik}>
                          {p.namaLengkap} ({p.jabatan})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={rightTitle}
                      onChange={(e) => {
                        setRightTitle(e.target.value);
                        setIsSignManuallyEdited(true);
                      }}
                      placeholder="Jabatan Kanan"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={rightName}
                      onChange={(e) => {
                        setRightName(e.target.value);
                        setIsSignManuallyEdited(true);
                      }}
                      placeholder="Ketik Nama Pejabat Kanan..."
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={rightId}
                      onChange={(e) => {
                        setRightId(e.target.value);
                        setIsSignManuallyEdited(true);
                      }}
                      placeholder="No. e-KTA / NIK"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                {signLayout === '3_COL' && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Pejabat Tengah (Mengetahui)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        value={centerTitle}
                        onChange={(e) => setCenterTitle(e.target.value)}
                        placeholder="Jabatan Tengah"
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={centerName}
                        onChange={(e) => setCenterName(e.target.value)}
                        placeholder="Ketik Nama Pejabat Tengah..."
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                      />
                      <input
                        type="text"
                        value={centerId}
                        onChange={(e) => setCenterId(e.target.value)}
                        placeholder="No. e-KTA / NIK"
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. SCROLLABLE VIEWPORT FOR THE CLEAN A4 PAPER SHEET
          ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-5xl mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl p-5 sm:p-10 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none">
          {/* CLEAN FORMAL LETTERHEAD (KOP SURAT) */}
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

          {/* DOCUMENT TITLE */}
          <div className="text-center mb-5">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 underline underline-offset-4">
              {computedDocTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-1">{computedDocSubtitle}</p>
          </div>

          {/* =====================================================================
              MODE A: CLEAN DPD STATISTICS TABLE
              ===================================================================== */}
          {exportScope === 'STATISTICS' ? (
            <div className="mb-6">
              <div className="no-print flex items-center justify-between mb-2 text-xs text-slate-500">
                <span>
                  Centang baris DPD yang ingin disertakan ({printedDpdStats.length} dari{' '}
                  {dpdStats.length} DPD):
                </span>
                {selectedStatDpds.size < dpdStats.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedStatDpds(new Set(SULUT_REGIONS.map((r) => r.name)))}
                    className="text-slate-900 underline font-medium cursor-pointer"
                  >
                    Pilih Semua 15 DPD
                  </button>
                )}
              </div>

              <div className="overflow-x-auto print:overflow-visible border border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                      <th className="no-print p-2 border-r border-slate-300 text-center w-8">✓</th>
                      <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                      <th className="p-2 border-r border-slate-300">DPD Kabupaten / Kota</th>
                      <th className="p-2 border-r border-slate-300 text-center">Zona</th>
                      <th className="p-2 border-r border-slate-300 text-center">Jml DPC</th>
                      <th className="p-2 border-r border-slate-300 text-right">Total</th>
                      <th className="p-2 border-r border-slate-300 text-right">Aktif Riil</th>
                      <th className="p-2 border-r border-slate-300 text-right">% Aktif</th>
                      <th className="p-2 border-r border-slate-300 text-center">Non-Aktif</th>
                      <th className="p-2 text-center">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {dpdStats.map((row) => {
                      const isChecked = selectedStatDpds.has(row.dpd);
                      const printIndex = printedDpdStats.findIndex((r) => r.dpd === row.dpd) + 1;
                      const nonAktifRow = row.meninggal + row.pindahPartai + row.pindahDomisili;

                      return (
                        <tr
                          key={row.dpd}
                          className={!isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'}
                        >
                          <td className="no-print p-2 border-r border-slate-200 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedStatDpds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(row.dpd)) next.delete(row.dpd);
                                  else next.add(row.dpd);
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                            {isChecked ? printIndex : '-'}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                            {row.dpd}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center text-slate-600 text-[11px]">
                            {row.zona === 'Daratan Minahasa'
                              ? 'Minahasa'
                              : row.zona === 'BMR'
                              ? 'BMR'
                              : 'Kepulauan'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                            {row.dpcCount}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                            {row.total}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 text-[11px]">
                            {row.aktif}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[11px]">
                            {row.persentaseAktif}%
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 text-[11px]">
                            {nonAktifRow}
                          </td>
                          <td className="p-2 text-center text-[11px] text-slate-700">
                            {row.statusKesiapan}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-400 font-mono text-[11px]">
                      <td className="no-print p-2"></td>
                      <td className="p-2 text-center" colSpan={3}>
                        TOTAL ({printedDpdStats.length} DPD)
                      </td>
                      <td className="p-2 text-center border-l border-slate-300">
                        {grandTotal.dpcAll}
                      </td>
                      <td className="p-2 text-right border-l border-slate-300">
                        {grandTotal.totalAll}
                      </td>
                      <td className="p-2 text-right border-l border-slate-300">
                        {grandTotal.aktifAll}
                      </td>
                      <td className="p-2 text-right border-l border-slate-300">
                        {grandTotal.avgPersen}%
                      </td>
                      <td className="p-2 text-center border-l border-slate-300">
                        {grandTotal.nonAktifAll}
                      </td>
                      <td className="p-2 text-center border-l border-slate-300 font-sans">
                        Terverifikasi
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* =====================================================================
               MODE B: STRUCTURAL / TERRITORIAL TABLES (DPW, DPD, DPC, DPRt, ALL_KADER)
               ===================================================================== */
            <div className="mb-6 space-y-5 print:space-y-4">
              <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Menampilkan <strong className="text-slate-900">{printedNominativeMembers.length}</strong> data terpilih dalam{' '}
                  <strong className="text-slate-900">{groupedTerritorySections.length}</strong> kelompok wilayah. Centang kotak <strong>✓</strong> untuk memilih wilayah/baris:
                </span>
                {uncheckedKeys.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setUncheckedKeys(new Set())}
                    className="text-slate-900 underline font-medium cursor-pointer"
                  >
                    Pilih Semua ({nominativeMembers.length})
                  </button>
                )}
              </div>

              {nominativeMembers.length === 0 ? (
                <div className="border border-slate-300 p-8 text-center text-slate-500 text-xs">
                  Tidak ada data untuk jenjang / wilayah yang dipilih. Silakan pilih wilayah lain pada dropdown di atas.
                </div>
              ) : (
                groupedTerritorySections.map((section, sectionIdx) => {
                  const activeSectionCount = section.items.filter(
                    (it) => !uncheckedKeys.has(it.key)
                  ).length;
                  const isAllSectionChecked =
                    section.items.length > 0 && activeSectionCount === section.items.length;

                  let sectionPrintNo = 0;

                  return (
                    <div
                      key={section.groupId}
                      className={`border border-slate-300 overflow-x-auto print:overflow-visible ${
                        activeSectionCount === 0 ? 'print:hidden' : ''
                      } ${
                        pageBreakPerGroup && sectionIdx > 0 ? 'print:break-before-page' : ''
                      }`}
                    >
                      {/* Territory / Sub-Organization Section Header */}
                      {groupByTerritory && (
                        <div className="bg-slate-100 text-slate-900 border-b border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAllSectionChecked}
                              onChange={() => toggleGroupCheck(section.items)}
                              className="no-print w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                              title="Pilih / batalkan seluruh baris di wilayah ini"
                            />
                            <span>{section.groupTitle}</span>
                            {section.groupSubtitle && (
                              <span className="text-[11px] font-normal text-slate-600 normal-case">
                                ({section.groupSubtitle})
                              </span>
                            )}
                          </label>
                          <span className="text-[10px] font-mono text-slate-600 font-normal shrink-0">
                            {activeSectionCount} Data
                          </span>
                        </div>
                      )}

                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                            <th className="no-print border-r border-slate-300 p-2 text-center w-8">
                              ✓
                            </th>
                            <th className="border-r border-slate-300 p-2 text-center w-9">No</th>
                            {(exportScope === 'DPW' ||
                              exportScope === 'DPD' ||
                              exportScope === 'DPC' ||
                              exportScope === 'DPRt') && (
                              <th className="border-r border-slate-300 p-2 w-1/3">
                                Jabatan Kepengurusan ({exportScope})
                              </th>
                            )}
                            <th className="border-r border-slate-300 p-2">
                              Nama Lengkap &amp; NIK
                            </th>
                            <th className="border-r border-slate-300 p-2">Nomor e-KTA</th>
                            {exportScope === 'ALL_KADER' && (
                              <th className="border-r border-slate-300 p-2">Jabatan &amp; Tingkat</th>
                            )}
                            <th className="border-r border-slate-300 p-2">Wilayah</th>
                            <th className="border-r border-slate-300 p-2 text-center">No. HP</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {section.items.map(({ member: m, key }) => {
                            const isChecked = !uncheckedKeys.has(key);
                            if (isChecked) sectionPrintNo += 1;
                            const displayNo = isChecked ? sectionPrintNo : '-';

                            const cleanNik = isRealNik(m.nik) ? m.nik : '-';
                            const cleanEkta = isRealEkta(m.nomorEKTA) ? m.nomorEKTA : '-';

                            return (
                              <tr
                                key={key}
                                className={
                                  !isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'
                                }
                              >
                                <td className="no-print border-r border-slate-200 p-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleMemberCheck(key)}
                                    className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                                  />
                                </td>
                                <td className="border-r border-slate-200 p-1.5 text-center font-mono text-[11px]">
                                  {displayNo}
                                </td>

                                {(exportScope === 'DPW' ||
                                  exportScope === 'DPD' ||
                                  exportScope === 'DPC' ||
                                  exportScope === 'DPRt') && (
                                  <td className="border-r border-slate-200 p-1.5 font-medium text-slate-900">
                                    {m.jabatan || 'Pengurus'}
                                  </td>
                                )}

                                <td className="border-r border-slate-200 p-1.5">
                                  <div className="font-semibold text-slate-900 leading-tight">
                                    {m.namaLengkap}
                                  </div>
                                  {cleanNik !== '-' && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      NIK: {cleanNik}
                                    </div>
                                  )}
                                </td>

                                <td className="border-r border-slate-200 p-1.5 font-mono text-slate-800 text-[11px]">
                                  {cleanEkta}
                                </td>

                                {exportScope === 'ALL_KADER' && (
                                  <td className="border-r border-slate-200 p-1.5 text-slate-800">
                                    <div className="font-medium text-slate-900">
                                      {m.jabatan || 'Anggota'}
                                    </div>
                                    {m.tingkatKepengurusan &&
                                      m.tingkatKepengurusan !== 'Bukan Pengurus' && (
                                        <div className="text-[10px] text-slate-500">
                                          {m.tingkatKepengurusan}
                                        </div>
                                      )}
                                  </td>
                                )}

                                <td className="border-r border-slate-200 p-1.5 text-slate-700 text-[11px]">
                                  {exportScope === 'DPW' ? (
                                    <span>Provinsi Sulawesi Utara</span>
                                  ) : (
                                    <div>
                                      <div className="font-medium text-slate-900">
                                        {m.dpd || '-'}
                                      </div>
                                      {m.dpc &&
                                        m.dpc !== '-' &&
                                        m.dpc !== 'ALL' &&
                                        m.dpc !== 'Umum (DPD)' && (
                                          <div className="text-[10px] text-slate-500">
                                            Kec. {m.dpc}
                                            {m.dprt &&
                                            m.dprt !== '-' &&
                                            m.dprt !== 'ALL' &&
                                            m.dprt !== 'Pusat/Umum'
                                              ? ` • Desa/Kel. ${m.dprt}`
                                              : ''}
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </td>

                                <td className="border-r border-slate-200 p-1.5 text-center font-mono text-slate-700 text-[11px]">
                                  {m.nomorHP && m.nomorHP !== '-' ? m.nomorHP : '-'}
                                </td>

                                <td className="p-1.5 text-center text-[11px] text-slate-800">
                                  {m.status === 'Aktif' ? 'Aktif' : 'Non-Aktif'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =====================================================================
              3. CLEAN INTERACTIVE SIGNATURES BLOCK AT BOTTOM
              ===================================================================== */}
          <div className="print-break-inside-avoid mt-8 pt-5 border-t border-slate-300">
            <div className="no-print mb-3 text-[11px] text-slate-500">
              Klik langsung pada jabatan atau nama di bawah ini untuk mengetik manual sebelum cetak:
            </div>

            <div
              className={`grid grid-cols-1 ${
                signLayout === '1_COL'
                  ? 'sm:grid-cols-1 print:grid-cols-1 justify-items-end'
                  : 'sm:grid-cols-3 print:grid-cols-3'
              } items-start gap-6 text-xs text-slate-900`}
            >
              {/* LEFT SIGNATORY */}
              {signLayout !== '1_COL' && (
                <div className="text-center w-full flex flex-col items-center">
                  <input
                    type="text"
                    value={leftPrefix}
                    onChange={(e) => {
                      setLeftPrefix(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    placeholder="Mengetahui,"
                    className="w-full text-center text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />
                  <input
                    type="text"
                    value={leftTitle}
                    onChange={(e) => {
                      setLeftTitle(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    placeholder="JABATAN PEJABAT KIRI"
                    className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />

                  <div className="h-20 sm:h-24 print:h-22 w-full" />

                  <input
                    type="text"
                    value={leftName}
                    onChange={(e) => {
                      setLeftName(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    placeholder="( Ketik Nama Pejabat Kiri )"
                    className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
                  />
                  {!leftName.trim() && (
                    <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                      ( .................................................... )
                    </div>
                  )}
                  <input
                    type="text"
                    value={leftId}
                    onChange={(e) => {
                      setLeftId(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    placeholder="Ketik No. e-KTA / NIK (Opsional)"
                    className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
                  />
                </div>
              )}

              {/* CENTER STAMP AREA */}
              {signLayout !== '1_COL' && (
                <div className="flex flex-col items-center justify-center w-full my-auto">
                  {showStampBox && (
                    <div className="w-24 h-24 rounded-full border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[9px] text-slate-400 font-mono select-none">
                      <span>STEMPEL</span>
                      <span>ORGANISASI</span>
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT SIGNATORY */}
              <div
                className={`text-center ${
                  signLayout === '1_COL' ? 'w-72 ml-auto' : 'w-full'
                } flex flex-col items-center`}
              >
                <div className="flex items-center justify-center gap-1 w-full">
                  <input
                    type="text"
                    value={signCity}
                    onChange={(e) => {
                      setSignCity(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    className="w-24 text-right text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />
                  <span>,</span>
                  <input
                    type="text"
                    value={signDate}
                    onChange={(e) => {
                      setSignDate(e.target.value);
                      setIsSignManuallyEdited(true);
                    }}
                    className="w-36 text-left text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />
                </div>
                <input
                  type="text"
                  value={rightTitle}
                  onChange={(e) => {
                    setRightTitle(e.target.value);
                    setIsSignManuallyEdited(true);
                  }}
                  placeholder="JABATAN PEJABAT KANAN"
                  className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />

                <div className="h-20 sm:h-24 print:h-22 w-full" />

                <input
                  type="text"
                  value={rightName}
                  onChange={(e) => {
                    setRightName(e.target.value);
                    setIsSignManuallyEdited(true);
                  }}
                  placeholder="( Ketik Nama Pejabat Kanan )"
                  className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
                />
                {!rightName.trim() && (
                  <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                    ( .................................................... )
                  </div>
                )}
                <input
                  type="text"
                  value={rightId}
                  onChange={(e) => {
                    setRightId(e.target.value);
                    setIsSignManuallyEdited(true);
                  }}
                  placeholder="Ketik No. e-KTA / NIK (Opsional)"
                  className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
                />
              </div>
            </div>

            {signLayout === '3_COL' && (
              <div className="mt-8 pt-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto text-xs">
                <input
                  type="text"
                  value={centerPrefix}
                  onChange={(e) => setCenterPrefix(e.target.value)}
                  className="w-full text-center text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none"
                />
                <input
                  type="text"
                  value={centerTitle}
                  onChange={(e) => setCenterTitle(e.target.value)}
                  className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none"
                />
                <div className="h-20 print:h-20 w-full" />
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="( Ketik Nama Pejabat Tengah )"
                  className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
                />
                {!centerName.trim() && (
                  <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                    ( .................................................... )
                  </div>
                )}
                <input
                  type="text"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  placeholder="Ketik No. e-KTA / NIK (Opsional)"
                  className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExecutiveReportPrintModal;
