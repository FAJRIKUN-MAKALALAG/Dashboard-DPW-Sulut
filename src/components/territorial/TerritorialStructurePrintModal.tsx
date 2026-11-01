import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  PenTool,
} from 'lucide-react';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getExpandedStructuralMembers,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import { getCouncilRank, getPimpinanRank } from '../../utils/jobMatchingUtils';
import { getStructureTemplate } from '../../data/structureTemplates';
import { loadMembers } from '../../utils/storage';
import { GridRowItem } from '../matrix';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';
import * as XLSX from 'xlsx';

interface TerritorialStructurePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  dpd: string;
  dpc?: string;
  dprt?: string;
  gridRows: GridRowItem[];
  members?: Member[];
  session?: UserSession;
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

export const TerritorialStructurePrintModal: React.FC<TerritorialStructurePrintModalProps> = ({
  isOpen,
  onClose,
  level: initialLevel,
  dpd: initialDpd,
  dpc: initialDpc,
  dprt: initialDprt,
  gridRows,
  members: propMembers,
}) => {
  // Active Level & Territory Selection inside the Modal
  const [activeLevel, setActiveLevel] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt'>(initialLevel);
  const [activeDpd, setActiveDpd] = useState<string>(initialDpd || 'ALL');
  const [activeDpc, setActiveDpc] = useState<string>(initialDpc || 'ALL');
  const [activeDprt, setActiveDprt] = useState<string>(initialDprt || 'ALL');

  const [filterMode, setFilterMode] = useState<'all' | 'filled'>('filled');
  const [selectedSubOrg, setSelectedSubOrg] = useState<string>('ALL');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showStamp, setShowStamp] = useState<boolean>(false);
  const [pageBreakPerGroup, setPageBreakPerGroup] = useState<boolean>(false);

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLevel(initialLevel);
      setActiveDpd(initialDpd || 'ALL');
      setActiveDpc(initialDpc || 'ALL');
      setActiveDprt(initialDprt || 'ALL');
      setSelectedSubOrg('ALL');
      const hasFilled = gridRows.some((r) => r.namaLengkap && r.namaLengkap.trim() !== '');
      setFilterMode(hasFilled ? 'filled' : 'all');
    }
  }, [isOpen, initialLevel, initialDpd, initialDpc, initialDprt, gridRows]);

  const allSourceMembers = useMemo(() => {
    if (propMembers && propMembers.length > 0) return propMembers;
    return loadMembers();
  }, [propMembers]);

  const expandedMembers = useMemo(
    () => getExpandedStructuralMembers(allSourceMembers.filter((m) => m.status === 'Aktif')),
    [allSourceMembers]
  );

  // Check if user is still viewing the exact same territory passed from the parent matrix page
  const isSameAsInitialContext = useMemo(() => {
    if (activeLevel !== initialLevel) return false;
    if (activeLevel === 'DPW') return true;
    if (activeLevel === 'DPD') return isDpdMatch(activeDpd, initialDpd);
    if (activeLevel === 'DPC') {
      return isDpdMatch(activeDpd, initialDpd) && isDpcMatch(activeDpc, initialDpc);
    }
    if (activeLevel === 'DPRt') {
      return (
        isDpdMatch(activeDpd, initialDpd) &&
        isDpcMatch(activeDpc, initialDpc) &&
        isDprtMatch(activeDprt, initialDprt)
      );
    }
    return false;
  }, [
    activeLevel,
    initialLevel,
    activeDpd,
    initialDpd,
    activeDpc,
    initialDpc,
    activeDprt,
    initialDprt,
  ]);

  // Available DPD options with count for activeLevel
  const dpdOptionsWithCount = useMemo(() => {
    return SULUT_REGIONS.map((r) => {
      const count = expandedMembers.filter(
        (m) => m.tingkatKepengurusan === activeLevel && isDpdMatch(m.dpd, r.name)
      ).length;
      return { name: r.name, count };
    });
  }, [expandedMembers, activeLevel]);

  // Available DPC options with count for activeLevel & activeDpd
  const dpcOptionsWithCount = useMemo(() => {
    const subMap = new Map<string, string>();
    if (activeDpd !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, activeDpd));
      reg?.subdistricts.forEach((s) => subMap.set(s.name.toLowerCase().trim(), s.name));
    }
    expandedMembers.forEach((m) => {
      if (activeDpd !== 'ALL' && !isDpdMatch(m.dpd, activeDpd)) return;
      if (m.dpc && m.dpc !== '-' && m.dpc !== 'ALL' && m.dpc !== 'Umum (DPD)') {
        const clean = m.dpc.replace(/^(kecamatan|kec\.|kec)\s+/gi, '').trim();
        if (!Array.from(subMap.keys()).some((k) => isDpcMatch(k, clean))) {
          subMap.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(subMap.values())
      .map((dpcName) => {
        const count = expandedMembers.filter(
          (m) =>
            m.tingkatKepengurusan === activeLevel &&
            (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
            isDpcMatch(m.dpc, dpcName)
        ).length;
        return { name: dpcName, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expandedMembers, activeLevel, activeDpd]);

  // Available DPRt options with count for activeDpd & activeDpc
  const dprtOptionsWithCount = useMemo(() => {
    const vilMap = new Map<string, string>();
    if (activeDpd !== 'ALL' && activeDpc !== 'ALL') {
      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, activeDpd));
      const sub = reg?.subdistricts.find((s) => isDpcMatch(s.name, activeDpc));
      sub?.villages.forEach((v) => vilMap.set(v.toLowerCase().trim(), v));
    }
    expandedMembers.forEach((m) => {
      if (activeDpd !== 'ALL' && !isDpdMatch(m.dpd, activeDpd)) return;
      if (activeDpc !== 'ALL' && !isDpcMatch(m.dpc, activeDpc)) return;
      if (m.dprt && m.dprt !== '-' && m.dprt !== 'ALL' && m.dprt !== 'Pusat/Umum') {
        const clean = m.dprt.replace(/^(desa|kelurahan|kel\.|kel|des)\s+/gi, '').trim();
        if (!Array.from(vilMap.keys()).some((k) => isDprtMatch(k, clean))) {
          vilMap.set(clean.toLowerCase(), clean);
        }
      }
    });

    return Array.from(vilMap.values())
      .map((dprtName) => {
        const count = expandedMembers.filter(
          (m) =>
            m.tingkatKepengurusan === 'DPRt' &&
            (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
            (activeDpc === 'ALL' || isDpcMatch(m.dpc, activeDpc)) &&
            isDprtMatch(m.dprt, dprtName)
        ).length;
        return { name: dprtName, count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expandedMembers, activeDpd, activeDpc]);

  // Dynamic Rows Builder: uses parent `gridRows` if same context, otherwise builds from `expandedMembers`
  const effectiveRows: GridRowItem[] = useMemo(() => {
    if (isSameAsInitialContext) {
      return gridRows;
    }

    const tplSlots = getStructureTemplate(activeLevel);
    const filtered = expandedMembers
      .filter((m) => {
        if (activeLevel === 'DPW') {
          return m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara';
        }
        if (activeLevel === 'DPD') {
          return (
            m.tingkatKepengurusan === 'DPD' &&
            (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd))
          );
        }
        if (activeLevel === 'DPC') {
          return (
            m.tingkatKepengurusan === 'DPC' &&
            (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
            (activeDpc === 'ALL' || isDpcMatch(m.dpc, activeDpc))
          );
        }
        if (activeLevel === 'DPRt') {
          return (
            m.tingkatKepengurusan === 'DPRt' &&
            (activeDpd === 'ALL' || isDpdMatch(m.dpd, activeDpd)) &&
            (activeDpc === 'ALL' || isDpcMatch(m.dpc, activeDpc)) &&
            (activeDprt === 'ALL' || isDprtMatch(m.dprt, activeDprt))
          );
        }
        return false;
      })
      .sort((a, b) => {
        const dpdComp = (a.dpd || '').localeCompare(b.dpd || '');
        if (dpdComp !== 0 && activeLevel !== 'DPW') return dpdComp;
        if (activeLevel === 'DPC' || activeLevel === 'DPRt') {
          const dpcComp = (a.dpc || '').localeCompare(b.dpc || '');
          if (dpcComp !== 0) return dpcComp;
        }
        if (activeLevel === 'DPRt') {
          const dprtComp = (a.dprt || '').localeCompare(b.dprt || '');
          if (dprtComp !== 0) return dprtComp;
        }
        const catOrder: Record<string, number> = { PERTIMBANGAN: 1, PAKAR: 2, PIMPINAN: 3 };
        const catA = catOrder[getMemberSubOrgCategory(a)] || 3;
        const catB = catOrder[getMemberSubOrgCategory(b)] || 3;
        if (catA !== catB) return catA - catB;

        if (catA === 1 || catA === 2) {
          return getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan);
        }
        return getPimpinanRank(a.jabatan, tplSlots) - getPimpinanRank(b.jabatan, tplSlots);
      });

    return filtered.map((m, i) => {
      const subCat = getMemberSubOrgCategory(m);
      let groupLabel = '';
      if (activeLevel === 'DPW') {
        groupLabel =
          subCat === 'PERTIMBANGAN'
            ? 'DEWAN PERTIMBANGAN WILAYAH'
            : subCat === 'PAKAR'
            ? 'DEWAN PAKAR WILAYAH'
            : 'DEWAN PIMPINAN WILAYAH';
      } else if (activeLevel === 'DPD') {
        const subName =
          subCat === 'PERTIMBANGAN'
            ? 'DEWAN PERTIMBANGAN DAERAH'
            : subCat === 'PAKAR'
            ? 'DEWAN PAKAR DAERAH'
            : 'DEWAN PIMPINAN DAERAH';
        groupLabel =
          activeDpd === 'ALL' ? `DPD ${(m.dpd || '').toUpperCase()} — ${subName}` : subName;
      } else if (activeLevel === 'DPC') {
        groupLabel =
          activeDpc === 'ALL'
            ? `DPC KECAMATAN ${(m.dpc || '-').toUpperCase()} (${m.dpd || '-'})`
            : subCat === 'PERTIMBANGAN'
            ? 'DEWAN PERTIMBANGAN CABANG'
            : subCat === 'PAKAR'
            ? 'DEWAN PAKAR CABANG'
            : 'DEWAN PIMPINAN CABANG';
      } else {
        groupLabel =
          activeDprt === 'ALL'
            ? `DPRt DESA/KEL. ${(m.dprt || '-').toUpperCase()} — KEC. ${(m.dpc || '-').toUpperCase()}`
            : 'DEWAN PIMPINAN RANTING';
      }

      return {
        id: m.id || `${m.nik}-${i}`,
        no: i + 1,
        subOrg: groupLabel,
        jabatan: m.jabatan || 'Pengurus',
        namaLengkap: m.namaLengkap || '',
        nik: m.nik || '',
        nomorEKTA: m.nomorEKTA || '',
        nomorHP: m.nomorHP || '',
        email: m.email || '',
        sosmed: m.sosmed || '',
        isExisting: true,
        fotoProfilUrl: m.fotoProfilUrl,
      };
    });
  }, [
    isSameAsInitialContext,
    gridRows,
    activeLevel,
    activeDpd,
    activeDpc,
    activeDprt,
    expandedMembers,
  ]);

  const defaultCity = useMemo(() => {
    if (activeLevel === 'DPW' || activeDpd === 'ALL') return 'Manado';
    const normDpd = (activeDpd || '').toUpperCase().trim();
    if (normDpd.includes('MINAHASA SELATAN')) return 'Amurang';
    if (normDpd.includes('MINAHASA UTARA')) return 'Airmadidi';
    if (normDpd.includes('MINAHASA TENGGARA')) return 'Ratahan';
    if (
      normDpd.includes('MINAHASA') &&
      !normDpd.includes('SELATAN') &&
      !normDpd.includes('UTARA') &&
      !normDpd.includes('TENGGARA')
    )
      return 'Tondano';
    if (normDpd.includes('BOLAANG MONGONDOW SELATAN')) return 'Molibagu';
    if (normDpd.includes('BOLAANG MONGONDOW TIMUR')) return 'Tutuyan';
    if (normDpd.includes('BOLAANG MONGONDOW UTARA')) return 'Boroko';
    if (normDpd.includes('BOLAANG MONGONDOW')) return 'Lolak';
    if (normDpd.includes('KOTAMOBAGU')) return 'Kotamobagu';
    if (normDpd.includes('BITUNG')) return 'Bitung';
    if (normDpd.includes('TOMOHON')) return 'Tomohon';
    if (normDpd.includes('SANGIHE')) return 'Tahuna';
    if (normDpd.includes('TALAUD')) return 'Melonguane';
    if (normDpd.includes('SIAU') || normDpd.includes('SITARO')) return 'Ondong';
    if (normDpd.includes('MANADO')) return 'Manado';
    return activeDpd.replace(/KABUPATEN|KOTA|KEPULAUAN/gi, '').trim() || 'Sulawesi Utara';
  }, [activeLevel, activeDpd]);

  const defaultSkNumber = useMemo(() => {
    const year = new Date().getFullYear();
    if (activeLevel === 'DPW') return `SK-001/DPW-NASDEM/SULUT/${year}`;
    if (activeLevel === 'DPD') {
      const code = (activeDpd === 'ALL' ? 'SULUT' : activeDpd)
        .replace(/KABUPATEN|KOTA|KEPULAUAN|\s+/gi, '')
        .toUpperCase();
      return `SK-DPD-${code}/${year}`;
    }
    if (activeLevel === 'DPC') {
      const code = (activeDpc === 'ALL' ? 'ALL' : activeDpc).replace(/\s+/g, '').toUpperCase();
      return `SK-DPC-${code}/${year}`;
    }
    const code = (activeDprt === 'ALL' ? 'ALL' : activeDprt).replace(/\s+/g, '').toUpperCase();
    return `SK-DPRT-${code}/${year}`;
  }, [activeLevel, activeDpd, activeDpc, activeDprt]);

  const territoryTitle =
    activeLevel === 'DPW'
      ? 'PROVINSI SULAWESI UTARA'
      : activeLevel === 'DPD'
      ? activeDpd === 'ALL'
        ? 'SELURUH KABUPATEN / KOTA SE-SULAWESI UTARA'
        : `${activeDpd.toUpperCase()}`
      : activeLevel === 'DPC'
      ? `${activeDpc === 'ALL' ? 'SELURUH KECAMATAN' : `KECAMATAN ${activeDpc.toUpperCase()}`} — ${
          activeDpd === 'ALL' ? 'SULAWESI UTARA' : activeDpd.toUpperCase()
        }`
      : `${
          activeDprt === 'ALL'
            ? 'SELURUH DESA / KELURAHAN'
            : `DESA/KELURAHAN ${activeDprt.toUpperCase()}`
        } — ${activeDpc === 'ALL' ? '' : `KEC. ${activeDpc.toUpperCase()} `}(${
          activeDpd === 'ALL' ? 'SULAWESI UTARA' : activeDpd.toUpperCase()
        })`;

  const levelText =
    activeLevel === 'DPW'
      ? 'DEWAN PIMPINAN WILAYAH (DPW)'
      : activeLevel === 'DPD'
      ? 'DEWAN PIMPINAN DAERAH (DPD)'
      : activeLevel === 'DPC'
      ? 'DEWAN PIMPINAN CABANG (DPC)'
      : 'DEWAN PIMPINAN RANTING (DPRt)';

  const detectedKetua = useMemo(() => {
    const row = effectiveRows.find((r) => {
      const j = (r.jabatan || '').trim().toLowerCase();
      const sub = (r.subOrg || '').toLowerCase();
      const isKetuaJabatan =
        j === 'ketua' ||
        j.startsWith('ketua dpw') ||
        j.startsWith('ketua dpd') ||
        j.startsWith('ketua dpc') ||
        j.startsWith('ketua dprt');
      const isBukanWakil = !j.includes('wakil') && !j.includes('bidang') && !j.includes('biro');
      return (
        isKetuaJabatan &&
        isBukanWakil &&
        !sub.includes('pakar') &&
        !sub.includes('pertimbangan') &&
        r.namaLengkap.trim() !== ''
      );
    });
    if (row && row.namaLengkap.trim()) {
      const ktaStr = isRealEkta(row.nomorEKTA)
        ? `No. e-KTA: ${row.nomorEKTA}`
        : isRealNik(row.nik)
        ? `NIK: ${row.nik}`
        : '';
      return { nama: row.namaLengkap.trim(), kta: ktaStr };
    }
    return { nama: '', kta: '' };
  }, [effectiveRows]);

  const detectedSekretaris = useMemo(() => {
    const row = effectiveRows.find((r) => {
      const j = (r.jabatan || '').trim().toLowerCase();
      const sub = (r.subOrg || '').toLowerCase();
      const isSekretarisJabatan =
        j === 'sekretaris' ||
        j === 'sekertaris' ||
        j.startsWith('sekretaris dpw') ||
        j.startsWith('sekretaris dpd') ||
        j.startsWith('sekretaris dpc') ||
        j.startsWith('sekretaris dprt');
      const isBukanWakil = !j.includes('wakil');
      return (
        isSekretarisJabatan &&
        isBukanWakil &&
        !sub.includes('pakar') &&
        !sub.includes('pertimbangan') &&
        r.namaLengkap.trim() !== ''
      );
    });
    if (row && row.namaLengkap.trim()) {
      const ktaStr = isRealEkta(row.nomorEKTA)
        ? `No. e-KTA: ${row.nomorEKTA}`
        : isRealNik(row.nik)
        ? `NIK: ${row.nik}`
        : '';
      return { nama: row.namaLengkap.trim(), kta: ktaStr };
    }
    return { nama: '', kta: '' };
  }, [effectiveRows]);

  const defaultDateFormatted = useMemo(
    () =>
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  const [skNumber, setSkNumber] = useState<string>(defaultSkNumber);
  const [signCity, setSignCity] = useState<string>(defaultCity);
  const [signDate, setSignDate] = useState<string>(defaultDateFormatted);

  const [leftPrefix, setLeftPrefix] = useState<string>('Mengetahui,');
  const [leftJabatan, setLeftJabatan] = useState<string>(`SEKRETARIS ${levelText}`);
  const [sekretarisName, setSekretarisName] = useState<string>(detectedSekretaris.nama);
  const [sekretarisKta, setSekretarisKta] = useState<string>(detectedSekretaris.kta);

  const [rightJabatan, setRightJabatan] = useState<string>(`KETUA ${levelText}`);
  const [ketuaName, setKetuaName] = useState<string>(detectedKetua.nama);
  const [ketuaKta, setKetuaKta] = useState<string>(detectedKetua.kta);

  useEffect(() => {
    setSkNumber(defaultSkNumber);
    setSignCity(defaultCity);
    setLeftJabatan(`SEKRETARIS ${levelText}`);
    setRightJabatan(`KETUA ${levelText}`);
    setKetuaName(detectedKetua.nama);
    setKetuaKta(detectedKetua.kta);
    setSekretarisName(detectedSekretaris.nama);
    setSekretarisKta(detectedSekretaris.kta);
  }, [defaultSkNumber, defaultCity, levelText, detectedKetua, detectedSekretaris]);

  const availableSubOrgs = useMemo(() => {
    const set = new Set<string>();
    effectiveRows.forEach((r) => {
      if (r.subOrg && r.subOrg.trim()) set.add(r.subOrg.trim());
    });
    return Array.from(set);
  }, [effectiveRows]);

  const totalSlots = effectiveRows.length;
  const filledRows = useMemo(
    () => effectiveRows.filter((r) => r.namaLengkap.trim() !== ''),
    [effectiveRows]
  );

  const rowsToPrint = useMemo(() => {
    let result = effectiveRows;
    if (filterMode === 'filled') {
      result = result.filter((r) => r.namaLengkap.trim() !== '');
    }
    if (selectedSubOrg !== 'ALL') {
      result = result.filter((r) => (r.subOrg || '').trim() === selectedSubOrg.trim());
    }
    return result;
  }, [effectiveRows, filterMode, selectedSubOrg]);

  const getRowKey = (r: GridRowItem, idx: number) => r.id || `${r.subOrg}-${r.jabatan}-${idx}`;
  const [uncheckedRowKeys, setUncheckedRowKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUncheckedRowKeys(new Set());
  }, [filterMode, selectedSubOrg, activeDpd, activeDpc, activeDprt, activeLevel]);

  const toggleRowCheck = (key: string) => {
    setUncheckedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedPrintCount = useMemo(
    () => rowsToPrint.filter((r, i) => !uncheckedRowKeys.has(getRowKey(r, i))).length,
    [rowsToPrint, uncheckedRowKeys]
  );

  const groupedRows = useMemo(() => {
    const map = new Map<string, { row: GridRowItem; key: string }[]>();
    rowsToPrint.forEach((r, idx) => {
      const sub = r.subOrg || `DEWAN PIMPINAN ${activeLevel}`;
      if (!map.has(sub)) map.set(sub, []);
      map.get(sub)!.push({ row: r, key: getRowKey(r, idx) });
    });

    const sortPriority = (title: string) => {
      const t = title.toUpperCase();
      if (t.includes('PERTIMBANGAN')) return 1;
      if (t.includes('PAKAR')) return 2;
      if (
        t.includes('PIMPINAN') ||
        t.includes('DPD') ||
        t.includes('DPW') ||
        t.includes('CABANG') ||
        t.includes('RANTING')
      )
        return 3;
      return 4;
    };

    return Array.from(map.entries()).sort(([a], [b]) => {
      if (!isSameAsInitialContext) return a.localeCompare(b);
      return sortPriority(a) - sortPriority(b);
    });
  }, [rowsToPrint, activeLevel, isSameAsInitialContext]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResetSettings = () => {
    setSkNumber(defaultSkNumber);
    setSignCity(defaultCity);
    setSignDate(defaultDateFormatted);
    setLeftPrefix('Mengetahui,');
    setLeftJabatan(`SEKRETARIS ${levelText}`);
    setRightJabatan(`KETUA ${levelText}`);
    setKetuaName(detectedKetua.nama);
    setKetuaKta(detectedKetua.kta);
    setSekretarisName(detectedSekretaris.nama);
    setSekretarisKta(detectedSekretaris.kta);
  };

  const handleExportExcel = () => {
    const activeRows = rowsToPrint.filter((r, i) => !uncheckedRowKeys.has(getRowKey(r, i)));
    const exportData = activeRows.map((r, i) => ({
      No: i + 1,
      'Wilayah / Dewan': r.subOrg,
      'Jabatan Pengurus': r.jabatan,
      'Nama Lengkap & Gelar': r.namaLengkap || '(Belum Terisi)',
      'Nomor NIK': isRealNik(r.nik) ? r.nik : '-',
      'Nomor E-KTA': isRealEkta(r.nomorEKTA) ? r.nomorEKTA : '-',
      'No. WhatsApp / HP': r.nomorHP || '-',
      Email: r.email || '-',
      Status: r.namaLengkap.trim() !== '' ? 'Aktif' : 'Lowong',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Struktur_${activeLevel}`);
    const fileName = `SK_STRUKTUR_${activeLevel}_${territoryTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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

      {/* ===================================================================
          1. CLEAN COMPACT TOP BAR WITH JENJANG & WILAYAH SELECTOR
          =================================================================== */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          {/* Row 1: Level Tabs + Main Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900 mr-1">Cetak Struktur:</span>

              {/* Level Switcher (DPW, DPD, DPC, DPRt) */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                {(['DPW', 'DPD', 'DPC', 'DPRt'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setActiveLevel(lvl);
                      setSelectedSubOrg('ALL');
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      activeLevel === lvl
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {isSameAsInitialContext && (
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode('filled')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      filterMode === 'filled'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Terisi ({filledRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Slot ({totalSlots})
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${
                  showSettings
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Atur Tanda Tangan</span>
                {showSettings ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-1.5">
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
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF ({selectedPrintCount})</span>
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

          {/* Row 2: PILIH PER WILAYAH (DPD / DPC / DPRt / Sub-Dewan) */}
          {activeLevel !== 'DPW' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                  Pilih Wilayah DPD (Kab/Kota)
                </label>
                <select
                  value={activeDpd}
                  onChange={(e) => {
                    setActiveDpd(e.target.value);
                    setActiveDpc('ALL');
                    setActiveDprt('ALL');
                    setSelectedSubOrg('ALL');
                  }}
                  className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
                >
                  <option value="ALL">Semua 15 DPD (Cetak Per Wilayah)</option>
                  {dpdOptionsWithCount.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name} ({r.count})
                    </option>
                  ))}
                </select>
              </div>

              {(activeLevel === 'DPC' || activeLevel === 'DPRt') && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Pilih Wilayah DPC (Kecamatan)
                  </label>
                  <select
                    value={activeDpc}
                    onChange={(e) => {
                      setActiveDpc(e.target.value);
                      setActiveDprt('ALL');
                      setSelectedSubOrg('ALL');
                    }}
                    className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
                  >
                    <option value="ALL">
                      Semua Kecamatan ({dpcOptionsWithCount.length} DPC)
                    </option>
                    {dpcOptionsWithCount.map((d) => (
                      <option key={d.name} value={d.name}>
                        Kec. {d.name} ({d.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeLevel === 'DPRt' && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                    Pilih Wilayah DPRt (Desa/Kel)
                  </label>
                  <select
                    value={activeDprt}
                    onChange={(e) => {
                      setActiveDprt(e.target.value);
                      setSelectedSubOrg('ALL');
                    }}
                    className="w-full bg-white text-slate-900 font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
                  >
                    <option value="ALL">
                      Semua Desa/Kelurahan ({dprtOptionsWithCount.length} DPRt)
                    </option>
                    {dprtOptionsWithCount.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pb-1">
                {groupedRows.length > 1 && (
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
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

          {/* CLEAN COLLAPSIBLE SIGNATURE & SK SETTINGS */}
          {showSettings && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  Pengaturan Manual Tanda Tangan &amp; Nomor SK
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={showStamp}
                      onChange={(e) => setShowStamp(e.target.checked)}
                      className="rounded border-slate-300 accent-slate-900"
                    />
                    <span>Lingkaran Stempel</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Otomatis</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Nomor SK</label>
                  <input
                    type="text"
                    value={skNumber}
                    onChange={(e) => setSkNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Kota Penetapan</label>
                  <input
                    type="text"
                    value={signCity}
                    onChange={(e) => setSignCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">
                    Tanggal Penetapan
                  </label>
                  <input
                    type="text"
                    value={signDate}
                    onChange={(e) => setSignDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {/* Left Signatory */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Pejabat Kiri (Sekretaris)
                    </span>
                    {filledRows.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const found = filledRows.find((r) => r.namaLengkap === e.target.value);
                          if (found) {
                            setSekretarisName(found.namaLengkap);
                            setSekretarisKta(
                              isRealEkta(found.nomorEKTA)
                                ? `No. e-KTA: ${found.nomorEKTA}`
                                : isRealNik(found.nik)
                                ? `NIK: ${found.nik}`
                                : ''
                            );
                          }
                        }}
                        className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
                      >
                        <option value="">Pilih dari Pengurus...</option>
                        {filledRows.map((r, idx) => (
                          <option key={`sek-${idx}`} value={r.namaLengkap}>
                            {r.namaLengkap} ({r.jabatan})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={leftJabatan}
                      onChange={(e) => setLeftJabatan(e.target.value)}
                      placeholder="Jabatan Kiri"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={sekretarisName}
                      onChange={(e) => setSekretarisName(e.target.value)}
                      placeholder="Ketik Nama Pejabat Kiri..."
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={sekretarisKta}
                      onChange={(e) => setSekretarisKta(e.target.value)}
                      placeholder="No. e-KTA / NIK"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                {/* Right Signatory */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Pejabat Kanan (Ketua)
                    </span>
                    {filledRows.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const found = filledRows.find((r) => r.namaLengkap === e.target.value);
                          if (found) {
                            setKetuaName(found.namaLengkap);
                            setKetuaKta(
                              isRealEkta(found.nomorEKTA)
                                ? `No. e-KTA: ${found.nomorEKTA}`
                                : isRealNik(found.nik)
                                ? `NIK: ${found.nik}`
                                : ''
                            );
                          }
                        }}
                        className="max-w-[160px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
                      >
                        <option value="">Pilih dari Pengurus...</option>
                        {filledRows.map((r, idx) => (
                          <option key={`ket-${idx}`} value={r.namaLengkap}>
                            {r.namaLengkap} ({r.jabatan})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={rightJabatan}
                      onChange={(e) => setRightJabatan(e.target.value)}
                      placeholder="Jabatan Kanan"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={ketuaName}
                      onChange={(e) => setKetuaName(e.target.value)}
                      placeholder="Ketik Nama Pejabat Kanan..."
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={ketuaKta}
                      onChange={(e) => setKetuaKta(e.target.value)}
                      placeholder="No. e-KTA / NIK"
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          2. SCROLLABLE VIEWPORT FOR THE CLEAN A4 PAPER SHEET
          =================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-5xl mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl p-5 sm:p-10 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none">
          {/* CLEAN FORMAL LETTERHEAD */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 text-center sm:text-left print:text-left">
            <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5">
              <img
                src={nasdemLogo}
                alt="Logo Resmi Partai NasDem"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase">
                  PARTAI NASDEM (NASIONAL DEMOKRAT)
                </p>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                  {levelText}
                </h1>
                <p className="text-xs font-bold text-slate-700 uppercase mt-0.5">
                  {territoryTitle}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right print:text-right font-mono text-[10px] text-slate-600 shrink-0">
              <div className="font-bold text-slate-900 uppercase">LAMPIRAN SK RESMI</div>
              <div>No: {skNumber}</div>
              <div>Tanggal: {signDate}</div>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center mb-5">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 underline underline-offset-4">
              SUSUNAN PENGURUS {levelText}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {territoryTitle} &bull; Periode 2024 - 2029
            </p>
          </div>

          <div className="no-print mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              Centang baris yang akan dicetak (
              <strong className="text-slate-900">{selectedPrintCount}</strong> baris dalam{' '}
              <strong className="text-slate-900">{groupedRows.length}</strong> kelompok wilayah/dewan):
            </span>
            {uncheckedRowKeys.size > 0 && (
              <button
                type="button"
                onClick={() => setUncheckedRowKeys(new Set())}
                className="text-slate-900 underline font-medium cursor-pointer"
              >
                Pilih Semua ({rowsToPrint.length})
              </button>
            )}
          </div>

          {/* Tabel Susunan Pengurus (Clean Monochrome) */}
          <div className="mb-6 space-y-5 print:space-y-4">
            {groupedRows.map(([subOrgName, groupItems], groupIdx) => {
              const activeGroupCount = groupItems.filter(
                (item) => !uncheckedRowKeys.has(item.key)
              ).length;
              let printRowCounter = 0;

              return (
                <div
                  key={groupIdx}
                  className={`border border-slate-300 overflow-x-auto print:overflow-visible ${
                    activeGroupCount === 0 ? 'print:hidden' : ''
                  } ${pageBreakPerGroup && groupIdx > 0 ? 'print:break-before-page' : ''}`}
                >
                  <div className="bg-slate-100 text-slate-900 border-b border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>{subOrgName}</span>
                    <span className="text-[10px] font-mono text-slate-600 font-normal">
                      {activeGroupCount} Posisi
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                        <th className="no-print p-2 border-r border-slate-300 text-center w-8">
                          ✓
                        </th>
                        <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border-r border-slate-300 w-1/3">Jabatan Pengurus</th>
                        <th className="p-2 border-r border-slate-300 w-1/3">
                          Nama Lengkap &amp; Gelar
                        </th>
                        <th className="p-2 border-r border-slate-300">Nomor e-KTA / NIK</th>
                        <th className="p-2 border-r border-slate-300">No. HP</th>
                        <th className="p-2 text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {groupItems.map(({ row, key }) => {
                        const isChecked = !uncheckedRowKeys.has(key);
                        if (isChecked) printRowCounter += 1;
                        const isFilled = row.namaLengkap.trim() !== '';
                        const cleanId = isRealEkta(row.nomorEKTA)
                          ? row.nomorEKTA
                          : isRealNik(row.nik)
                          ? row.nik
                          : '-';

                        return (
                          <tr
                            key={key}
                            className={!isChecked ? 'no-print opacity-40 bg-slate-50' : 'bg-white'}
                          >
                            <td className="no-print p-2 border-r border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleRowCheck(key)}
                                className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                              {isChecked ? printRowCounter : '-'}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                              {row.jabatan}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              {isFilled ? (
                                <span className="font-semibold text-slate-950">
                                  {row.namaLengkap}
                                </span>
                              ) : (
                                <span className="italic text-slate-400 font-normal">
                                  (Belum Ditetapkan)
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                              {cleanId}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-700 text-[11px] font-mono">
                              {row.nomorHP && row.nomorHP !== '-' ? row.nomorHP : '-'}
                            </td>
                            <td className="p-2 text-center text-[11px] text-slate-700">
                              {isFilled ? 'Aktif' : 'Lowong'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* ===================================================================
              CLEAN INTERACTIVE SIGNATURES BLOCK AT BOTTOM
              =================================================================== */}
          <div className="print-break-inside-avoid mt-8 pt-5 border-t border-slate-300">
            <div className="no-print mb-3 text-[11px] text-slate-500">
              Klik langsung pada jabatan atau nama di bawah ini untuk mengetik manual sebelum cetak:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 items-start gap-6 text-xs text-slate-800">
              {/* Kolom Kiri: Sekretaris */}
              <div className="text-center flex flex-col items-center w-full">
                <input
                  type="text"
                  value={leftPrefix}
                  onChange={(e) => setLeftPrefix(e.target.value)}
                  className="w-full text-center text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />
                <input
                  type="text"
                  value={leftJabatan}
                  onChange={(e) => setLeftJabatan(e.target.value)}
                  className="w-full text-center font-bold text-slate-950 uppercase mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />
                <p className="text-[10px] text-slate-600 mt-0.5">
                  PARTAI NASDEM {territoryTitle}
                </p>

                <div className="h-20 sm:h-24 print:h-22 w-full" />

                <input
                  type="text"
                  value={sekretarisName}
                  onChange={(e) => setSekretarisName(e.target.value)}
                  placeholder="( Ketik Nama Pejabat Kiri )"
                  className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
                />
                {!sekretarisName.trim() && (
                  <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                    ( .................................................... )
                  </div>
                )}
                <input
                  type="text"
                  value={sekretarisKta}
                  onChange={(e) => setSekretarisKta(e.target.value)}
                  placeholder="Ketik No. e-KTA / NIK (Opsional)"
                  className="w-full text-center text-[10px] text-slate-600 font-mono mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
                />
              </div>

              {/* Kolom Tengah */}
              <div className="text-center flex flex-col items-center justify-center my-auto w-full">
                {showStamp && (
                  <div className="w-24 h-24 rounded-full border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[9px] text-slate-400 font-mono select-none">
                    <span>STEMPEL</span>
                    <span>ORGANISASI</span>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Ketua */}
              <div className="text-center flex flex-col items-center w-full">
                <div className="flex items-center justify-center gap-1 w-full">
                  <input
                    type="text"
                    value={signCity}
                    onChange={(e) => setSignCity(e.target.value)}
                    className="w-24 text-right text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />
                  <span>,</span>
                  <input
                    type="text"
                    value={signDate}
                    onChange={(e) => setSignDate(e.target.value)}
                    className="w-36 text-left text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                  />
                </div>
                <input
                  type="text"
                  value={rightJabatan}
                  onChange={(e) => setRightJabatan(e.target.value)}
                  className="w-full text-center font-bold text-slate-950 uppercase mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
                />
                <p className="text-[10px] text-slate-600 mt-0.5">
                  PARTAI NASDEM {territoryTitle}
                </p>

                <div className="h-20 sm:h-24 print:h-22 w-full" />

                <input
                  type="text"
                  value={ketuaName}
                  onChange={(e) => setKetuaName(e.target.value)}
                  placeholder="( Ketik Nama Pejabat Kanan )"
                  className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
                />
                {!ketuaName.trim() && (
                  <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                    ( .................................................... )
                  </div>
                )}
                <input
                  type="text"
                  value={ketuaKta}
                  onChange={(e) => setKetuaKta(e.target.value)}
                  placeholder="Ketik No. e-KTA / NIK (Opsional)"
                  className="w-full text-center text-[10px] text-slate-600 font-mono mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TerritorialStructurePrintModal;
