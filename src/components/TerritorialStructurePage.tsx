import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { getStructureTemplate, PositionSlot } from '../data/structureTemplates';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import { matchMemberToSlot } from '../utils/jobMatchingUtils';
import * as XLSX from 'xlsx';
import { MatrixTableSheet, GridRowItem } from './matrix';
import {
  downloadTerritorialExcelTemplate,
  TerritoryContext,
} from '../utils/territorialExcelTemplateUtils';
import { TerritorialImportExportModal, TerritorialStructurePrintModal } from './territorial';
import {
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Edit3,
  Save,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

interface TerritorialStructurePageProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[]) => void;
  initialDpd?: string;
  initialDpc?: string;
  initialDprt?: string;
  onOpenCardModal?: (member: Member) => void;
  onOpenDetailModal?: (member: Member) => void;
}

export const TerritorialStructurePage: React.FC<TerritorialStructurePageProps> = ({
  level,
  members,
  session,
  onSaveMembersBatch,
  initialDpd,
  initialDpc,
  initialDprt,
}) => {
  // Territory Selector State
  const [selectedDpd, setSelectedDpd] = useState<string>(() => {
    if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') return initialDpd;
    if (session?.dpdAccess && session.dpdAccess !== 'ALL') return session.dpdAccess;
    return 'Kabupaten Minahasa Selatan';
  });

  const currentRegion = useMemo(() => {
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, selectedDpd)) || SULUT_REGIONS[0];
  }, [selectedDpd]);

  const [selectedDpc, setSelectedDpc] = useState<string>(() => {
    if (initialDpc) return initialDpc;
    return currentRegion?.subdistricts[0]?.name || 'TUMPAAN';
  });

  const currentSubdistrict = useMemo(() => {
    return (
      currentRegion?.subdistricts.find((s) => isDpcMatch(s.name, selectedDpc)) ||
      currentRegion?.subdistricts[0]
    );
  }, [currentRegion, selectedDpc]);

  const [selectedDprt, setSelectedDprt] = useState<string>(() => {
    if (initialDprt) return initialDprt;
    return currentSubdistrict?.villages[0] || 'Pusat';
  });

  // Keep territory in sync if initial props change
  useEffect(() => {
    if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') {
      setSelectedDpd(initialDpd);
    }
    if (initialDpc) {
      setSelectedDpc(initialDpc);
    }
    if (initialDprt) {
      setSelectedDprt(initialDprt);
    }
  }, [initialDpd, initialDpc, initialDprt]);

  // Edit Mode & Messages
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modal Import Excel Teritorial
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  // Modal Cetak Dokumen Resmi Susunan Pengurus
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Territory Context untuk Template Excel dan Import
  const territoryContext: TerritoryContext = useMemo(() => ({
    level,
    dpd: selectedDpd,
    dpc: level === 'DPC' || level === 'DPRt' ? selectedDpc : undefined,
    dprt: level === 'DPRt' ? selectedDprt : undefined,
  }), [level, selectedDpd, selectedDpc, selectedDprt]);

  const handleDownloadTemplateExcel = () => {
    downloadTerritorialExcelTemplate(territoryContext, gridRows);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'empty'>('all');

  // Matrix rows state
  const [gridRows, setGridRows] = useState<GridRowItem[]>([]);

  // Build matrix whenever territory changes or members change
  const buildMatrixRows = () => {
    const template = getStructureTemplate(level);

    // Filter existing members in this territory and level with strict hierarchical separation
    let matchedMembers: Member[] = [];
    if (level === 'DPW') {
      matchedMembers = members.filter(
        (m) =>
          m.tingkatKepengurusan === 'DPW' ||
          m.dpd === 'Sulawesi Utara' ||
          m.wilayahPenugasan === 'DPW' ||
          m.wilayahPenugasan?.includes('DPW') ||
          (m.isPengurus && (m.dpd === 'Sulawesi Utara' || !m.dpd))
      );
    } else if (level === 'DPD') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          (m.tingkatKepengurusan === 'DPD' ||
            m.dpc === 'Umum (DPD)' ||
            m.dpc === 'Wilayah DPD' ||
            (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD' || !m.dpc || m.dpc === '-')) ||
            (m.isPengurus && (m.tingkatKepengurusan === 'DPD' || m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)' || !m.dpc || m.dpc === '-')))
      );
    } else if (level === 'DPC') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          isDpcMatch(m.dpc, selectedDpc) &&
          (m.tingkatKepengurusan === 'DPC' ||
            (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );
    } else if (level === 'DPRt') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          isDpcMatch(m.dpc, selectedDpc) &&
          isDprtMatch(m.dprt, selectedDprt) &&
          (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
      );
    }

    const assignedMemberNiks = new Set<string>();

    const rows: GridRowItem[] = template.map((slot: PositionSlot, idx: number) => {
      // Pencocokan cerdas: mengenali singkatan Bid, HAM, OKK, & / dan, dsb.
      // Serta mengubah nama jabatan di slot agar mengikuti jabatan asli yang diimpor
      const { matchedMember, displayTitle } = matchMemberToSlot(
        slot,
        matchedMembers,
        assignedMemberNiks
      );

      if (matchedMember) {
        assignedMemberNiks.add(matchedMember.nik);
        return {
          id: matchedMember.nik,
          no: slot.no,
          subOrg: slot.subOrg,
          jabatan: displayTitle,
          namaLengkap: matchedMember.namaLengkap,
          nik: matchedMember.nik,
          nomorEKTA: matchedMember.nomorEKTA || '',
          email: matchedMember.email || '',
          nomorHP: matchedMember.nomorHP || '',
          sosmed: matchedMember.sosmed || '',
          isExisting: true,
          originalNik: matchedMember.nik,
        };
      }

      return {
        id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${idx}`,
        no: slot.no,
        subOrg: slot.subOrg,
        jabatan: slot.jabatan,
        namaLengkap: '',
        nik: '',
        nomorEKTA: '',
        email: '',
        nomorHP: '',
        sosmed: '',
        isExisting: false,
      };
    });

    // Anggota ekstra/tambahan dari database yang belum masuk ke slot standar template
    matchedMembers.forEach((m) => {
      if (!assignedMemberNiks.has(m.nik)) {
        const jLower = m.jabatan?.toLowerCase() || '';
        const wLower = m.wilayahPenugasan?.toLowerCase() || '';
        let detectedSubOrg = m.wilayahPenugasan;
        if (!detectedSubOrg) {
          if (level === 'DPD') {
            if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) {
              detectedSubOrg = 'I. DEWAN PERTIMBANGAN';
            } else if (jLower.includes('pakar') || wLower.includes('pakar')) {
              detectedSubOrg = 'II. DEWAN PAKAR';
            } else {
              detectedSubOrg = 'III. DEWAN PIMPINAN DAERAH';
            }
          } else if (level === 'DPC') {
            if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) {
              detectedSubOrg = 'I. DEWAN PERTIMBANGAN';
            } else if (jLower.includes('pakar') || wLower.includes('pakar')) {
              detectedSubOrg = 'II. DEWAN PAKAR';
            } else {
              detectedSubOrg = 'III. DEWAN PIMPINAN CABANG';
            }
          } else if (level === 'DPW') {
            if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) {
              detectedSubOrg = 'DEWAN PERTIMBANGAN WILAYAH';
            } else if (jLower.includes('pakar') || wLower.includes('pakar')) {
              detectedSubOrg = 'DEWAN PAKAR WILAYAH';
            } else {
              detectedSubOrg = 'DEWAN PIMPINAN WILAYAH';
            }
          } else {
            detectedSubOrg = 'DEWAN PIMPINAN RANTING';
          }
        }

        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: rows.filter((r) => r.subOrg === detectedSubOrg).length + 1,
          subOrg: detectedSubOrg,
          jabatan: m.jabatan,
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      }
    });

    setGridRows(rows);
  };

  useEffect(() => {
    buildMatrixRows();
    setIsEditMode(false);
    setSaveSuccessMsg(null);
  }, [level, selectedDpd, selectedDpc, selectedDprt, members]);

  // Handle Input Changes
  const handleCellChange = (id: string, field: keyof GridRowItem, value: string) => {
    setGridRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Add new dynamic row
  const handleAddNewRow = (targetSubOrg?: string) => {
    const defaultSubOrg =
      targetSubOrg ||
      (level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : `DEWAN PIMPINAN ${level}`);

    const newId = `new_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: GridRowItem = {
      id: newId,
      no: gridRows.filter((r) => r.subOrg === defaultSubOrg).length + 1,
      subOrg: defaultSubOrg,
      jabatan: defaultSubOrg.includes('PERTIMBANGAN')
        ? 'Anggota Dewan Pertimbangan'
        : defaultSubOrg.includes('PAKAR')
        ? 'Anggota Dewan Pakar'
        : 'Pengurus Tambahan / Anggota',
      namaLengkap: '',
      nik: '',
      nomorEKTA: '',
      email: '',
      nomorHP: '',
      sosmed: '',
      isExisting: false,
    };
    setGridRows((prev) => [...prev, newRow]);
    setIsEditMode(true);
  };

  // Delete dynamic row
  const handleDeleteRow = (id: string) => {
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Save changes to database
  const handleSaveToDatabase = () => {
    const territoryDpd = level === 'DPW' ? 'Sulawesi Utara' : selectedDpd;
    const territoryDpc =
      level === 'DPW'
        ? 'Wilayah DPW'
        : level === 'DPD'
        ? 'Umum (DPD)'
        : selectedDpc;
    const territoryDprt = level === 'DPRt' ? selectedDprt : 'Pusat/Umum';

    const updatedMembersList: Member[] = [];

    gridRows.forEach((row, idx) => {
      const nama = row.namaLengkap.trim();
      if (!nama) return;

      let nikClean = row.nik.replace(/[^0-9]/g, '').trim();
      if (!nikClean || nikClean.length < 10) {
        nikClean = `71002026${String(10000000 + idx).slice(-8)}`;
      }

      const existingMember = members.find(
        (m) => m.nik === row.originalNik || m.nik === nikClean
      );

      const updatedMember: Member = {
        ...(existingMember || {}),
        nik: nikClean,
        nomorEKTA: row.nomorEKTA.trim() || nikClean,
        namaLengkap: nama,
        email: row.email?.trim() || undefined,
        nomorHP: row.nomorHP.trim() || '-',
        sosmed: row.sosmed?.trim() || undefined,
        dpd: territoryDpd,
        dpc: territoryDpc,
        dprt: territoryDprt,
        isPengurus: true,
        tingkatKepengurusan: level,
        wilayahPenugasan: row.subOrg,
        jabatan: row.jabatan.trim() || 'Pengurus',
        status: existingMember?.status || 'Aktif',
        statusKtpVerified: true,
        tanggalBergabung:
          existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session?.adminName || 'Admin Matriks Organisasi',
      };

      updatedMembersList.push(updatedMember);
    });

    onSaveMembersBatch(updatedMembersList);
    setSaveSuccessMsg(
      `Berhasil menyimpan ${updatedMembersList.length} data pengurus ke database!`
    );
    setIsEditMode(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Export to Excel
  const handleExportTemplateExcel = () => {
    const territoryName =
      level === 'DPW'
        ? 'DPW_SULUT'
        : level === 'DPD'
        ? selectedDpd.replace(/\s+/g, '_')
        : level === 'DPC'
        ? `${selectedDpd}_${selectedDpc}`.replace(/\s+/g, '_')
        : `${selectedDpd}_${selectedDpc}_${selectedDprt}`.replace(/\s+/g, '_');

    const exportData = gridRows.map((r, i) => ({
      No: i + 1,
      'Sub Organisasi': r.subOrg,
      'Jabatan Pengurus': r.jabatan,
      'Nama Lengkap (Sesuai KTP)': r.namaLengkap,
      'No. NIK': r.nik,
      'E-KTA NasDem': r.nomorEKTA,
      Email: r.email,
      'No Telepon': r.nomorHP,
      'Sosial Media': r.sosmed,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Susunan Pengurus');
    XLSX.writeFile(wb, `SUSUNAN_PENGURUS_${level}_${territoryName}.xlsx`);
  };

  // Import from Excel file
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (data.length <= 1) return;

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const rowStr = (data[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('jabatan') || rowStr.includes('nama')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = (data[headerRowIdx] || []).map((h: any) =>
          String(h || '').toLowerCase().trim()
        );
        const colJabatan = headers.findIndex((h: string) => h.includes('jabatan'));
        const colNama = headers.findIndex((h: string) => h.includes('nama'));
        const colNik = headers.findIndex((h: string) => h.includes('nik'));
        const colEkta = headers.findIndex((h: string) => h.includes('kta') || h.includes('ekta'));
        const colEmail = headers.findIndex((h: string) => h.includes('email'));
        const colHp = headers.findIndex((h: string) =>
          h.includes('telepon') || h.includes('hp') || h.includes('wa')
        );
        const colSosmed = headers.findIndex((h: string) =>
          h.includes('sosmed') || h.includes('sosial')
        );

        const importedRows: GridRowItem[] = [];
        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const jabatan = colJabatan !== -1 ? String(row[colJabatan] || '').trim() : '';
          const nama = colNama !== -1 ? String(row[colNama] || '').trim() : '';
          const nik = colNik !== -1 ? String(row[colNik] || '').trim() : '';
          const ekta = colEkta !== -1 ? String(row[colEkta] || '').trim() : '';
          const email = colEmail !== -1 ? String(row[colEmail] || '').trim() : '';
          const hp = colHp !== -1 ? String(row[colHp] || '').trim() : '';
          const sosmed = colSosmed !== -1 ? String(row[colSosmed] || '').trim() : '';

          if (nama || jabatan) {
            importedRows.push({
              id: `imported_${i}_${Date.now()}`,
              no: importedRows.length + 1,
              subOrg: level === 'DPD' ? 'III. DEWAN PIMPINAN DAERAH' : `DEWAN PIMPINAN ${level}`,
              jabatan: jabatan || 'Pengurus',
              namaLengkap: nama,
              nik,
              nomorEKTA: ekta,
              email,
              nomorHP: hp,
              sosmed,
              isExisting: false,
            });
          }
        }

        if (importedRows.length > 0) {
          setGridRows(importedRows);
          setIsEditMode(true);
          setSaveSuccessMsg(
            `Berhasil membaca ${importedRows.length} baris dari berkas Excel. Silakan periksa & klik Simpan!`
          );
        }
      } catch (err) {
        console.error('Failed to parse excel:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Metrics
  const totalRows = gridRows.length;
  const filledCount = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const emptyCount = totalRows - filledCount;
  const completionPercentage = totalRows > 0 ? Math.round((filledCount / totalRows) * 100) : 0;

  // Filtered rows for display
  const displayRows = useMemo(() => {
    return gridRows.filter((r) => {
      // Status filter
      const isFilled = r.namaLengkap.trim() !== '';
      if (statusFilter === 'filled' && !isFilled) return false;
      if (statusFilter === 'empty' && isFilled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.jabatan.toLowerCase().includes(q) ||
          r.namaLengkap.toLowerCase().includes(q) ||
          r.nik.toLowerCase().includes(q) ||
          r.nomorEKTA.toLowerCase().includes(q) ||
          r.subOrg.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [gridRows, statusFilter, searchQuery]);

  const getOfficialTitle = () => {
    if (level === 'DPW') {
      return {
        line1: 'SUSUNAN PENGURUS DPW PARTAI NASDEM',
        line2: 'PROVINSI SULAWESI UTARA',
      };
    }
    if (level === 'DPD') {
      return {
        line1: 'SUSUNAN PENGURUS DPD PARTAI NASDEM',
        line2: `${selectedDpd.toUpperCase()} PROVINSI SULAWESI UTARA`,
      };
    }
    if (level === 'DPC') {
      return {
        line1: 'SUSUNAN PENGURUS DPC PARTAI NASDEM',
        line2: `KECAMATAN ${selectedDpc.toUpperCase()} - ${selectedDpd.toUpperCase()}`,
      };
    }
    return {
      line1: 'SUSUNAN PENGURUS DPRt PARTAI NASDEM',
      line2: `DESA/KELURAHAN ${selectedDprt.toUpperCase()} - KEC. ${selectedDpc.toUpperCase()}`,
    };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Banner & Territory Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                {level === 'DPW' && <Building2 className="w-3 h-3 text-blue-600" />}
                {level === 'DPD' && <Building className="w-3 h-3 text-blue-600" />}
                {level === 'DPC' && <MapPin className="w-3 h-3 text-blue-600" />}
                {level === 'DPRt' && <Home className="w-3 h-3 text-blue-600" />}
                <span>STRUKTUR TINGKAT {level}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Partai NasDem Sulawesi Utara
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {level === 'DPW' && 'Pengurus DPW Sulawesi Utara'}
              {level === 'DPD' && `Pengurus DPD ${selectedDpd}`}
              {level === 'DPC' && `Pengurus DPC Kec. ${selectedDpc}`}
              {level === 'DPRt' && `Pengurus DPRt Desa/Kel. ${selectedDprt}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {level === 'DPW' && 'Struktur resmi DPW terdiri dari 70 jabatan: Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Wilayah.'}
              {level === 'DPD' && `Struktur resmi DPD terdiri dari 44 jabatan kuota standar (Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Daerah).`}
              {level === 'DPC' && `Struktur resmi DPC terdiri dari 25 jabatan kuota standar di wilayah ${selectedDpd}.`}
              {level === 'DPRt' && `Struktur resmi DPRt terdiri dari 9 jabatan inti ranting desa/kelurahan di Kec. ${selectedDpc}.`}
            </p>
          </div>

          {/* Territory Selectors (Clean & Responsive) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {level !== 'DPW' && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPD
                  </span>
                  <select
                    value={selectedDpd}
                    onChange={(e) => {
                      const newDpd = e.target.value;
                      setSelectedDpd(newDpd);
                      const reg = SULUT_REGIONS.find((r) => r.name === newDpd);
                      if (reg && reg.subdistricts.length > 0) {
                        setSelectedDpc(reg.subdistricts[0].name);
                        setSelectedDprt(reg.subdistricts[0].villages[0] || 'Pusat');
                      }
                    }}
                    className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {SULUT_REGIONS.map((r) => (
                      <option key={r.id} value={r.name} className="dark:bg-slate-900">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(level === 'DPC' || level === 'DPRt') && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPC (Kecamatan)
                  </span>
                  <select
                    value={selectedDpc}
                    onChange={(e) => {
                      const newDpc = e.target.value;
                      setSelectedDpc(newDpc);
                      const sub = currentRegion?.subdistricts.find((s) => s.name === newDpc);
                      if (sub && sub.villages.length > 0) {
                        setSelectedDprt(sub.villages[0]);
                      }
                    }}
                    className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {(currentRegion?.subdistricts || []).map((s) => (
                      <option key={s.name} value={s.name} className="dark:bg-slate-900">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {level === 'DPRt' && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Home className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPRt (Desa/Kel.)
                  </span>
                  <select
                    value={selectedDprt}
                    onChange={(e) => setSelectedDprt(e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {(currentSubdistrict?.villages || []).map((v) => (
                      <option key={v} value={v} className="dark:bg-slate-900">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Progress & Metrics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tingkat Keterisian
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {completionPercentage}%
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    completionPercentage >= 100
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {completionPercentage >= 100 ? 'Lengkap' : 'Belum Lengkap'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jabatan Terisi
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {filledCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  dari {totalRows} posisi kuota
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jabatan Kosong / Tersisa
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {emptyCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {emptyCount === 0 ? 'Semua posisi terisi' : 'perlu diisi kader'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              completionPercentage >= 100
                ? 'bg-emerald-500'
                : completionPercentage >= 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(2, Math.min(completionPercentage, 100))}%` }}
          />
        </div>
      </div>

      {/* 3. Interactive Toolbar & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengurus, jabatan, NIK, atau no KTA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Semua ({totalRows})
            </button>
            <button
              onClick={() => setStatusFilter('filled')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'filled'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Terisi ({filledCount})
            </button>
            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'empty'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Kosong ({emptyCount})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {isEditMode ? (
            <>
              <button
                onClick={() => handleAddNewRow()}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer text-blue-600 dark:text-blue-400"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Baris</span>
              </button>
              <button
                onClick={handleSaveToDatabase}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
              <button
                onClick={() => {
                  buildMatrixRows();
                  setIsEditMode(false);
                }}
                className="btn-white px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mode Edit</span>
            </button>
          )}

          <button
            onClick={handleDownloadTemplateExcel}
            title={`Download Template Input Excel Khusus ${level} (Daftar Jabatan Resmi Sudah Terisi Otomatis)`}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import Susunan Pengurus dari Excel (Pra-tinjau & Validasi Otomatis)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            title="Cetak Berkas Susunan Pengurus Resmi (Format Cetak / PDF dengan Kop Surat & Logo Resmi)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportTemplateExcel}
            title="Export Data Susunan Pengurus Saat Ini (.xlsx)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Ekspor Data</span>
          </button>
        </div>
      </div>

      {/* 4. Matrix Tables Rendering */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <MatrixTableSheet
          gridRows={displayRows}
          isEditMode={isEditMode}
          officialTitle={getOfficialTitle()}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
          onAddNewRowForSubOrg={handleAddNewRow}
        />
      </div>

      {/* 5. Modal Import / Export Excel Teritorial Khusus */}
      <TerritorialImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        territoryContext={territoryContext}
        currentRows={gridRows}
        currentMembers={members}
        session={session}
        onSaveMembersBatch={onSaveMembersBatch}
      />

      {/* 6. Modal Cetak Dokumen Resmi Susunan Pengurus */}
      <TerritorialStructurePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        level={level}
        dpd={selectedDpd}
        dpc={selectedDpc}
        dprt={selectedDprt}
        gridRows={gridRows}
        session={session}
      />
    </div>
  );
};
export default TerritorialStructurePage;
