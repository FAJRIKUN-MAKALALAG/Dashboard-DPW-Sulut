import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { getStructureTemplate, PositionSlot } from '../data/structureTemplates';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import * as XLSX from 'xlsx';
import {
  MatrixHeaderControl,
  MatrixToolbar,
  MatrixTableSheet,
  GridRowItem,
} from './matrix';

export type { GridRowItem };

interface TerritorialMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[]) => void;
  initialDpd?: string;
  initialDpc?: string;
}

export const TerritorialMatrixModal: React.FC<TerritorialMatrixModalProps> = ({
  isOpen,
  onClose,
  members,
  session,
  onSaveMembersBatch,
  initialDpd,
  initialDpc,
}) => {
  // Level & Territory Selector State
  const [tingkat, setTingkat] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt'>(() => {
    if (initialDpc) return 'DPC';
    if (initialDpd && initialDpd !== 'Sulawesi Utara' && initialDpd !== 'ALL') return 'DPD';
    return 'DPD';
  });

  const [selectedDpd, setSelectedDpd] = useState<string>(() => {
    if (initialDpd && initialDpd !== 'ALL') return initialDpd;
    return 'Kabupaten Minahasa Selatan';
  });

  useEffect(() => {
    if (initialDpd && initialDpd !== 'ALL') {
      setSelectedDpd(initialDpd);
      setTingkat('DPD');
    }
    if (initialDpc) {
      setSelectedDpc(initialDpc);
      setTingkat('DPC');
    }
  }, [initialDpd, initialDpc]);

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
    return currentSubdistrict?.villages[0] || 'Pusat';
  });

  // Table Edit Mode & Message
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Rows state for table editing
  const [gridRows, setGridRows] = useState<GridRowItem[]>([]);

  // Build matrix whenever territory changes
  const buildMatrixRows = () => {
    const template = getStructureTemplate(tingkat);

    // Filter existing members in this territory and level with strict hierarchical separation
    let matchedMembers: Member[] = [];
    if (tingkat === 'DPW') {
      matchedMembers = members.filter(
        (m) => m.tingkatKepengurusan === 'DPW' || m.dpd === 'Sulawesi Utara'
      );
    } else if (tingkat === 'DPD') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          (m.tingkatKepengurusan === 'DPD' ||
            m.dpc === 'Umum (DPD)' ||
            m.dpc === 'Wilayah DPD' ||
            (!m.tingkatKepengurusan && (m.dpc === 'Umum (DPD)' || m.dpc === 'Wilayah DPD')) ||
            (m.isPengurus && (!m.dpc || m.dpc === 'Wilayah DPD' || m.dpc === 'Umum (DPD)')))
      );
    } else if (tingkat === 'DPC') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          isDpcMatch(m.dpc, selectedDpc) &&
          (m.tingkatKepengurusan === 'DPC' ||
            (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD'))
      );
    } else if (tingkat === 'DPRt') {
      matchedMembers = members.filter(
        (m) =>
          isDpdMatch(m.dpd, selectedDpd) &&
          isDpcMatch(m.dpc, selectedDpc) &&
          isDprtMatch(m.dprt, selectedDprt) &&
          (m.tingkatKepengurusan === 'DPRt' || m.isPengurus)
      );
    }

    // Normalizer helper
    const cleanStr = (s: string) =>
      s
        .toLowerCase()
        .replace(/bidang/g, 'bid')
        .replace(/usaha mikro kecil dan menengah/g, 'umkm')
        .replace(/&/g, 'dan')
        .replace(/[^a-z0-9]/g, '');

    const assignedMemberNiks = new Set<string>();

    const rows: GridRowItem[] = template.map((slot: PositionSlot, idx: number) => {
      const slotClean = cleanStr(slot.jabatan);
      const isSlotPertimbangan = slot.subOrg.toLowerCase().includes('pertimbangan');
      const isSlotPakar = slot.subOrg.toLowerCase().includes('pakar');
      const isSlotPimpinan = !isSlotPertimbangan && !isSlotPakar;

      // Filter anggota yang relevan dengan sub-organisasi (Pertimbangan vs Pakar vs Pimpinan)
      const relevantMembers = matchedMembers.filter((m) => {
        if (assignedMemberNiks.has(m.nik)) return false;
        const jLower = m.jabatan?.toLowerCase() || '';
        const wLower = m.wilayahPenugasan?.toLowerCase() || '';
        const isMemPertimbangan = jLower.includes('pertimbangan') || wLower.includes('pertimbangan');
        const isMemPakar = jLower.includes('pakar') || wLower.includes('pakar');

        if (isSlotPertimbangan) return isMemPertimbangan;
        if (isSlotPakar) return isMemPakar;
        if (isSlotPimpinan) return !isMemPertimbangan && !isMemPakar;
        return true;
      });

      let assignedMember = relevantMembers.find(
        (m) => cleanStr(m.jabatan) === slotClean
      );

      if (!assignedMember && slotClean.includes('ketua')) {
        assignedMember = relevantMembers.find(
          (m) =>
            cleanStr(m.jabatan).startsWith('ketua') &&
            !cleanStr(m.jabatan).includes('wakil')
        );
      }
      if (!assignedMember && slotClean.includes('sekretaris')) {
        assignedMember = relevantMembers.find(
          (m) =>
            cleanStr(m.jabatan).startsWith('sekretaris') &&
            !cleanStr(m.jabatan).includes('wakil')
        );
      }
      if (!assignedMember && slotClean.includes('bendahara')) {
        assignedMember = relevantMembers.find(
          (m) =>
            cleanStr(m.jabatan).startsWith('bendahara') &&
            !cleanStr(m.jabatan).includes('wakil')
        );
      }

      if (assignedMember) {
        assignedMemberNiks.add(assignedMember.nik);
        return {
          id: assignedMember.nik,
          no: slot.no,
          subOrg: slot.subOrg,
          jabatan: assignedMember.jabatan || slot.jabatan,
          namaLengkap: assignedMember.namaLengkap,
          nik: assignedMember.nik,
          nomorEKTA: assignedMember.nomorEKTA || '',
          email: assignedMember.email || '',
          nomorHP: assignedMember.nomorHP || '',
          sosmed: assignedMember.sosmed || '',
          isExisting: true,
          originalNik: assignedMember.nik,
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

    // Masukkan anggota ekstra yang belum masuk ke slot standar
    matchedMembers.forEach((m) => {
      if (!assignedMemberNiks.has(m.nik)) {
        const jLower = m.jabatan?.toLowerCase() || '';
        const wLower = m.wilayahPenugasan?.toLowerCase() || '';
        let detectedSubOrg = m.wilayahPenugasan;
        if (!detectedSubOrg) {
          if (tingkat === 'DPD') {
            if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) {
              detectedSubOrg = 'I. DEWAN PERTIMBANGAN';
            } else if (jLower.includes('pakar') || wLower.includes('pakar')) {
              detectedSubOrg = 'II. DEWAN PAKAR';
            } else {
              detectedSubOrg = 'III. DEWAN PIMPINAN DAERAH';
            }
          } else if (tingkat === 'DPC') {
            if (jLower.includes('pertimbangan') || wLower.includes('pertimbangan')) {
              detectedSubOrg = 'I. DEWAN PERTIMBANGAN';
            } else if (jLower.includes('pakar') || wLower.includes('pakar')) {
              detectedSubOrg = 'II. DEWAN PAKAR';
            } else {
              detectedSubOrg = 'III. DEWAN PIMPINAN CABANG';
            }
          } else {
            detectedSubOrg = tingkat;
          }
        }

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
    if (isOpen) {
      buildMatrixRows();
      setIsEditMode(false);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, tingkat, selectedDpd, selectedDpc, selectedDprt, members]);

  if (!isOpen) return null;

  // Handle Input Changes
  const handleCellChange = (id: string, field: keyof GridRowItem, value: string) => {
    setGridRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Add new dynamic row with optional subOrg target
  const handleAddNewRow = (targetSubOrg?: string) => {
    const defaultSubOrg =
      targetSubOrg ||
      (tingkat === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : tingkat === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : tingkat === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : `DEWAN PIMPINAN ${tingkat}`);

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
    const territoryDpd = tingkat === 'DPW' ? 'Sulawesi Utara' : selectedDpd;
    const territoryDpc =
      tingkat === 'DPW'
        ? 'Wilayah DPW'
        : tingkat === 'DPD'
        ? 'Umum (DPD)'
        : selectedDpc;
    const territoryDprt = tingkat === 'DPRt' ? selectedDprt : 'Pusat/Umum';

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
        tingkatKepengurusan: tingkat,
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
      `Berhasil menyimpan ${updatedMembersList.length} data pengurus teritorial ke database!`
    );
    setIsEditMode(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Export Template Excel with pre-filled structure
  const handleExportTemplateExcel = () => {
    const territoryName =
      tingkat === 'DPW'
        ? 'DPW_SULUT'
        : tingkat === 'DPD'
        ? selectedDpd.replace(/\s+/g, '_')
        : `${selectedDpd}_${selectedDpc}`.replace(/\s+/g, '_');

    const exportData = gridRows.map((r, i) => ({
      No: i + 1,
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
    XLSX.writeFile(wb, `SUSUNAN_PENGURUS_${tingkat}_${territoryName}.xlsx`);
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
              subOrg: tingkat === 'DPD' ? 'DPD' : `DEWAN PIMPINAN ${tingkat}`,
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

  const filledCount = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;

  const getOfficialTitle = () => {
    if (tingkat === 'DPW') {
      return {
        line1: 'SUSUNAN PENGURUS DPW PARTAI NASDEM',
        line2: 'PROVINSI SULAWESI UTARA',
      };
    }
    if (tingkat === 'DPD') {
      return {
        line1: 'SUSUNAN PENGURUS DPD PARTAI NASDEM',
        line2: `${selectedDpd.toUpperCase()} PROVINSI SULAWESI UTARA`,
      };
    }
    if (tingkat === 'DPC') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[96vw] xl:max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* 1. Header Control: Level & Territory Switchers */}
        <MatrixHeaderControl
          tingkat={tingkat}
          setTingkat={setTingkat}
          selectedDpd={selectedDpd}
          setSelectedDpd={setSelectedDpd}
          selectedDpc={selectedDpc}
          setSelectedDpc={setSelectedDpc}
          selectedDprt={selectedDprt}
          setSelectedDprt={setSelectedDprt}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          onSaveToDatabase={handleSaveToDatabase}
          onClose={onClose}
        />

        {/* 2. Toolbar: Progress, Add Row, Import/Export Excel */}
        <MatrixToolbar
          filledCount={filledCount}
          totalRows={gridRows.length}
          isEditMode={isEditMode}
          saveSuccessMsg={saveSuccessMsg}
          onAddNewRow={handleAddNewRow}
          onExportTemplateExcel={handleExportTemplateExcel}
          onImportExcel={handleImportExcel}
        />

        {/* 3. Authentic Table Sheet (8 Exact Columns, Separate Tables for Dewan Pertimbangan, Dewan Pakar & Dewan Pimpinan) */}
        <MatrixTableSheet
          gridRows={gridRows}
          isEditMode={isEditMode}
          officialTitle={getOfficialTitle()}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
          onAddNewRowForSubOrg={handleAddNewRow}
        />
      </div>
    </div>
  );
};
export default TerritorialMatrixModal;
