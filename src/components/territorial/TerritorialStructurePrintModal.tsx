import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { Member, UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getExpandedStructuralMembers,
} from '../../utils/structureReadinessUtils';
import { loadMembers } from '../../utils/storage';
import { GridRowItem } from '../matrix';
import {
  isRealNik,
  isRealEkta,
  getDefaultCity,
  getDefaultSkNumber,
  getTerritoryTitle,
  getLevelText,
  detectSignatories,
  buildFallbackTerritorialRows,
} from './print/printModalUtils';
import { TerritorialPrintToolbar } from './print/TerritorialPrintToolbar';
import { TerritorialPrintFilterBar } from './print/TerritorialPrintFilterBar';
import { TerritorialPrintSignSettings } from './print/TerritorialPrintSignSettings';
import { TerritorialPrintDocument } from './print/TerritorialPrintDocument';

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

  // Dynamic Rows Builder
  const effectiveRows: GridRowItem[] = useMemo(() => {
    if (isSameAsInitialContext) {
      return gridRows;
    }
    return buildFallbackTerritorialRows(
      activeLevel,
      activeDpd,
      activeDpc,
      activeDprt,
      expandedMembers
    );
  }, [
    isSameAsInitialContext,
    gridRows,
    activeLevel,
    activeDpd,
    activeDpc,
    activeDprt,
    expandedMembers,
  ]);

  const defaultCity = useMemo(
    () => getDefaultCity(activeLevel, activeDpd),
    [activeLevel, activeDpd]
  );

  const defaultSkNumber = useMemo(
    () => getDefaultSkNumber(activeLevel, activeDpd, activeDpc, activeDprt),
    [activeLevel, activeDpd, activeDpc, activeDprt]
  );

  const territoryTitle = useMemo(
    () => getTerritoryTitle(activeLevel, activeDpd, activeDpc, activeDprt),
    [activeLevel, activeDpd, activeDpc, activeDprt]
  );

  const levelText = useMemo(() => getLevelText(activeLevel), [activeLevel]);

  const { detectedKetua, detectedSekretaris } = useMemo(
    () => detectSignatories(effectiveRows),
    [effectiveRows]
  );

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

      {/* 1. TOP BAR WITH CONTROLS */}
      <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          {/* Row 1: Toolbar */}
          <TerritorialPrintToolbar
            activeLevel={activeLevel}
            setActiveLevel={(lvl) => {
              setActiveLevel(lvl);
              setSelectedSubOrg('ALL');
            }}
            isSameAsInitialContext={isSameAsInitialContext}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            filledRowsCount={filledRows.length}
            totalSlotsCount={totalSlots}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            orientation={orientation}
            setOrientation={setOrientation}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
            onClose={onClose}
            selectedPrintCount={selectedPrintCount}
          />

          {/* Row 2: Territorial Filter Bar */}
          <TerritorialPrintFilterBar
            activeLevel={activeLevel}
            activeDpd={activeDpd}
            setActiveDpd={setActiveDpd}
            activeDpc={activeDpc}
            setActiveDpc={setActiveDpc}
            activeDprt={activeDprt}
            setActiveDprt={setActiveDprt}
            setSelectedSubOrg={setSelectedSubOrg}
            dpdOptionsWithCount={dpdOptionsWithCount}
            dpcOptionsWithCount={dpcOptionsWithCount}
            dprtOptionsWithCount={dprtOptionsWithCount}
            pageBreakPerGroup={pageBreakPerGroup}
            setPageBreakPerGroup={setPageBreakPerGroup}
            hasMultipleGroups={groupedRows.length > 1}
          />

          {/* Signatures & SK Settings */}
          <TerritorialPrintSignSettings
            showSettings={showSettings}
            showStamp={showStamp}
            setShowStamp={setShowStamp}
            onResetSettings={handleResetSettings}
            skNumber={skNumber}
            setSkNumber={setSkNumber}
            signCity={signCity}
            setSignCity={setSignCity}
            signDate={signDate}
            setSignDate={setSignDate}
            filledRows={filledRows}
            leftJabatan={leftJabatan}
            setLeftJabatan={setLeftJabatan}
            sekretarisName={sekretarisName}
            setSekretarisName={setSekretarisName}
            sekretarisKta={sekretarisKta}
            setSekretarisKta={setSekretarisKta}
            rightJabatan={rightJabatan}
            setRightJabatan={setRightJabatan}
            ketuaName={ketuaName}
            setKetuaName={setKetuaName}
            ketuaKta={ketuaKta}
            setKetuaKta={setKetuaKta}
          />
        </div>
      </div>

      {/* 2. SCROLLABLE PRINTABLE DOCUMENT */}
      <TerritorialPrintDocument
        levelText={levelText}
        territoryTitle={territoryTitle}
        skNumber={skNumber}
        signDate={signDate}
        signCity={signCity}
        setSignCity={setSignCity}
        setSignDate={setSignDate}
        selectedPrintCount={selectedPrintCount}
        totalRowsToPrintCount={rowsToPrint.length}
        uncheckedRowKeys={uncheckedRowKeys}
        onSelectAllRows={() => setUncheckedRowKeys(new Set())}
        onToggleRowCheck={toggleRowCheck}
        groupedRows={groupedRows}
        pageBreakPerGroup={pageBreakPerGroup}
        leftPrefix={leftPrefix}
        setLeftPrefix={setLeftPrefix}
        leftJabatan={leftJabatan}
        setLeftJabatan={setLeftJabatan}
        sekretarisName={sekretarisName}
        setSekretarisName={setSekretarisName}
        sekretarisKta={sekretarisKta}
        setSekretarisKta={setSekretarisKta}
        showStamp={showStamp}
        rightJabatan={rightJabatan}
        setRightJabatan={setRightJabatan}
        ketuaName={ketuaName}
        setKetuaName={setKetuaName}
        ketuaKta={ketuaKta}
        setKetuaKta={setKetuaKta}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TerritorialStructurePrintModal;
